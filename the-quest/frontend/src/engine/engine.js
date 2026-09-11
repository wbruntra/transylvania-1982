import { parseCommand } from './parser.js'
import {
  carryItem, dropItem, isCarried, itemsInRoom, saveGame, loadGame,
  sceneryInRoom, visitRoom, getRoomExits, setRoomExit, removeRoomExit, newGame
} from './state.js'
import { getItem, getRoom, messageText, world } from './world.js'

function itemName(id) {
  const it = getItem(id)
  return it ? it.name.toLowerCase() : `item ${id}`
}

function missingItemMessage(nounPhrase, verbPrompt) {
  if (!nounPhrase) return `${verbPrompt} what?`
  return `You don't have a word for "${nounPhrase.toLowerCase()}".`
}

export function describeRoom(state) {
  const room = getRoom(state.room)
  // Room 100 permanently swaps to the burned-village text the first time
  // you set foot there (MQ.bas:3500 -- unconditional, guarded only by the
  // room's own picture number so it can't refire; `villageBurned` is that
  // guard here instead).
  const description =
    state.room === 100 && state.flags.villageBurned
      ? messageText(92)
      : messageText(room.desc_message) || '(This room has no description.)'
  const extra = []

  const present = itemsInRoom(state, state.room)
  if (present.length) {
    extra.push('You see: ' + present.map((it) => it.name.toLowerCase()).join(', ') + '.')
  }
  for (const s of sceneryInRoom(state, state.room)) {
    extra.push(`There is a ${s.name.toLowerCase()} here.`)
  }
  // The skeleton in room 21 points out the ring for as long as it's there
  // (MQ.bas:2200).
  if (state.room === 21 && state.locations[4] === 21) {
    extra.push(messageText(29))
  }
  // Re-entering the open chest room still calls out the rug (MQ.bas:2600).
  if (state.room === 81 && state.flags.chestOpen && state.locations[31] === 81) {
    extra.push(messageText(48))
  }
  // The water off room 94 gets more shark-infested every visit -- a warning
  // for anyone swimming instead of taking the rope route (MQ.bas:2900).
  if (state.room === 94) {
    extra.push(messageText(78))
  }

  const exits = Object.keys(getRoomExits(state, state.room) || {})
  if (exits.length) {
    extra.push('Obvious exits: ' + exits.join(', ') + '.')
  }

  const lines = [...description.split('\r').map((s) => s.trim()).filter(Boolean), ...extra]
  return { picture: room.picture, description, extra, lines }
}

function checkThirst(state) {
  // Thirst check every 10 turns since last drink (skipped in water crossing 93-96)
  if (state.room >= 93 && state.room <= 96) return null
  if (state.turns - state.lastDrinkTurn < 10) return null

  state.lastDrinkTurn = state.turns

  // If carried waterskin and water > 0
  if (isCarried(state, 11) && state.water > 0) {
    state.water -= 1
    state.thirstWarning = false

    if (state.flags.poisonedWater) {
      state.over = true
      return [
        'GORN DRINKS FROM THE FLASK, THEN PASSES IT TO YOU.',
        'GORN GASPS AND THEN SINKS TO THE GROUND. DIZZINESS OVERCOMES YOU. YOU SINK TO YOUR KNEES. EVERYTHING IS GOING BLACK.. YOU ARE DEAD!',
      ]
    }

    const lines = [
      state.flags.lisaJoined
        ? 'GORN DRINKS FROM THE FLASK, THEN PASSES IT TO LISA, WHO DRINKS, AND SHE PASSES IT TO YOU.'
        : 'GORN DRINKS FROM THE FLASK, THEN PASSES IT TO YOU.',
    ]
    if (state.water <= 0) {
      lines.push("(GORN) WELL, WE'RE OUT OF WATER!")
    }
    return lines
  }

  // No water available!
  if (state.thirstWarning) {
    state.over = true
    return ['YOU JUST DIED OF THIRST!']
  }

  state.thirstWarning = true
  return ['YOU ARE GETTING VERY THIRSTY!']
}

