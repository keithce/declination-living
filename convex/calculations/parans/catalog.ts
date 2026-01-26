/**
 * Paran Catalog Generator
 *
 * Generates complete paran catalogs for all planet pairs and event combinations.
 * - 45 unique planet pairs (10 choose 2)
 * - 16 event combinations per pair (4 × 4)
 * - ~720 total paran searches
 */

import { PLANET_IDS } from '../core/types'
import { PARAN_STRENGTH_THRESHOLD } from '../core/constants'
import { findAllParansForPair } from './bisection'
import type { AngularEvent, ParanPoint, ParanResult, PlanetId } from '../core/types'
import type { PlanetData } from './bisection'

// =============================================================================
// Types
// =============================================================================

export interface PlanetPosition {
  planetId: PlanetId
  ra: number
  dec: number
}

// =============================================================================
// Main Catalog Generation
// =============================================================================

/**
 * Find all parans for a set of planetary positions.
 *
 * Iterates through all unique planet pairs (45) and all event combinations (16)
 * to build a complete paran catalog.
 *
 * @param positions - Array of planet positions with RA and Dec
 * @param strengthThreshold - Minimum strength to include (default: 0.5)
 * @returns Complete ParanResult with all parans and summary
 */
export function findAllParans(
  positions: Array<PlanetPosition>,
  strengthThreshold: number = PARAN_STRENGTH_THRESHOLD,
): ParanResult {
  const points: Array<ParanPoint> = []

  // Summary counters
  let riseRise = 0
  let riseCulminate = 0
  let riseSet = 0
  let culminateCulminate = 0
  let culminateSet = 0
  let setSet = 0

  // Build position map for quick lookup
  const positionMap = new Map<PlanetId, PlanetData>()
  for (const pos of positions) {
    positionMap.set(pos.planetId, {
      planetId: pos.planetId,
      ra: pos.ra,
      dec: pos.dec,
    })
  }

  // Iterate through all unique planet pairs
  for (let i = 0; i < PLANET_IDS.length; i++) {
    for (let j = i + 1; j < PLANET_IDS.length; j++) {
      const planet1Id = PLANET_IDS[i]
      const planet2Id = PLANET_IDS[j]

      const planet1 = positionMap.get(planet1Id)
      const planet2 = positionMap.get(planet2Id)

      if (!planet1 || !planet2) {
        continue
      }

      // Find all parans for this pair
      const pairParans = findAllParansForPair(planet1, planet2)

      // Convert to ParanPoint format and filter by strength
      for (const paran of pairParans) {
        if (paran.strength < strengthThreshold) {
          continue
        }

        const point: ParanPoint = {
          planet1: planet1Id,
          event1: paran.event1.event,
          planet2: planet2Id,
          event2: paran.event2.event,
          latitude: paran.latitude,
          strength: paran.strength,
        }

        points.push(point)

        // Update summary counters
        const e1 = point.event1
        const e2 = point.event2
        updateSummaryCount(e1, e2, {
          riseRise: () => riseRise++,
          riseCulminate: () => riseCulminate++,
          riseSet: () => riseSet++,
          culminateCulminate: () => culminateCulminate++,
          culminateSet: () => culminateSet++,
          setSet: () => setSet++,
        })
      }
    }
  }

  // Sort by strength (strongest first)
  points.sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0))

  return {
    points,
    summary: {
      riseRise,
      riseCulminate,
      riseSet,
      culminateCulminate,
      culminateSet,
      setSet,
      total: points.length,
    },
  }
}

/**
 * Helper to categorize event pairs for summary.
 *
 * Categories:
 * - riseRise: rise + rise
 * - riseCulminate: rise + (culminate | anti_culminate)
 * - riseSet: rise + set
 * - culminateCulminate: (culminate | anti_culminate) + (culminate | anti_culminate)
 * - culminateSet: (culminate | anti_culminate) + set
 * - setSet: set + set
 */
function updateSummaryCount(
  e1: AngularEvent,
  e2: AngularEvent,
  counters: {
    riseRise: () => void
    riseCulminate: () => void
    riseSet: () => void
    culminateCulminate: () => void
    culminateSet: () => void
    setSet: () => void
  },
): void {
  // Normalize to handle symmetry
  const events = [e1, e2].sort()

  const isCulminationType = (e: AngularEvent) => e === 'culminate' || e === 'anti_culminate'

  if (events[0] === 'rise' && events[1] === 'rise') {
    counters.riseRise()
  } else if (events[0] === 'rise' && isCulminationType(events[1])) {
    counters.riseCulminate()
  } else if (events[0] === 'rise' && events[1] === 'set') {
    counters.riseSet()
  } else if (isCulminationType(events[0]) && isCulminationType(events[1])) {
    counters.culminateCulminate()
  } else if (isCulminationType(events[0]) && events[1] === 'set') {
    counters.culminateSet()
  } else if (events[0] === 'set' && events[1] === 'set') {
    counters.setSet()
  }
}

// =============================================================================
// Filtering and Query Functions
// =============================================================================

/**
 * Get the top N strongest parans.
 *
 * @param result - Complete paran result
 * @param limit - Maximum number to return (default: 50)
 * @returns Top parans sorted by strength descending
 */
export function getTopParans(result: ParanResult, limit: number = 50): Array<ParanPoint> {
  // Already sorted by strength descending
  return result.points.slice(0, limit)
}

