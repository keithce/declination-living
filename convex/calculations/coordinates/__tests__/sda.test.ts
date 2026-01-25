import { describe, expect, it } from 'vitest'
import {
  calculateSDA,
  getCircumpolarLatitude,
  isCircumpolar,
  neverRises,
  latitudeForHourAngle,
  getDiurnalArcHours,
  getNocturnalArcHours,
  getRiseSetLatitudeRange,
  hourAngleAtAltitude,
} from '../sda'

describe('Semi-Diurnal Arc Calculations', () => {
  describe('calculateSDA', () => {
    it('should return SDA ≈ 90° at equator for any declination', () => {
      // At the equator, the SDA is always 90° for objects that rise/set
      const result = calculateSDA(0, 23)
      expect(result.sda).toBeCloseTo(90, 1)
      expect(result.neverSets).toBe(false)
      expect(result.neverRises).toBe(false)
    })

    it('should return SDA between 90-120° for mid-latitude normal case', () => {
      // At 40°N with Dec=23° (summer Sun-like)
      const result = calculateSDA(40, 23)
      expect(result.sda).toBeGreaterThan(90)
      expect(result.sda).toBeLessThan(120)
      expect(result.neverSets).toBe(false)
      expect(result.neverRises).toBe(false)
    })

    it('should return SDA < 90° when object has opposite sign declination', () => {
      // At 40°N with Dec=-23° (winter Sun-like)
      const result = calculateSDA(40, -23)
      expect(result.sda).toBeGreaterThan(60)
      expect(result.sda).toBeLessThan(90)
    })

    it('should detect circumpolar case (never sets)', () => {
      // At 70°N with Dec=80°, object should never set
      const result = calculateSDA(70, 80)
      expect(result.neverSets).toBe(true)
      expect(result.neverRises).toBe(false)
      expect(result.sda).toBe(180)
    })

    it('should detect never-rises case', () => {
      // At 70°N with Dec=-80°, object should never rise
      const result = calculateSDA(70, -80)
      expect(result.neverRises).toBe(true)
      expect(result.neverSets).toBe(false)
      expect(result.sda).toBe(0)
    })

    it('should handle southern hemisphere correctly', () => {
      // At 60°S with Dec=-80°, should never set (circumpolar south)
      const result = calculateSDA(-60, -80)
      expect(result.neverSets).toBe(true)
      expect(result.neverRises).toBe(false)
    })

    it('should provide rise/set hour angles for normal case', () => {
      const result = calculateSDA(40, 20)
      expect(result.riseHA).toBeDefined()
      expect(result.setHA).toBeDefined()
      expect(result.riseHA).toBeLessThan(0) // Rising is negative HA
      expect(result.setHA).toBeGreaterThan(0) // Setting is positive HA
      expect(result.riseHA).toBeCloseTo(-result.sda, 5)
      expect(result.setHA).toBeCloseTo(result.sda, 5)
    })

    it('should not provide rise/set HA for circumpolar', () => {
      const result = calculateSDA(70, 80)
      expect(result.riseHA).toBeUndefined()
      expect(result.setHA).toBeUndefined()
    })

    it('should handle pole cases correctly', () => {
      // At north pole with positive declination: never sets
      const northPolePos = calculateSDA(90, 10)
      expect(northPolePos.neverSets).toBe(true)

      // At north pole with negative declination: never rises
      const northPoleNeg = calculateSDA(90, -10)
      expect(northPoleNeg.neverRises).toBe(true)
    })
  })

  describe('getCircumpolarLatitude', () => {
    it('should return correct latitudes for northern declination', () => {
      const result = getCircumpolarLatitude(23.44)
      // Object becomes circumpolar above 90-23.44 = 66.56°N
      expect(result.neverSetsAbove).toBeCloseTo(66.56, 1)
      expect(result.neverRisesAbove).toBeCloseTo(-66.56, 1)
      expect(result.canBeCircumpolar).toBe(true)
    })

    it('should return correct latitudes for southern declination', () => {
      const result = getCircumpolarLatitude(-23.44)
      // Object becomes circumpolar below -(90-23.44) = -66.56°S
      expect(result.neverSetsAbove).toBeCloseTo(-66.56, 1)
      expect(result.neverRisesAbove).toBeCloseTo(66.56, 1)
    })

    it('should handle zero declination', () => {
      const result = getCircumpolarLatitude(0)
      expect(result.canBeCircumpolar).toBe(false)
      expect(result.neverSetsAbove).toBeCloseTo(90, 1)
    })

    it('should handle high declination (like OOB Moon)', () => {
      const result = getCircumpolarLatitude(28)
      // Circumpolar above 90-28 = 62°
      expect(result.neverSetsAbove).toBeCloseTo(62, 1)
    })
  })

  describe('isCircumpolar and neverRises', () => {
    it('isCircumpolar should match calculateSDA.neverSets', () => {
      expect(isCircumpolar(70, 80)).toBe(true)
      expect(isCircumpolar(40, 20)).toBe(false)
      expect(isCircumpolar(-70, -80)).toBe(true)
    })

    it('neverRises should match calculateSDA.neverRises', () => {
      expect(neverRises(70, -80)).toBe(true)
      expect(neverRises(40, 20)).toBe(false)
      expect(neverRises(-70, 80)).toBe(true)
    })
  })

  describe('latitudeForHourAngle', () => {
    it('should return null for zero declination with HA ≠ 90°', () => {
      // Objects on celestial equator rise/set at HA = ±90°
      const result = latitudeForHourAngle(45, 0)
      expect(result).toBeNull()
    })

    it('should return 0 for zero declination with HA = 90°', () => {
      // This is a special case - equatorial objects at HA=90
      const result = latitudeForHourAngle(90, 0)
      expect(result).toBeCloseTo(0, 5)
    })

    it('should return valid latitude for normal case', () => {
      const result = latitudeForHourAngle(100, 23)
      expect(result).not.toBeNull()
      expect(result).toBeGreaterThan(-90)
      expect(result).toBeLessThan(90)
    })
  })

  describe('getDiurnalArcHours', () => {
    it('should return 12 hours at equator', () => {
      const hours = getDiurnalArcHours(0, 0)
      expect(hours).toBeCloseTo(12, 1)
    })

    it('should return "always_up" for circumpolar', () => {
      const hours = getDiurnalArcHours(70, 80)
      expect(hours).toBe('always_up')
    })

    it('should return "always_down" for never-rises', () => {
      const hours = getDiurnalArcHours(70, -80)
      expect(hours).toBe('always_down')
    })

    it('should return > 12 hours when dec has same sign as lat', () => {
      const hours = getDiurnalArcHours(45, 23)
      expect(hours).toBeGreaterThan(12)
    })

    it('should return < 12 hours when dec has opposite sign from lat', () => {
      const hours = getDiurnalArcHours(45, -23)
      expect(hours).toBeLessThan(12)
    })
  })

  describe('getNocturnalArcHours', () => {
    it('should return 12 hours at equator', () => {
      const hours = getNocturnalArcHours(0, 0)
      expect(hours).toBeCloseTo(12, 1)
    })

    it('should be complement of diurnal arc', () => {
      const diurnal = getDiurnalArcHours(45, 20)
      const nocturnal = getNocturnalArcHours(45, 20)
      if (typeof diurnal === 'number' && typeof nocturnal === 'number') {
        expect(diurnal + nocturnal).toBeCloseTo(24, 1)
      }
    })

    it('should return "always_down" when object never sets', () => {
      const hours = getNocturnalArcHours(70, 80)
      expect(hours).toBe('always_down')
    })

    it('should return "always_up" when object never rises', () => {
      const hours = getNocturnalArcHours(70, -80)
      expect(hours).toBe('always_up')
    })
  })

  describe('getRiseSetLatitudeRange', () => {
    it('should return correct range for northern declination', () => {
      const result = getRiseSetLatitudeRange(23.44)
      // Sun at summer solstice can rise/set everywhere except above Arctic Circle
      expect(result.maxLatitude).toBeCloseTo(66.56, 1)
      expect(result.minLatitude).toBeCloseTo(-66.56, 1)
    })

    it('should return correct range for zero declination', () => {
      const result = getRiseSetLatitudeRange(0)
      // Equinox sun rises/sets everywhere except poles
      expect(result.maxLatitude).toBeCloseTo(90, 1)
      expect(result.minLatitude).toBeCloseTo(-90, 1)
    })

    it('should return narrower range for high declination', () => {
      const result = getRiseSetLatitudeRange(28)
      // OOB Moon with Dec=28° has narrower rise/set range
      expect(result.maxLatitude).toBeCloseTo(62, 1)
    })
  })

  describe('hourAngleAtAltitude', () => {
    it('should return SDA for altitude = 0 (horizon)', () => {
      const ha = hourAngleAtAltitude(40, 20, 0)
      const sda = calculateSDA(40, 20)
      if (ha !== null) {
        expect(ha).toBeCloseTo(sda.sda, 2)
      }
    })

    it('should return smaller HA for higher altitude', () => {
      const haHorizon = hourAngleAtAltitude(45, 20, 0)
      const ha10deg = hourAngleAtAltitude(45, 20, 10)
      if (haHorizon !== null && ha10deg !== null) {
        expect(ha10deg).toBeLessThan(haHorizon)
      }
    })

    it('should return 0 for transit altitude (meridian)', () => {
      // At meridian, HA = 0. Transit altitude = 90 - |lat - dec|
      const lat = 45
      const dec = 20
      const transitAlt = 90 - Math.abs(lat - dec)
      const ha = hourAngleAtAltitude(lat, dec, transitAlt)
      if (ha !== null) {
        expect(ha).toBeCloseTo(0, 1)
      }
    })

    it('should return null for unachievable altitude', () => {
      // Object can't reach 90° altitude unless at zenith
      const ha = hourAngleAtAltitude(45, 20, 89)
      expect(ha).toBeNull()
    })

    it('should return null at poles', () => {
      const ha = hourAngleAtAltitude(90, 20, 20)
      expect(ha).toBeNull()
    })
  })
})