function handleMove(state, direction) {
  const exits = getRoomExits(state, state.room)
  const dest = exits && exits[direction]
  if (!dest) {
    if (state.room >= 93 && state.room <= 96) {
      return { lines: ["GORN YELLS AT YOU FROM THE SHORE THAT  YOU CAN'T GO THAT WAY."] }
    }
    return { lines: ["(GORN) I DON'T WANT TO GO THAT WAY."] }
  }

  const destRoom = getRoom(dest)
  // Check dark caves arrival event (3800-3805)
  if (destRoom && destRoom.event_line === 3800) {
    if (!state.flags.lanternLit || !isCarried(state, 22)) {
      return { lines: ["(GORN) IT'S TOO DARK IN HERE. I'M   LEAVING!"] }
    }
  }

  state.prevRoom = state.room
  state.room = dest
  visitRoom(state, dest)
  state.turns += 1
  state.roomTurns += 1

  const thirstLines = checkThirst(state)
  if (state.over) {
    return { lines: thirstLines }
  }

  const view = describeRoom(state)
  // MQ.bas:3500 prints the room's *current* description first, and only
  // then rewrites it for next time -- so the transformation is applied
  // after this visit's view is built, not before.
  if (dest === 100) state.flags.villageBurned = true // event_line === 3500
  if (thirstLines) {
    view.extra = [...thirstLines, ...view.extra]
    view.lines = [...view.lines, ...thirstLines]
  }

  // Dead-end capture/death rooms (2700, 3000, 3300). All three have empty
  // `exits` in game.json -- MQ.bas never gives these rooms a way out either,
  // it falls straight into the death/restart routine (`& GOTO A`, 3050) at
  // the end of each one's arrival event. Room 96's death (3000) isn't even
  // an explicit jump in the original -- 3000 has no GOTO/RETURN, so
  // Applesoft just runs on into 3050, the next line in the file. Without
  // this, a player who wanders into any of the three currently soft-locks:
  // the room's own text narrates disaster, but nothing ever sets
  // `state.over`, so the game just sits there accepting commands forever.
  if (dest === 82) {
    state.over = true
    return { lines: [...view.lines, 'YOU HAVE BEEN CAPTURED! THE ADVENTURE ENDS HERE.'] }
  }
  if (dest === 96) {
    state.over = true
    return { lines: [...view.lines, messageText(81)] }
  }
  if (dest === 118) {
    state.over = true
    return { lines: [...view.lines, messageText(51)] }
  }

  // Room 149 Dragon arrival event (3400)
  if (dest === 149) {
    if (isCarried(state, 25)) {
      if (state.flags.cubDied) {
        state.over = true
        return {
          lines: [
            messageText(144),
            messageText(145),
            'YOU ARE DEAD!',
          ],
        }
      } else {
        // Returned cub safely!
        state.prevRoom = 149
        state.room = 4
        visitRoom(state, 4)
        state.won = true
        state.over = true
        return {
          lines: [
            messageText(141),
            'UPON REACHING THE CASTLE, THE DRAGON GENTLY LOWERS EVERYONE TO THE GROUND THEN RETURNS TO THE WEST WITH HER BABY CLOSE BEHIND.',
            'THE AWESTRUCK CASTLE GUARDS RAISE THE GATE TO ALLOW YOU ENTRANCE.',
            'YOU HAVE DONE WELL. PERHAPS OUR PATHS WILL CROSS AGAIN UPON ANOTHER QUEST.',
            '.....FARE THEE WELL!',
          ],
        }
      }
    }
  }

  // Room 4 victory arrival event (8000)
  if (dest === 4 || (destRoom && destRoom.event_line === 8000)) {
    state.won = true
    state.over = true
    return {
      lines: [
        'UPON REACHING THE CASTLE, THE DRAGON GENTLY LOWERS EVERYONE TO THE GROUND THEN RETURNS TO THE WEST WITH HER BABY CLOSE BEHIND.',
        'THE AWESTRUCK CASTLE GUARDS RAISE THE GATE TO ALLOW YOU ENTRANCE.',
        'YOU HAVE DONE WELL. PERHAPS OUR PATHS WILL CROSS AGAIN UPON ANOTHER QUEST.',
        '.....FARE THEE WELL!',
      ],
    }
  }

  // Shop inventory migration (3200) and sign placements (4000, 4100)
  if (dest === 116) {
    for (let i = 2; i <= 32; i++) {
      if (state.locations[i] === 2) state.locations[i] = 116
    }
    state.locations[8] = -116
  } else if (dest === 15) {
    state.locations[8] = -15
    state.locations[20] = 15
  } else if (dest === 16) {
    state.locations[8] = -16
  }

  // Room 104 Sphinx riddle arrival event
  if (dest === 104 && !state.flags.sphinxSolved) {
    state.pendingPrompt = 'sphinx'
    view.extra = [messageText(133), ...view.extra]
    view.lines = [...view.lines, messageText(133)]
  }

  return view
}



