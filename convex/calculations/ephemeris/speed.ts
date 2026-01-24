/**
 * Planetary speed calculations for retrograde detection.
 * Uses 3-point numerical differentiation to calculate daily motion.
 */

import type { PlanetId, PlanetPositions } from "../core/types"
import { PLANET_IDS, SPEED_CALC_STEP, EPSILON } from "../core/constants"

// =============================================================================
// Types
// =============================================================================

export interface PlanetSpeed {
  /** Daily motion in longitude (degrees/day), negative = retrograde */
  longitudeSpeed: number
  /** Daily motion in declination (degrees/day) */
  declinationSpeed: number
  /** Whether planet is retrograde (longitude decreasing) */
  isRetrograde: boolean
  /** Whether planet is stationary (very slow motion) */
  isStationary: boolean
}

export type PlanetSpeeds = Record<PlanetId, PlanetSpeed>

// =============================================================================
// Speed Calculation
// =============================================================================

/** Threshold for considering a planet stationary (degrees/day) */
const STATIONARY_THRESHOLD: Record<PlanetId, number> = {
  sun: 0.1, // Sun is never stationary, but include for completeness
  moon: 1.0, // Moon is never stationary
  mercury: 0.15,
  venus: 0.1,
  mars: 0.05,
  jupiter: 0.02,
  saturn: 0.01,
  uranus: 0.005,
  neptune: 0.003,
  pluto: 0.002,
}

/**
 * Calculate the speed of all planets using 3-point numerical differentiation.
 *
 * Uses the central difference formula:
 * f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
 *
 * This is more accurate than forward/backward differences.
 *
 * @param getPositions - Function to get planet positions for a given JD
 * @param jd - Julian Day to calculate speed for
 * @param h - Step size in days (default 0.5)
 * @returns Speed data for all planets
 */
export function calculatePlanetSpeeds(
  getPositions: (jd: number) => PlanetPositions,
  jd: number,
  h: number = SPEED_CALC_STEP
): PlanetSpeeds {
  // Get positions at jd-h, jd, and jd+h
  const posMinus = getPositions(jd - h)
  const posPlus = getPositions(jd + h)

  const speeds: Partial<PlanetSpeeds> = {}

  for (const planet of PLANET_IDS) {
    const lonMinus = posMinus[planet].ecliptic.longitude
    const lonPlus = posPlus[planet].ecliptic.longitude
    const decMinus = posMinus[planet].equatorial.dec
    const decPlus = posPlus[planet].equatorial.dec

    // Handle longitude wrap-around at 360°
    let lonDiff = lonPlus - lonMinus
    if (lonDiff > 180) lonDiff -= 360
    if (lonDiff < -180) lonDiff += 360

    // Central difference formula
    const longitudeSpeed = lonDiff / (2 * h)
    const declinationSpeed = (decPlus - decMinus) / (2 * h)

    // Determine retrograde and stationary status
    const isRetrograde = longitudeSpeed < -EPSILON
    const isStationary =
      Math.abs(longitudeSpeed) < STATIONARY_THRESHOLD[planet]

    speeds[planet] = {
      longitudeSpeed,
      declinationSpeed,
      isRetrograde,
      isStationary,
    }
  }

  return speeds as PlanetSpeeds
}

/**
 * Calculate speed for a single planet.
 *
 * @param getPosition - Function to get a single position {longitude, declination}
 * @param jd - Julian Day
 * @param planet - Planet ID (for stationary threshold)
 * @param h - Step size in days
 * @returns Speed data for the planet
 */
export function calculateSinglePlanetSpeed(
  getPosition: (jd: number) => { longitude: number; declination: number },
  jd: number,
  planet: PlanetId,
  h: number = SPEED_CALC_STEP
): PlanetSpeed {
  const posMinus = getPosition(jd - h)
  const posPlus = getPosition(jd + h)

  // Handle longitude wrap-around
  let lonDiff = posPlus.longitude - posMinus.longitude
  if (lonDiff > 180) lonDiff -= 360
  if (lonDiff < -180) lonDiff += 360

  const longitudeSpeed = lonDiff / (2 * h)
  const declinationSpeed =
    (posPlus.declination - posMinus.declination) / (2 * h)

  const isRetrograde = longitudeSpeed < -EPSILON
  const isStationary = Math.abs(longitudeSpeed) < STATIONARY_THRESHOLD[planet]

  return {
    longitudeSpeed,
    declinationSpeed,
    isRetrograde,
    isStationary,
  }
}

