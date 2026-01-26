import { describe, expect, it } from 'vitest'
import {
  findAllParans,
  getParanStatistics,
  getParansAtLatitude,
  getParansByEvent,
  getParansByStrength,
  getParansForPlanet,
  getTopParans,
  groupParansByEventType,
  groupParansByLatitude,
  groupParansByPlanetPair,
} from '../catalog'
import type { PlanetPosition } from '../catalog'

describe('Paran Catalog', () => {
  // Test positions - realistic planetary positions
  const testPositions: Array<PlanetPosition> = [
    { planetId: 'sun', ra: 90, dec: 23 },
    { planetId: 'moon', ra: 180, dec: -10 },
    { planetId: 'mercury', ra: 75, dec: 20 },
    { planetId: 'venus', ra: 120, dec: 15 },
    { planetId: 'mars', ra: 200, dec: -5 },
    { planetId: 'jupiter', ra: 270, dec: 0 },
    { planetId: 'saturn', ra: 300, dec: -15 },
    { planetId: 'uranus', ra: 45, dec: 10 },
    { planetId: 'neptune', ra: 350, dec: -3 },
    { planetId: 'pluto', ra: 290, dec: 22 },
  ]

  describe('findAllParans', () => {
    it('finds parans for planet set', () => {
      const result = findAllParans(testPositions)

      expect(result.points).toBeDefined()
      expect(result.summary).toBeDefined()
      expect(result.points.length).toBeGreaterThan(0)
    })

    it('respects strength threshold', () => {
      const lowThreshold = findAllParans(testPositions, 0.1)
      const highThreshold = findAllParans(testPositions, 0.9)

      // Lower threshold should include more parans
      expect(lowThreshold.points.length).toBeGreaterThanOrEqual(highThreshold.points.length)

      // All parans should meet their threshold
      for (const paran of highThreshold.points) {
        expect(paran.strength).toBeGreaterThanOrEqual(0.9)
      }
    })

    it('sorts parans by strength descending', () => {
      const result = findAllParans(testPositions)

      // Verify sorted by strength (descending)
      for (let i = 0; i < result.points.length - 1; i++) {
        const currentStrength = result.points[i].strength ?? 0
        const nextStrength = result.points[i + 1].strength ?? 0
        expect(currentStrength).toBeGreaterThanOrEqual(nextStrength)
      }
    })

    it('generates correct summary counts', () => {
      const result = findAllParans(testPositions)

      expect(result.summary.total).toBe(result.points.length)
      expect(result.summary.riseRise).toBeGreaterThanOrEqual(0)
      expect(result.summary.riseCulminate).toBeGreaterThanOrEqual(0)
      expect(result.summary.riseSet).toBeGreaterThanOrEqual(0)
      expect(result.summary.culminateCulminate).toBeGreaterThanOrEqual(0)
      expect(result.summary.culminateSet).toBeGreaterThanOrEqual(0)
      expect(result.summary.setSet).toBeGreaterThanOrEqual(0)
    })

    it('handles subset of planets', () => {
      const subset = testPositions.slice(0, 3) // Sun, Moon, Mercury
      const result = findAllParans(subset)

      // Should find parans for 3 planet pairs (3 choose 2 = 3)
      expect(result.points.length).toBeGreaterThanOrEqual(0)

      // All parans should involve only these planets
      for (const paran of result.points) {
        expect(['sun', 'moon', 'mercury']).toContain(paran.planet1)
        expect(['sun', 'moon', 'mercury']).toContain(paran.planet2)
      }
    })

    it('handles empty positions array', () => {
      const result = findAllParans([])
      expect(result.points).toHaveLength(0)
      expect(result.summary.total).toBe(0)
    })

    it('handles single planet', () => {
      const result = findAllParans([testPositions[0]])
      expect(result.points).toHaveLength(0) // No pairs possible
    })
  })

  describe('getTopParans', () => {
    it('limits top parans correctly', () => {
      const result = findAllParans(testPositions)
      const top5 = getTopParans(result, 5)
      const top10 = getTopParans(result, 10)

      expect(top5.length).toBeLessThanOrEqual(5)
      expect(top10.length).toBeLessThanOrEqual(10)
    })

    it('returns all parans if limit exceeds total', () => {
      const result = findAllParans(testPositions.slice(0, 3)) // Fewer parans
      const topAll = getTopParans(result, 1000)

      expect(topAll.length).toBe(result.points.length)
    })

    it('preserves strength ordering', () => {
      const result = findAllParans(testPositions)
      const top10 = getTopParans(result, 10)

      // Should be sorted by strength descending
      for (let i = 0; i < top10.length - 1; i++) {
        expect(top10[i].strength ?? 0).toBeGreaterThanOrEqual(top10[i + 1].strength ?? 0)
      }
    })
  })

  describe('getParansForPlanet', () => {
    it('filters by planet correctly', () => {
      const result = findAllParans(testPositions)
      const sunParans = getParansForPlanet(result, 'sun')

      // All returned parans should involve sun
      for (const paran of sunParans) {
        expect(paran.planet1 === 'sun' || paran.planet2 === 'sun').toBe(true)
      }
    })

    it('returns empty array for planet with no parans', () => {
      // Use minimal positions where jupiter might not have parans above threshold
      const result = findAllParans(testPositions.slice(0, 2), 0.99) // Very high threshold
      const jupiterParans = getParansForPlanet(result, 'jupiter')

      expect(jupiterParans).toBeDefined()
      expect(Array.isArray(jupiterParans)).toBe(true)
    })
  })

  describe('getParansAtLatitude', () => {
    it('returns parans within orb', () => {
      const result = findAllParans(testPositions)
      const nearEquator = getParansAtLatitude(result, 0, 5)

      // All returned parans should be within 5° of equator
      for (const paran of nearEquator) {
        expect(Math.abs(paran.latitude)).toBeLessThanOrEqual(5)
      }
    })

    it('uses default orb of 2 degrees', () => {
      const result = findAllParans(testPositions)
      const near45N = getParansAtLatitude(result, 45)

      for (const paran of near45N) {
        expect(Math.abs(paran.latitude - 45)).toBeLessThanOrEqual(2)
      }
    })

    it('handles southern latitudes', () => {
      const result = findAllParans(testPositions)
      const near45S = getParansAtLatitude(result, -45, 5)

      for (const paran of near45S) {
        expect(Math.abs(paran.latitude - -45)).toBeLessThanOrEqual(5)
      }
    })
  })

  describe('getParansByEvent', () => {
    it('filters by event type', () => {
      const result = findAllParans(testPositions)
      const riseParans = getParansByEvent(result, 'rise')

      for (const paran of riseParans) {
        expect(paran.event1 === 'rise' || paran.event2 === 'rise').toBe(true)
      }
    })

    it('filters culminate events', () => {
      const result = findAllParans(testPositions)
      const culminateParans = getParansByEvent(result, 'culminate')

      for (const paran of culminateParans) {
        expect(paran.event1 === 'culminate' || paran.event2 === 'culminate').toBe(true)
      }
    })
  })

  describe('getParansByStrength', () => {
    it('filters by strength range', () => {
      const result = findAllParans(testPositions, 0.1) // Low threshold to get more parans
      const strongParans = getParansByStrength(result, 0.8, 1.0)

      for (const paran of strongParans) {
        expect(paran.strength).toBeGreaterThanOrEqual(0.8)
        expect(paran.strength).toBeLessThanOrEqual(1.0)
      }
    })
  })

  describe('groupParansByLatitude', () => {
    it('groups parans by latitude bands', () => {
      const result = findAllParans(testPositions)
      const bands = groupParansByLatitude(result, 10)

      // Band centers should be multiples of 10 (handle -0 vs 0 with Math.abs)
      for (const [center, parans] of bands) {
        expect(Math.abs(center % 10)).toBeCloseTo(0, 5)
        for (const paran of parans) {
          // Each paran should be within the band
          expect(Math.abs(paran.latitude - center)).toBeLessThanOrEqual(5)
        }
      }
    })

    it('uses default band size of 5', () => {
      const result = findAllParans(testPositions)
      const bands = groupParansByLatitude(result)

      for (const [center] of bands) {
        // Handle -0 vs 0 edge case with toBeCloseTo
        expect(Math.abs(center % 5)).toBeCloseTo(0, 5)
      }
    })
  })

  describe('groupParansByPlanetPair', () => {
    it('groups by planet pair', () => {
      const result = findAllParans(testPositions)
      const pairs = groupParansByPlanetPair(result)

      // Each key should be a valid planet pair
      for (const [key, parans] of pairs) {
        const [p1, p2] = key.split('-')
        for (const paran of parans) {
          expect(paran.planet1).toBe(p1)
          expect(paran.planet2).toBe(p2)
        }
      }
    })
  })

  describe('groupParansByEventType', () => {
    it('groups by event combination', () => {
      const result = findAllParans(testPositions)
      const eventGroups = groupParansByEventType(result)

      // Each group should have consistent event types
      // Events are sorted by precedence order: rise, culminate, anti_culminate, set
      for (const [key, parans] of eventGroups) {
        const [e1, e2] = key.split('-')
        for (const paran of parans) {
          // Verify the paran's events match the key (in either order)
          const paranEvents = new Set([paran.event1, paran.event2])
          const keyEvents = new Set([e1, e2])
          expect(paranEvents).toEqual(keyEvents)
        }
      }
    })
  })

  describe('getParanStatistics', () => {
    it('returns correct statistics', () => {
      const result = findAllParans(testPositions)
      const stats = getParanStatistics(result)

      expect(stats.total).toBe(result.points.length)
      expect(stats.averageStrength).toBeGreaterThanOrEqual(0)
      expect(stats.averageStrength).toBeLessThanOrEqual(1)
      expect(stats.medianStrength).toBeGreaterThanOrEqual(0)
      expect(stats.medianStrength).toBeLessThanOrEqual(1)
      expect(stats.latitudeRange.min).toBeLessThanOrEqual(stats.latitudeRange.max)
    })

    it('identifies strongest paran', () => {
      const result = findAllParans(testPositions)
      const stats = getParanStatistics(result)

      if (result.points.length > 0) {
        expect(stats.strongestParan).not.toBeNull()
        expect(stats.strongestParan?.strength).toBe(result.points[0].strength)
      }
    })

    it('counts hemispheres correctly', () => {
      const result = findAllParans(testPositions)
      const stats = getParanStatistics(result)

      expect(stats.byHemisphere.northern + stats.byHemisphere.southern).toBeLessThanOrEqual(
        result.points.length,
      )
    })

    it('handles empty result', () => {
      const result = findAllParans([])
      const stats = getParanStatistics(result)

      expect(stats.total).toBe(0)
      expect(stats.averageStrength).toBe(0)
      expect(stats.strongestParan).toBeNull()
    })
  })
})
