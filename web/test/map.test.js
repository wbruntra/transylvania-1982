// The map has to agree with the world, or it actively misleads the player.
//
// It previously did not: 13 compass exits pointed one way in the data and were
// drawn pointing another (room 13 went N to room 27, which was drawn to the
// east), and the connections were a hand-kept list that had drifted from the
// exits it was supposed to describe. These tests make both failures loud.

import assert from "node:assert/strict";
import test from "node:test";

import { MAP_ROOMS, buildMapEdges, edgeLabel } from "../src/ui/map.js";
import { createWorld } from "../src/engine/world.js";
import { loadGameData } from "./helpers.js";

const world = createWorld(await loadGameData());

test("every room in the game has a place on the map", () => {
  const missing = [...world.rooms.keys()].filter((id) => !(id in MAP_ROOMS));
  assert.deepEqual(missing, [], `rooms absent from MAP_ROOMS: ${missing.join(", ")}`);
});

test("the map invents no rooms", () => {
  const extra = Object.keys(MAP_ROOMS).map(Number).filter((id) => !world.rooms.has(id));
  assert.deepEqual(extra, []);
});

test("no two rooms sit on top of each other", () => {
  const ids = Object.keys(MAP_ROOMS).map(Number);
  const tooClose = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const a = MAP_ROOMS[ids[i]];
      const b = MAP_ROOMS[ids[j]];
      if (Math.abs(a.x - b.x) < 55 && Math.abs(a.y - b.y) < 55) {
        tooClose.push(`${ids[i]}/${ids[j]}`);
      }
    }
  }
  assert.deepEqual(tooClose, []);
});

test("every compass exit points the way the map draws it", () => {
  // N must go up the page, E must go right, and so on. A layout satisfying all
  // of these exists -- both axes of the constraint graph are acyclic -- so any
  // violation here is a placement mistake, not an impossibility.
  const wrong = [];
  for (const room of world.rooms.values()) {
    for (const [dir, dest] of Object.entries(room.exits)) {
      if (dest <= 0) continue;
      const from = MAP_ROOMS[room.id];
      const to = MAP_ROOMS[dest];
      if (!from || !to) continue;
      const ok = {
        N: to.y < from.y,
        S: to.y > from.y,
        E: to.x > from.x,
        W: to.x < from.x,
        U: true, // vertical movement is not a compass direction on a flat map
        D: true,
      }[dir];
      if (!ok) {
        wrong.push(`room ${room.id} --${dir}--> ${dest} (${from.x},${from.y}) -> (${to.x},${to.y})`);
      }
    }
  }
  assert.deepEqual(wrong, [], `map contradicts the data:\n  ${wrong.join("\n  ")}`);
});

test("edges are derived from the data, covering every connection exactly once", () => {
  const edges = buildMapEdges(world);

  const fromData = new Set();
  for (const room of world.rooms.values()) {
    for (const dest of Object.values(room.exits)) {
      if (dest > 0) fromData.add([room.id, dest].sort((a, b) => a - b).join("-"));
    }
  }
  const drawn = new Set(edges.map((e) => `${e.a}-${e.b}`));

  assert.equal(drawn.size, edges.length, "an edge is listed twice");
  assert.deepEqual([...fromData].filter((k) => !drawn.has(k)), [], "connections never drawn");
  assert.deepEqual([...drawn].filter((k) => !fromData.has(k)), [], "connections that do not exist");
});

test("links with no compass way back are identified and pointed the right way", () => {
  const edges = buildMapEdges(world);
  const oneWay = edges.filter((e) => e.oneWay);

  // Eight pairs have no compass exit leading back; all are interiors left with
  // the EXIT/OUT verb (TRANS.bas:10010) rather than a direction.
  assert.equal(oneWay.length, 8);

  for (const edge of oneWay) {
    const source = edge.forward ? edge.a : edge.b;
    const target = edge.forward ? edge.b : edge.a;
    const dirs = edge.forward ? edge.aToB : edge.bToA;
    assert.ok(dirs.length > 0, `edge ${edge.a}-${edge.b} points nowhere`);
    // Travelling that way from the source really does reach the target.
    for (const dir of dirs) {
      assert.equal(world.room(source).exits[dir], target);
    }
    assert.ok(edgeLabel(edge).length > 0);
  }
});

test("the forest's twisted links are marked, with both journeys labelled", () => {
  const edges = buildMapEdges(world);
  const twisted = edges.filter((e) => e.twisted);

  // Five forest pairs connect both ways but not by opposite directions.
  assert.deepEqual(
    twisted.map((e) => `${e.a}-${e.b}`).sort(),
    ["18-26", "3-16", "3-17", "5-14", "6-26"],
  );

  // The specific thing that makes movement feel broken: leave room 3 heading
  // west, and heading east does not bring you back.
  const edge = twisted.find((e) => e.a === 3 && e.b === 17);
  assert.equal(world.room(3).exits.W, 17);
  assert.notEqual(world.room(17).exits.E, 3);
  assert.equal(world.room(17).exits.S, 3);
  assert.equal(edgeLabel(edge), "W / S back");
});
