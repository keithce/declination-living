/**
 * Out-of-Bounds (OOB) detection for planetary declinations.
 *
 * A planet is out-of-bounds when its declination exceeds the
 * maximum declination of the Sun (the obliquity of the ecliptic).
 * Currently ~23.44°, but varies due to Earth's axial precession.
 *
 * OOB planets are considered to express their energy in more
 * extreme or unconventional ways.
 */

import type { PlanetId, PlanetDeclinations } from "../core/types"
import { PLANET_IDS } from "../core/types"
import {
  J2000,
  JULIAN_DAYS_PER_CENTURY,
  MEAN_OBLIQUITY_J2000,
  OBLIQUITY_RATE,
  APPROX_OBLIQUITY,
} from "../core/constants"

// =============================================================================
// Types
// =============================================================================

export interface OOBStatus {
  /** Whether the planet is out-of-bounds */
  isOOB: boolean
  /** Degrees beyond the obliquity limit (only if OOB) */
  oobDegrees: number | null
  /** Direction: 'north' if dec > obliquity, 'south' if dec < -obliquity */
  direction: "north" | "south" | null
  /** The declination value */
  declination: number
  /** The obliquity used for comparison */
  obliquity: number
}

export type PlanetOOBStatus = Record<PlanetId, OOBStatus>

// =============================================================================
// Obliquity Calculation
// =============================================================================

/**
 * Calculate the mean obliquity of the ecliptic for a given Julian Day.
 *
 * This is the "simple" formula without nutation.
 * For the full nutation-corrected value, use the astronomia library's
 * nutation module which is already used in ephemeris.ts.
 *
 * Formula: ε = 23.439291° - 0.0130042° × T
 * where T = Julian centuries from J2000.0
 *
 * @param jd - Julian Day
 * @returns Mean obliquity in degrees
 */
export function getMeanObliquity(jd: number): number {
  const T = (jd - J2000) / JULIAN_DAYS_PER_CENTURY
  return MEAN_OBLIQUITY_J2000 + OBLIQUITY_RATE * T
}

/**
 * Get the approximate current obliquity.
 * Use this for quick checks; for precise calculations, use getMeanObliquity(jd).
 */
export function getApproxObliquity(): number {
  return APPROX_OBLIQUITY
}

// =============================================================================
// OOB Detection
// =============================================================================

/**
 * Check if a declination value is out-of-bounds.
 *
 * @param declination - Declination in degrees
 * @param obliquity - Obliquity in degrees (default: approximate current)
 * @returns True if |declination| > obliquity
 */
export function isOutOfBounds(
  declination: number,
  obliquity: number = APPROX_OBLIQUITY
): boolean {
  return Math.abs(declination) > obliquity
}

/**
 * Get full OOB status for a single planet.
 *
 * @param declination - Planet's declination in degrees
 * @param obliquity - Obliquity in degrees
 * @returns OOBStatus with all details
 */
export function getOOBStatus(
  declination: number,
  obliquity: number = APPROX_OBLIQUITY
): OOBStatus {
  const absDec = Math.abs(declination)
  const isOOB = absDec > obliquity

  if (!isOOB) {
    return {
      isOOB: false,
      oobDegrees: null,
      direction: null,
      declination,
      obliquity,
    }
  }

  return {
    isOOB: true,
    oobDegrees: absDec - obliquity,
    direction: declination > 0 ? "north" : "south",
    declination,
    obliquity,
  }
}

/**
 * Check OOB status for all planets.
 *
 * @param declinations - Declinations for all planets
 * @param jd - Julian Day (for precise obliquity calculation)
 * @returns OOB status for each planet
 */
export function checkAllOOBStatus(
  declinations: PlanetDeclinations,
  jd?: number
): PlanetOOBStatus {
  const obliquity = jd !== undefined ? getMeanObliquity(jd) : APPROX_OBLIQUITY

  const result: Partial<PlanetOOBStatus> = {}

  for (const planet of PLANET_IDS) {
    result[planet] = getOOBStatus(declinations[planet], obliquity)
  }

  return result as PlanetOOBStatus
}

/**
 * Get a list of planets that are currently out-of-bounds.
 *
 * @param declinations - Declinations for all planets
 * @param obliquity - Obliquity in degrees
 * @returns Array of OOB planet IDs
 */
