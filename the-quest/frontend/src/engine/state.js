import { world } from './world.js'

const SAVE_KEY = 'quest-1983-save'
const START_ROOM = 1

export function newGame() {
  const locations = {}
  for (const item of world.items) locations[item.id] = item.location
  return {
    room: START_ROOM,
    prevRoom: 0,
    inventory: [],
    locations,
    visited: [START_ROOM],
    turns: 0,
    roomTurns: 0,
    gold: 150,
    water: 0,
    lastDrinkTurn: 0,
    thirstWarning: false,
    flags: {
      cubDied: false,
      chestOpen: false,
      highwaymenPaid: false,
      sphinxSolved: false,
      dragonConversed: false,
      lanternLit: false,
      lisaJoined: false,
      pigLatinRead: false,
      poisonedWater: false,
      vineSnapped: false,
      cubInPouch: false,
      lizardMenCount: 3,
      villageBurned: false,
    },
    roomExits: {},
    pendingPrompt: null,
    over: false,
    won: false,
  }
}

export function getRoomExits(state, roomId) {
  const room = world.rooms.find((r) => r.id === roomId)
  const baseExits = room ? { ...room.exits } : {}
  const overrides = state.roomExits && state.roomExits[roomId]
  if (overrides) {
    for (const [dir, dest] of Object.entries(overrides)) {
      if (dest === 0 || dest === null) {
        delete baseExits[dir]
      } else {
        baseExits[dir] = dest
      }
    }
  }
  return baseExits
}

export function setRoomExit(state, roomId, direction, destRoomId) {
  if (!state.roomExits) state.roomExits = {}
  if (!state.roomExits[roomId]) state.roomExits[roomId] = {}
  state.roomExits[roomId][direction] = destRoomId
}

export function removeRoomExit(state, roomId, direction) {
  if (!state.roomExits) state.roomExits = {}
  if (!state.roomExits[roomId]) state.roomExits[roomId] = {}
  state.roomExits[roomId][direction] = null
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
  if (!state.visited.includes(roomId)) state.visited = [...state.visited, roomId]
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
