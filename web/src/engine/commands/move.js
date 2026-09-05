// Movement. TRANS.bas keeps ordinary exits in D%(room, 0..5); anything else is
// a special case handled by the per-room scripts (see rules.js).

import { describeRoom } from "../describe.js";
import { MESSAGES } from "../messages.js";

/** @type {import("./index.js").CommandHandler} */
export function go({ world, state, command }) {
  if (!command.direction) return null; // "go" with no direction: not understood.

  const destination = world.destination(state.room, command.direction);
  if (destination <= 0) return [MESSAGES.cantGoThatWay];

  state.room = destination;
  return describeRoom(world, state);
}
