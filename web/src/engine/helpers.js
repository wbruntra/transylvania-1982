// Shared destination subroutines reached from several verbs in TRANS.bas.
// Handlers that move the player return no text: engine.execute redescribes the
// room whenever a turn changed it (TRANS.bas:7990/8000). Describing here as
// well printed every arrival twice.

import { CARRIED, GONE } from "./constants.js";
import { MESSAGES } from "./messages.js";
import { getObjectName, isCarried, placeObject } from "./state.js";

/**
 * 12000: Stairs subroutine.
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {import("./state.js").GameState} state
 * @returns {string[]}
 */
export function stairsMovement(world, state) {
  const P = state.room;
  if (P === 24) {
    state.room = 25;
    return [];
  }
  if (P === 25 || P === 35) {
    state.room = P - 1;
    return [];
  }
  if (P === 30) {
    state.room = 36;
    return [];
  }
  if (P === 36) {
    state.room = 30;
    return [];
  }
  return [MESSAGES.notHere]; // 12008 GOTO 210
}

/**
 * 5880 / 6095: Ladder subroutine.
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {import("./state.js").GameState} state
 * @returns {string[]}
 */
export function ladderMovement(world, state) {
  if (state.room === 36) {
    if (state.flags.VR) {
      state.room = 37;
      return [];
    }
    return [MESSAGES.shookLadder];
  }
  return [MESSAGES.cant];
}

/**
 * 7820 / 300 / 270: Reveal sarcophagus behind vines at room 37.
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {import("./state.js").GameState} state
 * @returns {string[]}
 */
export function revealSarcophagus(world, state) {
  if (state.room !== 37 || state.objectLoc[14] !== 37) {
    return [MESSAGES.dontUnderstand];
  }
  placeObject(state, 15, 37);
  return [MESSAGES.foundSomething, MESSAGES.thereIsA(getObjectName(world, state, 15))];
}

/**
 * 7745: White fire from ring destroys statue and frees alien creature.
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {import("./state.js").GameState} state
 * @returns {string[]}
 */
export function alienFireball(world, state) {
  placeObject(state, 5, GONE);
  placeObject(state, 2, GONE);
  state.timers.R = state.turns;
  return [
    "A STREAM OF WHITE FIRE SHOOTS FROM YOUR RING ONTO THE STATUE. GREEN AND WHITE FLAMES BURN QUICKLY, ENGULFING ALL THAT",
    "IS AROUND YOU. SUDDENLY, A RED FIREBALL EMERGES, QUELLING THE WHITE AND GREEN FLAMES IN ITS FURY. THE AWKWARD",
    "SILHOUETTE OF AN ALIEN CREATURE APPEARS IN FRONT OF THE FIREBALL. IT STEPS FORWARD INTO THE RETURNING DARKNESS.",
    "'WELL MET, SIR! YOU HAVE FREED ME FROM MY ACCURSED PRISON! I AM DEEPLY INDEBTED TO YOU!' THE CREATURE GRASPS THE RING",
    "AND CRUSHES IT. THERE IS A VIOLENT EXPLOSION. WHEN THE SMOKE CLEARS, STATUE AND ALIEN ARE NOWHERE TO BE SEEN.",
  ];
}

/**
 * 7769: Blinding light from cross, destroys vampire in room.
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {import("./state.js").GameState} state
 * @returns {string[]}
 */
export function crossLight(world, state) {
  const messages = ["A STREAM OF BLINDING LIGHT ESCAPES FROM THE CROSS."];
  if (state.objectLoc[39] === state.room) {
    messages.push("THE VAMPIRE SHRIEKS AND DISINTEGRATES INTO A PILE OF BURNING DUST.");
    placeObject(state, 39, GONE);
    state.flags.VR = 1;
  }
  return messages;
}

/**
 * 6107: Pie-man Easter egg.
 * @returns {{messages: string[], consumeTurn: boolean}}
 */
export function pieManEasterEgg() {
  return {
    messages: [
      "SPINNING, YOU SEE MULTITUDES OF PENGUINS FEVERISHLY BAKING CHERRY PIES. ONE ASKS IF YOU'VE PLAYED 'PIE-MAN'.",
      "SUDDENLY, YOU'RE BACK IN THE CELLAR.",
    ],
    consumeTurn: false,
  };
}

/**
 * 5737-5900: Special navigation branches for GO / ENTER.
 * @param {ReturnType<typeof import("./world.js").createWorld>} world
 * @param {import("./state.js").GameState} state
 * @param {number} X
 * @returns {string[] | {messages: string[], consumeTurn?: boolean} | null}
 */
export function specialNav5737(world, state, X) {
  if (X === 57) return stairsMovement(world, state); // STAIR -> 12000
  if (X === 99) return [MESSAGES.tooDangerous]; // 5740
  if (X === 56 && state.room === 16) {
    return { messages: [MESSAGES.whatShallIDo], consumeTurn: false }; // 5745
  }
  if (X === 12 && state.room === 16) return [MESSAGES.slidBackDown]; // 5750 -> 320
  if (X === 13) return [MESSAGES.slipperyMoss]; // 5760 -> 310
  if (X === 19) return [MESSAGES.rockSlideImpenetrable]; // 5770
  if (X === 20 && state.room === 6) {
    state.room = 7;
    return [];
  } // 5780
  if (X === 27) {
    // 5790 -> 6010
    if (state.flags.GT) {
      state.room = 11;
      return [];
    }
    return [MESSAGES.locked]; // 6011 -> 200
  }
  if (X === 29) return [MESSAGES.areYouCrazy]; // 5800
  if (X === 37 && state.room === 2) {
    state.room = 38;
    return [];
  } // 5810
  if (X === 38 && state.room === 23) {
    state.room = 24;
    return [];
  } // 5820
  if (X === 39 && state.room === 19) {
    state.room = 21;
    return [];
  } // 5830
  if (X === 40 && state.room === 19) {
    state.room = 20;
    return [];
  } // 5840
  if (X === 54 && state.room === 13) {
    state.room = 27;
    return [];
  } // 5850
  if (X === 73 && state.objectLoc[28] === state.room) {
    // 5920: climbing into the crashed saucer. This is the only line in the
    // whole listing that puts the black metal box into your hands, so without
    // it the sarcophagus can never be blasted open and the game cannot be won.
    placeObject(state, 28, GONE);
    placeObject(state, 29, 4);
    placeObject(state, 27, CARRIED);
    return [
      "FANTASTIC! UTTERLY FASCINATING!..OH NO! ...EVERYTHING IS GETTING BLACK--HELP!!",
    ];
  }
  if (X === 59 && state.room === 36) return ladderMovement(world, state); // 5880
  if (X === 60 && state.room === 31) return pieManEasterEgg(); // 5890 -> 6107
  if (X === 61) {
    // 5900 -> 6110
    if (state.room === 31) return pieManEasterEgg();
    if (state.room !== 9 && state.room !== 10) return [MESSAGES.needDirection];
    if (!state.flags.DR) return [MESSAGES.locked];
    state.room = state.room === 9 ? 10 : 9;
    return [];
  }

  return null;
}
