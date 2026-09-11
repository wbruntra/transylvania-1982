import { describeRoom } from "../describe.js";
import { MESSAGES } from "../messages.js";

/**
 * Bare LOOK describes the room. LOOK <thing> is answered by rules.js, which
 * runs first; reaching here with a noun means nothing matched, which prints
 * "YOU SEE NOTHING UNUSUAL." (TRANS.bas:1599).
 *
 * @type {import("./index.js").CommandHandler}
 */
export function look({ world, state, command }) {
  if (command.noun) return [MESSAGES.nothingUnusual];
  return describeRoom(world, state);
}
