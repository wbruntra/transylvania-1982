// 6140: RIDE / 6142: FLY. Broomstick flyover and boat sailing.

import { GONE } from "../constants.js";
import { MESSAGES } from "../messages.js";
import { isCarried, isObjectTakeable, placeObject } from "../state.js";
import { sail } from "./sail.js";

/** @type {import("./index.js").CommandHandler} */
export function ride(context) {
  const { world, state, command } = context;

  // 6140 IF X=56 THEN I=59: GOTO 9400 (BOAT -> SAIL)
  if (command.X === 56) {
    return sail(context);
  }

  return fly(context);
}

/** @type {import("./index.js").CommandHandler} */
export function fly({ world, state, command }) {
  // 6142 IF X<>22 THEN 290 (BROOM)
  if (command.X !== 22) return [MESSAGES.nothingHappened];

  // 6145 IF P%(25)<>-2 AND P%(25)<>P OR T%(25)=0 THEN 210
  const broomHereOrCarried = isCarried(state, 25) || state.objectLoc[25] === state.room;
  if (!broomHereOrCarried || !isObjectTakeable(world, state, 25)) {
    return [MESSAGES.notHere];
  }

  // 6146 IF P%(24)=P THEN 3061 (cat scowls)
  if (state.objectLoc[24] === state.room) {
    return [MESSAGES.catScowls];
  }

  // 6150-6170 Broom flyover
  placeObject(state, 25, GONE);
  state.room = 15;
  return [
    "THE BROOMSTICK BUCKS VIOLENTLY, BUT YOU ARE FINALLY ABLE TO MASTER IT. IT SOARS HIGH OVER THE WOODS, SHOWING YOU THE",
    "HILLS OF TRANSYLVANIA BATHED IN A PALE MOONLIGHT. THE BROOM DIVES, CIRCLING TWICE AROUND A GLOOMY CASTLE. TO THE",
    "SOUTH YOU SEE A LAKE EXTENDING FAR BEYOND THE FOREST. SUDDENLY THE BROOM",
    "PLUNGES TOWARD THE LAKE. YOU ARE SHAKEN",
    "LOOSE AND FALL INTO A LARGE WILLOW ON THE SHORE.  THE LAST SOUND YOU HEAR IS THE LOUD, CHILLING CACKLE OF A WITCH!",
  ];
}
