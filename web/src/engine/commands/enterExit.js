// 10000: EXIT / IN and 11000: ENTER / OUT. Room-type arithmetic.

import { describeRoom } from "../describe.js";
import { specialNav5737 } from "../helpers.js";
import { MESSAGES } from "../messages.js";

/**
 * 10000: EXIT / OUT (and verb 70 IN per TRANS.bas:1167).
 * @type {import("./index.js").CommandHandler}
 */
export function exitStructure({ world, state }) {
  const room = world.room(state.room);

  // 10000 IF RT%(P)<4 THEN 230
  if (room.type < 4) return [MESSAGES.dontUnderstand];

  // 10010 IF RT%(P)<7 THEN P=P-RT%(P)+3: GOTO 7000
  if (room.type < 7) {
    state.room = state.room - room.type + 3;
    return describeRoom(world, state);
  }

  // Type 7+ rooms
  if (state.room === 27) {
    state.room = 13;
    return describeRoom(world, state);
  }
  if (state.room === 36 || state.room === 11) {
    state.room = state.room - 6;
    return describeRoom(world, state);
  }
  if (state.room === 38) {
    state.room = 2;
    return describeRoom(world, state);
  }
  if (state.room === 15) {
    state.room = 16;
    return describeRoom(world, state);
  }
  if (state.room === 9 || state.room === 10 || state.room === 22) {
    return [MESSAGES.cant];
  }

  return describeRoom(world, state);
}

/**
 * 11000: ENTER / IN (and verb 71 OUT per TRANS.bas:1167).
 * @type {import("./index.js").CommandHandler}
 */
export function enterStructure(context) {
  const { world, state, command } = context;
  const room = world.room(state.room);

  // 11000 IF RT%(P)<>2 THEN 5737
  if (room.type !== 2) {
    if (command.X) {
      const specialResult = specialNav5737(world, state, command.X);
      if (specialResult !== null) return specialResult;
    }
    return [MESSAGES.cant];
  }

  // 11005 IF P=8 THEN 240
  if (state.room === 8) return [MESSAGES.cant];

  // 11010 IF P=23 OR P=6 THEN P=P+1
  if (state.room === 23 || state.room === 6) {
    state.room = state.room + 1;
    return describeRoom(world, state);
  }

  // 11015 IF P=13 THEN P=27
  if (state.room === 13) {
    state.room = 27;
    return describeRoom(world, state);
  }

  return describeRoom(world, state);
}
