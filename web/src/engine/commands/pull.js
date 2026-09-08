// 4700: PULL. Antlers spin wall between rooms 21 and 22; vines reveal sarcophagus; gravestone in cemetery.

import { revealSarcophagus } from "../helpers.js";
import { MESSAGES } from "../messages.js";
import { movePry } from "./movePry.js";

/** @type {import("./index.js").CommandHandler} */
export function pull(context) {
  const { world, state, command } = context;

  // In Room 5, PULL GRAVESTONE does the same as MOVE GRAVESTONE
  const isGravestone =
    command.X === 25 ||
    command.X === 128 ||
    command.noun?.includes("grave") ||
    command.noun?.includes("stone");
  if (state.room === 5 && isGravestone) {
    return movePry(context);
  }

  // 4700 IF X=69 THEN 7820 (vines)
  if (command.X === 69 || command.noun?.includes("vine")) {
    return revealSarcophagus(world, state);
  }

  // 4701 IF X<>46 THEN 260 (X=46 is ANTLE; allow X=112 WALL in rooms 21/22)
  if (command.X !== 46 && !((state.room === 21 || state.room === 22) && command.X === 112)) {
    return [MESSAGES.wontBudge];
  }

  // 4702 IF P<>21 AND P<>22 THEN 210
  if (state.room !== 21 && state.room !== 22) return [MESSAGES.notHere];

  // 4703/4704: Spin wall between 21 and 22
  state.room = state.room === 21 ? 22 : 21;
  return [MESSAGES.wallSpins];
}
