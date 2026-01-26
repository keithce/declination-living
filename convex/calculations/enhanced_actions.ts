'use node'

/**
 * Enhanced Convex Actions for Celestial Sphere Engineering.
 *
 * Provides new endpoints for:
 * - Enhanced positions (with speeds, OOB detection)
 * - ACG lines
 * - Zenith lines
 * - Paran calculations
 * - Dignity scoring
 * - Vibe-based search
 * - Complete analysis pipeline
 */

import { v } from 'convex/values'
import { action } from '../_generated/server'
import { internal } from '../_generated/api'

import { generateCacheKey, hashWeights } from '../cache/analysisCache'
import { calculateAllPositions, calculateDeclinations, dateToJulianDay } from './ephemeris'
import { findOptimalLatitudes, getOptimalLatitudeBands } from './optimizer'

// Import new modules
import { PLANET_IDS } from './core/types'

// Import cache utilities
import { checkAllOOBStatus, getMeanObliquity } from './ephemeris/oob'
import { calculateAllZenithLines } from './acg/zenith'
import { calculateAllACGLines, findACGLinesNearLocation } from './acg/line_solver'
import { calculateAllParans, getStrongestParans } from './parans/solver'
import { calculateAllDignities, isDayChart, longitudeToSignPosition } from './dignity/calculator'
import { DEFAULT_WEIGHTS, getVibeById, matchVibeFromQuery } from './vibes/translator'
import { generateSearchBands } from './geospatial/search'
import { quickSafetyCheck } from './safety/filter'
import { planetDeclinationsValidator, planetWeightsValidator } from './validators'
import { eclipticToEquatorial } from './coordinates/transform'
import type { EquatorialCoordinates, PlanetId } from './core/types'

// =============================================================================
// Result Types
// =============================================================================

/** Enhanced declination with OOB status */
interface EnhancedDeclination {
  value: number
  isOOB: boolean
  oobDegrees: number | null
}

/** Dignity score for a planet */
interface DignityScore {
  total: number
  indicator: 'R' | 'E' | 'd' | 'f' | '-'
}

/** Zenith line result */
interface ZenithLineResult {
  planet: string
  latitude: number
  orbMin: number
  orbMax: number
}

/** Paran point result */
interface ParanResult {
  planet1: string
  event1: string
  planet2: string
  event2: string
  latitude: number
}

/** Paran summary counts */
interface ParanSummary {
  riseRise: number
  riseCulminate: number
  riseSet: number
  culminateCulminate: number
  culminateSet: number
  setSet: number
  total: number
}

/** Latitude optimization result */
interface LatitudeResult {
  latitude: number
  score: number
  dominantPlanet: string
}

/** Latitude band result */
interface LatitudeBand {
  min: number
  max: number
  dominantPlanet: string
}

/** Complete enhanced analysis result */
interface CompleteEnhancedResult {
  julianDay: number
  obliquity: number
  declinations: Record<string, EnhancedDeclination>
  optimalLatitudes: Array<LatitudeResult>
  latitudeBands: Array<LatitudeBand>
  zenithLines: Array<ZenithLineResult>
  parans: Array<ParanResult>
  paranSummary: ParanSummary
  dignities: Record<string, DignityScore>
  sect: 'day' | 'night'
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert ecliptic positions to equatorial coordinates for all planets.
 * This is the proper conversion - ecliptic longitude is NOT the same as Right Ascension.
 */
function buildEquatorialPositions(
  positions: ReturnType<typeof calculateAllPositions>,
  obliquity: number,
): Record<PlanetId, EquatorialCoordinates> {
  const equatorial = Object.fromEntries(
    PLANET_IDS.map((planet) => {
      const pos = positions[planet]
      const eq = eclipticToEquatorial(pos.longitude, pos.latitude, obliquity)
      return [planet, { ra: eq.rightAscension, dec: eq.declination }]
    }),
  ) as Record<PlanetId, EquatorialCoordinates>
  return equatorial
}

// =============================================================================
// Enhanced Position Actions
// =============================================================================

/**
 * Calculate enhanced positions with speeds, OOB status, and equatorial coordinates.
 */
export const calculateEnhancedPositions = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
  },
  handler: async (_ctx, { birthDate, birthTime }) => {
    const jd = dateToJulianDay(birthDate, birthTime)
    const positions = calculateAllPositions(jd)
    const declinations = calculateDeclinations(jd)
    const obliquity = getMeanObliquity(jd)

    // Check OOB status for all planets
    const oobStatus = checkAllOOBStatus(declinations, jd)

    // Build enhanced positions with equatorial coordinates
    const enhanced: Record<
      string,
      {
        longitude: number
        latitude: number
        declination: number
        ra: number
        isOOB: boolean
        oobDegrees: number | null
      }
    > = {}

    for (const planet of PLANET_IDS) {
      const pos = positions[planet]
      // Convert ecliptic to equatorial coordinates properly
      const eq = eclipticToEquatorial(pos.longitude, pos.latitude, obliquity)
      enhanced[planet] = {
        longitude: pos.longitude,
        latitude: pos.latitude,
        declination: pos.declination,
        ra: eq.rightAscension,
        isOOB: oobStatus[planet].isOOB,
        oobDegrees: oobStatus[planet].oobDegrees,
      }
    }

    return {
      positions: enhanced,
      julianDay: jd,
      obliquity,
    }
  },
})

