/**
 * Phase 2 Integration Tests
 *
 * Tests the complete flow from ephemeris positions through ACG/zenith
 * calculations to scoring grid generation.
 */

import { describe, expect, it } from 'vitest'
import { calculateAllACGLines } from '../acg/line_solver'
import { calculateAllZenithLines } from '../acg/zenith'
import { generateScoringGrid, getGridStatistics, getTopLocations } from '../geospatial/grid'
import { scoreLocationForACG, scoreParanProximity } from '../geospatial/search'
import { calculateAllParans } from '../parans/solver'
import type {
  EquatorialCoordinates,
  PlanetDeclinations,
  PlanetId,
  PlanetWeights,
} from '../core/types'

// =============================================================================
// Test Data
// =============================================================================

// Summer Solstice 2000: Sun at max declination
const JD_SUMMER_SOLSTICE_2000 = 2451717.5
const SUMMER_POSITIONS: Record<PlanetId, EquatorialCoordinates> = {
  sun: { ra: 90.0, dec: 23.44 }, // Near MC at 90° RA
  moon: { ra: 180.0, dec: 5.0 },
  mercury: { ra: 85.0, dec: 20.0 },
  venus: { ra: 100.0, dec: 15.0 },
  mars: { ra: 200.0, dec: -10.0 },
  jupiter: { ra: 150.0, dec: 8.0 },
  saturn: { ra: 45.0, dec: -5.0 },
  uranus: { ra: 320.0, dec: -2.0 },
  neptune: { ra: 300.0, dec: -15.0 },
  pluto: { ra: 250.0, dec: -10.0 },
}

// Equal weights for all planets
const EQUAL_WEIGHTS: PlanetWeights = {
  sun: 1.0,
  moon: 1.0,
  mercury: 1.0,
  venus: 1.0,
  mars: 1.0,
  jupiter: 1.0,
  saturn: 1.0,
  uranus: 1.0,
  neptune: 1.0,
  pluto: 1.0,
}

// Weighted to emphasize outer planets
const OUTER_PLANET_WEIGHTS: PlanetWeights = {
  sun: 0.5,
  moon: 0.5,
  mercury: 0.3,
  venus: 0.3,
  mars: 0.5,
  jupiter: 1.5,
  saturn: 1.5,
  uranus: 2.0,
  neptune: 2.0,
  pluto: 2.0,
}

function extractDeclinations(
  positions: Record<PlanetId, EquatorialCoordinates>,
): PlanetDeclinations {
  const declinations: Partial<PlanetDeclinations> = {}
  for (const planet of Object.keys(positions) as Array<PlanetId>) {
    declinations[planet] = positions[planet].dec
  }
  return declinations as PlanetDeclinations
}

// =============================================================================
// End-to-End Flow Tests
// =============================================================================

