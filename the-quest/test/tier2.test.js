import { describe, expect, it } from 'bun:test'
import { newGame, carryItem, dropItem, getRoomExits } from '../frontend/src/engine/state.js'
import { runTurn, describeRoom } from '../frontend/src/engine/engine.js'

describe('Tier 2 routines', () => {
  describe('CLIMB (450-460)', () => {
    it('climbs up when an up exit exists', () => {
      const state = newGame()
      // Room 1 only has north exit, no up/down
      state.room = 1
      const res1 = runTurn(state, 'climb')
      expect(res1.lines[0]).toMatch(/don't want to go that way|can't go that way/i)

      // Room 252 with down exit to 244
      state.room = 252
      state.roomExits[252] = { down: 244 }
      const res2 = runTurn(state, 'climb')
      expect(state.room).toBe(244)
    })
  })

  describe('TIE (500-530)', () => {
    it('refuses to tie without rope', () => {
      const state = newGame()
      const res = runTurn(state, 'tie rope')
      expect(res.lines[0]).toContain('WOULD LOVE TO, IF WE HAD A ROPE.')
    })

    it('refuses to tie non-rope item', () => {
      const state = newGame()
      carryItem(state, 3) // sword
      const res = runTurn(state, 'tie sword')
      expect(res.lines[0]).toMatch(/NEVER LEARNED TO TIE\s+THOSE/i)
    })


    it('ties rope in room 77 and unlocks up exit in room 81', () => {
      const state = newGame()
      state.room = 77
      carryItem(state, 7) // rope

      const res = runTurn(state, 'tie rope')
      expect(res.lines[0]).toContain('THAT SHOULD HOLD.')
      expect(state.inventory.includes(7)).toBe(false)
      expect(getRoomExits(state, 81).up).toBe(77)

      // Picking rope back up removes the exit
      state.room = 77
      const takeRes = runTurn(state, 'take rope')
      expect(takeRes.lines[0]).toContain('ROPE: TAKEN.')
      expect(getRoomExits(state, 81).up).toBeUndefined()
    })

    it('ties rope in room 252 and creates bidirectional vertical exit', () => {
      const state = newGame()
      state.room = 252
      carryItem(state, 7)

      runTurn(state, 'tie rope')
      expect(getRoomExits(state, 252).down).toBe(244)
      expect(getRoomExits(state, 244).up).toBe(252)
    })
  })

  describe('OPEN (600-618)', () => {
    it('refuses in room 255 (locked house)', () => {
      const state = newGame()
      state.room = 255
      const res = runTurn(state, 'open')
      expect(res.lines[0]).toContain("I THINK IT'S LOCKED, SIR!")
    })

    it('refuses where there is nothing to open', () => {
      const state = newGame()
      state.room = 1
      const res = runTurn(state, 'open')
      expect(res.lines[0]).toContain("THERE'S NOTHING HERE TO OPEN.")
    })

    it('opens chest in room 81 and reveals carpet', () => {
      const state = newGame()
      state.room = 81
      state.locations[31] = 256 // carpet initially in chest

      const res = runTurn(state, 'open')
      expect(state.flags.chestOpen).toBe(true)
      expect(state.locations[31]).toBe(81)
      expect(res.lines.some((l) => l.includes('RUG IN THE CHEST'))).toBe(true)

      // Opening again
      const res2 = runTurn(state, 'open')
      expect(res2.lines[0]).toContain('ALREADY  OPEN')
    })
  })

  describe('KNOCK (650-660) and Meet Lisa (3700-3720)', () => {
    it('refuses in rooms other than 255', () => {
      const state = newGame()
      state.room = 1
      const res = runTurn(state, 'knock')
      expect(res.lines[0]).toContain('WHY DO A FOOL THING LIKE THAT?')
    })

    it('slams door without ring', () => {
      const state = newGame()
      state.room = 255
      // does not have ring (item 4)
      const res = runTurn(state, 'knock')
      expect(res.lines.some((l) => l.includes('SLAMS THE DOOR SHUT'))).toBe(true)
      expect(state.flags.lisaJoined).toBe(false)
    })

    it('meets Lisa with ring', () => {
      const state = newGame()
      state.room = 255
      carryItem(state, 4) // carry ring

      const res = runTurn(state, 'knock')
      expect(state.flags.lisaJoined).toBe(true)
      expect(state.inventory.includes(4)).toBe(false) // ring taken by Lisa
      expect(res.lines.some((l) => l.includes("SHE'S COMING WITH US"))).toBe(true)

      // Knocking after she joined
      const res2 = runTurn(state, 'knock')
      expect(res2.lines[0]).toContain('OWNER OF THE HOUSE IS NOT IN')
    })
  })

  describe('LIGHT / IGNITE (850-865)', () => {
    it('refuses if item is not lantern', () => {
      const state = newGame()
      carryItem(state, 3)
      const res = runTurn(state, 'light sword')
      expect(res.lines[0]).toContain('NOT SOMETHING TO IGNITE!')
    })

    it('refuses if lantern is not carried', () => {
      const state = newGame()
      const res = runTurn(state, 'light lantern')
      expect(res.lines[0]).toContain("WE DON'T HAVE A LANTERN.")
    })

    it('lights lantern and tracks lit state', () => {
      const state = newGame()
      carryItem(state, 22)
      const res1 = runTurn(state, 'light lantern')
      expect(res1.lines[0]).toContain("OKAY. IT'S LIT.")
      expect(state.flags.lanternLit).toBe(true)

      const res2 = runTurn(state, 'light lantern')
      expect(res2.lines[0]).toContain("ALREADY LIT!")
    })
  })

  describe('RIDE (1400-1430)', () => {
    it('refuses if not carried or wrong item', () => {
      const state = newGame()
      const res = runTurn(state, 'ride carpet')
      expect(res.lines[0]).toContain("WE HAVEN'T GOT A RUG.")
    })

    it('rides carpet in room 219 to room 244', () => {
      const state = newGame()
      state.room = 219
      carryItem(state, 31)

      const res = runTurn(state, 'ride carpet')
      expect(state.room).toBe(244)
    })

    it('rides carpet in room 244 to room 252 and returns carpet to chest', () => {
      const state = newGame()
      state.room = 244
      carryItem(state, 31)

      const res = runTurn(state, 'ride carpet')
      expect(state.room).toBe(252)
      expect(state.locations[31]).toBe(81) // carpet back in chest
      expect(state.flags.chestOpen).toBe(false)
    })
  })
})
