import { describe, expect, it } from 'bun:test'
import { newGame } from '../frontend/src/engine/state.js'
import { runTurn, describeRoom } from '../frontend/src/engine/engine.js'

describe('engine basics', () => {
  it('starts in room 1 and can look', () => {
    const state = newGame()
    expect(state.room).toBe(1)
    const view = describeRoom(state)
    expect(view.description).toContain('KING')
  })
})
