// Turns a typed line into a {verb, noun} pair. No game rules live here.

import {
  lookUpDirection,
  lookUpVerb,
  resolveNoun,
  resolveVerb,
  verbTakesObject,
} from "./vocabulary.js";

const PREPOSITIONS = new Set([
  "on", "onto", "with", "at", "to", "in", "into", "against", "for", "under", "from"
]);

const LEADING_PARTICLES = new Set([
  "at", "to", "in", "into", "on", "onto", "under", "behind", "through", "for"
]);

/**
 * @typedef {object} Command
 * @property {string} verb          Canonical verb, or "go" for a bare direction.
 * @property {number | null} I      1-based verb id from world.verbs (or null).
 * @property {string} noun          The rest of the line, "" when there was none.
 * @property {number | null} X      1-based noun id from world.nouns (or null).
 * @property {string | null} direction  Direction code when the command is a move.
 * @property {string} input         The normalised input, for echoing.
 * @property {string | null} [prep]           Preposition if command had multiple nouns ("on", "with", etc.).
 * @property {string} [directNoun]            The direct object phrase.
 * @property {number | null} [directX]        Direct noun ID.
 * @property {string | null} [indirectNoun]   The indirect object phrase (target/instrument).
 * @property {number | null} [indirectX]      Indirect noun ID.
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
  let directNoun = "";
  let indirectNoun = null;
  let prep = null;

  // A bare direction: "north", "n".
  const bareDirection = lookUpDirection(first);
  if (bareDirection && rest.length === 0) {
    verb = "go";
    direction = bareDirection;
    parsedNoun = first;
    directNoun = first;
  } else {
    const canonicalVerb = lookUpVerb(first);
    if (!canonicalVerb) {
      verb = "";
      parsedNoun = input;
      directNoun = input;
    } else if (canonicalVerb === "go") {
      verb = "go";
      direction = rest.length === 1 ? lookUpDirection(rest[0]) : null;
      parsedNoun = noun;
      directNoun = noun;
    } else {
      verb = canonicalVerb;
      if (verbTakesObject(verb) && rest.length > 0) {
        let tokens = [...rest];
        // Strip leading verb particle: "look at statue" -> "look statue"
        if (tokens.length > 1 && LEADING_PARTICLES.has(tokens[0])) {
          tokens = tokens.slice(1);
        }

        // Check for preposition separating two nouns: e.g. "ring on statue", "door with pick"
        let splitIndex = -1;
        for (let i = 1; i < tokens.length - 1; i++) {
          if (PREPOSITIONS.has(tokens[i])) {
            splitIndex = i;
            break;
          }
        }

        if (splitIndex !== -1) {
          directNoun = tokens.slice(0, splitIndex).join(" ");
          prep = tokens[splitIndex];
          indirectNoun = tokens.slice(splitIndex + 1).join(" ");
        } else if (world && tokens.length >= 2) {
          // Double-noun without preposition: e.g. "feed frog flies"
          for (let j = 1; j < tokens.length; j++) {
            const p1 = tokens.slice(0, j).join(" ");
            const p2 = tokens.slice(j).join(" ");
            const x1 = resolveNoun(world, p1, state?.room, state);
            const x2 = resolveNoun(world, p2, state?.room, state);
            if (x1 && x2) {
              directNoun = p1;
              indirectNoun = p2;
              break;
            }
          }
          if (!indirectNoun) {
            directNoun = tokens.join(" ");
          }
        } else {
          directNoun = tokens.join(" ");
        }
        parsedNoun = directNoun;
      } else {
        parsedNoun = "";
        directNoun = "";
      }
    }
  }

  const I = world ? resolveVerb(world, first, verb) : null;
  const directX = world ? resolveNoun(world, directNoun, state?.room, state) : null;
  const indirectX = indirectNoun && world ? resolveNoun(world, indirectNoun, state?.room, state) : null;
  const X = directX !== null ? directX : indirectX;

  const cmd = {
    verb,
    I,
    noun: parsedNoun,
    X,
    direction,
    input,
  };

  if (prep !== null || indirectNoun !== null) {
    cmd.prep = prep;
    cmd.directNoun = directNoun;
    cmd.directX = directX;
    cmd.indirectNoun = indirectNoun;
    cmd.indirectX = indirectX;
  }

  return cmd;
}
