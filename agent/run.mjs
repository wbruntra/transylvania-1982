#!/usr/bin/env node
// Drives the real web UI (localhost:8099/?agent=1) with an LLM over OpenRouter.
//
// The browser is the source of truth: it runs the actual engine and renders
// the actual scene art / map, so you can watch it play. This script is just
// the "brain" -- it polls a tiny local HTTP bridge for the browser to pick up
// commands from, asks the model what to do next, and logs the whole run.
//
// Usage:
//   npm run dev            (in web/, in another terminal)
//   node agent/run.mjs
//   open http://localhost:8099/?agent=1   (in your browser)
//
// Flags: --turns=30 --model=inception/mercury-2.5 --port=8787

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync, createWriteStream } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const m = /^--([^=]+)=(.*)$/.exec(arg);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
const MAX_TURNS = Number(args.turns ?? 30);
const MODEL = args.model ?? "inception/mercury-2.5";
const PORT = Number(args.port ?? 8787);

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
  console.error("OPENROUTER_API_KEY not set (checked process.env and .env)");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Bridge: a tiny HTTP server the browser page polls for commands to run and
// posts results back to. See web/src/ui/agentBridge.js for the client half.
// ---------------------------------------------------------------------------

function startBridge(port) {
  let pending = null; // { id, text }
  const resolvers = new Map(); // id -> { resolve, reject, timer }
  let helloResolve;
  const helloPromise = new Promise((resolve) => { helloResolve = resolve; });

  function readBody(req) {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => resolve(body ? JSON.parse(body) : {}));
    });
  }

  const server = createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    if (req.method === "GET" && req.url === "/next") {
      const job = pending;
      pending = null;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(job ?? { id: null }));
      return;
    }

    if (req.method === "POST" && req.url === "/hello") {
      const body = await readBody(req);
      helloResolve(body);
      res.writeHead(200); res.end("ok");
      return;
    }

    if (req.method === "POST" && req.url === "/result") {
      const body = await readBody(req);
      const entry = resolvers.get(body.id);
      if (entry) {
        clearTimeout(entry.timer);
        resolvers.delete(body.id);
        entry.resolve(body);
      }
      res.writeHead(200); res.end("ok");
      return;
    }

    res.writeHead(404); res.end();
  });

  server.listen(port);

  return {
    waitForHello: () => helloPromise,
    sendCommand(text, timeoutMs = 20000) {
      const id = randomUUID();
      pending = { id, text };
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          resolvers.delete(id);
          reject(new Error(`browser did not respond to "${text}" within ${timeoutMs}ms`));
        }, timeoutMs);
        resolvers.set(id, { resolve, reject, timer });
      });
    },
    close: () => server.close(),
  };
}

// ---------------------------------------------------------------------------
// OpenRouter
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are playing Transylvania, a 1982 text adventure by Penguin Software. \
You are a werewolf hunter exploring a forest, searching for a way to rescue Sabrina \
from a vampire before you turn into a werewolf yourself or he turns her into a vampire.

The parser understands short two-to-three-word commands: a verb and, often, a noun. \
Examples: "look", "go north", "go south", "go up", "go down", "take note", "get pick", \
"open door", "read gravestone", "inventory", "wave cross", "unlock door with key", \
"drop cloak", "wear cloak", "shoot werewolf", "listen". Directions can also be given bare: \
"north", "n", "up". Prefer the shortest command that expresses your intent.

Explore methodically, read everything, pick up useful items, and pay close attention to \
warnings -- some actions can kill you or doom the game. Do not repeat a command that just \
failed or produced no new information; try something different instead.

Think out loud about the situation and your options, as much as you like. When you've \
decided, end your reply with one line in exactly this form, and nothing after it:
COMMAND: <the command to type>`;

async function askModel(transcript) {
  const userPrompt = transcript.length === 0
    ? "The game has just started. What is your first command?"
    : `TRANSCRIPT SO FAR:\n\n${transcript.join("\n\n")}\n\nWhat is your next command?`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "X-Title": "Transylvania LLM playtest",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      // mercury is a reasoning model -- most of this budget goes to hidden
      // reasoning tokens before it emits the actual JSON reply. It's cheap
      // (~$0.0001-0.0002/turn even at this ceiling), so leave it room to think.
      max_tokens: 1500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return parseModelReply(content);
}

function parseModelReply(content) {
  const lines = content.trim().split("\n").map((l) => l.trim());
  // Search from the end: the model may keep reasoning after a false start,
  // so the LAST "COMMAND: ..." line is the one that counts.
  for (let i = lines.length - 1; i >= 0; i--) {
    const match = /^command\s*:\s*(.+)$/i.exec(lines[i]);
    if (match) {
      const thought = lines.slice(0, i).filter(Boolean).join(" ");
      return { thought, command: match[1].trim().replace(/^["'`]|["'`]$/g, "") };
    }
  }
  // Fallback: no "COMMAND:" line found -- treat the last non-empty line as
  // the command, since the model usually still ends with its intent.
  const nonEmpty = lines.filter(Boolean);
  return {
    thought: nonEmpty.slice(0, -1).join(" "),
    command: nonEmpty.at(-1) ?? "look",
  };
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function main() {
  const logDir = path.join(ROOT, "agent", "logs");
  mkdirSync(logDir, { recursive: true });
  const jsonPath = path.join(logDir, `run-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  const latestJsonPath = path.join(logDir, "latest.json");
  const latestLogPath = path.join(logDir, "latest.log");
  // Overwritten every run, so "latest.log" always shows the most recent
  // attempt while iterating -- no need to hunt for the timestamped file.
  const logStream = createWriteStream(latestLogPath, { flags: "w" });
  function log(line = "") {
    console.log(line);
    logStream.write(`${line}\n`);
  }

  const bridge = startBridge(PORT);
  log(`Bridge listening on http://localhost:${PORT}`);
  log(`Open http://localhost:8099/?agent=1&agentPort=${PORT} in your browser to watch.`);
  log("Waiting for the browser tab to connect...\n");

  const hello = await bridge.waitForHello();
  log("Browser connected. Starting run.\n");

  const transcript = [];
  const records = [];
  if (hello.log) transcript.push(hello.log.trim());

  function saveRecords() {
    const json = JSON.stringify(records, null, 2);
    writeFileSync(jsonPath, json);
    writeFileSync(latestJsonPath, json);
  }

  let consecutiveFailures = 0;

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    let thought = "", command = "";
    try {
      ({ thought, command } = await askModel(transcript));
    } catch (err) {
      log(`[turn ${turn}] model call failed: ${err.message}`);
      break;
    }

    log(`--- turn ${turn}/${MAX_TURNS} ---`);
    if (thought) log(`thought: ${thought}`);
    log(`> ${command}`);

    let result;
    try {
      result = await bridge.sendCommand(command);
    } catch (err) {
      log(`[turn ${turn}] ${err.message}`);
      records.push({ turn, thought, command, error: err.message });
      saveRecords();
      consecutiveFailures++;
      if (consecutiveFailures >= 3) {
        log("Browser stopped responding three times in a row -- stopping.");
        break;
      }
      continue;
    }
    consecutiveFailures = 0;

    log(result.output);
    log("");

    transcript.push(`> ${command}\n${result.output}`);
    records.push({ turn, thought, command, output: result.output, room: result.room, turns: result.turns });
    saveRecords();

    if (result.isGameOver) {
      log(`Game over after ${turn} turns.`);
      break;
    }
  }

  log(`\nTranscript saved to ${path.relative(ROOT, jsonPath)} (and latest.json / latest.log)`);
  logStream.end();
  bridge.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
