import data from '../data/quest-data.json'

const DIRECTIONS = ['north', 'south', 'east', 'west', 'up', 'down']

const roomsById = new Map(data.rooms.map((r) => [r.id, r]))
const itemsById = new Map(data.items.map((it) => [it.id, it]))

// Group verb words by their dispatch target so synonyms (GET/TAKE/BUY/
// PURCHASE, ...) collapse to one action. See ../../RESEARCH.md for how
// verbDispatch was derived from AMP 2.8.
const actionByVerb = new Map()
const ACTIONS_BY_DISPATCH = {
  200: 'north', 210: 'south', 220: 'east', 230: 'west', 240: 'up', 250: 'down',
  300: 'take', 350: 'drop', 400: 'inventory', 450: 'climb', 500: 'tie',
  600: 'open', 650: 'knock', 700: 'give', 750: 'read', 800: 'look',
  850: 'light', 900: 'talk', 950: 'fill', 1000: 'swim', 1050: 'attack',
  1100: 'go', 1200: 'save', 1250: 'restore', 1300: 'quit', 1350: 'book',
  1400: 'ride',
}
data.verbs.forEach((word, i) => {
  const dispatch = data.verbDispatch[i]
  const action = ACTIONS_BY_DISPATCH[dispatch]
  if (action) actionByVerb.set(word, action)
})

// Word -> item, from each item's synonym list (already includes the name).
const itemByWord = new Map()
for (const item of data.items) {
  for (const syn of item.synonyms) {
    itemByWord.set(syn, item)
  }
}

export function getRoom(id) {
  return roomsById.get(id)
}

export function getItem(id) {
  return itemsById.get(id)
}

export function lookupVerbAction(word) {
  return actionByVerb.get(word)
}

export function lookupItemWord(word) {
  return itemByWord.get(word)
}

export function messageText(id) {
  return data.messages[id] || ''
}

export { DIRECTIONS }
export const world = data
