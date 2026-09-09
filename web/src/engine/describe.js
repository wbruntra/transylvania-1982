// Room description -- shared by LOOK and by arriving somewhere after a move.

import { MESSAGES } from "./messages.js";
import { getObjectName } from "./state.js";
import { objectsInRoom } from "./world.js";

/**
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {number} roomId
 * @returns {string}
 */
export function describeExits(world, roomId) {
  const exits = world.exitsFrom(roomId);
  if (exits.length === 0) return MESSAGES.noOrdinaryExits;
  return exits.map((direction) => `${direction}.`).join(" ");
}

// Cosmetic room-description additions -- not in TRANS.bas, and not folded
// into the extracted room text either. trans_port_kit/game.json is
// regenerated from the disk image by tools/sync-data.mjs, so a hand-edit to
// its `desc` field would just be dropped on the next sync. This is the place
// for prose that names scenery ROOM_SCENERY (rules.js) makes examinable --
// room 21's original text ("YOU ARE IN A LOG CABIN. AN EXIT GOES W.") never
// mentioned the deer head, fireplace, or table it now has responses for.
/** @type {Record<number, string>} */
const ROOM_FLAVOR = {
  21: "A MOUNTED DEER'S HEAD HANGS ON ONE WALL. A COLD STONE FIREPLACE SITS ACROSS THE ROOM, WITH A ROUGH-HEWN TABLE AND STOOL NEAR IT -- SOMEONE LEFT A HALF-EATEN MEAL ON THE TABLE.",
};

/**
 * The full look: description, exits, then anything lying about.
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {import("./state.js").GameState} state
 * @returns {string[]}
 */
export function describeRoom(world, state) {
  const room = world.room(state.room);
  const flavor = ROOM_FLAVOR[state.room];
  return [
    flavor ? `${room.desc} ${flavor}` : room.desc,
    MESSAGES.exitsPrefix + describeExits(world, state.room),
    ...objectsInRoom(world, state, state.room).map((object) =>
      MESSAGES.thereIsA(getObjectName(world, state, object.id))
    ),
  ];
}