describe('Phase 2 Integration', () => {
  describe('Complete Calculation Flow', () => {
    it('should generate complete analysis from positions to grid', () => {
      const declinations = extractDeclinations(SUMMER_POSITIONS)

      // Step 1: Calculate ACG lines (40 total)
      const acgLines = calculateAllACGLines(JD_SUMMER_SOLSTICE_2000, SUMMER_POSITIONS)
      expect(acgLines).toHaveLength(40) // 4 lines × 10 planets

      // Step 2: Calculate zenith lines (10 total)
      const zenithLines = calculateAllZenithLines(declinations, 1.0)
      expect(zenithLines).toHaveLength(10) // 1 per planet

      // Step 3: Calculate parans
      const paranResult = calculateAllParans(SUMMER_POSITIONS)
      expect(paranResult.points.length).toBeGreaterThan(0)

      // Step 4: Generate scoring grid
      const grid = generateScoringGrid(declinations, EQUAL_WEIGHTS, acgLines, paranResult.points, {
        latStep: 10,
        lonStep: 20,
        latMin: -80,
        latMax: 80,
      })

      // Verify grid dimensions: (160°/10°) × (360°/20°) = 17 × 19 = 323 cells
      expect(grid.length).toBe(323)

      // Step 5: Verify all cells have valid data
      for (const cell of grid) {
        expect(cell.lat).toBeGreaterThanOrEqual(-80)
        expect(cell.lat).toBeLessThanOrEqual(80)
        expect(cell.lon).toBeGreaterThanOrEqual(-180)
        expect(cell.lon).toBeLessThanOrEqual(180)
        expect(cell.score).toBeGreaterThanOrEqual(0)
        expect(cell.zenithContribution).toBeGreaterThanOrEqual(0)
        expect(cell.acgContribution).toBeGreaterThanOrEqual(0)
        expect(cell.paranContribution).toBeGreaterThanOrEqual(0)
        expect(['zenith', 'acg', 'paran', 'mixed']).toContain(cell.dominantFactor)
      }

      // Step 6: Get top locations
      const topLocations = getTopLocations(grid, 10)
      expect(topLocations).toHaveLength(10)
      expect(topLocations[0].score).toBeGreaterThanOrEqual(topLocations[9].score)

      // Step 7: Get statistics
      const stats = getGridStatistics(grid)
      expect(stats.totalCells).toBe(323)
      expect(stats.avgScore).toBeGreaterThan(0)
      expect(stats.maxScore).toBeGreaterThanOrEqual(stats.avgScore)
      expect(stats.minScore).toBeLessThanOrEqual(stats.avgScore)
      expect(
        stats.zenithDominant + stats.acgDominant + stats.paranDominant + stats.mixedDominant,
      ).toBe(323)
    })

    it('should produce different results with different weights', () => {
      const declinations = extractDeclinations(SUMMER_POSITIONS)
      const acgLines = calculateAllACGLines(JD_SUMMER_SOLSTICE_2000, SUMMER_POSITIONS)
      const paranResult = calculateAllParans(SUMMER_POSITIONS)

      // Generate grid with equal weights
      const gridEqual = generateScoringGrid(
        declinations,
        EQUAL_WEIGHTS,
        acgLines,
        paranResult.points,
        { latStep: 20, lonStep: 40 },
      )

      // Generate grid with outer planet emphasis
      const gridOuter = generateScoringGrid(
        declinations,
        OUTER_PLANET_WEIGHTS,
        acgLines,
        paranResult.points,
        { latStep: 20, lonStep: 40 },
      )

      // Verify different top locations
      const topEqual = getTopLocations(gridEqual, 5)
      const topOuter = getTopLocations(gridOuter, 5)

      // Scores should differ due to different weightings
      expect(topEqual[0].score).not.toBe(topOuter[0].score)
    })
  })

  // =============================================================================
  // ACG Line Verification
  // =============================================================================

  describe('ACG Line Verification', () => {
    it('should generate all line types for all planets', () => {
      const acgLines = calculateAllACGLines(JD_SUMMER_SOLSTICE_2000, SUMMER_POSITIONS)

      const lineTypes = new Set(acgLines.map((l) => l.lineType))
      expect(lineTypes).toEqual(new Set(['MC', 'IC', 'ASC', 'DSC']))

      const planets = new Set(acgLines.map((l) => l.planet))
      expect(planets.size).toBe(10)
    })

    it('should have MC/IC lines vertical', () => {
      const acgLines = calculateAllACGLines(JD_SUMMER_SOLSTICE_2000, SUMMER_POSITIONS)

      for (const line of acgLines) {
        if (line.lineType === 'MC' || line.lineType === 'IC') {
          const firstLon = line.points[0].longitude
          for (const point of line.points) {
            expect(point.longitude).toBeCloseTo(firstLon, 5)
          }
        }
      }
    })

    it('should have ASC/DSC lines curve with latitude', () => {
      const acgLines = calculateAllACGLines(JD_SUMMER_SOLSTICE_2000, SUMMER_POSITIONS)

      for (const line of acgLines) {
        if (line.lineType === 'ASC' || line.lineType === 'DSC') {
          // ASC/DSC lines should have varying longitudes
          const longitudes = line.points.map((p) => p.longitude)
          const minLon = Math.min(...longitudes)
          const maxLon = Math.max(...longitudes)
          expect(maxLon - minLon).toBeGreaterThan(1) // Should curve
        }
      }
    })
  })

  // =============================================================================
  // Zenith Verification
  // =============================================================================

  describe('Zenith Verification', () => {
    it('should create zenith lines matching declinations', () => {
      const declinations = extractDeclinations(SUMMER_POSITIONS)
      const zenithLines = calculateAllZenithLines(declinations, 1.0)

      expect(zenithLines).toHaveLength(10)

      for (const zenith of zenithLines) {
        expect(zenith.declination).toBe(declinations[zenith.planet])
      }
    })

    it('should calculate orb bounds correctly', () => {
      const declinations = extractDeclinations(SUMMER_POSITIONS)
      const zenithLines = calculateAllZenithLines(declinations, 1.0)

      const sunZenith = zenithLines.find((z) => z.planet === 'sun')
      expect(sunZenith?.declination).toBe(23.44)
      expect(sunZenith?.orbMin).toBe(22.44) // dec - orb
      expect(sunZenith?.orbMax).toBe(24.44) // dec + orb

      // Test with different orb
      const wideOrbZeniths = calculateAllZenithLines(declinations, 2.0)
      const sunWideZenith = wideOrbZeniths.find((z) => z.planet === 'sun')
      expect(sunWideZenith?.orbMin).toBe(21.44)
      expect(sunWideZenith?.orbMax).toBe(25.44)
    })
  })

  // =============================================================================
  // Scoring Verification
  // =============================================================================

  describe('Scoring Verification', () => {
    it('should score higher near ACG lines', () => {
      const acgLines = calculateAllACGLines(JD_SUMMER_SOLSTICE_2000, SUMMER_POSITIONS)

      // Sun MC line should be near lon=90° (RA=90°)
      const scoreNearMC = scoreLocationForACG(0, 90, acgLines, EQUAL_WEIGHTS, 2.0)
      const scoreAwayMC = scoreLocationForACG(0, 45, acgLines, EQUAL_WEIGHTS, 2.0)

      expect(scoreNearMC.score).toBeGreaterThan(scoreAwayMC.score)
    })

    it('should score based on paran proximity', () => {
      const paranResult = calculateAllParans(SUMMER_POSITIONS)

      // Explicit check: if no parans found, fail with clear message
      // (SUMMER_POSITIONS should produce parans; if not, test data needs review)
      expect(
        paranResult.points.length,
        'Expected calculateAllParans to produce paran points for SUMMER_POSITIONS',
      ).toBeGreaterThan(0)

      // Test that proximity scoring works - score should be > 0 at paran latitude
      const firstParan = paranResult.points[0]
      const scoreAtParan = scoreParanProximity(
        firstParan.latitude,
        paranResult.points,
        EQUAL_WEIGHTS,
        1.0,
      )
      expect(scoreAtParan).toBeGreaterThan(0)

      // Test that score decreases with distance (use 0.5° orb for tighter control)
      const scoreNearby = scoreParanProximity(
        firstParan.latitude + 0.25,
        paranResult.points,
        EQUAL_WEIGHTS,
        0.5,
      )
      const scoreFar = scoreParanProximity(
        firstParan.latitude + 1.0,
        paranResult.points,
        EQUAL_WEIGHTS,
        0.5,
      )
      expect(scoreNearby).toBeGreaterThan(scoreFar)
    })

    it('should combine all scoring factors correctly', () => {
      const declinations = extractDeclinations(SUMMER_POSITIONS)
      const acgLines = calculateAllACGLines(JD_SUMMER_SOLSTICE_2000, SUMMER_POSITIONS)
      const paranResult = calculateAllParans(SUMMER_POSITIONS)

      const grid = generateScoringGrid(declinations, EQUAL_WEIGHTS, acgLines, paranResult.points, {
        latStep: 10,
        lonStep: 20,
      })

      for (const cell of grid) {
        // Total score should equal sum of contributions
        const calculatedTotal =
          cell.zenithContribution + cell.acgContribution + cell.paranContribution
        expect(cell.score).toBeCloseTo(calculatedTotal, 5)
      }
    })
  })

  // =============================================================================
  // Performance Verification
  // =============================================================================

  describe('Performance Benchmarks', () => {
    // Skip performance tests on CI as timing can be unreliable
    const maybeIt = process.env.CI ? it.skip : it

    maybeIt('should calculate ACG lines within 500ms', () => {
      const start = performance.now()
      calculateAllACGLines(JD_SUMMER_SOLSTICE_2000, SUMMER_POSITIONS)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(500)
    })

    maybeIt('should generate scoring grid within 1000ms', () => {
      const declinations = extractDeclinations(SUMMER_POSITIONS)
      const acgLines = calculateAllACGLines(JD_SUMMER_SOLSTICE_2000, SUMMER_POSITIONS)
      const paranResult = calculateAllParans(SUMMER_POSITIONS)

      const start = performance.now()
      generateScoringGrid(declinations, EQUAL_WEIGHTS, acgLines, paranResult.points, {
        latStep: 5,
        lonStep: 10,
      })
      const duration = performance.now() - start

      expect(duration).toBeLessThan(1000)
    })
  })

  // =============================================================================
  // Data Consistency Verification
  // =============================================================================

  describe('Data Consistency', () => {
    it('should have consistent planet counts across all outputs', () => {
      const declinations = extractDeclinations(SUMMER_POSITIONS)
      const acgLines = calculateAllACGLines(JD_SUMMER_SOLSTICE_2000, SUMMER_POSITIONS)
      const zenithLines = calculateAllZenithLines(declinations, 1.0)

      // ACG: 4 lines per planet
      const acgPlanets = new Set(acgLines.map((l) => l.planet))
      expect(acgPlanets.size).toBe(10)

      // Zenith: 1 line per planet
      const zenithPlanets = new Set(zenithLines.map((z) => z.planet))
      expect(zenithPlanets.size).toBe(10)

      // Should be same planets
      expect(acgPlanets).toEqual(zenithPlanets)
    })

    it('should have valid latitude ranges for all outputs', () => {
      const acgLines = calculateAllACGLines(JD_SUMMER_SOLSTICE_2000, SUMMER_POSITIONS)

      for (const line of acgLines) {
        for (const point of line.points) {
          expect(point.latitude).toBeGreaterThanOrEqual(-90)
          expect(point.latitude).toBeLessThanOrEqual(90)
        }
      }
    })

    it('should have valid longitude ranges for all outputs', () => {
      const acgLines = calculateAllACGLines(JD_SUMMER_SOLSTICE_2000, SUMMER_POSITIONS)

      for (const line of acgLines) {
        for (const point of line.points) {
          expect(point.longitude).toBeGreaterThanOrEqual(-180)
          expect(point.longitude).toBeLessThanOrEqual(180)
        }
      }
    })
  })
})
