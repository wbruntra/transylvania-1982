// Per-situation special cases, as data.
//
// The bulk of TRANS.bas is flat lists of tests like
//
//   1505 IF X=37 AND P=2 THEN PRINT "THERE'S AN OLD, WOODEN COFFIN IN IT."
//   1515 IF X=34 AND P%(34)=P THEN PRINT "HIS HAIR IS PERFECT."
//   1550 IF X=27 AND P%(13)=P AND NOT GT THEN 200
//
// which is a table, not control flow: (verb, noun, room, object-present, flag)
// -> say something and maybe change the world. Porting them as nested `if`s
// would reproduce the spaghetti in a new language, so they go here instead --
// greppable, testable, and diffable line-for-line against the listing.
//
// The table is empty on purpose. The noun ids these tests key on (X=37, X=34)
// only become words once the disk image's word table is extracted, so filling
// this in now would mean guessing at what the player types. The mechanism is
// here and tested; add entries as each noun is confirmed.

import { MESSAGES } from "./messages.js";
import { awardPoints } from "./scoring.js";
import { isCarried, placeObject, setObjectName } from "./state.js";
import { resolveNoun, resolveVerb } from "./vocabulary.js";
import { objectsInRoom } from "./world.js";

/**
 * @typedef {object} RuleCondition
 * @property {string} [verb]            Canonical verb, e.g. "look".
 * @property {number} [I]               1-based verb id from world.verbs.
 * @property {string | string[]} [noun] Noun(s) the player typed (substring match; array matches any).
 * @property {number | number[]} [X]    1-based noun id(s) from world.nouns.
 * @property {number | number[]} [room] Player must be in this room (or one of them).
 * @property {number} [maxRoomType]     Player must be in room where room.type <= maxRoomType.
 * @property {number} [objectInRoom]    This object id must be in the room.
 * @property {number} [objectCarried]   This object id must be carried.
 * @property {number} [objectPresent]   This object id must be in the room or carried.
 * @property {Record<number, number>} [objectLocEquals] Object id -> required location.
 * @property {string} [flag]            Flag that must be truthy.
 * @property {string[]} [flags]         Flags that must all be truthy.
 * @property {string} [notFlag]         Flag that must be falsy.
 *
 * @typedef {object} RuleEffect
 * @property {string | string[] | ((context: import("./commands/index.js").CommandContext) => string | string[])} [say]
 * @property {Record<string, unknown>} [setFlags]  Flags to assign.
 * @property {Record<number, number>} [placeObjects]  objectId -> new location.
 * @property {number} [goToRoom]
 * @property {string} [points]  Scoring event key (scoring.js) to award once.
 * @property {(context: import("./commands/index.js").CommandContext) => void} [apply]
 *
 * @typedef {{when: RuleCondition, then: RuleEffect, source?: string}} Rule
 */

/**
 * Purely decorative additions -- not in TRANS.bas -- catalogued one room at a
 * time. Everything examinable in a given room lives together in one list, so
 * adding a new prop means scanning a handful of entries for a word that's
 * already claimed, not scrolling the whole file.
 *
 * These match on the word the player typed (`words`, checked via `noun` in
 * `ruleMatches`), not a hand-counted noun-table id (`X`). That's deliberate:
 * X ids are 1-based positions in world.nouns that TRANS.bas's N%() alias
 * table can silently redirect (e.g. "HEADS" isn't headgear, it's an alias for
 * GRAVESTONE). Getting that arithmetic wrong is exactly how "HEADS" almost
 * ended up meaning the deer trophy here. Matching on the typed word sidesteps
 * the arithmetic entirely -- there's no index to miscount.
 * @type {Record<number, { label: string, items: { words: string[], say: string }[] }>}
 */
const ROOM_SCENERY = {
  21: {
    label: "Log cabin",
    items: [
      {
        words: ["deer", "antlers", "horns", "head"],
        say: "AN IMPRESSIVE SPECIMEN. THOSE ANTLERS LOOK STURDY ENOUGH TO HANG ONTO.",
      },
      {
        words: ["fireplace", "mantel", "kettle", "jug", "jugs"],
        say: "A COLD STONE FIREPLACE, LONG SINCE GONE OUT. A CAST-IRON KETTLE AND A COUPLE OF CHIPPED CLAY JUGS SIT ON THE MANTEL.",
      },
      {
        words: ["table", "stool", "plate", "meal", "bone"],
        say: "A ROUGH-HEWN TABLE AND STOOL. A WOODEN PLATE WITH A HALF-EATEN MEAL SITS ON THE TABLE. SOMEONE ATE HERE NOT LONG AGO.",
      },
    ],
  },
};

