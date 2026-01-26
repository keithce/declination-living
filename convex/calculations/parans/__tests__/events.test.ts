import { describe, expect, it } from 'vitest'
import {
  calculateAllEventTimes,
  calculateAntiCulminateTime,
  calculateCulminateTime,
  calculateEventTime,
  calculateRiseTime,
  calculateSetTime,
  lstAbsDifference,
  lstDifference,
} from '../events'
import type { PlanetId } from '../../core/types'

describe('Event Time Calculations', () => {
  const testPlanet: PlanetId = 'sun'

  describe('calculateCulminateTime', () => {
    it('calculates culmination at RA', () => {
      // Culmination occurs when HA = 0, so LST = RA
      const result = calculateCulminateTime(testPlanet, 90)
      expect(result.isPossible).toBe(true)
      expect(result.event).toBe('culminate')
      expect(result.lst).toBeCloseTo(90, 5)
    })

    it('normalizes RA to 0-360', () => {
      const result = calculateCulminateTime(testPlanet, 400)
      expect(result.lst).toBeCloseTo(40, 5)
    })

    it('handles RA = 0', () => {
      const result = calculateCulminateTime(testPlanet, 0)
      expect(result.lst).toBeCloseTo(0, 5)
    })

    it('handles RA near 360', () => {
      const result = calculateCulminateTime(testPlanet, 359)
      expect(result.lst).toBeCloseTo(359, 5)
    })
  })

  describe('calculateAntiCulminateTime', () => {
    it('calculates anti-culmination at RA + 180', () => {
      // Anti-culmination occurs when HA = 180°, so LST = RA + 180
      const result = calculateAntiCulminateTime(testPlanet, 90)
      expect(result.isPossible).toBe(true)
      expect(result.event).toBe('anti_culminate')
      expect(result.lst).toBeCloseTo(270, 5)
    })

    it('wraps correctly past 360', () => {
      const result = calculateAntiCulminateTime(testPlanet, 200)
      expect(result.lst).toBeCloseTo(20, 5) // 200 + 180 = 380 -> 20
    })

    it('handles RA = 0', () => {
      const result = calculateAntiCulminateTime(testPlanet, 0)
      expect(result.lst).toBeCloseTo(180, 5)
    })
  })

  describe('calculateRiseTime', () => {
    it('calculates rise time for equatorial object', () => {
      // Object on celestial equator (dec=0) at latitude 45°N
      // SDA ≈ 90°, so rise HA ≈ -90
      // LST = RA + HA = RA - 90
      const result = calculateRiseTime(testPlanet, 180, 0, 45)
      expect(result.isPossible).toBe(true)
      expect(result.event).toBe('rise')
      expect(result.lst).toBeCloseTo(90, 1) // 180 - 90
    })

    it('calculates rise time at equator', () => {
      // At equator, SDA = 90° for any object that rises/sets
      const result = calculateRiseTime(testPlanet, 100, 23, 0)
      expect(result.isPossible).toBe(true)
      expect(result.lst).toBeCloseTo(10, 1) // 100 - 90
    })

    it('detects circumpolar object (never sets)', () => {
      // At 70°N with dec=80°, object never sets
      const result = calculateRiseTime(testPlanet, 100, 80, 70)
      expect(result.isPossible).toBe(false)
      expect(result.circumpolarState).toBe('always_above')
    })

    it('detects object that never rises', () => {
      // At 70°N with dec=-80°, object never rises
      const result = calculateRiseTime(testPlanet, 100, -80, 70)
      expect(result.isPossible).toBe(false)
      expect(result.circumpolarState).toBe('always_below')
    })

    it('handles southern hemisphere', () => {
      // At 45°S with dec=-23°, object rises normally
      const result = calculateRiseTime(testPlanet, 200, -23, -45)
      expect(result.isPossible).toBe(true)
    })
  })

  describe('calculateSetTime', () => {
    it('calculates set time for equatorial object', () => {
      // Object on celestial equator at latitude 45°N
      // LST = RA + SDA
      const result = calculateSetTime(testPlanet, 180, 0, 45)
      expect(result.isPossible).toBe(true)
      expect(result.event).toBe('set')
      expect(result.lst).toBeCloseTo(270, 1) // 180 + 90
    })

    it('rise and set are symmetric around culmination', () => {
      const ra = 180
      const dec = 20
      const lat = 45

      const rise = calculateRiseTime(testPlanet, ra, dec, lat)
      const set = calculateSetTime(testPlanet, ra, dec, lat)
      const culminate = calculateCulminateTime(testPlanet, ra)

      // Culmination should be equidistant from rise and set
      if (rise.isPossible && set.isPossible) {
        const riseToMC = lstAbsDifference(rise.lst, culminate.lst)
        const MCToSet = lstAbsDifference(culminate.lst, set.lst)
        expect(riseToMC).toBeCloseTo(MCToSet, 1)
      }
    })
  })

  describe('calculateAllEventTimes', () => {
    it('returns all four events', () => {
      const events = calculateAllEventTimes(testPlanet, 100, 20, 45)
      expect(events).toHaveLength(4)
      expect(events.map((e) => e.event)).toContain('rise')
      expect(events.map((e) => e.event)).toContain('set')
      expect(events.map((e) => e.event)).toContain('culminate')
      expect(events.map((e) => e.event)).toContain('anti_culminate')
    })

    it('marks impossible events for circumpolar', () => {
      const events = calculateAllEventTimes(testPlanet, 100, 80, 70)
      const rise = events.find((e) => e.event === 'rise')
      const set = events.find((e) => e.event === 'set')
      const culminate = events.find((e) => e.event === 'culminate')
      const antiCulminate = events.find((e) => e.event === 'anti_culminate')

      // Circumpolar: rise/set impossible, culmination possible
      expect(rise?.isPossible).toBe(false)
      expect(set?.isPossible).toBe(false)
      expect(culminate?.isPossible).toBe(true)
      expect(antiCulminate?.isPossible).toBe(true)
    })
  })

  describe('calculateEventTime', () => {
    it('returns correct event type', () => {
      expect(calculateEventTime(testPlanet, 100, 20, 45, 'rise').event).toBe('rise')
      expect(calculateEventTime(testPlanet, 100, 20, 45, 'set').event).toBe('set')
      expect(calculateEventTime(testPlanet, 100, 20, 45, 'culminate').event).toBe('culminate')
      expect(calculateEventTime(testPlanet, 100, 20, 45, 'anti_culminate').event).toBe(
        'anti_culminate',
      )
    })
  })

  describe('lstDifference', () => {
    it('calculates LST difference correctly', () => {
      expect(lstDifference(100, 90)).toBeCloseTo(10, 5)
      expect(lstDifference(90, 100)).toBeCloseTo(-10, 5)
    })

    it('handles LST wrap-around at 360', () => {
      // 350 to 10 should be -20 (shortest path)
      expect(lstDifference(350, 10)).toBeCloseTo(-20, 5)
      // 10 to 350 should be +20
      expect(lstDifference(10, 350)).toBeCloseTo(20, 5)
    })

    it('handles exact opposite (180)', () => {
      // At exactly 180 degrees apart, the result can be ±180
      // Both represent the same angular separation
      expect(Math.abs(lstDifference(0, 180))).toBeCloseTo(180, 5)
      expect(Math.abs(lstDifference(180, 0))).toBeCloseTo(180, 5)
    })

    it('handles same LST', () => {
      expect(lstDifference(100, 100)).toBeCloseTo(0, 5)
    })
  })

  describe('lstAbsDifference', () => {
    it('returns absolute difference', () => {
      expect(lstAbsDifference(100, 90)).toBeCloseTo(10, 5)
      expect(lstAbsDifference(90, 100)).toBeCloseTo(10, 5)
    })

    it('handles wrap-around', () => {
      expect(lstAbsDifference(350, 10)).toBeCloseTo(20, 5)
      expect(lstAbsDifference(10, 350)).toBeCloseTo(20, 5)
    })
  })
})
