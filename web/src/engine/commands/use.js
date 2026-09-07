import { MESSAGES } from "../messages.js";
import { isCarried } from "../state.js";
import { catchFlies } from "./take.js";
import { load } from "./load.js";
import { shoot } from "./shoot.js";
import { unlock } from "./unlock.js";
import { wave } from "./wave.js";
import { wear } from "./wear.js";

/** @type {import("./index.js").CommandHandler} */
export function use(context) {
  const { world, state, command } = context;

  // 1. Flypaper in Room 9 to catch flies:
  if (
    state.room === 9 &&
    state.objectLoc[7] === 9 &&
    (!command.noun ||
      command.X === 141 ||
      command.X === 65 ||
      command.noun.includes("paper") ||
      command.noun.includes("fly"))
  ) {
    return catchFlies(world, state);
  }

  // 2. Pistol: load or shoot
  if (command.X === 33 || command.noun?.includes("pistol") || command.noun?.includes("gun")) {
    if (isCarried(state, 17) && isCarried(state, 22) && !state.flags.GN) {
      return load(context);
    }
    if (state.flags.GN && isCarried(state, 17)) {
      return shoot(context);
    }
  }

  // 3. Key or pick
  if (
    command.X === 11 ||
    command.X === 26 ||
    command.noun?.includes("key") ||
    command.noun?.includes("pick")
  ) {
    return unlock(context);
  }

  // 4. Cross
  if (command.X === 26 || command.noun?.includes("cross")) {
    return wave(context);
  }

  // 5. Elixir
  if (command.X === 28 || command.noun?.includes("elixir")) {
    return wave(context);
  }

  // 6. Cloak
  if (command.X === 47 || command.noun?.includes("cloak")) {
    return wear(context);
  }

  // Fallback: non-turn-consuming unrecognized input
  return {
    messages: [MESSAGES.dontUnderstand],
    consumeTurn: false,
  };
}
