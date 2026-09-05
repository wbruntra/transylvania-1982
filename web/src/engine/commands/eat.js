// 6500: EAT / 6600: DRINK. Bread, garlic, lake water, potion, acid.

import { GONE } from "../constants.js";
import { MESSAGES } from "../messages.js";
import { isCarried, placeObject } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function eat({ state, command }) {
  // 6500 IF X=43 THEN 6570 (GARLI)
  if (command.X === 43) {
    if (state.objectLoc[32] !== state.room && !isCarried(state, 32)) {
      return [MESSAGES.notHere];
    }
    placeObject(state, 32, GONE);
    return ["OK"];
  }

  // 6510 IF X<>41 THEN PRINT "YECCHHH!": GOTO 7000 (BREAD)
  if (command.X !== 41) {
    return [MESSAGES.yecchhh];
  }

  // 6530 IF P%(9)<>P AND P%(9)<>-2 THEN 210
  if (state.objectLoc[9] !== state.room && !isCarried(state, 9)) {
    return [MESSAGES.notHere];
  }

  // 6534 PRINT "IT TASTED AWFUL."
  placeObject(state, 9, GONE);
  return ["IT TASTED AWFUL."];
}

/** @type {import("./index.js").CommandHandler} */
export function drink({ state, command }) {
  // 6600 IF X=117 THEN 6620 (WATER)
  if (command.X === 117) {
    if (state.room !== 16) return [MESSAGES.cant];
    return [MESSAGES.hitsTheSpot];
  }

  // 6605 IF X=36 THEN 6640 (ACID)
  if (command.X === 36) {
    if (!isCarried(state, 1)) return [MESSAGES.notHere];
    placeObject(state, 1, GONE);
    return [MESSAGES.acidBurns, MESSAGES.bottleSlipped];
  }

  // 6610 IF X=28 THEN PRINT "TO YOU THAT STUFF IS POISONOUS!" (ELIXI)
  if (command.X === 28) {
    return [MESSAGES.poisonousToYou];
  }

  return [MESSAGES.dontUnderstand];
}
