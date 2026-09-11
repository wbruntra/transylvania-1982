import { describe, expect, it } from 'bun:test'
import { newGame, carryItem } from '../frontend/src/engine/state.js'
import { runTurn } from '../frontend/src/engine/engine.js'

describe('Tier 1 routines', () => {
  describe('Movement & Refusals (202/204)', () => {
    it('gives generic refusal on invalid move in normal rooms', () => {
      const state = newGame()
      state.room = 1
      const res = runTurn(state, 'south')
      expect(res.lines[0]).toContain("I DON'T WANT TO GO THAT WAY.")
    })

    it('gives special refusal in water rooms when Lisa is present', () => {
      const state = newGame()
      state.room = 94
      state.flags.lisaJoined = true
      // No up exit from 94
      const res = runTurn(state, 'up')
      expect(res.lines[0]).toContain('GORN YELLS AT YOU FROM THE SHORE')
    })

  })

  describe('Thirst Mechanic (260-290)', () => {
    it('warns when thirsty after 10 moves without water', () => {
      const state = newGame()
      state.room = 1
      state.turns = 9
      state.lastDrinkTurn = 0
      state.water = 0

      // 10th turn
      const res = runTurn(state, 'north') // room 1 has north exit to 2
      expect(res.lines.some((l) => l.includes('YOU ARE GETTING VERY THIRSTY!'))).toBe(true)
      expect(state.thirstWarning).toBe(true)
    })

    it('dies of thirst if not drinking after warning', () => {
      const state = newGame()
      state.room = 2
      state.turns = 19
      state.lastDrinkTurn = 10
      state.thirstWarning = true
      state.water = 0

      const res = runTurn(state, 'north') // room 2 north to 3
      expect(res.lines.some((l) => l.includes('YOU JUST DIED OF THIRST!'))).toBe(true)
      expect(state.over).toBe(true)
    })

    it('automatically drinks from waterskin if carried', () => {
      const state = newGame()
      state.room = 1
      state.turns = 9
      state.lastDrinkTurn = 0
      carryItem(state, 11) // waterskin
      state.water = 5

      const res = runTurn(state, 'north')
      expect(res.lines.some((l) => l.includes('GORN DRINKS FROM THE FLASK'))).toBe(true)
      expect(state.water).toBe(4)
      expect(state.thirstWarning).toBe(false)
    })
  })

  describe('Dark Caves Arrival (3800-3805)', () => {
    it('retreats from dark room if lantern is not lit', () => {
      const state = newGame()
      state.room = 201
      state.flags.lanternLit = false

      // Try entering dark room 202 (event_line 3800) from 201
      const res = runTurn(state, 'north')
      expect(res.lines.some((l) => l.includes("IT'S TOO DARK IN HERE"))).toBe(true)
      expect(state.room).toBe(201) // turned back to room 201
    })
  })

})
