import assert from "node:assert/strict";
import test from "node:test";

import { createTestEngine } from "./helpers.js";

test("hint system: USE gives contextual guidance while WAVE solves statue", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  // Move to clearing (room 4), carry ring (5) and cloak (3)
  state.room = 4;
  state.objectLoc[5] = -2; // carry ring
  state.objectLoc[3] = -2; // carry cloak

  // 1. USE gives a helpful hint without solving the puzzle
  const useRes = engine.execute("use ring on statue");
  assert.ok(
    useRes.messages.some((m) => m.includes("HOW DO YOU WANT TO USE THE RING ON THE STATUE")),
    "use ring on statue should guide player towards specific verbs",
  );
  assert.equal(state.objectLoc[2], 4, "statue should still be intact");

  // 2. TOUCH gives sensory feedback
  const touchRes = engine.execute("touch statue");
  assert.ok(
    touchRes.messages.some((m) => m.includes("YOU TOUCH THE STATUE")),
    "touch statue should provide descriptive feedback",
  );

  // 3. Canonical WAVE solves the puzzle
  const waveRes = engine.execute("wave ring at statue");
  assert.ok(
    waveRes.messages.some((m) => m.includes("STREAM OF WHITE FIRE SHOOTS FROM YOUR RING")),
    "wave ring at statue should free the alien",
  );
  assert.equal(state.objectLoc[2], -1, "statue should be destroyed");
  assert.equal(state.objectLoc[5], -1, "ring should be crushed");
});

test("hint system: USE guides ACID on STUMP while POUR solves it", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.room = 1;
  state.objectLoc[1] = -2; // carry acid

  // 1. USE gives a hint
  const useRes = engine.execute("use acid on stump");
  assert.ok(
    useRes.messages.some((m) => m.includes("HOW DO YOU WANT TO USE THE ACID ON THE STUMP")),
    "use acid on stump should guide player toward pour",
  );
  assert.equal(state.flags.SM, 0, "SM flag should not be set yet");

  // 2. TOUCH provides feedback
  const touchRes = engine.execute("touch stump");
  assert.ok(
    touchRes.messages.some((m) => m.includes("YOU TOUCH THE ANCIENT STUMP")),
    "touch stump should give descriptive feedback",
  );

  // 3. Canonical POUR solves it
  const pourRes = engine.execute("pour acid on stump");
  assert.ok(
    pourRes.messages.some((m) => m.includes("THE ACID SIZZLES VIOLENTLY")),
    "pour acid on stump should burn the stump",
  );
  assert.equal(state.flags.SM, 1, "SM flag should be set");
});

test("hint system: USE guides FLIES on FROG while FEED solves it", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.room = 16;
  state.objectLoc[7] = -2; // carried flies
  state.objectLoc[8] = 16; // frog in room

  // 1. USE gives a hint
  const useRes = engine.execute("use flies on frog");
  assert.ok(
    useRes.messages.some((m) => m.includes("HOW DO YOU WANT TO USE THE FLIES ON THE BULLFROG")),
    "use flies on frog should guide player toward feed",
  );
  assert.equal(state.objectLoc[8], 16, "frog should still be present");

  // 2. TOUCH provides feedback
  const touchRes = engine.execute("touch frog");
  assert.ok(
    touchRes.messages.some((m) => m.includes("HOPS BACK WITH AN IRRITATED CROAK")),
    "touch frog should give reactive feedback",
  );

  // 3. Canonical FEED solves it
  const feedRes = engine.execute("feed flies to frog");
  assert.ok(
    feedRes.messages.some((m) => m.includes("IJNID")),
    "feed flies to frog should give the clue",
  );
  assert.equal(state.objectLoc[7], -1, "flies should be consumed");
  assert.equal(state.objectLoc[8], -1, "frog should vanish");
});