function handleTake(state, item, nounPhrase, raw) {
  if (!item) return { lines: [missingItemMessage(nounPhrase, 'Take')] }

  // TAKE ALL (item 21 or typed ALL)
  if (item.id === 21) {
    if (state.room === 2 || state.room === 116) {
      return { lines: ["SLOW IT DOWN, I CAN'T KEEP THE TICKET STRAIGHT!"] }
    }
    const roomItems = itemsInRoom(state, state.room).filter((it) => it.id !== 20 && it.id !== 21)
    if (roomItems.length === 0) {
      return { lines: ['There is nothing here to take.'] }
    }
    const taken = []
    for (const it of roomItems) {
      carryItem(state, it.id)
      taken.push(`${it.name}: TAKEN.`)
      if (it.id === 7) {
        removeRoomExit(state, 81, 'up')
        removeRoomExit(state, 244, 'up')
        removeRoomExit(state, 252, 'down')
      }
      if (it.id === 11) {
        state.water = 5
        state.thirstWarning = false
      }
    }
    state.turns += 1
    return { lines: taken }
  }

  // Scenery check
  if (state.locations[item.id] === -state.room) {
    return { lines: [`(GORN) THE ${item.name} DOESN'T LOOK MOVEABLE.`] }
  }

  // Already have it
  if (isCarried(state, item.id)) {
    return { lines: [`(GORN) WE ALREADY HAVE A ${item.name}!`] }
  }

  // Not here
  if (state.locations[item.id] !== state.room) {
    return { lines: [`(GORN) I DON'T SEE A ${item.name} HERE!`] }
  }

  // Water (item 20)
  if (item.id === 20) {
    if (!isCarried(state, 11)) {
      return { lines: ['(GORN) WE HAVE NOTHING TO CARRY IT IN.'] }
    }
    if (state.water === 5) {
      return { lines: ['(GORN) OUR WATERSKIN IS ALREADY FULL.'] }
    }
    state.water = 5
    state.thirstWarning = false
    if (state.room === 73) {
      state.flags.poisonedWater = true
    }
    state.turns += 1
    return { lines: ['FLASK: FILLED.'] }
  }

  // Shop purchase (rooms 2 and 116)
  if ((state.room === 2 || state.room === 116) && item.price) {
    if (state.gold < item.price) {
      return { lines: [`(GORN) I DON'T THINK WE CAN AFFORD A ${item.name}.`] }
    }
    state.gold -= item.price
  }

  carryItem(state, item.id)
  state.turns += 1

  const lines = [`${item.name}: TAKEN.`]
  if (item.id === 7) {
    removeRoomExit(state, 81, 'up')
    removeRoomExit(state, 244, 'up')
    removeRoomExit(state, 252, 'down')
  }
  if (item.id === 11) {
    state.water = 5
    state.thirstWarning = false
  }
  if (item.id === 3) {
    lines.push("'DRAGONBANE' IS INSCRIBED ON THE SWORD.")
  }
  return { lines }
}

