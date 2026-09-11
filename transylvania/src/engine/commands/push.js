// 4900: PUSH / PRESS. The box button (noun 76), gravestone (noun 25), and interactive objects.

import { GONE } from "../constants.js";
import { MESSAGES } from "../messages.js";
import { awardPoints } from "../scoring.js";
import { isCarried, placeObject } from "../state.js";
import { movePry } from "./movePry.js";

/** @type {import("./index.js").CommandHandler} */
export function push(context) {
  const { world, state, command } = context;

  // In Room 5, PUSH GRAVESTONE / STONE does the same thing as MOVE / PRY
  const isGravestone =
    command.X === 25 ||
    command.X === 128 ||
    command.noun?.includes("grave") ||
    command.noun?.includes("stone");
  if (state.room === 5 && isGravestone) {
    return movePry(context);
  }

  // In Room 37, PUSH VINES does the same as MOVE VINES / PULL VINES
  if (state.room === 37 && (command.X === 69 || command.noun?.includes("vine"))) {
    return movePry(context);
  }

  // In Room 21, PUSH WALL / PUSH ANTLERS
  if (
    state.room === 21 &&
    (command.X === 102 || command.X === 46 || command.noun?.includes("wall") || command.noun?.includes("antle"))
  ) {
    return movePry(context);
  }

  // 4900 IF X<>76 THEN 260 (BUTTO)
  if (command.X !== 76) return [MESSAGES.wontBudge];

  // 4910 IF P%(27)<>-2 AND P%(27)<>P THEN 210 (box must be carried or here)
  if (!isCarried(state, 27) && state.objectLoc[27] !== state.room) {
    return [MESSAGES.notHere];
  }

  const prefix = "DAZZLING LIGHT SHOOTS FROM THE BOX AND";

  // 4930 IF P=9 OR P=10: cave collapse / death
  if (state.room === 9 || state.room === 10) {
    return [
      prefix,
      "CAUSES THE ROOF OF THE CAVE TO COLLAPSE -- CRUSHING YOU INSTANTLY.",
      "SO MUCH FOR THAT TRY...",
      "PRESS ANY KEY TO RESTART THE GAME.",
    ];
  }

  // 4933 IF P%(15)=P: blast sarcophagus open
  if (state.objectLoc[15] === state.room) {
    placeObject(state, 15, GONE);
    placeObject(state, 16, 37);
    awardPoints(state, "pushButton");
    return [
      prefix,
      "ENVELOPS THE SARCOPHAGUS. IN A VIOLENT BLAST THE LID FLIES OFF AND EXPLODES IN",
      "A CASCADE OF GLOWING DUST.",
    ];
  }

  // 4934 IF P<38 AND P>26: inside castle
  if (state.room > 26 && state.room < 38) {
    awardPoints(state, "pressButtonElsewhere");
    return [prefix, "SHAKES THE ROOM WITH A FANTASTIC JOLT OF POWER."];
  }

  // 4935 in the forest
  awardPoints(state, "pressButtonElsewhere");
  return [prefix, "UPROOTS A TREE."];
}
