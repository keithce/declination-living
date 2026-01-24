/**
 * Geocentric coordinate conversion.
 *
 * The astronomia library provides heliocentric positions from VSOP87.
 * For astrological purposes, we need geocentric positions (Earth-centered).
 *
 * Transformation: Geocentric = Planet_helio - Earth_helio
 */

import type { EclipticCoordinates, EquatorialCoordinates } from "../core/types"
import {
  sinDeg,
  cosDeg,
  atan2Deg,
  asinDeg,
  normalizeDegrees,
  toDegrees,
  toRadians,
} from "../core/math"
import { EPSILON } from "../core/constants"

// =============================================================================
// Types
// =============================================================================

/** 3D Cartesian coordinates */
export interface CartesianCoordinates {
  x: number
  y: number
  z: number
}

/** Complete position with both coordinate systems */
export interface GeocentricPosition {
  /** Geocentric ecliptic coordinates */
  ecliptic: EclipticCoordinates
  /** Geocentric equatorial coordinates */
  equatorial: EquatorialCoordinates
  /** Geocentric distance in AU */
  distance: number
}

// =============================================================================
// Cartesian Conversions
// =============================================================================

/**
 * Convert spherical ecliptic coordinates to Cartesian.
 *
 * @param lon - Ecliptic longitude in degrees
 * @param lat - Ecliptic latitude in degrees
 * @param r - Distance in AU
 * @returns Cartesian coordinates
 */
export function eclipticToCartesian(
  lon: number,
  lat: number,
  r: number
): CartesianCoordinates {
  const lonRad = toRadians(lon)
  const latRad = toRadians(lat)

  return {
    x: r * Math.cos(latRad) * Math.cos(lonRad),
    y: r * Math.cos(latRad) * Math.sin(lonRad),
    z: r * Math.sin(latRad),
  }
}

/**
 * Convert Cartesian coordinates back to spherical ecliptic.
 *
 * @param cart - Cartesian coordinates
 * @returns Ecliptic coordinates with distance
 */
export function cartesianToEcliptic(cart: CartesianCoordinates): EclipticCoordinates {
  const { x, y, z } = cart

  const distance = Math.sqrt(x * x + y * y + z * z)

  if (distance < EPSILON) {
    return { longitude: 0, latitude: 0, distance: 0 }
  }

  const longitude = normalizeDegrees(atan2Deg(y, x))
  const latitude = asinDeg(z / distance)

  return { longitude, latitude, distance }
}

// =============================================================================
// Heliocentric to Geocentric Conversion
// =============================================================================

/**
 * Convert heliocentric position to geocentric.
 *
 * This performs the vector subtraction:
 * Planet_geo = Planet_helio - Earth_helio
 *
 * @param planetHelio - Heliocentric position of the planet
 * @param earthHelio - Heliocentric position of Earth
 * @returns Geocentric ecliptic coordinates
 */
export function heliocentricToGeocentric(
  planetHelio: EclipticCoordinates,
  earthHelio: EclipticCoordinates
): EclipticCoordinates {
  // Convert both to Cartesian
  const planetCart = eclipticToCartesian(
    planetHelio.longitude,
    planetHelio.latitude,
    planetHelio.distance || 1
  )

  const earthCart = eclipticToCartesian(
    earthHelio.longitude,
    earthHelio.latitude,
    earthHelio.distance || 1
  )

  // Subtract Earth's position (geocentric = planet - earth)
  const geoCart: CartesianCoordinates = {
    x: planetCart.x - earthCart.x,
    y: planetCart.y - earthCart.y,
    z: planetCart.z - earthCart.z,
  }

  // Convert back to spherical
  return cartesianToEcliptic(geoCart)
}

/**
 * Convert geocentric ecliptic to geocentric equatorial coordinates.
 *
 * @param ecliptic - Geocentric ecliptic coordinates
 * @param obliquity - Obliquity of the ecliptic in degrees
 * @returns Equatorial coordinates (RA, Dec)
 */
export function eclipticToEquatorial(
  ecliptic: EclipticCoordinates,
  obliquity: number
): EquatorialCoordinates {
  const lon = toRadians(ecliptic.longitude)
  const lat = toRadians(ecliptic.latitude)
  const eps = toRadians(obliquity)

  // Standard transformation formulas
  // sin(dec) = sin(lat)*cos(eps) + cos(lat)*sin(eps)*sin(lon)
  const sinDec =
    Math.sin(lat) * Math.cos(eps) + Math.cos(lat) * Math.sin(eps) * Math.sin(lon)

  const dec = Math.asin(sinDec)

  // tan(ra) = (sin(lon)*cos(eps) - tan(lat)*sin(eps)) / cos(lon)
  const y = Math.sin(lon) * Math.cos(eps) - Math.tan(lat) * Math.sin(eps)
  const x = Math.cos(lon)

  const ra = normalizeDegrees(toDegrees(Math.atan2(y, x)))

  return {
    ra,
    dec: toDegrees(dec),
    distance: ecliptic.distance,
  }
}

