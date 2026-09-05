// Commands about the game rather than in it.

import { MESSAGES } from "../messages.js";

/** @type {import("./index.js").CommandHandler} */
export function help() {
  return [MESSAGES.help];
}

/** @type {import("./index.js").CommandHandler} */
export function quit() {
  return [MESSAGES.quit];
}
