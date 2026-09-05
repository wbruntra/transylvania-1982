import { MESSAGES } from "../messages.js";
import { getNounMapEntry, isCarried, placeObject } from "../state.js";
import { findVisibleObject } from "../world.js";

/** @type {import("./index.js").CommandHandler} */
export function drop({ world, state, command }) {
  if (!command.noun) return null;

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
