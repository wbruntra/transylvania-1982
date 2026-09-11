import { describe, expect, it } from 'bun:test'
import { newGame, carryItem, dropItem, getRoomExits } from '../frontend/src/engine/state.js'
import { runTurn, describeRoom } from '../frontend/src/engine/engine.js'

describe('Tier 3 routines', () => {
  describe('TAKE & Shop Economy', () => {
    it('buys items in shop if player can afford them', () => {
      const state = newGame()
      state.room = 2 // Shop
      state.gold = 150
      state.locations[15] = 2 // Flint (price 10)

      const res = runTurn(state, 'take flint')
      expect(res.lines[0]).toContain('FLINT: TAKEN.')
      expect(state.gold).toBe(140)
      expect(state.inventory.includes(15)).toBe(true)
    })

    it('refuses purchase if not enough gold', () => {
      const state = newGame()
      state.room = 2
      state.gold = 5
      state.locations[15] = 2 // price 10

      const res = runTurn(state, 'take flint')
      expect(res.lines[0]).toContain("I DON'T THINK WE CAN AFFORD")
      expect(state.inventory.includes(15)).toBe(false)
    })

    it('TAKE ALL takes all movable items in room', () => {
      const state = newGame()
      state.room = 10
      state.locations[15] = 10
      state.locations[18] = 10

      const res = runTurn(state, 'take all')
      expect(state.inventory.includes(15)).toBe(true)
      expect(state.inventory.includes(18)).toBe(true)
    })
  })

  describe('READ', () => {
    it('reads signs in rooms 15, 16, 73', () => {
      const state = newGame()
      state.room = 15
      const res = runTurn(state, 'read sign')
      expect(res.lines.length).toBeGreaterThan(0)
      expect(res.lines[0]).not.toContain("There's nothing to read")
    })

    it('reads books and unlocks Dragonese dictionary via Pig Latin', () => {
      const state = newGame()
      state.room = 2
      carryItem(state, 36) // Pig Latin
      carryItem(state, 35) // Lingua Draco Flameus

      // Reading Dragonese before Pig Latin
      const res1 = runTurn(state, 'read lingua draco flameus')
      expect(res1.lines[0]).toContain("SORRY, IT'S IN LATIN.")

      // Read Pig Latin
      const res2 = runTurn(state, 'read pig latin')
      expect(res2.lines.some((l) => l.includes('TRANSLATING PIG LATIN'))).toBe(true)
      expect(state.flags.pigLatinRead).toBe(true)

      // Now Dragonese can be read
      const res3 = runTurn(state, 'read lingua draco flameus')
      expect(res3.lines[0]).toContain('DRAGONESE-PIG LATIN DICTIONARY')
      expect(state.flags.highwaymenPaid).toBe(true)
    })
  })

  describe('LOOK <noun>', () => {
    it('reveals hidden waterfall passage in room 38', () => {
      const state = newGame()
      state.room = 38
      expect(getRoomExits(state, 38).east).toBeUndefined()

      const res = runTurn(state, 'look waterfall')
      expect(res.lines[0]).toContain("THERE'S A PASSAGE BEHIND THE   FALLS.")
      expect(getRoomExits(state, 38).east).toBe(40)
    })

    it('reads sword dragonbane inscription', () => {
      const state = newGame()
      carryItem(state, 3)
      const res = runTurn(state, 'look sword')
      expect(res.lines[0]).toContain("'DRAGONBANE' IS INSCRIBED ON THE SWORD.")
    })
  })

  describe('GIVE / PAY Highwaymen', () => {
    it('refuses giving gold outside room 19', () => {
      const state = newGame()
      state.room = 1
      const res = runTurn(state, 'give 50 gold')
      expect(res.lines[0]).toContain("I'M NOT GOING TO THROW OUR GOLD AWAY")
    })

    it('negotiates with highwaymen in room 19', () => {
      const state = newGame()
      state.room = 19
      state.gold = 100

      // Pay 55 gold
      const res = runTurn(state, 'give 55 gold')
      expect(state.gold).toBe(45)
      expect(state.flags.highwaymenPaid).toBe(true)
    })
  })

  describe('SWIM', () => {
    it('refuses swimming outside water rooms 92-96', () => {
      const state = newGame()
      state.room = 1
      const res = runTurn(state, 'swim')
      expect(res.lines[0]).toContain('SWIMMING IS FOR FISH.')
    })

    it('swims to shore or island in water rooms', () => {
      const state = newGame()
      state.room = 93
      const res = runTurn(state, 'swim to shore')
      expect(state.room).toBe(92) // north move
    })

  })

  describe('BOOK / SHELF', () => {
    it('lists bookstore books in room 2', () => {
      const state = newGame()
      state.room = 2
      const res = runTurn(state, 'book')
      expect(res.lines.some((l) => l.includes('CARE OF PET UNICORNS'))).toBe(true)
    })
  })
})
