import { describe, expect, it } from 'vitest'
import {
  calendarToJulianDay,
  julianDayToCalendar,
  dateToJulianDay,
  dateObjectToJulianDay,
  estimateDeltaT,
  utToTT,
  julianCenturiesFromJ2000,
  formatJulianDay,
  J2000_JD,
} from '../julian'

describe('Julian Day Conversions', () => {
  describe('calendarToJulianDay', () => {
    it('should convert J2000.0 epoch correctly (2000-01-01 12:00 TT)', () => {
      // J2000.0 is defined as 2000 January 1, 12:00 TT
      // JD = 2451545.0
      const jd = calendarToJulianDay(2000, 1, 1.5)
      expect(jd).toBeCloseTo(2451545.0, 6)
    })

    it('should convert Sputnik launch date correctly', () => {
      // Sputnik 1 launched 1957-10-04 19:28:34 UTC
      // JD ≈ 2436116.31
      const hours = 19 + 28 / 60 + 34 / 3600
      const fractionalDay = 4 + hours / 24
      const jd = calendarToJulianDay(1957, 10, fractionalDay)
      expect(jd).toBeCloseTo(2436116.31, 2)
    })

    it('should handle January correctly (month 1)', () => {
      // 2024-01-15 at noon
      const jd = calendarToJulianDay(2024, 1, 15.5)
      // Should be after J2000.0 by roughly 24 years
      expect(jd).toBeGreaterThan(J2000_JD)
      expect(jd).toBeCloseTo(2460325.0, 0)
    })

    it('should handle February correctly (month 2)', () => {
      // 2024-02-15 at noon
      const jd = calendarToJulianDay(2024, 2, 15.5)
      expect(jd).toBeCloseTo(2460356.0, 0)
    })

    it('should handle midnight vs noon', () => {
      // Same date, midnight vs noon should differ by 0.5
      const jdMidnight = calendarToJulianDay(2000, 1, 1.0)
      const jdNoon = calendarToJulianDay(2000, 1, 1.5)
      expect(jdNoon - jdMidnight).toBeCloseTo(0.5, 10)
    })

    it('should handle year boundary (Dec 31 to Jan 1)', () => {
      const jdDec31 = calendarToJulianDay(1999, 12, 31.5)
      const jdJan1 = calendarToJulianDay(2000, 1, 1.5)
      expect(jdJan1 - jdDec31).toBeCloseTo(1.0, 10)
    })

    it('should handle leap year February 29', () => {
      // 2024 is a leap year
      const jdFeb28 = calendarToJulianDay(2024, 2, 28.5)
      const jdFeb29 = calendarToJulianDay(2024, 2, 29.5)
      const jdMar1 = calendarToJulianDay(2024, 3, 1.5)
      expect(jdFeb29 - jdFeb28).toBeCloseTo(1.0, 10)
      expect(jdMar1 - jdFeb29).toBeCloseTo(1.0, 10)
    })
  })

  describe('julianDayToCalendar', () => {
    it('should convert J2000.0 back to calendar', () => {
      const result = julianDayToCalendar(2451545.0)
      expect(result.year).toBe(2000)
      expect(result.month).toBe(1)
      expect(result.day).toBeCloseTo(1.5, 6)
    })

    it('should round-trip conversion correctly', () => {
      const testCases = [
        { year: 2000, month: 1, day: 1.5 },
        { year: 1957, month: 10, day: 4.81 },
        { year: 2024, month: 6, day: 15.25 },
        { year: 1900, month: 3, day: 10.75 },
      ]

      for (const tc of testCases) {
        const jd = calendarToJulianDay(tc.year, tc.month, tc.day)
        const result = julianDayToCalendar(jd)
        expect(result.year).toBe(tc.year)
        expect(result.month).toBe(tc.month)
        expect(result.day).toBeCloseTo(tc.day, 5)
      }
    })

    it('should handle Gregorian calendar date correctly', () => {
      // Test a modern date well into Gregorian calendar
      const jd = 2460000.5 // 2023-02-24
      const result = julianDayToCalendar(jd)
      expect(result.year).toBe(2023)
      expect(result.month).toBe(2)
      expect(Math.floor(result.day)).toBe(25)
    })
  })

  describe('dateToJulianDay', () => {
    it('should handle UTC timezone', () => {
      const jd = dateToJulianDay('2000-01-01', '12:00', 'UTC')
      expect(jd).toBeCloseTo(2451545.0, 4)
    })

    it('should handle PST timezone (UTC-8)', () => {
      // 2000-01-01 04:00 PST = 2000-01-01 12:00 UTC
      const jd = dateToJulianDay('2000-01-01', '04:00', 'America/Los_Angeles')
      expect(jd).toBeCloseTo(2451545.0, 4)
    })

    it('should handle EST timezone (UTC-5)', () => {
      // 2000-01-01 07:00 EST = 2000-01-01 12:00 UTC
      const jd = dateToJulianDay('2000-01-01', '07:00', 'America/New_York')
      expect(jd).toBeCloseTo(2451545.0, 4)
    })

    it('should handle CET timezone (UTC+1)', () => {
      // 2000-01-01 13:00 CET = 2000-01-01 12:00 UTC
      const jd = dateToJulianDay('2000-01-01', '13:00', 'Europe/Paris')
      expect(jd).toBeCloseTo(2451545.0, 4)
    })
  })

  describe('dateObjectToJulianDay', () => {
    it('should convert Date object correctly', () => {
      // J2000.0: 2000-01-01 12:00:00 UTC
      const date = new Date(Date.UTC(2000, 0, 1, 12, 0, 0))
      const jd = dateObjectToJulianDay(date)
      expect(jd).toBeCloseTo(2451545.0, 6)
    })

    it('should handle arbitrary date correctly', () => {
      // 2024-06-15 18:30:00 UTC
      const date = new Date(Date.UTC(2024, 5, 15, 18, 30, 0))
      const jd = dateObjectToJulianDay(date)
      // Expected: JD ≈ 2460477.27
      expect(jd).toBeCloseTo(2460477.27, 1)
    })
  })

  describe('estimateDeltaT', () => {
    it('should estimate Delta T for year 2010', () => {
      const dt = estimateDeltaT(2010)
      // For years >= 2005, formula is: 62.92 + 0.32217 * t + 0.005589 * t²
      // where t = year - 2000
      // t = 10, dt = 62.92 + 3.2217 + 0.5589 = 66.7
      expect(dt).toBeCloseTo(66.7, 1)
    })

    it('should estimate Delta T for year 2020', () => {
      const dt = estimateDeltaT(2020)
      // t = 20, dt = 62.92 + 6.4434 + 2.2356 = 71.6
      expect(dt).toBeCloseTo(71.6, 1)
    })

    it('should estimate Delta T for historical dates', () => {
      const dt1900 = estimateDeltaT(1900)
      // Historical formula: -20 + 32 * ((year - 1820) / 100)²
      // t = 80, dt = -20 + 32 * 0.64 = 0.48
      expect(dt1900).toBeCloseTo(0.48, 1)
    })
  })

  describe('utToTT', () => {
    it('should convert UT to TT', () => {
      const jd_ut = 2451545.0
      const jd_tt = utToTT(jd_ut, 2000)
      // Delta T ≈ 63.8s = 0.000738 days
      expect(jd_tt - jd_ut).toBeGreaterThan(0)
      expect(jd_tt - jd_ut).toBeLessThan(0.001)
    })
  })

  describe('julianCenturiesFromJ2000', () => {
    it('should return 0 for J2000.0', () => {
      const T = julianCenturiesFromJ2000(J2000_JD)
      expect(T).toBeCloseTo(0, 10)
    })

    it('should return 1 for one century after J2000.0', () => {
      const T = julianCenturiesFromJ2000(J2000_JD + 36525)
      expect(T).toBeCloseTo(1, 10)
    })

    it('should return -1 for one century before J2000.0', () => {
      const T = julianCenturiesFromJ2000(J2000_JD - 36525)
      expect(T).toBeCloseTo(-1, 10)
    })

    it('should return approximately 0.24 for 2024', () => {
      // 2024-01-01 12:00 TT
      const jd2024 = calendarToJulianDay(2024, 1, 1.5)
      const T = julianCenturiesFromJ2000(jd2024)
      expect(T).toBeCloseTo(0.24, 1)
    })
  })

  describe('formatJulianDay', () => {
    it('should format J2000.0 correctly', () => {
      const formatted = formatJulianDay(2451545.0)
      expect(formatted).toContain('2000')
      expect(formatted).toContain('01')
      expect(formatted).toContain('12:00')
    })

    it('should format arbitrary date correctly', () => {
      // JD for 2024-06-15 18:30:00 UT
      const jd = 2460477.27083
      const formatted = formatJulianDay(jd)
      expect(formatted).toContain('2024')
      expect(formatted).toContain('06')
      expect(formatted).toContain('UT')
    })
  })
})