// =============================================================================
// ACG Line Actions
// =============================================================================

/**
 * Calculate all ACG lines for a chart.
 */
export const calculateACGLinesAction = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
  },
  handler: async (_ctx, { birthDate, birthTime }) => {
    const jd = dateToJulianDay(birthDate, birthTime)
    const positions = calculateAllPositions(jd)
    const obliquity = getMeanObliquity(jd)

    // Build equatorial positions with proper ecliptic to equatorial conversion
    const equatorialPositions = buildEquatorialPositions(positions, obliquity)

    const lines = calculateAllACGLines(jd, equatorialPositions)

    // Simplify for transport (reduce point count)
    const simplifiedLines = lines.map((line) => ({
      planet: line.planet,
      lineType: line.lineType,
      isCircumpolar: line.isCircumpolar ?? false,
      // Sample every 5th point for reduced data transfer
      points: line.points
        .filter((_, i) => i % 5 === 0)
        .map((p) => ({
          lat: Math.round(p.latitude * 100) / 100,
          lon: Math.round(p.longitude * 100) / 100,
        })),
    }))

    return {
      lines: simplifiedLines,
      julianDay: jd,
      totalLines: lines.length,
    }
  },
})

/**
 * Find ACG lines near a specific location.
 */
export const findACGLinesNearLocationAction = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    orb: v.optional(v.number()),
  },
  handler: async (_ctx, { birthDate, birthTime, latitude, longitude, orb }) => {
    const jd = dateToJulianDay(birthDate, birthTime)
    const positions = calculateAllPositions(jd)
    const obliquity = getMeanObliquity(jd)

    // Build equatorial positions with proper ecliptic to equatorial conversion
    const equatorialPositions = buildEquatorialPositions(positions, obliquity)

    const allLines = calculateAllACGLines(jd, equatorialPositions)
    const nearbyLines = findACGLinesNearLocation({ latitude, longitude }, allLines, orb ?? 2)

    return nearbyLines.map((nl) => ({
      planet: nl.line.planet,
      lineType: nl.line.lineType,
      distance: Math.round(nl.minDistance * 100) / 100,
    }))
  },
})

// =============================================================================
// Zenith Line Actions
// =============================================================================

/**
 * Calculate zenith lines for all planets.
 */
export const calculateZenithLinesAction = action({
  args: {
    declinations: planetDeclinationsValidator,
    orb: v.optional(v.number()),
  },
  handler: async (_ctx, { declinations, orb }) => {
    const lines = calculateAllZenithLines(declinations, orb ?? 1)

    return lines.map((line) => ({
      planet: line.planet,
      declination: Math.round(line.declination * 100) / 100,
      orbMin: Math.round(line.orbMin * 100) / 100,
      orbMax: Math.round(line.orbMax * 100) / 100,
    }))
  },
})

// =============================================================================
// Paran Actions
// =============================================================================

/**
 * Calculate all parans for a chart.
 */
export const calculateParansAction = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    topN: v.optional(v.number()),
  },
  handler: async (_ctx, { birthDate, birthTime, topN }) => {
    const jd = dateToJulianDay(birthDate, birthTime)
    const positions = calculateAllPositions(jd)
    const obliquity = getMeanObliquity(jd)

    // Build equatorial positions with proper ecliptic to equatorial conversion
    const equatorialPositions = buildEquatorialPositions(positions, obliquity)

    const result = calculateAllParans(equatorialPositions)

    // Get strongest parans
    const strongest = getStrongestParans(result.points, topN ?? 20)

    return {
      parans: strongest.map((p) => ({
        planet1: p.planet1,
        event1: p.event1,
        planet2: p.planet2,
        event2: p.event2,
        latitude: Math.round(p.latitude * 100) / 100,
        strength: Math.round((p.strength ?? 0) * 100) / 100,
      })),
      summary: result.summary,
      julianDay: jd,
    }
  },
})

