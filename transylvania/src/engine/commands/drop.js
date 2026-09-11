import { MESSAGES } from "../messages.js";
import { getNounMapEntry, isCarried, placeObject } from "../state.js";
import { findVisibleObject } from "../world.js";
import { catchFlies } from "./take.js";

/** @type {import("./index.js").CommandHandler} */
export function drop({ world, state, command }) {
  if (!command.noun) return null;

  // In Room 9, attempting to drop/place flypaper while flies are present catches them!
  if (
    state.room === 9 &&
    state.objectLoc[7] === 9 &&
    (command.X === 141 || command.noun?.includes("paper") || command.noun?.includes("flypaper"))
  ) {
    return catchFlies(world, state);
  }

  // TRANS.bas:4190 - In Room 7, dropping the mice chases the cat away!
  if (
    state.room === 7 &&
    state.objectLoc[24] === 7 &&
    (command.X === 31 || command.noun?.includes("mice")) &&
    isCarried(state, 20)
  ) {
    placeObject(state, 20, -1);
    placeObject(state, 24, -1);
    if (!state.timers) state.timers = {};
    state.timers.ZZ = 11;
    return ["THE MICE RUN AWAY AND THE CAT CHASES AFTER THEM."];
  }

  let object = null;
  if (command.X) {
    const objectId = getNounMapEntry(world, state, command.X);
    if (objectId > 0) {
      object = world.objects.get(objectId);
    }
  }

  if (!object) {
    object = findVisibleObject(world, state, command.noun);
  }

  if (!object || !isCarried(state, object.id)) return [MESSAGES.dontHaveIt];

  placeObject(state, object.id, state.room);
  return [MESSAGES.ok];
}
