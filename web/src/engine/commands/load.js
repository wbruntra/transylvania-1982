// 4500: LOAD. Pistol + silver bullet, sets GN, renames object 17.

import { GONE } from "../constants.js";
import { MESSAGES } from "../messages.js";
import { isCarried, placeObject, setObjectName } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function load({ state, command }) {
  // 4500 IF X<>33 THEN 230 (X=33 is PISTO)
  if (command.X !== 33) return [MESSAGES.dontUnderstand];

  // 4502 IF GN THEN PRINT "IT ALREADY IS.": GOTO 7000
  if (state.flags.GN) return [MESSAGES.alreadyIs];

  // 4503 IF P%(17)<>-2 OR P%(22)<>-2 THEN 240
  if (!isCarried(state, 17) || !isCarried(state, 22)) return [MESSAGES.cant];

  // 4510 P%(22)=-1: GN=1: PRINT "OK.": OD$(17)="LOADED FLINTLOCK PISTOL."
  placeObject(state, 22, GONE);
  state.flags.GN = 1;
  setObjectName(state, 17, "LOADED FLINTLOCK PISTOL.");
  return [MESSAGES.ok];
}
