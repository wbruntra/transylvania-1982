// Explanations, badges and details for each way the game can end.

import { isCarried } from "./state.js";

/**
 * @typedef {object} GameOverInfo
 * @property {"victory" | "defeat" | "quit"} type
 * @property {string} title
 * @property {string} badge
 * @property {string} icon
 * @property {string} heading
 * @property {string} description
 * @property {string} buttonLabel
 */

/**
 * @param {import("./state.js").GameState} state
 * @returns {GameOverInfo | null}
 */
export function getGameOverInfo(state) {
  if (!state || !state.isGameOver) return null;

  const reason =
    state.gameOverReason ??
    (!state.isDead && isCarried(state, 38)
      ? "win"
      : state.timers?.W !== -1
        ? "werewolf"
        : state.timers?.V !== -1
          ? "vampire"
          : state.hour >= 5
            ? "time"
            : "quit");

  switch (reason) {
    case "win":
      return {
        type: "victory",
        title: "QUEST COMPLETE!",
        badge: "VICTORY",
        icon: "🏆",
        heading: "You Escaped With Sabrina!",
        description:
          state.gameOverDetails ||
          "You sailed Princess Sabrina across the lake to safety! But the King was not satisfied—he demanded you embark for deepest Africa to rescue his other daughter. Disguised in humble peasant dress, you sneak out into the moonlit castle courtyard, plotting Sabrina's rescue from her father's castle! Well done!",
        buttonLabel: "PLAY AGAIN",
      };

    case "werewolf":
      return {
        type: "defeat",
        title: "MAULED BY WEREWOLF",
        badge: "DEFEAT",
        icon: "🐺",
        heading: "The Werewolf Had You For Dinner!",
        description:
          state.gameOverDetails ||
          (state.lastActionUnloadedShot
            ? "You tried to shoot the werewolf, but your flintlock pistol was empty! The furry fiend lunged and had you for dinner before you could reload."
            : "The ferocious werewolf ambushed you in the dark forest and had you for dinner before you could defend yourself."),
        buttonLabel: "TRY AGAIN",
      };

    case "vampire":
      return {
        type: "defeat",
        title: "CLAIMED BY VAMPIRE",
        badge: "DEFEAT",
        icon: "🧛",
        heading: "The Vampire Drained Your Blood!",
        description:
          state.gameOverDetails ||
          "You felt a sharp pinch on your neck, the room spun, and you blacked out. The vampire drained your blood and claimed you as one of the undead!",
        buttonLabel: "TRY AGAIN",
      };

    case "collapse":
      return {
        type: "defeat",
        title: "CRUSHED BY CAVE-IN",
        badge: "DEFEAT",
        icon: "🪨",
        heading: "The Cavern Collapsed!",
        description:
          state.gameOverDetails ||
          "Dazzling light erupted from the black box, causing the cavern ceiling to violently collapse and crush you beneath falling rock.",
        buttonLabel: "TRY AGAIN",
      };

    case "time":
      return {
        type: "defeat",
        title: "TIME HAS RUN OUT",
        badge: "DEFEAT",
        icon: "🌅",
        heading: "Dawn Broke Over Transylvania!",
        description:
          state.gameOverDetails ||
          "The clock struck 5:00 AM. The sun has risen, your time ran out, and Princess Sabrina perished before you could lift the curse.",
        buttonLabel: "TRY AGAIN",
      };

    case "quit":
    default:
      return {
        type: "quit",
        title: "QUEST ABANDONED",
        badge: "GAME OVER",
        icon: "💀",
        heading: "You Surrendered to the Night.",
        description:
          state.gameOverDetails ||
          "You abandoned your quest, leaving Transylvania and Princess Sabrina to their dark fates.",
        buttonLabel: "RESTART GAME",
      };
  }
}
