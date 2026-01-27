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
import { convertAllToEquatorial } from '../coordinates/transform'
import { CACHE_TTL_30_DAYS_MS } from '../core/constants'
import { calculateAllACGLines } from '../acg/line_solver'
import { calculateAllParans } from '../parans/solver'
import { gridOptionsValidator, planetWeightsValidator, validateGridOptions } from '../validators'
import { generateScoringGrid } from './grid'
import { rankCities } from './ranking'
import type { GridCell, ScoringGridOptions } from './grid'
import type { CityData } from './ranking'

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

/** City ranking result returned to the frontend */
interface RankedCityResultDTO {
  id: string
  name: string
  country: string
  latitude: number
  longitude: number
  score: number
  rank: number
  tier: 'major' | 'medium' | 'minor' | 'small'
  highlights: Array<string>
}

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

    // Validate grid options ranges
    if (gridOptions) {
      validateGridOptions(gridOptions)
    }

    // 1. Calculate Julian Day and positions
    const jd = dateToJulianDay(birthDate, birthTime, timezone)
    const positions = calculateAllPositions(jd)
    const declinations = calculateDeclinations(jd)

    // 2. Convert from ecliptic to equatorial coordinates for ACG/parans
    const equatorialPositions = convertAllToEquatorial(positions)

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
  ttl: CACHE_TTL_30_DAYS_MS,
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

// =============================================================================
// City Ranking
// =============================================================================

/**
 * Rank top cities by astrological score (uncached internal action).
 * @internal Used by ActionCache - do not call directly.
 */
export const rankTopCitiesUncached = internalAction({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    weights: planetWeightsValidator,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { birthDate, birthTime, timezone, weights, limit }) => {
    // 1. Calculate ephemeris
    const jd = dateToJulianDay(birthDate, birthTime, timezone)
    const positions = calculateAllPositions(jd)
    const declinations = calculateDeclinations(jd)
    const equatorialPositions = convertAllToEquatorial(positions)
    const acgLines = calculateAllACGLines(jd, equatorialPositions)
    const paranResult = calculateAllParans(equatorialPositions)

    // 2. Fetch major + medium tier cities from DB
    const cities = await ctx.runQuery(internal.cities.queries.getCitiesForRanking, {
      tiers: ['major', 'medium'],
    })

    // 3. Run ranking pure function
    const ranked = rankCities(
      cities as Array<CityData>,
      {
        declinations,
        positions: equatorialPositions,
        weights,
        acgLines,
        parans: paranResult.points,
      },
      { limit: limit ?? 10, tiers: ['major', 'medium'] },
    )

    // 4. Return serializable result (strip Convex Id types)
    return ranked.map((city, i) => ({
      id: city.cityId.toString(),
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
      score: city.score,
      rank: i + 1,
      tier: city.tier,
      highlights: city.highlights,
    }))
  },
})

/** Cache for city ranking calculations */
const cityRankingCache = new ActionCache(components.actionCache, {
  action: internal.calculations.geospatial.actions.rankTopCitiesUncached,
  name: 'rankTopCities:v1',
  ttl: CACHE_TTL_30_DAYS_MS,
})

/**
 * Rank top cities by astrological score (cached, 30-day TTL).
 *
 * Fetches major + medium tier cities from the database and scores them
 * based on zenith proximity, ACG line proximity, and paran activity.
 *
 * @param birthDate - Birth date in YYYY-MM-DD format
 * @param birthTime - Birth time in HH:MM format
 * @param timezone - IANA timezone string
 * @param weights - Planet weights for scoring
 * @param limit - Maximum number of cities to return (default 10)
 * @returns Array of ranked cities with scores and highlights
 */
export const rankTopCities = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    weights: planetWeightsValidator,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Array<RankedCityResultDTO>> => {
    return cityRankingCache.fetch(ctx, args) as Promise<Array<RankedCityResultDTO>>
  },
})
