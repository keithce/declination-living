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

import { calculateAllPositions, calculateDeclinations, dateToJulianDay } from './ephemeris'
import { findOptimalLatitudes, getOptimalLatitudeBands } from './optimizer'

// Import new modules
import { PLANET_IDS } from './core/types'
import { checkAllOOBStatus, getMeanObliquity } from './ephemeris/oob'
import { calculateAllZenithLines } from './acg/zenith'
import { calculateAllACGLines, findACGLinesNearLocation } from './acg/line_solver'
import { calculateAllParans, getStrongestParans } from './parans/solver'
import { calculateAllDignities, isDayChart, longitudeToSignPosition } from './dignity/calculator'
import { DEFAULT_WEIGHTS, getVibeById, matchVibeFromQuery } from './vibes/translator'
import { generateSearchBands } from './geospatial/search'
import { quickSafetyCheck } from './safety/filter'
import type { EquatorialCoordinates, PlanetId } from './core/types'

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

const planetDeclinationsValidator = v.object({
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
      enhanced[planet] = {
        longitude: pos.longitude,
        latitude: pos.latitude,
        declination: pos.declination,
        // Calculate RA from longitude (simplified - assumes small latitude)
        ra: pos.longitude, // This is approximate; proper conversion is in geocentric module
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

    // Build equatorial positions for ACG calculation
    const equatorialPositions: Record<PlanetId, EquatorialCoordinates> = {} as Record<
      PlanetId,
      EquatorialCoordinates
    >

    for (const planet of PLANET_IDS) {
      const pos = positions[planet]
      equatorialPositions[planet] = {
        ra: pos.longitude, // Simplified - proper RA conversion needed
        dec: pos.declination,
      }
    }

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

    const equatorialPositions: Record<PlanetId, EquatorialCoordinates> = {} as Record<
      PlanetId,
      EquatorialCoordinates
    >

    for (const planet of PLANET_IDS) {
      const pos = positions[planet]
      equatorialPositions[planet] = {
        ra: pos.longitude,
        dec: pos.declination,
      }
    }

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

    const equatorialPositions: Record<PlanetId, EquatorialCoordinates> = {} as Record<
      PlanetId,
      EquatorialCoordinates
    >

    for (const planet of PLANET_IDS) {
      const pos = positions[planet]
      equatorialPositions[planet] = {
        ra: pos.longitude,
        dec: pos.declination,
      }
    }

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
  },
  handler: async (_ctx, { birthDate, birthTime, weights, ascendant }) => {
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

    // Build equatorial positions for parans
    const equatorialPositions: Record<PlanetId, EquatorialCoordinates> = {} as Record<
      PlanetId,
      EquatorialCoordinates
    >
    const longitudes: Record<PlanetId, number> = {} as Record<PlanetId, number>

    for (const planet of PLANET_IDS) {
      const pos = positions[planet]
      equatorialPositions[planet] = {
        ra: pos.longitude,
        dec: pos.declination,
      }
      longitudes[planet] = pos.longitude
    }

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

    return {
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

    const equatorialPositions: Record<PlanetId, EquatorialCoordinates> = {} as Record<
      PlanetId,
      EquatorialCoordinates
    >

    for (const planet of PLANET_IDS) {
      const pos = positions[planet]
      equatorialPositions[planet] = {
        ra: pos.longitude,
        dec: pos.declination,
      }
    }

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
