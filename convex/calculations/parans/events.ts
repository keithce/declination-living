/**
 * Event Time Calculator for Paran System
 *
 * Calculates the Local Sidereal Time (LST) when planets reach angular positions:
 * - Rise: crossing the eastern horizon
 * - Set: crossing the western horizon
 * - Culminate: crossing the upper meridian (MC)
 * - Anti-culminate: crossing the lower meridian (IC)
 */

import { calculateSDA } from '../coordinates/sda'
import { normalizeDegrees, normalizeDegreesSymmetric } from '../core/math'
import type { AngularEvent, PlanetId } from '../core/types'

// =============================================================================
// Types
// =============================================================================

export interface EventTime {
  planet: PlanetId
  event: AngularEvent
  /** Local Sidereal Time of event in degrees (0-360) */
  lst: number
  /** Whether this event is possible at this latitude */
  isPossible: boolean
  /** If circumpolar, whether always above or below horizon */
  circumpolarState?: 'always_above' | 'always_below'
}

// =============================================================================
// Rise/Set Time Calculations
// =============================================================================

/**
 * Calculate the LST when a planet rises (crosses eastern horizon).
 *
 * For rising: Hour Angle = -SDA (negative, east of meridian)
 * LST = RA + HA = RA - SDA
 *
 * @param ra - Right Ascension in degrees (0-360)
 * @param dec - Declination in degrees (-90 to +90)
 * @param latitude - Observer's latitude in degrees
 * @returns EventTime with LST or circumpolar state
 */
export function calculateRiseTime(
  planet: PlanetId,
  ra: number,
  dec: number,
  latitude: number,
): EventTime {
  const sda = calculateSDA(latitude, dec)

  if (sda.neverRises) {
    return {
      planet,
      event: 'rise',
      lst: 0,
      isPossible: false,
      circumpolarState: 'always_below',
    }
  }

  if (sda.neverSets) {
    return {
      planet,
      event: 'rise',
      lst: 0,
      isPossible: false,
      circumpolarState: 'always_above',
    }
  }

  // Rising occurs at HA = -SDA
  const ha = sda.riseHA!
  const lst = normalizeDegrees(ra + ha)

  return {
    planet,
    event: 'rise',
    lst,
    isPossible: true,
  }
}

/**
 * Calculate the LST when a planet sets (crosses western horizon).
 *
 * For setting: Hour Angle = +SDA (positive, west of meridian)
 * LST = RA + HA = RA + SDA
 *
 * @param ra - Right Ascension in degrees (0-360)
 * @param dec - Declination in degrees (-90 to +90)
 * @param latitude - Observer's latitude in degrees
 * @returns EventTime with LST or circumpolar state
 */
export function calculateSetTime(
  planet: PlanetId,
  ra: number,
  dec: number,
  latitude: number,
): EventTime {
  const sda = calculateSDA(latitude, dec)

  if (sda.neverRises) {
    return {
      planet,
      event: 'set',
      lst: 0,
      isPossible: false,
      circumpolarState: 'always_below',
    }
  }

  if (sda.neverSets) {
    return {
      planet,
      event: 'set',
      lst: 0,
      isPossible: false,
      circumpolarState: 'always_above',
    }
  }

  // Setting occurs at HA = +SDA
  const ha = sda.setHA!
  const lst = normalizeDegrees(ra + ha)

  return {
    planet,
    event: 'set',
    lst,
    isPossible: true,
  }
}

// =============================================================================
// Culmination Time Calculations
// =============================================================================

/**
 * Calculate the LST when a planet culminates (upper meridian crossing, MC).
 *
 * At culmination: Hour Angle = 0
 * LST = RA + 0 = RA
 *
 * Culmination always occurs for any planet at any latitude.
 *
 * @param ra - Right Ascension in degrees (0-360)
 * @returns EventTime with LST
 */
export function calculateCulminateTime(planet: PlanetId, ra: number): EventTime {
  return {
    planet,
    event: 'culminate',
    lst: normalizeDegrees(ra),
    isPossible: true,
  }
}

/**
 * Calculate the LST when a planet anti-culminates (lower meridian crossing, IC).
 *
 * At anti-culmination: Hour Angle = 180°
 * LST = RA + 180
 *
 * Anti-culmination always occurs for any planet at any latitude.
 *
 * @param ra - Right Ascension in degrees (0-360)
 * @returns EventTime with LST
 */
export function calculateAntiCulminateTime(planet: PlanetId, ra: number): EventTime {
  return {
    planet,
    event: 'anti_culminate',
    lst: normalizeDegrees(ra + 180),
    isPossible: true,
  }
}

// =============================================================================
// Combined Event Calculations
// =============================================================================

/**
 * Calculate event times for all four angular events for a planet.
 *
 * @param planetId - Planet identifier
 * @param ra - Right Ascension in degrees (0-360)
 * @param dec - Declination in degrees (-90 to +90)
 * @param latitude - Observer's latitude in degrees
 * @returns Array of EventTime for all four events
 */
export function calculateAllEventTimes(
  planetId: PlanetId,
  ra: number,
  dec: number,
  latitude: number,
): Array<EventTime> {
  return [
    calculateRiseTime(planetId, ra, dec, latitude),
    calculateSetTime(planetId, ra, dec, latitude),
    calculateCulminateTime(planetId, ra),
    calculateAntiCulminateTime(planetId, ra),
  ]
}

/**
 * Get the event time for a specific angular event.
 *
 * @param planetId - Planet identifier
 * @param ra - Right Ascension in degrees
 * @param dec - Declination in degrees
 * @param latitude - Observer's latitude
 * @param event - Which angular event
 * @returns EventTime for the specified event
 */
export function calculateEventTime(
  planetId: PlanetId,
  ra: number,
  dec: number,
  latitude: number,
  event: AngularEvent,
): EventTime {
  switch (event) {
    case 'rise':
      return calculateRiseTime(planetId, ra, dec, latitude)
    case 'set':
      return calculateSetTime(planetId, ra, dec, latitude)
    case 'culminate':
      return calculateCulminateTime(planetId, ra)
    case 'anti_culminate':
      return calculateAntiCulminateTime(planetId, ra)
    default: {
      const _exhaustive: never = event
      void _exhaustive
      throw new Error(`Unknown angular event: ${event}`)
    }
  }
}

// =============================================================================
// LST Difference Calculation
// =============================================================================

/**
 * Calculate the signed difference between two LST values.
 * Returns value in range [-180, 180) representing the shortest arc
 * from lst2 to lst1 (positive if lst1 is "ahead" of lst2).
 *
 * @param lst1 - First LST in degrees (0-360)
 * @param lst2 - Second LST in degrees (0-360)
 * @returns Signed difference in degrees (-180 to 180)
 */
export function lstDifference(lst1: number, lst2: number): number {
  return normalizeDegreesSymmetric(lst1 - lst2)
}

/**
 * Calculate the absolute LST difference (shortest arc).
 *
 * @param lst1 - First LST in degrees (0-360)
 * @param lst2 - Second LST in degrees (0-360)
 * @returns Absolute difference in degrees (0 to 180)
 */
export function lstAbsDifference(lst1: number, lst2: number): number {
  return Math.abs(lstDifference(lst1, lst2))
}
