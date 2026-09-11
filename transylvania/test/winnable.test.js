// Proof that the port is finishable: one game, played from the opening prompt
// to the closing text with nothing but commands a player could type.
//
// Every other test in test/walkthrough.test.js checks a routine in isolation,
// and to do that it puts the world into the state that routine needs --
// `state.room = 37; state.objectLoc[16] = 37`. That is the right way to test a
// routine, but it means each puzzle is only verified locally: a hand-placed
// object hides a missing way to obtain it, and a hand-placed room hides a
// missing exit. This file assigns nothing. If a link in the chain is missing,
// the walk stops.
//
// It found three when it was written:
//   * TRANS.bas:5920 was not ported, and it is the only line in the listing
//     that puts the black metal box into your hands. Without the box the
//     sarcophagus never opens, so the game could not be won at all.
//   * TRANS.bas:5700-5737 was not wired to GO, so GO GRATE and GO CABIN --
//     which is what the room descriptions tell you to type -- were refused.
//   * Rooms described themselves twice on arrival for every movement that was
//     not an ordinary compass step.

import assert from "node:assert/strict";
import test from "node:test";

import { CARRIED } from "../src/engine/constants.js";
import { createEngine } from "../src/engine/engine.js";
import { MESSAGES } from "../src/engine/messages.js";
import { loadGameData } from "./helpers.js";

const data = await loadGameData();

/**
 * The one random event the ending depends on.
 *
 * The vampire is the reason the whole castle half of the game works: he only
 * appears by chance (TRANS.bas:7350-7355, 20% a turn in rooms 27-37), and
 * destroying him with the cross is what sets VR -- which is what stops the
 * ladder to the tower from being shaken out from under you (6095/6096), and
 * what lets you pick up the ring (3067). So the game cannot be won without
 * him, and a fixed RNG is the only way to write this down as a test.
 *
 * SUPPRESS_ALL sits in the dead band where every probabilistic branch declines
 * to fire: the vampire wants < 0.2, the werewolf >= 0.67, the ambient block
 * <= 0.2, the cat < 0.5. Holding the dice there means the walk below is the
 * player's doing and nothing else's.
 */
const SUPPRESS_ALL = 0.3;
const SUMMON_VAMPIRE = 0.1;

/** Lines that mean the game did not accept a command. */
const REFUSALS = [
  MESSAGES.dontUnderstand,
  MESSAGES.cant,
  MESSAGES.notHere,
  MESSAGES.cantGoThatWay,
  MESSAGES.dontHaveIt,
  MESSAGES.wontBudge,
  MESSAGES.nothingHappened,
  MESSAGES.carryingTooMuch,
  MESSAGES.locked,
  MESSAGES.shookLadder,
];

/**
 * The walkthrough. Each step is a command, optionally with a fragment of the
 * reply that proves it did what it was supposed to.
 * @type {Array<{do: string, say?: string, at?: number}>}
 */
