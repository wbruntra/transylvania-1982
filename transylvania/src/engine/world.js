// The world: the immutable half of the game.
//
// Rooms, objects and the vocabulary tables never change during play. Everything
// that does change lives in state.js, keyed by object id. Keeping the two apart
// is what makes save/restore a matter of serialising the state alone.

import { CARRIED, DIRECTIONS } from "./constants.js";

/**
 * @param {import("../data/gameData.js").GameData} data
 */
export function createWorld(data) {
  const rooms = new Map(data.rooms.map((room) => [room.id, room]));
  const objects = new Map(data.objects.map((object) => [object.id, object]));

  return {
    rooms,
    objects,

    /** The 89 verb words from TPAR, in the order TRANS.bas:1165/1167 dispatches. */
    verbs: data.verbs,

    /** The 171 noun words from TPAR, indexed by the X the room scripts test. */
    nouns: data.nouns,

    /**
     * The 171-entry N%() table. A negative entry means "this noun is really
     * that other noun"; TRANS.bas:1030 does `IF N%(X)<0 THEN X=-N%(X)`.
     */
    nounMap: [...data.noun_map_N],

    /**
     * The BASIC line each verb dispatches to, parallel to `verbs`. Doubles as
     * the port's checklist: verbs sharing a target share a routine.
     */
    verbTargets: data.verb_targets,

    /**
     * @param {number} id
     * @returns {import("../data/gameData.js").RawRoom}
     */
    room(id) {
      const room = rooms.get(id);
      if (!room) throw new Error(`no such room: ${id}`);
      return room;
    },

    /**
     * @param {number} id
     * @returns {import("../data/gameData.js").RawObject}
     */
    object(id) {
      const object = objects.get(id);
      if (!object) throw new Error(`no such object: ${id}`);
      return object;
    },

    /**
     * Direction codes leading somewhere from a room.
     * @param {number} roomId
     * @returns {string[]}
     */
    exitsFrom(roomId) {
      const { exits } = this.room(roomId);
      return DIRECTIONS.filter((direction) => exits[direction] > 0);
    },

    /**
     * Destination of a move, or 0 when there is no ordinary exit that way.
     * @param {number} roomId
     * @param {string} direction
     * @returns {number}
     */
    destination(roomId, direction) {
      return this.room(roomId).exits[direction] ?? 0;
    },
  };
}

/**
 * Objects lying loose in a room.
 * @param {ReturnType<typeof createWorld>} world
 * @param {import("./state.js").GameState} state
 * @param {number} roomId
 */
export function objectsInRoom(world, state, roomId) {
  return [...world.objects.values()].filter((object) => state.objectLoc[object.id] === roomId);
}

/**
 * Objects in the player's hands.
 * @param {ReturnType<typeof createWorld>} world
 * @param {import("./state.js").GameState} state
 */
export function carriedObjects(world, state) {
  return [...world.objects.values()].filter((object) => state.objectLoc[object.id] === CARRIED);
}

/**
 * Resolves a typed noun against what the player can currently see or hold.
 * Substring match, as the original's noun table effectively allowed.
 * @param {ReturnType<typeof createWorld>} world
 * @param {import("./state.js").GameState} state
 * @param {string} noun
 * @returns {import("../data/gameData.js").RawObject | null}
 */
export function findVisibleObject(world, state, noun) {
  const needle = noun.toLowerCase().trim();
  if (!needle) return null;
  const reachable = [
    ...objectsInRoom(world, state, state.room),
    ...carriedObjects(world, state),
  ];
  return reachable.find((object) => object.name.toLowerCase().includes(needle)) ?? null;
}
