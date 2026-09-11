import { CARRIED, GONE, MAX_CARRIED } from "../constants.js";
import { MESSAGES } from "../messages.js";
import { awardPoints } from "../scoring.js";
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

/**
 * Catches the flies using the flypaper in Room 9.
 * @param {ReturnType<typeof import("../world.js").createWorld>} world
 * @param {import("../state.js").GameState} state
 */
export function catchFlies(world, state) {
  if (isCarried(state, 7)) {
    return [MESSAGES.alreadyCarrying];
  }
  if (state.room !== 9 || state.objectLoc[7] !== 9) {
    return [MESSAGES.notHere];
  }
  const hasPaper = isCarried(state, 31) || state.objectLoc[31] === state.room;
  if (!hasPaper) {
    return ["THE FLIES SCATTERED BEFORE YOU COULD CATCH ANY OF THEM."]; // 3090
  }
  setObjectTakeable(state, 7, 1);
  setObjectName(state, 7, "FLIES ON FLYPAPER.");
  placeObject(state, 7, CARRIED);
  placeObject(state, 31, GONE);
  awardPoints(state, "catchFlies");
  return [
    "MANY FLIES ESCAPED, BUT YOU DID MANAGE TO CATCH SEVERAL OF THEM WITH THE PAPER.",
    MESSAGES.ok,
  ];
}

/** @type {import("./index.js").CommandHandler} */
export function take({ world, state, command }) {
  if (!command.noun) return null;

  // 3002 -> 3080: the magic book is the way back out of the cave.
  if (command.X === 66) {
    if (state.room !== 9) return [MESSAGES.cant]; // 3081
    state.room = 1;
    return [
      "AS YOU TRY TO TAKE THE BOOK A MYSTERIOUS VOICE SHOUTS 'IT IS MINE! GO AWAY!'...YOU ARE BACK IN THE FOREST.",
    ];
  }

  // Added -- not in TRANS.bas: the mice are too quick to grab by hand. SET
  // TRAP (rules.js) somewhere in their loop and wait for them to blunder in
  // (turnHooks.js); only the trap itself is takeable once that's happened.
  if ((command.X === 31 || command.noun.includes("mice")) && state.objectLoc[20] === state.room) {
    return ["THE MICE SCURRY AWAY BEFORE YOU CAN GRAB THEM."];
  }

  // 3003 -> 3090: catching flies with flypaper
  if (command.X === 65 || (command.noun && command.noun.includes("flies"))) {
    return catchFlies(world, state);
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

  // 3029 / 3061: In Room 7, the Black Cat guards the acid and broom
  if (
    state.room === 7 &&
    state.objectLoc[24] === 7 &&
    (object.id === 1 || object.id === 25 || command.X === 36 || command.X === 35 || command.X === 22 || command.noun?.includes("acid") || command.noun?.includes("broom") || command.noun?.includes("bottle"))
  ) {
    return [MESSAGES.catScowls];
  }

  // 3067: the ring sits behind a barrier until the vampire is destroyed, which
  // is what forces the cross to come before the treasure room.
  if (command.X === 63 && !state.flags.VR) {
    return ["A MYSTERIOUS BARRIER PREVENTS YOU FROM TOUCHING IT."];
  }
  if (Number.isFinite(MAX_CARRIED) && carriedCount(state) >= MAX_CARRIED) {
    return [MESSAGES.carryingTooMuch];
  }

  placeObject(state, object.id, CARRIED);
  if (object.id === 6) awardPoints(state, "takeCross");
  return [MESSAGES.ok];
}
