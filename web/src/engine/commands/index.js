// The verb registry.
//
// This is the file that grows: TRANS.bas dispatches 89 verbs through the
// ON..GOTO at 1165/1167, and each one lands here as a named handler. Adding a
// verb means adding an entry below plus its synonyms in vocabulary.js -- never
// another branch in a parse function.

import { climb } from "./climb.js";
import { close } from "./close.js";
import { drop } from "./drop.js";
import { drink, eat } from "./eat.js";
import { enterStructure, exitStructure } from "./enterExit.js";
import { help, mapCommand, quit, restoreGame, saveGame } from "./meta.js";
import { inventory } from "./inventory.js";
import { listen } from "./listen.js";
import { load } from "./load.js";
import { look } from "./look.js";
import { go } from "./move.js";
import { movePry } from "./movePry.js";
import { open } from "./open.js";
import { pick } from "./pick.js";
import { pour } from "./pour.js";
import { push } from "./push.js";
import { pull } from "./pull.js";
import { read } from "./read.js";
import {
  cant,
  dontUnderstand,
  kiss,
  notHere,
  nothingHappened,
  nothingUnusual,
  whistle,
} from "./refusals.js";
import { fly, ride } from "./ride.js";
import { sail } from "./sail.js";
import { shoot } from "./shoot.js";
import { take } from "./take.js";
import { lock, unlock } from "./unlock.js";
import { wave } from "./wave.js";
import { wear } from "./wear.js";
import { MESSAGES } from "../messages.js";

/**
 * @typedef {object} CommandContext
 * @property {ReturnType<typeof import("../world.js").createWorld>} world
 * @property {import("../state.js").GameState} state
 * @property {import("../parser.js").Command} command
 *
 * @callback CommandHandler
 * @param {CommandContext} context
 * @returns {string[] | {messages: string[], consumeTurn?: boolean} | null}  Lines to print, or null for "I don't understand".
 */

/** @type {Record<string, CommandHandler>} */
export const COMMANDS = {
  go,
  look,
  inventory,
  get: take,
  drop,
  help,
  map: mapCommand,
  quit,
  save: saveGame,
  restore: restoreGame,

  // Known gap: LIST (1110) does not exist in original disk -> 230
  list: dontUnderstand,

  // Tier 1 canned refusals (PORTING.md)
  hunt: notHere, // 210
  hold: dontUnderstand, // 230
  use: dontUnderstand, // 230
  break: cant, // 240
  clean: cant, // 240
  scrape: cant, // 240
  brush: cant, // 240
  pet: cant, // 240
  pat: cant, // 240
  // Known gap: KILL + noun 77 (PASSA) jumps to non-existent 6130 in original -> 230
  kill: ({ command }) => (command.X === 77 ? [MESSAGES.dontUnderstand] : [MESSAGES.cant]), // 5930/5950
  scream: nothingHappened, // 290
  sing: nothingHappened, // 290
  kick: nothingHappened, // 290
  shake: nothingHappened, // 290
  sweep: nothingHappened, // 290
  dust: nothingHappened, // 290
  touch: nothingHappened, // 290
  turn: nothingUnusual, // 1599
  whistle, // 9000
  kiss, // 9600

  // Tier 2 (PORTING.md)
  pick, // 2990
  feed: cant, // 4300 fallback (4310 -> 240)
  wear, // 4400
  close, // 7600
  clap: nothingHappened, // 7900 fallback (290)
  say: () => ["OKAY.", MESSAGES.nothingHappened], // 8500 / 8540
  strike: ({ command }) => (command.X === 49 ? ["HUH?"] : [MESSAGES.nothingHappened]), // 9800 / 9821
  listen, // 9900

  // Tier 3 (PORTING.md)
  load, // 4500
  shoot, // 4600
  fire: shoot, // 4600
  pull, // 4700
  pour, // 4800
  push, // 4900
  press: push, // 4900
  ride, // 6140
  fly, // 6142
  unlock, // 6300
  lock, // 6400
  eat, // 6500
  drink, // 6600
  climb, // 6700
  open, // 7500
  wave, // 7700
  show: wave, // 7700
  move: movePry, // 7800
  pry: movePry, // 7800
  sail, // 9400
  read, // 9700
  exit: exitStructure, // 10000
  out: exitStructure, // 10000
  enter: enterStructure, // 11000
  in: enterStructure, // 11000
};
