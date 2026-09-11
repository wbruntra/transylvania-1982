// CLOSE command handler.
// TRANS.bas:7600-7602

import { GONE } from "../constants.js";
import { MESSAGES } from "../messages.js";
import { placeObject } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function close({ world, state, command }) {
  // 7600 IF X<>29 THEN 240
  if (command.X !== 29) return [MESSAGES.cant];

  // 7601 N%(34)=21: P%(37)=-1: P%(21)=38: P%(19)=-1: AX=0: IF P%(22)=38 THEN P%(22)=-1
  if (world.nounMap) {
    world.nounMap[28] = 21; // COFFIN noun maps back to closed coffin (obj 21)
    world.nounMap[33] = 21; // N%(34)=21 from TRANS.bas:7601
  }
  placeObject(state, 37, GONE); // corpse removed
  placeObject(state, 21, 38); // closed coffin in room 38
  placeObject(state, 19, GONE); // open coffin removed
  if (state.objectLoc[22] === 38) {
    placeObject(state, 22, GONE); // silver bullet trapped inside
  }

  // 7602 GOTO 7000
  return [MESSAGES.ok];
}
