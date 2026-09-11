import { MESSAGES } from "../messages.js";
import { isCarried } from "../state.js";
import { catchFlies } from "./take.js";

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

  const noun = (command.directNoun || command.noun || "").trim();

  // Bare USE
  if (!noun) {
    return {
      messages: [MESSAGES.dontUnderstand],
      consumeTurn: false,
    };
  }

  if (noun.toLowerCase() === "it") {
    return {
      messages: ["HOW DO YOU WANT TO USE IT?"],
      consumeTurn: false,
    };
  }

  // 0. Flypaper in Room 9 catches flies
  if (state.room === 9 && state.objectLoc[7] === 9 && (involves(141, "paper") || involves(65, "fly"))) {
    return catchFlies(world, state);
  }

  // 1. Ring / Statue (Canonical: WAVE RING / SHOW RING)
  if (involves(63, "ring") || involves(115, "ring") || (state.room === 4 && involves(2, "statue"))) {
    if (state.room === 4) {
      return {
        messages: [
          "HOW DO YOU WANT TO USE THE RING ON THE STATUE? (TRY A MORE SPECIFIC GESTURE, LIKE WAVE OR SHOW.)",
        ],
        consumeTurn: false,
      };
    }
    return {
      messages: ["HOW DO YOU WANT TO USE THE RING?"],
      consumeTurn: false,
    };
  }

  // 2. Acid / Stump (Canonical: POUR ACID)
  if (involves(36, "acid") || (state.room === 1 && involves(49, "stump"))) {
    if (state.room === 1) {
      return {
        messages: [
          "HOW DO YOU WANT TO USE THE ACID ON THE STUMP? (TRY A VERB LIKE POUR.)",
        ],
        consumeTurn: false,
      };
    }
    return {
      messages: ["HOW DO YOU WANT TO USE THE ACID?"],
      consumeTurn: false,
    };
  }

  // 3. Flies / Bullfrog (Canonical: FEED FROG)
  if (involves(65, "fly") || involves(65, "flies") || (state.room === 16 && involves(10, "frog"))) {
    if (state.room === 16) {
      return {
        messages: [
          "HOW DO YOU WANT TO USE THE FLIES ON THE BULLFROG? (TRY FEEDING HIM.)",
        ],
        consumeTurn: false,
      };
    }
    return {
      messages: ["HOW DO YOU WANT TO USE THE FLIES?"],
      consumeTurn: false,
    };
  }

  // 4. Mice / Cat (Canonical: DROP MICE / RELEASE MICE)
  if (involves(20, "mice") || (state.room === 7 && involves(24, "cat"))) {
    if (state.room === 7) {
      return {
        messages: [
          "HOW DO YOU WANT TO USE THE MICE ON THE CAT? (TRY RELEASING OR DROPPING THEM.)",
        ],
        consumeTurn: false,
      };
    }
    return {
      messages: ["HOW DO YOU WANT TO USE THE MICE?"],
      consumeTurn: false,
    };
  }

  // 5. Tiny Key (Canonical: UNLOCK GRATE)
  if (involves(11, "key")) {
    if (state.room === 9 || state.room === 10 || involves(61, "door")) {
      return {
        messages: ["THE TINY KEY DOES NOT FIT THIS DOOR. YOU NEED A LOCK PICK."],
        consumeTurn: false,
      };
    }
    if (state.room === 5 || involves(27, "grate")) {
      return {
        messages: [
          "HOW DO YOU WANT TO USE THE KEY ON THE GRATE? (TRY A VERB LIKE UNLOCK.)",
        ],
        consumeTurn: false,
      };
    }
    return {
      messages: ["HOW DO YOU WANT TO USE THE KEY?"],
      consumeTurn: false,
    };
  }

  // 6. Lock Pick (Canonical: UNLOCK DOOR, Noun 48)
  if (involves(48, "pick")) {
    if (state.room === 9 || state.room === 10 || involves(61, "door")) {
      return {
        messages: [
          "HOW DO YOU WANT TO USE THE LOCK PICK ON THE DOOR? (TRY A VERB LIKE UNLOCK.)",
        ],
        consumeTurn: false,
      };
    }
    return {
      messages: ["HOW DO YOU WANT TO USE THE LOCK PICK?"],
      consumeTurn: false,
    };
  }

  // 7. Cross (Canonical: WAVE CROSS / SHOW CROSS, Noun 26)
  if (involves(26, "cross")) {
    if (state.objectLoc[39] === state.room) {
      return {
        messages: [
          "HOW DO YOU WANT TO USE THE CROSS ON THE VAMPIRE? (TRY WAVING OR DISPLAYING IT.)",
        ],
        consumeTurn: false,
      };
    }
    return {
      messages: ["HOW DO YOU WANT TO USE THE CROSS?"],
      consumeTurn: false,
    };
  }

  // 8. Bullet & Pistol (Canonical: LOAD PISTOL, SHOOT WEREWOLF)
  if (involves(116, "bullet")) {
    return {
      messages: ["HOW DO YOU WANT TO USE THE BULLET? (PERHAPS LOAD IT INTO THE PISTOL?)"],
      consumeTurn: false,
    };
  }
  if (involves(33, "pistol") || involves(33, "gun")) {
    if (state.objectLoc[34] === state.room) {
      return {
        messages: ["HOW DO YOU WANT TO USE THE PISTOL ON THE WEREWOLF? (SHOOT IT!)"],
        consumeTurn: false,
      };
    }
    return {
      messages: ["HOW DO YOU WANT TO USE THE PISTOL? (LOAD IT, OR SHOOT IT?)"],
      consumeTurn: false,
    };
  }

  // 9. Elixir (Canonical: WAVE ELIXIR, POUR ELIXIR, CLAP)
  if (involves(28, "elixir")) {
    return {
      messages: [
        "HOW DO YOU WANT TO USE THE ELIXIR? (CHECK THE CRUMPLED NOTE ON MAGIC ELIXIRS FOR THE EXACT RITUAL.)",
      ],
      consumeTurn: false,
    };
  }

  // 10. Flypaper (Canonical: GET FLIES / CATCH FLIES)
  if (involves(141, "paper")) {
    if (state.room === 9) {
      return {
        messages: ["HOW DO YOU WANT TO USE THE FLYPAPER? (TRY CATCHING THE FLIES WITH IT.)"],
        consumeTurn: false,
      };
    }
    return {
      messages: ["HOW DO YOU WANT TO USE THE FLYPAPER?"],
      consumeTurn: false,
    };
  }

  // 11. Cloak (Canonical: WEAR CLOAK)
  if (involves(47, "cloak")) {
    return {
      messages: ["HOW DO YOU WANT TO USE THE CLOAK? (TRY WEARING IT.)"],
      consumeTurn: false,
    };
  }

  // 12. Broom (Canonical: RIDE BROOM / FLY BROOM)
  if (involves(48, "broom")) {
    return {
      messages: ["HOW DO YOU WANT TO USE THE BROOM? (TRY RIDING IT.)"],
      consumeTurn: false,
    };
  }

  // 13. General fallback incorporating player's words:
  const targetText = command.indirectNoun ? ` ON THE ${command.indirectNoun.toUpperCase()}` : "";
  return {
    messages: [`HOW DO YOU WANT TO USE THE ${noun.toUpperCase()}${targetText}?`],
    consumeTurn: false,
  };
}
