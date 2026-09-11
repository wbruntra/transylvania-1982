// Per-mechanic coverage, complementing winnable.test.js the way
// ../../web/test/walkthrough.test.js complements ../../web/test/winnable.test.js
// there: winnable.test.js proves *a* path through the game works end to end;
// this file proves each individual interaction along the way -- and the ones
// off the critical path, like surviving a fight you didn't have to start --
// behaves the way MQ.bas says it should. Each test sets up state directly
// (room, inventory, flags) rather than walking there, so a puzzle's test
// doesn't depend on every puzzle before it in the map already working.
//
// Line numbers in comments refer to quest_port_kit/MQ.bas.

import { expect, test } from 'bun:test'
import { runTurn } from '../src/engine/engine.js'
import { newGame, carryItem, isCarried } from '../src/engine/state.js'

function freshAt(room, overrides = {}) {
  const state = newGame()
  state.room = room
  return Object.assign(state, overrides)
}

function say(state, command) {
  const result = runTurn(state, command)
  return result.lines
}

// --- Movement edge cases -----------------------------------------------

test('the boat-crossing area refuses a swim-off with its own message (202/204)', () => {
  const state = freshAt(93) // no east exit from here
  const lines = say(state, 'east')
  expect(lines.join(' ')).toMatch(/GORN YELLS AT YOU FROM THE SHORE/)
  expect(state.room).toBe(93) // refused, no move
})

test('dark rooms refuse entry without a lit lantern, and let you through once lit (3800-3805)', () => {
  const state = freshAt(38) // room 38's east exit needs LOOK WATERFALL first
  say(state, 'look waterfall')
  const blocked = say(state, 'east')
  expect(blocked.join(' ')).toMatch(/TOO DARK/)
  expect(state.room).toBe(38)

  carryItem(state, 22) // lantern
  say(state, 'light lantern')
  say(state, 'east')
  expect(state.room).toBe(40)
})

// checkThirst only runs from handleMove (engine.js), not on every command --
// so these tests pace themselves with movement (bouncing between two plain
// outdoor rooms, 6 <-> 5, nothing gating either side), not with a command
// like LOOK that doesn't advance it. A single shared step counter keeps the
// south/north alternation aligned across calls -- restarting the pattern at
// i=0 each call is a trap: room 5's `south` goes to room 3 (not back to 6),
// so if a call ever ends on an odd step you drift off the pair and every
// other move afterward is refused (and refusals don't consume a turn,
// silently breaking the timing this test depends on).
function makeBouncer(state) {
  let i = 0
  return (times) => {
    let lines = []
    for (let n = 0; n < times; n++, i++) lines = say(state, i % 2 === 0 ? 'south' : 'north')
    return lines
  }
}

test('thirst: a warning after 10 moves without water, death after 10 more (260-290)', () => {
  const state = freshAt(6)
  state.water = 0 // no waterskin, nothing to auto-drink
  const bounce = makeBouncer(state)
  const warned = bounce(10)
  expect(warned.join(' ')).toMatch(/GETTING VERY THIRSTY/)
  expect(state.over).toBe(false)

  const died = bounce(10)
  expect(died.join(' ')).toMatch(/DIED OF THIRST/)
  expect(state.over).toBe(true)
  expect(state.won).toBe(false)
})

test('a filled waterskin auto-drinks every 10 moves and prevents thirst', () => {
  const state = freshAt(6)
  carryItem(state, 11) // waterskin
  state.water = 5
  makeBouncer(state)(15)
  expect(state.over).toBe(false)
  expect(state.water).toBeLessThan(5)
})

// --- Shop economy (rooms 2/116) -----------------------------------------

