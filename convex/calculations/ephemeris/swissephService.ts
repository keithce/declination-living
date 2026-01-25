/**
 * Swiss Ephemeris WASM Service - Singleton Pattern
 * PDF Reference: Part II, Section 2.1
 *
 * The PlanetaryService implements a singleton pattern to load the WASM
 * module and initialize the ephemeris path once.
 */
import SwissEPH from 'sweph-wasm'

// Re-export common planet IDs for convenience
export const SE_SUN = 0
export const SE_MOON = 1
export const SE_MERCURY = 2
export const SE_VENUS = 3
export const SE_MARS = 4
export const SE_JUPITER = 5
export const SE_SATURN = 6
export const SE_URANUS = 7
export const SE_NEPTUNE = 8
export const SE_PLUTO = 9
export const SE_MEAN_NODE = 10
export const SE_TRUE_NODE = 11
export const SE_CHIRON = 15

// Common calculation flags
export const SEFLG_SPEED = 256
export const SEFLG_EQUATORIAL = 2048
export const SEFLG_TOPOCTR = 32768
export const SEFLG_SWIEPH = 2

/** Position result from swe_calc_ut */
export interface CalcResult {
  longitude: number
  latitude: number
  distance: number
  longitudeSpeed: number
  latitudeSpeed: number
  distanceSpeed: number
}

/** Equatorial position result */
export interface EquatorialPosition {
  rightAscension: number // degrees
  declination: number // degrees
  distance: number // AU
  raSpeed: number // degrees/day
  decSpeed: number // degrees/day
  distanceSpeed: number // AU/day
}

/**
 * Swiss Ephemeris Service - Singleton
 *
 * Provides high-precision planetary calculations using Swiss Ephemeris WASM.
 * All positions are geocentric unless topocentric observer is set.
 */