export function getOOBPlanets(
  declinations: PlanetDeclinations,
  obliquity: number = APPROX_OBLIQUITY
): PlanetId[] {
  return PLANET_IDS.filter((planet) =>
    isOutOfBounds(declinations[planet], obliquity)
  )
}

// =============================================================================
// OOB Period Detection
// =============================================================================

/**
 * Result of OOB period search
 */
export interface OOBPeriod {
  planet: PlanetId
  /** Julian Day when planet goes OOB */
  startJD: number
  /** Julian Day when planet returns in-bounds */
  endJD: number
  /** Duration in days */
  durationDays: number
  /** Maximum OOB degrees reached */
  maxOOBDegrees: number
  /** Direction (north/south) */
  direction: "north" | "south"
}

/**
 * Find when a planet next goes out-of-bounds.
 *
 * @param getDeclination - Function to get planet's declination for a JD
 * @param jd - Starting Julian Day
 * @param obliquity - Obliquity in degrees
 * @param maxDays - Maximum days to search
 * @returns Julian Day when planet goes OOB, or null if not found
 */
export function findNextOOBEntry(
  getDeclination: (jd: number) => number,
  jd: number,
  obliquity: number = APPROX_OBLIQUITY,
  maxDays: number = 365 * 2
): number | null {
  const step = 1.0 // Search in 1-day steps

  let currentJD = jd
  let wasOOB = isOutOfBounds(getDeclination(currentJD), obliquity)

  // If already OOB, first find when it returns in-bounds
  if (wasOOB) {
    for (let i = 0; i < maxDays; i++) {
      currentJD += step
      const dec = getDeclination(currentJD)
      if (!isOutOfBounds(dec, obliquity)) {
        wasOOB = false
        break
      }
    }
    if (wasOOB) return null // Still OOB after maxDays
  }

  // Now search for next OOB entry
  for (let i = 0; i < maxDays; i++) {
    currentJD += step
    const dec = getDeclination(currentJD)

    if (isOutOfBounds(dec, obliquity)) {
      // Refine with bisection
      let low = currentJD - step
      let high = currentJD

      for (let j = 0; j < 20; j++) {
        const mid = (low + high) / 2
        const midDec = getDeclination(mid)

        if (isOutOfBounds(midDec, obliquity)) {
          high = mid
        } else {
          low = mid
        }
      }

      return (low + high) / 2
    }
  }

  return null
}

// =============================================================================
// OOB Significance
// =============================================================================

/**
 * Planets that commonly go out-of-bounds.
 * Sun never goes OOB (by definition - it defines the limit).
 * The Moon frequently goes OOB (every ~18.6 years has a peak).
 * Mercury and Venus can go OOB.
 * Mars rarely goes OOB.
 * Outer planets almost never go OOB.
 */
export const OOB_LIKELIHOOD: Record<PlanetId, "common" | "occasional" | "rare" | "never"> = {
  sun: "never", // Sun defines the obliquity
  moon: "common", // Regularly goes OOB
  mercury: "occasional", // Can go up to ~27°
  venus: "occasional", // Can go up to ~28°
  mars: "rare", // Very rarely exceeds obliquity
  jupiter: "rare", // Almost never
  saturn: "rare",
  uranus: "rare",
  neptune: "rare",
  pluto: "common", // Has high inclination, often OOB
}

/**
 * Get interpretive text for OOB status.
 */
export function getOOBInterpretation(status: OOBStatus, planet: PlanetId): string {
  if (!status.isOOB) {
    return `${planet} is within bounds at ${status.declination.toFixed(2)}° declination.`
  }

  const direction = status.direction === "north" ? "northern" : "southern"
  const degrees = status.oobDegrees!.toFixed(2)

  return `${planet} is out-of-bounds at ${status.declination.toFixed(2)}° declination (${degrees}° beyond ${direction} limit). This suggests ${planet}'s energy may express in more extreme or unconventional ways.`
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format OOB status as a short string.
 *
 * @param status - OOB status
 * @returns Formatted string like "OOB +2.3°N" or "In bounds"
 */
export function formatOOBStatus(status: OOBStatus): string {
  if (!status.isOOB) {
    return "In bounds"
  }

  const dir = status.direction === "north" ? "N" : "S"
  return `OOB +${status.oobDegrees!.toFixed(1)}°${dir}`
}
