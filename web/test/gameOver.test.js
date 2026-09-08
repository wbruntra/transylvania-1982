import assert from "node:assert/strict";
import test from "node:test";

import { CARRIED } from "../src/engine/constants.js";
import { getGameOverInfo } from "../src/engine/gameOver.js";
import { createState } from "../src/engine/state.js";
import { createWorld } from "../src/engine/world.js";
import { artCandidates } from "../src/ui/scene.js";
import { computeActionChips } from "../src/ui/view.js";
import { createTestEngine, loadGameData } from "./helpers.js";

const world = createWorld(await loadGameData());

test("gameOver: getGameOverInfo returns correct details for win, werewolf, and vampire", () => {
  const state = createState(world);

  // Not game over yet
  assert.equal(getGameOverInfo(state), null);

  // Victory
  state.isGameOver = true;
  state.isDead = false;
  state.gameOverReason = "win";
  const winInfo = getGameOverInfo(state);
  assert.equal(winInfo?.type, "victory");
  assert.equal(winInfo?.badge, "VICTORY");
  assert.ok(winInfo?.description.includes("Sabrina"));

  // Werewolf death with unloaded pistol
  state.gameOverReason = "werewolf";
  state.isDead = true;
  state.lastActionUnloadedShot = true;
  const wolfUnloaded = getGameOverInfo(state);
  assert.equal(wolfUnloaded?.type, "defeat");
  assert.ok(wolfUnloaded?.description.includes("pistol was empty"));

  // Werewolf death without shot
  state.lastActionUnloadedShot = false;
  const wolfGeneral = getGameOverInfo(state);
  assert.ok(wolfGeneral?.description.includes("ambushed you"));

  // Vampire death
  state.gameOverReason = "vampire";
  const vampInfo = getGameOverInfo(state);
  assert.equal(vampInfo?.type, "defeat");
  assert.ok(vampInfo?.description.includes("vampire"));
});

test("gameOver: shooting unloaded pistol in werewolf room triggers werewolf kill with unloaded explanation", async () => {
  const engine = await createTestEngine({ randomEvents: false });
  const { state } = engine;

  // Werewolf in room 3, player carries unloaded pistol
  state.room = 3;
  state.objectLoc[34] = 3;   // werewolf here
  state.objectLoc[17] = CARRIED; // pistol carried
  state.flags.GN = 0;        // unloaded
  state.timers.W = state.turns; // werewolf present since this turn

  const res = engine.execute("shoot werewolf");
  assert.ok(res.messages.some((m) => m.includes("CLICK - THE PISTOL IS EMPTY.")));
  assert.ok(res.messages.some((m) => m.includes("TOO LATE! THE FURRY FIEND JUST HAD YOU FOR DINNER")));
  assert.equal(state.isGameOver, true);
  assert.equal(state.isDead, true);

  const info = getGameOverInfo(state);
  assert.equal(info?.type, "defeat");
  assert.ok(info?.description.includes("pistol was empty"));
});

test("gameOver: artCandidates returns victory illustration when game is won", () => {
  const state = createState(world);
  state.room = 16;
  state.objectLoc[38] = CARRIED;
  state.isGameOver = true;
  state.isDead = false;
  state.gameOverReason = "win";

  const candidates = artCandidates(world.room(16), state);
  assert.equal(candidates[0], "art/victory.webp");
});

test("gameOver: action chips present a restart option when game is over", () => {
  const state = createState(world);
  state.isGameOver = true;

  const chips = computeActionChips(world.room(1), state, world);
  assert.equal(chips.length, 1);
  assert.equal(chips[0].cmd, "restart");
});
