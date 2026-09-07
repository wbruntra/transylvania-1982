// Values that TRANS.bas spells out as bare numbers. Named here so the rest of
// the port reads as rules rather than arithmetic.

/** Direction codes, in the order TRANS.bas lists them in D%(room, 0..5). */
export const DIRECTIONS = ["N", "S", "W", "E", "U", "D"];

/** Long spellings the parser accepts for each direction. */
export const DIRECTION_WORDS = {
  N: ["n", "north"],
  S: ["s", "south"],
  W: ["w", "west"],
  E: ["e", "east"],
  U: ["u", "up"],
  D: ["d", "down"],
};

// P%(objectId) holds a room number, or one of these sentinels.
/** Object is in the player's hands. */
export const CARRIED = -2;
/** Object has been removed from play. */
export const GONE = -1;

/** Inventory item-carrying limit removed (formerly H=5 in TRANS.bas). */
export const MAX_CARRIED = Infinity;

/** P=1 at TRANS.bas:874 -- the stump where the game opens. */
export const START_ROOM = 1;

/**
 * Y=12 at TRANS.bas:874; reaching 5 jumps to the death routine at 27000.
 * The clock is not driven yet -- see engine.js `addTurnHook`.
 */
export const START_HOUR = 12;
export const DEATH_HOUR = 5;
