// 7800: MOVE / PRY. Move gravestone reveals grate; vines reveal sarcophagus.

import { revealSarcophagus } from "../helpers.js";
import { MESSAGES } from "../messages.js";
import { awardPoints } from "../scoring.js";
import { getObjectName, placeObject } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function movePry({ world, state, command }) {
  // 7800 IF X=69 THEN 7820 (vines)
  if (command.X === 69) {
    return revealSarcophagus(world, state);
  }

  // 7805 IF X=102 AND P=21
  if (command.X === 102 && state.room === 21) {
    return [MESSAGES.itWobbles];
  }

  // 7810 IF X<>25 OR P<>5 THEN 290 (GRAVE)
  const isGravestone =
    command.X === 25 ||
    command.X === 128 ||
    command.noun?.includes("grave") ||
    command.noun?.includes("stone");

  if (!isGravestone || state.room !== 5) {
    return [MESSAGES.nothingHappened];
  }

  // 7815 PRINT "YOU FOUND A GRATE BEHIND THE GRAVESTONE.": P%(13)=5
  placeObject(state, 13, 5);
  awardPoints(state, "moveGravestone");
  return ["YOU FOUND A GRATE BEHIND THE GRAVESTONE.", MESSAGES.thereIsA(getObjectName(world, state, 13))];
}
