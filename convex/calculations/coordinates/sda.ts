/**
 * Semi-Diurnal Arc (SDA) calculations.
 *
 * The semi-diurnal arc is half the time an object spends above the horizon,
 * expressed in degrees of hour angle. It's fundamental for determining:
 * - Rise and set times
 * - Whether objects are circumpolar (never set) or never rise
 * - ASC/DSC line calculations for ACG
 */

import type { SemiDiurnalArc } from "../core/types"
import { sinDeg, cosDeg, tanDeg, acosDeg } from "../core/math"
import { EPSILON } from "../core/constants"

// =============================================================================
// Core SDA Calculation
// =============================================================================

/**
 * Calculate the Semi-Diurnal Arc for an object at a given latitude.
 *
 * The SDA is found from the hour angle formula for rising/setting:
 * cos(H) = -tan(φ) * tan(δ)
 *
 * Where:
 * - H = hour angle at rising/setting (SDA)
 * - φ = observer's latitude
 * - δ = object's declination
 *
 * Special cases:
 * - |cos(H)| > 1: Object is circumpolar or never rises
 * - cos(H) > 1: Object never rises (always below horizon)
 * - cos(H) < -1: Object never sets (always above horizon)
 *
 * @param latitude - Observer's latitude in degrees (-90 to +90)
 * @param declination - Object's declination in degrees (-90 to +90)
 * @returns SemiDiurnalArc with SDA, circumpolar flags, and rise/set hour angles
 */
export function calculateSDA(
  latitude: number,
  declination: number
): SemiDiurnalArc {
  // Handle pole cases
  if (Math.abs(latitude) > 89.9) {
    // At the poles, objects with same sign declination never set
    // Objects with opposite sign declination never rise
    if (latitude * declination > 0) {
      return {
        sda: 180,
        neverSets: true,
        neverRises: false,
        riseHA: undefined,
        setHA: undefined,
      }
    } else {
      return {
        sda: 0,
        neverSets: false,
        neverRises: true,
        riseHA: undefined,
        setHA: undefined,
      }
    }
  }

  // Calculate cos(H) = -tan(lat) * tan(dec)
  const cosH = -tanDeg(latitude) * tanDeg(declination)

  // Check for circumpolar cases
  if (cosH < -1 + EPSILON) {
    // cos(H) < -1 means object never sets (circumpolar)
    return {
      sda: 180,
      neverSets: true,
      neverRises: false,
      riseHA: undefined,
      setHA: undefined,
    }
  }

  if (cosH > 1 - EPSILON) {
    // cos(H) > 1 means object never rises
    return {
      sda: 0,
      neverSets: false,
      neverRises: true,
      riseHA: undefined,
      setHA: undefined,
    }
  }

  // Normal case: object rises and sets
  const sda = acosDeg(cosH)

  return {
    sda,
    neverSets: false,
    neverRises: false,
    riseHA: -sda, // Rising (east, negative hour angle)
    setHA: sda, // Setting (west, positive hour angle)
  }
}

// =============================================================================
// Circumpolar Latitude Calculations
// =============================================================================

/**
 * Find the critical latitudes where an object becomes circumpolar or invisible.
 *
 * For a given declination δ:
 * - Object never sets (circumpolar) when |φ| > 90° - |δ| (same sign as δ)
 * - Object never rises when |φ| > 90° - |δ| (opposite sign from δ)
 *
 * @param declination - Object's declination in degrees
 * @returns Critical latitudes for circumpolar behavior
 */
export function getCircumpolarLatitude(declination: number): {
  /** Latitude above which object never sets (in same hemisphere) */
  neverSetsAbove: number
  /** Latitude above which object never rises (in opposite hemisphere) */
  neverRisesAbove: number
  /** Whether object can be circumpolar (|dec| < 90) */
  canBeCircumpolar: boolean
} {
  const absDec = Math.abs(declination)

  // Critical latitude where object becomes circumpolar
  const criticalLat = 90 - absDec

  // Can only be circumpolar if declination is not 0
  const canBeCircumpolar = absDec > EPSILON

  if (declination >= 0) {
    // Northern declination: circumpolar in northern latitudes
    return {
      neverSetsAbove: criticalLat,
      neverRisesAbove: -criticalLat, // In southern hemisphere
      canBeCircumpolar,
    }
  } else {
    // Southern declination: circumpolar in southern latitudes
    return {
      neverSetsAbove: -criticalLat, // Negative latitude (south)
      neverRisesAbove: criticalLat, // In northern hemisphere
      canBeCircumpolar,
    }
  }
}

/**
 * Check if an object is circumpolar at a given latitude.
 *
 * @param latitude - Observer's latitude in degrees
 * @param declination - Object's declination in degrees
 * @returns True if object never sets at this latitude
 */
export function isCircumpolar(latitude: number, declination: number): boolean {
  const sda = calculateSDA(latitude, declination)
  return sda.neverSets
}

/**
 * Check if an object never rises at a given latitude.
 *
 * @param latitude - Observer's latitude in degrees
 * @param declination - Object's declination in degrees
 * @returns True if object never rises at this latitude
 */
export function neverRises(latitude: number, declination: number): boolean {
  const sda = calculateSDA(latitude, declination)
  return sda.neverRises
}

// =============================================================================
// Latitude from Hour Angle
// =============================================================================

