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

test("Room 1: displays acid runes when SM flag is set", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  updateSceneOverlay(svg, { roomId: 1, state, world });
  assert.equal(findLabels(svg).length, 0);

  state.flags.SM = 1;
  updateSceneOverlay(svg, { roomId: 1, state, world });
  assert.ok(findLabels(svg).includes("Glowing Rune Inscription"));
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

test("Room 9 & 10: displays cave iron door (locked vs open)", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  // Room 9 initially locked
  state.flags.DR = 0;
  updateSceneOverlay(svg, { roomId: 9, state, world });
  assert.ok(findLabels(svg).includes("Locked Heavy Iron Door"));

  // Unlocked
  state.flags.DR = 1;
  updateSceneOverlay(svg, { roomId: 9, state, world });
  assert.ok(findLabels(svg).includes("Open Iron Doorway"));

  // Room 10 from the other side
  updateSceneOverlay(svg, { roomId: 10, state, world });
  assert.ok(findLabels(svg).includes("Open Iron Doorway"));
});

test("Room 22: displays revolving secret wall mechanism, cloak, and lock pick", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  state.objectLoc[3] = 22;
  state.objectLoc[26] = 22;
  updateSceneOverlay(svg, { roomId: 22, state, world });
  const labels = findLabels(svg);
  assert.ok(labels.includes("Revolving Secret Wall"));
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

test("Room 37: displays tangled vines, then sarcophagus / Sabrina progression", async () => {
  const data = await loadGameData();
  const world = createWorld(data);
  const state = createState(data);
  const svg = createMockElement("svg");

  // 1. Tangled vines covering the alcove
  state.objectLoc[14] = 37;
  updateSceneOverlay(svg, { roomId: 37, state, world });
  assert.ok(findLabels(svg).includes("Tangled Vines"));

  // 2. Vines pulled, revealing sealed sarcophagus
  state.objectLoc[14] = -1;
  state.objectLoc[15] = 37;
  updateSceneOverlay(svg, { roomId: 37, state, world });
  assert.ok(findLabels(svg).includes("Sealed Stone Sarcophagus"));

  // 3. Sarcophagus blasted open, revealing sleeping damsel
  state.objectLoc[15] = -1;
  state.objectLoc[16] = 37;
  updateSceneOverlay(svg, { roomId: 37, state, world });
  assert.ok(findLabels(svg).includes("Sleeping Princess Sabrina"));

  // 4. Sabrina awakened
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
