// Everything that changes during play, in one serialisable object.
//
// TRANS.bas:25 restores a saved game by reading exactly these variables:
//   SM, GT, SH, PO, GN, DR, H, R, W, V, WF, VR, ZZ, YN$
// plus P (room) and TU (turn count) from TRANS.bas:50. They are named below so
// that save/restore is `serializeState` / `deserializeState` and nothing else.
//
// H is deliberately absent: it is the carried count, which is derivable from
// objectLoc. Storing it separately is what let the original drift.

import { CARRIED, GONE, START_HOUR, START_ROOM } from "./constants.js";

/**
 * The fourteen saved flags, with what has been confirmed about each so far.
 * Unconfirmed ones carry the TRANS.bas lines that touch them; fill in the
 * meaning as each puzzle gets ported rather than guessing now.
 */
export function createFlags() {
  return {
    /** The stump's writing has been revealed with acid (4867); read at 9760. */
    SM: 0,
    /** A passage/gate stands open: `IF GT THEN P=11` (6010), locked check at 1550. */
    GT: 0,
    /** Set at TRANS.bas:7783. Precondition for PO (4855) and for the 7900 endgame. */
    SH: 0,
    /** Set at 4855 when SH is set ("YOU ALREADY DID!" at 4815); gates 7900. */
    PO: 0,
    /** Something has already been done: "IT ALREADY IS." (4502). */
    GN: 0,
    /** Wand drawn -- set when object 26 is carried (6320), cleared at 6415. */
    DR: 0,
    /** Vampire progress flag: `IF VR THEN P=37` (6095), endgame test at 7350. */
    VR: 0,
    /** Werewolf progress flag: tested at 7090. */
    WF: 0,
    /** Room-ish index: 10 at start (874), 11 once object 24 is in room 7 (4190). */
    ZZ: 10,
    /** The player's name, from the guest register at TRANS.bas:874. */
    YN: "",
  };
}

/**
 * Turn stamps for the timed threats. TRANS.bas keeps these as plain variables
 * and compares them against TU; -1 means "not currently pending".
 *   V: turn the vampire (object 39) was last present -- death at TU-V=1 (7015).
 *   W: turn the werewolf (object 34) was last present -- death at TU-W=1 (7020).
 *   R: baseline for the shooting-star message at TU-R=20 (7030).
 */
export function createTimers() {
  return { V: -1, W: -1, R: -21 };
}

/**
 * @typedef {object} GameState
 * @property {number} room                    P in TRANS.bas.
 * @property {number} turns                   TU in TRANS.bas.
 * @property {number} hour                    Y -- the tower clock.
 * @property {Record<number, number>} objectLoc  P%() -- object id -> room / CARRIED / GONE.
 * @property {ReturnType<typeof createFlags>} flags
 * @property {ReturnType<typeof createTimers>} timers
 */

/**
 * Objects a debug tester starts carrying instead of having to find them the
 * normal way -- the flintlock pistol (17) and its bullet (22), the wooden
 * cross (6) that fends off the vampire, the magic elixir (36) that wakes
 * Sabrina, and the small black metal box (27) that opens the sarcophagus.
 * None of this is part of the original game; it exists purely so a tester
 * can jump straight to a room (see ui/debug.js's `/room`) without first
 * replaying the whole item-collecting route. See ui/debugMode.js for the
 * toggle that turns this on.
 * @type {number[]}
 */
export const DEBUG_STARTING_ITEMS = [17, 22, 6, 36, 27];

/**
 * A fresh game, with every object at its starting location.
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {{debugInventory?: boolean}} [options]
 * @returns {GameState}
 */
