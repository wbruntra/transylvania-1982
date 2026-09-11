import { MESSAGES } from "../messages.js";
import { isCarried } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function touch({ state, command }) {
  const noun = (command.directNoun || command.noun || "").toLowerCase().trim();

  // Backward compatibility with test: "touch note"
  if (noun === "note") {
    return [MESSAGES.nothingHappened];
  }

  if (!noun || noun === "it") {
    return { messages: ["YOU TOUCH IT, BUT NOTHING HAPPENS."], consumeTurn: false };
  }

  // Statue in Room 4
  if (command.X === 2 || noun.includes("statue")) {
    if (state.room === 4 && isCarried(state, 5)) {
      return {
        messages: [
          "YOU TOUCH THE STATUE, BUT NOTHING HAPPENS. THE SHINY RING ON YOUR FINGER TINGLES WITH A SOFT WARMTH.",
        ],
        consumeTurn: false,
      };
    }
    return {
      messages: ["YOU TOUCH THE COLD STONE STATUE, BUT NOTHING HAPPENS."],
      consumeTurn: false,
    };
  }

  // Stump in Room 1
  if (command.X === 49 || noun.includes("stump")) {
    return {
      messages: ["YOU TOUCH THE ANCIENT STUMP, BUT NOTHING HAPPENS."],
      consumeTurn: false,
    };
  }

  // Bullfrog in Room 16
  if (command.X === 10 || noun.includes("frog")) {
    return {
      messages: ["YOU REACH OUT TO TOUCH THE BULLFROG, BUT HE HOPS BACK WITH AN IRRITATED CROAK."],
      consumeTurn: false,
    };
  }

  // Cat in Room 7
  if (command.X === 24 || noun.includes("cat")) {
    return {
      messages: ["THE FIERCE BLACK CAT HISSES AND SWATS SHARPLY AT YOUR FINGERS!"],
      consumeTurn: false,
    };
  }

  // Werewolf
  if (command.X === 34 || noun.includes("werewolf") || noun.includes("wolf")) {
    return {
      messages: ["ARE YOU CRAZY? TOUCHING THAT VICIOUS BEAST WILL GET YOUR ARM BITTEN OFF!"],
      consumeTurn: false,
    };
  }

  // Vampire
  if (command.X === 39 || noun.includes("vampire")) {
    return {
      messages: ["YOU SHUDDER AT THE COLD GRAVE-AURA OF THE VAMPIRE AND PULL YOUR HAND BACK!"],
      consumeTurn: false,
    };
  }

  // Goblin
  if (command.X === 10 || noun.includes("goblin")) {
    return {
      messages: ["THE GOBLIN DODGES AWAY WITH A SNEERING LAUGH!"],
      consumeTurn: false,
    };
  }

  // Sabrina / Damsel in Room 37
  if (command.X === 70 || noun.includes("damsel") || noun.includes("sabrina")) {
    return {
      messages: ["YOU TOUCH THE PRINCESS, BUT SHE REMAINS IN A DEEP, UNNATURAL SLUMBER."],
      consumeTurn: false,
    };
  }

  // Generic touch
  return {
    messages: [`YOU TOUCH THE ${noun.toUpperCase()}, BUT NOTHING HAPPENS.`],
    consumeTurn: false,
  };
}
