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
// Bisection Helper
// =============================================================================

/** Sample point for bisection */
interface BisectionSample {
  lat: number
  diff: number
  et1: EventTime
  et2: EventTime
}

/** Result of bisection convergence */
interface BisectionConvergenceResult {
  latitude: number
  result: { diff: number; et1: EventTime; et2: EventTime }
}

/**
 * Shared bisection helper that converges on the zero-crossing latitude.
 *
 * @param a - Lower bound latitude
 * @param b - Upper bound latitude
 * @param s1 - Sample at lower bound
 * @param getDiff - Callback to get LST difference at a latitude
 * @param useQuarterFallback - Whether to try quarter-point fallback on null midpoint
 * @param s2Diff - Upper bound diff (needed for quarter fallback)
 * @returns Convergence result or null if failed
 */
function bisectToConvergence(
  a: number,
  b: number,
  s1: BisectionSample,
  getDiff: (lat: number) => { diff: number; et1: EventTime; et2: EventTime } | null,
  useQuarterFallback: boolean = false,
  s2Diff?: number,
): BisectionConvergenceResult | null {
  let currentA = a
  let currentB = b
  let aResult = s1
  let iterations = 0

  while (iterations < PARAN_MAX_ITERATIONS && currentB - currentA > PARAN_BISECTION_TOL) {
    const mid = (currentA + currentB) / 2
    const midResult = getDiff(mid)

    if (midResult === null) {
      if (useQuarterFallback && s2Diff !== undefined) {
        // Try quarter points to find valid side
        const quarterLow = (currentA + mid) / 2
        const quarterHigh = (mid + currentB) / 2

        const lowResult = getDiff(quarterLow)
        const highResult = getDiff(quarterHigh)

        if (lowResult !== null && lowResult.diff * s1.diff <= 0) {
          currentB = mid
        } else if (highResult !== null && highResult.diff * s2Diff <= 0) {
          currentA = mid
        } else {
          break
        }
      } else {
        break
      }
    } else {
      if (aResult.diff * midResult.diff <= 0) {
        currentB = mid
      } else {
        currentA = mid
        aResult = { lat: mid, ...midResult }
      }
    }

    iterations++
  }

  const finalLat = (currentA + currentB) / 2
  const finalResult = getDiff(finalLat)

  if (finalResult !== null) {
    return { latitude: finalLat, result: finalResult }
  }

  return null
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
  const getDiff = (lat: number) => getLSTDifferenceAtLatitude(lat, planet1, event1, planet2, event2)

  // Sample the latitude range to find potential paran locations
  const samples: Array<BisectionSample> = []

  for (let lat = latLow; lat <= latHigh; lat += PARAN_LATITUDE_STEP) {
    const result = getDiff(lat)
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
      const convergence = bisectToConvergence(s1.lat, s2.lat, s1, getDiff, true, s2.diff)

      if (convergence !== null) {
        const strength = calculateParanStrength(convergence.result.diff)
        return {
          latitude: convergence.latitude,
          timeDifference: convergence.result.diff,
          event1: convergence.result.et1,
          event2: convergence.result.et2,
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
  const getDiff = (lat: number) => getLSTDifferenceAtLatitude(lat, planet1, event1, planet2, event2)

  // Sample the latitude range
  const samples: Array<BisectionSample> = []

  for (let lat = latLow; lat <= latHigh; lat += PARAN_LATITUDE_STEP) {
    const result = getDiff(lat)
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
      const convergence = bisectToConvergence(s1.lat, s2.lat, s1, getDiff)

      if (convergence !== null) {
        const strength = calculateParanStrength(convergence.result.diff)
        results.push({
          latitude: convergence.latitude,
          timeDifference: convergence.result.diff,
          event1: convergence.result.et1,
          event2: convergence.result.et2,
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
  // Clamp guards against floating-point drift that could push value slightly outside [0,1]
  return clamp(1 - absDiff / maxOrb, 0, 1)
}
