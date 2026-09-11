import { describe, expect, it } from 'bun:test'
import { newGame, carryItem } from '../frontend/src/engine/state.js'
import { runTurn } from '../frontend/src/engine/engine.js'

describe('Full Quest Winnable Walkthrough', () => {
  it('safely delivers the living dragon cub to the mother dragon and wins the game', () => {
    const state = newGame()

    // Player carries the living cub
    carryItem(state, 25)
    state.flags.cubDied = false
    state.room = 148 // just south of dragon's lair 149

    // Enter dragon's lair
    const res = runTurn(state, 'north')
    expect(state.won).toBe(true)
    expect(state.over).toBe(true)
    expect(state.room).toBe(4) // transported to castle

    expect(res.lines.some((l) => l.includes('ALIVE AND WELL'))).toBe(true)
    expect(res.lines.some((l) => l.includes('UPON REACHING THE CASTLE'))).toBe(true)
    expect(res.lines.some((l) => l.includes('FARE THEE WELL'))).toBe(true)
  })


  it('triggers mother dragon wrath and death if the cub is dead', () => {
    const state = newGame()

    carryItem(state, 25)
    state.flags.cubDied = true
    state.room = 148

    const res = runTurn(state, 'north')
    expect(state.won).toBe(false)
    expect(state.over).toBe(true)
    expect(res.lines.some((l) => l.includes('YOU ARE DEAD!'))).toBe(true)
  })
})