export function createState(world, options = {}) {
  /** @type {Record<number, number>} */
  const objectLoc = {};
  const objects =
    world?.objects instanceof Map ? world.objects.values() : (world?.objects ?? []);
  for (const object of objects) {
    objectLoc[object.id] = object.loc;
  }
  if (options.debugInventory) {
    for (const objectId of DEBUG_STARTING_ITEMS) objectLoc[objectId] = CARRIED;
  }
  return {
    room: START_ROOM,
    turns: 0,
    hour: START_HOUR,
    objectLoc,
    objectNames: {},
    objectTakeable: {},
    nounMapOverrides: {},
    flags: createFlags(),
    timers: createTimers(),
    visitedRooms: [START_ROOM],
    isGameOver: false,
    isDead: false,
  };
}

/**
 * How many things the player is holding. Derived, never stored.
 * @param {GameState} state
 */
export function carriedCount(state) {
  return Object.values(state.objectLoc).filter((loc) => loc === CARRIED).length;
}

/** @param {GameState} state @param {number} objectId */
export function isCarried(state, objectId) {
  return state.objectLoc[objectId] === CARRIED;
}

/** @param {GameState} state @param {number} objectId */
export function isGone(state, objectId) {
  return state.objectLoc[objectId] === GONE;
}

/**
 * @param {GameState} state
 * @param {number} objectId
 * @param {number} location  Room id, CARRIED or GONE.
 */
export function placeObject(state, objectId, location) {
  state.objectLoc[objectId] = location;
}

/**
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {GameState} state
 * @param {number} objectId
 * @returns {string}
 */
export function getObjectName(world, state, objectId) {
  return state?.objectNames?.[objectId] ?? world.object(objectId).name;
}

/**
 * @param {GameState} state
 * @param {number} objectId
 * @param {string} name
 */
export function setObjectName(state, objectId, name) {
  if (!state.objectNames) state.objectNames = {};
  state.objectNames[objectId] = name;
}

/**
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {GameState} state
 * @param {number} objectId
 * @returns {boolean}
 */
export function isObjectTakeable(world, state, objectId) {
  if (state?.objectTakeable && state.objectTakeable[objectId] !== undefined) {
    return Boolean(state.objectTakeable[objectId]);
  }
  return Boolean(world.object(objectId).takeable);
}

/**
 * @param {GameState} state
 * @param {number} objectId
 * @param {number | boolean} takeable
 */
export function setObjectTakeable(state, objectId, takeable) {
  if (!state.objectTakeable) state.objectTakeable = {};
  state.objectTakeable[objectId] = takeable ? 1 : 0;
}

/**
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {GameState} state
 * @param {number} X  1-based noun id
 * @returns {number}
 */
export function getNounMapEntry(world, state, X) {
  if (state?.nounMapOverrides && state.nounMapOverrides[X] !== undefined) {
    return state.nounMapOverrides[X];
  }
  return world.nounMap ? (world.nounMap[X - 1] ?? 0) : 0;
}

/**
 * @param {GameState} state
 * @param {number} X  1-based noun id
 * @param {number} target
 */
export function setNounMapEntry(state, X, target) {
  if (!state.nounMapOverrides) state.nounMapOverrides = {};
  state.nounMapOverrides[X] = target;
}

/**
 * @param {GameState} state
 * @returns {string}
 */
export function serializeState(state) {
  return JSON.stringify(state);
}

/**
 * @param {string} json
 * @returns {GameState}
 */
export function deserializeState(json) {
  const parsed = JSON.parse(json);
  // Merge over a fresh set so a save written before a flag existed still loads.
  return {
    ...parsed,
    objectNames: { ...parsed.objectNames },
    objectTakeable: { ...parsed.objectTakeable },
    nounMapOverrides: { ...parsed.nounMapOverrides },
    flags: { ...createFlags(), ...parsed.flags },
    timers: { ...createTimers(), ...parsed.timers },
    visitedRooms: Array.isArray(parsed.visitedRooms)
      ? [...parsed.visitedRooms]
      : [parsed.room ?? START_ROOM],
    isGameOver: Boolean(parsed.isGameOver),
    isDead: Boolean(parsed.isDead),
  };
}
