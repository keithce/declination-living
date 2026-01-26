import { describe, expect, it } from 'vitest'
import {
  SECT_PLANETS,
  getPlanetSectClass,
  getPlanetsBySectClass,
  getSectModifier,
  isPlanetInSect,
  sectFromPositions,
  sectFromSunAltitude,
} from '../sect'
import type { PlanetId } from '../../core/types'

describe('Sect Calculator', () => {
  describe('SECT_PLANETS constant', () => {
    it('should classify Sun as day sect', () => {
      expect(SECT_PLANETS.sun).toBe('day')
    })

    it('should classify Jupiter as day sect', () => {
      expect(SECT_PLANETS.jupiter).toBe('day')
    })

    it('should classify Saturn as day sect', () => {
      expect(SECT_PLANETS.saturn).toBe('day')
    })

    it('should classify Moon as night sect', () => {
      expect(SECT_PLANETS.moon).toBe('night')
    })

    it('should classify Venus as night sect', () => {
      expect(SECT_PLANETS.venus).toBe('night')
    })

    it('should classify Mars as night sect', () => {
      expect(SECT_PLANETS.mars).toBe('night')
    })

    it('should classify Mercury as neutral', () => {
      expect(SECT_PLANETS.mercury).toBe('neutral')
    })

    it('should classify outer planets as neutral', () => {
      expect(SECT_PLANETS.uranus).toBe('neutral')
      expect(SECT_PLANETS.neptune).toBe('neutral')
      expect(SECT_PLANETS.pluto).toBe('neutral')
    })

    it('should have classifications for all 10 planets', () => {
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
        expect(SECT_PLANETS[planet]).toBeDefined()
        expect(['day', 'night', 'neutral']).toContain(SECT_PLANETS[planet])
      }
    })
  })

  describe('sectFromSunAltitude', () => {
    it('should return day when Sun altitude is positive', () => {
      expect(sectFromSunAltitude(10)).toBe('day')
      expect(sectFromSunAltitude(45)).toBe('day')
      expect(sectFromSunAltitude(90)).toBe('day')
    })

    it('should return night when Sun altitude is negative', () => {
      expect(sectFromSunAltitude(-10)).toBe('night')
      expect(sectFromSunAltitude(-45)).toBe('night')
      expect(sectFromSunAltitude(-90)).toBe('night')
    })

    it('should return day when Sun is exactly on horizon (0°)', () => {
      expect(sectFromSunAltitude(0)).toBe('day')
    })

    it('should handle small positive values', () => {
      expect(sectFromSunAltitude(0.1)).toBe('day')
      expect(sectFromSunAltitude(0.001)).toBe('day')
    })

    it('should handle small negative values', () => {
      expect(sectFromSunAltitude(-0.1)).toBe('night')
      expect(sectFromSunAltitude(-0.001)).toBe('night')
    })
  })

  describe('sectFromPositions', () => {
    it('should return day when Sun is between ASC and DSC', () => {
      // ASC at 0° (Aries), DSC at 180° (Libra)
      // Sun at 90° (Cancer) - above horizon
      expect(sectFromPositions(90, 0)).toBe('day')
    })

    it('should return night when Sun is between DSC and ASC', () => {
      // ASC at 0° (Aries), DSC at 180° (Libra)
      // Sun at 270° (Capricorn) - below horizon
      expect(sectFromPositions(270, 0)).toBe('night')
    })

    it('should handle ASC > DSC case', () => {
      // ASC at 350°, DSC at 170°
      // Sun at 355° - above horizon
      expect(sectFromPositions(355, 350)).toBe('day')
      // Sun at 100° - above horizon
      expect(sectFromPositions(100, 350)).toBe('day')
      // Sun at 250° - below horizon
      expect(sectFromPositions(250, 350)).toBe('night')
    })

    it('should normalize longitudes > 360°', () => {
      // 390° = 30°
      expect(sectFromPositions(390, 0)).toBe('day')
    })

    it('should handle negative longitudes', () => {
      // -90° = 270°
      expect(sectFromPositions(-90, 0)).toBe('night')
    })

    it('should return day when Sun is exactly at ASC', () => {
      expect(sectFromPositions(0, 0)).toBe('day')
    })

    it('should return night when Sun is exactly at DSC', () => {
      expect(sectFromPositions(180, 0)).toBe('night')
    })

    it('should handle real-world positions', () => {
      // Sun at 15° Leo (135°), ASC at 20° Scorpio (230°)
      // DSC at 20° Taurus (50°)
      // Upper hemisphere goes from ASC (230°) counterclockwise to DSC (50°)
      // That's 230° -> 280° -> 330° -> 0° -> 50°
      // Sun at 135° is NOT in this range, so it's below horizon
      expect(sectFromPositions(135, 230)).toBe('night')

      // Sun at 300° (Aquarius) with same ASC - above horizon
      expect(sectFromPositions(300, 230)).toBe('day')

      // Sun at 30° (Taurus) with same ASC - above horizon
      expect(sectFromPositions(30, 230)).toBe('day')
    })
  })

  describe('isPlanetInSect', () => {
    describe('Day chart', () => {
      it('should return true for day planets in day chart', () => {
        expect(isPlanetInSect('sun', 'day')).toBe(true)
        expect(isPlanetInSect('jupiter', 'day')).toBe(true)
        expect(isPlanetInSect('saturn', 'day')).toBe(true)
      })

      it('should return false for night planets in day chart', () => {
        expect(isPlanetInSect('moon', 'day')).toBe(false)
        expect(isPlanetInSect('venus', 'day')).toBe(false)
        expect(isPlanetInSect('mars', 'day')).toBe(false)
      })

      it('should return null for neutral planets in day chart', () => {
        expect(isPlanetInSect('mercury', 'day')).toBe(null)
        expect(isPlanetInSect('uranus', 'day')).toBe(null)
        expect(isPlanetInSect('neptune', 'day')).toBe(null)
        expect(isPlanetInSect('pluto', 'day')).toBe(null)
      })
    })

    describe('Night chart', () => {
      it('should return true for night planets in night chart', () => {
        expect(isPlanetInSect('moon', 'night')).toBe(true)
        expect(isPlanetInSect('venus', 'night')).toBe(true)
        expect(isPlanetInSect('mars', 'night')).toBe(true)
      })

      it('should return false for day planets in night chart', () => {
        expect(isPlanetInSect('sun', 'night')).toBe(false)
        expect(isPlanetInSect('jupiter', 'night')).toBe(false)
        expect(isPlanetInSect('saturn', 'night')).toBe(false)
      })

      it('should return null for neutral planets in night chart', () => {
        expect(isPlanetInSect('mercury', 'night')).toBe(null)
        expect(isPlanetInSect('uranus', 'night')).toBe(null)
        expect(isPlanetInSect('neptune', 'night')).toBe(null)
        expect(isPlanetInSect('pluto', 'night')).toBe(null)
      })
    })
  })

  describe('getSectModifier', () => {
    describe('Day chart', () => {
      it('should return +1 for in-sect day planets', () => {
        expect(getSectModifier('sun', 'day')).toBe(1)
        expect(getSectModifier('jupiter', 'day')).toBe(1)
        expect(getSectModifier('saturn', 'day')).toBe(1)
      })

      it('should return -1 for out-of-sect night planets', () => {
        expect(getSectModifier('moon', 'day')).toBe(-1)
        expect(getSectModifier('venus', 'day')).toBe(-1)
        expect(getSectModifier('mars', 'day')).toBe(-1)
      })

      it('should return 0 for neutral planets', () => {
        expect(getSectModifier('mercury', 'day')).toBe(0)
        expect(getSectModifier('uranus', 'day')).toBe(0)
        expect(getSectModifier('neptune', 'day')).toBe(0)
        expect(getSectModifier('pluto', 'day')).toBe(0)
      })
    })

    describe('Night chart', () => {
      it('should return +1 for in-sect night planets', () => {
        expect(getSectModifier('moon', 'night')).toBe(1)
        expect(getSectModifier('venus', 'night')).toBe(1)
        expect(getSectModifier('mars', 'night')).toBe(1)
      })

      it('should return -1 for out-of-sect day planets', () => {
        expect(getSectModifier('sun', 'night')).toBe(-1)
        expect(getSectModifier('jupiter', 'night')).toBe(-1)
        expect(getSectModifier('saturn', 'night')).toBe(-1)
      })

      it('should return 0 for neutral planets', () => {
        expect(getSectModifier('mercury', 'night')).toBe(0)
        expect(getSectModifier('uranus', 'night')).toBe(0)
        expect(getSectModifier('neptune', 'night')).toBe(0)
        expect(getSectModifier('pluto', 'night')).toBe(0)
      })
    })
  })

  describe('getPlanetSectClass', () => {
    it('should return correct class for each planet', () => {
      expect(getPlanetSectClass('sun')).toBe('day')
      expect(getPlanetSectClass('moon')).toBe('night')
      expect(getPlanetSectClass('mercury')).toBe('neutral')
      expect(getPlanetSectClass('venus')).toBe('night')
      expect(getPlanetSectClass('mars')).toBe('night')
      expect(getPlanetSectClass('jupiter')).toBe('day')
      expect(getPlanetSectClass('saturn')).toBe('day')
      expect(getPlanetSectClass('uranus')).toBe('neutral')
      expect(getPlanetSectClass('neptune')).toBe('neutral')
      expect(getPlanetSectClass('pluto')).toBe('neutral')
    })
  })

  describe('getPlanetsBySectClass', () => {
    it('should return all day planets', () => {
      const dayPlanets = getPlanetsBySectClass('day')
      expect(dayPlanets).toContain('sun')
      expect(dayPlanets).toContain('jupiter')
      expect(dayPlanets).toContain('saturn')
      expect(dayPlanets).toHaveLength(3)
    })

    it('should return all night planets', () => {
      const nightPlanets = getPlanetsBySectClass('night')
      expect(nightPlanets).toContain('moon')
      expect(nightPlanets).toContain('venus')
      expect(nightPlanets).toContain('mars')
      expect(nightPlanets).toHaveLength(3)
    })

    it('should return all neutral planets', () => {
      const neutralPlanets = getPlanetsBySectClass('neutral')
      expect(neutralPlanets).toContain('mercury')
      expect(neutralPlanets).toContain('uranus')
      expect(neutralPlanets).toContain('neptune')
      expect(neutralPlanets).toContain('pluto')
      expect(neutralPlanets).toHaveLength(4)
    })

    it('should cover all 10 planets across all classes', () => {
      const dayPlanets = getPlanetsBySectClass('day')
      const nightPlanets = getPlanetsBySectClass('night')
      const neutralPlanets = getPlanetsBySectClass('neutral')

      const allPlanets = [...dayPlanets, ...nightPlanets, ...neutralPlanets]
      expect(allPlanets).toHaveLength(10)
    })
  })
})
