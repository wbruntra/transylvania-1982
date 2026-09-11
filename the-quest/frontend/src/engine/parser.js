import { DIRECTIONS, lookupItemWord, lookupVerbAction } from './world.js'

const DIRECTION_WORDS = {
  N: 'north', NORTH: 'north',
  S: 'south', SOUTH: 'south',
  E: 'east', EAST: 'east',
  W: 'west', WEST: 'west',
  U: 'up', UP: 'up',
  D: 'down', DOWN: 'down',
}

/** Turns raw player input into { action, direction, item, raw, noun }. */
export function parseCommand(input) {
  const words = input.trim().toUpperCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return { action: null, raw: input }

  const [first, ...rest] = words

  // A bare direction word (or its single-letter form) is always movement.
  if (DIRECTION_WORDS[first] && rest.length === 0) {
    return { action: 'move', direction: DIRECTION_WORDS[first], raw: input }
  }

  const action = lookupVerbAction(first)
  if (!action) {
    return { action: null, raw: input, unknownWord: first }
  }

  if (DIRECTIONS.includes(action) && rest.length === 0) {
    return { action: 'move', direction: action, raw: input }
  }

  const numMatch = input.match(/\b\d+\b/)
  const numeral = numMatch ? parseInt(numMatch[0], 10) : 0

  const nounPhrase = rest.join(' ')
  let item = null
  if (nounPhrase) {
    item = lookupItemWord(nounPhrase)
    if (!item) {
      const nonFiller = rest.filter((w) => !['THE', 'A', 'AN', 'AT', 'TO', 'IN', 'INTO', 'ON', 'WITH'].includes(w))
      if (nonFiller.length > 0) {
        item =
          lookupItemWord(nonFiller.join(' ')) ||
          nonFiller.map((w) => lookupItemWord(w)).find(Boolean)
      }
    }
    if (!item) {
      item = rest.map((w) => lookupItemWord(w)).find(Boolean)
    }
  }


  // GO/WALK/RUN/LEAVE/EXIT + a direction word.
  if (action === 'go' && rest.length >= 1) {
    const dirCandidate = rest.find((w) => DIRECTION_WORDS[w])
    if (dirCandidate) {
      return { action: 'move', direction: DIRECTION_WORDS[dirCandidate], raw: input, numeral }
    }
  }

  return { action, item, nounPhrase, noun: rest[0], numeral, words, raw: input }
}

