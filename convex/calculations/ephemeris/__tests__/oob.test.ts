import { describe, expect, it } from 'vitest'
import {
  getMeanObliquity,
  getApproxObliquity,
  isOutOfBounds,
  getOOBStatus,
  checkAllOOBStatus,
  getOOBPlanets,
  formatOOBStatus,
  OOB_LIKELIHOOD,
  getOOBInterpretation,
} from '../oob'
import { J2000 } from '../../core/constants'
import { PLANET_IDS, type PlanetDeclinations, type PlanetId } from '../../core/types'

describe('OOB Detection', () => {
  describe('getMeanObliquity', () => {
    it('should return approximately 23.439° at J2000.0', () => {
      const obliquity = getMeanObliquity(J2000)
      expect(obliquity).toBeCloseTo(23.439291, 4)
    })

    it('should decrease over time (precession)', () => {
      const obliquityJ2000 = getMeanObliquity(J2000)
      // 100 years later (36525 days)
      const obliquity2100 = getMeanObliquity(J2000 + 36525)
      expect(obliquity2100).toBeLessThan(obliquityJ2000)
      // Should decrease by about 0.013° per century (rate is -0.0130042°/century)
      expect(obliquityJ2000 - obliquity2100).toBeCloseTo(0.013, 2)
    })

    it('should increase for dates before J2000', () => {
      const obliquityJ2000 = getMeanObliquity(J2000)
      // 100 years earlier
      const obliquity1900 = getMeanObliquity(J2000 - 36525)
      expect(obliquity1900).toBeGreaterThan(obliquityJ2000)
    })
  })

  describe('getApproxObliquity', () => {
    it('should return approximately 23.44°', () => {
      const obliquity = getApproxObliquity()
      expect(obliquity).toBeCloseTo(23.44, 2)
    })
  })

  describe('isOutOfBounds', () => {
    const obliquity = 23.44

    it('should return false for declination within bounds', () => {
      expect(isOutOfBounds(20, obliquity)).toBe(false)
      expect(isOutOfBounds(-20, obliquity)).toBe(false)
      expect(isOutOfBounds(0, obliquity)).toBe(false)
      expect(isOutOfBounds(23, obliquity)).toBe(false)
      expect(isOutOfBounds(-23, obliquity)).toBe(false)
    })

    it('should return true for declination exceeding obliquity (north)', () => {
      expect(isOutOfBounds(25, obliquity)).toBe(true)
      expect(isOutOfBounds(28, obliquity)).toBe(true)
      expect(isOutOfBounds(23.5, obliquity)).toBe(true)
    })

    it('should return true for declination exceeding obliquity (south)', () => {
      expect(isOutOfBounds(-25, obliquity)).toBe(true)
      expect(isOutOfBounds(-28, obliquity)).toBe(true)
      expect(isOutOfBounds(-23.5, obliquity)).toBe(true)
    })

    it('should return false for declination exactly at obliquity', () => {
      expect(isOutOfBounds(obliquity, obliquity)).toBe(false)
      expect(isOutOfBounds(-obliquity, obliquity)).toBe(false)
    })
  })

  describe('getOOBStatus', () => {
    const obliquity = 23.44

    it('should return correct status for in-bounds planet', () => {
      const status = getOOBStatus(20, obliquity)
      expect(status.isOOB).toBe(false)
      expect(status.oobDegrees).toBeNull()
      expect(status.direction).toBeNull()
      expect(status.declination).toBe(20)
      expect(status.obliquity).toBe(obliquity)
    })

    it('should return correct status for OOB planet (north)', () => {
      const status = getOOBStatus(25.5, obliquity)
      expect(status.isOOB).toBe(true)
      expect(status.oobDegrees).toBeCloseTo(2.06, 2)
      expect(status.direction).toBe('north')
      expect(status.declination).toBe(25.5)
    })

    it('should return correct status for OOB planet (south)', () => {
      const status = getOOBStatus(-26, obliquity)
      expect(status.isOOB).toBe(true)
      expect(status.oobDegrees).toBeCloseTo(2.56, 2)
      expect(status.direction).toBe('south')
      expect(status.declination).toBe(-26)
    })

    it('should use default obliquity if not provided', () => {
      const status = getOOBStatus(20)
      expect(status.obliquity).toBeCloseTo(23.44, 2)
    })
  })

  describe('checkAllOOBStatus', () => {
    it('should check all planets', () => {
      const declinations: PlanetDeclinations = {
        sun: 20,
        moon: 25, // OOB
        mercury: -15,
        venus: 18,
        mars: -22,
        jupiter: 5,
        saturn: -10,
        uranus: 15,
        neptune: -12,
        pluto: 24, // OOB
      }

      const result = checkAllOOBStatus(declinations)

      expect(result.sun.isOOB).toBe(false)
      expect(result.moon.isOOB).toBe(true)
      expect(result.mercury.isOOB).toBe(false)
      expect(result.pluto.isOOB).toBe(true)
    })

    it('should use precise obliquity when JD is provided', () => {
      const declinations: PlanetDeclinations = {
        sun: 23.44,
        moon: 23.44,
        mercury: 23.44,
        venus: 23.44,
        mars: 23.44,
        jupiter: 23.44,
        saturn: 23.44,
        uranus: 23.44,
        neptune: 23.44,
        pluto: 23.44,
      }

      const result = checkAllOOBStatus(declinations, J2000)
      // At J2000, obliquity is 23.439291, so 23.44 is just barely OOB
      expect(result.sun.obliquity).toBeCloseTo(23.439291, 4)
    })
  })

  describe('getOOBPlanets', () => {
    it('should return only OOB planets', () => {
      const declinations: PlanetDeclinations = {
        sun: 20,
        moon: 25, // OOB
        mercury: -28, // OOB
        venus: 18,
        mars: -22,
        jupiter: 5,
        saturn: -10,
        uranus: 15,
        neptune: -12,
        pluto: 24, // OOB
      }

      const oobPlanets = getOOBPlanets(declinations)
      expect(oobPlanets).toHaveLength(3)
      expect(oobPlanets).toContain('moon')
      expect(oobPlanets).toContain('mercury')
      expect(oobPlanets).toContain('pluto')
      expect(oobPlanets).not.toContain('sun')
    })

    it('should return empty array when no planets are OOB', () => {
      const declinations: PlanetDeclinations = {
        sun: 20,
        moon: 22,
        mercury: -15,
        venus: 18,
        mars: -22,
        jupiter: 5,
        saturn: -10,
        uranus: 15,
        neptune: -12,
        pluto: 10,
      }

      const oobPlanets = getOOBPlanets(declinations)
      expect(oobPlanets).toHaveLength(0)
    })
  })

  describe('formatOOBStatus', () => {
    it('should format in-bounds status', () => {
      const status = getOOBStatus(20, 23.44)
      expect(formatOOBStatus(status)).toBe('In bounds')
    })

    it('should format OOB north status', () => {
      const status = getOOBStatus(25, 23.44)
      const formatted = formatOOBStatus(status)
      expect(formatted).toContain('OOB')
      expect(formatted).toContain('N')
      expect(formatted).toContain('1.6')
    })

    it('should format OOB south status', () => {
      const status = getOOBStatus(-26, 23.44)
      const formatted = formatOOBStatus(status)
      expect(formatted).toContain('OOB')
      expect(formatted).toContain('S')
    })
  })

  describe('getOOBInterpretation', () => {
    it('should return in-bounds interpretation', () => {
      const status = getOOBStatus(20, 23.44)
      const interpretation = getOOBInterpretation(status, 'moon')
      expect(interpretation).toContain('within bounds')
      expect(interpretation).toContain('moon')
    })

    it('should return OOB interpretation', () => {
      const status = getOOBStatus(25, 23.44)
      const interpretation = getOOBInterpretation(status, 'moon')
      expect(interpretation).toContain('out-of-bounds')
      expect(interpretation).toContain('extreme')
    })
  })

  describe('OOB_LIKELIHOOD', () => {
    it('should have Sun as never OOB', () => {
      expect(OOB_LIKELIHOOD.sun).toBe('never')
    })

    it('should have Moon as common OOB', () => {
      expect(OOB_LIKELIHOOD.moon).toBe('common')
    })

    it('should have Mercury and Venus as occasional', () => {
      expect(OOB_LIKELIHOOD.mercury).toBe('occasional')
      expect(OOB_LIKELIHOOD.venus).toBe('occasional')
    })

    it('should have Pluto as common (high inclination)', () => {
      expect(OOB_LIKELIHOOD.pluto).toBe('common')
    })

    it('should have all planets defined', () => {
      for (const planet of PLANET_IDS) {
        expect(OOB_LIKELIHOOD[planet]).toBeDefined()
      }
    })
  })

  describe('Real-world OOB cases', () => {
    it('should detect Moon OOB at extreme declination', () => {
      // Moon can reach declinations up to about 28.5° during lunar standstill
      const extremeDecMoon = 28
      const status = getOOBStatus(extremeDecMoon, 23.44)
      expect(status.isOOB).toBe(true)
      expect(status.oobDegrees).toBeCloseTo(4.56, 2)
    })

    it('should detect Venus OOB (can reach ~28°)', () => {
      const extremeDecVenus = 27
      const status = getOOBStatus(extremeDecVenus, 23.44)
      expect(status.isOOB).toBe(true)
      expect(status.oobDegrees).toBeCloseTo(3.56, 2)
    })

    it('Sun should never be OOB by definition', () => {
      // Sun's max declination equals the obliquity
      const sunMaxDec = 23.44
      const status = getOOBStatus(sunMaxDec, 23.44)
      expect(status.isOOB).toBe(false)
    })
  })
})
