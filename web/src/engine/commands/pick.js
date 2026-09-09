// PICK command handler.
// TRANS.bas:2990-2996, 6315-6330

import { MESSAGES } from "../messages.js";
import { awardPoints } from "../scoring.js";
import { isCarried } from "../state.js";
import { take } from "./take.js";

/** @type {import("./index.js").CommandHandler} */
export function pick(context) {
  const { state, command } = context;

  // 2990 IF X<>121 THEN 3000 (dispatches to GET/TAKE)
  if (command.X !== 121) {
    return take(context);
  }

  // 2995 IF P=9 OR P=10 THEN 6315
  if (state.room === 9 || state.room === 10) {
    // 6315 IF DR THEN 280
    if (state.flags.DR) return [MESSAGES.alreadyOpen];
    // 6320 IF P%(26)=-2 THEN DR=1: PRINT "OK.": GOTO 7000
    if (isCarried(state, 26)) {
      state.flags.DR = 1;
      awardPoints(state, "pickCaveDoor");
      return [MESSAGES.ok];
    }
    // 6330 GOTO 240
    return [MESSAGES.cant];
  }

  // 2996 GOTO 240
  return [MESSAGES.cant];
}