test('the shop charges gold for priced items and refuses if you cannot afford it', () => {
  const state = freshAt(2)
  state.gold = 0
  const refused = say(state, 'take armor') // armor costs 50 (game.json)
  expect(refused.join(' ')).toMatch(/DON'T THINK WE CAN AFFORD/i)
  expect(isCarried(state, 14)).toBe(false)

  state.gold = 150
  say(state, 'take armor')
  expect(isCarried(state, 14)).toBe(true)
  expect(state.gold).toBe(100)
})

test('TAKE ALL picks up everything in the room except at the shop (300/325)', () => {
  const shop = freshAt(2)
  const shopTicket = say(shop, 'take all')
  expect(shopTicket.join(' ')).toMatch(/SLOW IT DOWN/)

  const cliff = freshAt(252) // has just the rope, once tied and left behind
  cliff.locations[7] = 252
  const taken = say(cliff, 'take all')
  expect(taken.join(' ')).toMatch(/ROPE/i)
  expect(isCarried(cliff, 7)).toBe(true)
})

test('taking the waterskin fills it; taking water tops it back up (313-349)', () => {
  const state = freshAt(2)
  say(state, 'take waterskin')
  expect(state.water).toBe(5)

  state.water = 1
  state.locations[20] = state.room // put WATER in the current room
  say(state, 'take water')
  expect(state.water).toBe(5)
})

test('drinking water drawn from room 73 is poisoned (285)', () => {
  const state = freshAt(73)
  carryItem(state, 11)
  state.locations[20] = 73
  say(state, 'take water')
  expect(state.flags.poisonedWater).toBe(true)

  state.lastDrinkTurn = state.turns - 10 // force the next thirst check to fire
  const lines = say(state, 'north') // checkThirst only runs from handleMove
  expect(lines.join(' ')).toMatch(/YOU ARE DEAD/)
  expect(state.over).toBe(true)
})

// --- The waterfall passage and the rope bridge (335-395, 500-530) -------

test('the rope must be carried to tie it, and tying it in the wrong room just ties it', () => {
  const state = freshAt(1)
  const noRope = say(state, 'tie rope')
  expect(noRope.join(' ')).toMatch(/IF WE HAD A ROPE/)

  carryItem(state, 7)
  const tied = say(state, 'tie rope')
  expect(tied.join(' ')).toMatch(/OKAY, IT'S TIED/)
  expect(isCarried(state, 7)).toBe(false) // the rope is left behind, tied
})

test('tying the rope at the cliff (252) opens the way down to the ledge (244)', () => {
  const state = freshAt(252)
  carryItem(state, 7)
  say(state, 'tie rope')
  say(state, 'down')
  expect(state.room).toBe(244)
  say(state, 'up')
  expect(state.room).toBe(252)
})

// --- The chest (600-618) -------------------------------------------------

test('OPEN only does something at the chest room, and only once', () => {
  const state = freshAt(1)
  expect(say(state, 'open').join(' ')).toMatch(/NOTHING HERE TO OPEN/)

  state.room = 81
  say(state, 'open')
  expect(state.flags.chestOpen).toBe(true)
  const again = say(state, 'open')
  expect(again.join(' ')).toMatch(/ALREADY.*OPEN/)
})

test('the locked house (room 255) refuses OPEN with its own message', () => {
  const state = freshAt(255)
  expect(say(state, 'open').join(' ')).toMatch(/LOCKED/)
})

// --- Lisa (650-660, 3700-3720) -------------------------------------------

test('knocking at Lisa\'s house needs the ring, and only works once', () => {
  const state = freshAt(255)
  const noRing = say(state, 'knock')
  expect(state.flags.lisaJoined).toBe(false)

  carryItem(state, 4) // ring
  const withRing = say(state, 'knock')
  expect(state.flags.lisaJoined).toBe(true)
  expect(isCarried(state, 4)).toBe(false) // given to Lisa

  const again = say(state, 'knock')
  expect(again.join(' ')).toMatch(/NOT IN/)
})

test('knocking anywhere else is just a fool thing to do', () => {
  const state = freshAt(1)
  expect(say(state, 'knock').join(' ')).toMatch(/FOOL THING/)
})

// --- The lantern (850-865) ------------------------------------------------

test('the lantern must be carried and unlit to light, and stays lit', () => {
  const state = freshAt(1)
  expect(say(state, 'light lantern').join(' ')).toMatch(/DON'T HAVE A LANTERN/)

  carryItem(state, 22)
  say(state, 'light lantern')
  expect(state.flags.lanternLit).toBe(true)
  expect(say(state, 'light lantern').join(' ')).toMatch(/ALREADY LIT/)
})

test('LIGHT only works on the lantern', () => {
  const state = freshAt(1)
  carryItem(state, 3) // sword
  expect(say(state, 'light sword').join(' ')).toMatch(/NOT SOMETHING TO IGNITE/)
})

// --- The flying carpet (1400-1430) ----------------------------------------

test('riding the carpet needs the carpet, and goes different places from different rooms', () => {
  const noCarpet = freshAt(219)
  expect(say(noCarpet, 'ride carpet').join(' ')).toMatch(/HAVEN'T GOT A RUG/)

  const fromStart = freshAt(219)
  carryItem(fromStart, 31)
  say(fromStart, 'ride carpet')
  expect(fromStart.room).toBe(244)

  const fromLedge = freshAt(244)
  carryItem(fromLedge, 31)
  say(fromLedge, 'ride carpet')
  expect(fromLedge.room).toBe(252)
  expect(isCarried(fromLedge, 31)).toBe(false) // carpet returns to the chest

  const elsewhere = freshAt(6)
  carryItem(elsewhere, 31)
  say(elsewhere, 'ride carpet')
  expect(elsewhere.room).toBe(81)
})

// --- The highwaymen at room 19 (700-735) -----------------------------------

test('offering gold to Gorn himself is always refused, gold untouched', () => {
  const state = freshAt(19)
  const before = state.gold
  say(state, 'give gold to gorn')
  expect(state.gold).toBe(before)
})

test('paying the highwaymen: refusing costs nothing, paying enough sets them off your back', () => {
  const tooLittle = freshAt(19)
  say(tooLittle, 'give 3 gold')
  expect(tooLittle.flags.highwaymenPaid).toBe(false)
  expect(tooLittle.gold).toBe(147)

  const notEnough = freshAt(19)
  notEnough.gold = 10
  const refusal = say(notEnough, 'give 20 gold')
  expect(refusal.join(' ')).toMatch(/DON'T HAVE THAT MUCH/)
  expect(notEnough.gold).toBe(10)

  const paidOff = freshAt(19)
  say(paidOff, 'give 51 gold')
  expect(paidOff.flags.highwaymenPaid).toBe(true)
  expect(paidOff.gold).toBe(99)
})

test('giving gold anywhere else is refused outright', () => {
  const state = freshAt(1)
  const before = state.gold
  say(state, 'give 10 gold')
  expect(state.gold).toBe(before)
})

// --- The sphinx (900-925, 3101-3110) ---------------------------------------

test('the sphinx riddle: right answer opens the way on, wrong answer does not', () => {
  const wrong = freshAt(104)
  say(wrong, 'talk') // room 104's TALK special-case poses the riddle (900-925)
  expect(wrong.pendingPrompt).toBe('sphinx')
  const wrongAnswer = say(wrong, 'a lion')
  expect(wrongAnswer.join(' ')).toMatch(/WRONG|MAY NOT ENTER/i)
  expect(wrong.flags.sphinxSolved).toBe(false)

  const right = freshAt(104)
  say(right, 'talk')
  const correct = say(right, 'sphinx')
  expect(correct.join(' ')).toMatch(/CORRECT|MAY PASS/i)
  expect(right.flags.sphinxSolved).toBe(true)
  carryItem(right, 22) // room 202 beyond the sphinx is another dark cave
  say(right, 'light lantern')
  say(right, 'south')
  expect(right.room).toBe(202)
})

// --- Reading, and the dragonese unlock (750-785) ---------------------------

test('the dragonese dictionary needs Pig Latin read first, and its own flag afterward', () => {
  const state = freshAt(2)
  carryItem(state, 35) // dragonese dictionary
  carryItem(state, 36) // pig latin book

  const tooSoon = say(state, 'read lingua draco flameus')
  expect(tooSoon.join(' ')).toMatch(/IN LATIN/)
  expect(state.flags.highwaymenPaid).toBe(false)

  say(state, 'read pig latin made simple')
  expect(state.flags.pigLatinRead).toBe(true)

  say(state, 'read lingua draco flameus')
  expect(state.flags.highwaymenPaid).toBe(true) // MQ.bas:7020 sets M%(3), same flag GIVE's payoff sets
})

test('signs read differently depending on where they are (775-785)', () => {
  const s15 = freshAt(15)
  s15.locations[8] = -15
  expect(say(s15, 'read sign').join(' ')).not.toBe('')

  const s16 = freshAt(16)
  s16.locations[8] = -16
  expect(say(s16, 'read sign').join(' ')).not.toBe('')
})

test('the shop price list only lists what is actually for sale there', () => {
  const state = freshAt(2)
  const lines = say(state, 'read list')
  expect(lines.join('\n')).toMatch(/CARTOGRAPH/i)
  expect(lines.join('\n')).toMatch(/SOVEREIGNS/i)
})

// --- Looking, beyond the bare room description (800-849) --------------------

test('LOOK WATERFALL is the only way to find the passage behind it (room 40 is otherwise unreachable)', () => {
  const state = freshAt(38)
  expect(say(state, 'east').join(' ')).toMatch(/DON'T WANT TO GO/)
  say(state, 'look waterfall')
  // The exit now exists -- proven by the refusal changing from "no such
  // exit" to "too dark" (room 40 is a dark cave; see the dark-room test).
  // A lit lantern is what actually gets you through it.
  expect(say(state, 'east').join(' ')).toMatch(/TOO DARK/)

  carryItem(state, 22)
  say(state, 'light lantern')
  say(state, 'east')
  expect(state.room).toBe(40)
})

test('LOOK SWORD reveals the DRAGONBANE inscription independent of taking it', () => {
  const state = freshAt(26)
  const lines = say(state, 'look sword')
  expect(lines.join(' ')).toMatch(/DRAGONBANE/)
})

test('LOOK on the cub reports whether it is alive', () => {
  const alive = freshAt(253)
  carryItem(alive, 25)
  expect(say(alive, 'look cub').join(' ')).toMatch(/LOOKS OKAY/)

  const dead = freshAt(253)
  carryItem(dead, 25)
  dead.flags.cubDied = true
  expect(say(dead, 'look cub').join(' ')).toMatch(/DEAD/)
})

// --- Talking (900-925) -------------------------------------------------------

test('talking to the champion with nothing special going on gets a stock refusal', () => {
  const state = freshAt(1)
  expect(say(state, 'talk').join(' ')).toMatch(/ROYAL CHAMPION/)
})

test('Lisa answers differently before and after she joins', () => {
  const before = freshAt(1)
  expect(say(before, 'talk to lisa').join(' ')).toMatch(/GLAD TO IF SHE WERE HERE/)

  const after = freshAt(1)
  after.flags.lisaJoined = true
  expect(say(after, 'talk to lisa').join(' ')).toMatch(/WITHOUT ANSWERING/)
})

test('the dragon cannot be understood until you can speak to it, then it only says its piece once', () => {
  const mute = freshAt(149)
  const firstTry = say(mute, 'talk')
  expect(mute.flags.dragonConversed).toBe(false)

  const canSpeak = freshAt(149)
  canSpeak.flags.highwaymenPaid = true // stands in for MQ.bas's M%(3), see the dragonese test above
  const first = say(canSpeak, 'talk')
  expect(canSpeak.flags.dragonConversed).toBe(true)
  const second = say(canSpeak, 'talk')
  expect(second.join(' ')).not.toBe(first.join(' '))
})

// --- Combat: some of it is fatal, some of it is not (1050-1095) --------------

test('attacking is a refusal everywhere except the two rooms that actually have a fight in them', () => {
  const state = freshAt(1)
  say(state, 'attack')
  expect(state.over).toBe(false)
})

test('picking a fight in room 57 is fatal unless Lisa is with you', () => {
  const alone = freshAt(57)
  say(alone, 'attack')
  expect(alone.over).toBe(true)
  expect(alone.won).toBe(false)

  const withLisa = freshAt(57)
  withLisa.flags.lisaJoined = true
  say(withLisa, 'attack')
  expect(withLisa.over).toBe(false)
})

test('attacking the dragon is fatal', () => {
  const state = freshAt(149)
  say(state, 'attack')
  expect(state.over).toBe(true)
  expect(state.won).toBe(false)
})

// --- Swimming (1000-1020) -----------------------------------------------------

test('swimming only makes sense in the island rooms, and needs a destination', () => {
  const onLand = freshAt(1)
  expect(say(onLand, 'swim').join(' ')).toMatch(/FOR FISH/)

  const inWater = freshAt(94)
  expect(say(inWater, 'swim').join(' ')).toMatch(/SWIM WHERE/)
  say(inWater, 'swim to shore')
  expect(inWater.room).toBe(95) // 94's north exit
})

// --- Dropping (350-395) --------------------------------------------------------

test('dropping salt with the cub around drives it off (per MQ.bas noun-5 special case)', () => {
  const state = freshAt(253)
  carryItem(state, 5) // salt
  state.locations[25] = state.room // cub present
  const lines = say(state, 'drop salt')
  expect(state.locations[25]).toBe(256)
  expect(isCarried(state, 5)).toBe(false)
})

test('dropping something you are not carrying is refused', () => {
  const state = freshAt(1)
  expect(say(state, 'drop sword').join(' ')).toMatch(/DON'T HAVE ONE/)
})

// --- Dead-end capture/death rooms (2700, 3000, 3300) -------------------------
//
// All three have empty `exits` in game.json, same as the original -- MQ.bas
// never gives them a way out either, it falls into the death/restart routine
// instead. Found via test/coverage.test.js, which flagged all three as
// having no code referencing them at all: before the fix, wandering into any
// of them silently soft-locked the game (the room's own text narrates
// disaster, but nothing ever ended the game).

test('crossing into room 82 is a capture, and ends the game', () => {
  const state = freshAt(76) // 76 -north-> 82
  const lines = say(state, 'north')
  expect(state.room).toBe(82)
  expect(state.over).toBe(true)
  expect(state.won).toBe(false)
  expect(lines.join(' ')).toMatch(/CAPTURED/)
})

test('swimming into room 96 is a fatal shark attack (falls through to the death routine in MQ.bas, no explicit GOTO)', () => {
  const state = freshAt(95)
  const lines = say(state, 'north')
  expect(state.room).toBe(96)
  expect(state.over).toBe(true)
  expect(state.won).toBe(false)
  expect(lines.join(' ')).toMatch(/SHARK-INFESTED WATERS/)
})

test('room 118 is fatal too, and reports it the same way room 96 does (a mock news obituary)', () => {
  const state = freshAt(15)
  const lines = say(state, 'west')
  expect(state.room).toBe(118)
  expect(state.over).toBe(true)
  expect(state.won).toBe(false)
  expect(lines.join(' ')).toMatch(/BALEMA SPORTS NEWS/)
})

// --- Minor arrival flavor (2200, 2600, 2900, 3500) ---------------------------

test('the skeleton in room 21 points out the ring for as long as it is there', () => {
  const state = freshAt(21) // ring (item 4) starts here
  expect(say(state, 'look').join(' ')).toMatch(/POINTS WARILY/)

  carryItem(state, 4) // take the ring away
  expect(say(state, 'look').join(' ')).not.toMatch(/POINTS WARILY/)
})

test('re-entering the open chest room still calls out the rug', () => {
  const state = freshAt(81)
  say(state, 'open')
  expect(say(state, 'look').join(' ')).toMatch(/OLD RUG IN THE CHEST/)
})

test('room 94 gets a shark warning every visit, not just the first', () => {
  const state = freshAt(94)
  expect(say(state, 'look').join(' ')).toMatch(/SHARKS/)
  expect(say(state, 'look').join(' ')).toMatch(/SHARKS/)
})

test('room 100 permanently becomes the burned village after the first visit', () => {
  const state = freshAt(99) // 99 -south-> 100
  const first = say(state, 'south')
  expect(state.room).toBe(100)
  expect(first.join(' ')).not.toMatch(/CHARRED REMNANTS/) // original text shown first

  say(state, 'north')
  const second = say(state, 'south')
  expect(second.join(' ')).toMatch(/CHARRED REMNANTS/) // now permanently changed
})

test('FILL only means filling the waterskin (950-955), and is the same mechanic TAKE WATER uses', () => {
  const noWaterskin = freshAt(15)
  noWaterskin.locations[20] = 15
  expect(say(noWaterskin, 'fill waterskin').join(' ')).toMatch(/NOTHING TO CARRY IT IN/)

  const state = freshAt(15)
  state.locations[20] = 15
  carryItem(state, 11)
  state.water = 1
  say(state, 'fill waterskin')
  expect(state.water).toBe(5)

  expect(say(state, 'fill sword').join(' ')).toMatch(/WON'T HOLD IT VERY WELL/)
})

// --- Save / restore / quit -----------------------------------------------------

test('restoring with nothing saved says so, and does not touch the current game', () => {
  const state = freshAt(6)
  const lines = say(state, 'restore')
  expect(lines.join(' ')).toMatch(/no saved game/i)
  expect(state.room).toBe(6)
})

test('quit resets to a brand new game', () => {
  const state = freshAt(149)
  carryItem(state, 25)
  const result = runTurn(state, 'quit')
  expect(result.state.room).toBe(1)
  expect(result.state.inventory).toEqual([])
})

// --- Reading the shop's books (1350) --------------------------------------------

test('BOOK only lists anything inside the shop', () => {
  const state = freshAt(1)
  expect(say(state, 'book').join(' ')).not.toMatch(/SOVERIGNS/)

  const shop = freshAt(2)
  const lines = say(shop, 'book')
  expect(lines.join('\n')).toMatch(/SOVERIGNS/)
  expect(lines.join('\n')).toMatch(/SOFTALK MAGAZINE/i)
})

// --- Climbing as a compass shortcut (450-460) -----------------------------------

test('CLIMB uses whichever vertical exit the room has', () => {
  const state = freshAt(26) // has a down exit, into a dark room -- needs the lantern too
  carryItem(state, 22)
  say(state, 'light lantern')
  say(state, 'climb')
  expect(state.room).toBe(37)

  const noVertical = freshAt(1)
  expect(say(noVertical, 'climb').join(' ')).toMatch(/DON'T WANT TO GO/)
})