// =============================================================================
// Complete Geocentric Position
// =============================================================================

/**
 * Calculate complete geocentric position for a planet.
 *
 * @param planetHelio - Heliocentric position of the planet
 * @param earthHelio - Heliocentric position of Earth
 * @param obliquity - Obliquity of the ecliptic in degrees
 * @returns Complete geocentric position
 */
export function calculateGeocentricPosition(
  planetHelio: EclipticCoordinates,
  earthHelio: EclipticCoordinates,
  obliquity: number
): GeocentricPosition {
  const geoEcliptic = heliocentricToGeocentric(planetHelio, earthHelio)
  const geoEquatorial = eclipticToEquatorial(geoEcliptic, obliquity)

  return {
    ecliptic: geoEcliptic,
    equatorial: geoEquatorial,
    distance: geoEcliptic.distance || 0,
  }
}

// =============================================================================
// Special Cases: Sun and Moon
// =============================================================================

/**
 * The Sun's geocentric position.
 *
 * The Sun's geocentric position is simply the opposite of Earth's heliocentric position.
 * Lon_sun_geo = Lon_earth_helio + 180°
 * Lat_sun_geo = -Lat_earth_helio (essentially 0)
 *
 * @param earthHelio - Earth's heliocentric position
 * @param obliquity - Obliquity in degrees
 * @returns Sun's geocentric position
 */
export function getSunGeocentricPosition(
  earthHelio: EclipticCoordinates,
  obliquity: number
): GeocentricPosition {
  const sunLon = normalizeDegrees(earthHelio.longitude + 180)
  const sunLat = -(earthHelio.latitude || 0) // Effectively 0
  const sunDist = earthHelio.distance || 1

  const sunEcliptic: EclipticCoordinates = {
    longitude: sunLon,
    latitude: sunLat,
    distance: sunDist,
  }

  const sunEquatorial = eclipticToEquatorial(sunEcliptic, obliquity)

  return {
    ecliptic: sunEcliptic,
    equatorial: sunEquatorial,
    distance: sunDist,
  }
}

/**
 * The Moon's position.
 *
 * The Moon is already geocentric (it orbits Earth), so no helio->geo
 * conversion is needed. Just convert from ecliptic to equatorial.
 *
 * @param moonEcliptic - Moon's ecliptic coordinates (from moonposition module)
 * @param obliquity - Obliquity in degrees
 * @returns Moon's geocentric position
 */
export function getMoonGeocentricPosition(
  moonEcliptic: EclipticCoordinates,
  obliquity: number
): GeocentricPosition {
  const moonEquatorial = eclipticToEquatorial(moonEcliptic, obliquity)

  return {
    ecliptic: moonEcliptic,
    equatorial: moonEquatorial,
    distance: moonEcliptic.distance || 0.00257, // Average Moon distance in AU
  }
}

// =============================================================================
// Aberration and Light-Time Corrections (Optional Precision)
// =============================================================================

/**
 * Apply light-time correction to a geocentric position.
 *
 * Light takes time to travel from a planet to Earth. During that time,
 * the planet has moved. This correction accounts for that.
 *
 * For most astrological purposes, this correction is small enough to ignore,
 * but for precise calculations it can matter.
 *
 * @param distance - Geocentric distance in AU
 * @returns Light-time in days
 */
export function getLightTime(distance: number): number {
  // Light travels 1 AU in ~8.317 minutes = 0.005776 days
  const LIGHT_TIME_PER_AU = 0.0057755183
  return distance * LIGHT_TIME_PER_AU
}

/**
 * Apply annual aberration correction.
 *
 * Aberration is the apparent shift in position due to Earth's motion
 * combined with the finite speed of light. Maximum effect is ~20.5".
 *
 * For most astrological purposes, this is negligible.
 *
 * @param lon - Ecliptic longitude in degrees
 * @param lat - Ecliptic latitude in degrees
 * @param sunLon - Sun's longitude (for Earth's velocity direction)
 * @returns Corrected longitude and latitude
 */
export function applyAberration(
  lon: number,
  lat: number,
  sunLon: number
): { longitude: number; latitude: number } {
  // Constant of aberration in degrees
  const k = 20.49552 / 3600 // 20.49552 arcseconds in degrees

  // Simplified annual aberration
  const dLon = (-k * cosDeg(sunLon - lon)) / cosDeg(lat)
  const dLat = -k * sinDeg(lat) * sinDeg(sunLon - lon)

  return {
    longitude: lon + dLon,
    latitude: lat + dLat,
  }
}
