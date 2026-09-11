// Tests for the extension points: the rules table and the per-turn hook. Both
// are empty in the shipped game, so they are exercised here with fixtures.

import assert from "node:assert/strict";
import test from "node:test";

import { createEngine } from "../src/engine/engine.js";
import { MESSAGES } from "../src/engine/messages.js";
import { parse } from "../src/engine/parser.js";
import { applyRule, ruleMatches, runRules } from "../src/engine/rules.js";
import { createState } from "../src/engine/state.js";
import { createWorld } from "../src/engine/world.js";
import { createTestEngine, loadGameData } from "./helpers.js";

test("parse pulls a verb and a noun apart", async () => {
  assert.deepEqual(parse("GET  the   Note"), {
    verb: "get",
    I: null,
    noun: "the note",
    X: null,
    direction: null,
    input: "get the note",
  });
  assert.equal(parse("   "), null);
  assert.equal(parse("north").direction, "N");
  assert.equal(parse("go up").direction, "U");
  assert.equal(parse("look").noun, "");
  assert.equal(parse("frobnicate").verb, "");
});

test("parse resolves verb id (I) and noun id (X) with world data", async () => {
  const data = await loadGameData();
  const world = createWorld(data);

  // Verb "get" is index 11, noun "note" is 24
  const cmdNote = parse("get the note", world);
  assert.equal(cmdNote.I, 11);
  assert.equal(cmdNote.X, 24);

  // Verbs: "fire" (61) vs "shoot" (23)
  const cmdFire = parse("fire werewolf", world);
  assert.equal(cmdFire.I, 61);
  assert.equal(cmdFire.X, 34);

  const cmdShoot = parse("shoot wolf", world);
  assert.equal(cmdShoot.I, 23);
  assert.equal(cmdShoot.X, 34); // wolf is aliased to werewolf (X=34)

  // Noun 128 (STONE) overrides based on room (TRANS.bas:1022, 1024)
  const cmdStone5 = parse("look stone", world, { room: 5 });
  assert.equal(cmdStone5.X, 25); // grave in cemetery

  const cmdStone37 = parse("look stone", world, { room: 37 });
  assert.equal(cmdStone37.X, 70); // sarcophagus in room 37

  const cmdStoneOther = parse("look stone", world, { room: 1 });
  assert.equal(cmdStoneOther.X, 128);
});

test("a rule matching a room overrides the generic handler", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(world);
  const rules = [
    { when: { verb: "look", room: 1, noun: "stump" }, then: { say: "IT IS COVERED IN MOSS." } },
  ];

  const matching = { world, state, command: parse("look stump") };
  assert.equal(ruleMatches(rules[0], matching), true);
  assert.deepEqual(runRules(matching, rules), ["IT IS COVERED IN MOSS."]);

  state.room = 2;
  assert.equal(runRules({ world, state, command: parse("look stump") }, rules), null);
});

test("a rule can set flags, move objects and teleport the player", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(world);

  applyRule(
    { when: {}, then: { say: "OK.", setFlags: { GT: 1 }, placeObjects: { 18: -1 }, goToRoom: 11 } },
    { world, state, command: parse("open gate") },
  );

  assert.equal(state.flags.GT, 1);
  assert.equal(state.objectLoc[18], -1);
  assert.equal(state.room, 11);
});

test("rule conditions test carried objects and flags", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(world);
  const rule = { when: { objectCarried: 18, notFlag: "GT" }, then: { say: "yes" } };
  const context = { world, state, command: parse("look") };

  assert.equal(ruleMatches(rule, context), false);

  state.objectLoc[18] = -2;
  assert.equal(ruleMatches(rule, context), true);

  state.flags.GT = 1;
  assert.equal(ruleMatches(rule, context), false);
});

test("a turn hook can append a message on the turn it fires", async () => {
  const engine = await createTestEngine();
  engine.addTurnHook(({ state }) => (state.turns === 2 ? ["THE CLOCK STRIKES."] : undefined));

  assert.equal(engine.run("look").includes("THE CLOCK STRIKES."), false);
  assert.equal(engine.run("look").at(-1), "THE CLOCK STRIKES.");
  assert.equal(engine.run("look").includes("THE CLOCK STRIKES."), false);
});

test("bad game data is rejected with an actionable message", async () => {
  const data = await loadGameData();
  assert.throws(
    () => createEngine({ ...data, rooms: data.rooms.slice(1) }),
    /declares 38 rooms but contains 37/,
  );
});

test("unknown verbs still print the original refusal", async () => {
  const engine = await createTestEngine();
  assert.deepEqual(engine.run("dance"), [MESSAGES.dontUnderstand]);
});
