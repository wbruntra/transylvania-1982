// Turns a typed line into a {verb, noun} pair. No game rules live here.

import {
  lookUpDirection,
  lookUpVerb,
  resolveNoun,
  resolveVerb,
  verbTakesObject,
} from "./vocabulary.js";

/**
 * @typedef {object} Command
 * @property {string} verb          Canonical verb, or "go" for a bare direction.
 * @property {number | null} I      1-based verb id from world.verbs (or null).
 * @property {string} noun          The rest of the line, "" when there was none.
 * @property {number | null} X      1-based noun id from world.nouns (or null).
 * @property {string | null} direction  Direction code when the command is a move.
 * @property {string} input         The normalised input, for echoing.
 */

/**
 * @param {string} raw
 * @param {ReturnType<typeof import("./world.js").createWorld>} [world]
 * @param {import("./state.js").GameState} [state]
 * @returns {Command | null}  null when the line was blank.
 */
export function parse(raw, world = null, state = null) {
  const input = raw.toLowerCase().trim().replace(/\s+/g, " ");
  if (!input) return null;

  const [first, ...rest] = input.split(" ");
  const noun = rest.join(" ");

  let verb = "";
  let direction = null;
  let parsedNoun = "";

  // A bare direction: "north", "n".
  const bareDirection = lookUpDirection(first);
  if (bareDirection && rest.length === 0) {
    verb = "go";
    direction = bareDirection;
    parsedNoun = first;
  } else {
    const canonicalVerb = lookUpVerb(first);
    if (!canonicalVerb) {
      verb = "";
      parsedNoun = input;
    } else if (canonicalVerb === "go") {
      verb = "go";
      direction = rest.length === 1 ? lookUpDirection(rest[0]) : null;
      parsedNoun = noun;
    } else {
      verb = canonicalVerb;
      parsedNoun = verbTakesObject(verb) ? noun : "";
    }
  }

  const I = world ? resolveVerb(world, first, verb) : null;
  const X = world ? resolveNoun(world, parsedNoun, state?.room, state) : null;

  return { verb, I, noun: parsedNoun, X, direction, input };
}
