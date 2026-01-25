import { describe, expect, it } from 'vitest'
import { J2000_JD, calendarToJulianDay, julianCenturiesFromJ2000 } from '../ephemeris/julian'
import { getMeanObliquity, getOOBStatus, isOutOfBounds } from '../ephemeris/oob'
import { eclipticToEquatorial, equatorialToEcliptic } from '../coordinates/transform'
import { calculateSDA, getDiurnalArcHours } from '../coordinates/sda'
import { acosDeg, cosDeg, normalizeDegrees, sinDeg } from '../core/math'

describe('Integration Tests - Astronomical Calculations', () => {
  describe('J2000.0 Reference Epoch', () => {
    it('should have correct J2000 constants', () => {
      // J2000.0 is 2000 January 1, 12:00 TT
      expect(J2000_JD).toBe(2451545.0)
    })

    it('should calculate obliquity at J2000 correctly', () => {
      const obliquity = getMeanObliquity(J2000_JD)
      // IAU 2006 value: 23°26'21.406" = 23.439279°
      expect(obliquity).toBeCloseTo(23.439291, 4)
    })

    it('should have zero Julian centuries at J2000', () => {
      const T = julianCenturiesFromJ2000(J2000_JD)
      expect(T).toBe(0)
    })
  })

  describe('Solar Position at Key Dates (Reference Validation)', () => {
    const obliquity = 23.44

    it('should calculate vernal equinox Sun position', () => {
      // At vernal equinox, Sun is at 0° ecliptic longitude
      const { rightAscension, declination } = eclipticToEquatorial(0, 0, obliquity)
      expect(rightAscension).toBeCloseTo(0, 3)
      expect(declination).toBeCloseTo(0, 3)
    })

    it('should calculate summer solstice Sun position', () => {
      // At summer solstice, Sun is at 90° ecliptic longitude
      const { rightAscension, declination } = eclipticToEquatorial(90, 0, obliquity)
      expect(rightAscension).toBeCloseTo(90, 1)
      expect(declination).toBeCloseTo(obliquity, 1)
    })

    it('should calculate autumnal equinox Sun position', () => {
      // At autumnal equinox, Sun is at 180° ecliptic longitude
      const { rightAscension, declination } = eclipticToEquatorial(180, 0, obliquity)
      expect(rightAscension).toBeCloseTo(180, 1)
      expect(declination).toBeCloseTo(0, 3)
    })

    it('should calculate winter solstice Sun position', () => {
      // At winter solstice, Sun is at 270° ecliptic longitude
      const { rightAscension, declination } = eclipticToEquatorial(270, 0, obliquity)
      expect(rightAscension).toBeCloseTo(270, 1)
      expect(declination).toBeCloseTo(-obliquity, 1)
    })
  })

  describe('Daylight Hours at Key Latitudes', () => {
    const obliquity = 23.44

    it('should have 12h daylight at equator on equinox', () => {
      const hours = getDiurnalArcHours(0, 0)
      expect(hours).toBeCloseTo(12, 1)
    })

    it('should have longer days at 45°N during summer', () => {
      // Summer solstice Sun declination ≈ 23.44°
      const hours = getDiurnalArcHours(45, obliquity)
      expect(hours).toBeGreaterThan(14)
      expect(hours).toBeLessThan(16)
    })

    it('should have shorter days at 45°N during winter', () => {
      // Winter solstice Sun declination ≈ -23.44°
      const hours = getDiurnalArcHours(45, -obliquity)
      expect(hours).toBeGreaterThan(8)
      expect(hours).toBeLessThan(10)
    })

    it('should have midnight sun above Arctic Circle in summer', () => {
      // Arctic Circle ≈ 66.56°N
      // At 70°N during summer solstice
      const hours = getDiurnalArcHours(70, obliquity)
      expect(hours).toBe('always_up')
    })

    it('should have polar night above Arctic Circle in winter', () => {
      // At 70°N during winter solstice
      const hours = getDiurnalArcHours(70, -obliquity)
      expect(hours).toBe('always_down')
    })
  })

  describe('OOB Detection with Real Cases', () => {
    const obliquity = getMeanObliquity(J2000_JD)

    it('should correctly identify Sun as never OOB', () => {
      // Sun's max declination equals obliquity
      const sunMaxDec = obliquity
      expect(isOutOfBounds(sunMaxDec, obliquity)).toBe(false)
      expect(isOutOfBounds(-sunMaxDec, obliquity)).toBe(false)
    })

    it('should detect Moon OOB at lunar standstill', () => {
      // Moon can reach up to ~28.5° during major lunar standstill
      // This happens when Moon's orbit inclination (5.14°) adds to obliquity
      const moonMajorStandstill = obliquity + 5.14
      const status = getOOBStatus(moonMajorStandstill, obliquity)
      expect(status.isOOB).toBe(true)
      expect(status.oobDegrees).toBeCloseTo(5.14, 1)
      expect(status.direction).toBe('north')
    })

    it('should detect Mercury OOB (max inclination ~7°)', () => {
      // Mercury can reach Dec ≈ 27° when orbit is favorably tilted
      const mercuryOOB = 27
      const status = getOOBStatus(mercuryOOB, obliquity)
      expect(status.isOOB).toBe(true)
      expect(status.oobDegrees).toBeCloseTo(3.56, 1)
    })

    it('should detect Jupiter barely OOB at extreme declination', () => {
      // Jupiter can just barely exceed obliquity (inclination ~1.3°)
      const jupiterMaxDec = 23.5 // Typical max at extreme
      const status = getOOBStatus(jupiterMaxDec, obliquity)
      expect(status.isOOB).toBe(true) // Just barely, ~0.06°
      expect(status.oobDegrees).toBeLessThan(0.2)
    })
  })

  describe('Coordinate System Consistency', () => {
    it('should maintain mathematical relationships', () => {
      // Test that our trig functions are working correctly
      expect(sinDeg(30)).toBeCloseTo(0.5, 10)
      expect(cosDeg(60)).toBeCloseTo(0.5, 10)
      expect(sinDeg(90)).toBeCloseTo(1, 10)
      expect(cosDeg(0)).toBeCloseTo(1, 10)
      expect(acosDeg(0.5)).toBeCloseTo(60, 5)
    })

    it('should normalize degrees correctly', () => {
      expect(normalizeDegrees(360)).toBeCloseTo(0, 10)
      expect(normalizeDegrees(-90)).toBeCloseTo(270, 10)
      expect(normalizeDegrees(450)).toBeCloseTo(90, 10)
      expect(normalizeDegrees(-360)).toBeCloseTo(0, 10)
    })

    it('should round-trip ecliptic/equatorial correctly', () => {
      const obliquity = 23.44
      const testLongitudes = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

      for (const lon of testLongitudes) {
        const eq = eclipticToEquatorial(lon, 0, obliquity)
        const ecl = equatorialToEcliptic(eq.rightAscension, eq.declination, obliquity)
        expect(ecl.longitude).toBeCloseTo(lon, 2)
        expect(ecl.latitude).toBeCloseTo(0, 2)
      }
    })
  })

  describe('SDA and Horizon Calculations', () => {
    it('should have consistent SDA formula', () => {
      // cos(H) = -tan(lat) * tan(dec)
      const lat = 45
      const dec = 23.44

      // Manual calculation
      const tanLat = Math.tan((lat * Math.PI) / 180)
      const tanDec = Math.tan((dec * Math.PI) / 180)
      const cosH = -tanLat * tanDec
      const expectedSDA = (Math.acos(cosH) * 180) / Math.PI

      const result = calculateSDA(lat, dec)
      expect(result.sda).toBeCloseTo(expectedSDA, 3)
    })

    it('should correctly identify circumpolar threshold', () => {
      // Object is circumpolar when |lat| + |dec| > 90° (same signs)
      // Or when cos(H) < -1

      // At 67°N, Dec 24° should just become circumpolar
      const result67 = calculateSDA(67, 24)
      expect(result67.neverSets).toBe(true)

      // At 65°N, Dec 24° should still rise/set
      const result65 = calculateSDA(65, 24)
      expect(result65.neverSets).toBe(false)
    })
  })

  describe('Julian Day Edge Cases', () => {
    it('should handle dates before Gregorian reform', () => {
      // October 15, 1582 was first day of Gregorian calendar
      // Our algorithm uses proleptic Gregorian extrapolation
      const jd = calendarToJulianDay(1500, 6, 15.5)
      // The actual JD for this date using Gregorian algorithm
      expect(jd).toBeGreaterThan(2269000)
      expect(jd).toBeLessThan(2269200)
    })

    it('should handle far future dates', () => {
      const jd = calendarToJulianDay(2100, 1, 1.5)
      // Should be about 36525 days (1 century) after J2000
      expect(jd - J2000_JD).toBeGreaterThan(36500)
      expect(jd - J2000_JD).toBeLessThan(36600)
    })

    it('should handle negative years (BCE)', () => {
      // Year -4712 Jan 1 noon in proleptic Julian = JD 0
      // But our algorithm uses Gregorian, so result differs slightly
      // The important thing is it doesn't crash and gives a reasonable value
      const jd = calendarToJulianDay(-4712, 1, 1.5)
      expect(jd).toBeLessThan(100) // Should be close to origin
      expect(jd).toBeGreaterThan(-100)
    })
  })
})
