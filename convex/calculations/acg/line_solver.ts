/**
 * ACG (Astro*Carto*Graphy) Line Solver.
 *
 * Calculates the four types of planetary lines on a map:
 * - MC (Midheaven): Longitude where planet is culminating (on meridian)
 * - IC (Imum Coeli): Longitude where planet is anti-culminating (opposite meridian)
 * - ASC (Ascendant): Curve where planet is rising
 * - DSC (Descendant): Curve where planet is setting
 *
 * MC/IC lines are vertical (constant longitude).
 * ASC/DSC lines are curves that depend on both latitude and declination.
 */

import type {
  PlanetId,
  ACGLine,
  ACGLineType,
  GeoLocation,
  EquatorialCoordinates,
} from "../core/types"
import { PLANET_IDS } from "../core/types"
import {
  ACG_LONGITUDE_STEP,
  ACG_LATITUDE_STEP,
  ACG_MAX_LATITUDE,
} from "../core/constants"
import {
  longitudeForMC,
  longitudeForIC,
  getGMST,
} from "../coordinates/hour_angle"
import { calculateSDA, getRiseSetLatitudeRange } from "../coordinates/sda"
import {
  normalizeDegrees,
  normalizeDegreesSymmetric,
  tanDeg,
  acosDeg,
} from "../core/math"

// =============================================================================
// MC/IC Line Calculation (Vertical Lines)
// =============================================================================

/**
 * Calculate the MC line for a planet.
 *
 * The MC line is a vertical great circle at the longitude where
 * the planet is on the meridian (hour angle = 0).
 *
 * @param jd - Julian Day
 * @param planetRA - Planet's Right Ascension in degrees
 * @param planet - Planet ID
 * @returns ACGLine with points from -90 to +90 latitude
 */
export function calculateMCLine(
  jd: number,
  planetRA: number,
  planet: PlanetId
): ACGLine {
  const mcLongitude = longitudeForMC(jd, planetRA)

  // MC line is vertical - same longitude for all latitudes
  const points: GeoLocation[] = []

  for (let lat = -ACG_MAX_LATITUDE; lat <= ACG_MAX_LATITUDE; lat += ACG_LATITUDE_STEP) {
    points.push({ latitude: lat, longitude: mcLongitude })
  }

  return {
    planet,
    lineType: "MC",
    points,
    isCircumpolar: false, // MC line always exists
  }
}

/**
 * Calculate the IC line for a planet.
 *
 * The IC line is a vertical great circle at the longitude where
 * the planet is at anti-culmination (hour angle = 180°).
 *
 * @param jd - Julian Day
 * @param planetRA - Planet's Right Ascension in degrees
 * @param planet - Planet ID
 * @returns ACGLine with points from -90 to +90 latitude
 */
export function calculateICLine(
  jd: number,
  planetRA: number,
  planet: PlanetId
): ACGLine {
  const icLongitude = longitudeForIC(jd, planetRA)

  const points: GeoLocation[] = []

  for (let lat = -ACG_MAX_LATITUDE; lat <= ACG_MAX_LATITUDE; lat += ACG_LATITUDE_STEP) {
    points.push({ latitude: lat, longitude: icLongitude })
  }

  return {
    planet,
    lineType: "IC",
    points,
    isCircumpolar: false,
  }
}

// =============================================================================
// ASC/DSC Line Calculation (Curved Lines)
// =============================================================================

/**
 * Calculate the longitude where a planet rises at a given latitude.
 *
 * At the moment of rising:
 * - Hour angle = -H₀ (where H₀ is the semi-diurnal arc)
 * - Longitude = -H₀ + RA - GMST
 *
 * @param jd - Julian Day
 * @param planetRA - Planet's Right Ascension in degrees
 * @param planetDec - Planet's Declination in degrees
 * @param latitude - Observer's latitude in degrees
 * @returns Longitude where planet rises, or null if it never rises
 */
function longitudeForRising(
  jd: number,
  planetRA: number,
  planetDec: number,
  latitude: number
): number | null {
  const sda = calculateSDA(latitude, planetDec)

  if (sda.neverRises || sda.riseHA === undefined) {
    return null
  }

  const gmst = getGMST(jd)
  // LHA = GMST + longitude - RA
  // At rising, LHA = riseHA (negative)
  // longitude = LHA + RA - GMST
  const longitude = sda.riseHA + planetRA - gmst

  return normalizeDegreesSymmetric(longitude)
}

