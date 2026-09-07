// The mapping from room + game state to which picture to show. A room in this
// port can have more than one background because the art was generated from
// each room's fixed description text (tools/art-prompts.mjs), so a change the
// description never mentions -- a door opening, ground burning -- has to be a
// different picture, not an overlay. See SCENE_VARIATIONS.md.

import assert from "node:assert/strict";
import test from "node:test";

import { CARRIED, GONE } from "../src/engine/constants.js";
import { createState } from "../src/engine/state.js";
import { createWorld } from "../src/engine/world.js";
import { artCandidates } from "../src/ui/scene.js";
import { loadGameData } from "./helpers.js";

const world = createWorld(await loadGameData());

function firstCandidate(roomId, state) {
  return artCandidates(world.room(roomId), state)[0];
}

test("a room with no state-dependent art always resolves to its base picture", () => {
  const state = createState(world);
  assert.equal(firstCandidate(1, state), "art/room-1.webp");
  assert.equal(firstCandidate(37, state), "art/room-37.webp");
});

test("the cave door (rooms 9 and 10) switches art when DR is set", () => {
  const state = createState(world);
  assert.equal(state.flags.DR, 0, "starts locked");
  assert.equal(firstCandidate(9, state), "art/room-9.webp");
  assert.equal(firstCandidate(10, state), "art/room-10.webp");

  state.flags.DR = 1; // TRANS.bas:6320
  assert.equal(firstCandidate(9, state), "art/room-9-open.webp");
  assert.equal(firstCandidate(10, state), "art/room-10-open.webp");
});

test("the clearing (room 4) switches art once the statue is destroyed", () => {
  const state = createState(world);
  assert.equal(firstCandidate(4, state), "art/room-4.webp");

  state.objectLoc[2] = GONE; // TRANS.bas:7745
  assert.equal(firstCandidate(4, state), "art/room-4-burnt.webp");

  // Carrying it (impossible in the real game -- it is not takeable -- but the
  // predicate only cares that it is gone from the room) should not matter.
  state.objectLoc[2] = CARRIED;
  assert.equal(firstCandidate(4, state), "art/room-4.webp");
});

test("without state, every room falls back to its base picture", () => {
  assert.equal(firstCandidate(9, undefined), "art/room-9.webp");
  assert.equal(firstCandidate(4, undefined), "art/room-4.webp");
});
