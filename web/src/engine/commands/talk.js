// TALK / SPEAK. Conversation and character interactions.

import { MESSAGES } from "../messages.js";
import { isCarried } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function talk(context) {
  const { state, command } = context;

  const noun = (command.directNoun || command.noun || "").trim().toLowerCase();
  const prepNoun = (command.indirectNoun || "").trim().toLowerCase();
  const fullTarget = `${noun} ${prepNoun}`.trim();

  // Sabrina / Damsel
  const isSabrinaTarget =
    command.X === 71 ||
    command.directX === 71 ||
    command.indirectX === 71 ||
    command.X === 87 ||
    fullTarget.includes("princess") ||
    fullTarget.includes("sabrina") ||
    fullTarget.includes("damsel") ||
    fullTarget.includes("girl");

  const isSabrinaAwakeHere =
    state.objectLoc[38] === state.room || isCarried(state, 38);

  const isSabrinaSleepingHere =
    state.objectLoc[16] === state.room;

  // If no noun specified (bare TALK), default to Sabrina or present entity
  if (!noun && !prepNoun) {
    if (isSabrinaAwakeHere) {
      return {
        messages: [MESSAGES.sabrinaAwakeTalk],
        consumeTurn: false,
      };
    }
    if (isSabrinaSleepingHere) {
      return {
        messages: [MESSAGES.sabrinaSleepingTalk],
        consumeTurn: false,
      };
    }
    if (state.room === 26 && state.objectLoc[10] === 26) {
      return {
        messages: [
          "THE GOBLIN GLARES AT YOU SUSPICIOUSLY AND HISSES, CLUTCHING HIS SHINY OBJECT.",
        ],
        consumeTurn: false,
      };
    }
    if (
      state.room === 16 &&
      (state.objectLoc[8] === 16 || state.objectLoc[10] === 16)
    ) {
      return {
        messages: ["THE BULLFROG BLINKS HIS BULBOUS EYES AND CROAKS LOUDLY."],
        consumeTurn: false,
      };
    }
    if (state.room === 7 && state.objectLoc[24] === 7) {
      return {
        messages: ["THE BLACK CAT HISSES AND ARCHES ITS BACK MENACINGLY."],
        consumeTurn: false,
      };
    }
    if (state.objectLoc[34] === state.room && !state.flags?.WF) {
      return {
        messages: ["THE WEREWOLF REPLIES WITH A BLOODCURDLING HOWL!"],
        consumeTurn: false,
      };
    }
    if (state.objectLoc[39] === state.room && !state.flags?.VR) {
      return {
        messages: ["THE VAMPIRE CHUCKLES DARKLY. 'YOUR BLOOD WILL TASTE SWEET...'"],
        consumeTurn: false,
      };
    }
    return {
      messages: [MESSAGES.whomToSpeak],
      consumeTurn: false,
    };
  }

  if (isSabrinaTarget) {
    if (isSabrinaAwakeHere) {
      return {
        messages: [MESSAGES.sabrinaAwakeTalk],
        consumeTurn: false,
      };
    }
    if (isSabrinaSleepingHere) {
      return {
        messages: [MESSAGES.sabrinaSleepingTalk],
        consumeTurn: false,
      };
    }
    return {
      messages: [MESSAGES.notHere],
      consumeTurn: false,
    };
  }

  // Goblin
  if (
    fullTarget.includes("goblin") ||
    command.X === 81 ||
    command.directX === 81
  ) {
    if (state.room === 26 && state.objectLoc[10] === 26) {
      return {
        messages: [
          "THE GOBLIN GLARES AT YOU SUSPICIOUSLY AND HISSES, CLUTCHING HIS SHINY OBJECT.",
        ],
        consumeTurn: false,
      };
    }
    return {
      messages: [MESSAGES.notHere],
      consumeTurn: false,
    };
  }

  // Bullfrog / Frog
  if (
    fullTarget.includes("frog") ||
    fullTarget.includes("bullfrog") ||
    fullTarget.includes("toad") ||
    command.X === 10 ||
    command.directX === 10
  ) {
    if (
      state.room === 16 &&
      (state.objectLoc[8] === 16 || state.objectLoc[10] === 16)
    ) {
      return {
        messages: ["THE BULLFROG BLINKS HIS BULBOUS EYES AND CROAKS LOUDLY."],
        consumeTurn: false,
      };
    }
    return {
      messages: [MESSAGES.notHere],
      consumeTurn: false,
    };
  }

  // Cat
  if (
    fullTarget.includes("cat") ||
    command.X === 21 ||
    command.directX === 21
  ) {
    if (state.room === 7 && state.objectLoc[24] === 7) {
      return {
        messages: ["THE BLACK CAT HISSES AND ARCHES ITS BACK MENACINGLY."],
        consumeTurn: false,
      };
    }
    return {
      messages: [MESSAGES.notHere],
      consumeTurn: false,
    };
  }

  // Werewolf
  if (
    fullTarget.includes("wolf") ||
    fullTarget.includes("werewolf") ||
    command.X === 80 ||
    command.directX === 80
  ) {
    if (state.objectLoc[34] === state.room && !state.flags?.WF) {
      return {
        messages: ["THE WEREWOLF REPLIES WITH A BLOODCURDLING HOWL!"],
        consumeTurn: false,
      };
    }
    return {
      messages: [MESSAGES.notHere],
      consumeTurn: false,
    };
  }

  // Vampire
  if (
    fullTarget.includes("vampire") ||
    command.X === 78 ||
    command.directX === 78
  ) {
    if (state.objectLoc[39] === state.room && !state.flags?.VR) {
      return {
        messages: ["THE VAMPIRE CHUCKLES DARKLY. 'YOUR BLOOD WILL TASTE SWEET...'"],
        consumeTurn: false,
      };
    }
    return {
      messages: [MESSAGES.notHere],
      consumeTurn: false,
    };
  }

  // Statue / Alien
  if (
    fullTarget.includes("statue") ||
    fullTarget.includes("alien") ||
    command.X === 2 ||
    command.directX === 2
  ) {
    if (state.room === 4) {
      return {
        messages: ["THE CRACKED STATUE REMAINS AS SILENT AS STONE."],
        consumeTurn: false,
      };
    }
    return {
      messages: [MESSAGES.notHere],
      consumeTurn: false,
    };
  }

  // Fallback for talking to inanimate items / scenery
  return {
    messages: [MESSAGES.noResponse],
    consumeTurn: false,
  };
}
