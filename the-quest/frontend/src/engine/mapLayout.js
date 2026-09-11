import { world } from './world.js'

// Assigns every room a (x, y) grid coordinate by walking the N/S/E/W exit
// graph breadth-first from each room, one connected component at a time.
// UP/DOWN exits are traversed for connectivity but don't move the cursor --
// the handful of vertical rooms just land on whichever cell they're first
// reached from. Computed once and cached: the underlying room graph is
// static room data, so coordinates never need to change across a session.
const DELTA = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
}

let cached = null

function cellKey(x, y) {
  return `${x},${y}`
}

// Grid position (x, y) may already be taken by another room -- the exit
// graph of a hand-built adventure isn't guaranteed to be planar/consistent
// (e.g. NORTH then SOUTH doesn't always return you). Spiral outward from the
// ideal spot to find a free cell rather than dropping the room.
function findFreeCell(occupied, x, y) {
  if (!occupied.has(cellKey(x, y))) return [x, y]
  for (let r = 1; r < 40; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
        const nx = x + dx
        const ny = y + dy
        if (!occupied.has(cellKey(nx, ny))) return [nx, ny]
      }
    }
  }
  return [x, y]
}

export function getRoomLayout() {
  if (cached) return cached

  const byId = new Map(world.rooms.map((r) => [r.id, r]))
  const coords = new Map()
  const occupied = new Set()
  const seen = new Set()
  let originX = 0

  for (const room of world.rooms) {
    if (seen.has(room.id)) continue

    seen.add(room.id)
    coords.set(room.id, { x: originX, y: 0 })
    occupied.add(cellKey(originX, 0))
    let maxX = originX
    const queue = [room.id]

    while (queue.length) {
      const id = queue.shift()
      const r = byId.get(id)
      const { x, y } = coords.get(id)
      if (!r) continue
      for (const [dir, dest] of Object.entries(r.exits)) {
        if (!byId.has(dest) || seen.has(dest)) continue
        const [dx, dy] = DELTA[dir] || [0, 0]
        const [nx, ny] = findFreeCell(occupied, x + dx, y + dy)
        seen.add(dest)
        coords.set(dest, { x: nx, y: ny })
        occupied.add(cellKey(nx, ny))
        maxX = Math.max(maxX, nx)
        queue.push(dest)
      }
    }

    originX = maxX + 3
  }

  cached = coords
  return cached
}