// =============================================================================
// Dignity Actions
// =============================================================================

/**
 * Calculate dignity scores for all planets.
 */
export const calculateDignitiesAction = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    ascendant: v.optional(v.number()), // For sect determination
  },
  handler: async (_ctx, { birthDate, birthTime, ascendant }) => {
    const jd = dateToJulianDay(birthDate, birthTime)
    const positions = calculateAllPositions(jd)

    // Build longitude map
    const longitudes: Record<PlanetId, number> = {} as Record<PlanetId, number>
    for (const planet of PLANET_IDS) {
      longitudes[planet] = positions[planet].longitude
    }

    // Determine sect (day/night chart)
    const isDay = ascendant ? isDayChart(longitudes.sun, ascendant) : true

    const dignities = calculateAllDignities(longitudes, isDay)

    // Return simplified dignity data
    return Object.fromEntries(
      PLANET_IDS.map((planet) => [
        planet,
        {
          total: dignities[planet].total,
          breakdown: dignities[planet].breakdown,
          signPosition: longitudeToSignPosition(longitudes[planet]),
        },
      ]),
    )
  },
})

// =============================================================================
// Vibe Search Actions
// =============================================================================

/**
 * Search by vibe/goal and return optimal locations.
 */
export const searchByVibeAction = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    vibeQuery: v.string(),
  },
  handler: async (_ctx, { birthDate, birthTime, vibeQuery }) => {
    const jd = dateToJulianDay(birthDate, birthTime)
    const declinations = calculateDeclinations(jd)

    // Match vibe from query
    const matchedVibe = matchVibeFromQuery(vibeQuery)

    if (!matchedVibe) {
      return {
        matched: false,
        vibeId: null,
        vibeName: null,
        weights: DEFAULT_WEIGHTS,
        optimalLatitudes: findOptimalLatitudes(declinations, DEFAULT_WEIGHTS, 10),
      }
    }

    // Use matched vibe weights
    const optimalLatitudes = findOptimalLatitudes(declinations, matchedVibe.weights, 10)

    return {
      matched: true,
      vibeId: matchedVibe.id,
      vibeName: matchedVibe.name,
      description: matchedVibe.description,
      primaryPlanets: matchedVibe.primaryPlanets,
      weights: matchedVibe.weights,
      optimalLatitudes,
    }
  },
})

/**
 * Get weights for a specific vibe ID.
 */
export const getVibeWeightsAction = action({
  args: {
    vibeId: v.string(),
  },
  handler: async (_ctx, { vibeId }) => {
    const vibe = getVibeById(vibeId)

    if (!vibe) {
      return { found: false, weights: DEFAULT_WEIGHTS }
    }

    return {
      found: true,
      name: vibe.name,
      description: vibe.description,
      weights: vibe.weights,
      primaryPlanets: vibe.primaryPlanets,
    }
  },
})

// =============================================================================
// Safety Check Actions
// =============================================================================

/**
 * Quick safety check for a location.
 */
export const checkLocationSafetyAction = action({
  args: {
    declinations: planetDeclinationsValidator,
    weights: planetWeightsValidator,
    latitude: v.number(),
  },
  handler: async (_ctx, { declinations, weights, latitude }) => {
    const safety = quickSafetyCheck(latitude, declinations, weights)

    return {
      hasRisks: safety.hasRisks,
      riskPlanets: safety.riskPlanets,
      benefits: safety.benefits,
    }
  },
})

// =============================================================================
// Complete Analysis Pipeline
// =============================================================================

/**
 * Complete enhanced analysis pipeline.
 *
 * Returns everything needed for the full visualization:
 * - Declinations with OOB status
 * - Optimal latitudes
 * - Latitude bands
 * - Zenith lines
 * - Top parans
 * - Dignity scores
 */