/**
 * Get all parans involving a specific planet.
 *
 * @param result - Complete paran result
 * @param planetId - Planet to filter by
 * @returns Parans where planet is involved
 */
export function getParansForPlanet(result: ParanResult, planetId: PlanetId): Array<ParanPoint> {
  return result.points.filter((p) => p.planet1 === planetId || p.planet2 === planetId)
}

/**
 * Get parans near a specific latitude.
 *
 * @param result - Complete paran result
 * @param latitude - Target latitude in degrees
 * @param orb - Maximum distance in degrees (default: 2)
 * @returns Parans within orb of latitude
 */
export function getParansAtLatitude(
  result: ParanResult,
  latitude: number,
  orb: number = 2.0,
): Array<ParanPoint> {
  return result.points.filter((p) => Math.abs(p.latitude - latitude) <= orb)
}

/**
 * Get parans by event type.
 *
 * @param result - Complete paran result
 * @param event - Event type to filter by
 * @returns Parans where either planet has this event
 */
export function getParansByEvent(result: ParanResult, event: AngularEvent): Array<ParanPoint> {
  return result.points.filter((p) => p.event1 === event || p.event2 === event)
}

/**
 * Get parans within a strength range.
 *
 * @param result - Complete paran result
 * @param minStrength - Minimum strength (inclusive)
 * @param maxStrength - Maximum strength (inclusive, default: 1.0)
 * @returns Parans within strength range
 */
export function getParansByStrength(
  result: ParanResult,
  minStrength: number,
  maxStrength: number = 1.0,
): Array<ParanPoint> {
  return result.points.filter((p) => {
    const strength = p.strength ?? 0
    return strength >= minStrength && strength <= maxStrength
  })
}

// =============================================================================
// Grouping Functions
// =============================================================================

/**
 * Group parans by latitude bands for visualization.
 *
 * @param result - Complete paran result
 * @param bandSize - Size of each band in degrees (default: 5)
 * @returns Map of band center latitude to parans in that band
 */
export function groupParansByLatitude(
  result: ParanResult,
  bandSize: number = 5,
): Map<number, Array<ParanPoint>> {
  const bands = new Map<number, Array<ParanPoint>>()

  for (const paran of result.points) {
    const bandCenter = Math.round(paran.latitude / bandSize) * bandSize

    if (!bands.has(bandCenter)) {
      bands.set(bandCenter, [])
    }
    bands.get(bandCenter)!.push(paran)
  }

  return bands
}

/**
 * Group parans by planet pair.
 *
 * @param result - Complete paran result
 * @returns Map of "planet1-planet2" key to parans
 */
export function groupParansByPlanetPair(result: ParanResult): Map<string, Array<ParanPoint>> {
  const pairs = new Map<string, Array<ParanPoint>>()

  for (const paran of result.points) {
    const key = `${paran.planet1}-${paran.planet2}`

    if (!pairs.has(key)) {
      pairs.set(key, [])
    }
    pairs.get(key)!.push(paran)
  }

  return pairs
}

/**
 * Group parans by event combination.
 *
 * @param result - Complete paran result
 * @returns Map of "event1-event2" key to parans
 */
export function groupParansByEventType(result: ParanResult): Map<string, Array<ParanPoint>> {
  const events = new Map<string, Array<ParanPoint>>()

  for (const paran of result.points) {
    // Sort events to normalize the key (rise-set same as set-rise)
    const sortedEvents = [paran.event1, paran.event2].sort()
    const key = `${sortedEvents[0]}-${sortedEvents[1]}`

    if (!events.has(key)) {
      events.set(key, [])
    }
    events.get(key)!.push(paran)
  }

  return events
}

// =============================================================================
// Statistics
// =============================================================================

/**
 * Get paran statistics for analysis.
 *
 * @param result - Complete paran result
 * @returns Statistics about the paran catalog
 */
export function getParanStatistics(result: ParanResult): {
  total: number
  averageStrength: number
  medianStrength: number
  latitudeRange: { min: number; max: number }
  strongestParan: ParanPoint | null
  byHemisphere: { northern: number; southern: number }
} {
  if (result.points.length === 0) {
    return {
      total: 0,
      averageStrength: 0,
      medianStrength: 0,
      latitudeRange: { min: 0, max: 0 },
      strongestParan: null,
      byHemisphere: { northern: 0, southern: 0 },
    }
  }

  const strengths = result.points.map((p) => p.strength ?? 0)
  const latitudes = result.points.map((p) => p.latitude)

  // Sort strengths for median
  const sortedStrengths = [...strengths].sort((a, b) => a - b)
  const medianIndex = Math.floor(sortedStrengths.length / 2)
  const medianStrength =
    sortedStrengths.length % 2 === 0
      ? (sortedStrengths[medianIndex - 1] + sortedStrengths[medianIndex]) / 2
      : sortedStrengths[medianIndex]

  return {
    total: result.points.length,
    averageStrength: strengths.reduce((a, b) => a + b, 0) / strengths.length,
    medianStrength,
    latitudeRange: {
      min: Math.min(...latitudes),
      max: Math.max(...latitudes),
    },
    strongestParan: result.points[0], // Already sorted by strength
    byHemisphere: {
      northern: result.points.filter((p) => p.latitude > 0).length,
      southern: result.points.filter((p) => p.latitude < 0).length,
    },
  }
}
