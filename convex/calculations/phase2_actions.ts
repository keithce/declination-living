'use node'

/**
 * Phase 2 Actions - Complete ACG, Zenith, Paran, and Scoring Grid calculations
 *
 * @deprecated This file is maintained for backward compatibility only.
 * New code should use the domain-specific actions instead:
 *
 * - Zenith Lines: api.calculations.zenith.actions.calculateZenithLines
 * - ACG Lines: api.calculations.acg.actions.calculateACGAndZenithPublic
 * - Parans: api.calculations.parans.actions.calculateParansFromBirthData
 * - Scoring Grid: api.calculations.geospatial.actions.calculateScoringGrid
 * - All at once: api.calculations.batch.actions.calculateAllVisualizationData
 *
 * The domain-specific actions provide:
 * - Progressive loading (render data as it arrives)
 * - Better caching (individual cache keys per data type)
 * - More granular error handling
 *
 * This file bundles all calculations into a single "phase2" action which:
 * - Blocks UI until ALL data loads (slowest calculation wins)
 * - Uses a single cache key for four different data types
 * - Has arbitrary naming with no domain meaning
 */

import { v } from 'convex/values'
import { ActionCache } from '@convex-dev/action-cache'
import { action, internalAction } from '../_generated/server'
import { components, internal } from '../_generated/api'
import { calculateAllPositions, calculateDeclinations, dateToJulianDay } from './ephemeris'
import { PLANET_IDS } from './core/types'
import { calculateAllParans } from './parans/solver'
import { generateScoringGrid } from './geospatial/grid'
import { gridOptionsValidator, planetWeightsValidator } from './validators'
import { eclipticToEquatorial } from './coordinates/transform'
import { CACHE_TTL_30_DAYS_MS, MEAN_OBLIQUITY_J2000 } from './core/constants'
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
// Phase 2 Result Type
// =============================================================================

/** Phase 2 complete calculation result type */
interface Phase2CompleteResult {
  julianDay: number
  acgLines: Array<ACGLine>
  zenithLines: Array<ZenithLine>
  parans: ReturnType<typeof calculateAllParans>['points']
  paranSummary: ReturnType<typeof calculateAllParans>['summary']
  scoringGrid: ReturnType<typeof generateScoringGrid>
  declinations: ReturnType<typeof calculateDeclinations>
}

// =============================================================================
// Phase 2 Complete Calculation
// =============================================================================

/**
 * Calculate complete Phase 2 dataset (uncached internal action).
 * @internal Used by ActionCache - do not call directly.
 * @deprecated Use domain-specific actions for new code.
 *
 * Returns: ACG lines, zenith lines, parans, and scoring grid.
 */
export const calculatePhase2CompleteUncached = internalAction({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    weights: planetWeightsValidator,
    gridOptions: gridOptionsValidator,
  },
  handler: async (
    ctx,
    { birthDate, birthTime, timezone, weights, gridOptions },
  ): Promise<Phase2CompleteResult> => {
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
      const eq = eclipticToEquatorial(pos.longitude, pos.latitude, MEAN_OBLIQUITY_J2000)
      equatorialPositions[planet] = {
        ra: eq.rightAscension,
        dec: eq.declination,
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

/** Cache for Phase 2 complete calculations */
const phase2CompleteCache = new ActionCache(components.actionCache, {
  action: internal.calculations.phase2_actions.calculatePhase2CompleteUncached,
  name: 'calculatePhase2Complete:v1',
  ttl: CACHE_TTL_30_DAYS_MS,
})

/**
 * Calculate complete Phase 2 dataset (cached, 30-day TTL).
 * Anonymous shared cache - same inputs return same cached result for any user.
 *
 * @deprecated Use domain-specific actions for progressive loading:
 * - api.calculations.zenith.actions.calculateZenithLines
 * - api.calculations.acg.actions.calculateACGAndZenithPublic
 * - api.calculations.parans.actions.calculateParansFromBirthData
 * - api.calculations.geospatial.actions.calculateScoringGrid
 *
 * Or use the batch action for all at once:
 * - api.calculations.batch.actions.calculateAllVisualizationData
 *
 * Returns: ACG lines, zenith lines, parans, and scoring grid.
 */
export const calculatePhase2Complete = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    weights: planetWeightsValidator,
    gridOptions: gridOptionsValidator,
  },
  handler: async (ctx, args): Promise<Phase2CompleteResult> => {
    return phase2CompleteCache.fetch(ctx, args)
  },
})
