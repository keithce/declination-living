'use node'

/**
 * Vibe/Search Module - Convex Actions and Queries.
 *
 * Provides endpoints for:
 * - Vibe matching and selection
 * - City recommendations based on vibes
 * - Integration with optimization and ranking systems
 */

import { v } from 'convex/values'
import { action } from '../../_generated/server'
import { internal } from '../../_generated/api'

import { PLANET_IDS, PLANET_NAMES } from '../core/types'
import { calculateAllPositions, calculateDeclinations, dateToJulianDay } from '../ephemeris'
import { getMeanObliquity } from '../ephemeris/oob'
import { eclipticToEquatorial } from '../coordinates/transform'
import { calculateAllACGLines } from '../acg/line_solver'
import { calculateAllParans } from '../parans/solver'
import { planetWeightsValidator } from '../validators'

import { findOptimalBands, getQueryLatitudeRanges } from '../geospatial/optimizer'
import { rankCities } from '../geospatial/ranking'
import type { CityData } from '../geospatial/ranking'
import type { OptimizationInput } from '../geospatial/optimizer'
import type { EquatorialCoordinates, PlanetId, PlanetWeights, VibeCategory } from '../core/types'

// Re-export translator functions
export {
  DEFAULT_WEIGHTS,
  VIBE_CATEGORIES,
  blendVibes,
  combineVibeWeights,
  describeWeights,
  findMatchingVibes,
  getAllVibes,
  getPrimaryPlanets,
  getVibeById,
  matchVibeFromQuery,
  normalizeWeights,
  scaleWeights,
  zeroWeights,
} from './translator'

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build equatorial positions from ecliptic positions.
 */
function buildEquatorialPositions(
  positions: ReturnType<typeof calculateAllPositions>,
  obliquity: number,
): Record<PlanetId, EquatorialCoordinates> {
  return Object.fromEntries(
    PLANET_IDS.map((planet) => {
      const pos = positions[planet]
      const eq = eclipticToEquatorial(pos.longitude, pos.latitude, obliquity)
      return [planet, { ra: eq.rightAscension, dec: eq.declination }]
    }),
  ) as Record<PlanetId, EquatorialCoordinates>
}

// =============================================================================
// Public Actions
// =============================================================================

/**
 * Match a user query to a vibe category.
 *
 * Returns the matched vibe with its weights, or default weights if no match.
 */
export const matchVibe = action({
  args: {
    query: v.string(),
  },
  handler: async (_ctx, { query }) => {
    const { matchVibeFromQuery, DEFAULT_WEIGHTS, findMatchingVibes } = await import('./translator')

    const matchedVibe = matchVibeFromQuery(query)

    if (!matchedVibe) {
      // Return all potential matches for user selection
      const potentialMatches = findMatchingVibes(query)

      return {
        matched: false,
        vibeId: null,
        vibeName: null,
        weights: DEFAULT_WEIGHTS,
        suggestions: potentialMatches.slice(0, 3).map((m) => ({
          id: m.vibe.id,
          name: m.vibe.name,
          score: m.score,
        })),
      }
    }

    return {
      matched: true,
      vibeId: matchedVibe.id,
      vibeName: matchedVibe.name,
      description: matchedVibe.description,
      primaryPlanets: matchedVibe.primaryPlanets,
      weights: matchedVibe.weights,
      suggestions: [],
    }
  },
})

/**
 * Calculate city recommendations based on birth data and vibe preferences.
 *
 * This is the main entry point for the recommendation system.
 * Combines ephemeris calculations, geospatial optimization, and city ranking.
 */
