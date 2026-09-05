import { CARRIED, MAX_CARRIED } from "../constants.js";
import { MESSAGES } from "../messages.js";
import { carriedCount, getNounMapEntry, isCarried, isObjectTakeable, placeObject } from "../state.js";
import { findVisibleObject } from "../world.js";

/** @type {import("./index.js").CommandHandler} */
export function take({ world, state, command }) {
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

  // A recognised noun with no object in N%() is scenery (TRANS.bas:3010)
  if (!object && command.X) return [MESSAGES.cant];
  if (!object) return [MESSAGES.notHere];

  if (isCarried(state, object.id)) return [MESSAGES.alreadyCarrying];
  if (state.objectLoc[object.id] !== state.room) return [MESSAGES.notHere];
  if (!isObjectTakeable(world, state, object.id)) return [MESSAGES.cant];
  if (carriedCount(state) >= MAX_CARRIED) return [MESSAGES.carryingTooMuch];

  placeObject(state, object.id, CARRIED);
  return [MESSAGES.ok];
}
