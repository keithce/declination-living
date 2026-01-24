/**
 * Paran Solver - Find latitudes where two planets are simultaneously angular.
 *
 * A paran (from "paranatellonta") occurs when two celestial bodies are
 * simultaneously in angular positions:
 * - Rising (crossing the eastern horizon)
 * - Setting (crossing the western horizon)
 * - Culminating (crossing the upper meridian - MC)
 * - Anti-culminating (crossing the lower meridian - IC)
 *
 * The paran latitude is found where the Local Sidereal Time for both
 * events is the same.
 */

import type {
  PlanetId,
  AngularEvent,
  ParanPoint,
  ParanResult,
  EquatorialCoordinates,
} from "../core/types"
import { PLANET_IDS, ANGULAR_EVENT_NAMES } from "../core/types"
import {
  PARAN_LATITUDE_STEP,
  PARAN_BISECTION_TOL,
  PARAN_MAX_ITERATIONS,
} from "../core/constants"
import { calculateSDA } from "../coordinates/sda"
import { bisectionSolve, normalizeDegrees, normalizeDegreesSymmetric } from "../core/math"

// =============================================================================
// Types
// =============================================================================

/** Input for paran calculation */
export interface ParanInput {
  planet1: PlanetId
  ra1: number // Right Ascension in degrees
  dec1: number // Declination in degrees
  planet2: PlanetId
  ra2: number
  dec2: number
}

/** Detailed paran point with additional info */
export interface DetailedParanPoint extends ParanPoint {
  /** Local Sidereal Time when this paran occurs */
  lst: number
  /** Whether this paran is exact or approximate */
  isExact: boolean
  /** Description of the paran */
  description: string
}

// =============================================================================
// Hour Angle for Events
// =============================================================================

/**
 * Get the hour angle for a specific angular event.
 *
 * @param event - Angular event type
 * @param declination - Planet's declination
 * @param latitude - Observer's latitude
 * @returns Hour angle in degrees, or null if event doesn't occur
 */
function getHourAngleForEvent(
  event: AngularEvent,
  declination: number,
  latitude: number
): number | null {
  switch (event) {
    case "culminate":
      // Hour angle = 0 at upper culmination (MC)
      return 0

    case "anti_culminate":
      // Hour angle = 180 at lower culmination (IC)
      return 180

    case "rise":
    case "set": {
      const sda = calculateSDA(latitude, declination)

      if (event === "rise") {
        // Rising: negative hour angle
        return sda.riseHA ?? null
      } else {
        // Setting: positive hour angle
        return sda.setHA ?? null
      }
    }
  }
}

/**
 * Calculate the LST (Local Sidereal Time) when an event occurs.
 *
 * LST = RA + HA
 *
 * @param ra - Right Ascension in degrees
 * @param ha - Hour Angle in degrees
 * @returns LST in degrees (0-360)
 */
function getLSTForEvent(ra: number, ha: number): number {
  return normalizeDegrees(ra + ha)
}

// =============================================================================
// Paran Timing Difference Function
// =============================================================================

/**
 * Calculate the timing difference between two angular events at a latitude.
 *
 * Returns the LST difference: LST_event1 - LST_event2
 * When this equals 0 (or 360), both events occur at the same LST = paran.
 *
 * @param latitude - Observer's latitude
 * @param dec1 - Declination of planet 1
 * @param ra1 - Right Ascension of planet 1
 * @param event1 - Angular event for planet 1
 * @param dec2 - Declination of planet 2
 * @param ra2 - Right Ascension of planet 2
 * @param event2 - Angular event for planet 2
 * @returns LST difference in degrees, or null if either event doesn't occur
 */
function paranTimingDifference(
  latitude: number,
  dec1: number,
  ra1: number,
  event1: AngularEvent,
  dec2: number,
  ra2: number,
  event2: AngularEvent
): number | null {
  const ha1 = getHourAngleForEvent(event1, dec1, latitude)
  const ha2 = getHourAngleForEvent(event2, dec2, latitude)

  if (ha1 === null || ha2 === null) {
    // One of the events doesn't occur at this latitude
    return null
  }

  const lst1 = getLSTForEvent(ra1, ha1)
  const lst2 = getLSTForEvent(ra2, ha2)

  // Return the signed difference, normalized to [-180, 180]
  return normalizeDegreesSymmetric(lst1 - lst2)
}

// =============================================================================
// Paran Latitude Finder
// =============================================================================

/**
 * Find all latitudes where a specific paran occurs between two planets.
 *
 * Uses bisection search across the latitude range to find zero-crossings
 * of the timing difference function.
 *
 * @param dec1 - Declination of planet 1
 * @param ra1 - Right Ascension of planet 1
 * @param event1 - Angular event for planet 1
 * @param dec2 - Declination of planet 2
 * @param ra2 - Right Ascension of planet 2
 * @param event2 - Angular event for planet 2
 * @returns Array of latitudes where this paran occurs
 */
