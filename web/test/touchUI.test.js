import assert from "node:assert/strict";
import test from "node:test";

import { computeActionChips } from "../src/ui/view.js";
import { createTestEngine } from "./helpers.js";

test("computeActionChips generates contextual smart actions for iPad touch navigation", async () => {
  const engine = await createTestEngine();
  const world = engine.world;
  const state = engine.state;

  // 1. Initial room: Ancient Stump (Room 1)
  const room1 = world.room(1);
  const chips1 = computeActionChips(room1, state, world);
  const cmds1 = chips1.map((c) => c.cmd);

  assert.ok(cmds1.includes("look stump"), "should offer LOOK STUMP");
  assert.ok(cmds1.includes("go stump"), "should offer ENTER STUMP");
  assert.ok(cmds1.includes("knock stump"), "should offer KNOCK STUMP");

  // 2. Room 3 (Forest with note): should offer GET NOTE
  const room3 = world.room(3);
  state.room = 3;
  const chips3 = computeActionChips(room3, state, world);
  const cmds3 = chips3.map((c) => c.cmd);
  assert.ok(cmds3.includes("get note"), "should offer GET NOTE when note is present in room 3");

  // 3. Pick up note -> should offer READ NOTE
  engine.execute("get note");
  const chipsAfterGet = computeActionChips(room3, state, world);
  const cmdsAfterGet = chipsAfterGet.map((c) => c.cmd);
  assert.ok(cmdsAfterGet.includes("read note"), "should offer READ NOTE when note is carried");
  assert.ok(!cmdsAfterGet.includes("get note"), "should not offer GET NOTE once picked up");

  // 3. Cabin (Room 21) & Annex (Room 22)
  const room21 = world.room(21);
  const chips21 = computeActionChips(room21, state, world);
  assert.ok(chips21.some((c) => c.cmd === "pull antlers"), "should offer PULL ANTLERS in room 21");

  const room22 = world.room(22);
  const chips22 = computeActionChips(room22, state, world);
  assert.ok(chips22.some((c) => c.cmd === "pull wall"), "should offer REVOLVE WALL in room 22");

  // 4. Werewolf threat
  state.objectLoc[34] = 1; // Werewolf here
  state.flags.WF = 0;
  const chipsThreat = computeActionChips(room1, state, world);
  const wolfChip = chipsThreat.find((c) => c.cmd === "shoot werewolf");
  assert.ok(wolfChip, "should offer SHOOT WEREWOLF when werewolf is in room");
  assert.equal(wolfChip.danger, true, "werewolf chip should be marked danger");

  // 5. Sabrina Tower (Room 37)
  const room37 = world.room(37);
  state.room = 37;
  state.flags.SH = 0;
  const chips37Vines = computeActionChips(room37, state, world);
  assert.ok(chips37Vines.some((c) => c.cmd === "cut vines"), "should offer CUT VINES when vines present");

  state.flags.SH = 1;
  state.flags.PO = 0;
  const chips37Coffin = computeActionChips(room37, state, world);
  assert.ok(chips37Coffin.some((c) => c.cmd === "open coffin"), "should offer OPEN COFFIN when vines cut");

  state.flags.PO = 1;
  const chips37Wake = computeActionChips(room37, state, world);
  assert.ok(chips37Wake.some((c) => c.cmd === "wake damsel"), "should offer WAKE SABRINA when coffin open");

  // 6. Cave (Room 9) Flies & Flypaper
  const room9 = world.room(9);
  state.room = 9;
  state.objectLoc[7] = 9;
  state.objectLoc[31] = -2; // Carried flypaper
  const chips9 = computeActionChips(room9, state, world);
  assert.ok(chips9.some((c) => c.cmd === "catch flies"), "should offer CATCH FLIES in room 9");
  assert.ok(chips9.some((c) => c.cmd === "use flypaper"), "should offer USE FLYPAPER in room 9");

  // 7. Room 7 Cat Guard and Mice Chips
  const room7 = world.room(7);
  state.room = 7;
  state.objectLoc[24] = 7; // Cat here
  state.objectLoc[1] = 7;  // Acid here
  state.objectLoc[25] = 7; // Broom here
  state.objectLoc[20] = -1;// Mice not carried
  const chips7Guarded = computeActionChips(room7, state, world);
  const cmds7Guarded = chips7Guarded.map((c) => c.cmd);
  assert.ok(!cmds7Guarded.includes("get acid"), "should not offer GET ACID while cat guards room 7");
  assert.ok(!cmds7Guarded.includes("get broom"), "should not offer GET BROOM while cat guards room 7");
  assert.ok(cmds7Guarded.includes("look cat"), "should offer LOOK CAT while cat guards room 7");

  state.objectLoc[20] = -2; // Player carried mice
  const chips7WithMice = computeActionChips(room7, state, world);
  const cmds7WithMice = chips7WithMice.map((c) => c.cmd);
  assert.ok(cmds7WithMice.includes("drop mice"), "should offer RELEASE MICE when carrying mice in room 7");

  state.objectLoc[24] = -1; // Cat chased away
  const chips7Cleared = computeActionChips(room7, state, world);
  const cmds7Cleared = chips7Cleared.map((c) => c.cmd);
  assert.ok(cmds7Cleared.includes("get acid"), "should offer GET ACID once cat is gone");
  assert.ok(cmds7Cleared.includes("get broom"), "should offer GET BROOM once cat is gone");
});
