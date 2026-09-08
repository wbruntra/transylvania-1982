// The word list.
//
// The original resolves words to a (verb id, noun id) pair in a machine-language
// routine (TRANS.bas:1000, `CALL 37901`). That routine is TPAR on the disk, and
// its word table -- 89 verbs, 171 nouns, five characters each -- is now in the
// extracted data as `world.verbs` and `world.nouns`.
//
// The table below is the port's own list: the verbs that have handlers, with
// the full spellings a modern player expects. It is deliberately a subset of
// `world.verbs` while the port is in progress. Adding a verb is: add its
// synonyms here, add a handler in commands/. Everything downstream keys off the
// canonical verb name, not the spelling the player used, so switching this file
// over to being generated from `world.verbs` will not disturb the engine.

import { DIRECTION_WORDS } from "./constants.js";

/**
 * Canonical verb -> the words that mean it.
 * `takesObject` decides whether the parser expects a noun after the verb.
 * @type {Record<string, {words: string[], takesObject: boolean}>}
 */
export const VERBS = {
  go: { words: ["go", "walk", "run", "jump"], takesObject: true },
  // LOOK takes an optional noun: bare LOOK describes the room, LOOK <thing>
  // is TRANS.bas:1500-1599, which is rules.js territory.
  look: {
    words: ["look", "l", "examine", "exami", "inspect", "inspe", "search", "searc"],
    takesObject: true,
  },
  inventory: { words: ["inventory", "i"], takesObject: false },
  get: { words: ["get", "take", "grab", "steal", "catch", "lift"], takesObject: true },
  drop: { words: ["drop", "release", "throw", "leave", "give"], takesObject: true },
  help: { words: ["help"], takesObject: true },
  map: { words: ["map", "m", "chart"], takesObject: false },
  quit: { words: ["quit", "end"], takesObject: false },
  save: { words: ["save"], takesObject: false },
  restore: { words: ["restore"], takesObject: false },
  list: { words: ["list"], takesObject: false },

  // Tier 1 canned refusals (PORTING.md)
  hunt: { words: ["hunt"], takesObject: true },
  hold: { words: ["hold"], takesObject: true },
  use: { words: ["use"], takesObject: true },
  put: { words: ["put", "place", "insert", "apply"], takesObject: true },
  break: { words: ["break"], takesObject: true },
  clean: { words: ["clean"], takesObject: true },
  scrape: { words: ["scrape", "scrap"], takesObject: true },
  brush: { words: ["brush"], takesObject: true },
  pet: { words: ["pet"], takesObject: true },
  pat: { words: ["pat"], takesObject: true },
  scream: { words: ["scream", "screa"], takesObject: true },
  sing: { words: ["sing"], takesObject: true },
  kick: { words: ["kick"], takesObject: true },
  shake: { words: ["shake"], takesObject: true },
  sweep: { words: ["sweep"], takesObject: true },
  dust: { words: ["dust"], takesObject: true },
  touch: { words: ["touch"], takesObject: true },
  turn: { words: ["turn"], takesObject: true },
  kill: { words: ["kill"], takesObject: true },
  whistle: { words: ["whistle", "whist"], takesObject: true },
  kiss: { words: ["kiss"], takesObject: true },

  // Tier 2 (PORTING.md)
  pick: { words: ["pick"], takesObject: true },
  feed: { words: ["feed"], takesObject: true },
  wear: { words: ["wear"], takesObject: true },
  close: { words: ["close"], takesObject: true },
  clap: { words: ["clap"], takesObject: false },
  say: { words: ["say", "yell"], takesObject: true },
  strike: { words: ["strike", "strik", "knock", "hit"], takesObject: true },
  listen: { words: ["listen", "liste"], takesObject: false },

  // Tier 3 (PORTING.md)
  load: { words: ["load"], takesObject: true },
  shoot: { words: ["shoot"], takesObject: true },
  fire: { words: ["fire"], takesObject: true },
  pull: { words: ["pull"], takesObject: true },
  pour: { words: ["pour", "spill"], takesObject: true },
  push: { words: ["push", "press"], takesObject: true },
  ride: { words: ["ride"], takesObject: true },
  fly: { words: ["fly"], takesObject: true },
  unlock: { words: ["unlock", "unloc"], takesObject: true },
  lock: { words: ["lock"], takesObject: true },
  eat: { words: ["eat"], takesObject: true },
  drink: { words: ["drink"], takesObject: true },
  climb: { words: ["climb"], takesObject: true },
  open: { words: ["open"], takesObject: true },
  wave: { words: ["wave", "point", "aim"], takesObject: true },
  show: { words: ["show"], takesObject: true },
  move: { words: ["move", "pry"], takesObject: true },
  sail: { words: ["sail", "set", "cast", "row"], takesObject: true },
  read: { words: ["read"], takesObject: true },
  exit: { words: ["exit", "out", "leave"], takesObject: false },
  enter: { words: ["enter", "in"], takesObject: true },
};

/** word -> canonical verb */
const WORD_TO_VERB = new Map(
  Object.entries(VERBS).flatMap(([verb, { words }]) => words.map((word) => [word, verb])),
);

/** word -> direction code */
const WORD_TO_DIRECTION = new Map(
  Object.entries(DIRECTION_WORDS).flatMap(([code, words]) =>
    words.map((word) => [word, code]),
  ),
);