// =============================================================================
// Retrograde Period Detection
// =============================================================================

/**
 * Result of retrograde period search
 */
export interface RetrogradePeriod {
  planet: PlanetId
  /** Julian Day when retrograde begins (station retrograde) */
  startJD: number
  /** Julian Day when retrograde ends (station direct) */
  endJD: number
  /** Duration in days */
  durationDays: number
  /** Longitude range traversed during retrograde */
  longitudeRange: { start: number; end: number }
}

/**
 * Find the next retrograde station for a planet.
 * Searches forward from the given JD until the planet goes retrograde.
 *
 * @param getPosition - Function to get planet position
 * @param jd - Starting Julian Day
 * @param planet - Planet to search for
 * @param maxDays - Maximum days to search (default 730 = ~2 years)
 * @returns Julian Day of next retrograde station, or null if not found
 */
export function findNextRetrogradeStation(
  getPosition: (jd: number) => { longitude: number; declination: number },
  jd: number,
  planet: PlanetId,
  maxDays: number = 730
): number | null {
  // Sun and Moon don't go retrograde
  if (planet === "sun" || planet === "moon") {
    return null
  }

  const step = 1.0 // Search in 1-day steps

  let currentJD = jd
  let wasRetrograde = calculateSinglePlanetSpeed(
    getPosition,
    currentJD,
    planet
  ).isRetrograde

  for (let i = 0; i < maxDays; i++) {
    currentJD += step
    const speed = calculateSinglePlanetSpeed(getPosition, currentJD, planet)

    // Look for transition from direct to retrograde
    if (!wasRetrograde && speed.isRetrograde) {
      // Refine the station time with bisection
      let low = currentJD - step
      let high = currentJD

      for (let j = 0; j < 20; j++) {
        const mid = (low + high) / 2
        const midSpeed = calculateSinglePlanetSpeed(getPosition, mid, planet)

        if (midSpeed.isRetrograde) {
          high = mid
        } else {
          low = mid
        }
      }

      return (low + high) / 2
    }

    wasRetrograde = speed.isRetrograde
  }

  return null
}

/**
 * Find the next direct station for a planet (end of retrograde).
 *
 * @param getPosition - Function to get planet position
 * @param jd - Starting Julian Day (should be during retrograde)
 * @param planet - Planet to search for
 * @param maxDays - Maximum days to search
 * @returns Julian Day of next direct station, or null if not found
 */
export function findNextDirectStation(
  getPosition: (jd: number) => { longitude: number; declination: number },
  jd: number,
  planet: PlanetId,
  maxDays: number = 365
): number | null {
  if (planet === "sun" || planet === "moon") {
    return null
  }

  const step = 1.0

  let currentJD = jd
  let wasRetrograde = calculateSinglePlanetSpeed(
    getPosition,
    currentJD,
    planet
  ).isRetrograde

  // If not currently retrograde, return null
  if (!wasRetrograde) {
    return null
  }

  for (let i = 0; i < maxDays; i++) {
    currentJD += step
    const speed = calculateSinglePlanetSpeed(getPosition, currentJD, planet)

    // Look for transition from retrograde to direct
    if (wasRetrograde && !speed.isRetrograde) {
      // Refine with bisection
      let low = currentJD - step
      let high = currentJD

      for (let j = 0; j < 20; j++) {
        const mid = (low + high) / 2
        const midSpeed = calculateSinglePlanetSpeed(getPosition, mid, planet)

        if (midSpeed.isRetrograde) {
          low = mid
        } else {
          high = mid
        }
      }

      return (low + high) / 2
    }

    wasRetrograde = speed.isRetrograde
  }

  return null
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format speed as a human-readable string.
 *
 * @param speed - Planet speed data
 * @returns Formatted string like "+0.95°/day" or "R -0.12°/day"
 */
export function formatSpeed(speed: PlanetSpeed): string {
  const sign = speed.longitudeSpeed >= 0 ? "+" : ""
  const retroLabel = speed.isRetrograde ? "R " : ""
  const statLabel = speed.isStationary ? " (Sta)" : ""

  return `${retroLabel}${sign}${speed.longitudeSpeed.toFixed(2)}°/day${statLabel}`
}

/**
 * Check if a planet can go retrograde.
 * Only the planets (not Sun or Moon) exhibit apparent retrograde motion.
 */
export function canGoRetrograde(planet: PlanetId): boolean {
  return planet !== "sun" && planet !== "moon"
}
