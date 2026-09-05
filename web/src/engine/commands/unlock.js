// 6300: UNLOCK / 6400: LOCK. Door (noun 61) in 9/10, grate (noun 27) in 5.

import { MESSAGES } from "../messages.js";
import { isCarried } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function unlock({ state, command }) {
  // Grate in room 5 (6370)
  if (command.X === 27) {
    if (state.room !== 5) return [MESSAGES.notHere];
    if (state.flags.GT) return [MESSAGES.alreadyOpen];
    if (!isCarried(state, 11)) return [MESSAGES.cant];
    state.flags.GT = 1;
    return [MESSAGES.ok];
  }

  // Door in rooms 9/10 (6310)
  if (command.X === 61) {
    if (state.room !== 9 && state.room !== 10) return [MESSAGES.notHere];
    if (state.flags.DR) return [MESSAGES.alreadyOpen];
    if (isCarried(state, 26)) {
      state.flags.DR = 1;
      return [MESSAGES.ok];
    }
    return [MESSAGES.cant];
  }

  return [MESSAGES.cant];
}

/** @type {import("./index.js").CommandHandler} */
export function lock({ state, command }) {
  // Grate in room 5 (6470)
  if (command.X === 27) {
    if (state.room !== 5) return [MESSAGES.notHere];
    if (!state.flags.GT) return [MESSAGES.locked];
    if (!isCarried(state, 11)) return [MESSAGES.cant];
    state.flags.GT = 0;
    return [MESSAGES.ok];
  }

  // Door in rooms 9/10 (6410)
  if (command.X === 61) {
    if (state.room !== 9 && state.room !== 10) return [MESSAGES.notHere];
    if (state.flags.DR) {
      state.flags.DR = 0;
      return [MESSAGES.ok];
    }
    return [MESSAGES.locked];
  }

  return [MESSAGES.cant];
}