/** @param {string} word @returns {string | null} */
export function lookUpVerb(word) {
  return WORD_TO_VERB.get(word) ?? null;
}

/** @param {string} word @returns {string | null} */
export function lookUpDirection(word) {
  return WORD_TO_DIRECTION.get(word) ?? null;
}

/** @param {string} verb */
export function verbTakesObject(verb) {
  return VERBS[verb]?.takesObject ?? false;
}

/**
 * Resolves a noun id through N%(): a negative entry redirects to another noun.
 * TRANS.bas:1030 -- `IF N%(X)<0 THEN X=-N%(X)`. Unused until the word table is
 * recovered, but the table is carried through so the port can reach it.
 * @param {number[]} nounMap
 * @param {number} nounId
 */
export function resolveNounAlias(nounMap, nounId) {
  const entry = nounMap[nounId - 1];
  return entry !== undefined && entry < 0 ? -entry : nounId;
}

/**
 * Compares a typed word against a table word from TPAR (TPAR words are up to 5 characters).
 * 5-character words match as prefixes (e.g. "CEMETERY" matches "CEMET").
 * Words under 5 characters match exactly (e.g. "CAT" matches "CAT", not "CATTLE").
 *
 * @param {string} word
 * @param {string} tableWord
 * @returns {boolean}
 */
export function matchWord(word, tableWord) {
  if (!word || !tableWord) return false;
  const clean = word.toUpperCase();
  if (tableWord.length === 5) {
    return clean.length >= 5 && clean.slice(0, 5) === tableWord;
  }
  return clean === tableWord;
}

/**
 * Resolves a typed noun string to a 1-based noun id X in world.nouns (1..171).
 * Applies room overrides (TRANS.bas lines 1022, 1024) and noun alias table (line 1030).
 *
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {string} nounStr
 * @param {number} [roomId]
 * @returns {number | null}
 */
export function resolveNoun(world, nounStr, roomId = 0, state = null) {
  if (!nounStr || !world || !world.nouns) return null;

  const words = nounStr
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

  if (words.length === 0) return null;

  let X = null;

  // Check words from right to left (head noun is usually last in English noun phrases)
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    const index = world.nouns.findIndex((tableWord) => matchWord(word, tableWord));
    if (index !== -1) {
      X = index + 1;
      break;
    }
  }

  // If no individual word matched, check if the full string matches
  if (X === null) {
    const full = words.join("");
    const index = world.nouns.findIndex((tableWord) => matchWord(full, tableWord));
    if (index !== -1) {
      X = index + 1;
    }
  }

  if (X === null) return null;

  // TRANS.bas lines 1022 & 1024:
  // 1022 IF X=128 AND P=5 THEN X=25
  // 1024 IF X=128 AND P=37 THEN X=70
  if (X === 128 && roomId === 5) X = 25;
  if (X === 128 && roomId === 37) X = 70;

  // TRANS.bas line 1030:
  // 1030 IF N%(X)<0 THEN X=-N%(X)
  const visited = new Set();
  while (X && !visited.has(X)) {
    visited.add(X);
    const entry =
      state?.nounMapOverrides && state.nounMapOverrides[X] !== undefined
        ? state.nounMapOverrides[X]
        : world.nounMap ? world.nounMap[X - 1] : 0;
    if (entry < 0) {
      X = -entry;
    } else {
      break;
    }
  }

  return X;
}

/**
 * Resolves a verb or first typed word to its 1-based index I in world.verbs (1..89).
 *
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {string} firstWord
 * @param {string} [canonicalVerb]
 * @returns {number | null}
 */
export function resolveVerb(world, firstWord, canonicalVerb = "") {
  if (!world || !world.verbs) return null;

  if (firstWord) {
    const index = world.verbs.findIndex((tableWord) => matchWord(firstWord, tableWord));
    if (index !== -1) return index + 1;
  }

  const canonicalToTable = {
    go: "GO",
    look: "LOOK",
    inventory: "INVEN",
    help: "HELP",
    quit: "QUIT",
    get: "GET",
    drop: "DROP",
    pick: "PICK",
    feed: "FEED",
    wear: "WEAR",
    close: "CLOSE",
    clap: "CLAP",
    say: "SAY",
    strike: "STRIK",
    listen: "LISTE",
    load: "LOAD",
    shoot: "SHOOT",
    fire: "FIRE",
    pull: "PULL",
    pour: "POUR",
    push: "PUSH",
    press: "PRESS",
    ride: "RIDE",
    fly: "FLY",
    unlock: "UNLOC",
    lock: "LOCK",
    eat: "EAT",
    drink: "DRINK",
    climb: "CLIMB",
    open: "OPEN",
    wave: "WAVE",
    show: "SHOW",
    move: "MOVE",
    sail: "SAIL",
    read: "READ",
    exit: "EXIT",
    enter: "ENTER",
    save: "SAVE",
    list: "LIST",
  };

  const directionToTable = {
    N: "NORTH",
    S: "SOUTH",
    W: "WEST",
    E: "EAST",
    U: "UP",
    D: "DOWN",
  };

  const target =
    canonicalToTable[canonicalVerb] ||
    (firstWord ? directionToTable[firstWord.toUpperCase()] : null);
  if (target) {
    const index = world.verbs.indexOf(target);
    if (index !== -1) return index + 1;
  }

  return null;
}
