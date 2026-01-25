/**
 * Geospatial Search - Find optimal locations based on celestial criteria.
 *
 * Combines zenith lines, paran points, and weighted scoring to identify
 * the best latitude bands for relocation.
 */

import { PLANET_IDS } from '../core/types'
import { DECLINATION_SIGMA, DEFAULT_DECLINATION_ORB } from '../core/constants'
import { gaussian } from '../core/math'
import { findZenithOverlaps } from '../acg/zenith'
import { calculateAllParans } from '../parans/solver'
import { greatCircleDistanceKm } from '../coordinates/transform'
import type {
  ACGLine,
  EquatorialCoordinates,
  GeospatialSearchResult,
  ParanPoint,
  PlanetDeclinations,
  PlanetId,
  PlanetWeights,
} from '../core/types'

// =============================================================================
// Types
// =============================================================================

/** A target latitude with associated data */
export interface LatitudeTarget {
  latitude: number
  score: number
  sources: Array<{
    type: 'zenith' | 'paran' | 'overlap'
    planets: Array<PlanetId>
    contribution: number
  }>
}

/** Search band result */
export interface SearchBand {
  minLat: number
  maxLat: number
  score: number
  dominantPlanets: Array<PlanetId>
  zenithPlanets: Array<PlanetId>
  paranCount: number
}

// =============================================================================
// Zenith-Based Search
// =============================================================================

/**
 * Calculate target latitudes based on zenith lines (declinations).
 *
 * @param declinations - Planet declinations
 * @param weights - Planet weights
 * @param orb - Orb for zenith bands
 * @returns Sorted array of target latitudes
 */
export function calculateZenithLatitudes(
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
  orb: number = DEFAULT_DECLINATION_ORB,
): Array<LatitudeTarget> {
  const targets: Array<LatitudeTarget> = []

  // Each planet's declination is a zenith latitude
  for (const planet of PLANET_IDS) {
    const weight = weights[planet]
    if (weight <= 0) continue

    const latitude = declinations[planet]

    targets.push({
      latitude,
      score: weight,
      sources: [
        {
          type: 'zenith',
          planets: [planet],
          contribution: weight,
        },
      ],
    })
  }

  // Check for overlaps (multiple planets at similar declinations)
  const overlaps = findZenithOverlaps(declinations, weights, orb)

  for (const overlap of overlaps) {
    // Find if we already have a target near this latitude
    const existingIndex = targets.findIndex((t) => Math.abs(t.latitude - overlap.latitude) < orb)

    if (existingIndex >= 0) {
      // Merge with existing target
      targets[existingIndex].score = Math.max(targets[existingIndex].score, overlap.combinedWeight)
      targets[existingIndex].sources.push({
        type: 'overlap',
        planets: overlap.planets,
        contribution: overlap.combinedWeight,
      })
    } else {
      // Add new overlap target
      targets.push({
        latitude: overlap.latitude,
        score: overlap.combinedWeight,
        sources: [
          {
            type: 'overlap',
            planets: overlap.planets,
            contribution: overlap.combinedWeight,
          },
        ],
      })
    }
  }

  // Sort by score descending
  targets.sort((a, b) => b.score - a.score)

  return targets
}

// =============================================================================
// Paran-Based Search
// =============================================================================

/**
 * Calculate target latitudes based on paran points.
 *
 * @param positions - Equatorial positions
 * @param weights - Planet weights
 * @returns Sorted array of paran-based targets
 */
export function calculateParanLatitudes(
  positions: Record<PlanetId, EquatorialCoordinates>,
  weights: PlanetWeights,
): Array<LatitudeTarget> {
  const result = calculateAllParans(positions)
  const targets: Array<LatitudeTarget> = []

  // Group parans by latitude (within 2° bands)
  const bandSize = 2
  const bands = new Map<number, Array<ParanPoint>>()

  for (const paran of result.points) {
    const bandCenter = Math.round(paran.latitude / bandSize) * bandSize

    if (!bands.has(bandCenter)) {
      bands.set(bandCenter, [])
    }
    bands.get(bandCenter)!.push(paran)
  }

  // Convert bands to targets
  for (const [latitude, parans] of bands) {
    // Calculate score based on weighted planet involvement
    let score = 0
    const planets = new Set<PlanetId>()

    for (const paran of parans) {
      planets.add(paran.planet1)
      planets.add(paran.planet2)

      // Add weighted contribution
      score += (weights[paran.planet1] + weights[paran.planet2]) * (paran.strength ?? 0.5)
    }

    targets.push({
      latitude,
      score,
      sources: [
        {
          type: 'paran',
          planets: Array.from(planets),
          contribution: score,
        },
      ],
    })
  }

  targets.sort((a, b) => b.score - a.score)

  return targets
}

// =============================================================================
// Combined Search
// =============================================================================

/**
 * Generate comprehensive search bands combining zenith and paran data.
 *
 * @param declinations - Planet declinations
 * @param positions - Equatorial positions
 * @param weights - Planet weights
 * @param tolerance - How close latitudes need to be to merge
 * @returns Complete geospatial search result
 */
