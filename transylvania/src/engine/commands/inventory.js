import { MESSAGES } from "../messages.js";
import { getObjectName } from "../state.js";
import { carriedObjects } from "../world.js";

/** @type {import("./index.js").CommandHandler} */
export function inventory({ world, state }) {
  const held = carriedObjects(world, state);
  if (held.length === 0) return [MESSAGES.carryingNothing];
  return [
    MESSAGES.carryingHeader,
    ...held.map((object) => MESSAGES.carriedItem(getObjectName(world, state, object.id))),
  ];
}
