import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WEIGHTS,
  VIBE_CATEGORIES,
  blendVibes,
  getAllVibes,
  getVibeById,
  matchVibeFromQuery,
  normalizeWeights,
  zeroWeights,
} from '../translator'
import { PLANET_IDS } from '../../core/types'

describe('Vibe Categories', () => {
  describe('Preset Vibes', () => {
    it('should have 10 preset vibes', () => {
      expect(VIBE_CATEGORIES).toHaveLength(10)
    })

    it('should have unique IDs', () => {
      const ids = VIBE_CATEGORIES.map((v) => v.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have required fields for each vibe', () => {
      for (const vibe of VIBE_CATEGORIES) {
        expect(vibe.id).toBeDefined()
        expect(vibe.id.length).toBeGreaterThan(0)
        expect(vibe.name).toBeDefined()
        expect(vibe.name.length).toBeGreaterThan(0)
        expect(vibe.description).toBeDefined()
        expect(vibe.keywords).toBeDefined()
        expect(vibe.keywords.length).toBeGreaterThan(0)
        expect(vibe.primaryPlanets).toBeDefined()
        expect(vibe.primaryPlanets.length).toBeGreaterThan(0)
        expect(vibe.weights).toBeDefined()
      }
    })

    it('should have valid weights for all 10 planets', () => {
      for (const vibe of VIBE_CATEGORIES) {
        for (const planet of PLANET_IDS) {
          const weight = vibe.weights[planet]
          expect(weight).toBeDefined()
          expect(typeof weight).toBe('number')
          expect(weight).toBeGreaterThanOrEqual(0)
        }
      }
    })

    it('should have valid primary planets', () => {
      for (const vibe of VIBE_CATEGORIES) {
        for (const planet of vibe.primaryPlanets) {
          expect(PLANET_IDS).toContain(planet)
          // Primary planets should have higher weights
          expect(vibe.weights[planet]).toBeGreaterThan(0)
        }
      }
    })

    it('should have expected vibe IDs', () => {
      const expectedIds = [
        'wealth',
        'career',
        'love',
        'spirituality',
        'creativity',
        'health',
        'adventure',
        'knowledge',
        'transformation',
        'stability',
      ]

      for (const id of expectedIds) {
        const vibe = VIBE_CATEGORIES.find((v) => v.id === id)
        expect(vibe).toBeDefined()
      }
    })
  })

  describe('getVibeById', () => {
    it('should return correct vibe for valid ID', () => {
      const wealth = getVibeById('wealth')
      expect(wealth).toBeDefined()
      expect(wealth?.id).toBe('wealth')
      expect(wealth?.name).toBe('Wealth & Abundance')
    })

    it('should return undefined for invalid ID', () => {
      const invalid = getVibeById('nonexistent')
      expect(invalid).toBeUndefined()
    })

    it('should return correct vibe for each preset', () => {
      for (const vibe of VIBE_CATEGORIES) {
        const found = getVibeById(vibe.id)
        expect(found).toBeDefined()
        expect(found?.id).toBe(vibe.id)
        expect(found?.name).toBe(vibe.name)
      }
    })
  })

  describe('getAllVibes', () => {
    it('should return all preset vibes', () => {
      const vibes = getAllVibes()
      expect(vibes).toHaveLength(10)
    })

    it('should return a copy (not modify original)', () => {
      const vibes = getAllVibes()
      vibes.pop()
      expect(VIBE_CATEGORIES).toHaveLength(10)
    })
  })

  describe('matchVibeFromQuery', () => {
    it('should match by exact ID', () => {
      const matched = matchVibeFromQuery('wealth')
      expect(matched).toBeDefined()
      expect(matched?.id).toBe('wealth')
    })

    it('should match by keyword', () => {
      const matched = matchVibeFromQuery('I want more money')
      expect(matched).toBeDefined()
      expect(matched?.id).toBe('wealth')
    })

    it('should match career keywords', () => {
      const matched = matchVibeFromQuery('professional success and achievement')
      expect(matched).toBeDefined()
      expect(matched?.id).toBe('career')
    })

    it('should match love keywords', () => {
      const matched = matchVibeFromQuery('finding romance and relationships')
      expect(matched).toBeDefined()
      expect(matched?.id).toBe('love')
    })

    it('should match spirituality keywords', () => {
      const matched = matchVibeFromQuery('meditation and enlightenment')
      expect(matched).toBeDefined()
      expect(matched?.id).toBe('spirituality')
    })

    it('should return null for no match', () => {
      const matched = matchVibeFromQuery('xyz random gibberish')
      expect(matched).toBeNull()
    })

    it('should be case insensitive', () => {
      const lower = matchVibeFromQuery('wealth')
      const upper = matchVibeFromQuery('WEALTH')
      const mixed = matchVibeFromQuery('WeAlTh')

      expect(lower?.id).toBe(upper?.id)
      expect(lower?.id).toBe(mixed?.id)
    })

    it('should prefer stronger matches', () => {
      // Query with multiple keyword matches for wealth
      const matched = matchVibeFromQuery('money financial prosperity abundance')
      expect(matched).toBeDefined()
      expect(matched?.id).toBe('wealth')
    })
  })

  describe('blendVibes', () => {
    it('should blend two vibes with equal ratio', () => {
      const wealth = getVibeById('wealth')!
      const career = getVibeById('career')!

      const blended = blendVibes([
        { vibe: wealth, ratio: 0.5 },
        { vibe: career, ratio: 0.5 },
      ])

      // Blended weights should be average of both
      for (const planet of PLANET_IDS) {
        const expected = (wealth.weights[planet] + career.weights[planet]) / 2
        expect(blended[planet]).toBeCloseTo(expected, 5)
      }
    })

    it('should normalize ratios to sum to 1', () => {
      const wealth = getVibeById('wealth')!
      const career = getVibeById('career')!

      // Ratios don't sum to 1
      const blended = blendVibes([
        { vibe: wealth, ratio: 2 },
        { vibe: career, ratio: 2 },
      ])

      // Should still work correctly (normalize to 50/50)
      for (const planet of PLANET_IDS) {
        const expected = (wealth.weights[planet] + career.weights[planet]) / 2
        expect(blended[planet]).toBeCloseTo(expected, 5)
      }
    })

    it('should favor higher ratio vibe', () => {
      const wealth = getVibeById('wealth')!
      const career = getVibeById('career')!

      const blended = blendVibes([
        { vibe: wealth, ratio: 0.8 },
        { vibe: career, ratio: 0.2 },
      ])

      // Compute expected value from source weights
      const expected = 0.8 * wealth.weights.jupiter + 0.2 * career.weights.jupiter
      expect(blended.jupiter).toBeCloseTo(expected, 5)
    })

    it('should return default weights for empty input', () => {
      const blended = blendVibes([])
      expect(blended).toEqual(DEFAULT_WEIGHTS)
    })

    it('should return default weights for zero total ratio', () => {
      const wealth = getVibeById('wealth')!
      const blended = blendVibes([{ vibe: wealth, ratio: 0 }])
      expect(blended).toEqual(DEFAULT_WEIGHTS)
    })

    it('should handle three vibes', () => {
      const wealth = getVibeById('wealth')!
      const career = getVibeById('career')!
      const love = getVibeById('love')!

      const blended = blendVibes([
        { vibe: wealth, ratio: 1 },
        { vibe: career, ratio: 1 },
        { vibe: love, ratio: 1 },
      ])

      // Should be average of all three
      for (const planet of PLANET_IDS) {
        const expected =
          (wealth.weights[planet] + career.weights[planet] + love.weights[planet]) / 3
        expect(blended[planet]).toBeCloseTo(expected, 5)
      }
    })
  })

  describe('normalizeWeights', () => {
    it('should normalize weights to target sum', () => {
      const weights = normalizeWeights(DEFAULT_WEIGHTS, 100)
      const sum = PLANET_IDS.reduce((acc, p) => acc + weights[p], 0)
      expect(sum).toBeCloseTo(100, 5)
    })

    it('should preserve relative proportions', () => {
      const wealth = getVibeById('wealth')!
      const normalized = normalizeWeights(wealth.weights, 100)

      // Jupiter/Venus ratio should be preserved
      const originalRatio = wealth.weights.jupiter / wealth.weights.venus
      const normalizedRatio = normalized.jupiter / normalized.venus
      expect(normalizedRatio).toBeCloseTo(originalRatio, 5)
    })

    it('should return default weights for zero input', () => {
      const zeros = zeroWeights()
      const normalized = normalizeWeights(zeros, 100)
      expect(normalized).toEqual(DEFAULT_WEIGHTS)
    })

    it('should handle custom target sum', () => {
      const weights = normalizeWeights(DEFAULT_WEIGHTS, 50)
      const sum = PLANET_IDS.reduce((acc, p) => acc + weights[p], 0)
      expect(sum).toBeCloseTo(50, 5)
    })
  })

  describe('zeroWeights', () => {
    it('should return all zeros', () => {
      const zeros = zeroWeights()
      for (const planet of PLANET_IDS) {
        expect(zeros[planet]).toBe(0)
      }
    })

    it('should return a new object each time', () => {
      const zeros1 = zeroWeights()
      const zeros2 = zeroWeights()
      zeros1.sun = 5
      expect(zeros2.sun).toBe(0)
    })
  })

  describe('DEFAULT_WEIGHTS', () => {
    it('should have equal weights for all planets', () => {
      for (const planet of PLANET_IDS) {
        expect(DEFAULT_WEIGHTS[planet]).toBe(1)
      }
    })
  })
})
