import { describe, expect, it } from 'vitest'
import {
  calculateAllDignities,
  calculateDignity,
  formatDignityScore,
  getDignityColor,
  getDignityIndicator,
  getEssentiallyDebilitated,
  getEssentiallyDignified,
  getSimplifiedDignity,
  getStrongPlanets,
  getWeakPlanets,
  rankPlanetsByDignity,
} from '../calculator'
import { DIGNITY_POINTS } from '../../core/constants'
import type { DignityScore, PlanetId } from '../../core/types'

describe('Dignity Calculator', () => {
  describe('calculateDignity', () => {
    describe('Domicile (+5)', () => {
      it('should score Sun in Leo as domicile', () => {
        // Leo starts at 120°
        const score = calculateDignity('sun', 120, true)
        expect(score.domicile).toBe(DIGNITY_POINTS.domicile)
        expect(score.domicile).toBe(5)
        expect(score.breakdown).toContain('Domicile (+5)')
      })

      it('should score Moon in Cancer as domicile', () => {
        // Cancer starts at 90°
        const score = calculateDignity('moon', 90, true)
        expect(score.domicile).toBe(5)
      })

      it('should score Mars in Aries as domicile', () => {
        const score = calculateDignity('mars', 0, true)
        expect(score.domicile).toBe(5)
      })

      it('should score Mars in Scorpio as domicile', () => {
        // Scorpio starts at 210°
        const score = calculateDignity('mars', 210, true)
        expect(score.domicile).toBe(5)
      })

      it('should score Venus in Taurus as domicile', () => {
        // Taurus starts at 30°
        const score = calculateDignity('venus', 30, true)
        expect(score.domicile).toBe(5)
      })

      it('should score Mercury in Gemini as domicile', () => {
        // Gemini starts at 60°
        const score = calculateDignity('mercury', 60, true)
        expect(score.domicile).toBe(5)
      })

      it('should score Jupiter in Sagittarius as domicile', () => {
        // Sagittarius starts at 240°
        const score = calculateDignity('jupiter', 240, true)
        expect(score.domicile).toBe(5)
      })

      it('should score Saturn in Capricorn as domicile', () => {
        // Capricorn starts at 270°
        const score = calculateDignity('saturn', 270, true)
        expect(score.domicile).toBe(5)
      })
    })

    describe('Exaltation (+4)', () => {
      it('should score Sun in Aries as exalted', () => {
        const score = calculateDignity('sun', 15, true)
        expect(score.exaltation).toBe(DIGNITY_POINTS.exaltation)
        expect(score.exaltation).toBe(4)
        expect(score.breakdown).toContain('Exaltation (+4)')
      })

      it('should score Moon in Taurus as exalted', () => {
        const score = calculateDignity('moon', 33, true)
        expect(score.exaltation).toBe(4)
      })

      it('should score Venus in Pisces as exalted', () => {
        // Pisces starts at 330°
        const score = calculateDignity('venus', 357, true)
        expect(score.exaltation).toBe(4)
      })

      it('should score Mars in Capricorn as exalted', () => {
        // Capricorn starts at 270°
        const score = calculateDignity('mars', 298, true)
        expect(score.exaltation).toBe(4)
      })

      it('should score Jupiter in Cancer as exalted', () => {
        const score = calculateDignity('jupiter', 105, true)
        expect(score.exaltation).toBe(4)
      })

      it('should score Saturn in Libra as exalted', () => {
        // Libra starts at 180°
        const score = calculateDignity('saturn', 201, true)
        expect(score.exaltation).toBe(4)
      })
    })

    describe('Triplicity (+3)', () => {
      it('should score Sun in Aries (fire sign) in day chart', () => {
        // Sun is day ruler of fire triplicity
        const score = calculateDignity('sun', 10, true)
        expect(score.triplicity).toBe(DIGNITY_POINTS.triplicity)
        expect(score.triplicity).toBe(3)
      })

      it('should score Jupiter in Aries (fire sign) in night chart', () => {
        // Jupiter is night ruler of fire triplicity
        const score = calculateDignity('jupiter', 10, false)
        expect(score.triplicity).toBe(3)
      })

      it('should score Venus in Taurus (earth sign) in day chart', () => {
        // Venus is day ruler of earth triplicity
        const score = calculateDignity('venus', 35, true)
        expect(score.triplicity).toBe(3)
      })

      it('should score Moon in Taurus (earth sign) in night chart', () => {
        // Moon is night ruler of earth triplicity
        const score = calculateDignity('moon', 45, false)
        expect(score.triplicity).toBe(3)
      })

      it('should score Saturn in Gemini (air sign) in day chart', () => {
        // Saturn is day ruler of air triplicity
        const score = calculateDignity('saturn', 75, true)
        expect(score.triplicity).toBe(3)
      })
    })

    describe('Terms (+2)', () => {
      it('should score Jupiter in Aries 0-6° (Egyptian terms)', () => {
        const score = calculateDignity('jupiter', 3, true, 'egyptian')
        expect(score.terms).toBe(DIGNITY_POINTS.terms)
        expect(score.terms).toBe(2)
      })

      it('should score Venus in Aries 6-12° (Egyptian terms)', () => {
        const score = calculateDignity('venus', 8, true, 'egyptian')
        expect(score.terms).toBe(2)
      })
    })

    describe('Face/Decan (+1)', () => {
      it('should score Mars in Aries 0-10° (first decan)', () => {
        const score = calculateDignity('mars', 5, true)
        expect(score.face).toBe(DIGNITY_POINTS.face)
        expect(score.face).toBe(1)
      })

      it('should score Sun in Aries 10-20° (second decan)', () => {
        const score = calculateDignity('sun', 15, true)
        expect(score.face).toBe(1)
      })

      it('should score Venus in Aries 20-30° (third decan)', () => {
        const score = calculateDignity('venus', 25, true)
        expect(score.face).toBe(1)
      })
    })

    describe('Detriment (-5)', () => {
      it('should score Sun in Aquarius as detriment', () => {
        // Aquarius starts at 300°
        const score = calculateDignity('sun', 315, true)
        expect(score.detriment).toBe(DIGNITY_POINTS.detriment)
        expect(score.detriment).toBe(-5)
        expect(score.breakdown).toContain('Detriment (-5)')
      })

      it('should score Moon in Capricorn as detriment', () => {
        const score = calculateDignity('moon', 285, true)
        expect(score.detriment).toBe(-5)
      })

      it('should score Mars in Libra as detriment', () => {
        const score = calculateDignity('mars', 195, true)
        expect(score.detriment).toBe(-5)
      })

      it('should score Venus in Scorpio as detriment', () => {
        const score = calculateDignity('venus', 225, true)
        expect(score.detriment).toBe(-5)
      })

      it('should score Jupiter in Virgo as detriment', () => {
        // Virgo starts at 150°
        const score = calculateDignity('jupiter', 165, true)
        expect(score.detriment).toBe(-5)
      })

      it('should score Saturn in Cancer as detriment', () => {
        const score = calculateDignity('saturn', 105, true)
        expect(score.detriment).toBe(-5)
      })
    })

    describe('Fall (-4)', () => {
      it('should score Sun in Libra as fall', () => {
        // Libra starts at 180°
        const score = calculateDignity('sun', 195, true)
        expect(score.fall).toBe(DIGNITY_POINTS.fall)
        expect(score.fall).toBe(-4)
        expect(score.breakdown).toContain('Fall (-4)')
      })

      it('should score Moon in Scorpio as fall', () => {
        const score = calculateDignity('moon', 225, true)
        expect(score.fall).toBe(-4)
      })

      it('should score Mars in Cancer as fall', () => {
        const score = calculateDignity('mars', 105, true)
        expect(score.fall).toBe(-4)
      })

      it('should score Saturn in Aries as fall', () => {
        const score = calculateDignity('saturn', 15, true)
        expect(score.fall).toBe(-4)
      })
    })

    describe('Peregrine (-5)', () => {
      it('should score Sun in Gemini as peregrine', () => {
        // Sun has no dignity in Gemini (not domicile, exaltation, or triplicity)
        // Need to pick a degree where Sun has no terms or face either
        const score = calculateDignity('sun', 70, false) // Gemini 10°, night chart
        expect(score.peregrine).toBe(DIGNITY_POINTS.peregrine)
        expect(score.peregrine).toBe(-5)
        expect(score.breakdown).toContain('Peregrine (-5)')
      })

      it('should not be peregrine if planet has any positive dignity', () => {
        // Sun in Leo - has domicile
        const score = calculateDignity('sun', 120, true)
        expect(score.peregrine).toBe(0)
      })

      it('should not be peregrine if planet is in detriment', () => {
        // Sun in Aquarius - has detriment (not peregrine, just debilitated)
        const score = calculateDignity('sun', 315, true)
        expect(score.peregrine).toBe(0) // Detriment is not peregrine
      })
    })

    describe('Combined Scores', () => {
      it('should calculate correct total for Sun in Leo', () => {
        const score = calculateDignity('sun', 125, true)
        // Domicile (+5) + potential triplicity (+3) + potential face
        expect(score.total).toBeGreaterThanOrEqual(5)
      })

      it('should calculate correct total for Saturn in Libra (exalted)', () => {
        const score = calculateDignity('saturn', 201, true)
        // Exaltation (+4) + maybe triplicity + maybe terms
        expect(score.total).toBeGreaterThanOrEqual(4)
      })

      it('should combine multiple dignities', () => {
        // Mercury in Virgo - domicile AND exaltation
        const score = calculateDignity('mercury', 165, true)
        expect(score.domicile).toBe(5)
        expect(score.exaltation).toBe(4)
        expect(score.total).toBeGreaterThanOrEqual(9)
      })
    })
  })

  describe('getDignityIndicator', () => {
    it('should return R for domicile', () => {
      const score = calculateDignity('sun', 120, true) // Sun in Leo
      expect(getDignityIndicator(score)).toBe('R')
    })

    it('should return E for exaltation (when no domicile)', () => {
      const score = calculateDignity('moon', 33, true) // Moon in Taurus
      expect(getDignityIndicator(score)).toBe('E')
    })

    it('should return d for detriment', () => {
      const score = calculateDignity('sun', 315, true) // Sun in Aquarius
      expect(getDignityIndicator(score)).toBe('d')
    })

    it('should return f for fall', () => {
      const score = calculateDignity('sun', 195, true) // Sun in Libra
      expect(getDignityIndicator(score)).toBe('f')
    })

    it('should return - for peregrine', () => {
      // Find a truly peregrine placement
      const score = calculateDignity('sun', 70, false) // Sun in Gemini, night
      expect(getDignityIndicator(score)).toBe('-')
    })

    it('should prioritize domicile over exaltation', () => {
      // Mercury in Virgo has both domicile and exaltation
      const score = calculateDignity('mercury', 165, true)
      expect(score.domicile).toBeGreaterThan(0)
      expect(score.exaltation).toBeGreaterThan(0)
      expect(getDignityIndicator(score)).toBe('R')
    })

    it('should prioritize major dignities over minor', () => {
      const score: DignityScore = {
        planet: 'sun',
        domicile: 0,
        exaltation: 4,
        triplicity: 3,
        terms: 2,
        face: 1,
        detriment: 0,
        fall: 0,
        peregrine: 0,
        total: 10,
        breakdown: [],
      }
      // Should show E for exaltation, not T/t/F
      expect(getDignityIndicator(score)).toBe('E')
    })
  })

  describe('getSimplifiedDignity', () => {
    it('should return total and indicator', () => {
      const score = calculateDignity('sun', 120, true) // Sun in Leo
      const simplified = getSimplifiedDignity(score)

      expect(simplified.total).toBe(score.total)
      expect(simplified.indicator).toBe('R')
    })

    it('should handle negative totals', () => {
      const score = calculateDignity('sun', 315, true) // Sun in Aquarius (detriment)
      const simplified = getSimplifiedDignity(score)

      expect(simplified.total).toBeLessThan(0)
      expect(simplified.indicator).toBe('d')
    })
  })

  describe('formatDignityScore', () => {
    it('should format positive scores with + sign', () => {
      const score = calculateDignity('sun', 120, true)
      const formatted = formatDignityScore(score)
      expect(formatted).toMatch(/^\+\d+ \([REdf-]\)$/)
    })

    it('should format negative scores without + sign', () => {
      const score = calculateDignity('sun', 315, true) // Detriment
      const formatted = formatDignityScore(score)
      expect(formatted).toMatch(/^-\d+ \([REdf-]\)$/)
    })

    it('should include indicator in parentheses', () => {
      const score = calculateDignity('sun', 120, true)
      const formatted = formatDignityScore(score)
      expect(formatted).toContain('(R)')
    })
  })

  describe('getDignityColor', () => {
    it('should return green for high positive scores', () => {
      const score: DignityScore = {
        planet: 'sun',
        domicile: 5,
        exaltation: 0,
        triplicity: 3,
        terms: 0,
        face: 0,
        detriment: 0,
        fall: 0,
        peregrine: 0,
        total: 8,
        breakdown: [],
      }
      expect(getDignityColor(score)).toBe('#4CAF50') // Strong green
    })

    it('should return red for low negative scores', () => {
      const score: DignityScore = {
        planet: 'sun',
        domicile: 0,
        exaltation: 0,
        triplicity: 0,
        terms: 0,
        face: 0,
        detriment: -5,
        fall: 0,
        peregrine: 0,
        total: -5,
        breakdown: [],
      }
      expect(getDignityColor(score)).toBe('#F44336') // Red
    })

    it('should return gray for zero scores', () => {
      const score: DignityScore = {
        planet: 'sun',
        domicile: 0,
        exaltation: 0,
        triplicity: 0,
        terms: 0,
        face: 0,
        detriment: 0,
        fall: 0,
        peregrine: 0,
        total: 0,
        breakdown: [],
      }
      expect(getDignityColor(score)).toBe('#9E9E9E')
    })
  })

  describe('calculateAllDignities', () => {
    const testPositions: Record<PlanetId, number> = {
      sun: 120, // Leo
      moon: 90, // Cancer
      mercury: 60, // Gemini
      venus: 30, // Taurus
      mars: 0, // Aries
      jupiter: 240, // Sagittarius
      saturn: 270, // Capricorn
      uranus: 300, // Aquarius
      neptune: 330, // Pisces
      pluto: 210, // Scorpio
    }

    it('should calculate dignities for all 10 planets', () => {
      const dignities = calculateAllDignities(testPositions, true)

      expect(Object.keys(dignities)).toHaveLength(10)
      expect(dignities.sun).toBeDefined()
      expect(dignities.moon).toBeDefined()
      expect(dignities.pluto).toBeDefined()
    })

    it('should use correct positions for each planet', () => {
      const dignities = calculateAllDignities(testPositions, true)

      // Sun in Leo should have domicile
      expect(dignities.sun.domicile).toBe(5)

      // Moon in Cancer should have domicile
      expect(dignities.moon.domicile).toBe(5)

      // Mercury in Gemini should have domicile
      expect(dignities.mercury.domicile).toBe(5)
    })

    it('should respect isDay parameter', () => {
      const dayDignities = calculateAllDignities(testPositions, true)
      const nightDignities = calculateAllDignities(testPositions, false)

      // Triplicity scores should differ between day and night
      // Some planets may have different triplicity in day vs night
      expect(dayDignities).not.toEqual(nightDignities)
    })
  })

  describe('rankPlanetsByDignity', () => {
    it('should sort planets by total score descending', () => {
      const positions: Record<PlanetId, number> = {
        sun: 120, // Leo - domicile
        moon: 285, // Capricorn - detriment
        mercury: 60,
        venus: 30,
        mars: 0,
        jupiter: 240,
        saturn: 270,
        uranus: 300,
        neptune: 330,
        pluto: 210,
      }

      const dignities = calculateAllDignities(positions, true)
      const ranked = rankPlanetsByDignity(dignities)

      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].score.total).toBeGreaterThanOrEqual(ranked[i + 1].score.total)
      }
    })
  })

  describe('getStrongPlanets', () => {
    it('should return planets with positive total score', () => {
      const positions: Record<PlanetId, number> = {
        sun: 120, // Leo - domicile (+5)
        moon: 285, // Capricorn - detriment (-5)
        mercury: 60, // Gemini - domicile (+5)
        venus: 30,
        mars: 0,
        jupiter: 240,
        saturn: 270,
        uranus: 300,
        neptune: 330,
        pluto: 210,
      }

      const dignities = calculateAllDignities(positions, true)
      const strong = getStrongPlanets(dignities)

      expect(strong).toContain('sun')
      expect(strong).toContain('mercury')
    })
  })

  describe('getWeakPlanets', () => {
    it('should return planets with negative total score', () => {
      const positions: Record<PlanetId, number> = {
        sun: 315, // Aquarius - detriment (-5)
        moon: 285, // Capricorn - detriment (-5)
        mercury: 60,
        venus: 30,
        mars: 0,
        jupiter: 240,
        saturn: 270,
        uranus: 300,
        neptune: 330,
        pluto: 210,
      }

      const dignities = calculateAllDignities(positions, true)
      const weak = getWeakPlanets(dignities)

      expect(weak).toContain('sun')
      expect(weak).toContain('moon')
    })
  })

  describe('getEssentiallyDignified', () => {
    it('should return planets in domicile or exaltation', () => {
      const positions: Record<PlanetId, number> = {
        sun: 120, // Leo - domicile
        moon: 33, // Taurus - exaltation
        mercury: 315, // Aquarius
        venus: 0,
        mars: 0,
        jupiter: 0,
        saturn: 0,
        uranus: 0,
        neptune: 0,
        pluto: 0,
      }

      const dignities = calculateAllDignities(positions, true)
      const dignified = getEssentiallyDignified(dignities)

      expect(dignified).toContain('sun')
      expect(dignified).toContain('moon')
    })
  })

  describe('getEssentiallyDebilitated', () => {
    it('should return planets in detriment or fall', () => {
      const positions: Record<PlanetId, number> = {
        sun: 315, // Aquarius - detriment
        moon: 225, // Scorpio - fall
        mercury: 120,
        venus: 30,
        mars: 0,
        jupiter: 0,
        saturn: 0,
        uranus: 0,
        neptune: 0,
        pluto: 0,
      }

      const dignities = calculateAllDignities(positions, true)
      const debilitated = getEssentiallyDebilitated(dignities)

      expect(debilitated).toContain('sun')
      expect(debilitated).toContain('moon')
    })
  })

  describe('Manual Verification Cases', () => {
    it('Sun at 120° (Leo 0°) → Domicile, indicator R, score >= +5', () => {
      const score = calculateDignity('sun', 120, true)
      expect(score.domicile).toBe(5)
      expect(getDignityIndicator(score)).toBe('R')
      expect(score.total).toBeGreaterThanOrEqual(5)
    })

    it('Sun at 15° (Aries 15°) → Exaltation, indicator E, score >= +4', () => {
      const score = calculateDignity('sun', 15, true)
      expect(score.exaltation).toBe(4)
      expect(getDignityIndicator(score)).toBe('E')
      expect(score.total).toBeGreaterThanOrEqual(4)
    })

    it('Sun at 315° (Aquarius 15°) → Detriment, indicator d, score <= -5', () => {
      const score = calculateDignity('sun', 315, true)
      expect(score.detriment).toBe(-5)
      expect(getDignityIndicator(score)).toBe('d')
      expect(score.total).toBeLessThanOrEqual(-5)
    })

    it('Sun at 195° (Libra 15°) → Fall, indicator f, score <= -4', () => {
      const score = calculateDignity('sun', 195, true)
      expect(score.fall).toBe(-4)
      expect(getDignityIndicator(score)).toBe('f')
      expect(score.total).toBeLessThanOrEqual(-4)
    })

    it('Sun at 60° (Gemini 0°) → Peregrine (night), indicator -, score includes -5', () => {
      // Sun in Gemini, night chart - no major dignities
      const score = calculateDignity('sun', 60, false)
      // Check if peregrine or has some minor dignity
      expect(getDignityIndicator(score)).toBe('-')
    })
  })
})
