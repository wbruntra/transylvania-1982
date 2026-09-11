import { describe, expect, it } from 'bun:test'
import { newGame, getRoomExits, carryItem } from '../frontend/src/engine/state.js'
import { runTurn, describeRoom } from '../frontend/src/engine/engine.js'


describe('Sphinx Riddle (Room 104)', () => {
  it('asks the riddle on TALK in room 104', () => {
    const state = newGame()
    state.room = 104

    // Initial exits: only north (109)
    const exitsBefore = getRoomExits(state, 104)
    expect(exitsBefore.north).toBe(109)
    expect(exitsBefore.south).toBeUndefined()

    // Talk to sphinx
    const res = runTurn(state, 'talk')
    expect(res.lines.some((l) => l.includes('BLUE AS THE SKY'))).toBe(true)

    // Wrong answer clears pending riddle
    const wrong = runTurn(state, 'water')
    expect(wrong.lines.some((l) => l.includes('WRONG'))).toBe(true)

    // Trying south should fail
    const moveRes = runTurn(state, 'south')
    expect(state.room).toBe(104)
    expect(moveRes.lines[0]).toMatch(/can't go that way|don't want to go that way/i)
  })

  it('rejects wrong answer', () => {
    const state = newGame()
    state.room = 104
    runTurn(state, 'talk')

    const res = runTurn(state, 'a bird')
    expect(res.lines.some((l) => l.includes('WRONG.  YOU MAY NOT ENTER.'))).toBe(true)
    expect(getRoomExits(state, 104).south).toBeUndefined()
  })

  it('accepts SPHINX, opens south exit to room 202', () => {
    const state = newGame()
    state.room = 104
    carryItem(state, 22)
    state.flags.lanternLit = true
    runTurn(state, 'talk')

    const res = runTurn(state, 'sphinx')
    expect(res.lines.some((l) => l.includes('CORRECT.  YOU MAY PASS.'))).toBe(true)

    const exitsAfter = getRoomExits(state, 104)
    expect(exitsAfter.south).toBe(202)

    // Now moving south moves to room 202
    const moveRes = runTurn(state, 'south')
    expect(state.room).toBe(202)
  })

})
