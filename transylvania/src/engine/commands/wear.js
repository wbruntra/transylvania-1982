// WEAR command handler.
// TRANS.bas:4400-4410

import { MESSAGES } from "../messages.js";
import { isCarried } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function wear({ world, state, command }) {
  if (!command.noun) return [MESSAGES.dontUnderstand];

  // 4400 I=N%(X): IF NOT I THEN 240
  const objectId = command.X && world.nounMap ? world.nounMap[command.X - 1] : 0;
  if (!objectId) return [MESSAGES.cant];

  // 4405 IF P%(I)<>-2 THEN 330
  if (!isCarried(state, objectId)) return [MESSAGES.dontHaveIt];

  // 4410 PRINT "OK.": GOTO 7000 (note: does not track being worn)
  return [MESSAGES.ok];
}
