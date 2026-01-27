'use node'

/**
 * Geospatial Calculation Actions
 *
 * Domain-specific actions for scoring grid calculations.
 * The scoring grid combines zenith, ACG, and paran data to produce
 * a comprehensive heatmap for visualization.
 */

import { v } from 'convex/values'
import { ActionCache } from '@convex-dev/action-cache'
import { action, internalAction } from '../../_generated/server'
import { components, internal } from '../../_generated/api'
import { calculateAllPositions, calculateDeclinations, dateToJulianDay } from '../ephemeris'
import { eclipticToEquatorial } from '../coordinates/transform'
import { MEAN_OBLIQUITY_J2000 } from '../core/constants'
import { PLANET_IDS } from '../core/types'
import { calculateAllACGLines } from '../acg/line_solver'
import { calculateAllParans } from '../parans/solver'
import { planetWeightsValidator } from '../validators'
import { generateScoringGrid } from './grid'
import type { EquatorialCoordinates, PlanetId } from '../core/types'
import type { GridCell, ScoringGridOptions } from './grid'

// =============================================================================
// Types
// =============================================================================

/** Scoring grid calculation result */
interface ScoringGridResult {
  grid: Array<GridCell>
  gridStats: {
    totalCells: number
    maxScore: number
    minScore: number
  }
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
// Cache Configuration
// =============================================================================

// 30-day TTL in milliseconds
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

// =============================================================================
// Scoring Grid Calculation (Cached)
// =============================================================================

/**
 * Calculate scoring grid (uncached internal action).
 * @internal Used by ActionCache - do not call directly.
 *
 * This action computes ACG lines and parans internally to generate the grid.
 * It depends on both ACG and paran data, so it should be called after
 * those calculations complete (or it will compute them inline).
 */
export const calculateScoringGridUncached = internalAction({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    weights: planetWeightsValidator,
    gridOptions: gridOptionsValidator,
  },
  handler: async (
    _ctx,
    { birthDate, birthTime, timezone, weights, gridOptions },
  ): Promise<ScoringGridResult> => {
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

    // 2. Convert from ecliptic to equatorial coordinates for ACG/parans
    const equatorialPositions: Record<PlanetId, EquatorialCoordinates> = {} as Record<
      PlanetId,
      EquatorialCoordinates
    >

    for (const planet of PLANET_IDS) {
      const pos = positions[planet]
      const eq = eclipticToEquatorial(pos.longitude, pos.latitude, MEAN_OBLIQUITY_J2000)
      equatorialPositions[planet] = {
        ra: eq.rightAscension,
        dec: eq.declination,
      }
    }

    // 3. Calculate ACG lines
    const acgLines = calculateAllACGLines(jd, equatorialPositions)

    // 4. Calculate parans
    const paranResult = calculateAllParans(equatorialPositions)

    // 5. Generate scoring grid
    const options: ScoringGridOptions = gridOptions || {}
    const grid = generateScoringGrid(declinations, weights, acgLines, paranResult.points, options)

    // 6. Calculate grid stats
    let maxScore = -Infinity
    let minScore = Infinity
    for (const cell of grid) {
      if (cell.score > maxScore) maxScore = cell.score
      if (cell.score < minScore) minScore = cell.score
    }

    return {
      grid,
      gridStats: {
        totalCells: grid.length,
        maxScore: maxScore === -Infinity ? 0 : maxScore,
        minScore: minScore === Infinity ? 0 : minScore,
      },
    }
  },
})

/** Cache for scoring grid calculations */
const scoringGridCache = new ActionCache(components.actionCache, {
  action: internal.calculations.geospatial.actions.calculateScoringGridUncached,
  name: 'calculateScoringGrid:v1',
  ttl: THIRTY_DAYS_MS,
})

/**
 * Calculate scoring grid (cached, 30-day TTL).
 *
 * Public action for frontend access. Generates a comprehensive
 * heatmap grid combining zenith, ACG, and paran scoring.
 *
 * This is the last visualization to load as it depends on ACG and paran data.
 *
 * @param birthDate - Birth date in YYYY-MM-DD format
 * @param birthTime - Birth time in HH:MM format
 * @param timezone - IANA timezone string
 * @param weights - Planet weights for scoring
 * @param gridOptions - Optional grid generation parameters
 * @returns Scoring grid with statistics
 */
export const calculateScoringGrid = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    weights: planetWeightsValidator,
    gridOptions: gridOptionsValidator,
  },
  handler: async (ctx, args): Promise<ScoringGridResult> => {
    return scoringGridCache.fetch(ctx, args)
  },
})
