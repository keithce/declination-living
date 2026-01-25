'use node'

/**
 * Phase 2 Actions - Complete ACG, Zenith, Paran, and Scoring Grid calculations
 *
 * Provides integrated action for calculator that returns all Phase 2 visualization data.
 */

import { v } from 'convex/values'
import { action } from '../_generated/server'
import { internal } from '../_generated/api'
import { calculateAllPositions, calculateDeclinations, dateToJulianDay } from './ephemeris'
import { PLANET_IDS } from './core/types'
import { calculateAllParans } from './parans/solver'
import { generateScoringGrid } from './geospatial/grid'
import type {
  ACGLine,
  EquatorialCoordinates,
  PlanetId,
  ZenithLine,
} from './core/types'

// =============================================================================
// Validators
// =============================================================================

const planetWeightsValidator = v.object({
  sun: v.number(),
  moon: v.number(),
  mercury: v.number(),
  venus: v.number(),
  mars: v.number(),
  jupiter: v.number(),
  saturn: v.number(),
  uranus: v.number(),
  neptune: v.number(),
  pluto: v.number(),
})

// =============================================================================
// Phase 2 Complete Calculation
// =============================================================================

/**
 * Calculate complete Phase 2 dataset: ACG lines, zenith lines, parans, and scoring grid.
 *
 * This action integrates all Phase 2 calculations and returns data ready for
 * the enhanced results interface and globe visualization.
 */
export const calculatePhase2Complete = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    weights: planetWeightsValidator,
    gridOptions: v.optional(
      v.object({
        latStep: v.optional(v.number()),
        lonStep: v.optional(v.number()),
        latMin: v.optional(v.number()),
        latMax: v.optional(v.number()),
        lonMin: v.optional(v.number()),
        lonMax: v.optional(v.number()),
        acgOrb: v.optional(v.number()),
        paranOrb: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, { birthDate, birthTime, timezone, weights, gridOptions }) => {
    // 1. Calculate Julian Day and positions
    const jd = dateToJulianDay(birthDate, birthTime, timezone)
    const positions = calculateAllPositions(jd)
    const declinations = calculateDeclinations(jd)

    // 2. Build equatorial coordinates for ACG and parans
    const equatorialPositions: Record<PlanetId, EquatorialCoordinates> = {} as Record<
      PlanetId,
      EquatorialCoordinates
    >

    for (const planet of PLANET_IDS) {
      const pos = positions[planet]
      equatorialPositions[planet] = {
        ra: pos.longitude, // Using ecliptic longitude as RA approximation
        dec: pos.declination,
      }
    }

    // 3. Calculate ACG lines and zenith lines (using cached action)
    const acgZenithData: {
      acgLines: Array<ACGLine>
      zenithLines: Array<ZenithLine>
    } = await ctx.runAction(internal.calculations.acg.actions.calculateACGAndZenith, {
      julianDay: jd,
      positions: equatorialPositions,
      orb: 1.0,
    })

    // 4. Calculate all parans
    const paranResult = calculateAllParans(equatorialPositions)

    // 5. Generate scoring grid
    const scoringGrid = generateScoringGrid(
      declinations,
      weights,
      acgZenithData.acgLines,
      paranResult.points,
      gridOptions || {},
    )

    return {
      // Core data
      julianDay: jd,

      // ACG and Zenith
      acgLines: acgZenithData.acgLines,
      zenithLines: acgZenithData.zenithLines,

      // Parans
      parans: paranResult.points,
      paranSummary: paranResult.summary,

      // Scoring grid
      scoringGrid,

      // For backward compatibility
      declinations,
    }
  },
})
