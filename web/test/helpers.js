// Test rig: builds an engine from the real game data, with no DOM anywhere.

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateGameData } from "../src/data/gameData.js";
import { createEngine } from "../src/engine/engine.js";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** @returns {Promise<import("../src/data/gameData.js").GameData>} */
export async function loadGameData() {
  const raw = await readFile(resolve(webRoot, "public/game.json"), "utf8");
  return validateGameData(JSON.parse(raw));
}

/**
 * An engine plus a `run` helper that returns the printed lines for a command.
 */
export async function createTestEngine() {
  const engine = createEngine(await loadGameData());
  return {
    ...engine,
    /** @param {string} input @returns {string[]} */
    run(input) {
      return engine.execute(input).messages;
    },
    /** @param {string[]} inputs @returns {string[]} lines from the last command */
    runAll(inputs) {
      let last = [];
      for (const input of inputs) last = engine.execute(input).messages;
      return last;
    },
  };
}
