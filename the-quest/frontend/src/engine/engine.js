import { parseCommand } from './parser.js'
import {
  carryItem, dropItem, isCarried, itemsInRoom, saveGame, loadGame,
  sceneryInRoom, visitRoom,
} from './state.js'
import { getItem, getRoom, messageText } from './world.js'

const NOT_PORTED = [
  'Nothing happens.',
  'You try, but nothing comes of it.',
  "That doesn't seem to work here.",
]

function shrug(seed) {
  return NOT_PORTED[seed % NOT_PORTED.length]
}

function itemName(id) {
  const it = getItem(id)
  return it ? it.name.toLowerCase() : `item ${id}`
}

/** No item resolved: distinguish "typed nothing" from "typed an unknown word". */
function missingItemMessage(nounPhrase, verbPrompt) {
  if (!nounPhrase) return `${verbPrompt} what?`
  return `You don't have a word for "${nounPhrase.toLowerCase()}".`
}

/**
 * A "room view" result: `description` is the room's prose (can be long --
 * some, like the opening throne-room scene, run to a full cutscene) and
 * `extra` is the short mechanical stuff (items present, exits) that always
 * fits comfortably in the transcript. The UI decides how to present
 * `description` (inline, or as a dismissible overlay) based on its length.
 */
export function describeRoom(state) {
  const room = getRoom(state.room)
  const description = messageText(room.desc_message) || '(This room has no description.)'
  const extra = []

  const present = itemsInRoom(state, state.room)
  if (present.length) {
    extra.push('You see: ' + present.map((it) => it.name.toLowerCase()).join(', ') + '.')
  }
  for (const s of sceneryInRoom(state, state.room)) {
    extra.push(`There is a ${s.name.toLowerCase()} here.`)
  }

  const exits = Object.keys(room.exits || {})
  if (exits.length) {
    extra.push('Obvious exits: ' + exits.join(', ') + '.')
  }

  return { picture: room.picture, description, extra }
}

function handleMove(state, direction) {
  const room = getRoom(state.room)
  const dest = room.exits && room.exits[direction]
  if (!dest) return { lines: ["You can't go that way."] }

  state.room = dest
  visitRoom(state, dest)
  state.turns += 1
  return describeRoom(state)
}

function handleTake(state, item, nounPhrase) {
  if (!item) return { lines: [missingItemMessage(nounPhrase, 'Take')] }
  if (isCarried(state, item.id)) return { lines: [`You already have the ${item.name.toLowerCase()}.`] }
  if (state.locations[item.id] !== state.room) return { lines: ["It's not here."] }

  carryItem(state, item.id)
  state.turns += 1
  const priceNote = item.price
    ? ` (Worth ${item.price} sovereigns -- the shop economy isn't ported yet, so it's yours for free.)`
    : ''
  return { lines: [`Taken.${priceNote}`] }
}

function handleDrop(state, item, nounPhrase) {
  if (!item) return { lines: [missingItemMessage(nounPhrase, 'Drop')] }
  if (!isCarried(state, item.id)) return { lines: ["You don't have that."] }

  dropItem(state, item.id, state.room)
  state.turns += 1
  return { lines: ['Dropped.'] }
}

function handleInventory(state) {
  if (state.inventory.length === 0) return { lines: ["You aren't carrying anything."] }
  return { lines: ['You are carrying: ' + state.inventory.map(itemName).join(', ') + '.'] }
}

function handleLook(state, item, nounPhrase) {
  if (!item) {
    if (nounPhrase) return { lines: [missingItemMessage(nounPhrase, 'Look at')] }
    return describeRoom(state)
  }

  const here = state.locations[item.id] === state.room || state.locations[item.id] === -state.room
  if (!isCarried(state, item.id) && !here) return { lines: ["You don't see that here."] }
  return { lines: [`You see nothing special about the ${item.name.toLowerCase()}.`] }
}

function handleRead(state, item, nounPhrase) {
  if (!item) return { lines: [missingItemMessage(nounPhrase, 'Read')] }
  const here = state.locations[item.id] === state.room
  if (!isCarried(state, item.id) && !here) return { lines: ["It's not here."] }

  if (item.id >= 33 && item.id <= 38) {
    return { lines: [`You lose yourself in "${item.name}" for a while. (Its full text isn't ported yet.)`] }
  }
  return { lines: ["There's nothing to read on that."] }
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

/**
 * Runs one command against `state`. Returns either a room view
 * (`{ picture, description, extra, state }`) or a plain result
 * (`{ lines, state }`).
 */
export function runTurn(state, input) {
  const cmd = parseCommand(input)
  if (!cmd.action) return { lines: ["I don't understand that."], state }

  switch (cmd.action) {
    case 'move':
      return { ...handleMove(state, cmd.direction), state }
    case 'take':
      return { ...handleTake(state, cmd.item, cmd.nounPhrase), state }
    case 'drop':
      return { ...handleDrop(state, cmd.item, cmd.nounPhrase), state }
    case 'inventory':
      return { ...handleInventory(state), state }
    case 'look':
      return { ...handleLook(state, cmd.item, cmd.nounPhrase), state }
    case 'read':
      return { ...handleRead(state, cmd.item, cmd.nounPhrase), state }
    case 'save':
      return { ...handleSave(state), state }
    case 'restore': {
      const result = handleRestore()
      const { state: loaded, ...rest } = result
      return { ...rest, state: loaded || state }
    }
    default:
      state.turns += 1
      return { lines: [shrug(state.turns)], state }
  }
}
