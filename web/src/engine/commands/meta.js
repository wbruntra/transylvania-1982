// Meta commands: HELP (4200), QUIT/END (30040), SAVE (25000), RESTORE (line 50).

import { describeRoom } from "../describe.js";
import { MESSAGES } from "../messages.js";
import { deserializeState, serializeState } from "../state.js";

const SAVE_KEY = "transylvania_savegame";

/** @type {import("./index.js").CommandHandler} */
export function help({ command }) {
  // 4200 IF NOT X THEN PRINT "HAVE YOU INSPECTED EVERYTHING?": GOTO 1000
  if (!command.X && !command.noun) {
    return {
      messages: ["HAVE YOU INSPECTED EVERYTHING?"],
      consumeTurn: false,
    };
  }
  // 4210 GOTO 240
  return [MESSAGES.cant];
}

/** @type {import("./index.js").CommandHandler} */
export function quit({ state }) {
  state.isGameOver = true;
  state.gameOverReason = "quit";
  state.gameOverDetails =
    "You abandoned your quest, leaving Transylvania and Princess Sabrina to their dark fates.";
  return ["PRESS ANY KEY TO RESTART THE GAME."];
}

/** @type {import("./index.js").CommandHandler} */
export function saveGame({ state }) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SAVE_KEY, serializeState(state));
    }
  } catch {
    // Ignore quota or unavailable localStorage in headless/tests
  }
  return ["SAVED."];
}

/** @type {import("./index.js").CommandHandler} */
export function restoreGame({ world, state }) {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const restored = deserializeState(saved);
        Object.assign(state, restored);
        return ["RESTORED.", ...describeRoom(world, state)];
      }
    }
  } catch {
    // Ignore
  }
  return ["NO SAVED GAME FOUND."];
}

/** @type {import("./index.js").CommandHandler} */
export function mapCommand({ state }) {
  const count = state.visitedRooms ? state.visitedRooms.length : 1;
  return {
    messages: [`YOU CONSULT YOUR MAP. [${count} OF 37 AREAS CHARTED]`],
    consumeTurn: false,
  };
}