/** @type {Rule[]} */
const SCENERY_RULES = Object.entries(ROOM_SCENERY).flatMap(([room, { items }]) =>
  items.map(({ words, say }) => ({
    when: { verb: "look", room: Number(room), noun: words },
    then: { say },
    source: "added",
  })),
);

/** @type {Rule[]} */
export const RULES = [
  // Tier 2: FEED / DROP (TRANS.bas:4047, 4100, 4190)
  {
    when: { verb: "feed", X: [10, 65, 141], room: 16, objectInRoom: 8, objectCarried: 7 },
    then: {
      say: [
        "THE BULLFROG SPRINGS FORWARD AND WOLFS DOWN THE FLIES. 'THANKS,' HE SAYS, 'THAT HOWLING SURE WHETS YOUR APPETITE. SAY",
        "'IJNID' TO THE GOBLIN FOR ME.' HE HOPS INTO THE MURKY WATERS OF THE LAKE AND VANISHES.",
      ],
      placeObjects: { 7: -1, 8: -1 },
      points: "feedFrog",
    },
    source: "TRANS.bas:4300, 4100",
  },
  {
    when: { verb: "drop", X: [65, 141], room: 16, objectInRoom: 8, objectCarried: 7 },
    then: {
      say: [
        "THE BULLFROG SPRINGS FORWARD AND WOLFS DOWN THE FLIES. 'THANKS,' HE SAYS, 'THAT HOWLING SURE WHETS YOUR APPETITE. SAY",
        "'IJNID' TO THE GOBLIN FOR ME.' HE HOPS INTO THE MURKY WATERS OF THE LAKE AND VANISHES.",
      ],
      placeObjects: { 7: -1, 8: -1 },
      points: "feedFrog",
    },
    source: "TRANS.bas:4047, 4100",
  },
  {
    // TRANS.bas:4190 - Releasing mice in Room 7 distracts the cat guard
    when: { verb: ["drop", "release", "feed", "give"], X: [31, 20], room: 7, objectInRoom: 24, objectCarried: 20 },
    then: {
      say: "THE MICE RUN AWAY AND THE CAT CHASES AFTER THEM.",
      placeObjects: { 20: -1, 24: -1 },
      points: "distractCat",
      apply: ({ state }) => {
        if (!state.timers) state.timers = {};
        state.timers.ZZ = 11;
      },
    },
    source: "TRANS.bas:4190",
  },
  {
    // LOOK CAT in Room 7
    when: { verb: "look", X: 21, room: 7, objectInRoom: 24 },
    then: { say: "THE FIERCE BLACK CAT SCOWLS SUSPICIOUSLY, GUARDING THE HUT." },
    source: "TRANS.bas:1599/3061",
  },

  // Added -- not in TRANS.bas: the mousetrap (object 40). GET MICE no longer
  // works by itself (take.js) -- the mice have to be caught in the trap
  // (turnHooks.js) first. This rule (releasing caught mice at the cat) is
  // listed before the general "set the trap down" rule below because it's
  // the more specific case and `runRules` takes the first match: DROP TRAP
  // in room 7 with the cat there and mice already caught must win over the
  // generic "you set the trap down" response.
  {
    when: {
      verb: ["drop", "open"],
      noun: ["trap", "mice"],
      room: 7,
      objectInRoom: 24,
      objectCarried: 40,
      flag: "TC",
    },
    then: {
      say: "YOU OPEN THE TRAP -- THE MICE BOLT OUT AND THE CAT CHASES AFTER THEM.",
      setFlags: { TC: 0 },
      placeObjects: { 20: -1, 24: -1 },
      points: "distractCat",
      apply: ({ state }) => {
        setObjectName(state, 40, "MOUSETRAP BAITED WITH CHEESE.");
        if (!state.timers) state.timers = {};
        state.timers.ZZ = 11;
      },
    },
    source: "added",
  },
  // SET/DROP/PLACE TRAP: the game already groups equivalent verbs under one
  // canonical name (vocabulary.js's VERBS table) -- "set" is a synonym of
  // "sail" (from "set sail"), "drop"/"leave"/"give" of "drop", and
  // "put"/"place"/"insert" of "put". Matching all three canonical verbs here
  // means SET TRAP, DROP TRAP, LEAVE TRAP and PLACE TRAP all arm it the same
  // way, for free, without adding new parser vocabulary.
  {
    when: { verb: ["sail", "drop", "put"], noun: "trap", objectCarried: 40 },
    then: {
      say: "YOU SET THE MOUSETRAP ON THE GROUND, BAITED AND READY.",
      points: "setTrap",
      apply: ({ state }) => placeObject(state, 40, state.room),
    },
    source: "added",
  },
  {
    when: { verb: ["sail", "drop", "put"], noun: "trap", objectInRoom: 40 },
    then: { say: "THE TRAP IS ALREADY SET HERE." },
    source: "added",
  },
  {
    when: { verb: ["sail", "drop", "put"], noun: "trap" },
    then: { say: MESSAGES.dontHaveIt },
    source: "added",
  },

  // Tier 2: CLAP (TRANS.bas:7900, 7915)
  {
    when: { verb: "clap", room: 37, flags: ["PO", "SH"] },
    then: {
      say: "THE DAMSEL STIRS A LITTLE AND FINALLY AWAKENS.",
      placeObjects: { 16: -1, 38: 37 },
      points: "clapHands",
      apply: ({ world }) => {
        world.object(38).takeable = 1;
        if (world.nounMap) world.nounMap[70] = 38; // N%(71) = 38
      },
    },
    source: "TRANS.bas:7900, 7915",
  },

  // Tier 2: SAY/YELL (TRANS.bas:8510)
  {
    when: { verb: "say", X: 81, room: 26, objectInRoom: 10 },
    then: {
      say: [
        "OKAY.",
        "THE GOBLIN DROPS THE KEY AND FLEES SCREAMING INTO THE DARKNESS...",
      ],
      placeObjects: { 10: -1, 11: 26 },
      points: "sayIjnid",
    },
    source: "TRANS.bas:8510",
  },

  // Tier 2: STRIKE/KNOCK/HIT (TRANS.bas:9820)
  {
    when: { verb: "strike", X: 49, room: 1 },
    then: { say: "POOF!", goToRoom: 9, points: "knockStump" },
    source: "TRANS.bas:9820",
  },

  // LOOK <thing> table (TRANS.bas:1500-1575)
  {
    when: { verb: "look", X: 10, objectInRoom: 8 },
    then: { say: "IT LOOKS RATHER PECKISH." },
    source: "TRANS.bas:1500",
  },
  {
    when: { verb: "look", X: 37, room: 2 },
    then: { say: "THERE'S AN OLD, WOODEN COFFIN IN IT." },
    source: "TRANS.bas:1505",
  },
  {
    when: { verb: "look", X: 30, objectInRoom: 37 },
    then: { say: "IT LOOKS BACK." },
    source: "TRANS.bas:1507",
  },
  {
    when: { verb: "look", X: 13, maxRoomType: 2 },
    then: { say: "SLIPPERY MOSS COVERS THE TREES, MAKING THEM IMPOSSIBLE TO CLIMB." },
    source: "TRANS.bas:1510",
  },
  {
    when: { verb: "look", X: 34, objectInRoom: 34 },
    then: { say: "HIS HAIR IS PERFECT." },
    source: "TRANS.bas:1515",
  },
  {
    when: { verb: "look", X: 52, objectInRoom: 10 },
    then: { say: "HE IS AN OBNOXIOUS-LOOKING CREATURE." },
    source: "TRANS.bas:1520",
  },
  {
    when: { verb: "look", X: 54 },
    then: { say: "I THOUGHT I SAW A LIGHT FLICKERING IN A HIGH TOWER ROOM." },
    source: "TRANS.bas:1525",
  },
  {
    when: { verb: "look", X: 66, objectInRoom: 33 },
    // The extra sentence isn't in TRANS.bas:1530 -- added so a player sees a
    // reason not to GET it (which teleports them out per TRANS.bas:3080)
    // before finding out the hard way, and a nudge toward READ BOOK instead.
    then: { say: "IT'S ENTITLED 'THE JOY OF MAGIC'. INSIDE THE COVER IS WRITTEN 'PROPERTY OF ZIN -- DO NOT REMOVE FROM CABIN'." },
    source: "TRANS.bas:1530",
  },
  {
    when: { verb: "look", X: 71, objectInRoom: 16 },
    then: { say: "SUDDENLY YOUR MISSION SEEMS MUCH MORE WORTHWHILE..." },
    source: "TRANS.bas:1535",
  },
  {
    when: { verb: "look", X: 71, objectInRoom: 38 },
    then: { say: "SUDDENLY YOUR MISSION SEEMS MUCH MORE WORTHWHILE..." },
    source: "TRANS.bas:1535",
  },
  {
    when: { verb: "look", X: 72, room: [24, 25] },
    then: { say: "IN THE DISTANCE YOU SEE A CASTLE WITH A SKULL CHISELED IN ITS SIDE." },
    source: "TRANS.bas:1536",
  },
  {
    when: { verb: "look", X: 75, objectCarried: 27 },
    then: { say: "THERE IS A BUTTON ON ITS SMOOTH BLACK SURFACE." },
    source: "TRANS.bas:1540",
  },
  // Added -- not in TRANS.bas, which never describes the crashed saucer at
  // all: the shooting-star event just drops it into the room-contents list
  // with its bare object name, and the only way to learn GO UFO does
  // anything is to already know to type it. This gives the player something
  // to react to before that leap.
  {
    when: { verb: "look", noun: ["saucer", "ufo"], objectInRoom: 28 },
    then: {
      say: "A SMALL, DOME-SHAPED CRAFT LIES HALF-BURIED IN THE SCORCHED EARTH, TICKING AND HISSING AS IT COOLS. A HATCH HANGS OPEN.",
    },
    source: "added",
  },
  {
    when: { verb: "look", X: 16, objectInRoom: 2 },
    then: { say: "A QUIVERING, MUFFLED VOICE WITHIN THE STATUE CRIES 'HELP!'" },
    source: "TRANS.bas:1545",
  },
  {
    when: { verb: "look", X: 27, objectInRoom: 13, notFlag: "GT" },
    then: { say: "IT'S LOCKED." },
    source: "TRANS.bas:1550",
  },
  {
    when: { verb: "look", X: 25, room: 5 },
    then: {
      say: ({ state }) => `IT SAYS 'HERE LIES ${state.flags.YN || "YOU"}'... AND IT HAS TODAY'S DATE.`,
    },
    source: "TRANS.bas:1555",
  },
  {
    when: { verb: "look", X: 47, objectPresent: 3, objectLocEquals: { 26: -1 } },
    then: {
      say: "YOU FOUND A LOCK PICK IN THE FOLDS OF THE CLOAK'S FABRIC.",
      points: "getLockPick",
      apply: ({ state }) => {
        placeObject(state, 26, state.room);
      },
    },
    source: "TRANS.bas:1560, 1720",
  },
  {
    when: { verb: "look", X: 47, objectPresent: 3 },
    then: { say: "IT IS COVERED WITH SHINY RUNES AND STARS." },
    source: "TRANS.bas:1560, 1700",
  },
  // 1570 -> 1780: the crystal ball, which is the only place the game tells you
  // what the cloak and the ring are for.
  {
    when: { verb: "look", X: 67, room: 10 },
    then: {
      say: [
        "AS YOU GAZE INTO THE CRYSTAL BALL YOU SEE A SMALL ORANGE FLAME BURNING WITH AN UNNATURAL BRILLIANCE. AS YOU PEER",
        "DEEPER INTO THE FIRE, YOU SEE YOURSELF STANDING SOMEWHERE IN THE WOODS, NEAR A STATUE. A FIGURE CLAD IN A WIZARD'S",
        "CLOAK APPROACHES THE STATUE. ON HIS HAND HE WEARS A SHINY GOLD RING WHICH GLOWS WITH A SOFT, WHITE FLAME. WITH A WAVE",
        "OF HIS HAND, EVERYTHING AROUND THE STATUE GOES ABLAZE WITH BRIGHT GREEN FIRE. YOU FEEL A JOLT OF THUNDER AND",
        "RETURN TO YOUR SENSES, STEPPING AWAY FROM THE CRYSTAL BALL.",
      ],
      points: "lookCrystalBall",
    },
    source: "TRANS.bas:1780, 1785-1787",
  },
  {
    when: { verb: "look", X: 67 },
    then: { say: MESSAGES.notHere },
    source: "TRANS.bas:1780",
  },
  {
    when: { verb: "look", X: 61, room: 31 },
    then: { say: "IT'S GLOWING RED HOT." },
    source: "TRANS.bas:1562, 1755",
  },
  {
    when: { verb: "look", X: 61, room: [9, 10], flag: "DR" },
    then: { say: "IT'S ALREADY OPEN." },
    source: "TRANS.bas:1562, 1765",
  },
  {
    when: { verb: "look", X: 61, room: [9, 10], notFlag: "DR" },
    then: { say: "IT'S LOCKED." },
    source: "TRANS.bas:1562, 1770",
  },

  ...SCENERY_RULES,
];

