/**
 * Hour Angle and Sidereal Time calculations.
 * These are fundamental for determining when celestial objects are angular
 * (rising, setting, culminating) at specific locations.
 */

import {
  J2000,
  GMST_AT_J2000,
  GMST_RATE,
  GMST_QUAD,
  GMST_CUBIC,
  JULIAN_DAYS_PER_CENTURY,
} from "../core/constants"
import { normalizeDegrees, normalizeDegreesSymmetric } from "../core/math"

// =============================================================================
// Sidereal Time Functions
// =============================================================================

/**
 * Calculate Greenwich Mean Sidereal Time (GMST) for a given Julian Day.
 * GMST is the hour angle of the vernal equinox at Greenwich.
 *
 * Formula from Meeus, Astronomical Algorithms (1991), Chapter 12.
 *
 * @param jd - Julian Day (UT1)
 * @returns GMST in degrees [0, 360)
 */
export function getGMST(jd: number): number {
  // Julian centuries from J2000.0
  const T = (jd - J2000) / JULIAN_DAYS_PER_CENTURY

  // Mean sidereal time at 0h UT
  // θ₀ = 280.46061837 + 360.98564736629*(JD - 2451545) + 0.000387933*T² - T³/38710000
  const gmst =
    GMST_AT_J2000 +
    GMST_RATE * (jd - J2000) +
    GMST_QUAD * T * T +
    GMST_CUBIC * T * T * T

  return normalizeDegrees(gmst)
}

/**
 * Calculate Greenwich Apparent Sidereal Time (GAST).
 * GAST = GMST + equation of the equinoxes (nutation in RA).
 *
 * For most ACG calculations, GMST is sufficient.
 * Use GAST when higher precision is needed.
 *
 * @param jd - Julian Day
 * @param nutationInRA - Nutation in right ascension (degrees)
 * @returns GAST in degrees
 */
export function getGAST(jd: number, nutationInRA: number): number {
  const gmst = getGMST(jd)
  return normalizeDegrees(gmst + nutationInRA)
}

/**
 * Calculate Local Mean Sidereal Time (LMST) for a given location.
 * LMST = GMST + longitude (east positive)
 *
 * @param jd - Julian Day
 * @param longitude - Geographic longitude in degrees (east positive)
 * @returns LMST in degrees [0, 360)
 */
export function getLMST(jd: number, longitude: number): number {
  const gmst = getGMST(jd)
  return normalizeDegrees(gmst + longitude)
}

/**
 * Calculate Local Apparent Sidereal Time (LAST).
 *
 * @param jd - Julian Day
 * @param longitude - Geographic longitude in degrees
 * @param nutationInRA - Nutation in right ascension (degrees)
 * @returns LAST in degrees
 */
export function getLAST(
  jd: number,
  longitude: number,
  nutationInRA: number
): number {
  const gast = getGAST(jd, nutationInRA)
  return normalizeDegrees(gast + longitude)
}

// =============================================================================
// Hour Angle Functions
// =============================================================================

/**
 * Calculate the Local Hour Angle (LHA) of a celestial object.
 * LHA = LST - RA
 *
 * Hour angle measures how far west the object is from the local meridian:
 * - LHA = 0°: Object is on the meridian (culminating)
 * - LHA = 90° (6h): Object is 6 hours west of meridian
 * - LHA = -90° (-6h): Object is 6 hours east of meridian (or 18h west)
 * - LHA = ±180°: Object is at anti-culmination
 *
 * @param jd - Julian Day
 * @param longitude - Observer's longitude in degrees (east positive)
 * @param ra - Object's Right Ascension in degrees
 * @returns Local Hour Angle in degrees [-180, 180)
 */
export function getLocalHourAngle(
  jd: number,
  longitude: number,
  ra: number
): number {
  const lmst = getLMST(jd, longitude)
  return normalizeDegreesSymmetric(lmst - ra)
}

/**
 * Calculate the hour angle in hours instead of degrees.
 *
 * @param jd - Julian Day
 * @param longitude - Observer's longitude in degrees
 * @param ra - Object's Right Ascension in degrees
 * @returns Local Hour Angle in hours [-12, 12)
 */
export function getLocalHourAngleHours(
  jd: number,
  longitude: number,
  ra: number
): number {
  return getLocalHourAngle(jd, longitude, ra) / 15
}

// =============================================================================
// Longitude for Hour Angle Functions
// =============================================================================

/**
 * Find the longitude where a celestial object has a specific hour angle.
 * This is the inverse of getLocalHourAngle.
 *
 * LHA = GMST + longitude - RA
 * longitude = LHA + RA - GMST
 *
 * Used for ACG line calculations:
 * - MC line: Find longitude where LHA = 0° (object on meridian)
 * - IC line: Find longitude where LHA = 180° (object at anti-culmination)
 *
 * @param jd - Julian Day
 * @param ra - Object's Right Ascension in degrees
 * @param targetHA - Target hour angle in degrees
 * @returns Longitude in degrees [-180, 180]
 */
export function longitudeForHourAngle(
  jd: number,
  ra: number,
  targetHA: number
): number {
  const gmst = getGMST(jd)
  // LHA = GMST + longitude - RA
  // longitude = LHA + RA - GMST
  const longitude = targetHA + ra - gmst
  return normalizeDegreesSymmetric(longitude)
}

