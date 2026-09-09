// 6300: UNLOCK / 6400: LOCK. Door (noun 61) in 9/10, grate (noun 27) in 5.

import { MESSAGES } from "../messages.js";
import { awardPoints } from "../scoring.js";
import { isCarried } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function unlock({ state, command }) {
  const isGrate =
    command.X === 27 ||
    command.directX === 27 ||
    command.indirectX === 27 ||
    command.noun?.includes("grate");
  const isDoor =
    command.X === 61 ||
    command.directX === 61 ||
    command.indirectX === 61 ||
    command.noun?.includes("door");

  // Grate in room 5 (6370)
  if (isGrate || (state.room === 5 && !isDoor)) {
    if (state.room !== 5) return [MESSAGES.notHere];
    if (state.flags.GT) return [MESSAGES.alreadyOpen];
    if (!isCarried(state, 11)) return [MESSAGES.cant];
    state.flags.GT = 1;
    awardPoints(state, "unlockGrate");
    return [MESSAGES.ok];
  }

  // Door in rooms 9/10 (6310)
  if (isDoor || state.room === 9 || state.room === 10) {
    if (state.room !== 9 && state.room !== 10) return [MESSAGES.notHere];
    if (state.flags.DR) return [MESSAGES.alreadyOpen];
    if (command.indirectX === 11 || (command.noun?.includes("key") && !command.noun?.includes("pick"))) {
      return ["THE TINY KEY DOES NOT FIT THIS DOOR. YOU NEED A LOCK PICK."];
    }
    if (isCarried(state, 26)) {
      state.flags.DR = 1;
      awardPoints(state, "pickCaveDoor");
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
