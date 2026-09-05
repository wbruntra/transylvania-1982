// Loading and validating the extracted game data.
//
// The engine never fetches anything itself: callers hand it a parsed data
// object. That is what lets the browser fetch it over HTTP while tests read the
// same file off disk.

/**
 * @typedef {object} RawRoom
 * @property {number} id
 * @property {number} type       Room type (RT% in TRANS.bas): drives scene art.
 * @property {string} desc
 * @property {Record<string, number>} exits  Direction code -> room id, 0 = none.
 *
 * @typedef {object} RawObject
 * @property {number} id
 * @property {string} name
 * @property {number} loc        Starting room id, or CARRIED / GONE.
 * @property {number} takeable
 *
 * @typedef {object} GameData
 * @property {RawRoom[]} rooms
 * @property {RawObject[]} objects
 * @property {number[]} noun_map_N   N%() -- noun aliasing table, 171 entries.
 * @property {string[]} verb_targets The 89 ON..GOTO targets at TRANS.bas:1165.
 * @property {{NZ: number, M: number, LZ: number}} counts
 */

const REQUIRED_KEYS = [
  "rooms",
  "objects",
  "verbs",
  "nouns",
  "noun_map_N",
  "verb_targets",
  "counts",
];

/**
 * Checks that a parsed game.json has everything the engine relies on.
 * @param {unknown} data
 * @returns {GameData}
 */
export function validateGameData(data) {
  if (data === null || typeof data !== "object") {
    throw new TypeError("game data must be an object");
  }
  const missing = REQUIRED_KEYS.filter((key) => !(key in data));
  if (missing.length > 0) {
    throw new Error(
      `game data is missing ${missing.join(", ")} -- regenerate it with 'node tools/sync-data.mjs'`,
    );
  }
  const { rooms, objects, counts } = /** @type {GameData} */ (data);
  if (rooms.length !== counts.LZ) {
    throw new Error(`game data declares ${counts.LZ} rooms but contains ${rooms.length}`);
  }
  if (objects.length !== counts.M) {
    throw new Error(`game data declares ${counts.M} objects but contains ${objects.length}`);
  }
  return /** @type {GameData} */ (data);
}

/**
 * Fetches and validates the game data. Browser-only; tests read the file
 * directly and call {@link validateGameData}.
 * @param {string} [url]
 * @returns {Promise<GameData>}
 */
export async function fetchGameData(url = "game.json") {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`could not load ${url}: ${response.status} ${response.statusText}`);
  }
  return validateGameData(await response.json());
}
