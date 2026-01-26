/**
 * Paran Bisection Solver
 *
 * Finds the exact latitude where two planetary events occur at the same LST.
 * Uses bisection search with 10⁻⁶ degree precision.
 */

import {
  PARAN_BISECTION_TOL,
  PARAN_LATITUDE_STEP,
  PARAN_MAX_ITERATIONS,
  PARAN_MAX_ORB,
} from '../core/constants'
import { clamp } from '../core/math'
import { calculateEventTime, lstDifference } from './events'
import type { AngularEvent, PlanetId } from '../core/types'
import type { EventTime } from './events'

// =============================================================================
// Types
// =============================================================================

export interface PlanetData {
  planetId: PlanetId
  ra: number
  dec: number
}

export interface ParanSearchResult {
  /** Latitude where paran occurs */
  latitude: number
  /** LST difference at this latitude (should be ~0 for exact paran) */
  timeDifference: number
  /** Event details for planet 1 */
  event1: EventTime
  /** Event details for planet 2 */
  event2: EventTime
  /** Strength of paran (1.0 = exact) */
  strength: number
}

// =============================================================================
// LST Difference Function for Bisection
// =============================================================================

/**
 * Calculate the LST difference between two events at a given latitude.
 * Returns null if either event is impossible at this latitude.
 *
 * @param latitude - Observer's latitude
 * @param planet1 - First planet data
 * @param event1 - Angular event for planet 1
 * @param planet2 - Second planet data
 * @param event2 - Angular event for planet 2
 * @returns LST difference in degrees, or null if impossible
 */
function getLSTDifferenceAtLatitude(
  latitude: number,
  planet1: PlanetData,
  event1: AngularEvent,
  planet2: PlanetData,
  event2: AngularEvent,
): { diff: number; et1: EventTime; et2: EventTime } | null {
  const et1 = calculateEventTime(planet1.planetId, planet1.ra, planet1.dec, latitude, event1)
  const et2 = calculateEventTime(planet2.planetId, planet2.ra, planet2.dec, latitude, event2)

  // Check if both events are possible
  if (!et1.isPossible || !et2.isPossible) {
    return null
  }

  const diff = lstDifference(et1.lst, et2.lst)
  return { diff, et1, et2 }
}

// =============================================================================
// Bisection Solver
// =============================================================================

/**
 * Find the latitude where a paran occurs between two planets.
 *
 * Uses bisection search to find the latitude where:
 * LST(planet1, event1) = LST(planet2, event2)
 *
 * Algorithm:
 * 1. Sample latitudes to find sign changes in LST difference
 * 2. Use bisection to converge on exact latitude
 * 3. Handle circumpolar cases (events becoming impossible)
 * 4. Converge to 10⁻⁶ degree precision
 *
 * @param planet1 - First planet data (id, ra, dec)
 * @param event1 - Angular event for planet 1
 * @param planet2 - Second planet data
 * @param event2 - Angular event for planet 2
 * @param latLow - Lower latitude bound (default: -85)
 * @param latHigh - Upper latitude bound (default: 85)
 * @returns ParanSearchResult if found, null otherwise
 */
export function findParanLatitude(
  planet1: PlanetData,
  event1: AngularEvent,
  planet2: PlanetData,
  event2: AngularEvent,
  latLow: number = -85,
  latHigh: number = 85,
): ParanSearchResult | null {
  // Sample the latitude range to find potential paran locations
  const samples: Array<{ lat: number; diff: number; et1: EventTime; et2: EventTime }> = []

  for (let lat = latLow; lat <= latHigh; lat += PARAN_LATITUDE_STEP) {
    const result = getLSTDifferenceAtLatitude(lat, planet1, event1, planet2, event2)
    if (result !== null) {
      samples.push({ lat, ...result })
    }
  }

  if (samples.length < 2) {
    return null
  }

  // Find sign changes (potential paran locations)
  for (let i = 0; i < samples.length - 1; i++) {
    const s1 = samples[i]
    const s2 = samples[i + 1]

    // Check for sign change, avoiding wrap-around false positives
    const hasSignChange = s1.diff * s2.diff < 0 && Math.abs(s1.diff) < 90 && Math.abs(s2.diff) < 90

    if (hasSignChange) {
      // Bisection search for exact latitude
      let a = s1.lat
      let b = s2.lat
      let iterations = 0

      while (iterations < PARAN_MAX_ITERATIONS && b - a > PARAN_BISECTION_TOL) {
        const mid = (a + b) / 2
        const midResult = getLSTDifferenceAtLatitude(mid, planet1, event1, planet2, event2)

        if (midResult === null) {
          // Event became impossible at midpoint - narrow from both sides
          // Try to find which side is still valid
          const quarterLow = (a + mid) / 2
          const quarterHigh = (mid + b) / 2

          const lowResult = getLSTDifferenceAtLatitude(quarterLow, planet1, event1, planet2, event2)
          const highResult = getLSTDifferenceAtLatitude(
            quarterHigh,
            planet1,
            event1,
            planet2,
            event2,
          )

          if (lowResult !== null && lowResult.diff * s1.diff <= 0) {
            b = mid
          } else if (highResult !== null && highResult.diff * s2.diff <= 0) {
            a = mid
          } else {
            // Can't continue bisection
            break
          }
        } else {
          // Normal bisection
          if (s1.diff * midResult.diff <= 0) {
            b = mid
          } else {
            a = mid
          }
        }

        iterations++
      }

      // Get final result at converged latitude
      const finalLat = (a + b) / 2
      const finalResult = getLSTDifferenceAtLatitude(finalLat, planet1, event1, planet2, event2)

      if (finalResult !== null) {
        const strength = calculateParanStrength(finalResult.diff)
        return {
          latitude: finalLat,
          timeDifference: finalResult.diff,
          event1: finalResult.et1,
          event2: finalResult.et2,
          strength,
        }
      }
    }
  }

  return null
}

