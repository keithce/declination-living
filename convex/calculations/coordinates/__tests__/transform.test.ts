import { describe, expect, it } from 'vitest'
import {
  eclipticToEquatorial,
  equatorialToEcliptic,
  geoToCartesian,
  cartesianToGeo,
  calculateHourAngle,
  equatorialToHorizontal,
  greatCircleDistance,
  greatCircleDistanceKm,
} from '../transform'

const OBLIQUITY = 23.44 // Approximate current obliquity

describe('Coordinate Transformations', () => {
  describe('eclipticToEquatorial', () => {
    it('should convert vernal equinox (λ=0°, β=0°) correctly', () => {
      // At vernal equinox, ecliptic longitude = 0, the Sun is at the celestial equator
      // RA = 0°, Dec = 0°
      const result = eclipticToEquatorial(0, 0, OBLIQUITY)
      expect(result.rightAscension).toBeCloseTo(0, 5)
      expect(result.declination).toBeCloseTo(0, 5)
    })

    it('should convert summer solstice (λ=90°, β=0°) correctly', () => {
      // At summer solstice, ecliptic longitude = 90°
      // RA = 90°, Dec ≈ +23.44° (obliquity)
      const result = eclipticToEquatorial(90, 0, OBLIQUITY)
      expect(result.rightAscension).toBeCloseTo(90, 1)
      expect(result.declination).toBeCloseTo(OBLIQUITY, 1)
    })

    it('should convert autumnal equinox (λ=180°, β=0°) correctly', () => {
      // At autumnal equinox, ecliptic longitude = 180°
      // RA = 180°, Dec = 0°
      const result = eclipticToEquatorial(180, 0, OBLIQUITY)
      expect(result.rightAscension).toBeCloseTo(180, 1)
      expect(result.declination).toBeCloseTo(0, 5)
    })

    it('should convert winter solstice (λ=270°, β=0°) correctly', () => {
      // At winter solstice, ecliptic longitude = 270°
      // RA = 270°, Dec ≈ -23.44° (negative obliquity)
      const result = eclipticToEquatorial(270, 0, OBLIQUITY)
      expect(result.rightAscension).toBeCloseTo(270, 1)
      expect(result.declination).toBeCloseTo(-OBLIQUITY, 1)
    })

    it('should handle non-zero ecliptic latitude', () => {
      // A point with β > 0 should have higher declination than if β = 0
      const resultOnEcliptic = eclipticToEquatorial(90, 0, OBLIQUITY)
      const resultAboveEcliptic = eclipticToEquatorial(90, 5, OBLIQUITY)
      expect(resultAboveEcliptic.declination).toBeGreaterThan(resultOnEcliptic.declination)
    })

    it('should normalize RA to 0-360 range', () => {
      // Various positions should all give RA in [0, 360)
      const positions = [0, 45, 90, 135, 180, 225, 270, 315]
      for (const lon of positions) {
        const result = eclipticToEquatorial(lon, 0, OBLIQUITY)
        expect(result.rightAscension).toBeGreaterThanOrEqual(0)
        expect(result.rightAscension).toBeLessThan(360)
      }
    })
  })

  describe('equatorialToEcliptic', () => {
    it('should convert celestial equator point (RA=0°, Dec=0°) correctly', () => {
      const result = equatorialToEcliptic(0, 0, OBLIQUITY)
      expect(result.longitude).toBeCloseTo(0, 5)
      expect(result.latitude).toBeCloseTo(0, 5)
    })

    it('should be inverse of eclipticToEquatorial (round-trip)', () => {
      const testCases = [
        { lon: 0, lat: 0 },
        { lon: 45, lat: 2 },
        { lon: 90, lat: 0 },
        { lon: 135, lat: -3 },
        { lon: 180, lat: 0 },
        { lon: 225, lat: 5 },
        { lon: 270, lat: 0 },
        { lon: 315, lat: -2 },
      ]

      for (const tc of testCases) {
        const equatorial = eclipticToEquatorial(tc.lon, tc.lat, OBLIQUITY)
        const ecliptic = equatorialToEcliptic(
          equatorial.rightAscension,
          equatorial.declination,
          OBLIQUITY
        )
        expect(ecliptic.longitude).toBeCloseTo(tc.lon, 3)
        expect(ecliptic.latitude).toBeCloseTo(tc.lat, 3)
      }
    })
  })

  describe('geoToCartesian', () => {
    it('should convert north pole correctly', () => {
      const result = geoToCartesian(90, 0)
      expect(result.y).toBeCloseTo(1, 5) // North pole is +Y
      expect(result.x).toBeCloseTo(0, 5)
      expect(result.z).toBeCloseTo(0, 5)
    })

    it('should convert south pole correctly', () => {
      const result = geoToCartesian(-90, 0)
      expect(result.y).toBeCloseTo(-1, 5) // South pole is -Y
      expect(result.x).toBeCloseTo(0, 5)
      expect(result.z).toBeCloseTo(0, 5)
    })

    it('should convert equator/prime meridian (0,0) correctly', () => {
      const result = geoToCartesian(0, 0)
      // At lat=0, lon=0, using the specific convention in transform.ts
      expect(Math.sqrt(result.x ** 2 + result.y ** 2 + result.z ** 2)).toBeCloseTo(1, 5)
      expect(result.y).toBeCloseTo(0, 5) // On equator
    })

    it('should respect custom radius', () => {
      const radius = 6371 // Earth radius in km
      const result = geoToCartesian(90, 0, radius)
      expect(result.y).toBeCloseTo(radius, 5)
    })

    it('should maintain unit sphere distance', () => {
      const testCases = [
        { lat: 45, lon: 45 },
        { lat: -30, lon: 120 },
        { lat: 60, lon: -90 },
        { lat: 0, lon: 180 },
      ]

      for (const tc of testCases) {
        const result = geoToCartesian(tc.lat, tc.lon)
        const distance = Math.sqrt(result.x ** 2 + result.y ** 2 + result.z ** 2)
        expect(distance).toBeCloseTo(1, 5)
      }
    })
  })

  describe('cartesianToGeo', () => {
    it('should round-trip correctly', () => {
      const testCases = [
        { lat: 45, lon: 45 },
        { lat: -30, lon: 120 },
        { lat: 60, lon: -90 },
        { lat: 0, lon: 0 },
        { lat: 89, lon: 170 },
        { lat: -89, lon: -170 },
      ]

      for (const tc of testCases) {
        const cartesian = geoToCartesian(tc.lat, tc.lon)
        const geo = cartesianToGeo(cartesian.x, cartesian.y, cartesian.z)
        expect(geo.latitude).toBeCloseTo(tc.lat, 3)
        expect(geo.longitude).toBeCloseTo(tc.lon, 3)
      }
    })

    it('should handle zero vector gracefully', () => {
      const result = cartesianToGeo(0, 0, 0)
      expect(result.latitude).toBe(0)
      expect(result.longitude).toBe(0)
    })
  })

  describe('calculateHourAngle', () => {
    it('should return 0 when LST equals RA', () => {
      expect(calculateHourAngle(100, 100)).toBeCloseTo(0, 5)
    })

    it('should return positive HA when LST > RA (west of meridian)', () => {
      const ha = calculateHourAngle(120, 100)
      expect(ha).toBeCloseTo(20, 5)
    })

    it('should return negative HA when LST < RA (east of meridian)', () => {
      const ha = calculateHourAngle(100, 120)
      expect(ha).toBeCloseTo(-20, 5)
    })

    it('should normalize to -180 to +180 range', () => {
      // LST = 10°, RA = 350° → HA should be 20° (wrapped)
      const ha = calculateHourAngle(10, 350)
      expect(ha).toBeCloseTo(20, 5)

      // LST = 350°, RA = 10° → HA should be -20° (wrapped)
      const ha2 = calculateHourAngle(350, 10)
      expect(ha2).toBeCloseTo(-20, 5)
    })
  })

  describe('equatorialToHorizontal', () => {
    it('should calculate zenith correctly (HA=0, Dec=Lat)', () => {
      // Object at zenith: hour angle = 0, declination = latitude
      const lat = 40
      const result = equatorialToHorizontal(0, lat, lat)
      expect(result.altitude).toBeCloseTo(90, 1)
    })

    it('should calculate horizon correctly for rising/setting object', () => {
      // This is a simplified test - exact values depend on the formulas
      const result = equatorialToHorizontal(90, 0, 45)
      // At HA=90°, Dec=0°, Lat=45°, altitude should be 0
      expect(result.altitude).toBeCloseTo(0, 1)
    })

    it('should give lower altitude for negative declination at northern latitude', () => {
      const resultPosDec = equatorialToHorizontal(0, 20, 45)
      const resultNegDec = equatorialToHorizontal(0, -20, 45)
      expect(resultPosDec.altitude).toBeGreaterThan(resultNegDec.altitude)
    })

    it('should normalize azimuth to 0-360 range', () => {
      const testCases = [
        { ha: 0, dec: 45, lat: 45 },
        { ha: 90, dec: 0, lat: 45 },
        { ha: -90, dec: 0, lat: 45 },
        { ha: 180, dec: 0, lat: 45 },
      ]

      for (const tc of testCases) {
        const result = equatorialToHorizontal(tc.ha, tc.dec, tc.lat)
        expect(result.azimuth).toBeGreaterThanOrEqual(0)
        expect(result.azimuth).toBeLessThan(360)
      }
    })
  })

  describe('greatCircleDistance', () => {
    it('should return 0 for same point', () => {
      const dist = greatCircleDistance(45, -122, 45, -122)
      expect(dist).toBeCloseTo(0, 10)
    })

    it('should return π for antipodal points', () => {
      // Antipodal points: (45, 0) and (-45, 180)
      const dist = greatCircleDistance(45, 0, -45, 180)
      expect(dist).toBeCloseTo(Math.PI, 5)
    })

    it('should return π/2 for quarter-sphere distance', () => {
      // North pole to equator = 90° = π/2 radians
      const dist = greatCircleDistance(90, 0, 0, 0)
      expect(dist).toBeCloseTo(Math.PI / 2, 5)
    })

    it('should be symmetric', () => {
      const dist1 = greatCircleDistance(30, -120, 45, -100)
      const dist2 = greatCircleDistance(45, -100, 30, -120)
      expect(dist1).toBeCloseTo(dist2, 10)
    })
  })

  describe('greatCircleDistanceKm', () => {
    it('should return approximately correct distance for known routes', () => {
      // Los Angeles to New York: approximately 3,940 km
      const laLat = 34.05,
        laLon = -118.25
      const nyLat = 40.71,
        nyLon = -74.01
      const dist = greatCircleDistanceKm(laLat, laLon, nyLat, nyLon)
      expect(dist).toBeGreaterThan(3800)
      expect(dist).toBeLessThan(4100)
    })

    it('should return approximately half Earth circumference for antipodal points', () => {
      // Half Earth circumference ≈ 20,015 km
      const dist = greatCircleDistanceKm(0, 0, 0, 180)
      expect(dist).toBeCloseTo(20015, -2) // Within 100 km
    })

    it('should return 0 for same point', () => {
      const dist = greatCircleDistanceKm(45, -122, 45, -122)
      expect(dist).toBeCloseTo(0, 5)
    })
  })
})
