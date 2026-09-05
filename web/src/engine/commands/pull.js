// 4700: PULL. Antlers spin wall between rooms 21 and 22; vines reveal sarcophagus.

import { describeRoom } from "../describe.js";
import { revealSarcophagus } from "../helpers.js";
import { MESSAGES } from "../messages.js";

/** @type {import("./index.js").CommandHandler} */
export function pull({ world, state, command }) {
  // 4700 IF X=69 THEN 7820 (vines)
  if (command.X === 69) {
    return revealSarcophagus(world, state);
  }

  // 4701 IF X<>46 THEN 260 (X=46 is ANTLE)
  if (command.X !== 46) return [MESSAGES.wontBudge];

  // 4702 IF P<>21 AND P<>22 THEN 210
  if (state.room !== 21 && state.room !== 22) return [MESSAGES.notHere];

  // 4703/4704: Spin wall between 21 and 22
  state.room = state.room === 21 ? 22 : 21;
  return [MESSAGES.wallSpins, ...describeRoom(world, state)];
}