// FILL only ever means "fill the waterskin" (MQ.bas:950 refuses any other
// noun, then :955 forces noun 20/WATER and re-enters the TAKE routine at
// 312) -- so this just re-dispatches into handleTake's own water branch
// rather than duplicating its full/needs-a-waterskin checks.
function handleFill(state, item) {
  if (!item || item.id !== 11) {
    return { lines: ["(GORN) THAT WON'T HOLD IT VERY WELL."] }
  }
  return handleTake(state, getItem(20))
}

function handleDrop(state, item, nounPhrase, raw) {
  if (!item) return { lines: [missingItemMessage(nounPhrase, 'Drop')] }
  if (!isCarried(state, item.id)) return { lines: ["(GORN) WE DON'T HAVE ONE WITH US, MOST WISE ADVISOR SIR."] }

  // Salt on baby dragon in dragon room
  if (item.id === 5 && (state.locations[25] === state.room || isCarried(state, 25))) {
    state.locations[25] = 256
    dropItem(state, 5, state.room)
    state.turns += 1
    return { lines: [messageText(168)] }
  }

  dropItem(state, item.id, state.room)
  state.turns += 1
  return { lines: [`${item.name}: DROPPED.`] }
}

function handleInventory(state) {
  const lines = ["(GORN) LET'S SEE NOW -- WE'RE CARRYING:"]
  if (state.inventory.length === 0) {
    lines.push(' NOTHING')
  } else {
    for (const id of state.inventory) {
      lines.push(` ${itemName(id).toUpperCase()}`)
    }
  }
  lines.push(` ${state.gold} GOLD SOVEREIGNS`)
  lines.push('AND THAT SEEMS TO BE IT!')
  return { lines }
}

function handleClimb(state) {
  const exits = getRoomExits(state, state.room)
  if (exits.up) return handleMove(state, 'up')
  if (exits.down) return handleMove(state, 'down')
  return { lines: ["(GORN) I DON'T WANT TO GO THAT WAY."] }
}

function handleTie(state, item, nounPhrase) {
  if (!item || item.id !== 7) {
    return { lines: ['(GORN) SORRY, I NEVER LEARNED TO TIE  THOSE.'] }
  }
  if (!isCarried(state, 7)) {
    return { lines: ['(GORN) WOULD LOVE TO, IF WE HAD A ROPE.'] }
  }
  dropItem(state, 7, state.room)
  state.turns += 1

  if (state.room !== 77 && state.room !== 252) {
    return { lines: ["(GORN) OKAY, IT'S TIED."] }
  }

  if (state.room === 77) {
    setRoomExit(state, 81, 'up', 77)
  } else if (state.room === 252) {
    setRoomExit(state, 244, 'up', 252)
    setRoomExit(state, 252, 'down', 244)
  }
  return { lines: ['(GORN) OKAY. THAT SHOULD HOLD.'] }
}

function handleOpen(state, item, nounPhrase) {
  if (state.room === 255) {
    return { lines: ["(GORN) UNNH! EYUNNH! I THINK IT'S LOCKED, SIR!"] }
  }
  if (state.room !== 81) {
    return { lines: ["(GORN) THERE'S NOTHING HERE TO OPEN."] }
  }
  if (state.flags.chestOpen) {
    return { lines: ['METHINKS THE CHEST IS ALREADY  OPEN.'] }
  }
  state.flags.chestOpen = true
  state.turns += 1
  if (state.locations[31] === 256) {
    state.locations[31] = 81
  }
  const lines = ['METHINKS THE CHEST IS NOW OPEN.']
  if (state.locations[31] === 81) {
    lines.push(messageText(48)) // "THERE IS AN OLD RUG IN THE CHEST."
  }
  return { lines }
}

