// Debug tester mode: a persisted, opt-in toggle that starts a fresh game
// holding the items listed in engine/state.js's DEBUG_STARTING_ITEMS (pistol,
// bullet, cross, elixir, black box), so a tester can jump straight to a late
// room (via ui/debug.js's `/room`) without first replaying the whole
// item-collecting route. Off by default -- the normal game is the canonical
// one, and this only ever applies when a tester turns it on.

const DEBUG_MODE_KEY = "transylvania-debug-tester";

/** @returns {boolean} */
export function isDebugInventoryEnabled() {
  return localStorage.getItem(DEBUG_MODE_KEY) === "1";
}

/** Flips the toggle and returns the new value. Takes effect on next reload. */
export function toggleDebugInventory() {
  const next = !isDebugInventoryEnabled();
  localStorage.setItem(DEBUG_MODE_KEY, next ? "1" : "0");
  return next;
}