/**
 * Find the latitude(s) where an object has a specific hour angle at rise/set.
 * This is the inverse problem: given H, find φ.
 *
 * From cos(H) = -tan(φ) * tan(δ):
 * tan(φ) = -cos(H) / tan(δ)
 *
 * @param hourAngle - Target hour angle in degrees (typically rise or set)
 * @param declination - Object's declination in degrees
 * @returns Latitude where object has this hour angle at rise/set, or null if impossible
 */
export function latitudeForHourAngle(
  hourAngle: number,
  declination: number
): number | null {
  // Handle zero declination (on celestial equator)
  if (Math.abs(declination) < EPSILON) {
    // Object on equator rises/sets at H = ±90° everywhere except poles
    if (Math.abs(Math.abs(hourAngle) - 90) < EPSILON) {
      return 0 // Returns equator, but actually any non-polar latitude works
    }
    return null
  }

  const cosH = cosDeg(hourAngle)
  const tanDec = tanDeg(declination)

  // tan(φ) = -cos(H) / tan(δ)
  const tanLat = -cosH / tanDec

  // Convert back to latitude
  const lat = Math.atan(tanLat) * (180 / Math.PI)

  // Verify the result is valid
  if (Math.abs(lat) > 90) {
    return null
  }

  return lat
}

// =============================================================================
// Diurnal Period Calculations
// =============================================================================

/**
 * Calculate the length of daylight (diurnal arc) for an object.
 *
 * @param latitude - Observer's latitude in degrees
 * @param declination - Object's declination in degrees
 * @returns Diurnal arc in hours, or special values for circumpolar cases
 */
export function getDiurnalArcHours(
  latitude: number,
  declination: number
): number | "always_up" | "always_down" {
  const sda = calculateSDA(latitude, declination)

  if (sda.neverSets) {
    return "always_up"
  }

  if (sda.neverRises) {
    return "always_down"
  }

  // Convert SDA (degrees) to hours (15° per hour)
  // Diurnal arc = 2 * SDA
  return (2 * sda.sda) / 15
}

/**
 * Calculate the length of night (nocturnal arc) for an object.
 *
 * @param latitude - Observer's latitude in degrees
 * @param declination - Object's declination in degrees
 * @returns Nocturnal arc in hours
 */
export function getNocturnalArcHours(
  latitude: number,
  declination: number
): number | "always_up" | "always_down" {
  const diurnal = getDiurnalArcHours(latitude, declination)

  if (diurnal === "always_up") {
    return "always_down"
  }

  if (diurnal === "always_down") {
    return "always_up"
  }

  return 24 - diurnal
}

// =============================================================================
// ASC/DSC Line Latitude Calculation
// =============================================================================

/**
 * Find all latitudes where an object rises or sets.
 * Used for calculating ASC/DSC lines in ACG.
 *
 * For a given declination, the object can rise/set at latitudes where:
 * |latitude| < 90° - |declination| (same hemisphere)
 * |latitude| < 90° + |declination| (opposite hemisphere, always true)
 *
 * @param declination - Object's declination in degrees
 * @returns Range of latitudes where rise/set occurs
 */
export function getRiseSetLatitudeRange(declination: number): {
  minLatitude: number
  maxLatitude: number
} {
  const absDec = Math.abs(declination)

  // Object can rise/set at all latitudes except beyond 90-|dec|
  // in the same hemisphere as the declination
  if (declination >= 0) {
    // Northern declination: can't rise/set above (90-dec) in north
    return {
      minLatitude: -90 + absDec, // Southern limit (never invisible in south)
      maxLatitude: 90 - absDec, // Northern limit (becomes circumpolar)
    }
  } else {
    // Southern declination: can't rise/set below -(90-|dec|) in south
    return {
      minLatitude: -(90 - absDec), // Southern limit (becomes circumpolar)
      maxLatitude: 90 - absDec, // Northern limit (never invisible in north)
    }
  }
}

/**
 * Calculate the hour angle at a specific altitude (not just horizon).
 * Useful for twilight calculations and visibility windows.
 *
 * sin(alt) = sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(H)
 * cos(H) = (sin(alt) - sin(lat)*sin(dec)) / (cos(lat)*cos(dec))
 *
 * @param latitude - Observer's latitude in degrees
 * @param declination - Object's declination in degrees
 * @param altitude - Target altitude in degrees (0 for horizon)
 * @returns Hour angle in degrees, or null if altitude never reached
 */
export function hourAngleAtAltitude(
  latitude: number,
  declination: number,
  altitude: number = 0
): number | null {
  const sinAlt = sinDeg(altitude)
  const sinLat = sinDeg(latitude)
  const cosLat = cosDeg(latitude)
  const sinDec = sinDeg(declination)
  const cosDec = cosDeg(declination)

  // Check for division by zero
  if (Math.abs(cosLat * cosDec) < EPSILON) {
    // At pole or object at pole
    return null
  }

  const cosH = (sinAlt - sinLat * sinDec) / (cosLat * cosDec)

  // Check if altitude is achievable
  if (cosH < -1 - EPSILON || cosH > 1 + EPSILON) {
    return null
  }

  // Clamp to valid range for acos
  const clampedCosH = Math.max(-1, Math.min(1, cosH))
  return acosDeg(clampedCosH)
}
