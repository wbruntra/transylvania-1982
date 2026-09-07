// 7500: OPEN. Coffin, door, coffer, sarcophagus, grate.

import { GONE } from "../constants.js";
import { MESSAGES } from "../messages.js";
import { placeObject, setNounMapEntry } from "../state.js";
import { unlock } from "./unlock.js";

/** @type {import("./index.js").CommandHandler} */
export function open(context) {
  const { state, command } = context;

  // 7500 IF X=29 AND P=38: open coffin
  if (command.X === 29 && state.room === 38) {
    setNounMapEntry(state, 29, 19);
    placeObject(state, 20, 74);
    placeObject(state, 19, 38);
    if (state.objectLoc[22] === -1 && !state.flags.GN) {
      placeObject(state, 22, 38);
    }
    placeObject(state, 37, 38);
    placeObject(state, 21, GONE);
    return ["AS YOU LIFT THE LID AN OVERPOWERING STENCH HITS YOU..."];
  }

  // 7502 IF X=61 THEN 6310 (DOOR -> unlock)
  if (command.X === 61) {
    return unlock(context);
  }

  // 7505 IF X=62 THEN 7530 (COFFE)
  if (command.X === 62) {
    if (state.room !== 35) return [MESSAGES.notHere];
    if (state.objectLoc[23] === state.room) {
      setNounMapEntry(state, 62, 4);
      placeObject(state, 4, state.room);
      placeObject(state, 5, state.room);
      placeObject(state, 23, GONE);
      return [MESSAGES.ok];
    }
    return [MESSAGES.alreadyOpen];
  }

  // 7510 IF X=70 AND P=37: sarcophagus
  if (command.X === 70 && state.room === 37) {
    return [MESSAGES.hermeticallySealed];
  }

  // 7515 IF X=72
  if (command.X === 72) {
    return [MESSAGES.boltedDown];
  }

  // 7516 IF X<>27 OR P%(13)<>P THEN 230
  if (command.X !== 27 || state.objectLoc[13] !== state.room) {
    return [MESSAGES.dontUnderstand];
  }

  // 7525 IF GT THEN 280 (already open)
  if (state.flags.GT) return [MESSAGES.alreadyOpen];

  // 7526 GOTO 200 (locked)
  return [MESSAGES.locked];
}
