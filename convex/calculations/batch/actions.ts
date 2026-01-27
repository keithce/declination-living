'use node'

/**
 * Batch Calculation Actions
 *
 * Convenience actions for running multiple visualization calculations.
 * Useful for backward compatibility and when all data is needed at once.
 */

import { v } from 'convex/values'
import { action } from '../../_generated/server'
import { api } from '../../_generated/api'
import { planetWeightsValidator } from '../validators'
import type { ACGLine, ParanPoint, ZenithLine } from '../core/types'
import type { PlanetDeclinations } from '../ephemeris'
import type { GridCell } from '../geospatial/grid'

// =============================================================================
// Types
// =============================================================================

/** Complete visualization data result */
interface AllVisualizationDataResult {
  julianDay: number
  acgLines: Array<ACGLine>
  zenithLines: Array<ZenithLine>
  parans: Array<ParanPoint>
  paranSummary: {
    riseRise: number
    riseCulminate: number
    riseSet: number
    culminateCulminate: number
    culminateSet: number
    setSet: number
    total: number
  }
  scoringGrid: Array<GridCell>
  declinations: PlanetDeclinations
}

// =============================================================================
// Validators
// =============================================================================

/** Grid options validator */
const gridOptionsValidator = v.optional(
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
)

// =============================================================================
// Batch Convenience Action
// =============================================================================

/**
 * Calculate all visualization data in parallel.
 *
 * This is a convenience action that fetches all visualization data at once.
 * Each sub-calculation is independently cached, so subsequent calls benefit
 * from the individual caches.
 *
 * Recommended for backward compatibility or when all data is needed immediately.
 * For progressive loading, use the individual domain actions instead.
 *
 * @param birthDate - Birth date in YYYY-MM-DD format
 * @param birthTime - Birth time in HH:MM format
 * @param timezone - IANA timezone string
 * @param weights - Planet weights for scoring
 * @param gridOptions - Optional grid generation parameters
 * @returns Complete visualization data
 */
export const calculateAllVisualizationData = action({
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
  ): Promise<AllVisualizationDataResult> => {
    // Run calculations in parallel where possible
    // 1. Zenith (fastest, no dependencies) and ACG (cached) can run immediately
    // 2. Parans (cached) can run in parallel with ACG
    // 3. Scoring grid depends on ACG and parans, but it computes them internally

    // Run zenith, ACG, parans in parallel
    const [zenithResult, acgResult, paranResult] = await Promise.all([
      ctx.runAction(api.calculations.zenith.actions.calculateZenithLines, {
        birthDate,
        birthTime,
        timezone,
      }),
      ctx.runAction(api.calculations.acg.actions.calculateACGAndZenithPublic, {
        birthDate,
        birthTime,
        timezone,
      }),
      ctx.runAction(api.calculations.parans.actions.calculateParansFromBirthData, {
        birthDate,
        birthTime,
        timezone,
      }),
    ])

    // Scoring grid (uses its own cache, computes dependencies internally if needed)
    const gridResult = await ctx.runAction(
      api.calculations.geospatial.actions.calculateScoringGrid,
      {
        birthDate,
        birthTime,
        timezone,
        weights,
        gridOptions,
      },
    )

    return {
      julianDay: zenithResult.julianDay,
      acgLines: acgResult.acgLines,
      zenithLines: zenithResult.zenithLines,
      parans: paranResult.points,
      paranSummary: paranResult.summary,
      scoringGrid: gridResult.grid,
      declinations: zenithResult.declinations,
    }
  },
})
