/**
 * Zenith Line calculations.
 *
 * A zenith line represents the latitude where a planet is directly overhead
 * at some point during the day. This occurs when the observer's latitude
 * equals the planet's declination.
 *
 * Zenith bands extend the concept with an orb, creating a band of latitudes
 * where the planet passes near the zenith.
 */

import { PLANET_IDS } from '../core/types'
import { DECLINATION_SIGMA, DEFAULT_DECLINATION_ORB } from '../core/constants'
import { clamp, gaussian } from '../core/math'
import type { PlanetDeclinations, PlanetId, PlanetWeights, ZenithLine } from '../core/types'

// =============================================================================
// Types
// =============================================================================

/** Zenith band with scoring information */
export interface ZenithBand {
  planet: PlanetId
  /** Center latitude (= declination) */
  centerLatitude: number
  /** Minimum latitude of the band */
  minLatitude: number
  /** Maximum latitude of the band */
  maxLatitude: number
  /** Orb used */
  orb: number
  /** Planet weight for scoring */
  weight: number
}

/** Score at a specific latitude from all zenith lines */
export interface ZenithScore {
  latitude: number
  totalScore: number
  contributions: Array<{
    planet: PlanetId
    distance: number
    contribution: number
  }>
}

// =============================================================================
// Zenith Line Calculation
// =============================================================================

/**
 * Calculate the zenith line for a planet.
 *
 * The zenith line is a horizontal band at latitude = declination,
 * with an orb extending above and below.
 *
 * @param planet - Planet ID
 * @param declination - Planet's declination in degrees
 * @param orb - Orb in degrees (default 1°)
 * @returns ZenithLine data
 */
export function calculateZenithLine(
  planet: PlanetId,
  declination: number,
  orb: number = DEFAULT_DECLINATION_ORB,
): ZenithLine {
  return {
    planet,
    declination,
    orbMin: declination - orb,
    orbMax: declination + orb,
  }
}

/**
 * Calculate zenith lines for all planets.
 *
 * @param declinations - Declinations for all planets
 * @param orb - Orb in degrees
 * @returns Array of zenith lines for all planets
 */
export function calculateAllZenithLines(
  declinations: PlanetDeclinations,
  orb: number = DEFAULT_DECLINATION_ORB,
): Array<ZenithLine> {
  return PLANET_IDS.map((planet) => calculateZenithLine(planet, declinations[planet], orb))
}

// =============================================================================
// Zenith Band Calculation
// =============================================================================

/**
 * Calculate zenith bands with weights for scoring.
 *
 * @param declinations - Declinations for all planets
 * @param weights - Planet weights for scoring
 * @param orb - Orb in degrees
 * @returns Array of zenith bands
 */
export function calculateZenithBands(
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
  orb: number = DEFAULT_DECLINATION_ORB,
): Array<ZenithBand> {
  return PLANET_IDS.map((planet) => ({
    planet,
    centerLatitude: declinations[planet],
    minLatitude: declinations[planet] - orb,
    maxLatitude: declinations[planet] + orb,
    orb,
    weight: weights[planet],
  }))
}

// =============================================================================
// Zenith Scoring
// =============================================================================

/**
 * Calculate the score for a latitude based on proximity to zenith lines.
 *
 * Uses Gaussian weighting: closer to the zenith (latitude = declination),
 * higher the score. The score drops off with distance.
 *
 * @param latitude - Latitude to score
 * @param zenithLines - Array of zenith lines
 * @param weights - Planet weights
 * @param sigma - Gaussian sigma (default 3°)
 * @returns Score and breakdown
 */
export function scoreLatitudeForZenith(
  latitude: number,
  zenithLines: Array<ZenithLine>,
  weights: PlanetWeights,
  sigma: number = DECLINATION_SIGMA,
): ZenithScore {
  const contributions: ZenithScore['contributions'] = []
  let totalScore = 0

  for (const zenith of zenithLines) {
    const distance = Math.abs(latitude - zenith.declination)
    const weight = weights[zenith.planet]

    // Gaussian falloff: e^(-(d²)/(2σ²))
    const gaussian_value = gaussian(distance, 0, sigma)
    const contribution = weight * gaussian_value

    contributions.push({
      planet: zenith.planet,
      distance,
      contribution,
    })

    totalScore += contribution
  }

  // Sort by contribution (highest first)
  contributions.sort((a, b) => b.contribution - a.contribution)

  return {
    latitude,
    totalScore,
    contributions,
  }
}

/**
 * Score multiple latitudes for zenith alignment.
 *
 * @param latitudes - Array of latitudes to score
 * @param declinations - Planet declinations
 * @param weights - Planet weights
 * @param sigma - Gaussian sigma
 * @returns Array of scores
 */
export function scoreLatitudesForZenith(
  latitudes: Array<number>,
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
  sigma: number = DECLINATION_SIGMA,
): Array<ZenithScore> {
  const zenithLines = calculateAllZenithLines(declinations)

  return latitudes.map((lat) => scoreLatitudeForZenith(lat, zenithLines, weights, sigma))
}