export function findParanLatitudes(
  dec1: number,
  ra1: number,
  event1: AngularEvent,
  dec2: number,
  ra2: number,
  event2: AngularEvent
): number[] {
  const parans: number[] = []

  // Sample latitudes to find sign changes
  const latitudes: number[] = []
  const differences: (number | null)[] = []

  for (let lat = -89; lat <= 89; lat += PARAN_LATITUDE_STEP) {
    latitudes.push(lat)
    differences.push(
      paranTimingDifference(lat, dec1, ra1, event1, dec2, ra2, event2)
    )
  }

  // Find sign changes (potential paran locations)
  for (let i = 0; i < latitudes.length - 1; i++) {
    const diff1 = differences[i]
    const diff2 = differences[i + 1]

    // Skip if either is null (event doesn't occur)
    if (diff1 === null || diff2 === null) {
      continue
    }

    // Check for sign change (zero crossing)
    // Also check for wrap-around at ±180
    const hasSignChange =
      diff1 * diff2 < 0 && Math.abs(diff1) < 90 && Math.abs(diff2) < 90

    if (hasSignChange) {
      // Use bisection to find the exact latitude
      const result = bisectionSolve(
        (lat) => {
          const diff = paranTimingDifference(
            lat,
            dec1,
            ra1,
            event1,
            dec2,
            ra2,
            event2
          )
          return diff ?? 1000 // Return large value if event doesn't occur
        },
        latitudes[i],
        latitudes[i + 1],
        PARAN_BISECTION_TOL,
        PARAN_MAX_ITERATIONS
      )

      if (result.converged && result.root !== null) {
        parans.push(result.root)
      }
    }
  }

  return parans
}

// =============================================================================
// Complete Paran Calculation
// =============================================================================

/**
 * Calculate all parans for a pair of planets.
 *
 * @param planet1 - First planet ID
 * @param ra1 - RA of planet 1
 * @param dec1 - Dec of planet 1
 * @param planet2 - Second planet ID
 * @param ra2 - RA of planet 2
 * @param dec2 - Dec of planet 2
 * @returns Array of paran points
 */
export function calculatePlanetPairParans(
  planet1: PlanetId,
  ra1: number,
  dec1: number,
  planet2: PlanetId,
  ra2: number,
  dec2: number
): ParanPoint[] {
  const parans: ParanPoint[] = []
  const events: AngularEvent[] = ["rise", "set", "culminate", "anti_culminate"]

  // Check all combinations of events
  for (const event1 of events) {
    for (const event2 of events) {
      const latitudes = findParanLatitudes(
        dec1,
        ra1,
        event1,
        dec2,
        ra2,
        event2
      )

      for (const latitude of latitudes) {
        // Calculate strength based on how close to exact
        const diff = paranTimingDifference(
          latitude,
          dec1,
          ra1,
          event1,
          dec2,
          ra2,
          event2
        )
        const strength = diff !== null ? 1 - Math.abs(diff) / 180 : 0

        parans.push({
          planet1,
          event1,
          planet2,
          event2,
          latitude,
          strength,
        })
      }
    }
  }

  return parans
}

/**
 * Calculate all parans for all planet pairs.
 *
 * This is O(n² × k² × L) where:
 * - n = 10 planets
 * - k = 4 events
 * - L = ~320 latitude steps
 *
 * Performance optimization: Uses early termination and adaptive stepping.
 *
 * @param positions - Equatorial positions for all planets
 * @returns Complete paran result
 */
export function calculateAllParans(
  positions: Record<PlanetId, EquatorialCoordinates>
): ParanResult {
  const points: ParanPoint[] = []
  let riseRise = 0
  let riseCulminate = 0
  let riseSet = 0
  let culminateCulminate = 0
  let setSet = 0

  // Calculate parans for each unique planet pair
  for (let i = 0; i < PLANET_IDS.length; i++) {
    for (let j = i + 1; j < PLANET_IDS.length; j++) {
      const planet1 = PLANET_IDS[i]
      const planet2 = PLANET_IDS[j]

      const pos1 = positions[planet1]
      const pos2 = positions[planet2]

      const pairParans = calculatePlanetPairParans(
        planet1,
        pos1.ra,
        pos1.dec,
        planet2,
        pos2.ra,
        pos2.dec
      )

      // Count by type
      for (const paran of pairParans) {
        const e1 = paran.event1
        const e2 = paran.event2

        if (e1 === "rise" && e2 === "rise") riseRise++
        else if (
          (e1 === "rise" && e2 === "culminate") ||
          (e1 === "culminate" && e2 === "rise")
        )
          riseCulminate++
        else if (
          (e1 === "rise" && e2 === "set") ||
          (e1 === "set" && e2 === "rise")
        )
          riseSet++
        else if (e1 === "culminate" && e2 === "culminate")
          culminateCulminate++
        else if (e1 === "set" && e2 === "set") setSet++
      }

      points.push(...pairParans)
    }
  }

  // Sort by latitude
  points.sort((a, b) => a.latitude - b.latitude)

  return {
    points,
    summary: {
      riseRise,
      riseCulminate,
      riseSet,
      culminateCulminate,
      setSet,
      total: points.length,
    },
  }
}

