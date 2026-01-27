/**
 * Calculation Flow Integration Tests
 *
 * Tests the complete flow from ephemeris positions through ACG/zenith
 * calculations to scoring grid generation. Verifies all domain modules
 * work correctly together.
 */

import { describe, expect, it } from 'vitest'
import { calculateAllACGLines } from '../acg/line_solver'
import { calculateAllZenithLines } from '../acg/zenith'
import { generateScoringGrid, getGridStatistics, getTopLocations } from '../geospatial/grid'
import { calculateAllParans } from '../parans/solver'
import { PLANET_IDS } from '../core/types'
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
  for (const planet of PLANET_IDS) {
    if (!(planet in positions)) {
      throw new Error(`Missing planet in positions: ${planet}`)
    }
    declinations[planet] = positions[planet].dec
  }
  return declinations as PlanetDeclinations
}

// =============================================================================
// End-to-End Flow Tests
// =============================================================================

describe('Calculation Flow Integration', () => {
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
