// 9400: SET (I=35), CAST (I=54), SAIL (I=59), ROW (I=58). Lake crossing at room 16.

import { MESSAGES } from "../messages.js";
import { isCarried } from "../state.js";

/** @type {import("./index.js").CommandHandler} */
export function sail({ state, command }) {
  const isCastSail = command.X === 82 && command.I === 54;
  const isSetSail = (command.X === 78 || command.X === 82) && command.I === 35;
  const isSailBoat = (command.X === 56 || command.X === 82 || !command.X) && (command.I === 59 || command.I === 47);

  if (!(isCastSail || isSetSail || isSailBoat) || state.room !== 16) {
    return [MESSAGES.dontUnderstand];
  }

  // 9420 IF P%(38)<>-2: guards refuse without Princess Sabrina; sails back without turn consumption
  if (!isCarried(state, 38)) {
    return {
      messages: [
        "AFTER A MISERABLE, CHOPPY JOURNEY, THE KING'S GUARDS REFUSE TO LET YOU LAND WITHOUT THE PRINCESS SABRINA! THEY LET YOU CHOOSE BETWEEN THE GUILLOTINE AND SAILING BACK. YOU SAIL BACK.",
      ],
      consumeTurn: false,
    };
  }

  // 9440-9450: Win ending! 9450 falls through to 30040, the same restart
  // prompt every other ending reaches, so the game is over here too.
  state.isGameOver = true;
  state.isDead = false;
  state.gameOverReason = "win";
  state.gameOverDetails =
    "You safely sailed Princess Sabrina across the lake back to her father's kingdom! But the ungrateful King immediately ordered you to deepest Africa to save his other daughter... So tonight, disguised in humble peasant dress, you slip away into the moonlit castle courtyard, plotting your daring escape with Sabrina!";
  return [
    "AFTER A PRECARIOUS FEW MINUTES, THE JOURNEY GOES SMOOTHLY. A SOMEWHAT TIRED AND BEWILDERED PRINCESS SABRINA GRACIOUSLY THANKS YOU AS YOU RETURN TO HER KINGDOM. THE KING IS SUITABLY IMPRESSED AND ASKS THAT YOU BE SENT TO DEEPEST AFRICA TO SAVE HIS OTHER DAUGHTER. THAT EVENING, YOU SNEAK OUT IN PEASANT DRESS, PLOTTING YOUR RESCUE OF SABRINA FROM THE KING'S CASTLE...WELL DONE!",
    "PRESS ANY KEY TO RESTART THE GAME.",
  ];
}
