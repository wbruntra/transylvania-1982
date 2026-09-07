// 7000-7180: The per-turn block.
// Turn-based threats, clock, wandering mice, shooting star, and ambient events.

import { getObjectName, getNounMapEntry, isCarried, placeObject, setNounMapEntry } from "./state.js";

/**
 * Creates the per-turn hook function for TRANS.bas:7000-7180.
 *
 * @param {object} options
 * @param {ReturnType<typeof import("./world.js").createWorld>} options.world
 * @param {import("./state.js").GameState} options.state
 * @param {boolean} [options.randomEvents] Whether to enable probabilistic spawns/ambience.
 * @param {() => number} [options.rng] Optional RNG for reproducibility.
 * @returns {() => string[]}
 */
export function createTurnHookManager({ world, state, randomEvents = false, rng = Math.random }) {
  return function runTurnHooks() {
    if (state.isGameOver) return [];

    const messages = [];

    // 7000: IF P%(39)<>P THEN V=-1
    if (state.objectLoc[39] !== state.room) {
      state.timers.V = -1;
    }
    // 7001: IF P%(34)<>P THEN W=-1
    if (state.objectLoc[34] !== state.room) {
      state.timers.W = -1;
    }

    // 7003: IF P<>35 AND P%(5)=35 THEN P%(5)=-1: N%(62)=23: P%(4)=-1: P%(23)=35
    if (state.room !== 35 && state.objectLoc[5] === 35) {
      state.objectLoc[5] = -1;
      setNounMapEntry(state, 62, 23);
      state.objectLoc[4] = -1;
      state.objectLoc[23] = 35;
    }

    // 7005: Clock chime every 70 turns
    if (state.turns > 0 && state.turns % 70 === 0) {
      const chime = Math.floor(state.turns / 70);
      state.hour = chime;
      messages.push(`FAR AWAY A CLOCK STRIKES ${chime}.`);

      // At 5th chime (turn 350) -> 27000 Sunrise ending
      if (chime >= 5) {
        messages.push("THE SUN BEGINS TO APPEAR ON THE HORIZON.");
        messages.push("YOUR TIME HAS RUN OUT! ");
        // 27000: IF P%(N%(71))=P OR P%(N%(71))=-2 THEN 27020
        const damselObjId = getNounMapEntry(world, state, 71) || 16;
        const damselHere =
          state.objectLoc[damselObjId] === state.room || isCarried(state, damselObjId);
        if (damselHere) {
          messages.push(
            "SUDDENLY SOMETHING HITS YOU. YOU AWAKEN WITH A DULL ACHE IN THE BACK OF YOUR HEAD, AND TURN TO FIND THE LIFELESS BODY OF PRINCESS SABRINA LYING IN A POOL OF BLOOD!",
          );
        } else {
          messages.push(
            "YOU HEAR A TERRORFILLED SCREAM. RUNNING TO WHERE IT HAS COME FROM YOU FIND THE LIFELESS BODY OF PRINCESS SABRINA LYING IN A POOL OF BLOOD!",
          );
        }
        messages.push("PRESS ANY KEY TO RESTART THE GAME.");
        state.isGameOver = true;
        return messages;
      }
    }

    // 7015: Vampire death (1 turn after vampire in room)
    if (state.timers.V !== -1 && state.turns - state.timers.V === 1) {
      messages.push("YOU FEEL A PINCH ON YOUR NECK, THE ROOM SPINS, AND YOU BLACK OUT...");
      messages.push("SO MUCH FOR THAT TRY...");
      messages.push("PRESS ANY KEY TO RESTART THE GAME.");
      state.isGameOver = true;
      state.isDead = true;
      return messages;
    }

    // 7020: Werewolf death (1 turn after werewolf in room)
    if (state.timers.W !== -1 && state.turns - state.timers.W === 1) {
      messages.push("TOO LATE! THE FURRY FIEND JUST HAD YOU FOR DINNER...");
      messages.push("SO MUCH FOR THAT TRY...");
      messages.push("PRESS ANY KEY TO RESTART THE GAME.");
      state.isGameOver = true;
      state.isDead = true;
      return messages;
    }

    // 7021-7028: Mice movement (object 20)
    if (state.objectLoc[20] >= 1) {
      let loc = state.objectLoc[20];
      if (loc === 2) loc = 17;
      else if (loc === 17) loc = 3;
      else if (loc === 3) loc = 19;
      else if (loc === 19) loc = 2;
      else if (loc === 38 || loc === 74) loc = loc - 36;
      state.objectLoc[20] = loc;
      if (loc === state.room) {
        messages.push(`THERE IS A ${getObjectName(world, state, 20)}`);
      }
    }

    // 7030: Shooting star at TU - R = 20
    if (state.turns - state.timers.R === 20) {
      messages.push("I THOUGHT I SAW A SHOOTING STAR!");
      placeObject(state, 28, 4);
    }

    // If random events are disabled, skip probabilistic events
    if (!randomEvents) {
      return messages;
    }

    // 7031: IF P%(39)=P OR P%(34)=P THEN 7140
    const monsterPresent =
      state.objectLoc[39] === state.room || state.objectLoc[34] === state.room;

    if (!monsterPresent) {
      // 7040: Cat meow in room 7
      if (state.room === 7 && state.objectLoc[24] === 7 && rng() < 0.5) {
        messages.push("YOU HEAR A LOUD, HISSING 'MEOW'.");
        return messages;
      }

      // 7050-7056: Goblin harassment in room 26
      if (state.room === 26 && state.objectLoc[10] === 26) {
        const goblinMessages = [
          "SOMEONE JUST GAVE YOU A HOTFOOT! AAAAH!",
          "SOMEONE JUST DUMPED WATER ON YOU!",
          "THE GOBLIN JUST GAVE YOU A JUICY BRONX CHEER!",
          "SOMEONE JUST SET YOUR HAIR ON FIRE! YOU WERE ABLE TO PUT IT OUT, THOUGH.",
        ];
        messages.push(goblinMessages[Math.floor(rng() * goblinMessages.length)]);
        return messages;
      }

      // 7060 / 7350: Vampire random appearance in castle (rooms 27..37)
      if (state.room > 26 && state.room < 38) {
        if (!isCarried(state, 32) && !state.flags.VR && rng() < 0.2) {
          state.objectLoc[39] = state.room;
          state.timers.V = state.turns;
          messages.push(`THERE IS A ${getObjectName(world, state, 39)}`);
          return messages;
        }
      }

      // 7090-7100: Werewolf random appearance
      if (!state.flags.WF && state.turns >= 10 && rng() >= 0.67) {
        const safeRooms = [9, 10, 15, 22, 26];
        if (!safeRooms.includes(state.room)) {
          state.objectLoc[34] = state.room;
          state.timers.W = state.turns;
          messages.push(`THERE IS A ${getObjectName(world, state, 34)}`);
          return messages;
        }
      }
    }

    // 7140: Ambient sounds (20% chance)
    if (rng() <= 0.2) {
      const ambientIndex = Math.floor(rng() * 11) + 1;
      if (ambientIndex === 1) {
        messages.push("A WITCH'S CACKLE CUTS THROUGH THE STILL AIR OF THE NIGHT.");
      } else if (ambientIndex === 2) {
        messages.push("A FEW BATS HOVERED OVER YOU FOR A WHILE, BUT FLEW AWAY.");
      } else if (ambientIndex === 3) {
        messages.push("YOU HEAR A WOLF HOWL IN THE DISTANCE.");
      } else if (ambientIndex === 4) {
        messages.push("YOU HEAR MOANING NOISES IN THE DISTANCE.");
      } else if (ambientIndex === 5) {
        messages.push(
          `A STRANGE, GHOSTLY SHAPE JUST FLOATED PAST MOURNFULLY CRYING '${state.flags.YN}, ${state.flags.YN}...'`,
        );
      } else if (ambientIndex === 6) {
        messages.push("YOU HEARD SOME RUSTLING NOISES NEARBY.");
      } else if (ambientIndex === 7) {
        messages.push("A ROUGH VOICE SHOUTS 'GET OUT!'");
      } else if (ambientIndex === 8) {
        messages.push("HOOOO! HOOOO! (WHO?) - JUST AN OWL.");
      } else if (ambientIndex === 9) {
        messages.push("A GRIM CHUCKLE ERUPTS BEHIND YOU.");
      } else if (ambientIndex === 10) {
        // Eagle
        const room = world.room(state.room);
        if (room.type <= 2) {
          messages.push(
            "A GIANT EAGLE SWOOPS DOWN ON YOU, GRASPS YOU IN ITS TALONS, AND TAKES YOU TO ANOTHER PART OF THE FOREST.",
          );
          let newRoom = state.room;
          for (let attempts = 0; attempts < 50; attempts++) {
            const candidate = Math.floor(rng() * 23) + 1;
            if (world.room(candidate).type <= 2 && candidate !== state.room) {
              newRoom = candidate;
              break;
            }
          }
          state.room = newRoom;
          state.objectLoc[34] = -1;
          // No describeRoom here: engine.execute redescribes whenever a turn
          // changed the room (TRANS.bas:7990). Doing it here too printed the
          // new room twice.
        }
      } else if (ambientIndex === 11) {
        messages.push("A CAT DARTED BY, FOLLOWED BY THREE RAVENOUS-LOOKING MICE.");
      }
    }

    return messages;
  };
}
