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
import type { ACGLine, EquatorialCoordinates, PlanetId, ZenithLine } from './core/types'

// =============================================================================
// Error Handling
// =============================================================================

function throwWithContext(error: unknown, context: string): never {
  const message = error instanceof Error ? error.message : String(error)
  throw new Error(`${context}: ${message}`, {
    cause: error instanceof Error ? error : undefined,
  })
}

// =============================================================================
// Coordinate Conversion Utilities
// =============================================================================

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

/** Mean obliquity of the ecliptic (J2000.0) in degrees */
const OBLIQUITY_DEG = 23.439291

/**
 * Convert ecliptic coordinates to equatorial coordinates.
 *
 * @param eclLon - Ecliptic longitude (λ) in degrees
 * @param eclLat - Ecliptic latitude (β) in degrees
 * @returns Equatorial coordinates { ra, dec } in degrees
 */
function eclipticToEquatorial(eclLon: number, eclLat: number): { ra: number; dec: number } {
  // Convert to radians
  const lambda = eclLon * DEG_TO_RAD
  const beta = eclLat * DEG_TO_RAD
  const eps = OBLIQUITY_DEG * DEG_TO_RAD

  const sinBeta = Math.sin(beta)
  const cosBeta = Math.cos(beta)
  const sinLambda = Math.sin(lambda)
  const cosLambda = Math.cos(lambda)
  const sinEps = Math.sin(eps)
  const cosEps = Math.cos(eps)

  // Calculate declination: sin(δ) = cos(β)sin(λ)sin(ε) + sin(β)cos(ε)
  const sinDec = cosBeta * sinLambda * sinEps + sinBeta * cosEps
  const dec = Math.asin(sinDec)

  // Calculate right ascension: α = atan2(cos(β)sin(λ)cos(ε) - sin(β)sin(ε), cos(β)cos(λ))
  const y = cosBeta * sinLambda * cosEps - sinBeta * sinEps
  const x = cosBeta * cosLambda
  let ra = Math.atan2(y, x)

  // Normalize RA to 0..2π
  if (ra < 0) {
    ra += 2 * Math.PI
  }

  return {
    ra: ra * RAD_TO_DEG,
    dec: dec * RAD_TO_DEG,
  }
}

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
    // Validate planet weights are non-negative
    for (const [planet, weight] of Object.entries(weights)) {
      if (weight < 0) {
        throw new Error(`Invalid weight for ${planet}: must be non-negative`)
      }
    }

    // 1. Calculate Julian Day and positions
    const jd = dateToJulianDay(birthDate, birthTime, timezone)
    const positions = calculateAllPositions(jd)
    const declinations = calculateDeclinations(jd)

    // 2. Build equatorial coordinates for ACG and parans
    // Convert from ecliptic (longitude, latitude) to equatorial (ra, dec)
    const equatorialPositions: Record<PlanetId, EquatorialCoordinates> = {} as Record<
      PlanetId,
      EquatorialCoordinates
    >

    for (const planet of PLANET_IDS) {
      const pos = positions[planet]
      // Proper ecliptic to equatorial conversion
      const eq = eclipticToEquatorial(pos.longitude, pos.latitude)
      equatorialPositions[planet] = {
        ra: eq.ra,
        dec: eq.dec,
      }
    }

    // 3. Calculate ACG lines and zenith lines (using cached action)
    let acgZenithData: {
      acgLines: Array<ACGLine>
      zenithLines: Array<ZenithLine>
    }
    try {
      acgZenithData = await ctx.runAction(internal.calculations.acg.actions.calculateACGAndZenith, {
        julianDay: jd,
        positions: equatorialPositions,
        orb: gridOptions?.acgOrb ?? 1.0,
      })
    } catch (error) {
      throwWithContext(error, 'ACG/Zenith calculation failed')
    }

    // 4. Calculate all parans
    let paranResult: ReturnType<typeof calculateAllParans>
    try {
      paranResult = calculateAllParans(equatorialPositions)
    } catch (error) {
      throwWithContext(error, 'Paran calculation failed')
    }

    // 5. Generate scoring grid
    let scoringGrid: ReturnType<typeof generateScoringGrid>
    try {
      scoringGrid = generateScoringGrid(
        declinations,
        weights,
        acgZenithData.acgLines,
        paranResult.points,
        gridOptions || {},
      )
    } catch (error) {
      throwWithContext(error, 'Scoring grid generation failed')
    }

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