function handleKnock(state) {
  if (state.room !== 255) {
    return { lines: ['(GORN) WHY DO A FOOL THING LIKE THAT?'] }
  }
  if (state.flags.lisaJoined) {
    return { lines: ['(LISA) I ASSURE YOU, THE OWNER OF THE HOUSE IS NOT IN.'] }
  }

  state.turns += 1
  const lines = [messageText(52)]
  if (!isCarried(state, 4)) {
    lines.push(messageText(53))
    return { lines }
  }

  // Has ring (item 4)
  lines.push(messageText(54))
  lines.push(messageText(55))
  lines.push(messageText(56))
  lines.push(messageText(57))
  lines.push(messageText(58))
  state.flags.lisaJoined = true
  dropItem(state, 4, 256) // Ring given to Lisa
  return { lines }
}

function handleLight(state, item, nounPhrase) {
  if (!item || item.id !== 22) {
    return { lines: ["(GORN) THAT'S NOT SOMETHING TO IGNITE!"] }
  }
  if (!isCarried(state, 22)) {
    return { lines: ["(GORN) WE DON'T HAVE A LANTERN."] }
  }
  if (state.flags.lanternLit) {
    return { lines: ["(GORN) IT'S ALREADY LIT!"] }
  }
  state.flags.lanternLit = true
  state.turns += 1
  return { lines: ["(GORN) OKAY. IT'S LIT."] }
}

function handleRide(state, item, nounPhrase) {
  if (!item || item.id !== 31) {
    return { lines: ["(GORN) I CAN'T RIDE THAT!"] }
  }
  if (!isCarried(state, 31)) {
    return { lines: ["(GORN) WE HAVEN'T GOT A RUG."] }
  }
  state.turns += 1

  if (state.room === 219) {
    state.prevRoom = state.room
    state.room = 244
    visitRoom(state, 244)
    const view = describeRoom(state)
    return { ...view, extra: [messageText(184), ...view.extra] }
  }

  if (state.room === 244 || state.room === 251 || state.room === 253) {
    dropItem(state, 31, 81)
    state.flags.chestOpen = false
    state.prevRoom = state.room
    state.room = 252
    visitRoom(state, 252)
    const view = describeRoom(state)
    return { ...view, extra: [messageText(185), ...view.extra] }
  }

  dropItem(state, 31, 81)
  state.flags.chestOpen = false
  state.prevRoom = state.room
  state.room = 81
  visitRoom(state, 81)
  const view = describeRoom(state)
  return {
    ...view,
    extra: [
      'WHEN ALL ARE ON, THE CARPET FLIES TO THE PIT, ROLLS UP, GETS IN THE CHEST AND THE LID CLOSES ON IT.',
      ...view.extra,
    ],
  }
}

function handleTalk(state, item, nounPhrase, raw) {
  if (state.room === 104) {
    if (state.flags.sphinxSolved) {
      return { lines: ['The Sphinx has already granted you passage.'] }
    }
    state.pendingPrompt = 'sphinx'
    return { lines: [messageText(133)] }
  }

  if (item && item.id === 12) {
    if (state.flags.lisaJoined) {
      return { lines: ['LISA LOOKS AT YOU WITHOUT ANSWERING.'] }
    }
    return { lines: ["(GORN) I'D BE GLAD TO IF SHE WERE HERE."] }
  }

  if (state.room === 19) {
    return { lines: [messageText(21)] }
  }

  if (state.room === 149) {
    if (!state.flags.highwaymenPaid && !state.flags.lisaJoined) {
      return { lines: [messageText(136)] }
    }
    if (!state.flags.dragonConversed) {
      state.flags.dragonConversed = true
      return { lines: [messageText(140)] }
    }
    return { lines: [messageText(147)] }
  }

  return {
    lines: [
      '(GORN) UNLIKE A CERTAIN ADVISOR, THE  ROYAL CHAMPION IS NOT FAMOUS FOR AN ELE-VATED LEVEL OF VERBAL PROFICIENCY.',
    ],
  }
}

