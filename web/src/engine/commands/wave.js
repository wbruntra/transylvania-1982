// 7700: WAVE / SHOW. Wand/ring, cross, elixir.

import { alienFireball, crossLight } from "../helpers.js";
import { MESSAGES } from "../messages.js";
import { isCarried } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function wave({ world, state, command }) {
  // 7700 IF (X=63 OR X=115) AND P=4 AND P%(3)=-2 AND P%(5)=-2: free alien from statue
  if (
    (command.X === 63 || command.X === 115) &&
    state.room === 4 &&
    isCarried(state, 3) &&
    isCarried(state, 5)
  ) {
    return alienFireball(world, state);
  }

  // 7701 IF X=26 AND P%(6)=-2: cross light
  if (command.X === 26 && isCarried(state, 6)) {
    return crossLight(world, state);
  }

  // 7702 IF X=28 THEN 7780: elixir
  if (command.X === 28) {
    if (!isCarried(state, 36)) return [MESSAGES.notHere];
    state.flags.SH = 1;
    return [MESSAGES.ok];
  }

  return [MESSAGES.nothingHappened];
}
