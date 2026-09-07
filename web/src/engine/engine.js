import { validateGameData } from "../data/gameData.js";
import { COMMANDS } from "./commands/index.js";
import { describeRoom } from "./describe.js";
import { MESSAGES } from "./messages.js";
import { parse } from "./parser.js";
import { runRules } from "./rules.js";
import { createState } from "./state.js";
import { createTurnHookManager } from "./turnHooks.js";
import { createWorld } from "./world.js";

/**
 * @param {import("../data/gameData.js").GameData} data
 * @param {{
 *   state?: import("./state.js").GameState,
 *   randomEvents?: boolean,
 *   rng?: () => number
 * }} [options]
 */
export function createEngine(data, options = {}) {
  const world = createWorld(validateGameData(data));
  const state = options.state ?? createState(world);

  /**
   * Things that happen at the end of every turn regardless of the command:
   * the tower clock, the vampire and werewolf timers at TRANS.bas:7015-7030.
   * @type {Array<(context: {world: typeof world, state: typeof state}) => string[] | void>}
   */
  const turnHooks = [
    createTurnHookManager({
      world,
      state,
      randomEvents: options.randomEvents ?? false,
      rng: options.rng ?? Math.random,
    }),
  ];

  return {
    world,
    state,

    /** @param {(context: {world: typeof world, state: typeof state}) => string[] | void} hook */
    addTurnHook(hook) {
      turnHooks.push(hook);
    },

    /** @returns {boolean} */
    isGameOver() {
      return Boolean(state.isGameOver);
    },

    /** The opening text of a new game. */
    start() {
      if (!state.visitedRooms) state.visitedRooms = [];
      if (!state.visitedRooms.includes(state.room)) {
        state.visitedRooms.push(state.room);
      }
      return [MESSAGES.welcome, ...describeRoom(world, state)];
    },

    /** @returns {number[]} Discovered room IDs. */
    getVisitedRooms() {
      if (!state.visitedRooms) state.visitedRooms = [state.room];
      return [...state.visitedRooms];
    },

    /**
     * Runs one command.
     * @param {string} input
     * @returns {{echo: string | null, messages: string[]}}
     */
    execute(input) {
      if (!state.visitedRooms) state.visitedRooms = [];
      if (!state.visitedRooms.includes(state.room)) {
        state.visitedRooms.push(state.room);
      }

      if (state.isGameOver) {
        if (input.toLowerCase().trim() === "restart") {
          const fresh = createState(world);
          Object.assign(state, fresh);
          return { echo: input.toUpperCase(), messages: [MESSAGES.welcome, ...describeRoom(world, state)] };
        }
        return {
          echo: input.toUpperCase(),
          messages: ["PRESS ANY KEY TO RESTART THE GAME."],
        };
      }

      const command = parse(input, world, state);
      if (!command) return { echo: null, messages: [] };

      state.turns += 1;
      const roomBefore = state.room;
      const context = { world, state, command };

      // Room- and object-specific overrides win over the generic handler.
      let result = runRules(context);
      if (result === null) {
        const handler = COMMANDS[command.verb];
        result = handler ? handler(context) : null;
      }
      if (result === null) {
        result = { messages: [MESSAGES.dontUnderstand], consumeTurn: false };
      }

      let messages = Array.isArray(result) ? result : result.messages;
      let consumeTurn = Array.isArray(result) ? true : (result.consumeTurn ?? true);

      // Unrecognized commands ("I DON'T UNDERSTAND.") do not consume a turn.
      // This prevents unfair deaths from discovering verbs or typos when threats (werewolf/vampire) are present.
      if (messages.length === 1 && messages[0] === MESSAGES.dontUnderstand) {
        consumeTurn = false;
      }

      if (!consumeTurn) {
        state.turns -= 1;
        return { echo: input.toUpperCase(), messages, events: [] };
      }

      // Anything the turn hooks do happens TO the player rather than because
      // of them, so a room change here is an involuntary relocation -- the
      // giant eagle at TRANS.bas:7271, and any future hook that moves you.
      // The UI uses this to signal that something just happened, since a line
      // of text scrolling past is easy to miss.
      /** @type {string[]} */
      const events = [];
      const roomAfterCommand = state.room;

      for (const hook of turnHooks) {
        messages = messages.concat(hook({ world, state }) ?? []);
      }

      if (state.room !== roomAfterCommand) events.push("teleport");
      if (state.isGameOver) events.push("gameOver");

      // TRANS.bas:7990 -- after the per-turn block, redescribe the room if the
      // turn moved us. Covers ordinary movement and every scripted teleport
      // alike. Skipped when the turn ended the game, as the original does.
      if (state.room !== roomBefore && !state.isGameOver) {
        if (!state.visitedRooms.includes(state.room)) {
          state.visitedRooms.push(state.room);
        }
        messages = messages.concat(describeRoom(world, state));
      }

      return { echo: input.toUpperCase(), messages, events };
    },
  };
}
