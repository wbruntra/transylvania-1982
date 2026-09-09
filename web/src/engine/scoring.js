// Added -- not in TRANS.bas, which has no scoring at all.
//
// A point value per discovered action, whether or not it matters to winning.
// The idea is that SCORE doubles as a checklist of *everything the game
// contains*, not just what's on the shortest path to the ending -- feeding
// the bullfrog is worth points, and so is eating the loaf of stale bread,
// even though nothing downstream depends on either.
//
// Each key below is awarded from exactly the places that print the matching
// action's message (rules.js effects via `then.points`, or a direct
// `awardPoints` call in the command file that handles it). Award points
// once each event actually happens, not for merely trying -- e.g. `shoot
// werewolf` only pays out on a hit, not a miss.

/** @type {Record<string, { points: number, label: string }>} */
export const SCORE_EVENTS = {
  readNote: { points: 1, label: "read the wrinkled note" },
  readSign: { points: 1, label: "read the sign in the willow" },
  readBook: { points: 1, label: "read the torn-out page in the magic book" },
  takeCross: { points: 1, label: "take the wooden cross" },
  eatBread: { points: 1, label: "eat the stale loaf of bread" },
  eatGarlic: { points: 1, label: "eat the garlic clove" },
  drinkWater: { points: 1, label: "drink from the lake" },
  climbTree: { points: 1, label: "try to climb a tree" },
  climbWillow: { points: 1, label: "try to climb the willow" },
  pourAcid: { points: 2, label: "pour acid on the stump" },
  knockStump: { points: 3, label: "knock on the stump" },
  lookCrystalBall: { points: 2, label: "gaze into the crystal ball" },
  getLockPick: { points: 1, label: "find the lock pick hidden in the cloak" },
  pickCaveDoor: { points: 2, label: "get through the locked door in the cave" },
  catchFlies: { points: 2, label: "catch flies with the flypaper" },
  feedFrog: { points: 3, label: "feed the bullfrog" },
  sayIjnid: { points: 3, label: "say IJNID to the goblin" },
  openCoffin: { points: 3, label: "open the coffin in the wagon" },
  setTrap: { points: 1, label: "set the mousetrap" },
  catchMice: { points: 2, label: "catch the mice in the mousetrap" },
  distractCat: { points: 3, label: "distract the cat guarding the hut" },
  rideBroom: { points: 2, label: "ride the broom" },
  moveGravestone: { points: 2, label: "move the gravestone" },
  unlockGrate: { points: 2, label: "unlock the grate in the cemetery" },
  climbToChamber: { points: 2, label: "climb down into the secret chamber" },
  loadPistol: { points: 2, label: "load the pistol" },
  shootWerewolf: { points: 5, label: "shoot the werewolf" },
  pullAntlers: { points: 3, label: "find the secret passage in the cabin" },
  waveCross: { points: 5, label: "drive off the vampire with the cross" },
  openCoffer: { points: 2, label: "open the treasure coffer" },
  waveRing: { points: 5, label: "free the creature trapped in the statue" },
  climbTowerLadder: { points: 2, label: "climb the ladder to the tower" },
  moveVines: { points: 2, label: "move the vines to reveal the sarcophagus" },
  goUfo: { points: 3, label: "go into the crashed saucer" },
  pressButtonElsewhere: { points: 1, label: "push the box's button somewhere harmless" },
  pushButton: { points: 5, label: "blast open the sarcophagus" },
  waveElixir: { points: 2, label: "energize the elixir" },
  pourElixir: { points: 2, label: "pour the elixir on the sleeping princess" },
  clapHands: { points: 5, label: "clap to wake the princess" },
  sailBoat: { points: 10, label: "sail the princess home" },
};

/** @type {number} */
export const MAX_SCORE = Object.values(SCORE_EVENTS).reduce((sum, e) => sum + e.points, 0);

/**
 * Awards the points for `key` exactly once per game. Safe to call every time
 * the triggering message prints -- repeats are no-ops.
 * @param {import("./state.js").GameState} state
 * @param {keyof typeof SCORE_EVENTS} key
 * @returns {boolean} whether points were actually awarded this time.
 */
export function awardPoints(state, key) {
  const event = SCORE_EVENTS[key];
  if (!event) return false;
  if (!state.scored) state.scored = {};
  if (state.scored[key]) return false;
  state.scored[key] = true;
  state.score = (state.score ?? 0) + event.points;
  return true;
}

/**
 * The SCORE command's report: current/max, and a checklist of what's left.
 * @param {import("./state.js").GameState} state
 * @returns {string[]}
 */
export function scoreReport(state) {
  const score = state.score ?? 0;
  const scored = state.scored ?? {};
  const lines = [`YOU HAVE SCORED ${score} OUT OF ${MAX_SCORE} POINTS.`];
  const done = Object.entries(SCORE_EVENTS)
    .filter(([key]) => scored[key])
    .map(([, event]) => event.label);
  const remaining = Object.keys(SCORE_EVENTS).length - done.length;

  if (done.length > 0) {
    lines.push("THINGS YOU HAVE DONE:");
    for (const label of done) lines.push(`  - ${label.toUpperCase()}`);
  }
  // Deliberately no list of what's missing -- that would just be a
  // walkthrough. A count is enough of a nudge that there's more to find
  // without giving any of it away.
  if (remaining === 0) {
    lines.push("YOU HAVE DONE EVERYTHING THERE IS TO DO. WELL DONE!");
  } else {
    lines.push(`THERE ${remaining === 1 ? "IS" : "ARE"} ${remaining} MORE THING${remaining === 1 ? "" : "S"} LEFT TO DISCOVER.`);
  }
  return lines;
}
