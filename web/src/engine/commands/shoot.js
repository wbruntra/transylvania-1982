// 4600: SHOOT (I=23) / FIRE (I=61). Consumes GN, kills werewolf if X=34, drops ball at P+3.

import { GONE } from "../constants.js";
import { MESSAGES } from "../messages.js";
import { isCarried, placeObject, setObjectName } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function shoot({ state, command }) {
  // 4600 IF NOT GN OR P%(17)<>-2 OR I=61 AND X<>33 THEN 240
  if (!state.flags.GN || !isCarried(state, 17) || (command.I === 61 && command.X !== 33)) {
    return [MESSAGES.cant];
  }

  // 4602 IF I=61 THEN 4606 (missed)
  if (command.I === 61) {
    placeObject(state, 22, state.room + 3);
    setObjectName(state, 17, "SMOKING FLINTLOCK PISTOL.");
    state.flags.GN = 0;
    return [MESSAGES.missed];
  }

  // 4605 IF P%(34)=P AND (X=34 OR bare SHOOT) THEN ...
  const targetsWolf =
    command.X === 34 ||
    command.directX === 34 ||
    command.indirectX === 34 ||
    command.noun?.includes("werewolf") ||
    command.noun?.includes("wolf") ||
    !command.X;

  if (state.objectLoc[34] === state.room && targetsWolf) {
    state.flags.WF = 1;
    placeObject(state, 34, GONE);
    setObjectName(state, 17, "SMOKING FLINTLOCK PISTOL.");
    state.flags.GN = 0;
    return [
      "GOT HIM!  WITH A DESPERATE HOWL THE WEREWOLF COLLAPSES. SLOWLY ITS OUTLINE CHANGES TO THAT OF A DECREPIT OLD MAN,",
      "THEN CRUMBLES INTO DUST!",
    ];
  }

  // 4606 PRINT "MISSED.": P%(22)=P+3
  placeObject(state, 22, state.room + 3);
  setObjectName(state, 17, "SMOKING FLINTLOCK PISTOL.");
  state.flags.GN = 0;
  return [MESSAGES.missed];
}
