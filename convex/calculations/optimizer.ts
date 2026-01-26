/**
 * Location scoring and optimization
 * Calculates how well a given latitude aligns with planetary declinations
 */

import { PLANET_IDS } from './core/types'
import type { PlanetDeclinations } from './ephemeris'

export interface PlanetWeights {
  sun: number
  moon: number
  mercury: number
  venus: number
  mars: number
  jupiter: number
  saturn: number
  uranus: number
  neptune: number
  pluto: number
}

export interface LatitudeScore {
  latitude: number
  score: number
  dominantPlanet: string
  alignments: Array<{
    planet: string
    declination: number
    distance: number
    contribution: number
  }>
}

export interface CityScore {
  cityId: string
  latitude: number
  score: number
  dominantPlanet: string
}

// Use canonical PLANET_IDS from core/types

/**
 * Calculate alignment score for a given latitude
 * Uses a Gaussian-like decay based on distance from declination
 *
 * The closer a latitude is to a planet's declination, the higher the score
 * Maximum possible score per planet (at exact match) = 1.0 * weight
 */
export function calculateAlignmentScore(
  latitude: number,
  declination: number,
  weight: number,
): number {
  if (weight === 0) return 0

  // Distance in degrees
  const distance = Math.abs(latitude - declination)

  // Gaussian decay with sigma = 3 degrees (steep falloff)
  // At 3° distance, score is ~37% of max
  // At 6° distance, score is ~5% of max
  // At 10° distance, score is negligible
  const sigma = 3
  const score = Math.exp(-(distance * distance) / (2 * sigma * sigma))

  return score * weight
}

/**
 * Calculate total score for a latitude against all planetary declinations
 */
export function calculateLatitudeScore(
  latitude: number,
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
): LatitudeScore {
  const alignments: LatitudeScore['alignments'] = []
  let totalScore = 0
  let maxContribution = 0
  let dominantPlanet = 'sun'

  for (const planet of PLANET_IDS) {
    const declination = declinations[planet]
    const weight = weights[planet]

    if (weight === 0) continue

    const distance = Math.abs(latitude - declination)
    const contribution = calculateAlignmentScore(latitude, declination, weight)

    alignments.push({
      planet,
      declination,
      distance,
      contribution,
    })

    totalScore += contribution

    if (contribution > maxContribution) {
      maxContribution = contribution
      dominantPlanet = planet
    }
  }

  // Normalize score to 0-100 range
  // Max possible score = sum of all weights (if all planets aligned at this latitude)
  const maxPossibleScore = Object.values(weights).reduce((a, b) => a + b, 0)
  const normalizedScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0

  return {
    latitude,
    score: Math.round(normalizedScore * 100) / 100,
    dominantPlanet,
    alignments: alignments.sort((a, b) => b.contribution - a.contribution),
  }
}

/**
 * Find optimal latitudes by sampling the entire range
 * Returns top N latitudes sorted by score
 */
export function findOptimalLatitudes(
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
  topN: number = 10,
  stepSize: number = 1,
): Array<LatitudeScore> {
  const scores: Array<LatitudeScore> = []

  // Sample latitudes from -70 to 70 (most inhabited regions)
  for (let lat = -70; lat <= 70; lat += stepSize) {
    scores.push(calculateLatitudeScore(lat, declinations, weights))
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score)

  return scores.slice(0, topN)
}

/**
 * Calculate scores for a list of cities
 */
export function scoreCities(
  cities: Array<{ id: string; latitude: number }>,
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
): Array<CityScore> {
  return cities
    .map((city) => {
      const result = calculateLatitudeScore(city.latitude, declinations, weights)
      return {
        cityId: city.id,
        latitude: city.latitude,
        score: result.score,
        dominantPlanet: result.dominantPlanet,
      }
    })
    .sort((a, b) => b.score - a.score)
}

/**
 * Get the latitude bands that are most optimal
 * Returns ranges of latitudes that have high scores
 */
export function getOptimalLatitudeBands(
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
  threshold: number = 50, // minimum score percentage
): Array<{ min: number; max: number; dominantPlanet: string }> {
  const bands: Array<{ min: number; max: number; dominantPlanet: string }> = []
  let currentBand: { min: number; max: number; dominantPlanet: string } | null = null

  for (let lat = -70; lat <= 70; lat += 0.5) {
    const score = calculateLatitudeScore(lat, declinations, weights)

    if (score.score >= threshold) {
      if (!currentBand) {
        currentBand = {
          min: lat,
          max: lat,
          dominantPlanet: score.dominantPlanet,
        }
      } else {
        currentBand.max = lat
      }
    } else if (currentBand) {
      bands.push(currentBand)
      currentBand = null
    }
  }

  if (currentBand) {
    bands.push(currentBand)
  }

  return bands
}