/**
 * Find all parans between two planets for all event combinations.
 *
 * @param planet1 - First planet data
 * @param planet2 - Second planet data
 * @param latLow - Lower latitude bound
 * @param latHigh - Upper latitude bound
 * @returns Array of all parans found
 */
export function findAllParansForPair(
  planet1: PlanetData,
  planet2: PlanetData,
  latLow: number = -85,
  latHigh: number = 85,
): Array<ParanSearchResult> {
  const events: Array<AngularEvent> = ['rise', 'set', 'culminate', 'anti_culminate']
  const results: Array<ParanSearchResult> = []

  for (const event1 of events) {
    for (const event2 of events) {
      // Find all parans for this event combination
      // We need to scan the full range as there might be multiple parans
      const paransFound = findAllParansInRange(planet1, event1, planet2, event2, latLow, latHigh)
      results.push(...paransFound)
    }
  }

  return results
}

/**
 * Find all parans in a latitude range (there may be multiple).
 */
function findAllParansInRange(
  planet1: PlanetData,
  event1: AngularEvent,
  planet2: PlanetData,
  event2: AngularEvent,
  latLow: number,
  latHigh: number,
): Array<ParanSearchResult> {
  const results: Array<ParanSearchResult> = []

  // Sample the latitude range
  const samples: Array<{ lat: number; diff: number; et1: EventTime; et2: EventTime }> = []

  for (let lat = latLow; lat <= latHigh; lat += PARAN_LATITUDE_STEP) {
    const result = getLSTDifferenceAtLatitude(lat, planet1, event1, planet2, event2)
    if (result !== null) {
      samples.push({ lat, ...result })
    }
  }

  if (samples.length < 2) {
    return results
  }

  // Find all sign changes
  for (let i = 0; i < samples.length - 1; i++) {
    const s1 = samples[i]
    const s2 = samples[i + 1]

    // Check for sign change
    const hasSignChange = s1.diff * s2.diff < 0 && Math.abs(s1.diff) < 90 && Math.abs(s2.diff) < 90

    if (hasSignChange) {
      // Bisection for this interval
      let a = s1.lat
      let b = s2.lat
      let aResult = s1
      let iterations = 0

      while (iterations < PARAN_MAX_ITERATIONS && b - a > PARAN_BISECTION_TOL) {
        const mid = (a + b) / 2
        const midResult = getLSTDifferenceAtLatitude(mid, planet1, event1, planet2, event2)

        if (midResult === null) {
          break
        }

        if (aResult.diff * midResult.diff <= 0) {
          b = mid
        } else {
          a = mid
          aResult = { lat: mid, ...midResult }
        }

        iterations++
      }

      const finalLat = (a + b) / 2
      const finalResult = getLSTDifferenceAtLatitude(finalLat, planet1, event1, planet2, event2)

      if (finalResult !== null) {
        const strength = calculateParanStrength(finalResult.diff)
        results.push({
          latitude: finalLat,
          timeDifference: finalResult.diff,
          event1: finalResult.et1,
          event2: finalResult.et2,
          strength,
        })
      }
    }
  }

  return results
}

// =============================================================================
// Strength Calculation
// =============================================================================

/**
 * Calculate paran strength based on LST time difference.
 *
 * Strength = 1 at exact alignment (diff = 0)
 * Strength = 0 at maxOrb (default 1 degree)
 * Linear interpolation between
 *
 * @param timeDifference - LST difference in degrees
 * @param maxOrb - Maximum orb to consider (default: PARAN_MAX_ORB)
 * @returns Strength value (0 to 1)
 */
export function calculateParanStrength(
  timeDifference: number,
  maxOrb: number = PARAN_MAX_ORB,
): number {
  const absDiff = Math.abs(timeDifference)
  if (absDiff >= maxOrb) {
    return 0
  }
  return clamp(1 - absDiff / maxOrb, 0, 1)
}
