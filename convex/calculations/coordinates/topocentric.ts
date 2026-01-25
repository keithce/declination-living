/**
 * Topocentric Parallax Correction
 * PDF Reference: Part II, Section 2.2.2
 *
 * The Moon's parallax can shift its position by up to 1° depending on
 * observer location. This shifts the Zenith line by ~60-70 miles.
 */
import { SE_MOON, SwissEphService } from '../ephemeris/swissephService'

export interface TopocentricObserver {
  latitude: number // degrees, north positive
  longitude: number // degrees, east positive
  altitude: number // meters above sea level
}

export interface TopocentricPosition {
  declination: number // degrees
  rightAscension: number // degrees
  distance: number // AU
  decSpeed: number // degrees/day
  raSpeed: number // degrees/day
}

/**
 * Get topocentric position for any body
 * Critical for accurate Moon positions due to parallax
 *
 * @param jd - Julian Day (UT)
 * @param bodyId - Swiss Ephemeris body ID
 * @param observer - Observer location
 */
export async function getTopocentricPosition(
  jd: number,
  bodyId: number,
  observer: TopocentricObserver,
): Promise<TopocentricPosition> {
  const swe = SwissEphService.getInstance()
  await swe.initialize()

  // Set observer position for parallax correction
  await swe.setTopocentricObserver(observer.longitude, observer.latitude, observer.altitude)

  // Get topocentric position
  const pos = await swe.getTopocentricPosition(
    jd,
    bodyId,
    observer.longitude,
    observer.latitude,
    observer.altitude,
  )

  return {
    declination: pos.declination,
    rightAscension: pos.rightAscension,
    distance: pos.distance,
    decSpeed: pos.decSpeed,
    raSpeed: pos.raSpeed,
  }
}

/**
 * Get topocentric Moon position
 * This is the most critical topocentric calculation due to Moon's proximity
 *
 * @param jd - Julian Day (UT)
 * @param observer - Observer location
 */
export async function getTopocentricMoonPosition(
  jd: number,
  observer: TopocentricObserver,
): Promise<TopocentricPosition> {
  return getTopocentricPosition(jd, SE_MOON, observer)
}

/**
 * Calculate the parallax correction for a body at a given location
 * Returns the difference between geocentric and topocentric positions
 *
 * @param jd - Julian Day (UT)
 * @param bodyId - Swiss Ephemeris body ID
 * @param observer - Observer location
 */
export async function calculateParallaxCorrection(
  jd: number,
  bodyId: number,
  observer: TopocentricObserver,
): Promise<{ decCorrection: number; raCorrection: number }> {
  try {
    const swe = SwissEphService.getInstance()
    await swe.initialize()

    // Get geocentric position
    const geocentric = await swe.getEquatorialPosition(jd, bodyId)

    // Get topocentric position
    const topocentric = await getTopocentricPosition(jd, bodyId, observer)

    // Calculate RA correction with proper wrap-around handling
    let raCorrection = topocentric.rightAscension - geocentric.rightAscension
    // Normalize to [-180, 180] to handle 0°/360° boundary crossing
    raCorrection = (((raCorrection % 360) + 540) % 360) - 180

    return {
      decCorrection: topocentric.declination - geocentric.declination,
      raCorrection,
    }
  } catch (error) {
    throw new Error(
      `Parallax calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Calculate the maximum possible parallax for a body at its current distance
 *
 * For the Moon, this is typically around 57' (0.95°)
 * For the Sun, about 8.8" (negligible)
 *
 * @param distanceAU - Distance to body in AU
 * @returns Maximum horizontal parallax in degrees, or 0 for invalid input
 */
export function calculateMaxParallax(distanceAU: number): number {
  // Earth's equatorial radius in AU
  const EARTH_RADIUS_AU = 4.2635e-5

  // Validate input to prevent NaN from Math.asin
  if (!Number.isFinite(distanceAU) || distanceAU <= 0) {
    return 0
  }

  // Horizontal parallax: sin(p) = R_earth / distance
  const sinParallax = EARTH_RADIUS_AU / distanceAU

  // Clamp to valid range for asin (prevents NaN for very close objects)
  if (sinParallax >= 1) {
    return 90 // Maximum possible parallax
  }

  return Math.asin(sinParallax) * (180 / Math.PI)
}

/**
 * Determine if parallax correction is significant for a body
 * Generally significant only for the Moon
 *
 * @param bodyId - Swiss Ephemeris body ID
 * @returns true if parallax correction should be applied
 */
export function isParallaxSignificant(bodyId: number): boolean {
  // Only the Moon has significant parallax
  return bodyId === SE_MOON
}
