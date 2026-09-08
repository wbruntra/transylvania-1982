// 4800: POUR. The acid chain and the magic elixir.

import { GONE } from "../constants.js";
import { MESSAGES } from "../messages.js";
import { isCarried, placeObject } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function pour({ state, command }) {
  const isAcid = command.X === 36 || command.directX === 36 || command.noun?.includes("acid");
  if (isAcid) {
    if (!isCarried(state, 1)) return [MESSAGES.dontUnderstand];
    placeObject(state, 1, GONE);
    if (state.room === 1) {
      state.flags.SM = 1;
      return [MESSAGES.acidSizzlesStump, MESSAGES.bottleSlipped];
    }
    return [MESSAGES.acidSeeps, MESSAGES.bottleSlipped];
  }

  // 4805 IF X<>28 THEN 230 (ELIXI)
  const isElixir = command.X === 28 || command.directX === 28 || command.noun?.includes("elixir");
  if (!isElixir) return [MESSAGES.dontUnderstand];

  // 4815 IF PO THEN PRINT "YOU ALREADY DID!": GOTO 7000
  if (state.flags.PO) return [MESSAGES.youAlreadyDid];

  // 4820 IF P%(36)<>-2 THEN 230
  if (!isCarried(state, 36)) return [MESSAGES.dontUnderstand];

  // 4859 consumes elixir
  placeObject(state, 36, GONE);

  // 4840 IF P<>37 OR P%(16)<>37 THEN 4856
  if (state.room === 37 && (state.objectLoc[16] === 37 || state.flags.SH)) {
    state.flags.SH = 1;
    state.flags.PO = 1;
    return [MESSAGES.ok, MESSAGES.lightningInDistance];
  }

  return [MESSAGES.nothingHappened];
}