/**
 * @param {Rule} rule
 * @param {import("./commands/index.js").CommandContext} context
 */
export function ruleMatches({ when }, { world, state, command }) {
  if (when.verb !== undefined) {
    const allowedVerbs = Array.isArray(when.verb) ? when.verb : [when.verb];
    if (!allowedVerbs.includes(command.verb)) return false;
  }

  const I =
    command.I ??
    (world ? resolveVerb(world, command.input.split(" ")[0], command.verb) : null);
  if (when.I !== undefined && when.I !== I) return false;

  if (when.room !== undefined) {
    const allowedRooms = Array.isArray(when.room) ? when.room : [when.room];
    if (!allowedRooms.includes(state.room)) return false;
  }

  if (when.maxRoomType !== undefined && world) {
    if (world.room(state.room).type > when.maxRoomType) return false;
  }

  if (when.X !== undefined) {
    const allowed = Array.isArray(when.X) ? when.X : [when.X];
    const candidateXs = [command.X, command.directX, command.indirectX].filter(
      (x) => x !== null && x !== undefined,
    );
    if (candidateXs.length === 0 && world && command.noun) {
      const fallbackX = resolveNoun(world, command.noun, state?.room);
      if (fallbackX) candidateXs.push(fallbackX);
    }
    if (!candidateXs.some((x) => allowed.includes(x))) return false;
  }

  if (when.noun !== undefined) {
    const typed = command.noun.toLowerCase();
    const candidates = Array.isArray(when.noun) ? when.noun : [when.noun];
    if (!candidates.some((n) => typed.includes(n.toLowerCase()))) return false;
  }
  if (when.objectInRoom !== undefined) {
    const present = objectsInRoom(world, state, state.room).some(
      (object) => object.id === when.objectInRoom,
    );
    if (!present) return false;
  }
  if (when.objectCarried !== undefined && !isCarried(state, when.objectCarried)) return false;
  if (when.objectPresent !== undefined) {
    const presentOrCarried =
      objectsInRoom(world, state, state.room).some((object) => object.id === when.objectPresent) ||
      isCarried(state, when.objectPresent);
    if (!presentOrCarried) return false;
  }
  if (when.objectLocEquals !== undefined) {
    for (const [id, loc] of Object.entries(when.objectLocEquals)) {
      if (state.objectLoc[Number(id)] !== loc) return false;
    }
  }
  if (when.flag !== undefined && !state.flags[when.flag]) return false;
  if (when.flags !== undefined && !when.flags.every((f) => state.flags[f])) return false;
  if (when.notFlag !== undefined && state.flags[when.notFlag]) return false;
  return true;
}