export const calculateCompleteEnhanced = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    weights: planetWeightsValidator,
    ascendant: v.optional(v.number()),
    anonymousUserId: v.optional(v.id('anonymousUsers')),
    userId: v.optional(v.id('users')),
  },
  handler: async (
    ctx,
    { birthDate, birthTime, timezone, weights, ascendant, anonymousUserId, userId },
  ) => {
    // Generate cache key
    const weightsHash = hashWeights(weights)
    const cacheKey = generateCacheKey(birthDate, birthTime, timezone, weightsHash, ascendant)

    // Check cache first
    const cachedResult = (await ctx.runQuery(internal.cache.analysisCache.getCachedResultInternal, {
      cacheKey,
    })) as CompleteEnhancedResult | null
    if (cachedResult !== null) {
      return cachedResult
    }

    const jd = dateToJulianDay(birthDate, birthTime)
    const positions = calculateAllPositions(jd)
    const declinations = calculateDeclinations(jd)
    const obliquity = getMeanObliquity(jd)

    // OOB status
    const oobStatus = checkAllOOBStatus(declinations, jd)

    // Optimal latitudes
    const optimalLatitudes = findOptimalLatitudes(declinations, weights, 20, 0.5)

    // Latitude bands
    const latitudeBands = getOptimalLatitudeBands(declinations, weights, 40)

    // Zenith lines
    const zenithLines = calculateAllZenithLines(declinations, 1)

    // Build equatorial positions with proper ecliptic to equatorial conversion
    const equatorialPositions = buildEquatorialPositions(positions, obliquity)

    // Build longitudes map for dignity calculation
    const longitudes = PLANET_IDS.reduce<Record<PlanetId, number>>(
      (acc, planet) => {
        acc[planet] = positions[planet].longitude
        return acc
      },
      {} as Record<PlanetId, number>,
    )

    // Top parans
    const paranResult = calculateAllParans(equatorialPositions)
    const topParans = getStrongestParans(paranResult.points, 10)

    // Dignity scores
    const isDay = ascendant ? isDayChart(longitudes.sun, ascendant) : true
    const dignities = calculateAllDignities(longitudes, isDay)

    // Simplified dignity output
    const dignityScores = Object.fromEntries(
      PLANET_IDS.map((planet) => [
        planet,
        {
          total: dignities[planet].total,
          indicator:
            dignities[planet].domicile > 0
              ? 'R'
              : dignities[planet].exaltation > 0
                ? 'E'
                : dignities[planet].detriment < 0
                  ? 'd'
                  : dignities[planet].fall < 0
                    ? 'f'
                    : '-',
        },
      ]),
    )

    const result = {
      // Basic data
      julianDay: jd,
      obliquity,

      // Declinations with OOB
      declinations: Object.fromEntries(
        PLANET_IDS.map((planet) => [
          planet,
          {
            value: declinations[planet],
            isOOB: oobStatus[planet].isOOB,
            oobDegrees: oobStatus[planet].oobDegrees,
          },
        ]),
      ),

      // Optimization results
      optimalLatitudes,
      latitudeBands,

      // Zenith lines
      zenithLines: zenithLines.map((z) => ({
        planet: z.planet,
        latitude: z.declination,
        orbMin: z.orbMin,
        orbMax: z.orbMax,
      })),

      // Top parans
      parans: topParans.map((p) => ({
        planet1: p.planet1,
        event1: p.event1,
        planet2: p.planet2,
        event2: p.event2,
        latitude: Math.round(p.latitude * 100) / 100,
      })),
      paranSummary: paranResult.summary,

      // Dignity scores
      dignities: dignityScores,

      // Metadata
      sect: isDay ? 'day' : 'night',
    }

    // Cache the result
    await ctx.runMutation(internal.cache.analysisCache.setCachedResultInternal, {
      cacheKey,
      inputHash: weightsHash,
      result,
      calculationType: 'full' as const,
      ...(userId ? { userId } : {}),
      ...(anonymousUserId ? { anonymousUserId } : {}),
    })

    return result
  },
})

// =============================================================================
// Geospatial Search Actions
// =============================================================================

/**
 * Generate comprehensive search bands combining zenith and paran data.
 */
export const generateSearchBandsAction = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    weights: planetWeightsValidator,
  },
  handler: async (_ctx, { birthDate, birthTime, weights }) => {
    const jd = dateToJulianDay(birthDate, birthTime)
    const positions = calculateAllPositions(jd)
    const declinations = calculateDeclinations(jd)
    const obliquity = getMeanObliquity(jd)

    // Build equatorial positions with proper ecliptic to equatorial conversion
    const equatorialPositions = buildEquatorialPositions(positions, obliquity)

    const result = generateSearchBands(declinations, equatorialPositions, weights)

    return {
      bands: result.bands.slice(0, 15).map((b) => ({
        minLat: Math.round(b.minLat * 10) / 10,
        maxLat: Math.round(b.maxLat * 10) / 10,
        score: Math.round(b.score * 100) / 100,
        dominantPlanets: b.dominantPlanets,
      })),
      optimalLatitudes: result.optimalLatitudes.slice(0, 10).map((l) => Math.round(l * 10) / 10),
      paranLatitudeCount: result.paranLatitudes.length,
    }
  },
})