export function generateSearchBands(
  declinations: PlanetDeclinations,
  positions: Record<PlanetId, EquatorialCoordinates>,
  weights: PlanetWeights,
  tolerance: number = 3,
): GeospatialSearchResult {
  // Get zenith-based targets
  const zenithTargets = calculateZenithLatitudes(declinations, weights)

  // Get paran-based targets
  const paranTargets = calculateParanLatitudes(positions, weights)

  // Merge all targets
  const allTargets: Array<LatitudeTarget> = [...zenithTargets]

  for (const paranTarget of paranTargets) {
    // Check if there's an existing target nearby
    const existingIndex = allTargets.findIndex(
      (t) => Math.abs(t.latitude - paranTarget.latitude) < tolerance,
    )

    if (existingIndex >= 0) {
      // Merge: add paran sources to existing target
      allTargets[existingIndex].score += paranTarget.score * 0.5 // Paran bonus
      allTargets[existingIndex].sources.push(...paranTarget.sources)
    } else {
      // Add as new target
      allTargets.push(paranTarget)
    }
  }

  // Sort by combined score
  allTargets.sort((a, b) => b.score - a.score)

  // Create search bands from top targets
  const bands: Array<SearchBand> = []
  const usedLatitudes = new Set<number>()

  for (const target of allTargets.slice(0, 20)) {
    // Skip if we've already covered this latitude
    const roundedLat = Math.round(target.latitude / 5) * 5
    if (usedLatitudes.has(roundedLat)) continue
    usedLatitudes.add(roundedLat)

    // Collect all planets involved
    const allPlanets = new Set<PlanetId>()
    const zenithPlanets = new Set<PlanetId>()
    let paranCount = 0

    for (const source of target.sources) {
      for (const planet of source.planets) {
        allPlanets.add(planet)
        if (source.type === 'zenith' || source.type === 'overlap') {
          zenithPlanets.add(planet)
        }
      }
      if (source.type === 'paran') {
        paranCount++
      }
    }

    bands.push({
      minLat: target.latitude - tolerance,
      maxLat: target.latitude + tolerance,
      score: target.score,
      dominantPlanets: Array.from(allPlanets),
      zenithPlanets: Array.from(zenithPlanets),
      paranCount,
    })
  }

  // Get paran result for summary
  const paranResult = calculateAllParans(positions)

  // Collect paran latitudes
  const paranLatitudes: Array<{ latitude: number; parans: Array<ParanPoint> }> = []
  const paranBands = new Map<number, Array<ParanPoint>>()

  for (const paran of paranResult.points) {
    const bandCenter = Math.round(paran.latitude / 2) * 2
    if (!paranBands.has(bandCenter)) {
      paranBands.set(bandCenter, [])
    }
    paranBands.get(bandCenter)!.push(paran)
  }

  for (const [lat, parans] of paranBands) {
    paranLatitudes.push({ latitude: lat, parans })
  }

  // Extract optimal latitudes (unique, sorted by importance)
  const optimalLatitudes = allTargets.slice(0, 10).map((t) => t.latitude)

  return {
    bands,
    paranLatitudes,
    optimalLatitudes,
  }
}

// =============================================================================
// Score a Specific Latitude
// =============================================================================

/**
 * Calculate the composite score for a specific latitude.
 *
 * @param latitude - Latitude to score
 * @param declinations - Planet declinations
 * @param weights - Planet weights
 * @param sigma - Gaussian sigma for distance scoring
 * @returns Score and breakdown
 */
export function scoreLatitude(
  latitude: number,
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
  sigma: number = DECLINATION_SIGMA,
): {
  score: number
  contributions: Array<{ planet: PlanetId; distance: number; contribution: number }>
} {
  let totalScore = 0
  const contributions: Array<{
    planet: PlanetId
    distance: number
    contribution: number
  }> = []

  for (const planet of PLANET_IDS) {
    const weight = weights[planet]
    if (weight <= 0) continue

    const distance = Math.abs(latitude - declinations[planet])
    const gaussianScore = gaussian(distance, 0, sigma)
    const contribution = weight * gaussianScore

    contributions.push({ planet, distance, contribution })
    totalScore += contribution
  }

  // Sort by contribution
  contributions.sort((a, b) => b.contribution - a.contribution)

  return { score: totalScore, contributions }
}

// =============================================================================
// ACG and Paran Proximity Scoring
// =============================================================================

/**
 * Calculate score based on proximity to ACG lines.
 * Uses great circle distance for accuracy.
 *
 * @param latitude - Target latitude
 * @param longitude - Target longitude
 * @param acgLines - Array of ACG lines
 * @param weights - Planet weights
 * @param orb - Maximum distance to consider (default: 2.0°)
 * @returns Score and contribution details
 */
