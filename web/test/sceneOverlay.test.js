import assert from "node:assert/strict";
import test from "node:test";

import { createState } from "../src/engine/state.js";
import { createWorld } from "../src/engine/world.js";
import { updateSceneOverlay } from "../src/ui/sceneOverlay.js";
import { loadGameData } from "./helpers.js";

/** Minimal mock element for SVG DOM testing in Node */
function createMockElement(tag) {
  const attrs = new Map();
  const children = [];
  const listeners = new Map();
  let innerHtml = "";
  let text = "";

  const el = {
    tag,
    setAttribute(k, v) {
      attrs.set(k, String(v));
    },
    getAttribute(k) {
      return attrs.get(k);
    },
    hasAttribute(k) {
      return attrs.has(k);
    },
    appendChild(child) {
      children.push(child);
      return child;
    },
    addEventListener(event, handler) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(handler);
    },
    trigger(event, eventObj = {}) {
      const handlers = listeners.get(event) ?? [];
      for (const h of handlers) h(eventObj);
    },
    get children() {
      return children;
    },
    get innerHTML() {
      return innerHtml;
    },
    set innerHTML(val) {
      innerHtml = val;
    },
    get textContent() {
      return text;
    },
    set textContent(val) {
      text = val;
    },
  };
  return el;
}

// Set up global document.createElementNS mock
globalThis.document = {
  createElementNS(_ns, tag) {
    return createMockElement(tag);
  },
};

/** Finds all aria-label values in an element hierarchy */
function findLabels(el) {
  const labels = [];
  if (el.hasAttribute?.("aria-label")) {
    labels.push(el.getAttribute("aria-label"));
  }
  for (const child of el.children ?? []) {
    labels.push(...findLabels(child));
  }
  return labels;
}

test("Room 1: acid-burned 'KNOCK HERE' lettering is painted into the background art, not overlaid", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  updateSceneOverlay(svg, { roomId: 1, state, world });
  assert.equal(findLabels(svg).length, 0);

  state.flags.SM = 1;
  updateSceneOverlay(svg, { roomId: 1, state, world });
  assert.equal(findLabels(svg).length, 0);
});

test("Room 4: displays alien statue, then smoking pedestal, then crashed saucer", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  // Alien statue present at start (Obj 2 is at room 4)
  state.objectLoc[2] = 4;
  state.objectLoc[28] = -1;
  updateSceneOverlay(svg, { roomId: 4, state, world });
  assert.ok(findLabels(svg).includes("Alien Creature Statue"));

  // After alien explosion (Obj 2 destroyed, timer R started, saucer not yet arrived)
  state.objectLoc[2] = -1;
  state.timers.R = 5;
  updateSceneOverlay(svg, { roomId: 4, state, world });
  assert.ok(findLabels(svg).includes("Smoking Shattered Pedestal"));

  // After 20 turns, saucer arrives (Obj 28 placed in room 4)
  state.objectLoc[28] = 4;
  updateSceneOverlay(svg, { roomId: 4, state, world });
  assert.ok(findLabels(svg).includes("Glowing Extraterrestrial Saucer"));
});

test("Room 9 & 10: the iron door is painted into the background art, not overlaid, whether locked or open", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  state.flags.DR = 0;
  updateSceneOverlay(svg, { roomId: 9, state, world });
  assert.ok(!findLabels(svg).includes("Locked Heavy Iron Door"));

  state.flags.DR = 1;
  updateSceneOverlay(svg, { roomId: 9, state, world });
  assert.ok(!findLabels(svg).includes("Open Iron Doorway"));

  updateSceneOverlay(svg, { roomId: 10, state, world });
  assert.ok(!findLabels(svg).includes("Open Iron Doorway"));
});

test("Room 22: displays cloak and lock pick (the antlers/revolving wall is painted into the background art, not overlaid)", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  state.objectLoc[3] = 22;
  state.objectLoc[26] = 22;
  updateSceneOverlay(svg, { roomId: 22, state, world });
  const labels = findLabels(svg);
  assert.ok(!labels.includes("Revolving Secret Wall"));
  assert.ok(labels.includes("Dusty Wizard's Cloak"));
  assert.ok(labels.includes("Slender Lock Pick"));
});

