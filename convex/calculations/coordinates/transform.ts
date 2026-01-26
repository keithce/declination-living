/**
 * Coordinate Transformations
 * PDF Reference: Part II, Section 2.2.1 and Appendix A.1
 *
 * Convert between coordinate systems:
 * - Ecliptic (λ, β) → Equatorial (α, δ)
 * - Geodetic → Cartesian
 */

import { toDegrees as toDeg, toRadians as toRad } from '../core/math'

/**
 * Convert Ecliptic coordinates to Equatorial
 * Handles quadrant disambiguation for Right Ascension
 *
 * @param lambda - Ecliptic Longitude (degrees, 0-360)
 * @param beta - Ecliptic Latitude (degrees, -90 to +90)
 * @param epsilon - True Obliquity of the Ecliptic (degrees)
 * @returns Right Ascension and Declination in degrees
 */
export function eclipticToEquatorial(
  lambda: number,
  beta: number,
  epsilon: number,
): { rightAscension: number; declination: number } {
  const l = toRad(lambda)
  const b = toRad(beta)
  const e = toRad(epsilon)

  // Calculate Declination: sin(δ) = sin(β)cos(ε) + cos(β)sin(ε)sin(λ)
  const sinDec = Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)
  const declination = toDeg(Math.asin(sinDec))

  // Calculate Right Ascension with atan2 for quadrant safety
  const y = Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e)
  const x = Math.cos(l)
  let ra = toDeg(Math.atan2(y, x))

  // Normalize RA to 0-360 range
  if (ra < 0) ra += 360

  return { rightAscension: ra, declination }
}

/**
 * Convert Equatorial coordinates to Ecliptic
 *
 * @param ra - Right Ascension (degrees, 0-360)
 * @param dec - Declination (degrees, -90 to +90)
 * @param epsilon - True Obliquity of the Ecliptic (degrees)
 * @returns Ecliptic longitude and latitude in degrees
 */
export function equatorialToEcliptic(
  ra: number,
  dec: number,
  epsilon: number,
): { longitude: number; latitude: number } {
  const a = toRad(ra)
  const d = toRad(dec)
  const e = toRad(epsilon)

  // Calculate Ecliptic Latitude: sin(β) = sin(δ)cos(ε) - cos(δ)sin(ε)sin(α)
  const sinBeta = Math.sin(d) * Math.cos(e) - Math.cos(d) * Math.sin(e) * Math.sin(a)
  const latitude = toDeg(Math.asin(sinBeta))

  // Calculate Ecliptic Longitude
  const y = Math.sin(a) * Math.cos(e) + Math.tan(d) * Math.sin(e)
  const x = Math.cos(a)
  let longitude = toDeg(Math.atan2(y, x))

  // Normalize to 0-360 range
  if (longitude < 0) longitude += 360

  return { longitude, latitude }
}

/**
 * Convert Geodetic coordinates to 3D Cartesian Vector
 * PDF Reference: Appendix A.4
 *
 * Uses Earth as unit sphere (radius = 1)
 *
 * @param lat - Geographic latitude (degrees, -90 to +90)
 * @param lon - Geographic longitude (degrees, -180 to +180)
 * @param radius - Sphere radius (default 1)
 * @returns Cartesian coordinates (x, y, z)
 */
export function geoToCartesian(
  lat: number,
  lon: number,
  radius: number = 1,
): { x: number; y: number; z: number } {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return { x, y, z }
}

/**
 * Convert Cartesian coordinates to Geodetic (lat/lon)
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param z - Z coordinate
 * @returns Geographic latitude and longitude in degrees
 */
export function cartesianToGeo(
  x: number,
  y: number,
  z: number,
): { latitude: number; longitude: number } {
  const radius = Math.sqrt(x * x + y * y + z * z)
  if (radius === 0) {
    return { latitude: 0, longitude: 0 }
  }

  const latitude = toDeg(Math.asin(y / radius))
  let longitude = toDeg(Math.atan2(z, -x)) - 180

  // Normalize longitude to -180 to +180
  if (longitude < -180) longitude += 360
  if (longitude > 180) longitude -= 360

  return { latitude, longitude }
}

/**
 * Calculate the Hour Angle from Local Sidereal Time and Right Ascension
 *
 * Hour Angle = LST - RA
 *
 * @param lst - Local Sidereal Time (degrees)
 * @param ra - Right Ascension (degrees)
 * @returns Hour Angle in degrees (-180 to +180)
 */
export function calculateHourAngle(lst: number, ra: number): number {
  if (!Number.isFinite(lst) || !Number.isFinite(ra)) {
    throw new Error(`calculateHourAngle: invalid inputs lst=${lst}, ra=${ra}`)
  }
  const ha = lst - ra
  // Normalize to -180 to +180 using modulo (avoids while loops)
  return (((ha % 360) + 540) % 360) - 180
}

/**
 * Calculate azimuth and altitude from equatorial coordinates
 *
 * @param ha - Hour Angle (degrees)
 * @param dec - Declination (degrees)
 * @param lat - Observer latitude (degrees)
 * @returns Azimuth (0-360, N=0, E=90) and Altitude (degrees)
 */
export function equatorialToHorizontal(
  ha: number,
  dec: number,
  lat: number,
): { azimuth: number; altitude: number } {
  const h = toRad(ha)
  const d = toRad(dec)
  const l = toRad(lat)

  // Calculate altitude
  const sinAlt = Math.sin(d) * Math.sin(l) + Math.cos(d) * Math.cos(l) * Math.cos(h)
  const altitude = toDeg(Math.asin(sinAlt))

  // Calculate azimuth
  const y = Math.sin(h)
  const x = Math.cos(h) * Math.sin(l) - Math.tan(d) * Math.cos(l)
  let azimuth = toDeg(Math.atan2(y, x)) + 180

  // Normalize to 0-360
  if (azimuth >= 360) azimuth -= 360
  if (azimuth < 0) azimuth += 360

  return { azimuth, altitude }
}

/**
 * Great circle distance between two points on a sphere
 *
 * @param lat1 - Latitude of point 1 (degrees)
 * @param lon1 - Longitude of point 1 (degrees)
 * @param lat2 - Latitude of point 2 (degrees)
 * @param lon2 - Longitude of point 2 (degrees)
 * @returns Distance in radians (multiply by radius for actual distance)
 */
export function greatCircleDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const dPhi = toRad(lat2 - lat1)
  const dLambda = toRad(lon2 - lon1)

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2)

  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Great circle distance in kilometers
 *
 * @param lat1 - Latitude of point 1 (degrees)
 * @param lon1 - Longitude of point 1 (degrees)
 * @param lat2 - Latitude of point 2 (degrees)
 * @param lon2 - Longitude of point 2 (degrees)
 * @returns Distance in kilometers
 */
export function greatCircleDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const EARTH_RADIUS_KM = 6371
  return greatCircleDistance(lat1, lon1, lat2, lon2) * EARTH_RADIUS_KM
}
