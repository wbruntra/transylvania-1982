// The game loop, with no DOM in sight.
//
// `execute` takes a line of input and returns the lines to print. That is the
// whole interface: the browser renders the result, and tests can play a
// walkthrough and assert on state without a document.

import { validateGameData } from "../data/gameData.js";
import { COMMANDS } from "./commands/index.js";
import { describeRoom } from "./describe.js";
import { MESSAGES } from "./messages.js";
import { parse } from "./parser.js";
import { runRules } from "./rules.js";
import { createState } from "./state.js";
import { createWorld } from "./world.js";

/**
 * @param {import("../data/gameData.js").GameData} data
 * @param {{state?: import("./state.js").GameState}} [options]
 */
export function createEngine(data, options = {}) {
  const world = createWorld(validateGameData(data));
  const state = options.state ?? createState(world);

  /**
   * Things that happen at the end of every turn regardless of the command:
   * the tower clock, the vampire and werewolf timers at TRANS.bas:7015-7030.
   * None are registered yet -- the schedules are still to be read out of the
   * listing -- but the hook is where they go, rather than inside a verb.
   * @type {Array<(context: {world: typeof world, state: typeof state}) => string[] | void>}
   */
  const turnHooks = [];

  return {
    world,
    state,

    /** @param {(context: {world: typeof world, state: typeof state}) => string[] | void} hook */
    addTurnHook(hook) {
      turnHooks.push(hook);
    },

    /** The opening text of a new game. */
    start() {
      return [MESSAGES.welcome, ...describeRoom(world, state)];
    },

    /**
     * Runs one command.
     * @param {string} input
     * @returns {{echo: string | null, messages: string[]}}
     */
    execute(input) {
      const command = parse(input, world, state);
      if (!command) return { echo: null, messages: [] };

      state.turns += 1;
      const context = { world, state, command };

      // Room- and object-specific overrides win over the generic handler.
      let result = runRules(context);
      if (result === null) {
        const handler = COMMANDS[command.verb];
        result = handler ? handler(context) : null;
      }
      if (result === null) result = [MESSAGES.dontUnderstand];

      let messages = Array.isArray(result) ? result : result.messages;
      const consumeTurn = Array.isArray(result) ? true : (result.consumeTurn ?? true);

      if (!consumeTurn) {
        state.turns -= 1;
        return { echo: input.toUpperCase(), messages };
      }

      for (const hook of turnHooks) {
        messages = messages.concat(hook({ world, state }) ?? []);
      }

      return { echo: input.toUpperCase(), messages };
    },
  };
}