// =============================================================================
// Paran Filtering and Queries
// =============================================================================

/**
 * Get parans near a specific latitude.
 *
 * @param parans - Array of paran points
 * @param latitude - Target latitude
 * @param orb - Maximum distance in degrees
 * @returns Filtered parans
 */
export function getParansNearLatitude(
  parans: ParanPoint[],
  latitude: number,
  orb: number = 2
): ParanPoint[] {
  return parans.filter((p) => Math.abs(p.latitude - latitude) <= orb)
}

/**
 * Get parans involving a specific planet.
 *
 * @param parans - Array of paran points
 * @param planet - Planet to filter by
 * @returns Filtered parans
 */
export function getParansForPlanet(
  parans: ParanPoint[],
  planet: PlanetId
): ParanPoint[] {
  return parans.filter((p) => p.planet1 === planet || p.planet2 === planet)
}

/**
 * Get parans of a specific event type.
 *
 * @param parans - Array of paran points
 * @param event - Event type to filter by
 * @returns Filtered parans where either planet has this event
 */
export function getParansByEvent(
  parans: ParanPoint[],
  event: AngularEvent
): ParanPoint[] {
  return parans.filter((p) => p.event1 === event || p.event2 === event)
}

/**
 * Get the strongest parans (highest strength values).
 *
 * @param parans - Array of paran points
 * @param topN - Number of top parans to return
 * @returns Top N parans by strength
 */
export function getStrongestParans(
  parans: ParanPoint[],
  topN: number = 10
): ParanPoint[] {
  return [...parans]
    .sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0))
    .slice(0, topN)
}

// =============================================================================
// Paran Description
// =============================================================================

/**
 * Generate a human-readable description of a paran.
 *
 * @param paran - Paran point
 * @returns Description string
 */
export function describeParان(paran: ParanPoint): string {
  const planetNames: Record<PlanetId, string> = {
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptune",
    pluto: "Pluto",
  }

  const p1 = planetNames[paran.planet1]
  const p2 = planetNames[paran.planet2]
  const e1 = ANGULAR_EVENT_NAMES[paran.event1]
  const e2 = ANGULAR_EVENT_NAMES[paran.event2]
  const lat = paran.latitude.toFixed(1)

  return `${p1} ${e1} / ${p2} ${e2} at ${lat}°`
}

/**
 * Get interpretation keywords for a paran based on the planets involved.
 * This is a simplified interpretation system.
 *
 * @param paran - Paran point
 * @returns Array of interpretation keywords
 */
export function getParanKeywords(paran: ParanPoint): string[] {
  const keywords: Record<PlanetId, string[]> = {
    sun: ["identity", "vitality", "success", "leadership"],
    moon: ["emotions", "intuition", "nurturing", "public"],
    mercury: ["communication", "intellect", "travel", "commerce"],
    venus: ["love", "beauty", "harmony", "values"],
    mars: ["action", "energy", "courage", "competition"],
    jupiter: ["expansion", "luck", "wisdom", "optimism"],
    saturn: ["discipline", "structure", "responsibility", "mastery"],
    uranus: ["innovation", "freedom", "sudden changes", "originality"],
    neptune: ["spirituality", "imagination", "transcendence", "confusion"],
    pluto: ["transformation", "power", "intensity", "rebirth"],
  }

  return [...keywords[paran.planet1], ...keywords[paran.planet2]]
}

// =============================================================================
// Paran Latitude Bands
// =============================================================================

/**
 * Group parans into latitude bands for visualization.
 *
 * @param parans - Array of paran points
 * @param bandSize - Size of each band in degrees
 * @returns Map of band center to parans in that band
 */
export function groupParansByLatitudeBand(
  parans: ParanPoint[],
  bandSize: number = 5
): Map<number, ParanPoint[]> {
  const bands = new Map<number, ParanPoint[]>()

  for (const paran of parans) {
    const bandCenter =
      Math.round(paran.latitude / bandSize) * bandSize

    if (!bands.has(bandCenter)) {
      bands.set(bandCenter, [])
    }
    bands.get(bandCenter)!.push(paran)
  }

  return bands
}
