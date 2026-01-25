import { describe, expect, it } from 'vitest'
import {
  calculateParanLatitudes,
  calculateZenithLatitudes,
  findHighScoringBands,
  findOptimalLatitudeInRange,
  generateSearchBands,
  scoreLatitude,
} from '../search'
import { DECLINATION_SIGMA, DEFAULT_DECLINATION_ORB } from '../../core/constants'
import type {
  EquatorialCoordinates,
  PlanetDeclinations,
  PlanetId,
  PlanetWeights,
} from '../../core/types'

describe('Geospatial Scoring Engine', () => {
  // Test data
  const TEST_DECLINATIONS: PlanetDeclinations = {
    sun: 20.0,
    moon: 18.5,
    mercury: 10.0,
    venus: 5.0,
    mars: -10.0,
    jupiter: -15.0,
    saturn: 2.5,
    uranus: -5.0,
    neptune: 8.0,
    pluto: -8.0,
  }

  const EQUAL_WEIGHTS: PlanetWeights = {
    sun: 1,
    moon: 1,
    mercury: 1,
    venus: 1,
    mars: 1,
    jupiter: 1,
    saturn: 1,
    uranus: 1,
    neptune: 1,
    pluto: 1,
  }

  const VARIED_WEIGHTS: PlanetWeights = {
    sun: 5,
    moon: 4,
    mercury: 2,
    venus: 3,
    mars: 3,
    jupiter: 4,
    saturn: 3,
    uranus: 2,
    neptune: 2,
    pluto: 1,
  }

  const TEST_POSITIONS: Record<PlanetId, EquatorialCoordinates> = {
    sun: { ra: 0, dec: 20.0 },
    moon: { ra: 45, dec: 18.5 },
    mercury: { ra: 10, dec: 10.0 },
    venus: { ra: 20, dec: 5.0 },
    mars: { ra: 90, dec: -10.0 },
    jupiter: { ra: 180, dec: -15.0 },
    saturn: { ra: 270, dec: 2.5 },
    uranus: { ra: 300, dec: -5.0 },
    neptune: { ra: 330, dec: 8.0 },
    pluto: { ra: 350, dec: -8.0 },
  }

  describe('Latitude Scoring (scoreLatitude)', () => {
    it('should score higher near zenith lines', () => {
      const scoreAtSunZenith = scoreLatitude(20.0, TEST_DECLINATIONS, EQUAL_WEIGHTS)
      const scoreAtEmptyLatitude = scoreLatitude(50.0, TEST_DECLINATIONS, EQUAL_WEIGHTS)

      // At Sun's zenith (20°), should score higher than at 50° (far from all planets)
      expect(scoreAtSunZenith.score).toBeGreaterThan(scoreAtEmptyLatitude.score)
    })

    it('should have Gaussian distance falloff', () => {
      // Score at Sun's exact zenith
      const score0 = scoreLatitude(20.0, TEST_DECLINATIONS, EQUAL_WEIGHTS, DECLINATION_SIGMA)

      // Score 3° away (1 sigma)
      const score3 = scoreLatitude(23.0, TEST_DECLINATIONS, EQUAL_WEIGHTS, DECLINATION_SIGMA)

      // Score 6° away (2 sigma)
      const score6 = scoreLatitude(26.0, TEST_DECLINATIONS, EQUAL_WEIGHTS, DECLINATION_SIGMA)

      // Gaussian falloff: score should decrease with distance
      expect(score0.score).toBeGreaterThan(score3.score)
      expect(score3.score).toBeGreaterThan(score6.score)
    })

    it('should combine contributions from all planets', () => {
      const result = scoreLatitude(0.0, TEST_DECLINATIONS, EQUAL_WEIGHTS)

      // Should have contributions from all 10 planets
      expect(result.contributions).toHaveLength(10)

      // All contributions should be positive
      for (const contrib of result.contributions) {
        expect(contrib.contribution).toBeGreaterThan(0)
      }
    })

    it('should sort contributions by magnitude', () => {
      const result = scoreLatitude(10.0, TEST_DECLINATIONS, EQUAL_WEIGHTS)

      // Contributions should be sorted descending
      for (let i = 0; i < result.contributions.length - 1; i++) {
        expect(result.contributions[i].contribution).toBeGreaterThanOrEqual(
          result.contributions[i + 1].contribution,
        )
      }

      // Mercury (dec=10) should be dominant at lat=10
      expect(result.contributions[0].planet).toBe('mercury')
      expect(result.contributions[0].distance).toBe(0)
    })

    it('should apply planet weights correctly', () => {
      const equalResult = scoreLatitude(20.0, TEST_DECLINATIONS, EQUAL_WEIGHTS)
      const variedResult = scoreLatitude(20.0, TEST_DECLINATIONS, VARIED_WEIGHTS)

      // Varied weights (Sun=5) should produce higher score than equal weights (Sun=1)
      expect(variedResult.score).toBeGreaterThan(equalResult.score)
    })

    it('should ignore planets with zero weight', () => {
      const zeroWeights: PlanetWeights = {
        sun: 5,
        moon: 0,
        mercury: 0,
        venus: 0,
        mars: 0,
        jupiter: 0,
        saturn: 0,
        uranus: 0,
        neptune: 0,
        pluto: 0,
      }

      const result = scoreLatitude(20.0, TEST_DECLINATIONS, zeroWeights)

      // Only Sun should contribute
      expect(result.contributions).toHaveLength(1)
      expect(result.contributions[0].planet).toBe('sun')
    })

    it('should handle custom sigma values', () => {
      // Smaller sigma = steeper falloff
      const smallSigma = scoreLatitude(20.0, TEST_DECLINATIONS, EQUAL_WEIGHTS, 1.0)

      // Larger sigma = gentler falloff
      const largeSigma = scoreLatitude(20.0, TEST_DECLINATIONS, EQUAL_WEIGHTS, 10.0)

      // Both should have same max contribution at exact zenith
      // But large sigma will have higher contributions from distant planets
      expect(largeSigma.score).toBeGreaterThanOrEqual(smallSigma.score)
    })
  })

  describe('Zenith Latitude Calculation', () => {
    it('should create targets for all weighted planets', () => {
      const targets = calculateZenithLatitudes(TEST_DECLINATIONS, EQUAL_WEIGHTS, 1.0)

      // All 10 planets should create targets
      expect(targets.length).toBeGreaterThanOrEqual(10)

      // Each planet's declination should appear as a target
      const latitudes = targets.map((t) => t.latitude)
      expect(latitudes).toContain(20.0) // Sun
      expect(latitudes).toContain(10.0) // Mercury
    })

    it('should sort targets by score', () => {
      const targets = calculateZenithLatitudes(TEST_DECLINATIONS, VARIED_WEIGHTS, 1.0)

      // Should be sorted descending by score
      for (let i = 0; i < targets.length - 1; i++) {
        expect(targets[i].score).toBeGreaterThanOrEqual(targets[i + 1].score)
      }

      // Sun (weight=5) should be first
      expect(targets[0].sources[0].planets).toContain('sun')
    })

    it('should detect overlaps when declinations are close', () => {
      const closeDeclinations: PlanetDeclinations = {
        sun: 20.0,
        moon: 20.3, // Within 1° orb of Sun
        mercury: 10.0,
        venus: 5.0,
        mars: -10.0,
        jupiter: -15.0,
        saturn: 2.5,
        uranus: -5.0,
        neptune: 8.0,
        pluto: -8.0,
      }

      const targets = calculateZenithLatitudes(closeDeclinations, EQUAL_WEIGHTS, 1.0)

      // Should have overlap sources
      const hasOverlap = targets.some((t) => t.sources.some((s) => s.type === 'overlap'))
      expect(hasOverlap).toBe(true)
    })

    it('should ignore planets with zero weight', () => {
      const zeroWeights: PlanetWeights = {
        sun: 5,
        moon: 0,
        mercury: 3,
        venus: 0,
        mars: 2,
        jupiter: 0,
        saturn: 1,
        uranus: 0,
        neptune: 0,
        pluto: 0,
      }

      const targets = calculateZenithLatitudes(TEST_DECLINATIONS, zeroWeights, 1.0)

      // Only weighted planets should appear
      for (const target of targets) {
        for (const source of target.sources) {
          for (const planet of source.planets) {
            expect(zeroWeights[planet]).toBeGreaterThan(0)
          }
        }
      }
    })
  })

  describe('Paran Latitude Calculation', () => {
    it('should create targets from paran points', () => {
      const targets = calculateParanLatitudes(TEST_POSITIONS, EQUAL_WEIGHTS)

      // Should find some paran points
      expect(targets.length).toBeGreaterThan(0)

      // All should be paran-type sources
      for (const target of targets) {
        expect(target.sources[0].type).toBe('paran')
      }
    })

    it('should group parans by latitude bands', () => {
      const targets = calculateParanLatitudes(TEST_POSITIONS, EQUAL_WEIGHTS)

      // Latitudes should be rounded to 2° bands
      for (const target of targets) {
        expect(target.latitude % 2).toBe(0)
      }
    })

    it('should calculate scores based on planet weights', () => {
      const equalTargets = calculateParanLatitudes(TEST_POSITIONS, EQUAL_WEIGHTS)
      const variedTargets = calculateParanLatitudes(TEST_POSITIONS, VARIED_WEIGHTS)

      // Varied weights should generally produce different scores
      const equalScores = equalTargets.map((t) => t.score).reduce((a, b) => a + b, 0)
      const variedScores = variedTargets.map((t) => t.score).reduce((a, b) => a + b, 0)

      expect(variedScores).not.toBe(equalScores)
    })

    it('should be sorted by score', () => {
      const targets = calculateParanLatitudes(TEST_POSITIONS, VARIED_WEIGHTS)

      for (let i = 0; i < targets.length - 1; i++) {
        expect(targets[i].score).toBeGreaterThanOrEqual(targets[i + 1].score)
      }
    })
  })

  describe('Golden Section Optimization', () => {
    it('should find maximum score within range', () => {
      // Search around Sun's zenith (20°)
      const result = findOptimalLatitudeInRange(15, 25, TEST_DECLINATIONS, EQUAL_WEIGHTS)

      // Should find latitude near Sun's declination (20°)
      expect(result.latitude).toBeCloseTo(20.0, 0)
    })

    it('should return optimal latitude and score', () => {
      const result = findOptimalLatitudeInRange(0, 30, TEST_DECLINATIONS, VARIED_WEIGHTS)

      expect(result.latitude).toBeDefined()
      expect(result.score).toBeGreaterThan(0)

      // Score at returned latitude should be near maximum
      const verifyScore = scoreLatitude(result.latitude, TEST_DECLINATIONS, VARIED_WEIGHTS).score
      expect(Math.abs(verifyScore - result.score)).toBeLessThan(0.01)
    })

    it('should converge to global maximum in range', () => {
      // Search full range
      const result = findOptimalLatitudeInRange(-70, 70, TEST_DECLINATIONS, VARIED_WEIGHTS)

      // Should find the highest-weighted planet's zenith
      // Sun (weight=5, dec=20) should be dominant
      expect(result.latitude).toBeCloseTo(20.0, 0)
    })

    it('should handle narrow ranges', () => {
      const result = findOptimalLatitudeInRange(19.5, 20.5, TEST_DECLINATIONS, EQUAL_WEIGHTS)

      // Should find Sun's exact zenith
      expect(result.latitude).toBeCloseTo(20.0, 0)
    })

    it('should handle range with no clear maximum', () => {
      // Range far from any planet declinations
      const result = findOptimalLatitudeInRange(-80, -70, TEST_DECLINATIONS, EQUAL_WEIGHTS)

      expect(result.latitude).toBeGreaterThanOrEqual(-80)
      expect(result.latitude).toBeLessThanOrEqual(-70)
      expect(result.score).toBeGreaterThan(0)
    })
  })

  describe('High-Scoring Band Detection', () => {
    it('should find continuous high-scoring bands', () => {
      const bands = findHighScoringBands(TEST_DECLINATIONS, EQUAL_WEIGHTS, 0.5, 1.0)

      expect(bands.length).toBeGreaterThan(0)

      // Each band should have valid latitude range
      for (const band of bands) {
        expect(band.maxLat).toBeGreaterThan(band.minLat)
        expect(band.avgScore).toBeGreaterThan(0)
      }
    })

    it('should find bands near planet declinations', () => {
      const bands = findHighScoringBands(TEST_DECLINATIONS, VARIED_WEIGHTS, 0.6, 0.5)

      // Should find bands near Sun (20°), Moon (18.5°), etc.
      const bandRanges = bands.map((b) => ({ min: b.minLat, max: b.maxLat }))

      // At least one band should contain Sun's declination
      const containsSun = bandRanges.some((r) => r.min <= 20.0 && r.max >= 20.0)
      expect(containsSun).toBe(true)
    })

    it('should respect threshold parameter', () => {
      const lowThreshold = findHighScoringBands(TEST_DECLINATIONS, EQUAL_WEIGHTS, 0.3, 1.0)
      const highThreshold = findHighScoringBands(TEST_DECLINATIONS, EQUAL_WEIGHTS, 0.7, 1.0)

      // Lower threshold should find more bands
      expect(lowThreshold.length).toBeGreaterThanOrEqual(highThreshold.length)
    })

    it('should calculate average scores correctly', () => {
      const bands = findHighScoringBands(TEST_DECLINATIONS, EQUAL_WEIGHTS, 0.5, 0.5)

      for (const band of bands) {
        // Average score should be positive
        expect(band.avgScore).toBeGreaterThan(0)

        // Average should be reasonable (not greater than sum of all weights)
        expect(band.avgScore).toBeLessThan(20)
      }
    })

    it('should respect step size parameter', () => {
      const fineStep = findHighScoringBands(TEST_DECLINATIONS, EQUAL_WEIGHTS, 0.5, 0.5)
      const coarseStep = findHighScoringBands(TEST_DECLINATIONS, EQUAL_WEIGHTS, 0.5, 2.0)

      // Both should find bands, but resolution may differ
      expect(fineStep.length).toBeGreaterThan(0)
      expect(coarseStep.length).toBeGreaterThan(0)
    })
  })

  describe('Combined Search Bands', () => {
    it('should combine zenith and paran data', () => {
      const result = generateSearchBands(TEST_DECLINATIONS, TEST_POSITIONS, EQUAL_WEIGHTS, 3)

      expect(result.bands).toBeDefined()
      expect(result.paranLatitudes).toBeDefined()
      expect(result.optimalLatitudes).toBeDefined()
    })

    it('should identify dominant planets', () => {
      const result = generateSearchBands(TEST_DECLINATIONS, TEST_POSITIONS, VARIED_WEIGHTS, 3)

      for (const band of result.bands) {
        expect(band.dominantPlanets.length).toBeGreaterThan(0)
        expect(band.score).toBeGreaterThan(0)
      }
    })

    it('should separate zenith and paran planets', () => {
      const result = generateSearchBands(TEST_DECLINATIONS, TEST_POSITIONS, EQUAL_WEIGHTS, 3)

      for (const band of result.bands) {
        // zenithPlanets should be a subset of dominantPlanets
        for (const planet of band.zenithPlanets) {
          expect(band.dominantPlanets).toContain(planet)
        }
      }
    })

    it('should return top optimal latitudes', () => {
      const result = generateSearchBands(TEST_DECLINATIONS, TEST_POSITIONS, VARIED_WEIGHTS, 3)

      // Should return up to 10 optimal latitudes
      expect(result.optimalLatitudes.length).toBeLessThanOrEqual(10)
      expect(result.optimalLatitudes.length).toBeGreaterThan(0)

      // Should include high-weighted planet declinations
      expect(result.optimalLatitudes).toContain(20.0) // Sun
    })

    it('should group paran latitudes', () => {
      const result = generateSearchBands(TEST_DECLINATIONS, TEST_POSITIONS, EQUAL_WEIGHTS, 3)

      for (const paranLat of result.paranLatitudes) {
        expect(paranLat.latitude).toBeDefined()
        expect(paranLat.parans.length).toBeGreaterThan(0)
      }
    })

    it('should respect tolerance parameter', () => {
      const narrow = generateSearchBands(TEST_DECLINATIONS, TEST_POSITIONS, EQUAL_WEIGHTS, 1)
      const wide = generateSearchBands(TEST_DECLINATIONS, TEST_POSITIONS, EQUAL_WEIGHTS, 5)

      // Wider tolerance may merge more targets into fewer bands
      expect(wide.bands.length).toBeLessThanOrEqual(narrow.bands.length * 2)
    })

    it('should avoid duplicate bands', () => {
      const result = generateSearchBands(TEST_DECLINATIONS, TEST_POSITIONS, EQUAL_WEIGHTS, 3)

      const latitudes = result.bands.map((b) => (b.minLat + b.maxLat) / 2)

      // No two bands should be at very similar latitudes (within 5°)
      for (let i = 0; i < latitudes.length; i++) {
        for (let j = i + 1; j < latitudes.length; j++) {
          expect(Math.abs(latitudes[i] - latitudes[j])).toBeGreaterThan(4)
        }
      }
    })

    it('should sort bands by score', () => {
      const result = generateSearchBands(TEST_DECLINATIONS, TEST_POSITIONS, VARIED_WEIGHTS, 3)

      // Bands should be sorted by score descending
      for (let i = 0; i < result.bands.length - 1; i++) {
        expect(result.bands[i].score).toBeGreaterThanOrEqual(result.bands[i + 1].score)
      }
    })
  })
})
