// Not a gameplay test: a completeness check. winnable.test.js proves a path
// through the game works; interactions.test.js proves specific puzzles work
// the way MQ.bas says they should. Neither one would notice a whole verb or
// room-arrival event that was simply never wired up -- the game just shrugs
// at it, which looks identical to "not implemented yet" and "correctly
// refused" from a player's transcript. This file reads engine.js's own
// source and cross-checks it against quest-data.json, so a forgotten case is
// a failing assertion instead of a silent no-op.
//
// It's deliberately syntactic (does the source text mention this room id or
// action?), not behavioral -- cheap, and it already found one real bug
// before this file existed: FILL (verb dispatch 950) had no `case` in the
// switch, so FILL WATERSKIN did nothing even though TAKE WATER (the same
// underlying mechanic, MQ.bas:950-955) worked. Fixed alongside this test,
// not by it -- a syntactic check only proves code *exists* for something,
// not that it's correct; that's what interactions.test.js is for.

import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { lookupVerbAction, world } from '../src/engine/world.js'

const engineSource = readFileSync(new URL('../src/engine/engine.js', import.meta.url), 'utf8')

test('every room with an arrival event is referenced by id somewhere in engine.js', () => {
  const byLine = new Map()
  for (const room of world.rooms) {
    if (!room.event_line) continue
    if (!byLine.has(room.event_line)) byLine.set(room.event_line, [])
    byLine.get(room.event_line).push(room.id)
  }

  const missing = []
  for (const [line, roomIds] of byLine) {
    // Coverage counts either as a check against the shared event_line value
    // itself (several lines -- 3800, 3900 -- are "kind of room" checks, e.g.
    // dark caves, rather than one room getting its own branch) or as a
    // room-comparison against any one of the rooms that share it.
    const coveredByLine = new RegExp(`event_line\\s*===\\s*${line}\\b`).test(engineSource)
    const coveredByRoom = roomIds.some((id) => new RegExp(`(room|dest)\\s*===\\s*${id}\\b`).test(engineSource))
    if (!coveredByLine && !coveredByRoom) {
      missing.push(`MQ.bas:${line} (room${roomIds.length > 1 ? 's' : ''} ${roomIds.join(', ')})`)
    }
  }

  expect(missing).toEqual([])
})

test('every verb-dispatch action the parser can produce has a case in the runTurn switch', () => {
  const actions = new Set()
  for (const verb of world.verbs) {
    const action = lookupVerbAction(verb)
    if (action) actions.add(action)
  }

  const missing = [...actions].filter((action) => !new RegExp(`case '${action}':`).test(engineSource))
  expect(missing).toEqual([])
})

test('every item either starts somewhere reachable or is a known special case', () => {
  // Items whose starting location is 256 ("nowhere") are either pure
  // vocabulary with no physical pickup, or relocated by a room event rather
  // than sitting at a fixed spot from the start -- see RESEARCH.md's item
  // table. If a new item shows up here, it's a genuine gap: nothing places
  // it, so the generic TAKE path can never reach it.
  const unplaced = world.items.filter((it) => it.location === 256).map((it) => it.name)
  const knownSpecialCases = ['ALL', 'HOUSE', 'DOOR', 'WATER', 'CARPET']
  expect(unplaced.sort()).toEqual(knownSpecialCases.sort())
})