test("Room 26: displays Sneering Goblin with key, then tiny key after vanishing", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  // Goblin present (Obj 10)
  state.objectLoc[10] = 26;
  state.objectLoc[11] = -1;
  updateSceneOverlay(svg, { roomId: 26, state, world });
  assert.ok(findLabels(svg).includes("Sneering Goblin with Key"));

  // After SAY IJNID: goblin gone, key on sand (Obj 11)
  state.objectLoc[10] = -1;
  state.objectLoc[11] = 26;
  updateSceneOverlay(svg, { roomId: 26, state, world });
  assert.ok(findLabels(svg).includes("Tiny Gleaming Key"));
});

test("Room 27 & 30: displays werewolf ashes and vampire embers after defeat", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  // Room 27 without werewolf killed
  state.flags.WF = 0;
  updateSceneOverlay(svg, { roomId: 27, state, world });
  assert.equal(findLabels(svg).includes("Pile of Werewolf Ashes"), false);

  // Werewolf killed
  state.flags.WF = 1;
  updateSceneOverlay(svg, { roomId: 27, state, world });
  assert.ok(findLabels(svg).includes("Pile of Werewolf Ashes"));

  // Room 30 without vampire killed
  state.flags.VR = 0;
  updateSceneOverlay(svg, { roomId: 30, state, world });
  assert.equal(findLabels(svg).includes("Smoldering Vampire Embers"), false);

  // Vampire destroyed by cross light
  state.flags.VR = 1;
  updateSceneOverlay(svg, { roomId: 30, state, world });
  assert.ok(findLabels(svg).includes("Smoldering Vampire Embers"));
});

test("Room 37: vines, sarcophagus and sleeping Sabrina are painted into the background art (no overlay); only the awakened princess still gets one", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  // 1. Tangled vines covering the alcove -- background art only, no overlay prop
  state.objectLoc[14] = 37;
  updateSceneOverlay(svg, { roomId: 37, state, world });
  assert.ok(!findLabels(svg).includes("Tangled Vines"));

  // 2. Vines pulled, revealing sealed sarcophagus -- background art only
  state.objectLoc[14] = -1;
  state.objectLoc[15] = 37;
  updateSceneOverlay(svg, { roomId: 37, state, world });
  assert.ok(!findLabels(svg).includes("Sealed Stone Sarcophagus"));

  // 3. Sarcophagus blasted open, revealing sleeping damsel -- background art only
  state.objectLoc[15] = -1;
  state.objectLoc[16] = 37;
  updateSceneOverlay(svg, { roomId: 37, state, world });
  assert.ok(!findLabels(svg).includes("Sleeping Princess Sabrina"));

  // 4. Sabrina awakened -- no background variant for this state, so it still overlays
  state.objectLoc[16] = -1;
  state.objectLoc[38] = 37;
  updateSceneOverlay(svg, { roomId: 37, state, world });
  assert.ok(findLabels(svg).includes("Princess Sabrina (Awake)"));
});

test("Dynamic actors: wandering mice, werewolf, and vampire render across rooms", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  // Room 17 has wandering mice (Obj 20)
  state.objectLoc[20] = 17;
  state.objectLoc[34] = -1;
  state.objectLoc[39] = -1;
  updateSceneOverlay(svg, { roomId: 17, state, world });
  assert.ok(findLabels(svg).includes("Ravenous Mice"));

  // Werewolf appears in room 2 (Obj 34)
  state.objectLoc[34] = 2;
  state.flags.WF = 0;
  updateSceneOverlay(svg, { roomId: 2, state, world });
  assert.ok(findLabels(svg).includes("Snarling Werewolf"));

  // Vampire appears in castle room 28 (Obj 39)
  state.objectLoc[39] = 28;
  state.flags.VR = 0;
  updateSceneOverlay(svg, { roomId: 28, state, world });
  assert.ok(findLabels(svg).includes("Lethal Vampire"));
});

test("Room 9: displays fly swarm and piece of flypaper when present", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  // Room 9 initially has flies
  state.objectLoc[7] = 9;
  state.objectLoc[31] = -2;
  updateSceneOverlay(svg, { roomId: 9, state, world });
  assert.ok(findLabels(svg).includes("Swarm of Buzzing Flies"));
  assert.ok(!findLabels(svg).includes("Piece of Flypaper"));

  // If flypaper is in room 9, it renders on the floor
  state.objectLoc[31] = 9;
  updateSceneOverlay(svg, { roomId: 9, state, world });
  assert.ok(findLabels(svg).includes("Piece of Flypaper"));
});
