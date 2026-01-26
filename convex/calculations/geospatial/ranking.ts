/**
 * City Ranking - Score and rank cities for relocation recommendations.
 *
 * Combines geospatial scoring with human-readable highlights to produce
 * actionable city recommendations.
 */

import { PLANET_NAMES } from '../core/types'
import { getSafetyLevel, meetsMinimumSafety } from '../safety/filter'
import { scoreLocation } from './optimizer'
import type {
  ACGLine,
  ParanPoint,
  PlanetDeclinations,
  PlanetId,
  PlanetWeights,
} from '../core/types'
import type { Id } from '../../_generated/dataModel'
import type { OptimizationInput } from './optimizer'

// =============================================================================
// Types
// =============================================================================

/** City data from the database */
export interface CityData {
  _id: Id<'cities'>
  name: string
  country: string
  latitude: number
  longitude: number
  tier: 'major' | 'medium' | 'minor' | 'small'
  population: number
}

/** Ranked city with scores and highlights */
export interface RankedCity {
  /** Database ID of the city */
  cityId: Id<'cities'>
  /** City name */
  name: string
  /** Country name */
  country: string
  /** City latitude */
  latitude: number
  /** City longitude */
  longitude: number
  /** City tier (major, medium, minor, small) */
  tier: 'major' | 'medium' | 'minor' | 'small'
  /** Combined score */
  score: number
  /** Human-readable highlight strings */
  highlights: Array<string>
  /** Safety level for quick display */
  safetyLevel: 'excellent' | 'good' | 'moderate' | 'challenging' | 'difficult'
  /** Score breakdown by category */
  breakdown: { zenith: number; acg: number; paran: number }
}

/** Options for city ranking */
export interface RankingOptions {
  /** Filter to specific city tiers */
  tiers?: Array<'major' | 'medium' | 'minor' | 'small'>
  /** Minimum safety level required */
  minSafetyLevel?: 'excellent' | 'good' | 'moderate' | 'challenging'
  /** Maximum number of cities to return */
  limit?: number
  /** Safety scores for each city (keyed by city ID string) */
  safetyScores?: Record<string, number>
}

// =============================================================================
// Constants
// =============================================================================

/** Zenith proximity threshold in degrees */
const ZENITH_HIGHLIGHT_ORB = 1.5

/** ACG line proximity threshold in degrees */
const ACG_HIGHLIGHT_ORB = 2.0

/** Paran proximity threshold in degrees */
const PARAN_HIGHLIGHT_ORB = 1.0

/** ACG line type display names */
const ACG_LINE_NAMES: Record<string, string> = {
  ASC: 'Ascendant',
  DSC: 'Descendant',
  MC: 'Midheaven',
  IC: 'Imum Coeli',
}

// =============================================================================
// Highlight Generation
// =============================================================================

/**
 * Generate human-readable highlights for a city.
 *
 * Checks for zenith proximity, ACG line proximity, and paran activity
 * to produce meaningful descriptions of why this location is significant.
 *
 * @param city - City data
 * @param input - Optimization input with declinations, ACG lines, etc.
 * @returns Array of highlight strings
 */
export function generateHighlights(city: CityData, input: OptimizationInput): Array<string> {
  const highlights: Array<string> = []
  const { declinations, weights, acgLines = [], parans = [] } = input

  // Check zenith proximity for each planet
  for (const [planet, declination] of Object.entries(declinations) as Array<[PlanetId, number]>) {
    const distance = Math.abs(city.latitude - declination)
    const weight = weights[planet]

    // Only highlight planets with meaningful weight
    if (distance <= ZENITH_HIGHLIGHT_ORB && weight >= 3) {
      const planetName = PLANET_NAMES[planet]
      if (distance < 0.5) {
        highlights.push(`${planetName} zenith passes directly over this latitude`)
      } else {
        highlights.push(`Near ${planetName} zenith line (${distance.toFixed(1)}° away)`)
      }
    }
  }

  // Check ACG line proximity
  for (const line of acgLines) {
    const weight = weights[line.planet]
    if (weight < 3) continue // Skip low-weight planets

    // Find closest point on this line
    let minDistance = Infinity
    for (const point of line.points) {
      // Simple distance calculation (good enough for highlight purposes)
      const latDiff = city.latitude - point.latitude
      const lonDiff = city.longitude - point.longitude
      const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff)
      if (distance < minDistance) {
        minDistance = distance
      }
    }

    if (minDistance <= ACG_HIGHLIGHT_ORB) {
      const planetName = PLANET_NAMES[line.planet]
      const lineName = ACG_LINE_NAMES[line.lineType] || line.lineType
      highlights.push(`Near ${planetName} ${lineName} line`)
    }
  }

  // Check paran activity
  const nearbyParans: Array<ParanPoint> = []
  for (const paran of parans) {
    const distance = Math.abs(city.latitude - paran.latitude)
    if (distance <= PARAN_HIGHLIGHT_ORB) {
      nearbyParans.push(paran)
    }
  }

  if (nearbyParans.length > 0) {
    // Group parans by involved planets
    const involvedPlanets = new Set<PlanetId>()
    for (const paran of nearbyParans) {
      involvedPlanets.add(paran.planet1)
      involvedPlanets.add(paran.planet2)
    }

    // Find the two highest-weighted involved planets
    const sortedPlanets = Array.from(involvedPlanets).sort((a, b) => weights[b] - weights[a])

    if (sortedPlanets.length >= 2) {
      const planet1 = PLANET_NAMES[sortedPlanets[0]]
      const planet2 = PLANET_NAMES[sortedPlanets[1]]
      highlights.push(`Active paran zone with ${planet1}-${planet2} interactions`)
    } else if (sortedPlanets.length === 1) {
      const planetName = PLANET_NAMES[sortedPlanets[0]]
      highlights.push(`Paran activity involving ${planetName}`)
    }
  }

  return highlights
}

