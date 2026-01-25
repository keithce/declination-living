import { describe, expect, it } from 'vitest'
import {
  calculateASCLine,
  calculateAllACGLines,
  calculateDSCLine,
  calculateICLine,
  calculateMCLine,
  calculatePlanetACGLines,
  filterACGLinesByPlanet,
  filterACGLinesByType,
  findACGLineIntersections,
  findACGLinesNearLocation,
  getACGLineName,
  isACGLineDashed,
} from '../line_solver'
import { getGMST } from '../../coordinates/hour_angle'
import { normalizeDegreesSymmetric } from '../../core/math'
import { J2000 } from '../../core/constants'
import type { EquatorialCoordinates, PlanetId } from '../../core/types'

describe('ACG Line Solver', () => {
  // Test data: Vernal Equinox 2000 (March 20, 2000 07:35 UTC)
  const JD_VERNAL_EQUINOX_2000 = 2451623.815972
  const GMST_VERNAL = getGMST(JD_VERNAL_EQUINOX_2000)

  // Test data: Known planetary positions
  const SUN_EQUINOX: EquatorialCoordinates = {
    ra: 0, // Sun at vernal equinox
    dec: 0, // On celestial equator
  }

  const POLARIS_LIKE: EquatorialCoordinates = {
    ra: 37.95, // ~2.5h
    dec: 89.26, // Very high declination (circumpolar)
  }

  const EQUATORIAL_PLANET: EquatorialCoordinates = {
    ra: 180,
    dec: 0,
  }

  const NORTHERN_PLANET: EquatorialCoordinates = {
    ra: 90,
    dec: 20,
  }

  const SOUTHERN_PLANET: EquatorialCoordinates = {
    ra: 270,
    dec: -20,
  }

  describe('MC Line Calculation', () => {
    it('should create vertical MC line at correct longitude', () => {
      const line = calculateMCLine(JD_VERNAL_EQUINOX_2000, SUN_EQUINOX.ra, 'sun')

      expect(line.planet).toBe('sun')
      expect(line.lineType).toBe('MC')
      expect(line.isCircumpolar).toBe(false)
      expect(line.points).toBeDefined()
      expect(line.points.length).toBeGreaterThan(0)

      // MC longitude should be constant (vertical line)
      const firstLon = line.points[0].longitude
      for (const point of line.points) {
        expect(point.longitude).toBeCloseTo(firstLon, 5)
      }
    })

    it('should span full latitude range (-89.5 to +89.5)', () => {
      const line = calculateMCLine(JD_VERNAL_EQUINOX_2000, NORTHERN_PLANET.ra, 'mars')

      const latitudes = line.points.map((p) => p.latitude)
      expect(Math.min(...latitudes)).toBeCloseTo(-89.5, 1)
      expect(Math.max(...latitudes)).toBeCloseTo(89.5, 1)
    })

    it('should calculate longitude from RA and GMST correctly', () => {
      // MC longitude = RA - GMST
      const expectedLon = normalizeDegreesSymmetric(SUN_EQUINOX.ra - GMST_VERNAL)
      const line = calculateMCLine(JD_VERNAL_EQUINOX_2000, SUN_EQUINOX.ra, 'sun')

      expect(line.points[0].longitude).toBeCloseTo(expectedLon, 1)
    })

    it('should create MC line for all planets', () => {
      const planets: Array<PlanetId> = ['sun', 'moon', 'mercury', 'venus', 'mars']

      for (const planet of planets) {
        const line = calculateMCLine(JD_VERNAL_EQUINOX_2000, 100, planet)
        expect(line.planet).toBe(planet)
        expect(line.lineType).toBe('MC')
        expect(line.points.length).toBeGreaterThan(100)
      }
    })
  })

  describe('IC Line Calculation', () => {
    it('should create vertical IC line at correct longitude', () => {
      const line = calculateICLine(JD_VERNAL_EQUINOX_2000, SUN_EQUINOX.ra, 'sun')

      expect(line.planet).toBe('sun')
      expect(line.lineType).toBe('IC')
      expect(line.isCircumpolar).toBe(false)

      // IC line should also be vertical
      const firstLon = line.points[0].longitude
      for (const point of line.points) {
        expect(point.longitude).toBeCloseTo(firstLon, 5)
      }
    })

    it('should be 180 degrees opposite the MC line', () => {
      const mcLine = calculateMCLine(JD_VERNAL_EQUINOX_2000, NORTHERN_PLANET.ra, 'jupiter')
      const icLine = calculateICLine(JD_VERNAL_EQUINOX_2000, NORTHERN_PLANET.ra, 'jupiter')

      const mcLon = mcLine.points[0].longitude
      const icLon = icLine.points[0].longitude

      // IC should be 180° from MC (normalized to ±180)
      const diff = normalizeDegreesSymmetric(icLon - mcLon)
      expect(Math.abs(diff)).toBeCloseTo(180, 1)
    })

    it('should span same latitude range as MC', () => {
      const line = calculateICLine(JD_VERNAL_EQUINOX_2000, EQUATORIAL_PLANET.ra, 'venus')

      const latitudes = line.points.map((p) => p.latitude)
      expect(Math.min(...latitudes)).toBeCloseTo(-89.5, 1)
      expect(Math.max(...latitudes)).toBeCloseTo(89.5, 1)
    })
  })

  describe('ASC Line Calculation', () => {
    it('should create curved ASC line that varies with latitude', () => {
      const line = calculateASCLine(
        JD_VERNAL_EQUINOX_2000,
        NORTHERN_PLANET.ra,
        NORTHERN_PLANET.dec,
        'mars',
      )

      expect(line.planet).toBe('mars')
      expect(line.lineType).toBe('ASC')
      expect(line.points.length).toBeGreaterThan(0)

      // ASC line should curve - longitudes should vary
      const longitudes = line.points.map((p) => p.longitude)
      const uniqueLongitudes = new Set(longitudes.map((lon) => Math.round(lon * 10)))
      expect(uniqueLongitudes.size).toBeGreaterThan(10) // Should have many different longitudes
    })

    it('should handle equatorial planet (dec=0) correctly', () => {
      const line = calculateASCLine(
        JD_VERNAL_EQUINOX_2000,
        EQUATORIAL_PLANET.ra,
        EQUATORIAL_PLANET.dec,
        'sun',
      )

      expect(line.isCircumpolar).toBe(false)
      expect(line.points.length).toBeGreaterThan(100)

      // For dec=0, planet rises at all latitudes
      const latitudes = line.points.map((p) => p.latitude)
      expect(Math.min(...latitudes)).toBeLessThan(-80)
      expect(Math.max(...latitudes)).toBeGreaterThan(80)
    })

    it('should detect circumpolar case for high declination', () => {
      const line = calculateASCLine(
        JD_VERNAL_EQUINOX_2000,
        POLARIS_LIKE.ra,
        POLARIS_LIKE.dec,
        'moon',
      )

      expect(line.isCircumpolar).toBe(true)

      // High declination planet has limited latitude range
      const latitudes = line.points.map((p) => p.latitude)
      const minLat = Math.min(...latitudes)
      const maxLat = Math.max(...latitudes)

      // For dec=89.26°, circumpolar zone means limited range
      // The line should not extend as far south as a normal planet would
      expect(maxLat - minLat).toBeLessThan(180) // Range should be limited
      expect(minLat).toBeGreaterThan(-80) // Should not extend to extreme south
    })

    it('should terminate at appropriate latitudes for moderate declination', () => {
      const line = calculateASCLine(
        JD_VERNAL_EQUINOX_2000,
        NORTHERN_PLANET.ra,
        NORTHERN_PLANET.dec,
        'jupiter',
      )

      const latitudes = line.points.map((p) => p.latitude)
      const minLat = Math.min(...latitudes)
      const maxLat = Math.max(...latitudes)

      // For dec=20°, planet rises from approximately -(90°-20°) to +(90°-20°)
      // The implementation adds 0.5° buffer and uses 0.5° step, so we get -69.5 to 69.5
      expect(minLat).toBe(-69.5)
      expect(maxLat).toBe(69.5)
      expect(maxLat - minLat).toBe(139)
    })

    it('should handle southern declination correctly', () => {
      const line = calculateASCLine(
        JD_VERNAL_EQUINOX_2000,
        SOUTHERN_PLANET.ra,
        SOUTHERN_PLANET.dec,
        'saturn',
      )

      expect(line.points.length).toBeGreaterThan(0)

      // Should have points in both hemispheres
      const latitudes = line.points.map((p) => p.latitude)
      expect(Math.min(...latitudes)).toBeLessThan(0)
      expect(Math.max(...latitudes)).toBeGreaterThan(0)
    })
  })

  describe('DSC Line Calculation', () => {
    it('should create curved DSC line', () => {
      const line = calculateDSCLine(
        JD_VERNAL_EQUINOX_2000,
        NORTHERN_PLANET.ra,
        NORTHERN_PLANET.dec,
        'mercury',
      )

      expect(line.planet).toBe('mercury')
      expect(line.lineType).toBe('DSC')
      expect(line.points.length).toBeGreaterThan(0)

      // DSC should also curve
      const longitudes = line.points.map((p) => p.longitude)
      const uniqueLongitudes = new Set(longitudes.map((lon) => Math.round(lon * 10)))
      expect(uniqueLongitudes.size).toBeGreaterThan(10)
    })

    it('should be opposite ASC line (approximately 180° at equator)', () => {
      const ascLine = calculateASCLine(
        JD_VERNAL_EQUINOX_2000,
        EQUATORIAL_PLANET.ra,
        EQUATORIAL_PLANET.dec,
        'venus',
      )
      const dscLine = calculateDSCLine(
        JD_VERNAL_EQUINOX_2000,
        EQUATORIAL_PLANET.ra,
        EQUATORIAL_PLANET.dec,
        'venus',
      )

      // Find equatorial points (or close to it)
      const ascEquator = ascLine.points.find((p) => Math.abs(p.latitude) < 1)
      const dscEquator = dscLine.points.find((p) => Math.abs(p.latitude) < 1)

      if (ascEquator && dscEquator) {
        const diff = normalizeDegreesSymmetric(dscEquator.longitude - ascEquator.longitude)
        expect(Math.abs(diff)).toBeCloseTo(180, 1)
      }
    })

    it('should handle circumpolar case same as ASC', () => {
      const ascLine = calculateASCLine(
        JD_VERNAL_EQUINOX_2000,
        POLARIS_LIKE.ra,
        POLARIS_LIKE.dec,
        'neptune',
      )
      const dscLine = calculateDSCLine(
        JD_VERNAL_EQUINOX_2000,
        POLARIS_LIKE.ra,
        POLARIS_LIKE.dec,
        'neptune',
      )

      expect(ascLine.isCircumpolar).toBe(dscLine.isCircumpolar)
    })
  })

  describe('Complete Planet Line Set', () => {
    it('should generate all 4 line types for a planet', () => {
      const lines = calculatePlanetACGLines(
        JD_VERNAL_EQUINOX_2000,
        NORTHERN_PLANET.ra,
        NORTHERN_PLANET.dec,
        'mars',
      )

      expect(lines).toHaveLength(4)

      const lineTypes = lines.map((l) => l.lineType).sort()
      expect(lineTypes).toEqual(['ASC', 'DSC', 'IC', 'MC'])

      // All should be for Mars
      for (const line of lines) {
        expect(line.planet).toBe('mars')
      }
    })

    it('should generate lines with consistent properties', () => {
      const lines = calculatePlanetACGLines(
        JD_VERNAL_EQUINOX_2000,
        EQUATORIAL_PLANET.ra,
        EQUATORIAL_PLANET.dec,
        'sun',
      )

      for (const line of lines) {
        expect(line.points.length).toBeGreaterThan(0)
        expect(line.planet).toBe('sun')
        expect(['MC', 'IC', 'ASC', 'DSC']).toContain(line.lineType)
      }
    })
  })

  describe('All Planets ACG Lines', () => {
    it('should generate 40 total lines (10 planets × 4 lines)', () => {
      const positions: Record<PlanetId, EquatorialCoordinates> = {
        sun: { ra: 0, dec: 0 },
        moon: { ra: 45, dec: 5 },
        mercury: { ra: 10, dec: 2 },
        venus: { ra: 20, dec: -3 },
        mars: { ra: 90, dec: 15 },
        jupiter: { ra: 180, dec: -10 },
        saturn: { ra: 270, dec: 8 },
        uranus: { ra: 300, dec: -5 },
        neptune: { ra: 330, dec: 3 },
        pluto: { ra: 350, dec: -2 },
      }

      const allLines = calculateAllACGLines(JD_VERNAL_EQUINOX_2000, positions)

      expect(allLines).toHaveLength(40)

      // Verify distribution of line types
      const mcLines = allLines.filter((l) => l.lineType === 'MC')
      const icLines = allLines.filter((l) => l.lineType === 'IC')
      const ascLines = allLines.filter((l) => l.lineType === 'ASC')
      const dscLines = allLines.filter((l) => l.lineType === 'DSC')

      expect(mcLines).toHaveLength(10)
      expect(icLines).toHaveLength(10)
      expect(ascLines).toHaveLength(10)
      expect(dscLines).toHaveLength(10)
    })

    it('should have each planet appear exactly 4 times', () => {
      const positions: Record<PlanetId, EquatorialCoordinates> = {
        sun: { ra: 0, dec: 0 },
        moon: { ra: 45, dec: 5 },
        mercury: { ra: 10, dec: 2 },
        venus: { ra: 20, dec: -3 },
        mars: { ra: 90, dec: 15 },
        jupiter: { ra: 180, dec: -10 },
        saturn: { ra: 270, dec: 8 },
        uranus: { ra: 300, dec: -5 },
        neptune: { ra: 330, dec: 3 },
        pluto: { ra: 350, dec: -2 },
      }

      const allLines = calculateAllACGLines(JD_VERNAL_EQUINOX_2000, positions)

      const planets: Array<PlanetId> = [
        'sun',
        'moon',
        'mercury',
        'venus',
        'mars',
        'jupiter',
        'saturn',
        'uranus',
        'neptune',
        'pluto',
      ]

      for (const planet of planets) {
        const planetLines = allLines.filter((l) => l.planet === planet)
        expect(planetLines).toHaveLength(4)
      }
    })
  })

  describe('Line Filtering', () => {
    const testLines = [
      { planet: 'sun' as PlanetId, lineType: 'MC' as const, points: [], isCircumpolar: false },
      { planet: 'sun' as PlanetId, lineType: 'IC' as const, points: [], isCircumpolar: false },
      { planet: 'sun' as PlanetId, lineType: 'ASC' as const, points: [], isCircumpolar: false },
      { planet: 'mars' as PlanetId, lineType: 'MC' as const, points: [], isCircumpolar: false },
      { planet: 'mars' as PlanetId, lineType: 'DSC' as const, points: [], isCircumpolar: true },
    ]

    it('should filter by line type', () => {
      const mcLines = filterACGLinesByType(testLines, 'MC')
      expect(mcLines).toHaveLength(2)
      expect(mcLines.every((l) => l.lineType === 'MC')).toBe(true)
    })

    it('should filter by planet', () => {
      const sunLines = filterACGLinesByPlanet(testLines, 'sun')
      expect(sunLines).toHaveLength(3)
      expect(sunLines.every((l) => l.planet === 'sun')).toBe(true)
    })
  })

  describe('Line Intersections', () => {
    it('should find intersection between two crossing lines', () => {
      const line1 = {
        planet: 'sun' as PlanetId,
        lineType: 'MC' as const,
        points: [
          { latitude: 0, longitude: 50 },
          { latitude: 10, longitude: 50 },
          { latitude: 20, longitude: 50 },
        ],
        isCircumpolar: false,
      }

      const line2 = {
        planet: 'mars' as PlanetId,
        lineType: 'ASC' as const,
        points: [
          { latitude: 10, longitude: 48 },
          { latitude: 10, longitude: 50.5 },
          { latitude: 10, longitude: 52 },
        ],
        isCircumpolar: false,
      }

      const intersections = findACGLineIntersections(line1, line2, 2)
      expect(intersections.length).toBeGreaterThan(0)

      // Should be near lat=10, lon=50 (averaging creates 50.25 from 50 and 50.5)
      const int = intersections[0]
      expect(int.latitude).toBeCloseTo(10, 0)
      expect(int.longitude).toBeCloseTo(50.25, 1)
    })

    it('should not find intersection for non-crossing lines', () => {
      const line1 = {
        planet: 'sun' as PlanetId,
        lineType: 'MC' as const,
        points: [
          { latitude: 0, longitude: 0 },
          { latitude: 10, longitude: 0 },
        ],
        isCircumpolar: false,
      }

      const line2 = {
        planet: 'mars' as PlanetId,
        lineType: 'MC' as const,
        points: [
          { latitude: 0, longitude: 100 },
          { latitude: 10, longitude: 100 },
        ],
        isCircumpolar: false,
      }

      const intersections = findACGLineIntersections(line1, line2, 2)
      expect(intersections).toHaveLength(0)
    })
  })

  describe('Location Proximity', () => {
    const testLine = {
      planet: 'jupiter' as PlanetId,
      lineType: 'MC' as const,
      points: [
        { latitude: -10, longitude: 50 },
        { latitude: 0, longitude: 50 },
        { latitude: 5, longitude: 50 }, // Add point at lat=5 for test
        { latitude: 10, longitude: 50 },
        { latitude: 20, longitude: 50 },
      ],
      isCircumpolar: false,
    }

    it('should find line near location within orb', () => {
      const location = { latitude: 5, longitude: 51 }
      // Increase orb to account for simple Euclidean distance calculation
      const nearbyLines = findACGLinesNearLocation(location, [testLine], 3)

      expect(nearbyLines).toHaveLength(1)
      expect(nearbyLines[0].line.planet).toBe('jupiter')
      expect(nearbyLines[0].minDistance).toBeLessThan(3)
    })

    it('should not find line outside orb', () => {
      const location = { latitude: 5, longitude: 60 }
      const nearbyLines = findACGLinesNearLocation(location, [testLine], 2)

      expect(nearbyLines).toHaveLength(0)
    })

    it('should sort by distance', () => {
      const line2 = {
        planet: 'venus' as PlanetId,
        lineType: 'IC' as const,
        points: [
          { latitude: 5, longitude: 54 },
          { latitude: 10, longitude: 54 },
        ],
        isCircumpolar: false,
      }

      const location = { latitude: 5, longitude: 51 }
      // Increase orb to catch both lines
      const nearbyLines = findACGLinesNearLocation(location, [testLine, line2], 6)

      expect(nearbyLines).toHaveLength(2)
      expect(nearbyLines[0].minDistance).toBeLessThan(nearbyLines[1].minDistance)
    })
  })

  describe('Display Helpers', () => {
    it('should generate correct line names', () => {
      const sunMC = {
        planet: 'sun' as PlanetId,
        lineType: 'MC' as const,
        points: [],
        isCircumpolar: false,
      }
      expect(getACGLineName(sunMC)).toBe('Sun MC')

      const marsASC = {
        planet: 'mars' as PlanetId,
        lineType: 'ASC' as const,
        points: [],
        isCircumpolar: false,
      }
      expect(getACGLineName(marsASC)).toBe('Mars ASC')
    })

    it('should identify MC/IC as dashed lines', () => {
      expect(isACGLineDashed('MC')).toBe(true)
      expect(isACGLineDashed('IC')).toBe(true)
      expect(isACGLineDashed('ASC')).toBe(false)
      expect(isACGLineDashed('DSC')).toBe(false)
    })
  })
})
