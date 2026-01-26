import { describe, expect, it } from 'vitest'
import { getOppositeSign, longitudeToSignPosition, signPositionToLongitude } from '../calculator'
import { ZODIAC_SIGNS } from '../../core/types'
import type { ZodiacSign } from '../../core/types'

describe('Position Utilities', () => {
  describe('longitudeToSignPosition', () => {
    it('should convert 0° to Aries 0°', () => {
      const position = longitudeToSignPosition(0)
      expect(position.sign).toBe('aries')
      expect(position.signIndex).toBe(0)
      expect(position.degree).toBe(0)
      expect(position.minute).toBe(0)
    })

    it('should convert 30° to Taurus 0°', () => {
      const position = longitudeToSignPosition(30)
      expect(position.sign).toBe('taurus')
      expect(position.signIndex).toBe(1)
      expect(position.degree).toBe(0)
    })

    it('should convert 45° to Taurus 15°', () => {
      const position = longitudeToSignPosition(45)
      expect(position.sign).toBe('taurus')
      expect(position.signIndex).toBe(1)
      expect(position.degree).toBe(15)
    })

    it('should convert 120° to Leo 0°', () => {
      const position = longitudeToSignPosition(120)
      expect(position.sign).toBe('leo')
      expect(position.signIndex).toBe(4)
      expect(position.degree).toBe(0)
    })

    it('should convert 359° to Pisces 29°', () => {
      const position = longitudeToSignPosition(359)
      expect(position.sign).toBe('pisces')
      expect(position.signIndex).toBe(11)
      expect(position.degree).toBe(29)
    })

    it('should handle 360° as Aries 0° (wrap around)', () => {
      const position = longitudeToSignPosition(360)
      expect(position.sign).toBe('aries')
      expect(position.signIndex).toBe(0)
      expect(position.degree).toBe(0)
    })

    it('should handle negative longitudes', () => {
      // -30° should be 330° = Pisces 0°
      const position = longitudeToSignPosition(-30)
      expect(position.sign).toBe('pisces')
      expect(position.signIndex).toBe(11)
      expect(position.degree).toBe(0)
    })

    it('should handle longitudes > 360°', () => {
      // 390° should be 30° = Taurus 0°
      const position = longitudeToSignPosition(390)
      expect(position.sign).toBe('taurus')
      expect(position.signIndex).toBe(1)
      expect(position.degree).toBe(0)
    })

    it('should calculate minutes correctly', () => {
      // 15.5° = Aries 15° 30'
      const position = longitudeToSignPosition(15.5)
      expect(position.sign).toBe('aries')
      expect(position.degree).toBe(15)
      expect(position.minute).toBe(30)
    })

    it('should handle all 12 sign boundaries', () => {
      const signBoundaries = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
      const expectedSigns: Array<ZodiacSign> = [
        'aries',
        'taurus',
        'gemini',
        'cancer',
        'leo',
        'virgo',
        'libra',
        'scorpio',
        'sagittarius',
        'capricorn',
        'aquarius',
        'pisces',
      ]

      for (let i = 0; i < signBoundaries.length; i++) {
        const position = longitudeToSignPosition(signBoundaries[i])
        expect(position.sign).toBe(expectedSigns[i])
        expect(position.signIndex).toBe(i)
        expect(position.degree).toBe(0)
      }
    })
  })

  describe('signPositionToLongitude', () => {
    it('should convert Aries 0° to 0°', () => {
      const longitude = signPositionToLongitude({
        sign: 'aries',
        signIndex: 0,
        degree: 0,
        minute: 0,
      })
      expect(longitude).toBe(0)
    })

    it('should convert Leo 15° to 135°', () => {
      const longitude = signPositionToLongitude({
        sign: 'leo',
        signIndex: 4,
        degree: 15,
        minute: 0,
      })
      expect(longitude).toBe(135)
    })

    it('should include minutes in calculation', () => {
      const longitude = signPositionToLongitude({
        sign: 'aries',
        signIndex: 0,
        degree: 10,
        minute: 30,
      })
      expect(longitude).toBe(10.5)
    })

    it("should handle Pisces 29° 59'", () => {
      const longitude = signPositionToLongitude({
        sign: 'pisces',
        signIndex: 11,
        degree: 29,
        minute: 59,
      })
      expect(longitude).toBeCloseTo(359 + 59 / 60, 5)
    })

    it('should round-trip with longitudeToSignPosition', () => {
      // Use values that round-trip cleanly (minutes are floored)
      const testLongitudes = [0, 15.5, 45, 90, 135.75, 180, 225, 270, 315.25, 359.5]

      for (const lon of testLongitudes) {
        const position = longitudeToSignPosition(lon)
        const reconstructed = signPositionToLongitude(position)
        // Use tolerance of 1 decimal place due to minute truncation
        expect(reconstructed).toBeCloseTo(lon, 1)
      }
    })
  })

  describe('getOppositeSign', () => {
    it('should return Libra as opposite of Aries', () => {
      expect(getOppositeSign('aries')).toBe('libra')
    })

    it('should return Aries as opposite of Libra', () => {
      expect(getOppositeSign('libra')).toBe('aries')
    })

    it('should return Scorpio as opposite of Taurus', () => {
      expect(getOppositeSign('taurus')).toBe('scorpio')
    })

    it('should return Aquarius as opposite of Leo', () => {
      expect(getOppositeSign('leo')).toBe('aquarius')
    })

    it('should return correct opposites for all 12 signs', () => {
      const expectedOpposites: Array<[ZodiacSign, ZodiacSign]> = [
        ['aries', 'libra'],
        ['taurus', 'scorpio'],
        ['gemini', 'sagittarius'],
        ['cancer', 'capricorn'],
        ['leo', 'aquarius'],
        ['virgo', 'pisces'],
        ['libra', 'aries'],
        ['scorpio', 'taurus'],
        ['sagittarius', 'gemini'],
        ['capricorn', 'cancer'],
        ['aquarius', 'leo'],
        ['pisces', 'virgo'],
      ]

      for (const [sign, expected] of expectedOpposites) {
        expect(getOppositeSign(sign)).toBe(expected)
      }
    })

    it('should be symmetric (opposite of opposite is original)', () => {
      for (const sign of ZODIAC_SIGNS) {
        const opposite = getOppositeSign(sign)
        const original = getOppositeSign(opposite)
        expect(original).toBe(sign)
      }
    })
  })
})