/**
 * Applies a rule's effects and returns what to print.
 * @param {Rule} rule
 * @param {import("./commands/index.js").CommandContext} context
 * @returns {string[]}
 */
export function applyRule({ then }, context) {
  const { state } = context;
  if (then.setFlags) Object.assign(state.flags, then.setFlags);
  if (then.placeObjects) {
    for (const [objectId, location] of Object.entries(then.placeObjects)) {
      placeObject(state, Number(objectId), location);
    }
  }
  if (then.goToRoom !== undefined) state.room = then.goToRoom;
  if (then.points) awardPoints(state, then.points);
  if (typeof then.apply === "function") {
    then.apply(context);
  }
  if (!then.say) return [];
  const rendered = typeof then.say === "function" ? then.say(context) : then.say;
  return Array.isArray(rendered) ? rendered : [rendered];
}

/**
 * The first rule that fires for this command, if any. Rules are checked before
 * the generic verb handler, which is how a room-specific response overrides
 * "YOU SEE NOTHING UNUSUAL."
 * @param {import("./commands/index.js").CommandContext} context
 * @param {Rule[]} [rules]
 * @returns {string[] | null}
 */
export function runRules(context, rules = RULES) {
  const rule = rules.find((candidate) => ruleMatches(candidate, context));
  return rule ? applyRule(rule, context) : null;
}
