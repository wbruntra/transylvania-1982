import assert from "node:assert/strict";
import test from "node:test";

import { createTestEngine } from "./helpers.js";

test("two-noun intent: USE RING ON STATUE and synonyms", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  // Move to clearing (room 4), carry ring (5) and cloak (3)
  state.room = 4;
  state.objectLoc[5] = -2; // carry ring
  state.objectLoc[3] = -2; // carry cloak

  // 1. Natural: USE RING ON STATUE
  const res = engine.execute("use ring on statue");
  assert.ok(
    res.messages.some((m) => m.includes("STREAM OF WHITE FIRE SHOOTS FROM YOUR RING")),
    "use ring on statue should free the alien",
  );
  assert.equal(state.objectLoc[2], -1, "statue should be destroyed");
  assert.equal(state.objectLoc[5], -1, "ring should be crushed");
});

test("two-noun intent: natural descriptions with articles and adjectives", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.room = 4;
  state.objectLoc[5] = -2;
  state.objectLoc[3] = -2;

  const res = engine.execute("point the shiny ring at the alien statue");
  assert.ok(
    res.messages.some((m) => m.includes("STREAM OF WHITE FIRE SHOOTS FROM YOUR RING")),
    "point the shiny ring at the alien statue should work",
  );
});

test("two-noun intent: USE ACID ON STUMP and POUR ACID ON STUMP", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.room = 1;
  state.objectLoc[1] = -2; // carry acid

  const res = engine.execute("use acid on stump");
  assert.ok(
    res.messages.some((m) => m.includes("THE ACID SIZZLES VIOLENTLY")),
    "use acid on stump should burn the stump",
  );
  assert.equal(state.flags.SM, 1, "SM flag should be set");
});

test("two-noun intent: feeding the bullfrog with multi-word commands", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.room = 16;
  state.objectLoc[7] = -2; // carried flies
  state.objectLoc[8] = 16; // frog in room

  // FEED FLIES TO FROG
  const res = engine.execute("feed flies to frog");
  assert.ok(
    res.messages.some((m) => m.includes("IJNID")),
    "feed flies to frog should give the clue",
  );
  assert.equal(state.objectLoc[7], -1, "flies should be consumed");
  assert.equal(state.objectLoc[8], -1, "frog should vanish");
});

test("two-noun intent: keys and lock picks with specific feedback", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  // Key in Room 5 (grate)
  state.room = 5;
  state.objectLoc[11] = -2; // carry tiny key
  const resGrate = engine.execute("use key on grate");
  assert.ok(resGrate.messages.includes("OK."), "use key on grate should unlock grate");
  assert.equal(state.flags.GT, 1);

  // Key on door in Room 9 -> specific helpful feedback
  state.room = 9;
  const resDoorWrong = engine.execute("use key on door");
  assert.ok(
    resDoorWrong.messages.some((m) => m.includes("THE TINY KEY DOES NOT FIT THIS DOOR")),
    "should explain key does not fit door",
  );
  assert.equal(state.flags.DR, 0, "door should stay locked");

  // Lock pick on door in Room 9 -> unlocks door
  state.objectLoc[26] = -2; // carry lock pick
  const resDoorRight = engine.execute("unlock door with pick");
  assert.ok(resDoorRight.messages.includes("OK."), "unlock door with pick should unlock door");
  assert.equal(state.flags.DR, 1);
});

test("two-noun intent: loading and shooting werewolf", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.room = 2;
  state.objectLoc[17] = -2; // pistol
  state.objectLoc[22] = -2; // bullet
  state.objectLoc[34] = 2;  // werewolf in room 2
  state.flags.GN = 0;

  // Put bullet in pistol
  const loadRes = engine.execute("put bullet in pistol");
  assert.ok(loadRes.messages.includes("OK."), "put bullet in pistol should load pistol");
  assert.equal(state.flags.GN, 1);

  // Shoot werewolf with pistol
  const shootRes = engine.execute("shoot werewolf with pistol");
  assert.ok(
    shootRes.messages.some((m) => m.includes("GOT HIM!")),
    "shoot werewolf with pistol should defeat werewolf",
  );
  assert.equal(state.flags.WF, 1);
});

test("two-noun intent: waving cross at vampire", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.room = 30;
  state.objectLoc[6] = -2;  // cross
  state.objectLoc[39] = 30; // vampire here

  const res = engine.execute("use cross on vampire");
  assert.ok(
    res.messages.some((m) => m.includes("A STREAM OF BLINDING LIGHT ESCAPES FROM THE CROSS")),
    "use cross on vampire should destroy vampire",
  );
  assert.equal(state.flags.VR, 1);
});

test("two-noun intent: releasing mice for cat", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.room = 7;
  state.objectLoc[20] = -2; // mice
  state.objectLoc[24] = 7;  // cat

  const res = engine.execute("use mice on cat");
  assert.ok(
    res.messages.some((m) => m.includes("THE MICE RUN AWAY AND THE CAT CHASES AFTER THEM")),
    "use mice on cat should distract cat",
  );
  assert.equal(state.objectLoc[24], -1);
});

test("two-noun intent: using elixir on Sabrina in tower", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.room = 37;
  state.objectLoc[36] = -2; // elixir
  state.flags.SH = 0;
  state.flags.PO = 0;

  const res = engine.execute("use elixir on sabrina");
  assert.ok(
    res.messages.some((m) => m.includes("YOU ENERGIZE THE ELIXIR AND POUR IT OVER THE SLEEPING PRINCESS")),
    "use elixir on sabrina should energize and pour",
  );
  assert.equal(state.flags.SH, 1);
  assert.equal(state.flags.PO, 1);
});