const WALKTHROUGH = [
  // --- The cemetery: the cross, and the grate under the gravestone ---------
  { do: "north", at: 8 },
  { do: "west", at: 3 },
  { do: "north", at: 19 },
  { do: "north", at: 2 },
  { do: "north", at: 5 },
  { do: "take cross", say: MESSAGES.ok },
  { do: "move gravestone", say: "YOU FOUND A GRATE BEHIND THE GRAVESTONE." },

  // --- The goblin's key. IJNID is the word the bullfrog gives you, but the
  //     goblin answers to it whether or not you went and asked. -------------
  { do: "north", at: 14 },
  { do: "south", at: 18 },
  { do: "east", at: 26 },
  { do: "say ijnid", say: "THE GOBLIN DROPS THE KEY AND FLEES SCREAMING INTO THE DARKNESS..." },
  { do: "take key", say: MESSAGES.ok },

  // --- Back to the cemetery, down the grate, out with the elixir -----------
  { do: "north", at: 18 },
  { do: "north", at: 14 },
  { do: "west", at: 5 },
  { do: "unlock grate", say: MESSAGES.ok },
  { do: "go grate", at: 11 },
  { do: "take elixir", say: MESSAGES.ok },
  { do: "exit", at: 5 },
  { do: "drop key", say: MESSAGES.ok }, // Five hands only; the key is spent.

  // --- The wizard's cloak, behind the cabin's spinning wall ----------------
  { do: "south", at: 2 },
  { do: "south", at: 19 },
  { do: "go cabin", at: 21 },
  { do: "pull antlers", at: 22 },
  { do: "take cloak", say: MESSAGES.ok },
  { do: "pull antlers", at: 21 },
  { do: "west", at: 19 },

  // --- Into the castle, and the one moment the game is not deterministic ---
  { do: "north", at: 2 },
  { do: "east", at: 12 },
  { do: "north", at: 13 },
  { do: "north", at: 27 },
  { do: "!rng", say: String(SUMMON_VAMPIRE) },
  { do: "look", say: "THERE IS A VAMPIRE." },
  { do: "!rng", say: String(SUPPRESS_ALL) },
  // He kills you on the turn after he appears (7015), so this cannot wait.
  { do: "wave cross", say: "THE VAMPIRE SHRIEKS AND DISINTEGRATES INTO A PILE OF BURNING DUST." },

  // --- The treasure room. The ring is barred until the vampire is gone. ----
  { do: "north", at: 30 },
  { do: "down", at: 31 },
  { do: "down", at: 34 },
  { do: "down", at: 35 },
  { do: "open coffer", say: MESSAGES.ok },
  // Leave the room with the ring still on the floor and it is gone for good
  // (7003), which is why this happens on the same visit.
  { do: "take ring", say: MESSAGES.ok },

  // --- Out to the clearing: cloak plus ring frees the alien ----------------
  { do: "up", at: 34 },
  { do: "up", at: 31 },
  { do: "up", at: 30 },
  { do: "south", at: 27 },
  { do: "south", at: 13 },
  { do: "south", at: 12 },
  { do: "west", at: 2 },
  { do: "west", at: 17 },
  { do: "north", at: 4 },
  { do: "wave ring", say: "A STREAM OF WHITE FIRE SHOOTS FROM YOUR RING ONTO THE STATUE." },

  // --- Twenty turns until the saucer falls (7030). Read the note while
  //     waiting: it is the game telling you the clock matters. -------------
  { do: "south", at: 17 },
  { do: "south", at: 3 },
  { do: "read note", say: "'SABRINA DIES AT DAWN!'" },
  // Room 3 is one of the five twisted links: you arrived heading south, and
  // north does not take you back -- west does. See test/map.test.js.
  { do: "west", at: 17 },
  { do: "north", at: 4 },
  ...Array.from({ length: 14 }, () => ({ do: "look" })),
  { do: "look", say: "I THOUGHT I SAW A SHOOTING STAR!" },

  // --- The black metal box, out of the wreck (5920) ------------------------
  { do: "go ufo", say: "FANTASTIC! UTTERLY FASCINATING!" },

  // --- Back through the castle and up the ladder to the tower --------------
  { do: "east", at: 5 },
  { do: "south", at: 2 },
  { do: "east", at: 12 },
  { do: "north", at: 13 },
  { do: "north", at: 27 },
  { do: "north", at: 30 },
  { do: "up", at: 36 },
  { do: "climb ladder", at: 37 },

  // --- Waking the damsel: vines, box, then the book's three steps ----------
  { do: "move vines", say: "THERE IS A LARGE STONE SARCOPHAGUS." },
  { do: "push button", say: "IN A VIOLENT BLAST THE LID FLIES OFF AND EXPLODES IN" },
  // "WAVE THE CONTAINER TO ENERGIZE THE INGREDIENTS AND POUR CONTENTS ON THE
  // SUBJECT. TO COMPLETE THE SPELL, CLAP YOUR HANDS." -- the magic book, 9720.
  { do: "wave elixir", say: MESSAGES.elixirEnergized },
  { do: "pour elixir", say: MESSAGES.pourEnergizedElixir },
  { do: "clap", say: "THE DAMSEL STIRS A LITTLE AND FINALLY AWAKENS." },
  { do: "talk princess", say: "LET'S GET OUT OF HERE" },
  { do: "take princess", say: MESSAGES.ok },

  // --- Carry her to the lake ----------------------------------------------
  { do: "down", at: 36 },
  { do: "down", at: 30 },
  { do: "south", at: 27 },
  { do: "south", at: 13 },
  { do: "south", at: 12 },
  { do: "west", at: 2 },
  { do: "west", at: 17 },
  { do: "south", at: 3 },
  { do: "south", at: 16 },
  { do: "sail boat", say: "WELL DONE!" },
];