test("hint system: keys, lock picks and doors", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  // Key in Room 5
  state.room = 5;
  state.objectLoc[11] = -2;
  const useKeyRes = engine.execute("use key on grate");
  assert.ok(
    useKeyRes.messages.some((m) => m.includes("HOW DO YOU WANT TO USE THE KEY ON THE GRATE")),
    "use key should guide toward unlock",
  );

  const unlockKeyRes = engine.execute("unlock grate with key");
  assert.ok(unlockKeyRes.messages.includes("OK."), "unlock grate with key should work");
  assert.equal(state.flags.GT, 1);

  // Key on door in Room 9 -> distinct error clue
  state.room = 9;
  const wrongKeyRes = engine.execute("use key on door");
  assert.ok(
    wrongKeyRes.messages.some((m) => m.includes("THE TINY KEY DOES NOT FIT THIS DOOR")),
    "should explain key does not fit door",
  );

  // Lock pick on door in Room 9
  state.objectLoc[26] = -2;
  const usePickRes = engine.execute("use pick on door");
  assert.ok(
    usePickRes.messages.some((m) => m.includes("HOW DO YOU WANT TO USE THE LOCK PICK ON THE DOOR")),
    "use pick should guide toward unlock",
  );

  const unlockPickRes = engine.execute("unlock door with pick");
  assert.ok(unlockPickRes.messages.includes("OK."), "unlock door with pick should unlock door");
  assert.equal(state.flags.DR, 1);
});

test("hint system: cat in room 7", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.room = 7;
  state.objectLoc[20] = -2; // mice
  state.objectLoc[24] = 7;  // cat

  // 1. TOUCH cat
  const touchRes = engine.execute("touch cat");
  assert.ok(
    touchRes.messages.some((m) => m.includes("HISSES AND SWATS")),
    "touch cat should give reactive feedback",
  );

  // 2. USE mice
  const useRes = engine.execute("use mice on cat");
  assert.ok(
    useRes.messages.some((m) => m.includes("HOW DO YOU WANT TO USE THE MICE ON THE CAT")),
    "use mice on cat should guide toward release/drop",
  );

  // 3. Canonical RELEASE / DROP
  const dropRes = engine.execute("drop mice");
  assert.ok(
    dropRes.messages.some((m) => m.includes("THE MICE RUN AWAY AND THE CAT CHASES AFTER THEM")),
    "drop mice should chase cat away",
  );
  assert.equal(state.objectLoc[24], -1);
});

test("hint system: vampire and cross", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.room = 30;
  state.objectLoc[6] = -2;  // cross
  state.objectLoc[39] = 30; // vampire here

  // 1. USE cross
  const useRes = engine.execute("use cross on vampire");
  assert.ok(
    useRes.messages.some((m) => m.includes("HOW DO YOU WANT TO USE THE CROSS ON THE VAMPIRE")),
    "use cross should guide toward wave/display",
  );

  // 2. TOUCH vampire
  const touchRes = engine.execute("touch vampire");
  assert.ok(
    touchRes.messages.some((m) => m.includes("PULL YOUR HAND BACK")),
    "touch vampire should give danger feedback",
  );

  // 3. Canonical WAVE CROSS
  const waveRes = engine.execute("wave cross at vampire");
  assert.ok(
    waveRes.messages.some((m) => m.includes("A STREAM OF BLINDING LIGHT ESCAPES FROM THE CROSS")),
    "wave cross should destroy vampire",
  );
  assert.equal(state.flags.VR, 1);
});

test("hint system: princess in tower", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.room = 37;
  state.objectLoc[36] = -2; // elixir

  // 1. TOUCH damsel
  const touchRes = engine.execute("touch damsel");
  assert.ok(
    touchRes.messages.some((m) => m.includes("REMAINS IN A DEEP, UNNATURAL SLUMBER")),
    "touch damsel should describe state",
  );

  // 2. USE elixir
  const useRes = engine.execute("use elixir");
  assert.ok(
    useRes.messages.some((m) => m.includes("CHECK THE CRUMPLED NOTE ON MAGIC ELIXIRS")),
    "use elixir should point player toward note",
  );
});

test("hint system: shooting unloaded pistol produces CLICK - THE PISTOL IS EMPTY", async () => {
  const engine = await createTestEngine();
  const { state } = engine;

  state.objectLoc[17] = -2; // carry pistol
  state.flags.GN = 0;       // empty

  const shootRes = engine.execute("shoot pistol");
  assert.ok(
    shootRes.messages.some((m) => m.includes("CLICK - THE PISTOL IS EMPTY")),
    "shooting unloaded pistol should click and report empty",
  );
});