export const calculateRecommendations = action({
  args: {
    // Birth data
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    // Vibe selection (one of these should be provided)
    vibeId: v.optional(v.string()),
    vibeQuery: v.optional(v.string()),
    customWeights: v.optional(planetWeightsValidator),
    // Options
    tiers: v.optional(
      v.array(
        v.union(v.literal('major'), v.literal('medium'), v.literal('minor'), v.literal('small')),
      ),
    ),
    minSafetyLevel: v.optional(
      v.union(
        v.literal('excellent'),
        v.literal('good'),
        v.literal('moderate'),
        v.literal('challenging'),
      ),
    ),
    limit: v.optional(v.number()),
    includeACGLines: v.optional(v.boolean()),
    includeParans: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    {
      birthDate,
      birthTime,
      vibeId,
      vibeQuery,
      customWeights,
      tiers,
      minSafetyLevel,
      limit = 20,
      includeACGLines = true,
      includeParans = true,
    },
  ) => {
    const { getVibeById, matchVibeFromQuery, DEFAULT_WEIGHTS } = await import('./translator')

    // 1. Determine weights from vibe or custom
    let weights: PlanetWeights = DEFAULT_WEIGHTS
    let matchedVibeName: string | null = null
    let matchedVibeId: string | null = null

    if (customWeights) {
      weights = customWeights
    } else if (vibeId) {
      const vibe = getVibeById(vibeId)
      if (vibe) {
        weights = vibe.weights
        matchedVibeName = vibe.name
        matchedVibeId = vibe.id
      }
    } else if (vibeQuery) {
      const matched = matchVibeFromQuery(vibeQuery)
      if (matched) {
        weights = matched.weights
        matchedVibeName = matched.name
        matchedVibeId = matched.id
      }
    }

    // 2. Calculate ephemeris data
    const jd = dateToJulianDay(birthDate, birthTime)
    const positions = calculateAllPositions(jd)
    const declinations = calculateDeclinations(jd)
    const obliquity = getMeanObliquity(jd)

    // Build equatorial positions
    const equatorialPositions = buildEquatorialPositions(positions, obliquity)

    // 3. Optionally calculate ACG lines and parans
    let acgLines: OptimizationInput['acgLines'] = []
    let parans: OptimizationInput['parans'] = []

    if (includeACGLines) {
      acgLines = calculateAllACGLines(jd, equatorialPositions)
    }

    if (includeParans) {
      const paranResult = calculateAllParans(equatorialPositions)
      parans = paranResult.points
    }

    // 4. Find optimal bands
    const optimizationInput: OptimizationInput = {
      declinations,
      positions: equatorialPositions,
      weights,
      acgLines,
      parans,
    }

    const optimizationResult = findOptimalBands(optimizationInput)

    // 5. Get latitude ranges for city queries
    const latitudeRanges = getQueryLatitudeRanges(optimizationResult.bands, 5)

    // Handle empty latitude ranges (no optimal bands found)
    if (latitudeRanges.length === 0) {
      return {
        vibeId: matchedVibeId,
        vibeName: matchedVibeName,
        weights,
        optimalLatitudes: [],
        bands: [],
        recommendations: [],
        metadata: {
          totalCitiesScored: 0,
          julianDay: jd,
          obliquity: Math.round(obliquity * 1000) / 1000,
        },
      }
    }

    // 6. Query cities in optimal latitude bands
    const cities: Array<CityData> = await ctx.runQuery(
      internal.calculations.vibes.queries.getCitiesInRangesInternal,
      {
        ranges: latitudeRanges,
        tiers,
        limitPerRange: Math.ceil((limit * 2) / latitudeRanges.length), // Get extra to allow for filtering
      },
    )

    // 7. Rank cities
    const rankedCities = rankCities(cities, optimizationInput, {
      tiers,
      minSafetyLevel,
      limit,
    })

    // 8. Return recommendations
    return {
      // Vibe info
      vibeId: matchedVibeId,
      vibeName: matchedVibeName,
      weights,

      // Optimization info
      optimalLatitudes: optimizationResult.optimalLatitudes.slice(0, 5),
      bands: optimizationResult.bands.slice(0, 5).map((b) => ({
        minLat: Math.round(b.minLat * 10) / 10,
        maxLat: Math.round(b.maxLat * 10) / 10,
        score: Math.round(b.score * 100) / 100,
        dominantPlanets: b.dominantPlanets.map((p) => PLANET_NAMES[p]),
      })),

      // Ranked cities
      recommendations: rankedCities.map((city) => ({
        cityId: city.cityId,
        name: city.name,
        country: city.country,
        latitude: Math.round(city.latitude * 100) / 100,
        longitude: Math.round(city.longitude * 100) / 100,
        tier: city.tier,
        score: Math.round(city.score * 100) / 100,
        highlights: city.highlights,
        safetyLevel: city.safetyLevel,
        breakdown: {
          zenith: Math.round(city.breakdown.zenith * 100) / 100,
          acg: Math.round(city.breakdown.acg * 100) / 100,
          paran: Math.round(city.breakdown.paran * 100) / 100,
        },
      })),

      // Metadata
      metadata: {
        totalCitiesScored: cities.length,
        julianDay: jd,
        obliquity: Math.round(obliquity * 1000) / 1000,
      },
    }
  },
})

/**
 * Get all available preset vibes.
 */
export const getPresetVibes = action({
  args: {},
  handler: async (_ctx) => {
    const { getAllVibes } = await import('./translator')

    const vibes = getAllVibes()

    return vibes.map((vibe) => ({
      id: vibe.id,
      name: vibe.name,
      description: vibe.description,
      keywords: vibe.keywords.slice(0, 5),
      primaryPlanets: vibe.primaryPlanets.map((p) => PLANET_NAMES[p]),
    }))
  },
})

/**
 * Get weights for a specific vibe ID.
 */
export const getVibeWeights = action({
  args: {
    vibeId: v.string(),
  },
  handler: async (_ctx, { vibeId }) => {
    const { getVibeById, DEFAULT_WEIGHTS, describeWeights } = await import('./translator')

    const vibe = getVibeById(vibeId)

    if (!vibe) {
      return {
        found: false,
        weights: DEFAULT_WEIGHTS,
        description: 'Default equal weights',
      }
    }

    return {
      found: true,
      vibeId: vibe.id,
      name: vibe.name,
      description: vibe.description,
      weights: vibe.weights,
      primaryPlanets: vibe.primaryPlanets.map((p) => PLANET_NAMES[p]),
      weightsDescription: describeWeights(vibe.weights),
    }
  },
})

/**
 * Blend multiple vibes together.
 */
export const blendVibesAction = action({
  args: {
    vibes: v.array(
      v.object({
        vibeId: v.string(),
        ratio: v.number(),
      }),
    ),
  },
  handler: async (_ctx, { vibes }) => {
    const { getVibeById, blendVibes, DEFAULT_WEIGHTS, describeWeights } =
      await import('./translator')

    // Resolve vibe IDs to categories
    const resolvedVibes: Array<{ vibe: VibeCategory; ratio: number }> = []

    for (const { vibeId, ratio } of vibes) {
      const vibe = getVibeById(vibeId)
      if (vibe) {
        resolvedVibes.push({ vibe, ratio })
      }
    }

    if (resolvedVibes.length === 0) {
      return {
        blended: false,
        weights: DEFAULT_WEIGHTS,
        description: 'No valid vibes found',
      }
    }

    // Blend the vibes
    const blendedWeights = blendVibes(resolvedVibes)

    return {
      blended: true,
      weights: blendedWeights,
      description: describeWeights(blendedWeights),
      inputVibes: vibes.map((item) => item.vibeId),
    }
  },
})