/**
 * Plays a list of steps and returns the engine. `!rng` steps set the dice
 * rather than issuing a command.
 */
function playThrough(steps, { checkRefusals = true } = {}) {
  let dice = SUPPRESS_ALL;
  const engine = createEngine(data, { randomEvents: true, rng: () => dice });
  engine.start();

  const transcript = [];
  for (const step of steps) {
    if (step.do === "!rng") {
      dice = Number(step.say);
      continue;
    }

    const { messages } = engine.execute(step.do);
    transcript.push({ command: step.do, room: engine.state.room, messages });

    const said = messages.join("\n");
    if (step.say) {
      assert.ok(
        said.includes(step.say),
        `after "${step.do}" expected to see ${JSON.stringify(step.say)}, got:\n${said}`,
      );
    }
    if (step.at !== undefined) {
      assert.equal(engine.state.room, step.at, `"${step.do}" should have led to room ${step.at}`);
    }
    if (checkRefusals) {
      const refused = REFUSALS.find((line) => messages.includes(line));
      assert.equal(refused, undefined, `"${step.do}" was refused with ${JSON.stringify(refused)}`);
    }
    if (engine.isGameOver()) break;
  }

  return { engine, transcript };
}

test("the game can be won from the opening prompt using only typed commands", () => {
  const { engine, transcript } = playThrough(WALKTHROUGH);

  const ending = transcript.at(-1).messages.join("\n");
  assert.match(ending, /PRINCESS SABRINA GRACIOUSLY THANKS YOU/);
  assert.match(ending, /WELL DONE!/);
  assert.equal(engine.isGameOver(), true);
  assert.ok(!engine.state.isDead, "won, not died");

  // Reached the lake carrying her, which is what the ending actually tests.
  assert.equal(engine.state.room, 16);
  assert.equal(engine.state.objectLoc[38], CARRIED);
});

test("the walkthrough finishes well before the sun comes up", () => {
  const { engine } = playThrough(WALKTHROUGH);

  // The fifth chime is turn 350 and ends the game (7005 -> 27000). Twenty of
  // the turns below are the wait for the shooting star, which is fixed cost.
  assert.ok(engine.state.turns < 350, `took ${engine.state.turns} turns`);
  assert.equal(engine.state.hour, 1); // one chime heard, at turn 70
});

test("each puzzle in the chain is actually solved along the way", () => {
  const { engine } = playThrough(WALKTHROUGH);
  const { flags, objectLoc } = engine.state;

  assert.equal(flags.GT, 1, "the grate was unlocked with the goblin's key");
  assert.equal(flags.VR, 1, "the vampire was destroyed with the cross");
  assert.equal(flags.SH, 1, "the elixir was waved to energise it");
  assert.equal(flags.PO, 1, "the elixir was poured on the damsel");
  assert.equal(objectLoc[27], CARRIED, "the black box came out of the saucer");
  assert.equal(objectLoc[36], -1, "the elixir was used up");
  assert.equal(objectLoc[16], -1, "the sleeping damsel became the waking princess");
});

test("the ending is unreachable without the vampire", () => {
  // The same route with the dice never dipping: no vampire, so no VR, so the
  // ladder throws you off and the tower -- and the princess -- stay shut.
  const upToTheLadder = WALKTHROUGH.slice(
    0,
    WALKTHROUGH.findIndex((step) => step.do === "climb ladder") + 1,
  ).map((step) => (step.do === "!rng" ? { do: "!rng", say: String(SUPPRESS_ALL) } : step));

  const { engine } = playThrough(
    upToTheLadder.map(({ do: command }) => ({ do: command })),
    { checkRefusals: false },
  );

  assert.equal(engine.state.flags.VR, 0);
  assert.equal(engine.state.room, 36, "the ladder should not have been climbable");
});

