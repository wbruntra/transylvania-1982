// Lets an external CLI script drive this page's real UI (art, map, transcript)
// as if a human were typing commands. Activated with ?agent=1 on the URL so it
// never runs during normal play. Talks to a small local HTTP bridge (see
// agent/run.mjs) by polling for the next queued command and posting back what
// the transcript log printed in response.
//
// Deliberately polling, not WebSocket: it's a local-only experiment and this
// needs zero extra dependencies on either end.

/**
 * @param {{engine: import("../engine/engine.js").ReturnType, handleCommand: (input: string) => void}} deps
 */
export function connectAgentBridge({ engine, handleCommand }) {
  const params = new URLSearchParams(location.search);
  if (params.get("agent") !== "1") return;

  const port = params.get("agentPort") || "8787";
  const base = `http://${location.hostname}:${port}`;
  const log = document.getElementById("log");

  let helloSent = false;

  async function sendHello() {
    try {
      await fetch(`${base}/hello`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log: log ? log.textContent : "" }),
      });
      helloSent = true;
    } catch {
      // Bridge not up yet -- keep polling from poll().
    }
  }

  async function poll() {
    if (!helloSent) await sendHello();
    try {
      const res = await fetch(`${base}/next`);
      const job = await res.json();
      if (job && job.id) {
        const before = log ? log.textContent.length : 0;
        handleCommand(job.text);
        const output = log ? log.textContent.slice(before).trim() : "";
        await fetch(`${base}/result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: job.id,
            output,
            room: engine.state.room,
            turns: engine.state.turns,
            isGameOver: engine.isGameOver(),
          }),
        });
      }
    } catch {
      // Bridge unreachable this tick -- try again next tick.
    }
    setTimeout(poll, 400);
  }

  poll();
  console.info(`[agent] bridge armed, polling ${base}`);
}
