import { CARRIED, MAX_CARRIED } from "../constants.js";
import { MESSAGES } from "../messages.js";
import {
  carriedCount,
  getNounMapEntry,
  isCarried,
  isObjectTakeable,
  placeObject,
  setObjectName,
  setObjectTakeable,
} from "../state.js";
import { findVisibleObject } from "../world.js";

/** @type {import("./index.js").CommandHandler} */
export function take({ world, state, command }) {
  if (!command.noun) return null;

  // 3002 -> 3080: the magic book is the way back out of the cave. KNOCK on the
  // stump drops you into room 9, which has no exits and refuses EXIT (10019);
  // reaching for the book is what ends the visit.
  if (command.X === 66) {
    if (state.room !== 9) return [MESSAGES.cant]; // 3081
    state.room = 1;
    return [
      "AS YOU TRY TO TAKE THE BOOK A MYSTERIOUS VOICE SHOUTS 'IT IS MINE! GO AWAY!'...YOU ARE BACK IN THE FOREST.",
    ];
  }

  // 3003 -> 3090: the flies will not be caught bare-handed, only on the
  // flypaper, and catching them is what makes them takeable at all.
  if (command.X === 65) {
    if (!isCarried(state, 31)) {
      return ["THE FLIES SCATTERED BEFORE YOU COULD CATCH ANY OF THEM."]; // 3090
    }
    if (state.objectLoc[7] !== state.room) return [MESSAGES.notHere]; // 3096
    // 3095 then falls through to the ordinary take at 3010.
    setObjectTakeable(state, 7, 1);
    setObjectName(state, 7, "FLIES.");
    placeObject(state, 31, state.room);
    placeObject(state, 7, CARRIED);
    return [
      "MANY FLIES ESCAPED, BUT YOU DID MANAGE TO CATCH SEVERAL OF THEM WITH THE PAPER.",
      MESSAGES.ok,
    ];
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

  // A recognised noun with no object in N%() is scenery (TRANS.bas:3010)
  if (!object && command.X) return [MESSAGES.cant];
  if (!object) return [MESSAGES.notHere];

  if (isCarried(state, object.id)) return [MESSAGES.alreadyCarrying];
  if (state.objectLoc[object.id] !== state.room) return [MESSAGES.notHere];
  if (!isObjectTakeable(world, state, object.id)) return [MESSAGES.cant];

  // 3067: the ring sits behind a barrier until the vampire is destroyed, which
  // is what forces the cross to come before the treasure room.
  if (command.X === 63 && !state.flags.VR) {
    return ["A MYSTERIOUS BARRIER PREVENTS YOU FROM TOUCHING IT."];
  }
  if (carriedCount(state) >= MAX_CARRIED) return [MESSAGES.carryingTooMuch];

  placeObject(state, object.id, CARRIED);
  return [MESSAGES.ok];
}