function handleRead(state, item, nounPhrase) {
  if (state.room === 15 && (!item || item.id === 8)) {
    return { lines: [messageText(15)] }
  }
  if (state.room === 16 && (!item || item.id === 8)) {
    return { lines: [messageText(17)] }
  }
  if (state.room === 73 && (!item || item.id === 8 || item.id === 29)) {
    return { lines: [messageText(83)] }
  }

  if ((state.room === 2 || state.room === 116) && item && (item.id === 16 || item.id === 8)) {
    const lines = ['IT IS A PRICE LIST:', 'ITEM                              SOVEREIGNS']
    for (const it of world.items) {
      if (it.id <= 32 && state.locations[it.id] === state.room && it.price) {
        lines.push(`${it.name.padEnd(34)}${it.price}`)
      }
    }
    return { lines }
  }

  if (!item) return { lines: [missingItemMessage(nounPhrase, 'Read')] }
  const here = state.locations[item.id] === state.room
  if (!isCarried(state, item.id) && !here) return { lines: ["(GORN) IT'S NOT HERE TO READ."] }

  if (item.id >= 33 && item.id <= 38) {
    if (item.id === 33) {
      return { lines: ['YOU NOW KNOW ALL THERE IS TO KNOW ABOUT', 'CARING FOR AND FEEDING PET UNICORNS.'] }
    }
    if (item.id === 34) {
      return { lines: ['YOU NOW KNOW ALL THERE IS TO KNOW ABOUT', 'USING HERBS IN COOKING AND MEDICINE.'] }
    }
    if (item.id === 35) {
      if (!state.flags.pigLatinRead) {
        return { lines: ["SORRY, IT'S IN LATIN."] }
      }
      state.flags.highwaymenPaid = true
      return { lines: ['IT IS A DRAGONESE-PIG LATIN DICTIONARY.'] }
    }
    if (item.id === 36) {
      state.flags.pigLatinRead = true
      return { lines: ['YOU NOW KNOW ALL THERE IS TO KNOW ABOUT', 'TRANSLATING PIG LATIN.'] }
    }
    if (item.id === 37) {
      return { lines: ['YOU NOW KNOW ALL THERE IS TO KNOW ABOUT', 'SLEIGHT OF HAND.'] }
    }
    if (item.id === 38) {
      return {
        lines: [
          'YOU NOW KNOW ALL THERE IS TO KNOW ABOUT',
          "WHAT'S HAPPENING IN THE APPLE COMPUTER WORLD, WHAT THE BESTSELLING SOFTWARE  IS, ETC. ETC.",
        ],
      }
    }
  }

  return { lines: ["There's nothing to read on that."] }
}

function handleLook(state, item, nounPhrase) {
  if (!item) {
    if (nounPhrase) return { lines: [missingItemMessage(nounPhrase, 'Look at')] }
    return describeRoom(state)
  }

  if (state.room === 38 && item.id === 13) {
    setRoomExit(state, 38, 'east', 40)
    return { lines: ["(GORN) THERE'S A PASSAGE BEHIND THE   FALLS."] }
  }

  const here = state.locations[item.id] === state.room || state.locations[item.id] === -state.room
  if (!isCarried(state, item.id) && !here) {
    return { lines: ["(GORN) IT'S NOT HERE TO LOOK AT."] }
  }

  if (item.id === 12) return { lines: ["SHE'S PRETTY. SO WHAT?"] }
  if (item.id === 28) return { lines: ["LOOKS LIKE AN ORDINARY 20' SNAKE TO ME."] }
  if (item.id === 11) return { lines: ["INSCRIBED ON THE SKIN IS 'FROM THE EARTHRECEIVETH I FULFILLMENT'."] }
  if (item.id >= 33 && item.id <= 38) return { lines: ["IT'S A BOOK. I THINK YOU'RE SUPPOSED TO READ IT."] }
  if (item.id === 31) return { lines: [messageText(49)] }
  if (item.id === 4) return { lines: ["IT'S 14K GOLD FILLED WITH A .75C RUBY."] }
  if (item.id === 3) return { lines: ["'DRAGONBANE' IS INSCRIBED ON THE SWORD."] }
  if (item.id === 25) {
    if (state.flags.cubDied) return { lines: ['(GORN) THE DRAGON CUB IS DEAD!'] }
    return { lines: ['(GORN) THE KID DRAGON LOOKS OKAY.'] }
  }

  return { lines: ['(GORN) LOOKS PERFECTLY ORDINARY TO ME.'] }
}

