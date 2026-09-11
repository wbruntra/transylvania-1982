// Proof that the port is finishable: one game, played from the opening room
// to the victory text with nothing but commands a player could type -- no
// assignments to state.room or state.locations anywhere. Modeled directly on
// ../../web/test/winnable.test.js, which does the same thing for
// Transylvania.
//
// The win condition (engine.js's handleMove) is: carry item 25 (the young
// dragon) into room 149. The script below is the shortest route to that,
// found by BFS over the room graph plus two edges the game only adds at
// runtime -- room 38 has no `east` exit until `LOOK WATERFALL` there
// (handleLook sets it), and room 252 has no `down` exit until `TIE ROPE`
// there (handleTie links 252<->244). Without those two, most of the map
// (rooms 40-251 and 253) is unreachable from the start room at all -- see
// RESEARCH.md/PORTING.md for the BFS that found this.
//
// It also detours through room 15 once to `TAKE WATER`: the thirst mechanic
// (checkThirst) auto-drinks from a filled waterskin every 10 turns and kills
// you a lapse after it runs dry, and the round trip (87 commands) outlasts
// one waterskin fill (5 units). The first version of this test, without the
// detour, died of thirst one room short of the destination -- it's a fix,
// not a decoration.
//
// Indices into the script below, for anyone tracing a step against MQ.bas or
// game.json:
//   0-5    outfit at the shop (room 2): waterskin, rope, lantern, rations,
//          light the lantern.
//   6-13   room 1 -> room 38 (the waterfall).
//   14-24  LOOK WATERFALL unlocks the passage; through the dark tunnel
//          (40-54, needs the lit lantern) to the cliff-top (252).
//   25-29  TIE ROPE reaches the ledge below (244); across the cave to the
//          cub (253).
//   30-34  back to the cliff-top (252).
//   35-49  back through the tunnel and out to the main road, to room 11.
//   50-54  detour: 11 -> 13 -> 15, TAKE WATER, back to 11.
//   55-86  the long trek south/west to the dragon's lair (149) -- arriving
//          there with the cub is the win.
const script = [
  'north', 'take waterskin', 'take rope', 'take lantern', 'take rations', 'light lantern',
  'north', 'north', 'north', 'east', 'north', 'north', 'east', 'east',
  'look waterfall', 'east',
  'north', 'north', 'north', 'north', 'north', 'north', 'north',
  'west', 'west',
  'tie rope', 'down', 'east', 'east', 'take cub',
  'west', 'west', 'up', 'east', 'east',
  'south', 'south', 'south', 'south', 'south', 'south', 'south',
  'west', 'west', 'south', 'west', 'south', 'west', 'west', 'west',
  'west', 'west', 'take water', 'east', 'east',
  'south', 'south',
  'west', 'west', 'west', 'west', 'west', 'west',
  'down',
  'west', 'west', 'west', 'west', 'west', 'west', 'west', 'west',
  'west', 'west', 'west', 'west', 'west', 'west', 'west',
  'north', 'west', 'north', 'north', 'west', 'west', 'west',
  'north', // arriving at room 149 with the cub -- this is the win
]

import { expect, test } from 'bun:test'
import { runTurn } from '../src/engine/engine.js'
import { newGame } from '../src/engine/state.js'

test('the game can be won: fetch the cub and deliver it to the dragon', () => {
  let state = newGame()
  let lastLines = []

  for (const command of script) {
    const result = runTurn(state, command)
    state = result.state
    lastLines = result.lines
    if (state.over && !state.won) {
      throw new Error(
        `Game ended before winning, at command "${command}" (turn ${state.turns}, room ${state.room}): ${lastLines.join(' / ')}`
      )
    }
  }

  expect(state.won).toBe(true)
  expect(state.over).toBe(true)
  expect(state.room).toBe(4) // the win teleports you to the castle
  expect(lastLines.join(' ')).toMatch(/FARE THEE WELL/)
})