// =============================================================================
// City Ranking
// =============================================================================

/**
 * Rank cities based on optimization criteria.
 *
 * Scores each city, generates highlights, and sorts by score descending.
 *
 * @param cities - Array of city data from database
 * @param input - Optimization input data
 * @param options - Ranking options (tiers, safety filter, limit)
 * @returns Array of ranked cities sorted by score
 */
export function rankCities(
  cities: Array<CityData>,
  input: OptimizationInput,
  options: RankingOptions = {},
): Array<RankedCity> {
  const { tiers, minSafetyLevel, limit, safetyScores = {} } = options

  // Pre-filter by tier if specified
  let filteredCities = cities
  if (tiers && tiers.length > 0) {
    filteredCities = filterByTierData(cities, tiers)
  }

  // Score and transform each city
  const rankedCities: Array<RankedCity> = []

  for (const city of filteredCities) {
    // Calculate location score
    const score = scoreLocation(city.latitude, city.longitude, input)

    // Get safety score if available, otherwise default to moderate
    const safetyScore = safetyScores[city._id.toString()] ?? 60
    const safetyLevel = getSafetyLevel(safetyScore)

    // Skip if doesn't meet minimum safety level
    if (minSafetyLevel && !meetsMinimumSafety(safetyScore, minSafetyLevel)) {
      continue
    }

    // Generate highlights
    const highlights = generateHighlights(city, input)

    rankedCities.push({
      cityId: city._id,
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
      tier: city.tier,
      score: score.total,
      highlights,
      safetyLevel,
      breakdown: {
        zenith: score.zenith,
        acg: score.acg,
        paran: score.paran,
      },
    })
  }

  // Sort by score descending
  rankedCities.sort((a, b) => b.score - a.score)

  // Apply limit if specified
  if (limit && limit > 0) {
    return rankedCities.slice(0, limit)
  }

  return rankedCities
}

// =============================================================================
// Filtering Functions
// =============================================================================

/**
 * Filter ranked cities by tier.
 *
 * @param cities - Array of ranked cities
 * @param tiers - Tiers to include
 * @returns Filtered array
 */
export function filterByTier(
  cities: Array<RankedCity>,
  tiers: Array<'major' | 'medium' | 'minor' | 'small'>,
): Array<RankedCity> {
  return cities.filter((city) => tiers.includes(city.tier))
}

/**
 * Filter city data by tier (before ranking).
 *
 * @param cities - Array of city data
 * @param tiers - Tiers to include
 * @returns Filtered array
 */
function filterByTierData(
  cities: Array<CityData>,
  tiers: Array<'major' | 'medium' | 'minor' | 'small'>,
): Array<CityData> {
  return cities.filter((city) => tiers.includes(city.tier))
}

/**
 * Filter ranked cities by safety level.
 *
 * @param cities - Array of ranked cities
 * @param minLevel - Minimum safety level required
 * @returns Filtered array
 */
export function filterBySafetyLevel(
  cities: Array<RankedCity>,
  minLevel: 'excellent' | 'good' | 'moderate' | 'challenging',
): Array<RankedCity> {
  const levels = ['excellent', 'good', 'moderate', 'challenging', 'difficult']
  const minIndex = levels.indexOf(minLevel)

  return cities.filter((city) => {
    const cityIndex = levels.indexOf(city.safetyLevel)
    return cityIndex <= minIndex
  })
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the top N cities by score.
 *
 * @param cities - Array of ranked cities
 * @param n - Number of cities to return
 * @returns Top N cities
 */
export function getTopCities(cities: Array<RankedCity>, n: number = 10): Array<RankedCity> {
  return cities.slice(0, n)
}

/**
 * Group ranked cities by country.
 *
 * @param cities - Array of ranked cities
 * @returns Map of country to cities
 */
export function groupByCountry(cities: Array<RankedCity>): Map<string, Array<RankedCity>> {
  const groups = new Map<string, Array<RankedCity>>()

  for (const city of cities) {
    const existing = groups.get(city.country) || []
    existing.push(city)
    groups.set(city.country, existing)
  }

  return groups
}

/**
 * Get summary statistics for ranked cities.
 *
 * @param cities - Array of ranked cities
 * @returns Summary statistics
 */
export function getRankingSummary(cities: Array<RankedCity>): {
  totalCities: number
  avgScore: number
  maxScore: number
  minScore: number
  byTier: Record<string, number>
  bySafetyLevel: Record<string, number>
} {
  if (cities.length === 0) {
    return {
      totalCities: 0,
      avgScore: 0,
      maxScore: 0,
      minScore: 0,
      byTier: {},
      bySafetyLevel: {},
    }
  }

  let totalScore = 0
  let maxScore = -Infinity
  let minScore = Infinity
  const byTier: Record<string, number> = {}
  const bySafetyLevel: Record<string, number> = {}

  for (const city of cities) {
    totalScore += city.score
    maxScore = Math.max(maxScore, city.score)
    minScore = Math.min(minScore, city.score)
    byTier[city.tier] = (byTier[city.tier] || 0) + 1
    bySafetyLevel[city.safetyLevel] = (bySafetyLevel[city.safetyLevel] || 0) + 1
  }

  return {
    totalCities: cities.length,
    avgScore: totalScore / cities.length,
    maxScore,
    minScore,
    byTier,
    bySafetyLevel,
  }
}