function handleGive(state, item, nounPhrase, numeral, raw) {
  const isGold = (item && item.id === 2) || raw.toUpperCase().includes('GOLD') || raw.toUpperCase().includes('SOVEREIGNS')
  if (isGold) {
    if (raw.toUpperCase().includes('TO GORN')) {
      return { lines: ['(GORN) BEST NOT, WE MAY NEED IT LATER.'] }
    }
    if (state.room !== 19) {
      return { lines: ["(GORN) I'M NOT GOING TO THROW OUR GOLD AWAY LIKE THAT!"] }
    }
    const amount = numeral || 0
    if (amount === 0) {
      return { lines: [messageText(25)] }
    }
    if (amount > state.gold) {
      return { lines: ["(GORN) WE DON'T HAVE THAT MUCH!"] }
    }
    state.gold -= amount
    state.turns += 1
    if (amount < 51) {
      if (amount < 4 || amount > 10) return { lines: [messageText(22)] }
      if (amount < 7 || amount > 10) return { lines: [messageText(23)] }
      return { lines: [messageText(24)] }
    }
    state.flags.highwaymenPaid = true
    return { lines: [messageText(26)] }
  }

  if (raw.toUpperCase().includes('TO GORN')) {
    return { lines: ['(GORN) BEST NOT, WE MAY NEED IT LATER.'] }
  }
  if (!item || !isCarried(state, item.id)) {
    return { lines: ["(GORN) WE DON'T HAVE IT TO GIVE."] }
  }
  return { lines: ['(GORN) BEST NOT, WE MAY NEED IT LATER.'] }
}

function handleSwim(state, raw) {
  if (state.room < 92 || state.room > 96) {
    return { lines: ['(GORN) SWIMMING IS FOR FISH.'] }
  }
  const u = raw.toUpperCase()
  if (u.includes('SHORE')) {
    return handleMove(state, 'north')
  }
  if (u.includes('ISLAND')) {
    return handleMove(state, 'south')
  }
  return { lines: ['SWIM WHERE?'] }
}

function handleAttack(state) {
  state.turns += 1
  if (state.room === 57) {
    if (state.flags.lisaJoined) {
      return { lines: [messageText(148)] }
    }
    state.over = true
    return { lines: [messageText(149), 'YOU ARE DEAD!'] }
  }
  if (state.room === 149 || state.room === 26) {
    state.over = true
    return { lines: [messageText(144), 'YOU ARE DEAD!'] }
  }
  return { lines: ["(GORN) I LOVE A SCRAP AS MUCH AS THE  NEXT GUY, BUT THIS ISN'T THE TIME!"] }
}

function handleBook(state) {
  if (state.room !== 2) {
    return { lines: ["(GORN) I'M NOT SURE I UNDERSTAND YOU."] }
  }
  const lines = [
    '(PROVISIONER) OH, YEAH! I FORGOT ABOUTTHOSE BOOKS! WE HAVE:',
    '',
    'BOOK                          SOVERIGNS',
    '',
  ]
  for (let i = 33; i <= 38; i++) {
    const it = getItem(i)
    if (it) {
      lines.push(`${it.name.padEnd(30)}${it.price || 0}`)
    }
  }
  return { lines }
}

