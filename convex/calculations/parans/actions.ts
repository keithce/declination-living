/**
 * Paran Convex Actions
 *
 * Internal actions for paran calculations that can be called from other Convex functions.
 */

import { v } from 'convex/values'
import { internalAction } from '../../_generated/server'
import { equatorialPositionValidator, paranResultValidator, planetIdValidator } from '../validators'
import { findAllParans, getParanStatistics, getParansAtLatitude, getTopParans } from './catalog'
import type { PlanetPosition } from './catalog'

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