/**
 * Calculate the longitude where a planet sets at a given latitude.
 *
 * At the moment of setting:
 * - Hour angle = +H₀ (positive)
 * - Longitude = H₀ + RA - GMST
 *
 * @param jd - Julian Day
 * @param planetRA - Planet's Right Ascension in degrees
 * @param planetDec - Planet's Declination in degrees
 * @param latitude - Observer's latitude in degrees
 * @returns Longitude where planet sets, or null if it never sets
 */
function longitudeForSetting(
  jd: number,
  planetRA: number,
  planetDec: number,
  latitude: number
): number | null {
  const sda = calculateSDA(latitude, planetDec)

  if (sda.neverSets || sda.setHA === undefined) {
    return null
  }

  const gmst = getGMST(jd)
  const longitude = sda.setHA + planetRA - gmst

  return normalizeDegreesSymmetric(longitude)
}

/**
 * Calculate the ASC (Ascendant) line for a planet.
 *
 * The ASC line shows where the planet is rising. It's a curve
 * that varies with latitude due to the changing hour angle at rise.
 *
 * @param jd - Julian Day
 * @param planetRA - Planet's Right Ascension in degrees
 * @param planetDec - Planet's Declination in degrees
 * @param planet - Planet ID
 * @returns ACGLine with the ASC curve
 */
export function calculateASCLine(
  jd: number,
  planetRA: number,
  planetDec: number,
  planet: PlanetId
): ACGLine {
  const points: GeoLocation[] = []
  const range = getRiseSetLatitudeRange(planetDec)

  // Sample latitudes within the valid range
  const minLat = Math.max(-ACG_MAX_LATITUDE, range.minLatitude + 0.5)
  const maxLat = Math.min(ACG_MAX_LATITUDE, range.maxLatitude - 0.5)

  for (let lat = minLat; lat <= maxLat; lat += ACG_LATITUDE_STEP) {
    const lon = longitudeForRising(jd, planetRA, planetDec, lat)
    if (lon !== null) {
      points.push({ latitude: lat, longitude: lon })
    }
  }

  // Check if the line is circumpolar (doesn't span full latitude range)
  const isCircumpolar =
    range.minLatitude > -ACG_MAX_LATITUDE || range.maxLatitude < ACG_MAX_LATITUDE

  return {
    planet,
    lineType: "ASC",
    points,
    isCircumpolar,
  }
}

/**
 * Calculate the DSC (Descendant) line for a planet.
 *
 * The DSC line shows where the planet is setting.
 *
 * @param jd - Julian Day
 * @param planetRA - Planet's Right Ascension in degrees
 * @param planetDec - Planet's Declination in degrees
 * @param planet - Planet ID
 * @returns ACGLine with the DSC curve
 */
export function calculateDSCLine(
  jd: number,
  planetRA: number,
  planetDec: number,
  planet: PlanetId
): ACGLine {
  const points: GeoLocation[] = []
  const range = getRiseSetLatitudeRange(planetDec)

  const minLat = Math.max(-ACG_MAX_LATITUDE, range.minLatitude + 0.5)
  const maxLat = Math.min(ACG_MAX_LATITUDE, range.maxLatitude - 0.5)

  for (let lat = minLat; lat <= maxLat; lat += ACG_LATITUDE_STEP) {
    const lon = longitudeForSetting(jd, planetRA, planetDec, lat)
    if (lon !== null) {
      points.push({ latitude: lat, longitude: lon })
    }
  }

  const isCircumpolar =
    range.minLatitude > -ACG_MAX_LATITUDE || range.maxLatitude < ACG_MAX_LATITUDE

  return {
    planet,
    lineType: "DSC",
    points,
    isCircumpolar,
  }
}

// =============================================================================
// Complete ACG Line Set
// =============================================================================

/**
 * Calculate all four ACG lines for a single planet.
 *
 * @param jd - Julian Day
 * @param planetRA - Planet's Right Ascension in degrees
 * @param planetDec - Planet's Declination in degrees
 * @param planet - Planet ID
 * @returns Array of four ACGLines (MC, IC, ASC, DSC)
 */
export function calculatePlanetACGLines(
  jd: number,
  planetRA: number,
  planetDec: number,
  planet: PlanetId
): ACGLine[] {
  return [
    calculateMCLine(jd, planetRA, planet),
    calculateICLine(jd, planetRA, planet),
    calculateASCLine(jd, planetRA, planetDec, planet),
    calculateDSCLine(jd, planetRA, planetDec, planet),
  ]
}

/**
 * Calculate all ACG lines for all planets.
 *
 * @param jd - Julian Day
 * @param positions - Equatorial positions for all planets
 * @returns Array of all ACG lines (40 total: 10 planets × 4 lines)
 */
