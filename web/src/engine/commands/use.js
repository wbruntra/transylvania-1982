import { GONE } from "../constants.js";
import { MESSAGES } from "../messages.js";
import { isCarried, placeObject } from "../state.js";
import { catchFlies } from "./take.js";
import { load } from "./load.js";
import { shoot } from "./shoot.js";
import { unlock } from "./unlock.js";
import { wave } from "./wave.js";
import { wear } from "./wear.js";
import { pour } from "./pour.js";
import { ride } from "./ride.js";
import { read } from "./read.js";
import { sail } from "./sail.js";
import { pull } from "./pull.js";
import { open } from "./open.js";

/** @type {import("./index.js").CommandHandler} */
export function use(context) {
  const { world, state, command } = context;

  const involves = (id, word) => {
    if (command.X === id || command.directX === id || command.indirectX === id) return true;
    if (word) {
      const w = word.toLowerCase();
      if (command.noun?.toLowerCase().includes(w)) return true;
      if (command.directNoun?.toLowerCase().includes(w)) return true;
      if (command.indirectNoun?.toLowerCase().includes(w)) return true;
    }
    return false;
  };

  // 1. Flypaper in Room 9 to catch flies
  if (
    state.room === 9 &&
    state.objectLoc[7] === 9 &&
    (!command.noun ||
      involves(141, "paper") ||
      involves(65, "fly"))
  ) {
    return catchFlies(world, state);
  }

  // 2. Ring on Statue in Room 4 (or use statue when carrying ring)
  if (
    involves(63, "ring") ||
    involves(115, "ring") ||
    (state.room === 4 && involves(2, "statue") && isCarried(state, 5))
  ) {
    if (state.room === 4) {
      if (isCarried(state, 5)) {
        return wave({ world, state, command: { ...command, X: 63, noun: "ring" } });
      }
      return [MESSAGES.dontHaveIt];
    }
    if (isCarried(state, 5)) {
      return ["THE RING GLOWS WITH A SOFT, WHITE FLAME, BUT NOTHING HAPPENS HERE."];
    }
    return [MESSAGES.dontHaveIt];
  }

  // 3. Acid on Stump in Room 1
  if (involves(36, "acid") || (state.room === 1 && involves(49, "stump") && isCarried(state, 1))) {
    if (isCarried(state, 1)) {
      return pour({ state, command: { ...command, X: 36, noun: "acid" } });
    }
    return [MESSAGES.dontHaveIt];
  }

  // 4. Mice on Cat in Room 7
  if (involves(20, "mice") || (state.room === 7 && involves(24, "cat") && isCarried(state, 20))) {
    if (!isCarried(state, 20)) return [MESSAGES.dontHaveIt];
    if (state.room === 7 && state.objectLoc[24] === 7) {
      state.objectLoc[24] = -1;
      state.objectLoc[20] = -1;
      if (!state.timers) state.timers = {};
      state.timers.ZZ = 11;
      return ["THE MICE RUN AWAY AND THE CAT CHASES AFTER THEM."];
    }
    return [MESSAGES.nothingHappened];
  }

  // 5. Flies on Bullfrog in Room 16
  if (involves(65, "flie") || involves(65, "fly") || (state.room === 16 && involves(10, "frog") && isCarried(state, 7))) {
    if (!isCarried(state, 7)) return [MESSAGES.dontHaveIt];
    if (state.room === 16 && state.objectLoc[8] === 16) {
      state.objectLoc[7] = -1;
      state.objectLoc[8] = -1;
      return [
        "THE BULLFROG SPRINGS FORWARD AND WOLFS DOWN THE FLIES. 'THANKS,' HE SAYS, 'THAT HOWLING SURE WHETS YOUR APPETITE. SAY",
        "'IJNID' TO THE GOBLIN FOR ME.' HE HOPS INTO THE MURKY WATERS OF THE LAKE AND VANISHES.",
      ];
    }
    return [MESSAGES.nothingHappened];
  }

  // 6. Bullet -> Load Pistol
  if (involves(116, "bullet")) {
    if (!isCarried(state, 22)) return [MESSAGES.dontHaveIt];
    if (isCarried(state, 17)) {
      return load({ state, command: { ...command, X: 33, noun: "pistol" } });
    }
    return [MESSAGES.cant];
  }

  // 7. Pistol / Gun -> Load or Shoot
  if (involves(33, "pistol") || involves(33, "gun")) {
    if (!isCarried(state, 17)) return [MESSAGES.dontHaveIt];
    if (state.objectLoc[34] === state.room) {
      return shoot({ state, command: { ...command, X: 34, I: 23, noun: "werewolf" } });
    }
    if (isCarried(state, 22) && !state.flags.GN) {
      return load({ state, command: { ...command, X: 33, noun: "pistol" } });
    }
    if (state.flags.GN) {
      return ["THE PISTOL IS LOADED AND READY TO FIRE."];
    }
    return [MESSAGES.cant];
  }

  // 8. Cross -> Wave at Vampire
  if (involves(26, "cross")) {
    if (!isCarried(state, 6)) return [MESSAGES.dontHaveIt];
    return wave({ world, state, command: { ...command, X: 26, noun: "cross" } });
  }

  // 9. Tiny Gleaming Key -> Grate in Room 5
  if (involves(11, "key")) {
    if (!isCarried(state, 11)) return [MESSAGES.dontHaveIt];
    if (state.room === 5 || involves(27, "grate")) {
      return unlock({ state, command: { ...command, X: 27, noun: "grate" } });
    }
    if (state.room === 9 || state.room === 10 || involves(61, "door")) {
      return ["THE TINY KEY DOES NOT FIT THIS DOOR. YOU NEED A LOCK PICK."];
    }
    return [MESSAGES.cant];
  }

  // 10. Lock Pick -> Door in Room 9/10
  if (involves(26, "pick")) {
    if (!isCarried(state, 26)) return [MESSAGES.dontHaveIt];
    if (state.room === 9 || state.room === 10 || involves(61, "door")) {
      return unlock({ state, command: { ...command, X: 61, noun: "door" } });
    }
    return [MESSAGES.cant];
  }

  // 11. Elixir -> Wave and pour on damsel in Room 37
  if (involves(28, "elixir")) {
    if (!isCarried(state, 36)) return [MESSAGES.dontHaveIt];
    if (state.room === 37) {
      if (state.flags.PO) return [MESSAGES.youAlreadyDid];
      placeObject(state, 36, GONE);
      state.flags.SH = 1;
      state.flags.PO = 1;
      return [
        "YOU ENERGIZE THE ELIXIR AND POUR IT OVER THE SLEEPING PRINCESS.",
        MESSAGES.lightningInDistance,
      ];
    }
    return pour({ state, command: { ...command, X: 28, noun: "elixir" } });
  }

  // 12. Cloak -> Wear
  if (involves(47, "cloak")) {
    if (!isCarried(state, 3)) return [MESSAGES.dontHaveIt];
    return wear({ world, state, command: { ...command, X: 47, noun: "cloak" } });
  }

  // 13. Broom -> Ride
  if (involves(48, "broom")) {
    if (!isCarried(state, 25)) return [MESSAGES.dontHaveIt];
    return ride({ world, state, command: { ...command, X: 48, noun: "broom" } });
  }

  // 14. Note -> Read
  if (involves(30, "note")) {
    if (!isCarried(state, 18)) return [MESSAGES.dontHaveIt];
    return read({ world, state, command: { ...command, X: 30, noun: "note" } });
  }

  // 15. Boat -> Sail
  if (involves(82, "boat")) {
    return sail({ world, state, command: { ...command, X: 82, noun: "boat" } });
  }

  // 16. Antlers (Room 21) or Revolving Wall (Room 22)
  if (involves(102, "antler") || involves(43, "wall")) {
    return pull({ world, state, command });
  }

  // 17. Coffin -> Open
  if (involves(29, "coffin") || involves(69, "sarcophagus")) {
    return open({ world, state, command });
  }

  // 18. Grate in Room 5
  if (involves(27, "grate")) {
    return unlock({ state, command: { ...command, X: 27, noun: "grate" } });
  }

  // Fallback
  if (command.noun) {
    return {
      messages: ["THAT DOESN'T SEEM TO WORK."],
      consumeTurn: false,
    };
  }

  return {
    messages: [MESSAGES.dontUnderstand],
    consumeTurn: false,
  };
}