class SwissEphService {
  private static instance: SwissEphService | null = null
  private swe: SwissEPH | null = null
  private initialized = false
  private initPromise: Promise<void> | null = null

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): SwissEphService {
    if (!SwissEphService.instance) {
      SwissEphService.instance = new SwissEphService()
    }
    return SwissEphService.instance
  }

  /**
   * Initialize the Swiss Ephemeris WASM module
   * Safe to call multiple times - will only initialize once
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      this.swe = await SwissEPH.init()
      this.initialized = true
    })()

    return this.initPromise
  }

  /**
   * Ensure the service is initialized before use
   */
  private async ensureInitialized(): Promise<SwissEPH> {
    if (!this.initialized) {
      await this.initialize()
    }
    if (!this.swe) {
      throw new Error('Swiss Ephemeris failed to initialize')
    }
    return this.swe
  }

  /**
   * Get planetary position for a given Julian Day
   * Returns ecliptic coordinates by default
   *
   * @param jd - Julian Day (UT)
   * @param bodyId - Swiss Ephemeris body ID (SE_SUN, SE_MOON, etc.)
   * @param flags - Calculation flags (default: SEFLG_SPEED | SEFLG_SWIEPH)
   */
  async getBodyPosition(
    jd: number,
    bodyId: number,
    flags: number = SEFLG_SPEED | SEFLG_SWIEPH,
  ): Promise<CalcResult> {
    const swe = await this.ensureInitialized()
    const result = swe.swe_calc_ut(jd, bodyId, flags)

    // Validate result contains valid numbers
    if (!Number.isFinite(result[0]) || !Number.isFinite(result[1])) {
      throw new Error(`Swiss Ephemeris returned invalid data for body ${bodyId}`)
    }

    return {
      longitude: result[0],
      latitude: result[1],
      distance: result[2],
      longitudeSpeed: result[3],
      latitudeSpeed: result[4],
      distanceSpeed: result[5],
    }
  }

  /**
   * Get planetary position in equatorial coordinates (RA/Dec)
   *
   * @param jd - Julian Day (UT)
   * @param bodyId - Swiss Ephemeris body ID
   */
  async getEquatorialPosition(jd: number, bodyId: number): Promise<EquatorialPosition> {
    const swe = await this.ensureInitialized()
    const flags = SEFLG_SPEED | SEFLG_SWIEPH | SEFLG_EQUATORIAL
    const result = swe.swe_calc_ut(jd, bodyId, flags)

    // Validate result contains valid numbers
    if (!Number.isFinite(result[0]) || !Number.isFinite(result[1])) {
      throw new Error(`Swiss Ephemeris returned invalid equatorial data for body ${bodyId}`)
    }

    return {
      rightAscension: result[0],
      declination: result[1],
      distance: result[2],
      raSpeed: result[3],
      decSpeed: result[4],
      distanceSpeed: result[5],
    }
  }

  /**
   * Set topocentric observer for parallax correction
   * PDF Reference: Section 2.2.2
   *
   * After setting, use SEFLG_TOPOCTR flag in calculations
   *
   * @param longitude - Geographic longitude (degrees, east positive)
   * @param latitude - Geographic latitude (degrees, north positive)
   * @param altitude - Altitude above sea level (meters)
   */
  async setTopocentricObserver(
    longitude: number,
    latitude: number,
    altitude: number = 0,
  ): Promise<void> {
    const swe = await this.ensureInitialized()
    swe.swe_set_topo(longitude, latitude, altitude)
  }

  /**
   * Get topocentric position with parallax correction
   * Critical for accurate Moon positions (parallax up to 1°)
   */
  async getTopocentricPosition(
    jd: number,
    bodyId: number,
    geoLon: number,
    geoLat: number,
    altitude: number = 0,
  ): Promise<EquatorialPosition> {
    const swe = await this.ensureInitialized()

    // Set observer location
    swe.swe_set_topo(geoLon, geoLat, altitude)

    const flags = SEFLG_SPEED | SEFLG_SWIEPH | SEFLG_EQUATORIAL | SEFLG_TOPOCTR
    const result = swe.swe_calc_ut(jd, bodyId, flags)

    // Validate result contains valid numbers
    if (!Number.isFinite(result[0]) || !Number.isFinite(result[1])) {
      throw new Error(`Swiss Ephemeris returned invalid topocentric data for body ${bodyId}`)
    }

    return {
      rightAscension: result[0],
      declination: result[1],
      distance: result[2],
      raSpeed: result[3],
      decSpeed: result[4],
      distanceSpeed: result[5],
    }
  }

  /**
   * Get true obliquity including nutation
   * PDF Reference: Section 1.2
   *
   * @param jd - Julian Day (UT)
   * @returns True obliquity of the ecliptic in degrees
   */
  async getTrueObliquity(jd: number): Promise<number> {
    const swe = await this.ensureInitialized()
    // SE_ECL_NUT (-1) returns nutation and obliquity
    const result = swe.swe_calc_ut(jd, -1, 0)
    // result[0] = nutation in longitude
    // result[1] = nutation in obliquity
    // result[2] = true obliquity (mean + nutation)
    return result[2]
  }

  /**
   * Get mean obliquity (without nutation)
   */
  async getMeanObliquity(jd: number): Promise<number> {
    const swe = await this.ensureInitialized()
    const result = swe.swe_calc_ut(jd, -1, 0)
    // Mean obliquity = true obliquity - nutation in obliquity
    return result[2] - result[1]
  }

  /**
   * Convert Julian Day to Greenwich Sidereal Time
   *
   * @param jd - Julian Day (UT)
   * @returns Sidereal time in hours (0-23.999...)
   */
  async getSiderealTimeHours(jd: number): Promise<number> {
    const swe = await this.ensureInitialized()
    return swe.swe_sidtime(jd)
  }

  /**
   * Get Greenwich Sidereal Time in degrees
   *
   * @param jd - Julian Day (UT)
   * @returns Sidereal time in degrees (0-360)
   */
  async getSiderealTimeDegrees(jd: number): Promise<number> {
    const hours = await this.getSiderealTimeHours(jd)
    return hours * 15 // 15 degrees per hour
  }

  /**
   * Get Local Sidereal Time
   *
   * @param jd - Julian Day (UT)
   * @param longitude - Geographic longitude in degrees (east positive)
   * @returns Local sidereal time in degrees (0-360)
   */
  async getLocalSiderealTime(jd: number, longitude: number): Promise<number> {
    const gst = await this.getSiderealTimeDegrees(jd)
    return (((gst + longitude) % 360) + 360) % 360
  }

  /**
   * Calculate Julian Day from calendar date
   *
   * @param year - Year
   * @param month - Month (1-12)
   * @param day - Day (can include fractional part for time)
   * @param gregorian - Use Gregorian calendar (default true)
   */
  async julianDay(
    year: number,
    month: number,
    day: number,
    gregorian: boolean = true,
  ): Promise<number> {
    const swe = await this.ensureInitialized()
    const gregFlag = gregorian ? swe.SE_GREG_CAL : swe.SE_JUL_CAL
    return swe.swe_julday(year, month, Math.floor(day), (day % 1) * 24, gregFlag)
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }
}

export { SwissEphService }
