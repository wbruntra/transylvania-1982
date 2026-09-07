// Movement. TRANS.bas keeps ordinary exits in D%(room, 0..5); anything else is
// a special case handled by the per-room scripts (see rules.js).

import { specialNav5737 } from "../helpers.js";
import { MESSAGES } from "../messages.js";
import { enterStructure, exitStructure } from "./enterExit.js";

/** @type {import("./index.js").CommandHandler} */
export function go(context) {
  const { world, state, command } = context;

  // 5700-5737: GO takes a place as readily as a direction -- GO GRATE, GO
  // CABIN, GO STAIRS. Without this, half the map's entrances only opened to
  // ENTER, which is not what the room descriptions tell you to type.
  if (!command.direction) {
    // 5700 goes back to the prompt rather than 7000, so this costs no turn.
    if (!command.X) return { messages: [MESSAGES.needDirection], consumeTurn: false };
    if (command.X === 8) return exitStructure(context); // 5735: OUT
    if (command.X === 7) return enterStructure(context); // 5736: IN
    const special = specialNav5737(world, state, command.X);
    if (special !== null) return special;
    return null;
  }

  const destination = world.destination(state.room, command.direction);
  if (destination <= 0) return [MESSAGES.cantGoThatWay];

  // No description here: engine.execute describes the room whenever a turn
  // changed it, the way TRANS.bas:7990/8000 does. That is what makes scripted
  // teleports (POOF! into room 9, the spinning wall, the broomstick) describe
  // where you land without every one of them remembering to.
  state.room = destination;
  return [];
}
