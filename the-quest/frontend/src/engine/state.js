import { world } from './world.js'

const SAVE_KEY = 'quest-1983-save'
const START_ROOM = 1

export function newGame() {
  const locations = {}
  for (const item of world.items) locations[item.id] = item.location
  return {
    room: START_ROOM,
    inventory: [],
    locations,
    visited: [START_ROOM],
    turns: 0,
    over: false,
  }
}

export function itemsInRoom(state, roomId) {
  return world.items.filter((it) => state.locations[it.id] === roomId)
}

export function sceneryInRoom(state, roomId) {
  return world.items.filter((it) => state.locations[it.id] === -roomId)
}

export function isCarried(state, itemId) {
  return state.inventory.includes(itemId)
}

export function carryItem(state, itemId) {
  state.locations[itemId] = 0
  if (!state.inventory.includes(itemId)) state.inventory.push(itemId)
}

export function dropItem(state, itemId, roomId) {
  state.locations[itemId] = roomId
  state.inventory = state.inventory.filter((id) => id !== itemId)
}

export function visitRoom(state, roomId) {
  if (!state.visited.includes(roomId)) state.visited.push(roomId)
}

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function hasSavedGame() {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY))
  } catch {
    return false
  }
}
