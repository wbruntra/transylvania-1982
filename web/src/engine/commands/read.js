// 9700: READ. Sign, gravestone, note, stump, and magic book.

import { MESSAGES } from "../messages.js";
import { isCarried } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function read({ state, command }) {
  // 9700 IF P=15 AND X=11 (SIGN)
  if (state.room === 15 && command.X === 11) {
    return [
      "'YOU ARE ON THE PROPERTY OF ZIN THE WIZARD, WHO LIVES IN A CABIN IN THIS FOREST. THE SUN WILL RISE AT FIVE.'",
    ];
  }

  // 9702 IF X=25 THEN 1555 (GRAVE)
  if (command.X === 25) {
    if (state.room === 5) {
      return [`IT SAYS 'HERE LIES ${state.flags.YN}'... AND IT HAS TODAY'S DATE.`];
    }
    return [MESSAGES.cant];
  }

  // 9705 IF X=24 AND (P%(18)=P OR P%(18)=-2) (NOTE)
  if (command.X === 24 && (state.objectLoc[18] === state.room || isCarried(state, 18))) {
    return ["'SABRINA DIES AT DAWN!'"];
  }

  // 9710 IF (X=51 OR X=49) AND P=1 (WRITI / STUMP)
  if ((command.X === 51 || command.X === 49) && state.room === 1) {
    if (state.flags.SM) {
      return ["THE WRITING SAYS 'KNOCK HERE'."];
    }
    return ["IT'S COVERED WITH SEDIMENT AND TOO FUZZY TO READ."];
  }

  // 9715/9720 IF X=66 AND P=9 (BOOK)
  if (command.X === 66 && state.room === 9) {
    return [
      "ALL THE PAGES HAVE BEEN RIPPED OUT BUT ONE. IT READS 'MAGIC ELIXIRS-MOST TYPES DEAL WITH THE REMOVAL OF SPELLS CAST ON PEOPLE. TO USE AN ELIXIR, SIMPLY WAVE THE CONTAINER TO ENERGIZE THE INGREDIENTS AND POUR CONTENTS ON THE SUBJECT. TO COMPLETE THE SPELL, CLAP YOUR HANDS.",
    ];
  }

  return [MESSAGES.cant];
}
