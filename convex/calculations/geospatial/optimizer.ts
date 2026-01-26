/**
 * Geospatial Optimizer - Orchestration layer for location optimization.
 *
 * Wraps existing search.ts functions with a higher-level API focused on
 * finding optimal locations based on celestial criteria.
 */

import {
  generateSearchBands,
  scoreLatitude,
  scoreLocationForACG,
  scoreParanProximity,
} from './search'
import type { SearchBand } from './search'
import type {
  ACGLine,
  EquatorialCoordinates,
  ParanPoint,
  PlanetDeclinations,
  PlanetId,
  PlanetWeights,
} from '../core/types'

// =============================================================================
// Types
// =============================================================================

/** Input data for optimization calculations */
export interface OptimizationInput {
  /** Planet declinations (derived from birth moment) */
  declinations: PlanetDeclinations
  /** Equatorial positions for each planet */
  positions: Record<PlanetId, EquatorialCoordinates>
  /** Planet weights from vibe/user preferences */
  weights: PlanetWeights
  /** Optional ACG lines for line proximity scoring */
  acgLines?: Array<ACGLine>
  /** Optional paran points for paran proximity scoring */
  parans?: Array<ParanPoint>
}

/** Result from findOptimalBands */
export interface OptimizationResult {
  /** High-scoring latitude bands */
  bands: Array<SearchBand>
  /** Top optimal latitudes by combined score */
  optimalLatitudes: Array<number>
  /** Latitudes grouped by paran activity */
  paranLatitudes: Array<{ latitude: number; parans: Array<ParanPoint> }>
}

/** Score breakdown for a specific location */
export interface LocationScore {
  /** Total combined score */
  total: number
  /** Score from zenith proximity */
  zenith: number
  /** Score from ACG line proximity */
  acg: number
  /** Score from paran proximity */
  paran: number
  /** Planets contributing most to the score */
  dominantPlanets: Array<PlanetId>
}

// =============================================================================
// Optimal Band Finding
// =============================================================================

/**
 * Find optimal latitude bands by combining zenith and paran data.
 *
 * Wraps generateSearchBands() with validation and provides a cleaner API.
 *
 * @param input - Optimization input data
 * @returns Optimization result with bands, optimal latitudes, and paran info
 */
export function findOptimalBands(input: OptimizationInput): OptimizationResult {
  const { declinations, positions, weights } = input

  // Generate search bands using existing function
  const searchResult = generateSearchBands(declinations, positions, weights)

  return {
    bands: searchResult.bands,
    optimalLatitudes: searchResult.optimalLatitudes,
    paranLatitudes: searchResult.paranLatitudes,
  }
}

// =============================================================================
// Location Scoring
// =============================================================================

/**
 * Calculate a comprehensive score for a specific location.
 *
 * Combines zenith proximity, ACG line proximity, and paran proximity
 * into a single score with breakdown.
 *
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param input - Optimization input data
 * @returns Score breakdown for the location
 */
export function scoreLocation(
  latitude: number,
  longitude: number,
  input: OptimizationInput,
): LocationScore {
  const { declinations, weights, acgLines = [], parans = [] } = input

  // Calculate zenith proximity score
  const zenithResult = scoreLatitude(latitude, declinations, weights)

  // Calculate ACG line proximity score
  const acgResult = scoreLocationForACG(latitude, longitude, acgLines, weights)

  // Calculate paran proximity score
  const paranScore = scoreParanProximity(latitude, parans, weights)

  // Collect dominant planets from all sources
  const dominantPlanets = new Set<PlanetId>()

  // Add top contributors from zenith scoring
  if (zenithResult.contributions.length > 0) {
    dominantPlanets.add(zenithResult.contributions[0].planet)
    if (zenithResult.contributions.length > 1 && zenithResult.contributions[1].contribution > 0) {
      dominantPlanets.add(zenithResult.contributions[1].planet)
    }
  }

  // Add ACG dominant planet if present
  if (acgResult.dominantPlanet) {
    dominantPlanets.add(acgResult.dominantPlanet)
  }

  return {
    total: zenithResult.score + acgResult.score + paranScore,
    zenith: zenithResult.score,
    acg: acgResult.score,
    paran: paranScore,
    dominantPlanets: Array.from(dominantPlanets),
  }
}

// =============================================================================
// Batch Scoring
// =============================================================================

/**
 * Score multiple locations at once.
 *
 * Useful for scoring a list of cities against the same optimization criteria.
 *
 * @param locations - Array of lat/lon pairs to score
 * @param input - Optimization input data
 * @returns Array of scores in the same order as input locations
 */
export function scoreLocations(
  locations: Array<{ latitude: number; longitude: number }>,
  input: OptimizationInput,
): Array<LocationScore> {
  return locations.map((loc) => scoreLocation(loc.latitude, loc.longitude, input))
}

// =============================================================================
// Latitude Band Queries
// =============================================================================

/**
 * Check if a latitude falls within any optimal band.
 *
 * @param latitude - Latitude to check
 * @param bands - Array of search bands
 * @returns True if latitude is within any band
 */
export function isInOptimalBand(latitude: number, bands: Array<SearchBand>): boolean {
  return bands.some((band) => latitude >= band.minLat && latitude <= band.maxLat)
}

/**
 * Find the best matching band for a latitude.
 *
 * @param latitude - Latitude to check
 * @param bands - Array of search bands
 * @returns The highest-scoring band containing this latitude, or undefined
 */
export function findBestBand(latitude: number, bands: Array<SearchBand>): SearchBand | undefined {
  const matchingBands = bands.filter((band) => latitude >= band.minLat && latitude <= band.maxLat)

  if (matchingBands.length === 0) return undefined

  // Return highest scoring band
  return matchingBands.reduce((best, current) => (current.score > best.score ? current : best))
}

/**
 * Get latitude ranges suitable for database queries.
 *
 * Extracts min/max latitude pairs from top bands for use with
 * database index queries (e.g., by_tier_latitude).
 *
 * @param bands - Array of search bands
 * @param maxBands - Maximum number of bands to return (default: 5)
 * @returns Array of latitude ranges
 */
export function getQueryLatitudeRanges(
  bands: Array<SearchBand>,
  maxBands: number = 5,
): Array<{ min: number; max: number }> {
  // Sort by score and take top bands
  const topBands = [...bands].sort((a, b) => b.score - a.score).slice(0, maxBands)

  return topBands.map((band) => ({
    min: band.minLat,
    max: band.maxLat,
  }))
}