export function scoreLocationForACG(
  latitude: number,
  longitude: number,
  acgLines: Array<ACGLine>,
  weights: PlanetWeights,
  orb: number = 2.0,
): {
  score: number
  contributions: Array<{
    planet: PlanetId
    lineType: string
    distance: number
  }>
  dominantPlanet?: PlanetId
} {
  let totalScore = 0
  const contributions: Array<{
    planet: PlanetId
    lineType: string
    distance: number
  }> = []

  let maxContribution = 0
  let dominantPlanet: PlanetId | undefined

  for (const line of acgLines) {
    let minDistance = Infinity

    // Find closest point on this line
    for (const point of line.points) {
      // Use great circle distance converted to angular degrees
      // Formula: angularDeg = (km / earthRadiusKm) * (180 / π)
      const distanceKm = greatCircleDistanceKm(latitude, longitude, point.latitude, point.longitude)
      const distance = (distanceKm / 6371) * (180 / Math.PI)

      if (distance < minDistance) {
        minDistance = distance
      }
    }

    // Score if within orb
    if (minDistance <= orb) {
      const weight = weights[line.planet]
      const proximityScore = (1 - minDistance / orb) * weight
      totalScore += proximityScore

      contributions.push({
        planet: line.planet,
        lineType: line.lineType,
        distance: minDistance,
      })

      // Track dominant planet
      if (proximityScore > maxContribution) {
        maxContribution = proximityScore
        dominantPlanet = line.planet
      }
    }
  }

  return { score: totalScore, contributions, dominantPlanet }
}

/**
 * Calculate score based on proximity to paran points.
 *
 * @param latitude - Target latitude
 * @param parans - Array of paran points
 * @param weights - Planet weights
 * @param orb - Maximum distance to consider (default: 1.0°)
 * @returns Score
 */
export function scoreParanProximity(
  latitude: number,
  parans: Array<ParanPoint>,
  weights: PlanetWeights,
  orb: number = 1.0,
): number {
  let totalScore = 0

  for (const paran of parans) {
    const distance = Math.abs(latitude - paran.latitude)
    if (distance <= orb) {
      const proximityScore = 1 - distance / orb
      const avgWeight = (weights[paran.planet1] + weights[paran.planet2]) / 2
      totalScore += proximityScore * avgWeight * (paran.strength ?? 1)
    }
  }

  return totalScore
}

// =============================================================================
// Find Optimal Latitude Range
// =============================================================================

/**
 * Find the optimal latitude within a range using golden section search.
 *
 * @param minLat - Minimum latitude
 * @param maxLat - Maximum latitude
 * @param declinations - Planet declinations
 * @param weights - Planet weights
 * @returns Optimal latitude and its score
 */
export function findOptimalLatitudeInRange(
  minLat: number,
  maxLat: number,
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
): { latitude: number; score: number } {
  const goldenRatio = (1 + Math.sqrt(5)) / 2
  const tolerance = 0.1

  let a = minLat
  let b = maxLat
  let c = b - (b - a) / goldenRatio
  let d = a + (b - a) / goldenRatio

  while (Math.abs(b - a) > tolerance) {
    const fc = scoreLatitude(c, declinations, weights).score
    const fd = scoreLatitude(d, declinations, weights).score

    if (fc > fd) {
      b = d
    } else {
      a = c
    }

    c = b - (b - a) / goldenRatio
    d = a + (b - a) / goldenRatio
  }

  const optimalLat = (a + b) / 2
  return {
    latitude: optimalLat,
    score: scoreLatitude(optimalLat, declinations, weights).score,
  }
}

// =============================================================================
// Latitude Band Detection
// =============================================================================

/**
 * Find continuous bands of high-scoring latitudes.
 *
 * @param declinations - Planet declinations
 * @param weights - Planet weights
 * @param threshold - Minimum score percentage to include (0-1)
 * @param stepSize - Sampling step in degrees
 * @returns Array of latitude bands
 */
export function findHighScoringBands(
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
  threshold: number = 0.5,
  stepSize: number = 0.5,
): Array<{ minLat: number; maxLat: number; avgScore: number }> {
  // Calculate scores for all latitudes
  const scores: Array<{ lat: number; score: number }> = []
  let maxScore = 0

  for (let lat = -70; lat <= 70; lat += stepSize) {
    const result = scoreLatitude(lat, declinations, weights)
    scores.push({ lat, score: result.score })
    if (result.score > maxScore) maxScore = result.score
  }

  // Normalize and find bands above threshold
  const thresholdScore = maxScore * threshold
  const bands: Array<{ minLat: number; maxLat: number; avgScore: number }> = []

  let bandStart: number | null = null
  let bandScoreSum = 0
  let bandCount = 0

  for (const { lat, score } of scores) {
    if (score >= thresholdScore) {
      if (bandStart === null) {
        bandStart = lat
        bandScoreSum = 0
        bandCount = 0
      }
      bandScoreSum += score
      bandCount++
    } else {
      if (bandStart !== null) {
        // End of band
        bands.push({
          minLat: bandStart,
          maxLat: lat - stepSize,
          avgScore: bandScoreSum / bandCount,
        })
        bandStart = null
      }
    }
  }

  // Handle final band
  if (bandStart !== null) {
    bands.push({
      minLat: bandStart,
      maxLat: 70,
      avgScore: bandScoreSum / bandCount,
    })
  }

  return bands
}