export function calculateAllACGLines(
  jd: number,
  positions: Record<PlanetId, EquatorialCoordinates>
): ACGLine[] {
  const lines: ACGLine[] = []

  for (const planet of PLANET_IDS) {
    const pos = positions[planet]
    lines.push(...calculatePlanetACGLines(jd, pos.ra, pos.dec, planet))
  }

  return lines
}

// =============================================================================
// ACG Line Queries
// =============================================================================

/**
 * Find ACG lines passing near a specific location.
 *
 * @param location - Geographic location
 * @param lines - Array of ACG lines
 * @param orb - Maximum distance in degrees to consider "near"
 * @returns Lines passing near the location
 */
export function findACGLinesNearLocation(
  location: GeoLocation,
  lines: ACGLine[],
  orb: number = 2
): Array<{ line: ACGLine; minDistance: number }> {
  const results: Array<{ line: ACGLine; minDistance: number }> = []

  for (const line of lines) {
    let minDistance = Infinity

    for (const point of line.points) {
      // Simple distance calculation (not great circle, but good enough for small distances)
      const latDiff = Math.abs(point.latitude - location.latitude)
      const lonDiff = Math.abs(
        normalizeDegreesSymmetric(point.longitude - location.longitude)
      )

      // Approximate distance (degrees)
      const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff)

      if (distance < minDistance) {
        minDistance = distance
      }
    }

    if (minDistance <= orb) {
      results.push({ line, minDistance })
    }
  }

  // Sort by distance
  results.sort((a, b) => a.minDistance - b.minDistance)

  return results
}

/**
 * Get all ACG lines of a specific type.
 *
 * @param lines - Array of ACG lines
 * @param lineType - Type to filter by
 * @returns Filtered lines
 */
export function filterACGLinesByType(
  lines: ACGLine[],
  lineType: ACGLineType
): ACGLine[] {
  return lines.filter((line) => line.lineType === lineType)
}

/**
 * Get all ACG lines for a specific planet.
 *
 * @param lines - Array of ACG lines
 * @param planet - Planet to filter by
 * @returns Filtered lines
 */
export function filterACGLinesByPlanet(
  lines: ACGLine[],
  planet: PlanetId
): ACGLine[] {
  return lines.filter((line) => line.planet === planet)
}

// =============================================================================
// ACG Line Intersections
// =============================================================================

/**
 * Find where two ACG lines intersect.
 * This is useful for finding crossing points (e.g., Jupiter MC crossing Venus ASC).
 *
 * @param line1 - First ACG line
 * @param line2 - Second ACG line
 * @param tolerance - Maximum distance to consider an intersection
 * @returns Intersection points, if any
 */
export function findACGLineIntersections(
  line1: ACGLine,
  line2: ACGLine,
  tolerance: number = 1
): GeoLocation[] {
  const intersections: GeoLocation[] = []

  // Simple O(n*m) search - could be optimized with spatial indexing
  for (const p1 of line1.points) {
    for (const p2 of line2.points) {
      const latDiff = Math.abs(p1.latitude - p2.latitude)
      const lonDiff = Math.abs(
        normalizeDegreesSymmetric(p1.longitude - p2.longitude)
      )

      if (latDiff < tolerance && lonDiff < tolerance) {
        // Found an intersection - average the positions
        intersections.push({
          latitude: (p1.latitude + p2.latitude) / 2,
          longitude: normalizeDegreesSymmetric(
            (p1.longitude + p2.longitude) / 2
          ),
        })
      }
    }
  }

  // Remove duplicate intersections
  const unique: GeoLocation[] = []
  for (const int of intersections) {
    const isDupe = unique.some(
      (u) =>
        Math.abs(u.latitude - int.latitude) < tolerance &&
        Math.abs(normalizeDegreesSymmetric(u.longitude - int.longitude)) <
          tolerance
    )
    if (!isDupe) {
      unique.push(int)
    }
  }

  return unique
}

// =============================================================================
// Visualization Helpers
// =============================================================================

/**
 * Get the display name for an ACG line.
 */
export function getACGLineName(line: ACGLine): string {
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

  return `${planetNames[line.planet]} ${line.lineType}`
}

/**
 * Determine if an ACG line should be rendered as dashed.
 * Convention: MC/IC are dashed, ASC/DSC are solid.
 */
export function isACGLineDashed(lineType: ACGLineType): boolean {
  return lineType === "MC" || lineType === "IC"
}
