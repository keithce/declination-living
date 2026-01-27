'use node'

/**
 * ACG and Zenith Calculation Actions
 *
 * Provides cached calculation of ACG lines and zenith lines.
 * Results are cached for 24 hours to optimize performance.
 */

import { v } from 'convex/values'
import { ActionCache } from '@convex-dev/action-cache'
import { action, internalAction } from '../../_generated/server'
import { components, internal } from '../../_generated/api'
import { DEFAULT_DECLINATION_ORB, MEAN_OBLIQUITY_J2000 } from '../core/constants'
import { PLANET_IDS } from '../core/types'
import { calculateAllPositions, dateToJulianDay } from '../ephemeris'
import { eclipticToEquatorial } from '../coordinates/transform'
import { calculateAllACGLines } from './line_solver'
import { calculateAllZenithLines } from './zenith'
import type { ACGLine, EquatorialCoordinates, PlanetId, ZenithLine } from '../core/types'

/**
 * Validator for equatorial coordinates
 */
const equatorialCoordinatesValidator = v.object({
  ra: v.number(),
  dec: v.number(),
  distance: v.optional(v.number()),
})

/**
 * Validator for all planet positions - derived from PLANET_IDS for single source of truth
 */
const planetPositionsValidator = v.object(
  Object.fromEntries(PLANET_IDS.map((id) => [id, equatorialCoordinatesValidator])) as Record<
    (typeof PLANET_IDS)[number],
    typeof equatorialCoordinatesValidator
  >,
)

/**
 * Generate a cache key for ACG/zenith calculations
 */
function generateACGCacheKey(args: {
  julianDay: number
  positions: Record<PlanetId, EquatorialCoordinates>
  orb?: number
}): string {
  // Create a deterministic key from Julian Day, positions, and orb
  const orb = args.orb ?? DEFAULT_DECLINATION_ORB

  // Use Julian Day as primary key component
  const jdStr = args.julianDay.toFixed(6)

  // Hash the positions (using RA and Dec only, ignore distance)
  let posHash = 0

  for (const planet of PLANET_IDS) {
    const pos = args.positions[planet]
    const ra = Math.round(pos.ra * 1000) // 0.001° precision
    const dec = Math.round(pos.dec * 1000)

    // Simple hash combining
    posHash = (posHash * 31 + ra) >>> 0
    posHash = (posHash * 31 + dec) >>> 0
  }

  const orbStr = orb.toFixed(2)
  return `acg_${jdStr}_${posHash.toString(36)}_${orbStr}`
}

/**
 * Extract declinations from planet positions
 */
function extractDeclinations(
  positions: Record<PlanetId, EquatorialCoordinates>,
): Record<PlanetId, number> {
  const declinations: Partial<Record<PlanetId, number>> = {}

  for (const planet of PLANET_IDS) {
    declinations[planet] = positions[planet].dec
  }

  return declinations as Record<PlanetId, number>
}

/**
 * Return type for ACG and Zenith calculation
 */
type ACGAndZenithResult = {
  acgLines: Array<ACGLine>
  zenithLines: Array<ZenithLine>
}

/**
 * Type guard for ACGAndZenithResult
 */
function isValidACGAndZenithResult(value: unknown): value is ACGAndZenithResult {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return Array.isArray(obj.acgLines) && Array.isArray(obj.zenithLines)
}

/**
 * Calculate ACG lines and zenith lines with caching.
 *
 * @param julianDay - Julian Day for GMST calculation
 * @param positions - Equatorial positions for all planets
 * @param orb - Orb for zenith bands (default: 1.0°)
 * @returns ACG lines and zenith lines
 */
export const calculateACGAndZenith = internalAction({
  args: {
    julianDay: v.number(),
    positions: planetPositionsValidator,
    orb: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<ACGAndZenithResult> => {
    const orb = args.orb ?? DEFAULT_DECLINATION_ORB

    // 1. Generate cache key
    const cacheKey = generateACGCacheKey(args)

    // 2. Check cache
    const cached = await ctx.runQuery(internal.cache.analysisCache.getCachedResultInternal, {
      cacheKey,
    })

    if (cached && isValidACGAndZenithResult(cached)) {
      return cached
    }

    // 3. Calculate if not cached
    const declinations = extractDeclinations(args.positions)

    const acgLines = calculateAllACGLines(args.julianDay, args.positions)
    const zenithLines = calculateAllZenithLines(declinations, orb)

    const result: ACGAndZenithResult = {
      acgLines,
      zenithLines,
    }

    // 4. Cache result (24h TTL set by analysisCache)
    // Generate input hash for cache
    const inputHash = `jd:${args.julianDay.toFixed(6)}_orb:${orb.toFixed(2)}`

    await ctx.runMutation(internal.cache.analysisCache.setCachedResultInternal, {
      cacheKey,
      inputHash,
      result,
      calculationType: 'acg',
    })

    return result
  },
})

// =============================================================================
// Public ACG Calculation (Cached)
// =============================================================================

// 30-day TTL in milliseconds
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/** Result type for public ACG calculation */
interface ACGPublicResult {
  julianDay: number
  acgLines: Array<ACGLine>
  zenithLines: Array<ZenithLine>
}

/**
 * Calculate ACG lines from birth data (uncached internal action).
 * @internal Used by ActionCache - do not call directly.
 */
export const calculateACGAndZenithFromBirthDataUncached = internalAction({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    orb: v.optional(v.number()),
  },
  handler: async (_ctx, { birthDate, birthTime, timezone, orb }): Promise<ACGPublicResult> => {
    const effectiveOrb = orb ?? DEFAULT_DECLINATION_ORB

    // 1. Calculate Julian Day and positions
    const jd = dateToJulianDay(birthDate, birthTime, timezone)
    const positions = calculateAllPositions(jd)

    // 2. Convert from ecliptic to equatorial coordinates
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

    // 3. Extract declinations for zenith calculation
    const declinations: Record<PlanetId, number> = {} as Record<PlanetId, number>
    for (const planet of PLANET_IDS) {
      declinations[planet] = equatorialPositions[planet].dec
    }

    // 4. Calculate ACG lines and zenith lines
    const acgLines = calculateAllACGLines(jd, equatorialPositions)
    const zenithLines = calculateAllZenithLines(declinations, effectiveOrb)

    return {
      julianDay: jd,
      acgLines,
      zenithLines,
    }
  },
})

/** Cache for public ACG calculations */
const acgPublicCache = new ActionCache(components.actionCache, {
  action: internal.calculations.acg.actions.calculateACGAndZenithFromBirthDataUncached,
  name: 'calculateACGFromBirthData:v1',
  ttl: THIRTY_DAYS_MS,
})

/**
 * Calculate ACG lines from birth data (cached, 30-day TTL).
 *
 * Public action for frontend access. Computes planetary positions
 * from birth data and calculates ACG lines.
 *
 * @param birthDate - Birth date in YYYY-MM-DD format
 * @param birthTime - Birth time in HH:MM format
 * @param timezone - IANA timezone string
 * @param orb - Orb in degrees for zenith bands (default: 1.0)
 * @returns ACG lines, zenith lines, and Julian Day
 */
export const calculateACGAndZenithPublic = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    orb: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<ACGPublicResult> => {
    return acgPublicCache.fetch(ctx, args)
  },
})
