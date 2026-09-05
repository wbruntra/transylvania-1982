// Handlers for verbs that produce canned responses.
// See PORTING.md Tier 1.

import { MESSAGES } from "../messages.js";

/** @type {import("./index.js").CommandHandler} */
export const notHere = () => [MESSAGES.notHere];

/** @type {import("./index.js").CommandHandler} */
export const dontUnderstand = () => [MESSAGES.dontUnderstand];

/** @type {import("./index.js").CommandHandler} */
export const cant = () => [MESSAGES.cant];

/** @type {import("./index.js").CommandHandler} */
export const nothingHappened = () => [MESSAGES.nothingHappened];

/** @type {import("./index.js").CommandHandler} */
export const nothingUnusual = () => [MESSAGES.nothingUnusual];

/** @type {import("./index.js").CommandHandler} */
export const whistle = () => [MESSAGES.whistleEchoed];

/** @type {import("./index.js").CommandHandler} */
export const kiss = () => [MESSAGES.littleCorny];