function handleQuit(state) {
  const fresh = newGame()
  return { ...describeRoom(fresh), lines: ['Game reset.'], state: fresh }
}

function handleSave(state) {
  const ok = saveGame(state)
  return { lines: [ok ? 'Game saved.' : "Couldn't save the game in this browser."] }
}

function handleRestore() {
  const loaded = loadGame()
  if (!loaded) return { lines: ['There is no saved game.'], state: null }
  const view = describeRoom(loaded)
  return { ...view, extra: ['Game restored.', ...view.extra], state: loaded }
}

export function runTurn(state, input) {
  // Check pending Sphinx riddle answer or direct Sphinx response in room 104
  if (
    state.pendingPrompt === 'sphinx' ||
    (state.room === 104 && !state.flags.sphinxSolved && input.toUpperCase().includes('SPHINX'))
  ) {
    if (input.toUpperCase().includes('SPHINX')) {
      state.flags.sphinxSolved = true
      state.pendingPrompt = null
      setRoomExit(state, 104, 'south', 202)
      return { lines: [messageText(134)], state }
    }
    state.pendingPrompt = null
    return { lines: [messageText(135)], state }
  }

  const cmd = parseCommand(input)
  if (!cmd.action) return { lines: ["(GORN) I'M NOT SURE I UNDERSTAND YOU."], state }

  switch (cmd.action) {
    case 'move':
    case 'north':
    case 'south':
    case 'east':
    case 'west':
    case 'up':
    case 'down': {
      const dir = cmd.direction || cmd.action
      return { ...handleMove(state, dir), state }
    }
    case 'take':
      return { ...handleTake(state, cmd.item, cmd.nounPhrase, cmd.raw), state }
    case 'drop':
      return { ...handleDrop(state, cmd.item, cmd.nounPhrase, cmd.raw), state }
    case 'inventory':
      return { ...handleInventory(state), state }
    case 'look':
      return { ...handleLook(state, cmd.item, cmd.nounPhrase), state }
    case 'read':
      return { ...handleRead(state, cmd.item, cmd.nounPhrase), state }
    case 'climb':
      return { ...handleClimb(state), state }
    case 'fill':
      return { ...handleFill(state, cmd.item), state }
    case 'tie':
      return { ...handleTie(state, cmd.item, cmd.nounPhrase), state }
    case 'open':
      return { ...handleOpen(state, cmd.item, cmd.nounPhrase), state }
    case 'knock':
      return { ...handleKnock(state), state }
    case 'light':
      return { ...handleLight(state, cmd.item, cmd.nounPhrase), state }
    case 'ride':
      return { ...handleRide(state, cmd.item, cmd.nounPhrase), state }
    case 'talk':
      return { ...handleTalk(state, cmd.item, cmd.nounPhrase, cmd.raw), state }
    case 'give':
      return { ...handleGive(state, cmd.item, cmd.nounPhrase, cmd.numeral, cmd.raw), state }
    case 'swim':
      return { ...handleSwim(state, cmd.raw), state }
    case 'attack':
      return { ...handleAttack(state), state }
    case 'book':
      return { ...handleBook(state), state }
    case 'save':
      return { ...handleSave(state), state }
    case 'restore': {
      const result = handleRestore()
      const { state: loaded, ...rest } = result
      return { ...rest, state: loaded || state }
    }
    case 'quit':
      return handleQuit(state)
    case 'go':
      // Bare GO with no direction (MQ.bas:1100 falls straight through to
      // :40's refusal) -- GO <direction> never reaches here, parser.js
      // resolves it to a plain move first.
      state.turns += 1
      return { lines: ["(GORN) I'M NOT SURE I UNDERSTAND YOU."], state }
    default:
      state.turns += 1
      return { lines: ["That doesn't seem to work here."], state }
  }
}
