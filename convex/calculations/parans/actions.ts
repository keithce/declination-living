'use node'

/**
 * Paran Convex Actions
 *
 * Domain-specific actions for paran calculations.
 * Includes both internal actions for other Convex functions and
 * public cached actions for direct frontend access.
 */

import { v } from 'convex/values'
import { ActionCache } from '@convex-dev/action-cache'
import { action, internalAction } from '../../_generated/server'
import { components, internal } from '../../_generated/api'
import {
  equatorialPositionValidator,
  paranPointValidator,
  paranResultValidator,
  paranStatisticsValidator,
  paranSummaryValidator,
} from '../validators'
import { calculateAllPositions, dateToJulianDay } from '../ephemeris'
import { convertAllToEquatorial } from '../coordinates/transform'
import { CACHE_TTL_30_DAYS_MS } from '../core/constants'
import { PLANET_IDS } from '../core/types'
import { findAllParans, getParanStatistics, getParansAtLatitude, getTopParans } from './catalog'
import type { ParanPoint, ParanResult } from '../core/types'
import type { PlanetPosition } from './catalog'

// =============================================================================
// Types
// =============================================================================

/** Public paran calculation result */
export interface ParanCalculationResult {
  points: Array<ParanPoint>
  summary: ParanResult['summary']
}

// =============================================================================
// Calculate Parans Action
// =============================================================================

/**
 * Calculate all parans for a set of planetary positions.
 *
 * This is the main entry point for paran calculations from other Convex actions.
 * Returns both the complete paran catalog and the top strongest parans.
 */
export const calculateParans = internalAction({
  args: {
    positions: v.array(equatorialPositionValidator),
    strengthThreshold: v.optional(v.number()),
    topLimit: v.optional(v.number()),
  },
  returns: v.object({
    parans: paranResultValidator,
    topParans: v.array(paranPointValidator),
    statistics: paranStatisticsValidator,
  }),
  handler: async (_ctx, args) => {
    const threshold = args.strengthThreshold ?? 0.5
    const limit = args.topLimit ?? 50

    // Convert to PlanetPosition format
    const planetPositions: Array<PlanetPosition> = args.positions.map((p) => ({
      planetId: p.planetId,
      ra: p.ra,
      dec: p.dec,
    }))

    // Calculate all parans
    const result = findAllParans(planetPositions, threshold)

    // Get top parans
    const topParans = getTopParans(result, limit)

    // Get statistics
    const statistics = getParanStatistics(result)

    return {
      parans: result,
      topParans,
      statistics,
    }
  },
})

// =============================================================================
// Get Parans for Location Action
// =============================================================================

/**
 * Get parans relevant to a specific latitude.
 *
 * Filters the paran catalog to find parans near a given latitude.
 */
export const getParansForLocation = internalAction({
  args: {
    parans: paranResultValidator,
    latitude: v.number(),
    orb: v.optional(v.number()),
  },
  returns: v.object({
    latitude: v.number(),
    orb: v.number(),
    parans: v.array(paranPointValidator),
    count: v.number(),
  }),
  handler: async (_ctx, args) => {
    const orb = args.orb ?? 2.0

    // Filter parans by latitude proximity
    const relevantParans = getParansAtLatitude(args.parans, args.latitude, orb)

    // Sort by distance from target latitude
    relevantParans.sort(
      (a, b) => Math.abs(a.latitude - args.latitude) - Math.abs(b.latitude - args.latitude),
    )

    return {
      latitude: args.latitude,
      orb,
      parans: relevantParans,
      count: relevantParans.length,
    }
  },
})

// =============================================================================
// Lightweight Paran Summary Action
// =============================================================================

/**
 * Get a lightweight summary of parans without the full catalog.
 *
 * Useful for quick checks or UI previews.
 */
export const getParanSummary = internalAction({
  args: {
    positions: v.array(equatorialPositionValidator),
    strengthThreshold: v.optional(v.number()),
  },
  returns: v.object({
    summary: paranSummaryValidator,
    statistics: paranStatisticsValidator,
    sampleParans: v.array(paranPointValidator),
  }),
  handler: async (_ctx, args) => {
    const threshold = args.strengthThreshold ?? 0.5

    const planetPositions: Array<PlanetPosition> = args.positions.map((p) => ({
      planetId: p.planetId,
      ra: p.ra,
      dec: p.dec,
    }))

    const result = findAllParans(planetPositions, threshold)
    const statistics = getParanStatistics(result)

    // Return summary only, not full points array
    return {
      summary: result.summary,
      statistics,
      sampleParans: result.points.slice(0, 5), // Just top 5 for preview
    }
  },
})

// =============================================================================
// Public Paran Calculation (Cached)
// =============================================================================

/**
 * Calculate parans from birth data (uncached internal action).
 * @internal Used by ActionCache - do not call directly.
 */
export const calculateParansFromBirthDataUncached = internalAction({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
  },
  returns: v.object({
    points: v.array(paranPointValidator),
    summary: paranSummaryValidator,
  }),
  handler: async (_ctx, { birthDate, birthTime, timezone }): Promise<ParanCalculationResult> => {
    // 1. Calculate Julian Day and positions
    const jd = dateToJulianDay(birthDate, birthTime, timezone)
    const positions = calculateAllPositions(jd)

    // 2. Convert from ecliptic to equatorial coordinates
    const equatorialPositions = convertAllToEquatorial(positions)

    // 3. Convert to PlanetPosition array for paran calculation
    const planetPositions: Array<PlanetPosition> = PLANET_IDS.map((planetId) => ({
      planetId,
      ra: equatorialPositions[planetId].ra,
      dec: equatorialPositions[planetId].dec,
    }))

    // 4. Calculate parans
    const result = findAllParans(planetPositions)

    return {
      points: result.points,
      summary: result.summary,
    }
  },
})

/** Cache for paran calculations */
const paranCalculationCache = new ActionCache(components.actionCache, {
  action: internal.calculations.parans.actions.calculateParansFromBirthDataUncached,
  name: 'calculateParansFromBirthData:v1',
  ttl: CACHE_TTL_30_DAYS_MS,
})

/**
 * Calculate parans from birth data (cached, 30-day TTL).
 *
 * Public action for frontend access. Computes planetary positions
 * from birth data and calculates all parans.
 *
 * @param birthDate - Birth date in YYYY-MM-DD format
 * @param birthTime - Birth time in HH:MM format
 * @param timezone - IANA timezone string
 * @returns Paran points and summary
 */
export const calculateParansFromBirthData = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
  },
  returns: v.object({
    points: v.array(paranPointValidator),
    summary: paranSummaryValidator,
  }),
  handler: async (ctx, args): Promise<ParanCalculationResult> => {
    return paranCalculationCache.fetch(ctx, args)
  },
})
