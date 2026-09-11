// 6700: CLIMB. Trees, willow, stairs, ladder.

import { ladderMovement, stairsMovement } from "../helpers.js";
import { MESSAGES } from "../messages.js";
import { awardPoints } from "../scoring.js";

/** @type {import("./index.js").CommandHandler} */
export function climb({ world, state, command }) {
  // 6700 IF X=12 AND P=16 THEN 320 (WILLO)
  if (command.X === 12 && state.room === 16) {
    awardPoints(state, "climbWillow");
    return [MESSAGES.slidBackDown];
  }

  // 6705 IF X=57 THEN 12000 (STAIR)
  if (command.X === 57) {
    return stairsMovement(world, state);
  }

  // 6710 IF X=59 THEN 5880 (LADDE)
  if (command.X === 59) {
    // TRANS.bas has no ladder object at the cemetery grate -- ENTER GRATE
    // (5790/6010) is the canonical way down -- but a player picturing a
    // ladder in that shaft is reasonable, so honor CLIMB LADDER there too.
    if (state.objectLoc[13] === state.room) {
      if (!state.flags.GT) return [MESSAGES.locked];
      state.room = 11;
      awardPoints(state, "climbToChamber");
      return [];
    }
    const result = ladderMovement(world, state);
    if (state.room === 37) awardPoints(state, "climbTowerLadder");
    return result;
  }

  // 6711 IF X<>13 THEN 240 (TREE)
  if (command.X !== 13) {
    return [MESSAGES.cant];
  }

  // 6712 IF P<>16 THEN 310
  if (state.room !== 16) {
    awardPoints(state, "climbTree");
    return [MESSAGES.slipperyMoss];
  }

  // 6725 GOTO 320
  awardPoints(state, "climbWillow");
  return [MESSAGES.slidBackDown];
}