/**
 * Find the longitude where a planet is on the meridian (MC line).
 * Hour angle = 0 at the meridian.
 *
 * @param jd - Julian Day
 * @param ra - Planet's Right Ascension in degrees
 * @returns Longitude of MC line in degrees
 */
export function longitudeForMC(jd: number, ra: number): number {
  return longitudeForHourAngle(jd, ra, 0)
}

/**
 * Find the longitude where a planet is at anti-culmination (IC line).
 * Hour angle = 180° (or -180°) at the IC.
 *
 * @param jd - Julian Day
 * @param ra - Planet's Right Ascension in degrees
 * @returns Longitude of IC line in degrees
 */
export function longitudeForIC(jd: number, ra: number): number {
  return longitudeForHourAngle(jd, ra, 180)
}

// =============================================================================
// Julian Day for Hour Angle Functions
// =============================================================================

/**
 * Find the Julian Day when an object has a specific hour angle at a location.
 * Useful for finding rise/set/culmination times.
 *
 * @param jd0 - Approximate Julian Day to search near
 * @param longitude - Observer's longitude in degrees
 * @param ra - Object's Right Ascension in degrees
 * @param targetHA - Target hour angle in degrees
 * @returns Julian Day when object has the target hour angle
 */
export function jdForHourAngle(
  jd0: number,
  longitude: number,
  ra: number,
  targetHA: number
): number {
  // Current hour angle
  const currentHA = getLocalHourAngle(jd0, longitude, ra)

  // Difference from target (how far we need to rotate)
  let diff = normalizeDegreesSymmetric(targetHA - currentHA)

  // Convert degrees to days (Earth rotates 360.98564736629°/day sidereal)
  const daysPerDegree = 1 / GMST_RATE

  return jd0 + diff * daysPerDegree
}

/**
 * Find when an object culminates (crosses the meridian) at a location.
 *
 * @param jd0 - Approximate Julian Day
 * @param longitude - Observer's longitude in degrees
 * @param ra - Object's Right Ascension in degrees
 * @returns Julian Day of culmination
 */
export function jdForCulmination(
  jd0: number,
  longitude: number,
  ra: number
): number {
  return jdForHourAngle(jd0, longitude, ra, 0)
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert hour angle from degrees to hours:minutes:seconds format.
 *
 * @param haDegrees - Hour angle in degrees
 * @returns Object with hours, minutes, seconds, and sign
 */
export function hourAngleToHMS(haDegrees: number): {
  hours: number
  minutes: number
  seconds: number
  sign: "+" | "-"
} {
  const sign = haDegrees >= 0 ? "+" : "-"
  const totalHours = Math.abs(haDegrees) / 15
  const hours = Math.floor(totalHours)
  const minutesFloat = (totalHours - hours) * 60
  const minutes = Math.floor(minutesFloat)
  const seconds = (minutesFloat - minutes) * 60

  return { hours, minutes, seconds, sign }
}

/**
 * Check if an object is currently above the horizon.
 * Uses the relationship between hour angle and altitude.
 *
 * @param ha - Hour angle in degrees
 * @param dec - Declination in degrees
 * @param lat - Observer's latitude in degrees
 * @returns True if object is above the horizon
 */
export function isAboveHorizon(ha: number, dec: number, lat: number): boolean {
  // sin(alt) = sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(HA)
  const sinAlt =
    Math.sin((lat * Math.PI) / 180) * Math.sin((dec * Math.PI) / 180) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((dec * Math.PI) / 180) *
      Math.cos((ha * Math.PI) / 180)

  return sinAlt > 0
}

/**
 * Calculate the altitude of an object given hour angle, declination, and latitude.
 *
 * @param ha - Hour angle in degrees
 * @param dec - Declination in degrees
 * @param lat - Observer's latitude in degrees
 * @returns Altitude in degrees
 */
export function calculateAltitude(ha: number, dec: number, lat: number): number {
  const latRad = (lat * Math.PI) / 180
  const decRad = (dec * Math.PI) / 180
  const haRad = (ha * Math.PI) / 180

  const sinAlt =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad)

  return (Math.asin(sinAlt) * 180) / Math.PI
}

/**
 * Calculate the azimuth of an object given hour angle, declination, and latitude.
 *
 * @param ha - Hour angle in degrees
 * @param dec - Declination in degrees
 * @param lat - Observer's latitude in degrees
 * @returns Azimuth in degrees (N=0, E=90, S=180, W=270)
 */
export function calculateAzimuth(ha: number, dec: number, lat: number): number {
  const latRad = (lat * Math.PI) / 180
  const decRad = (dec * Math.PI) / 180
  const haRad = (ha * Math.PI) / 180

  const sinAz = -Math.cos(decRad) * Math.sin(haRad)
  const cosAz =
    Math.sin(decRad) * Math.cos(latRad) -
    Math.cos(decRad) * Math.cos(haRad) * Math.sin(latRad)

  let azimuth = (Math.atan2(sinAz, cosAz) * 180) / Math.PI
  if (azimuth < 0) azimuth += 360

  return azimuth
}
