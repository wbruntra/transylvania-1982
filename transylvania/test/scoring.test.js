// Added -- not in TRANS.bas, which has no scoring at all. See scoring.js.
//
// A "completionist" playthrough distinct from winnable.test.js's shortest
// route: it deliberately visits every scored action, including the ones
// nothing downstream depends on (eating the bread, pouring the acid,
// climbing a tree), in a plausible order -- notably feeding the bullfrog
// before saying IJNID to the goblin, since the frog is where the word comes
// from. Reaching MAX_SCORE at the end is the proof that every awardPoints
// call site actually fires from its real trigger, not just that the
// function exists.
//
// Room jumps (`engine.state.room = N`) stand in for navigation between
// scenes; winnable.test.js already proves the map is actually walkable.
// What this test is checking is the scoring hooks, so only the triggering
// command itself needs to be the real thing a player would type.

import assert from "node:assert/strict";
import test from "node:test";

import { CARRIED, GONE } from "../src/engine/constants.js";
import { MAX_SCORE } from "../src/engine/scoring.js";
import { createTestEngine } from "./helpers.js";

test("a completionist playthrough scores every point in the game", async () => {
  const engine = await createTestEngine();
  const s = engine.state;

  // --- Flavor and lore, worth doing but nothing depends on them ----------
  s.room = 3;
  assert.deepEqual(engine.run("read note"), ["'SABRINA DIES AT DAWN!'"]);
  assert.equal(s.scored.readNote, true);

  s.room = 15;
  engine.run("read sign");
  assert.equal(s.scored.readSign, true);

  s.room = 5;
  engine.run("get cross");
  assert.equal(s.scored.takeCross, true);
  assert.equal(s.objectLoc[6], CARRIED);

  s.room = 24;
  engine.run("eat bread");
  assert.equal(s.scored.eatBread, true);

  s.room = 20;
  engine.run("eat garlic");
  assert.equal(s.scored.eatGarlic, true);
  engine.run("get trap"); // baited mousetrap, for the cat/mice chain below
  assert.equal(s.objectLoc[40], CARRIED);

  s.room = 16;
  engine.run("drink water");
  assert.equal(s.scored.drinkWater, true);

  s.room = 1;
  engine.run("climb tree");
  assert.equal(s.scored.climbTree, true);

  s.room = 16;
  engine.run("climb willow");
  assert.equal(s.scored.climbWillow, true);

  // --- The coffin, which is where the mice actually come from ------------
  s.room = 38;
  engine.run("open coffin");
  assert.equal(s.scored.openCoffin, true);
  assert.equal(s.objectLoc[20] > 0 || s.objectLoc[20] === 74, true, "mice loosed");

  // Mice take a couple of ticks to wander out of the wagon and into the loop.
  s.objectLoc[20] = 19; // fast-forward to one tick before the trapped room
  s.room = 2;
  engine.run("set trap");
  assert.equal(s.scored.setTrap, true);
  engine.run("look"); // mice wander 19 -> 2, into the trap
  assert.equal(s.scored.catchMice, true);
  assert.equal(s.flags.TC, 1);
  engine.run("get trap");
  assert.equal(s.objectLoc[40], CARRIED);

  s.room = 7;
  assert.equal(s.objectLoc[24], 7, "cat still guarding the hut");
  engine.run("open trap");
  assert.equal(s.scored.distractCat, true);
  assert.equal(s.objectLoc[24], GONE);

  engine.run("get acid");
  engine.run("get broom");
  assert.equal(s.objectLoc[1], CARRIED);
  assert.equal(s.objectLoc[25], CARRIED);

  engine.run("ride broom");
  assert.equal(s.scored.rideBroom, true);
  assert.equal(s.room, 15);

  // --- The stump: pour first (flavor), then knock (the actual door) ------
  s.room = 1;
  engine.run("pour acid");
  assert.equal(s.scored.pourAcid, true);
  assert.equal(engine.run("read stump")[0], "THE WRITING SAYS 'KNOCK HERE'.");

  const knockRes = engine.run("knock stump");
  assert.equal(s.scored.knockStump, true);
  assert.equal(s.room, 9);
  assert.equal(knockRes[0], "POOF!");

  // --- The cave: the book, the flies, and (once we have a pick) the door -
  engine.run("read book");
  assert.equal(s.scored.readBook, true);

  s.objectLoc[31] = CARRIED; // flypaper, normally fetched from room 29
  engine.run("catch flies");
  assert.equal(s.scored.catchFlies, true);
  assert.equal(s.objectLoc[7], CARRIED);

  // --- The cabin's secret passage, and the cloak's lock pick -------------
  s.room = 21;
  engine.run("pull antlers");
  assert.equal(s.scored.pullAntlers, true);
  assert.equal(s.room, 22);

  engine.run("look cloak"); // finds the lock pick hidden in it (rules.js)
  assert.equal(s.scored.getLockPick, true);
  engine.run("get cloak");
  engine.run("get lock pick");
  assert.equal(s.objectLoc[3], CARRIED);
  assert.equal(s.objectLoc[26], CARRIED);

  s.room = 9;
  engine.run("pick lock");
  assert.equal(s.scored.pickCaveDoor, true);
  assert.equal(s.flags.DR, 1);

  s.room = 10;
  engine.run("look crystal");
  assert.equal(s.scored.lookCrystalBall, true);

  // --- Feed the frog *before* saying IJNID -- the word comes from him ----
  s.room = 16;
  assert.equal(s.scored.sayIjnid, undefined, "IJNID not learned yet");
  engine.run("feed frog");
  assert.equal(s.scored.feedFrog, true);
  assert.equal(s.scored.sayIjnid, undefined, "still hasn't been said");

  s.room = 26;
  engine.run("say ijnid");
  assert.equal(s.scored.sayIjnid, true);
  engine.run("get key");
  assert.equal(s.objectLoc[11], CARRIED, "goblin's key");

  // --- The cemetery shaft down to the secret chamber ----------------------
  s.room = 5;
  engine.run("move gravestone");
  assert.equal(s.scored.moveGravestone, true);
  engine.run("unlock grate");
  assert.equal(s.scored.unlockGrate, true);
  engine.run("climb ladder");
  assert.equal(s.scored.climbToChamber, true);
  assert.equal(s.room, 11);
  engine.run("get elixir");
  assert.equal(s.objectLoc[36], CARRIED);

  // --- Load, and use, the pistol on the werewolf --------------------------
  s.room = 25;
  engine.run("get pistol");
  s.objectLoc[22] = CARRIED; // silver bullet, normally from the coffin
  engine.run("load pistol");
  assert.equal(s.scored.loadPistol, true);

  s.objectLoc[34] = s.room;
  engine.run("shoot werewolf");
  assert.equal(s.scored.shootWerewolf, true);
  assert.equal(s.flags.WF, 1);

  // --- The vampire, the treasure room, and the trapped creature ----------
  s.objectLoc[39] = s.room;
  engine.run("wave cross");
  assert.equal(s.scored.waveCross, true);
  assert.equal(s.flags.VR, 1);

  s.room = 35;
  engine.run("open coffer");
  assert.equal(s.scored.openCoffer, true);
  engine.run("get ring");
  assert.equal(s.objectLoc[5], CARRIED);

  s.room = 4;
  engine.run("wave ring");
  assert.equal(s.scored.waveRing, true);

  // --- The tower: the ladder, the vines, and the saucer's box -------------
  s.room = 36;
  engine.run("climb ladder");
  assert.equal(s.scored.climbTowerLadder, true);
  assert.equal(s.room, 37);

  engine.run("move vines");
  assert.equal(s.scored.moveVines, true);

  s.room = 4;
  s.objectLoc[28] = 4; // the saucer, normally dropped by the shooting star
  engine.run("go ufo");
  assert.equal(s.scored.goUfo, true);
  assert.equal(s.objectLoc[27], CARRIED);

  engine.run("push button"); // harmless flavor, out here in the forest
  assert.equal(s.scored.pressButtonElsewhere, true);

  s.room = 37;
  engine.run("push button"); // the actual, plot-critical use
  assert.equal(s.scored.pushButton, true);

  // --- Wake the princess, and sail her home -------------------------------
  engine.run("wave elixir");
  assert.equal(s.scored.waveElixir, true);
  engine.run("pour elixir");
  assert.equal(s.scored.pourElixir, true);
  engine.run("clap");
  assert.equal(s.scored.clapHands, true);
  engine.run("get princess");
  assert.equal(s.objectLoc[38], CARRIED);

  s.room = 16;
  const win = engine.run("sail boat");
  assert.equal(s.scored.sailBoat, true);
  assert.equal(win.some((line) => line.includes(`OUT OF ${MAX_SCORE} POINTS`)), true);

  // --- Every declared event fired exactly the once ------------------------
  assert.equal(s.score, MAX_SCORE);
});

test("SCORE reports progress without spoiling what's left to find", async () => {
  const engine = await createTestEngine();

  // Nothing done yet: no "things you have done" section, and no list of
  // what's missing -- only a count. Listing the remaining labels would be a
  // walkthrough.
  const fresh = engine.run("score");
  assert.deepEqual(fresh, [
    `YOU HAVE SCORED 0 OUT OF ${MAX_SCORE} POINTS.`,
    "THERE ARE 40 MORE THINGS LEFT TO DISCOVER.",
  ]);
  assert.equal(fresh.some((line) => line.includes("BULLFROG") || line.includes("SARCOPHAGUS")), false);

  // SCORE does not cost a turn.
  assert.equal(engine.state.turns, 0);

  // Doing one thing names *that* thing (an achievement log), but still never
  // names anything still undone.
  engine.state.room = 24;
  engine.run("eat bread");
  const afterOne = engine.run("score");
  assert.deepEqual(afterOne, [
    `YOU HAVE SCORED 1 OUT OF ${MAX_SCORE} POINTS.`,
    "THINGS YOU HAVE DONE:",
    "  - EAT THE STALE LOAF OF BREAD",
    "THERE ARE 39 MORE THINGS LEFT TO DISCOVER.",
  ]);
});
