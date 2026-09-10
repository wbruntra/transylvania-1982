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

  const nounPhrase = rest.join(' ')
  let item = null
  if (nounPhrase) {
    item = lookupItemWord(nounPhrase) || lookupItemWord(rest[rest.length - 1])
  }

  // GO/WALK/RUN/LEAVE/EXIT + a direction word.
  if (action === 'go' && rest.length === 1 && DIRECTION_WORDS[rest[0]]) {
    return { action: 'move', direction: DIRECTION_WORDS[rest[0]], raw: input }
  }

  return { action, item, nounPhrase, noun: rest[0], raw: input }
}
