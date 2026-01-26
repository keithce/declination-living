import { describe, expect, it } from 'vitest'
import {
  filterBySafetyLevel,
  filterByTier,
  generateHighlights,
  getRankingSummary,
  getTopCities,
  groupByCountry,
  rankCities,
} from '../ranking'
import type { CityData, RankedCity } from '../ranking'
import type { OptimizationInput } from '../optimizer'
import type {
  EquatorialCoordinates,
  PlanetDeclinations,
  PlanetId,
  PlanetWeights,
} from '../../core/types'

describe('City Ranking', () => {
  // Test data
  const TEST_DECLINATIONS: PlanetDeclinations = {
    sun: 20.0,
    moon: 18.5,
    mercury: 10.0,
    venus: 5.0,
    mars: -10.0,
    jupiter: -15.0,
    saturn: 2.5,
    uranus: -5.0,
    neptune: 8.0,
    pluto: -8.0,
  }

  const TEST_WEIGHTS: PlanetWeights = {
    sun: 5,
    moon: 4,
    mercury: 2,
    venus: 3,
    mars: 3,
    jupiter: 4,
    saturn: 3,
    uranus: 2,
    neptune: 2,
    pluto: 1,
  }

  const TEST_POSITIONS: Record<PlanetId, EquatorialCoordinates> = {
    sun: { ra: 0, dec: 20.0 },
    moon: { ra: 45, dec: 18.5 },
    mercury: { ra: 10, dec: 10.0 },
    venus: { ra: 20, dec: 5.0 },
    mars: { ra: 90, dec: -10.0 },
    jupiter: { ra: 180, dec: -15.0 },
    saturn: { ra: 270, dec: 2.5 },
    uranus: { ra: 300, dec: -5.0 },
    neptune: { ra: 330, dec: 8.0 },
    pluto: { ra: 350, dec: -8.0 },
  }

  const TEST_INPUT: OptimizationInput = {
    declinations: TEST_DECLINATIONS,
    positions: TEST_POSITIONS,
    weights: TEST_WEIGHTS,
    acgLines: [],
    parans: [],
  }

  // Mock city data
  const mockCities: Array<CityData> = [
    {
      _id: 'city1' as any,
      name: 'Sun City',
      country: 'USA',
      latitude: 20.0, // At Sun's zenith
      longitude: -100.0,
      tier: 'major',
      population: 1000000,
    },
    {
      _id: 'city2' as any,
      name: 'Moon Town',
      country: 'USA',
      latitude: 18.5, // At Moon's zenith
      longitude: -90.0,
      tier: 'major',
      population: 500000,
    },
    {
      _id: 'city3' as any,
      name: 'Venus Village',
      country: 'Canada',
      latitude: 5.0, // At Venus's zenith
      longitude: -80.0,
      tier: 'medium',
      population: 100000,
    },
    {
      _id: 'city4' as any,
      name: 'Far Away',
      country: 'Australia',
      latitude: -40.0, // Far from any zenith
      longitude: 150.0,
      tier: 'minor',
      population: 50000,
    },
    {
      _id: 'city5' as any,
      name: 'Small Place',
      country: 'Australia',
      latitude: -15.0, // At Jupiter's zenith
      longitude: 145.0,
      tier: 'small',
      population: 20000,
    },
  ]

  describe('rankCities', () => {
    it('should rank cities by score descending', () => {
      const ranked = rankCities(mockCities, TEST_INPUT)

      expect(ranked.length).toBe(mockCities.length)

      // Should be sorted by score descending
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].score).toBeGreaterThanOrEqual(ranked[i + 1].score)
      }
    })

    it('should include all required fields', () => {
      const ranked = rankCities(mockCities, TEST_INPUT)

      for (const city of ranked) {
        expect(city.cityId).toBeDefined()
        expect(city.name).toBeDefined()
        expect(city.country).toBeDefined()
        expect(city.latitude).toBeDefined()
        expect(city.longitude).toBeDefined()
        expect(city.tier).toBeDefined()
        expect(city.score).toBeDefined()
        expect(city.highlights).toBeDefined()
        expect(city.safetyLevel).toBeDefined()
        expect(city.breakdown).toBeDefined()
        expect(city.breakdown.zenith).toBeDefined()
        expect(city.breakdown.acg).toBeDefined()
        expect(city.breakdown.paran).toBeDefined()
      }
    })

    it('should score higher for cities near high-weight planet zeniths', () => {
      const ranked = rankCities(mockCities, TEST_INPUT)

      // Sun City (lat 20°, near Sun's zenith with weight 5) should rank high
      const sunCity = ranked.find((c) => c.name === 'Sun City')
      expect(sunCity).toBeDefined()
      expect(sunCity!.score).toBeGreaterThan(0)

      // Far Away (lat -40°) should rank lower
      const farAway = ranked.find((c) => c.name === 'Far Away')
      expect(farAway).toBeDefined()
      expect(sunCity!.score).toBeGreaterThan(farAway!.score)
    })

    it('should apply tier filter', () => {
      const majorOnly = rankCities(mockCities, TEST_INPUT, { tiers: ['major'] })
      expect(majorOnly.length).toBe(2)
      expect(majorOnly.every((c) => c.tier === 'major')).toBe(true)
    })

    it('should apply limit', () => {
      const limited = rankCities(mockCities, TEST_INPUT, { limit: 2 })
      expect(limited.length).toBe(2)
    })

    it('should calculate score breakdown', () => {
      const ranked = rankCities(mockCities, TEST_INPUT)

      for (const city of ranked) {
        // Total score should be sum of breakdown components
        const total = city.breakdown.zenith + city.breakdown.acg + city.breakdown.paran
        expect(city.score).toBeCloseTo(total, 5)
      }
    })

    it('should handle empty city list', () => {
      const ranked = rankCities([], TEST_INPUT)
      expect(ranked).toHaveLength(0)
    })
  })

  describe('generateHighlights', () => {
    it('should generate zenith proximity highlights', () => {
      const sunCity = mockCities[0] // At Sun's zenith
      const highlights = generateHighlights(sunCity, TEST_INPUT)

      expect(highlights.length).toBeGreaterThan(0)
      expect(highlights.some((h) => h.toLowerCase().includes('sun'))).toBe(true)
    })

    it('should mention planet name in highlights', () => {
      const moonTown = mockCities[1] // At Moon's zenith
      const highlights = generateHighlights(moonTown, TEST_INPUT)

      expect(highlights.some((h) => h.toLowerCase().includes('moon'))).toBe(true)
    })

    it('should generate direct zenith highlight for very close proximity', () => {
      const sunCity = mockCities[0] // Exactly at Sun's zenith
      const highlights = generateHighlights(sunCity, TEST_INPUT)

      expect(highlights.some((h) => h.includes('directly'))).toBe(true)
    })

    it('should generate "near" highlight for close but not exact proximity', () => {
      // City 1° away from zenith
      const nearCity: CityData = {
        _id: 'near' as any,
        name: 'Near City',
        country: 'Test',
        latitude: 21.0, // 1° from Sun's zenith at 20°
        longitude: 0,
        tier: 'major',
        population: 100000,
      }

      const highlights = generateHighlights(nearCity, TEST_INPUT)
      expect(highlights.some((h) => h.toLowerCase().includes('near'))).toBe(true)
    })

    it('should not generate highlights for low-weight planets', () => {
      // Pluto has weight 1, should not generate highlights
      const plutoCity: CityData = {
        _id: 'pluto' as any,
        name: 'Pluto City',
        country: 'Test',
        latitude: -8.0, // At Pluto's zenith
        longitude: 0,
        tier: 'major',
        population: 100000,
      }

      const highlights = generateHighlights(plutoCity, TEST_INPUT)
      // Should not mention pluto (weight=1, below threshold of 3)
      expect(highlights.some((h) => h.toLowerCase().includes('pluto'))).toBe(false)
    })

    it('should handle city far from any zenith', () => {
      const farCity: CityData = {
        _id: 'far' as any,
        name: 'Far City',
        country: 'Test',
        latitude: 50.0, // Far from any planet declination
        longitude: 0,
        tier: 'major',
        population: 100000,
      }

      const highlights = generateHighlights(farCity, TEST_INPUT)
      // May have no highlights
      expect(Array.isArray(highlights)).toBe(true)
    })
  })

  describe('filterByTier', () => {
    // Create some ranked cities for filtering tests
    const rankedCities: Array<RankedCity> = mockCities.map((c) => ({
      cityId: c._id,
      name: c.name,
      country: c.country,
      latitude: c.latitude,
      longitude: c.longitude,
      tier: c.tier,
      score: 50,
      highlights: [],
      safetyLevel: 'good' as const,
      breakdown: { zenith: 40, acg: 5, paran: 5 },
    }))

    it('should filter to major cities only', () => {
      const filtered = filterByTier(rankedCities, ['major'])
      expect(filtered.every((c) => c.tier === 'major')).toBe(true)
      expect(filtered.length).toBe(2)
    })

    it('should filter to multiple tiers', () => {
      const filtered = filterByTier(rankedCities, ['major', 'medium'])
      expect(filtered.every((c) => c.tier === 'major' || c.tier === 'medium')).toBe(true)
      expect(filtered.length).toBe(3)
    })

    it('should return empty for non-matching tier', () => {
      // Remove the 'small' tier city and filter for only 'small'
      const noSmall = rankedCities.filter((c) => c.tier !== 'small')
      const filtered = filterByTier(noSmall, ['small'])
      expect(filtered.length).toBe(0)
    })
  })

  describe('filterBySafetyLevel', () => {
    const createRankedCity = (safetyLevel: RankedCity['safetyLevel']): RankedCity => ({
      cityId: 'test' as any,
      name: 'Test',
      country: 'Test',
      latitude: 0,
      longitude: 0,
      tier: 'major',
      score: 50,
      highlights: [],
      safetyLevel,
      breakdown: { zenith: 40, acg: 5, paran: 5 },
    })

    const rankedCities: Array<RankedCity> = [
      createRankedCity('excellent'),
      createRankedCity('good'),
      createRankedCity('moderate'),
      createRankedCity('challenging'),
      createRankedCity('difficult'),
    ]

    it('should filter to excellent only', () => {
      const filtered = filterBySafetyLevel(rankedCities, 'excellent')
      expect(filtered.length).toBe(1)
      expect(filtered[0].safetyLevel).toBe('excellent')
    })

    it('should filter to good or better', () => {
      const filtered = filterBySafetyLevel(rankedCities, 'good')
      expect(filtered.length).toBe(2)
      expect(filtered.every((c) => c.safetyLevel === 'excellent' || c.safetyLevel === 'good')).toBe(
        true,
      )
    })

    it('should filter to moderate or better', () => {
      const filtered = filterBySafetyLevel(rankedCities, 'moderate')
      expect(filtered.length).toBe(3)
    })

    it('should filter to challenging or better', () => {
      const filtered = filterBySafetyLevel(rankedCities, 'challenging')
      expect(filtered.length).toBe(4)
    })
  })

  describe('getTopCities', () => {
    const rankedCities: Array<RankedCity> = Array.from({ length: 20 }, (_, i) => ({
      cityId: `city${i}` as any,
      name: `City ${i}`,
      country: 'Test',
      latitude: i,
      longitude: 0,
      tier: 'major' as const,
      score: 100 - i, // Descending scores
      highlights: [],
      safetyLevel: 'good' as const,
      breakdown: { zenith: 80 - i, acg: 10, paran: 10 },
    }))

    it('should return top N cities', () => {
      const top5 = getTopCities(rankedCities, 5)
      expect(top5.length).toBe(5)
      expect(top5[0].score).toBe(100)
      expect(top5[4].score).toBe(96)
    })

    it('should default to 10 cities', () => {
      const top = getTopCities(rankedCities)
      expect(top.length).toBe(10)
    })

    it('should handle list shorter than N', () => {
      const short = rankedCities.slice(0, 3)
      const top = getTopCities(short, 10)
      expect(top.length).toBe(3)
    })
  })

  describe('groupByCountry', () => {
    const rankedCities: Array<RankedCity> = [
      {
        cityId: 'us1' as any,
        name: 'US City 1',
        country: 'USA',
        latitude: 0,
        longitude: 0,
        tier: 'major',
        score: 50,
        highlights: [],
        safetyLevel: 'good',
        breakdown: { zenith: 40, acg: 5, paran: 5 },
      },
      {
        cityId: 'us2' as any,
        name: 'US City 2',
        country: 'USA',
        latitude: 0,
        longitude: 0,
        tier: 'major',
        score: 50,
        highlights: [],
        safetyLevel: 'good',
        breakdown: { zenith: 40, acg: 5, paran: 5 },
      },
      {
        cityId: 'ca1' as any,
        name: 'Canadian City',
        country: 'Canada',
        latitude: 0,
        longitude: 0,
        tier: 'major',
        score: 50,
        highlights: [],
        safetyLevel: 'good',
        breakdown: { zenith: 40, acg: 5, paran: 5 },
      },
    ]

    it('should group cities by country', () => {
      const grouped = groupByCountry(rankedCities)

      expect(grouped.size).toBe(2)
      expect(grouped.get('USA')?.length).toBe(2)
      expect(grouped.get('Canada')?.length).toBe(1)
    })

    it('should handle empty list', () => {
      const grouped = groupByCountry([])
      expect(grouped.size).toBe(0)
    })
  })

  describe('getRankingSummary', () => {
    it('should calculate statistics', () => {
      const ranked = rankCities(mockCities, TEST_INPUT)
      const summary = getRankingSummary(ranked)

      expect(summary.totalCities).toBe(ranked.length)
      expect(summary.avgScore).toBeGreaterThan(0)
      expect(summary.maxScore).toBeGreaterThanOrEqual(summary.avgScore)
      expect(summary.minScore).toBeLessThanOrEqual(summary.avgScore)
      expect(summary.byTier).toBeDefined()
      expect(summary.bySafetyLevel).toBeDefined()
    })

    it('should count tiers correctly', () => {
      const ranked = rankCities(mockCities, TEST_INPUT)
      const summary = getRankingSummary(ranked)

      expect(summary.byTier['major']).toBe(2)
      expect(summary.byTier['medium']).toBe(1)
      expect(summary.byTier['minor']).toBe(1)
      expect(summary.byTier['small']).toBe(1)
    })

    it('should handle empty list', () => {
      const summary = getRankingSummary([])

      expect(summary.totalCities).toBe(0)
      expect(summary.avgScore).toBe(0)
      expect(summary.maxScore).toBe(0)
      expect(summary.minScore).toBe(0)
    })
  })
})
