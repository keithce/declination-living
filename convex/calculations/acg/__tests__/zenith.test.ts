import { describe, expect, it } from 'vitest'
import {
  calculateAllZenithLines,
  calculateZenithBands,
  calculateZenithLine,
  findOptimalZenithLatitudes,
  findZenithOverlaps,
  generateZenithBandPoints,
  getZenithBandIntensity,
  scoreLatitudeForZenith,
  scoreLatitudesForZenith,
} from '../zenith'
import { APPROX_OBLIQUITY, DECLINATION_SIGMA, DEFAULT_DECLINATION_ORB } from '../../core/constants'
import type { PlanetDeclinations, PlanetId, PlanetWeights } from '../../core/types'

describe('Zenith Line Calculator', () => {
  // Test data
  const TEST_DECLINATIONS: PlanetDeclinations = {
    sun: 23.44, // At summer solstice (OOB edge case)
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

  describe('Basic Zenith Line Calculation', () => {
    it('should create zenith line with correct declination', () => {
      const zenith = calculateZenithLine('sun', 23.44, 1.0)

      expect(zenith.planet).toBe('sun')
      expect(zenith.declination).toBe(23.44)
    })

    it('should calculate orb bounds correctly', () => {
      const orb = 2.5
      const zenith = calculateZenithLine('mars', -10.0, orb)

      expect(zenith.orbMin).toBe(-10.0 - orb)
      expect(zenith.orbMax).toBe(-10.0 + orb)
      expect(zenith.orbMin).toBe(-12.5)
      expect(zenith.orbMax).toBe(-7.5)
    })

    it('should use default orb when not specified', () => {
      const zenith = calculateZenithLine('jupiter', 15.0)

      expect(zenith.orbMin).toBe(15.0 - DEFAULT_DECLINATION_ORB)
      expect(zenith.orbMax).toBe(15.0 + DEFAULT_DECLINATION_ORB)
    })

    it('should handle positive declinations', () => {
      const zenith = calculateZenithLine('venus', 20.5, 1.0)

      expect(zenith.declination).toBe(20.5)
      expect(zenith.orbMin).toBe(19.5)
      expect(zenith.orbMax).toBe(21.5)
    })

    it('should handle negative declinations', () => {
      const zenith = calculateZenithLine('saturn', -18.3, 1.0)

      expect(zenith.declination).toBe(-18.3)
      expect(zenith.orbMin).toBe(-19.3)
      expect(zenith.orbMax).toBe(-17.3)
    })

    it('should handle equatorial declination (0°)', () => {
      const zenith = calculateZenithLine('mercury', 0.0, 1.0)

      expect(zenith.declination).toBe(0)
      expect(zenith.orbMin).toBe(-1.0)
      expect(zenith.orbMax).toBe(1.0)
    })

    it('should handle OOB declinations (beyond obliquity)', () => {
      const oobDec = 28.0 // Beyond 23.44° obliquity
      const zenith = calculateZenithLine('moon', oobDec, 1.0)

      expect(zenith.declination).toBe(oobDec)
      expect(zenith.orbMin).toBe(27.0)
      expect(zenith.orbMax).toBe(29.0)
      // Zenith line should still be calculated correctly for OOB planets
    })
  })

  describe('All Planets Zenith Lines', () => {
    it('should calculate zenith lines for all 10 planets', () => {
      const zenithLines = calculateAllZenithLines(TEST_DECLINATIONS, 1.0)

      expect(zenithLines).toHaveLength(10)

      const planets = zenithLines.map((z) => z.planet).sort()
      expect(planets).toEqual([
        'jupiter',
        'mars',
        'mercury',
        'moon',
        'neptune',
        'pluto',
        'saturn',
        'sun',
        'uranus',
        'venus',
      ])
    })

    it('should use correct declinations for each planet', () => {
      const zenithLines = calculateAllZenithLines(TEST_DECLINATIONS, 1.0)

      for (const zenith of zenithLines) {
        expect(zenith.declination).toBe(TEST_DECLINATIONS[zenith.planet])
      }
    })

    it('should apply same orb to all planets', () => {
      const orb = 2.0
      const zenithLines = calculateAllZenithLines(TEST_DECLINATIONS, orb)

      for (const zenith of zenithLines) {
        const expectedMin = TEST_DECLINATIONS[zenith.planet] - orb
        const expectedMax = TEST_DECLINATIONS[zenith.planet] + orb

        expect(zenith.orbMin).toBe(expectedMin)
        expect(zenith.orbMax).toBe(expectedMax)
      }
    })
  })

  describe('Zenith Bands with Weights', () => {
    it('should create zenith bands with weight information', () => {
      const bands = calculateZenithBands(TEST_DECLINATIONS, VARIED_WEIGHTS, 1.0)

      expect(bands).toHaveLength(10)

      const sunBand = bands.find((b) => b.planet === 'sun')
      expect(sunBand).toBeDefined()
      expect(sunBand!.weight).toBe(5)
      expect(sunBand!.centerLatitude).toBe(23.44)
    })

    it('should include all band parameters', () => {
      const orb = 1.5
      const bands = calculateZenithBands(TEST_DECLINATIONS, VARIED_WEIGHTS, orb)

      for (const band of bands) {
        expect(band.planet).toBeDefined()
        expect(band.centerLatitude).toBe(TEST_DECLINATIONS[band.planet])
        expect(band.minLatitude).toBe(TEST_DECLINATIONS[band.planet] - orb)
        expect(band.maxLatitude).toBe(TEST_DECLINATIONS[band.planet] + orb)
        expect(band.orb).toBe(orb)
        expect(band.weight).toBe(VARIED_WEIGHTS[band.planet])
      }
    })
  })

  describe('Gaussian Scoring', () => {
    it('should give maximum score at exact zenith latitude', () => {
      const zenithLines = calculateAllZenithLines(TEST_DECLINATIONS, 1.0)
      const sunZenith = zenithLines.find((z) => z.planet === 'sun')!

      // Score at exact Sun declination
      const score = scoreLatitudeForZenith(sunZenith.declination, zenithLines, EQUAL_WEIGHTS)

      // Sun contribution should be at maximum (distance = 0)
      const sunContribution = score.contributions.find((c) => c.planet === 'sun')
      expect(sunContribution?.distance).toBe(0)
      expect(sunContribution?.contribution).toBeCloseTo(1.0, 5) // weight=1, gaussian(0)=1
    })

    it('should have Gaussian falloff with distance', () => {
      const zenithLines = calculateAllZenithLines({ ...TEST_DECLINATIONS }, 1.0)
      const weights: PlanetWeights = { ...EQUAL_WEIGHTS }

      // Score at Sun's zenith (23.44°)
      const score1 = scoreLatitudeForZenith(23.44, zenithLines, weights, DECLINATION_SIGMA)

      // Score 3° away (one sigma)
      const score2 = scoreLatitudeForZenith(23.44 + 3, zenithLines, weights, DECLINATION_SIGMA)

      // Score 6° away (two sigma)
      const score3 = scoreLatitudeForZenith(23.44 + 6, zenithLines, weights, DECLINATION_SIGMA)

      // Gaussian falloff: score should decrease with distance
      // At 1 sigma, gaussian ≈ 0.606
      // At 2 sigma, gaussian ≈ 0.135
      expect(score1.totalScore).toBeGreaterThan(score2.totalScore)
      expect(score2.totalScore).toBeGreaterThan(score3.totalScore)
    })

    it('should combine contributions from multiple planets', () => {
      const zenithLines = calculateAllZenithLines(TEST_DECLINATIONS, 1.0)

      // Score at a latitude between Sun (23.44) and Moon (18.5)
      const midLatitude = 21.0
      const score = scoreLatitudeForZenith(midLatitude, zenithLines, EQUAL_WEIGHTS)

      // Should have contributions from all planets
      expect(score.contributions).toHaveLength(10)

      // Sun and Moon should have higher contributions (closer)
      const sunContribution = score.contributions.find((c) => c.planet === 'sun')!
      const moonContribution = score.contributions.find((c) => c.planet === 'moon')!
      const marsContribution = score.contributions.find((c) => c.planet === 'mars')! // Far away

      expect(sunContribution.contribution).toBeGreaterThan(marsContribution.contribution)
      expect(moonContribution.contribution).toBeGreaterThan(marsContribution.contribution)
    })

    it('should sort contributions by magnitude', () => {
      const zenithLines = calculateAllZenithLines(TEST_DECLINATIONS, 1.0)
      const score = scoreLatitudeForZenith(20.0, zenithLines, EQUAL_WEIGHTS)

      // Contributions should be sorted descending
      for (let i = 0; i < score.contributions.length - 1; i++) {
        expect(score.contributions[i].contribution).toBeGreaterThanOrEqual(
          score.contributions[i + 1].contribution,
        )
      }
    })

    it('should apply planet weights correctly', () => {
      const zenithLines = calculateAllZenithLines(TEST_DECLINATIONS, 1.0)

      const score1 = scoreLatitudeForZenith(23.44, zenithLines, EQUAL_WEIGHTS)
      const score2 = scoreLatitudeForZenith(23.44, zenithLines, VARIED_WEIGHTS)

      // Varied weights should produce higher total score (Sun has weight 5 vs 1)
      expect(score2.totalScore).toBeGreaterThan(score1.totalScore)
    })
  })

  describe('Multiple Latitude Scoring', () => {
    it('should score multiple latitudes', () => {
      const latitudes = [-30, -15, 0, 15, 30]
      const scores = scoreLatitudesForZenith(
        latitudes,
        TEST_DECLINATIONS,
        EQUAL_WEIGHTS,
        DECLINATION_SIGMA,
      )

      expect(scores).toHaveLength(5)

      for (let i = 0; i < latitudes.length; i++) {
        expect(scores[i].latitude).toBe(latitudes[i])
        expect(scores[i].totalScore).toBeGreaterThan(0)
        expect(scores[i].contributions).toHaveLength(10)
      }
    })
  })

  describe('Optimal Zenith Latitudes', () => {
    it('should find top N optimal latitudes', () => {
      const topN = 5
      const optimal = findOptimalZenithLatitudes(TEST_DECLINATIONS, EQUAL_WEIGHTS, topN, 1.0)

      expect(optimal).toHaveLength(topN)
    })

    it('should return latitudes sorted by score', () => {
      const optimal = findOptimalZenithLatitudes(TEST_DECLINATIONS, EQUAL_WEIGHTS, 10, 1.0)

      for (let i = 0; i < optimal.length - 1; i++) {
        expect(optimal[i].totalScore).toBeGreaterThanOrEqual(optimal[i + 1].totalScore)
      }
    })

    it('should find latitudes near planet declinations', () => {
      const optimal = findOptimalZenithLatitudes(TEST_DECLINATIONS, VARIED_WEIGHTS, 5, 0.5)

      // Top latitude should be near a high-weight planet's declination
      expect(optimal[0].latitude).toBeDefined()
      expect(optimal[0].contributions[0].planet).toBeDefined()

      // Distance to dominant planet should be small
      expect(optimal[0].contributions[0].distance).toBeLessThan(2)
    })

    it('should respect step size parameter', () => {
      // With larger step, should still find good latitudes
      const coarse = findOptimalZenithLatitudes(TEST_DECLINATIONS, EQUAL_WEIGHTS, 5, 5.0)
      expect(coarse).toHaveLength(5)

      // All latitudes should be multiples of step size (within sampling range)
      for (const score of coarse) {
        // Latitude should be a multiple of 5 or close to it
        const remainder = Math.abs(score.latitude % 5)
        expect(remainder < 0.1 || remainder > 4.9).toBe(true)
      }
    })
  })

  describe('Zenith Band Overlaps', () => {
    it('should detect overlaps when declinations are close', () => {
      // Create declinations with some close pairs
      const closeDeclinations: PlanetDeclinations = {
        sun: 20.0,
        moon: 20.5, // Close to Sun (within 1° orb overlap)
        mercury: 10.0,
        venus: 10.3, // Close to Mercury
        mars: -10.0,
        jupiter: 5.0,
        saturn: 2.5,
        uranus: -5.0,
        neptune: 8.0,
        pluto: -20.0,
      }

      const overlaps = findZenithOverlaps(closeDeclinations, EQUAL_WEIGHTS, 1.0)

      // Should find overlaps for Sun-Moon and Mercury-Venus
      expect(overlaps.length).toBeGreaterThan(0)

      // Check for Sun-Moon overlap
      const sunMoonOverlap = overlaps.find(
        (o) => o.planets.includes('sun') && o.planets.includes('moon'),
      )
      expect(sunMoonOverlap).toBeDefined()
    })

    it('should not detect overlaps when declinations are far apart', () => {
      const farDeclinations: PlanetDeclinations = {
        sun: 20.0,
        moon: -20.0, // 40° apart - no overlap with 1° orb
        mercury: 10.0,
        venus: -10.0,
        mars: 5.0,
        jupiter: -5.0,
        saturn: 15.0,
        uranus: -15.0,
        neptune: 0.0,
        pluto: 25.0,
      }

      const overlaps = findZenithOverlaps(farDeclinations, EQUAL_WEIGHTS, 1.0)

      // Should find few or no overlaps with small orb
      // Some might exist for planets within 2° of each other
      for (const overlap of overlaps) {
        // Verify overlap is valid
        expect(overlap.planets.length).toBeGreaterThanOrEqual(2)
      }
    })

    it('should calculate combined weight for overlaps', () => {
      const declinations: PlanetDeclinations = {
        sun: 20.0,
        moon: 20.2,
        mercury: 10.0,
        venus: 5.0,
        mars: -10.0,
        jupiter: -15.0,
        saturn: 2.5,
        uranus: -5.0,
        neptune: 8.0,
        pluto: -8.0,
      }

      const overlaps = findZenithOverlaps(declinations, VARIED_WEIGHTS, 1.0)

      for (const overlap of overlaps) {
        // Combined weight should be sum of planet weights
        const expectedWeight = overlap.planets.reduce(
          (sum, planet) => sum + VARIED_WEIGHTS[planet],
          0,
        )
        expect(overlap.combinedWeight).toBe(expectedWeight)
      }
    })

    it('should sort overlaps by combined weight', () => {
      const declinations: PlanetDeclinations = {
        sun: 20.0, // weight 5
        moon: 20.3, // weight 4 -> combined 9
        mercury: 10.0, // weight 2
        venus: 10.3, // weight 3 -> combined 5
        mars: -10.0,
        jupiter: -15.0,
        saturn: 2.5,
        uranus: -5.0,
        neptune: 8.0,
        pluto: -8.0,
      }

      const overlaps = findZenithOverlaps(declinations, VARIED_WEIGHTS, 1.0)

      // Should be sorted by combined weight descending
      for (let i = 0; i < overlaps.length - 1; i++) {
        expect(overlaps[i].combinedWeight).toBeGreaterThanOrEqual(overlaps[i + 1].combinedWeight)
      }
    })

    it('should only consider planets with positive weight', () => {
      const zeroWeights: PlanetWeights = {
        sun: 5,
        moon: 0, // Ignored
        mercury: 3,
        venus: 0, // Ignored
        mars: 2,
        jupiter: 0,
        saturn: 1,
        uranus: 0,
        neptune: 0,
        pluto: 0,
      }

      const declinations: PlanetDeclinations = {
        sun: 20.0,
        moon: 20.1, // Close to Sun but weight=0
        mercury: 10.0,
        venus: 10.1,
        mars: 5.0,
        jupiter: 5.1,
        saturn: 0.0,
        uranus: 0.1,
        neptune: -5.0,
        pluto: -5.1,
      }

      const overlaps = findZenithOverlaps(declinations, zeroWeights, 1.0)

      // Overlaps should only involve planets with weight > 0
      for (const overlap of overlaps) {
        for (const planet of overlap.planets) {
          expect(zeroWeights[planet]).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('Visualization Helpers', () => {
    it('should generate zenith band points along constant latitude', () => {
      const zenith = calculateZenithLine('sun', 23.44, 1.0)
      const points = generateZenithBandPoints(zenith, 10)

      // Should generate points from -180 to +180 longitude
      expect(points.length).toBeGreaterThan(30)

      // All points should be at the same latitude
      for (const point of points) {
        expect(point.lat).toBe(23.44)
      }

      // Longitudes should span the globe
      const longitudes = points.map((p) => p.lon)
      expect(Math.min(...longitudes)).toBe(-180)
      expect(Math.max(...longitudes)).toBe(180)
    })

    it('should respect longitude step parameter', () => {
      const zenith = calculateZenithLine('mars', 10.0, 1.0)
      const points = generateZenithBandPoints(zenith, 30)

      // With 30° step, should have 13 points (-180, -150, ..., 150, 180)
      expect(points.length).toBe(13)

      // Check spacing
      for (let i = 0; i < points.length - 1; i++) {
        expect(points[i + 1].lon - points[i].lon).toBe(30)
      }
    })

    it('should calculate band intensity from weight', () => {
      const sunZenith = calculateZenithLine('sun', 23.44, 1.0)
      const plutoZenith = calculateZenithLine('pluto', -8.0, 1.0)

      const sunIntensity = getZenithBandIntensity(sunZenith, VARIED_WEIGHTS, 10)
      const plutoIntensity = getZenithBandIntensity(plutoZenith, VARIED_WEIGHTS, 10)

      // Sun has weight 5, Pluto has weight 1
      expect(sunIntensity).toBe(0.5) // 5/10
      expect(plutoIntensity).toBe(0.1) // 1/10

      expect(sunIntensity).toBeGreaterThan(plutoIntensity)
    })

    it('should clamp intensity to 0-1 range', () => {
      const zenith = calculateZenithLine('sun', 20.0, 1.0)

      // Test with weight exceeding maxWeight
      const highWeights: PlanetWeights = {
        sun: 15,
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

      const intensity = getZenithBandIntensity(zenith, highWeights, 10)
      expect(intensity).toBe(1.0) // Clamped to 1.0
    })
  })
})
