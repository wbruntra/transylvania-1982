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

test("the stump (room 1) switches art once acid burns the carving legible", () => {
  const state = createState(world);
  assert.equal(firstCandidate(1, state), "art/room-1.webp");

  state.flags.SM = 1; // TRANS.bas:4867
  assert.equal(firstCandidate(1, state), "art/room-1-runes.webp");
});

test("the cemetery (room 5) steps through gravestone, moved gravestone with a locked grate, then an open grate with a ladder down", () => {
  const state = createState(world);
  assert.equal(firstCandidate(5, state), "art/room-5.webp");

  state.objectLoc[13] = 5; // move gravestone (TRANS.bas:7815)
  assert.equal(firstCandidate(5, state), "art/room-5-moved.webp");

  state.flags.GT = 1; // unlock grate
  assert.equal(firstCandidate(5, state), "art/room-5-open.webp");
});

test("the tower (room 37) steps through vines, sarcophagus, sleeping Sabrina, then an empty coffin once she wakes or is carried off", () => {
  const state = createState(world);
  assert.equal(firstCandidate(37, state), "art/room-37.webp"); // vines (obj 14) still cover it

  state.objectLoc[14] = CARRIED;
  state.objectLoc[15] = 37; // TRANS.bas:7821 -- vines pulled, sarcophagus revealed
  assert.equal(firstCandidate(37, state), "art/room-37-sarcophagus.webp");

  state.objectLoc[15] = GONE;
  state.objectLoc[16] = 37; // TRANS.bas:4933 -- button pushed, sleeping Sabrina revealed
  assert.equal(firstCandidate(37, state), "art/room-37-open.webp");

  state.objectLoc[16] = GONE;
  state.objectLoc[38] = 37; // TRANS.bas:7915 -- awakened, standing beside the player
  assert.equal(firstCandidate(37, state), "art/room-37-empty.webp");

  state.objectLoc[38] = CARRIED; // carried off to win
  assert.equal(firstCandidate(37, state), "art/room-37-empty.webp");
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
