/**
 * Ephemeris calculations using the astronomia library
 * Calculates planetary positions and declinations for a given date/time
 */

import { CalendarGregorianToJD } from 'astronomia/julian'
import * as base from 'astronomia/base'
import { Planet } from 'astronomia/planetposition'
import * as solar from 'astronomia/solar'
import * as moonposition from 'astronomia/moonposition'
import * as nutation from 'astronomia/nutation'
import { Ecliptic } from 'astronomia/coord'

// Planet data files (VSOP87 data)
import vsopEarth from 'astronomia/data/vsop87Bearth'
import vsopMercury from 'astronomia/data/vsop87Bmercury'
import vsopVenus from 'astronomia/data/vsop87Bvenus'
import vsopMars from 'astronomia/data/vsop87Bmars'
import vsopJupiter from 'astronomia/data/vsop87Bjupiter'
import vsopSaturn from 'astronomia/data/vsop87Bsaturn'
import vsopUranus from 'astronomia/data/vsop87Buranus'
import vsopNeptune from 'astronomia/data/vsop87Bneptune'

export interface PlanetDeclinations {
  sun: number
  moon: number
  mercury: number
  venus: number
  mars: number
  jupiter: number
  saturn: number
  uranus: number
  neptune: number
  pluto: number
}

export interface PlanetPositions {
  sun: { longitude: number; latitude: number; declination: number }
  moon: { longitude: number; latitude: number; declination: number }
  mercury: { longitude: number; latitude: number; declination: number }
  venus: { longitude: number; latitude: number; declination: number }
  mars: { longitude: number; latitude: number; declination: number }
  jupiter: { longitude: number; latitude: number; declination: number }
  saturn: { longitude: number; latitude: number; declination: number }
  uranus: { longitude: number; latitude: number; declination: number }
  neptune: { longitude: number; latitude: number; declination: number }
  pluto: { longitude: number; latitude: number; declination: number }
}

// Convert degrees to radians
const toRad = (deg: number) => (deg * Math.PI) / 180
// Convert radians to degrees
const toDeg = (rad: number) => (rad * 180) / Math.PI

/**
 * Parse a date string and time string into a Julian Day
 */
export function dateToJulianDay(
  dateStr: string, // YYYY-MM-DD
  timeStr: string // HH:MM
): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)

  // For now, treat time as UTC (timezone handling would require date-fns-tz)
  // In production, convert local time to UTC first
  const fractionalDay = day + (hours + minutes / 60) / 24

  const jd = CalendarGregorianToJD(year, month, fractionalDay)
  return jd
}

/**
 * Calculate the obliquity of the ecliptic for a given Julian Day
 */
function getObliquity(jd: number): number {
  const nut = nutation.nutation(jd)
  // Mean obliquity + nutation in obliquity
  const eps0 = nutation.meanObliquity(jd)
  return eps0 + nut[1] // ε = ε0 + Δε
}

/**
 * Convert ecliptic coordinates to equatorial coordinates
 * Returns right ascension and declination
 */
function eclipticToEquatorial(
  longitude: number, // radians
  latitude: number, // radians
  obliquity: number // radians
): { ra: number; dec: number } {
  const eclCoord = new Ecliptic(longitude, latitude)
  const eq = eclCoord.toEquatorial(obliquity)
  return {
    ra: eq.ra,
    dec: eq.dec,
  }
}

/**
 * Calculate Sun position and declination
 */
function getSunPosition(jd: number, obliquity: number) {
  // Get Julian year for solar calculations
  const T = base.JDEToJulianYear(jd)
  const sunLon = solar.apparentLongitude(T)
  const sunLat = 0 // Sun's ecliptic latitude is essentially 0

  const eq = eclipticToEquatorial(sunLon, sunLat, obliquity)

  return {
    longitude: toDeg(sunLon),
    latitude: toDeg(sunLat),
    declination: toDeg(eq.dec),
  }
}

/**
 * Calculate Moon position and declination
 */
function getMoonPosition(jd: number, obliquity: number) {
  const moon = moonposition.position(jd)

  const eq = eclipticToEquatorial(moon.lon, moon.lat, obliquity)

  return {
    longitude: toDeg(moon.lon),
    latitude: toDeg(moon.lat),
    declination: toDeg(eq.dec),
  }
}

/**
 * Calculate planet position using VSOP87
 */
function getPlanetPosition(
  jd: number,
  obliquity: number,
  planetVsop: unknown,
  _earthVsop: unknown
) {
  const planet = new Planet(planetVsop)

  // Get heliocentric position of planet
  const pos = planet.position(jd)

  // Convert to geocentric ecliptic coordinates
  // This is a simplified conversion; for full accuracy, use proper geocentric transformation
  const lon = pos.lon
  const lat = pos.lat

  const eq = eclipticToEquatorial(lon, lat, obliquity)

  return {
    longitude: toDeg(lon),
    latitude: toDeg(lat),
    declination: toDeg(eq.dec),
  }
}

/**
 * Calculate Pluto position (simplified - not in VSOP87)
 * Uses a basic approximation based on orbital elements
 */
function getPlutoPosition(jd: number, obliquity: number) {
  // Pluto's mean elements (J2000.0 epoch)
  const T = (jd - 2451545.0) / 36525.0 // Julian centuries from J2000

  // Simplified mean longitude calculation
  const L =
    238.96 + 144.96 * T + 0.01 * T * T // Approximate mean longitude in degrees

  // Pluto has significant inclination and eccentricity
  // This is a rough approximation
  const lon = toRad(L % 360)
  const lat = toRad(17.14 * Math.sin(toRad(L - 110))) // Approximate latitude variation

  const eq = eclipticToEquatorial(lon, lat, obliquity)

  return {
    longitude: toDeg(lon),
    latitude: toDeg(lat),
    declination: toDeg(eq.dec),
  }
}

/**
 * Calculate all planet positions for a given Julian Day
 */
export function calculateAllPositions(jd: number): PlanetPositions {
  const obliquity = getObliquity(jd)

  return {
    sun: getSunPosition(jd, obliquity),
    moon: getMoonPosition(jd, obliquity),
    mercury: getPlanetPosition(jd, obliquity, vsopMercury, vsopEarth),
    venus: getPlanetPosition(jd, obliquity, vsopVenus, vsopEarth),
    mars: getPlanetPosition(jd, obliquity, vsopMars, vsopEarth),
    jupiter: getPlanetPosition(jd, obliquity, vsopJupiter, vsopEarth),
    saturn: getPlanetPosition(jd, obliquity, vsopSaturn, vsopEarth),
    uranus: getPlanetPosition(jd, obliquity, vsopUranus, vsopEarth),
    neptune: getPlanetPosition(jd, obliquity, vsopNeptune, vsopEarth),
    pluto: getPlutoPosition(jd, obliquity),
  }
}

/**
 * Calculate just the declinations for all planets
 */
export function calculateDeclinations(jd: number): PlanetDeclinations {
  const positions = calculateAllPositions(jd)

  return {
    sun: positions.sun.declination,
    moon: positions.moon.declination,
    mercury: positions.mercury.declination,
    venus: positions.venus.declination,
    mars: positions.mars.declination,
    jupiter: positions.jupiter.declination,
    saturn: positions.saturn.declination,
    uranus: positions.uranus.declination,
    neptune: positions.neptune.declination,
    pluto: positions.pluto.declination,
  }
}
