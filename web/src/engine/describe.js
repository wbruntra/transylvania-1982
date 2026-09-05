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

/**
 * The full look: description, exits, then anything lying about.
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {import("./state.js").GameState} state
 * @returns {string[]}
 */
export function describeRoom(world, state) {
  const room = world.room(state.room);
  return [
    room.desc,
    MESSAGES.exitsPrefix + describeExits(world, state.room),
    ...objectsInRoom(world, state, state.room).map((object) =>
      MESSAGES.thereIsA(getObjectName(world, state, object.id))
    ),
  ];
}