// =============================================================================
// Optimal Zenith Latitudes
// =============================================================================

/**
 * Find the optimal latitudes based on zenith line proximity.
 *
 * Samples latitudes from -90° to +90° and returns the highest scoring ones.
 *
 * @param declinations - Planet declinations
 * @param weights - Planet weights
 * @param topN - Number of top latitudes to return
 * @param stepSize - Sampling step in degrees
 * @returns Top N latitudes with scores
 */
export function findOptimalZenithLatitudes(
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
  topN: number = 10,
  stepSize: number = 0.5,
): Array<ZenithScore> {
  const zenithLines = calculateAllZenithLines(declinations)
  const scores: Array<ZenithScore> = []

  // Sample latitudes from -70 to +70 (habitable range)
  for (let lat = -70; lat <= 70; lat += stepSize) {
    scores.push(scoreLatitudeForZenith(lat, zenithLines, weights))
  }

  // Sort by score descending and return top N
  scores.sort((a, b) => b.totalScore - a.totalScore)
  return scores.slice(0, topN)
}

// =============================================================================
// Zenith Band Intersections
// =============================================================================

/**
 * Find latitudes where multiple zenith bands overlap.
 *
 * These are especially potent locations where multiple planets
 * pass near the zenith.
 *
 * @param declinations - Planet declinations
 * @param weights - Planet weights (only consider planets with weight > 0)
 * @param orb - Orb for overlap detection
 * @returns Array of overlap zones
 */
export function findZenithOverlaps(
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
  orb: number = DEFAULT_DECLINATION_ORB,
): Array<{
  latitude: number
  planets: Array<PlanetId>
  combinedWeight: number
}> {
  const activeBands = PLANET_IDS.filter((p) => weights[p] > 0).map((planet) => ({
    planet,
    center: declinations[planet],
    min: declinations[planet] - orb,
    max: declinations[planet] + orb,
    weight: weights[planet],
  }))

  const overlaps: Array<{
    latitude: number
    planets: Array<PlanetId>
    combinedWeight: number
  }> = []

  // Check each pair of bands for overlap
  for (let i = 0; i < activeBands.length; i++) {
    for (let j = i + 1; j < activeBands.length; j++) {
      const band1 = activeBands[i]
      const band2 = activeBands[j]

      // Check if bands overlap
      const overlapMin = Math.max(band1.min, band2.min)
      const overlapMax = Math.min(band1.max, band2.max)

      if (overlapMin <= overlapMax) {
        // Bands overlap - record the center of the overlap
        const overlapCenter = (overlapMin + overlapMax) / 2

        // Check if this overlap is already recorded (with other planets)
        const existing = overlaps.find((o) => Math.abs(o.latitude - overlapCenter) < orb)

        if (existing) {
          // Add planets to existing overlap
          if (!existing.planets.includes(band1.planet)) {
            existing.planets.push(band1.planet)
            existing.combinedWeight += band1.weight
          }
          if (!existing.planets.includes(band2.planet)) {
            existing.planets.push(band2.planet)
            existing.combinedWeight += band2.weight
          }
        } else {
          // Create new overlap entry
          overlaps.push({
            latitude: overlapCenter,
            planets: [band1.planet, band2.planet],
            combinedWeight: band1.weight + band2.weight,
          })
        }
      }
    }
  }

  // Sort by combined weight
  overlaps.sort((a, b) => b.combinedWeight - a.combinedWeight)

  return overlaps
}

// =============================================================================
// Visualization Helpers
// =============================================================================

/**
 * Generate points for rendering a zenith band on a globe.
 *
 * @param zenithLine - Zenith line data
 * @param longitudeStep - Step between longitude points
 * @returns Array of {lat, lon} points for rendering
 */
export function generateZenithBandPoints(
  zenithLine: ZenithLine,
  longitudeStep: number = 5,
): Array<{ lat: number; lon: number }> {
  const points: Array<{ lat: number; lon: number }> = []

  // Zenith bands are horizontal circles at constant latitude
  // We generate points along the center latitude
  for (let lon = -180; lon <= 180; lon += longitudeStep) {
    points.push({
      lat: zenithLine.declination,
      lon,
    })
  }

  return points
}

/**
 * Get color intensity for a zenith band based on planet weight.
 * Returns a value between 0 and 1 for use in visualization.
 *
 * @param zenithLine - Zenith line
 * @param weights - Planet weights
 * @param maxWeight - Maximum possible weight (for normalization)
 * @returns Intensity value 0-1
 */
export function getZenithBandIntensity(
  zenithLine: ZenithLine,
  weights: PlanetWeights,
  maxWeight: number = 10,
): number {
  const weight = weights[zenithLine.planet]
  return clamp(weight / maxWeight, 0, 1)
}