// --- The cave behind the stump ---------------------------------------------
//
// KNOCK on the stump drops you into room 9, which has no exits in the data and
// refuses EXIT outright (10019). That reads like a trap, and it is not one: the
// two rooms are where the game keeps its clues, and reaching for the book is
// the door back out. Both lines were missing from the port, which is what made
// it look like a dead end.

test("the cave behind the stump is a hint room with a way out", () => {
  const { engine, transcript } = playThrough([
    // The lock pick is folded into the wizard's cloak (1720), and the pick is
    // what opens the door between the two caves.
    { do: "north", at: 8 },
    { do: "west", at: 3 },
    { do: "north", at: 19 },
    { do: "go cabin", at: 21 },
    { do: "pull antlers", at: 22 },
    { do: "take cloak", say: MESSAGES.ok },
    { do: "look cloak", say: "YOU FOUND A LOCK PICK IN THE FOLDS OF THE CLOAK'S FABRIC." },
    { do: "take pick", say: MESSAGES.ok },
    { do: "pull antlers", at: 21 },
    { do: "west", at: 19 },
    { do: "south", at: 3 },
    { do: "east", at: 8 },
    { do: "south", at: 1 },

    { do: "knock stump", say: "POOF!", at: 9 },
    // Clue one: how the elixir is used. Nothing else in the game says this.
    { do: "read book", say: "TO COMPLETE THE SPELL, CLAP YOUR HANDS." },
    { do: "unlock door", say: MESSAGES.ok },
    { do: "go door", at: 10 },
    // Clue two: the cloak and the ring, together, at the statue -- which is the
    // least guessable step in the walkthrough above.
    { do: "look crystal", say: "A FIGURE CLAD IN A WIZARD'S" },
    { do: "go door", at: 9 },
    // 3080: the way out.
    { do: "take book", say: "IT IS MINE! GO AWAY!", at: 1 },
  ]);

  assert.equal(engine.state.room, 1, "thrown back to the stump, not stranded");
  assert.equal(engine.isGameOver(), false);
  assert.match(transcript.at(-1).messages.join("\n"), /ANCIENT STUMP/);
});

test("the flypaper, the flies and the bullfrog give up the goblin's word", () => {
  // IJNID works on the goblin whether or not you were told it, so this chain is
  // optional -- but it is the only place the game says the word out loud, and
  // catching the flies (3090/3095) is the one use the flypaper has.
  const { engine } = playThrough([
    { do: "north", at: 8 },
    { do: "west", at: 3 },
    { do: "north", at: 19 },
    { do: "north", at: 2 },
    { do: "east", at: 12 },
    { do: "north", at: 13 },
    { do: "north", at: 27 },
    { do: "east", at: 29 },
    { do: "take flypaper", say: MESSAGES.ok },
    { do: "west", at: 27 },
    { do: "south", at: 13 },
    { do: "south", at: 12 },
    { do: "west", at: 2 },
    { do: "west", at: 17 },
    { do: "south", at: 3 },
    { do: "east", at: 8 },
    { do: "south", at: 1 },
    { do: "knock stump", at: 9 },
    { do: "take flies", say: "YOU DID MANAGE TO CATCH SEVERAL OF THEM WITH THE PAPER." },
    { do: "take book", at: 1 },
    { do: "north", at: 8 },
    { do: "west", at: 3 },
    { do: "south", at: 16 },
    { do: "feed bullfrog", say: "'IJNID' TO THE GOBLIN FOR ME." },
  ]);

  assert.equal(engine.state.objectLoc[7], -1, "the flies were eaten");
  assert.equal(engine.state.objectLoc[8], -1, "the frog hopped away");
});

test("bare hands are not enough for the flies", () => {
  const { engine } = playThrough(
    [
      { do: "knock stump", at: 9 },
      { do: "take flies", say: "THE FLIES SCATTERED BEFORE YOU COULD CATCH ANY OF THEM." },
    ],
    { checkRefusals: false },
  );

  assert.notEqual(engine.state.objectLoc[7], CARRIED);
});
