/**
 * Julian Day Conversions
 * PDF Reference: Part II, Section 2.1
 *
 * Julian Day is the continuous count of days since the beginning
 * of the Julian Period (January 1, 4713 BC in the proleptic Julian calendar).
 * It's the standard time scale for astronomical calculations.
 */
import { fromZonedTime } from 'date-fns-tz'

/**
 * Convert a calendar date to Julian Day Number
 *
 * This is a pure JavaScript implementation that matches the Swiss Ephemeris
 * algorithm for the Gregorian calendar.
 *
 * @param year - Calendar year
 * @param month - Month (1-12)
 * @param day - Day (can include fractional part for time)
 * @returns Julian Day Number
 */
export function calendarToJulianDay(year: number, month: number, day: number): number {
  // Handle months: January and February are considered months 13 and 14
  // of the preceding year
  let y = year
  let m = month
  if (m <= 2) {
    y -= 1
    m += 12
  }

  // Determine if this is a Gregorian or Julian calendar date
  // Cutover: October 15, 1582 (Gregorian) = October 5, 1582 (Julian)
  const isGregorian =
    year > 1582 || (year === 1582 && month > 10) || (year === 1582 && month === 10 && day >= 15)

  // Gregorian calendar correction (only for dates after cutover)
  let b = 0
  if (isGregorian) {
    const a = Math.floor(y / 100)
    b = 2 - a + Math.floor(a / 4)
  }

  // Julian Day formula
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5

  return jd
}

/**
 * Convert Julian Day Number back to calendar date
 *
 * @param jd - Julian Day Number
 * @returns Object with year, month, day (day may have fractional part)
 */
export function julianDayToCalendar(jd: number): { year: number; month: number; day: number } {
  const z = Math.floor(jd + 0.5)
  const f = jd + 0.5 - z

  let a: number
  if (z < 2299161) {
    // Julian calendar
    a = z
  } else {
    // Gregorian calendar
    const alpha = Math.floor((z - 1867216.25) / 36524.25)
    a = z + 1 + alpha - Math.floor(alpha / 4)
  }

  const b = a + 1524
  const c = Math.floor((b - 122.1) / 365.25)
  const d = Math.floor(365.25 * c)
  const e = Math.floor((b - d) / 30.6001)

  const day = b - d - Math.floor(30.6001 * e) + f
  const month = e < 14 ? e - 1 : e - 13
  const year = month > 2 ? c - 4716 : c - 4715

  return { year, month, day }
}

/**
 * Parse a date string and time string into a Julian Day
 * Converts the local time in the specified timezone to UTC before calculation
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM format (24-hour)
 * @param timezone - IANA timezone string (e.g., 'America/Los_Angeles')
 * @returns Julian Day Number (UT)
 */
export function dateToJulianDay(
  dateStr: string,
  timeStr: string,
  timezone: string = 'UTC',
): number {
  // Validate input formats
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`)
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    throw new Error(`Invalid time format: ${timeStr}. Expected HH:MM or HH:MM:SS`)
  }

  // Create an ISO datetime string representing the local time
  // fromZonedTime will interpret this as a time in the specified timezone
  // Only append :00 if seconds not already present
  const hasSeconds = timeStr.split(':').length === 3
  const isoString = `${dateStr}T${timeStr}${hasSeconds ? '' : ':00'}`

  // Convert from the specified timezone to UTC
  // fromZonedTime takes a datetime and timezone, returns UTC Date
  const utcDate = fromZonedTime(isoString, timezone)

  // Extract UTC components for Julian Day calculation
  const utcYear = utcDate.getUTCFullYear()
  const utcMonth = utcDate.getUTCMonth() + 1
  const utcDay = utcDate.getUTCDate()
  const utcHours = utcDate.getUTCHours()
  const utcMinutes = utcDate.getUTCMinutes()
  const utcSeconds = utcDate.getUTCSeconds()

  // Calculate fractional day
  const fractionalDay = utcDay + (utcHours + (utcMinutes + utcSeconds / 60) / 60) / 24

  return calendarToJulianDay(utcYear, utcMonth, fractionalDay)
}

/**
 * Convert a JavaScript Date object to Julian Day
 *
 * @param date - JavaScript Date object (assumed to be in UTC)
 * @returns Julian Day Number (UT)
 */
export function dateObjectToJulianDay(date: Date): number {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const seconds = date.getUTCSeconds()

  const fractionalDay = day + (hours + (minutes + seconds / 60) / 60) / 24

  return calendarToJulianDay(year, month, fractionalDay)
}

/**
 * Get the current Julian Day
 *
 * @returns Current Julian Day Number (UT)
 */
export function getCurrentJulianDay(): number {
  return dateObjectToJulianDay(new Date())
}

/**
 * Calculate Delta T (difference between TT and UT) for a given year
 *
 * This is a polynomial approximation based on historical observations.
 * For high-precision work, Swiss Ephemeris has built-in Delta T handling.
 *
 * @param year - Calendar year (can include fractional part)
 * @returns Delta T in seconds
 */
export function estimateDeltaT(year: number): number {
  // Simple polynomial for years after 2005
  // For more accurate values, use Swiss Ephemeris's built-in Delta T
  if (year >= 2005) {
    const t = year - 2000
    return 62.92 + 0.32217 * t + 0.005589 * t * t
  }
  // Approximate for earlier years
  const t = year - 1820
  return -20 + 32 * Math.pow(t / 100, 2)
}

/**
 * Convert Julian Day (UT) to Julian Ephemeris Day (TT)
 *
 * JDE = JD_UT + ΔT/86400
 *
 * @param jd_ut - Julian Day in Universal Time
 * @param year - Calendar year (for Delta T estimation)
 * @returns Julian Ephemeris Day in Terrestrial Time
 */
export function utToTT(jd_ut: number, year: number): number {
  const deltaT = estimateDeltaT(year)
  return jd_ut + deltaT / 86400
}

/**
 * J2000.0 epoch as Julian Day
 */
export const J2000_JD = 2451545.0

/**
 * Calculate Julian centuries from J2000.0
 *
 * @param jd - Julian Day
 * @returns Julian centuries from J2000.0
 */
export function julianCenturiesFromJ2000(jd: number): number {
  return (jd - J2000_JD) / 36525
}

/**
 * Format Julian Day as a human-readable date string
 *
 * @param jd - Julian Day Number
 * @returns Formatted date string like "2024-01-15 14:30:00 UT"
 */
export function formatJulianDay(jd: number): string {
  const { year, month, day } = julianDayToCalendar(jd)

  const wholeDay = Math.floor(day)
  const fraction = day - wholeDay
  const hours = Math.floor(fraction * 24)
  const minutes = Math.floor((fraction * 24 - hours) * 60)
  const seconds = Math.floor(((fraction * 24 - hours) * 60 - minutes) * 60)

  const pad = (n: number): string => n.toString().padStart(2, '0')

  return `${year}-${pad(month)}-${pad(wholeDay)} ${pad(hours)}:${pad(minutes)}:${pad(seconds)} UT`
}
