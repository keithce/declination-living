# Phase 5: Recommendation System

**Duration**: Weeks 8-9
**Priority**: High
**Dependencies**: Phases 1-4 (All calculation engines)

## Objectives

1. Implement vibe category matching with NLP keywords
2. Build geospatial optimization for location scoring
3. Create safety filter for relocation chart warnings
4. Develop city ranking algorithm with explanations

## Background

The recommendation system combines all previous calculations to suggest optimal locations based on user-defined goals ("vibes"). The PDF specifies a sophisticated matching system that considers:

- Planetary weights aligned with life goals
- Zenith, ACG, and Paran proximity
- Essential dignity strength
- Safety filters for challenging placements

### Vibe Categories

The PDF defines these primary vibe categories:

| Vibe | Primary Planets | Focus |
|------|-----------------|-------|
| Wealth | Jupiter, Sun, Venus | Financial abundance |
| Love | Venus, Moon, Neptune | Relationships, romance |
| Career | Saturn, Sun, Mars | Professional success |
| Creativity | Venus, Neptune, Mercury | Artistic expression |
| Spirituality | Neptune, Moon, Jupiter | Inner development |
| Adventure | Mars, Jupiter, Uranus | Exploration, risk |
| Healing | Moon, Neptune, Chiron* | Health, recovery |
| Learning | Mercury, Jupiter, Uranus | Education, knowledge |

*Note: Chiron not included in current 10-planet system

## Tasks

### 5.1 Vibe Category Definitions

**File**: `convex/calculations/vibes/categories.ts`

```typescript
import type { PlanetId, PlanetWeights, VibeCategory } from '../core/types'

// Default weight for non-primary planets
const DEFAULT_WEIGHT = 0.5

/**
 * Create a weight map from primary planets
 */
function createWeights(
  primary: PlanetId[],
  primaryWeight: number = 2.0,
  secondaryWeight: number = 1.0
): PlanetWeights {
  const weights: PlanetWeights = {
    sun: DEFAULT_WEIGHT,
    moon: DEFAULT_WEIGHT,
    mercury: DEFAULT_WEIGHT,
    venus: DEFAULT_WEIGHT,
    mars: DEFAULT_WEIGHT,
    jupiter: DEFAULT_WEIGHT,
    saturn: DEFAULT_WEIGHT,
    uranus: DEFAULT_WEIGHT,
    neptune: DEFAULT_WEIGHT,
    pluto: DEFAULT_WEIGHT,
  }

  // Set primary planets
  for (let i = 0; i < primary.length; i++) {
    weights[primary[i]] = i === 0 ? primaryWeight : secondaryWeight
  }

  return weights
}

/**
 * Preset vibe categories based on PDF specifications
 */
export const PRESET_VIBES: VibeCategory[] = [
  {
    id: 'wealth',
    name: 'Wealth & Abundance',
    description: 'Financial prosperity and material success',
    keywords: ['money', 'wealth', 'rich', 'prosperity', 'abundance', 'finance', 'income'],
    primaryPlanets: ['jupiter', 'sun', 'venus'],
    weights: createWeights(['jupiter', 'sun', 'venus']),
  },
  {
    id: 'love',
    name: 'Love & Relationships',
    description: 'Romantic connections and emotional bonds',
    keywords: ['love', 'romance', 'relationship', 'marriage', 'partner', 'soulmate', 'heart'],
    primaryPlanets: ['venus', 'moon', 'neptune'],
    weights: createWeights(['venus', 'moon', 'neptune']),
  },
  {
    id: 'career',
    name: 'Career & Achievement',
    description: 'Professional success and recognition',
    keywords: ['career', 'job', 'success', 'work', 'profession', 'business', 'achievement'],
    primaryPlanets: ['saturn', 'sun', 'mars'],
    weights: createWeights(['saturn', 'sun', 'mars']),
  },
  {
    id: 'creativity',
    name: 'Creativity & Arts',
    description: 'Artistic expression and inspiration',
    keywords: ['creative', 'art', 'music', 'design', 'inspiration', 'artist', 'expression'],
    primaryPlanets: ['venus', 'neptune', 'mercury'],
    weights: createWeights(['venus', 'neptune', 'mercury']),
  },
  {
    id: 'spirituality',
    name: 'Spirituality & Growth',
    description: 'Inner development and transcendence',
    keywords: ['spiritual', 'meditation', 'enlightenment', 'soul', 'consciousness', 'divine'],
    primaryPlanets: ['neptune', 'moon', 'jupiter'],
    weights: createWeights(['neptune', 'moon', 'jupiter']),
  },
  {
    id: 'adventure',
    name: 'Adventure & Exploration',
    description: 'Travel, risk-taking, and new experiences',
    keywords: ['adventure', 'travel', 'explore', 'risk', 'freedom', 'excitement', 'journey'],
    primaryPlanets: ['mars', 'jupiter', 'uranus'],
    weights: createWeights(['mars', 'jupiter', 'uranus']),
  },
  {
    id: 'healing',
    name: 'Healing & Wellness',
    description: 'Health, recovery, and nurturing',
    keywords: ['health', 'healing', 'wellness', 'recovery', 'therapy', 'nurture', 'care'],
    primaryPlanets: ['moon', 'neptune', 'venus'],
    weights: createWeights(['moon', 'neptune', 'venus']),
  },
  {
    id: 'learning',
    name: 'Learning & Knowledge',
    description: 'Education, intellectual growth, and discovery',
    keywords: ['learn', 'study', 'education', 'knowledge', 'wisdom', 'university', 'research'],
    primaryPlanets: ['mercury', 'jupiter', 'uranus'],
    weights: createWeights(['mercury', 'jupiter', 'uranus']),
  },
]

/**
 * Find matching vibe from keywords
 */
export function matchVibeFromKeywords(input: string): VibeCategory | null {
  const normalized = input.toLowerCase()

  for (const vibe of PRESET_VIBES) {
    for (const keyword of vibe.keywords) {
      if (normalized.includes(keyword)) {
        return vibe
      }
    }
  }

  return null
}

/**
 * Get vibe by ID
 */
export function getVibeById(id: string): VibeCategory | undefined {
  return PRESET_VIBES.find(v => v.id === id)
}

/**
 * Blend multiple vibes into custom weights
 */
export function blendVibes(
  vibes: Array<{ vibe: VibeCategory; weight: number }>
): PlanetWeights {
  const blended: PlanetWeights = {
    sun: 0, moon: 0, mercury: 0, venus: 0, mars: 0,
    jupiter: 0, saturn: 0, uranus: 0, neptune: 0, pluto: 0,
  }

  let totalWeight = 0

  for (const { vibe, weight } of vibes) {
    totalWeight += weight
    for (const [planet, planetWeight] of Object.entries(vibe.weights)) {
      blended[planet as PlanetId] += planetWeight * weight
    }
  }

  // Normalize
  if (totalWeight > 0) {
    for (const planet of Object.keys(blended) as PlanetId[]) {
      blended[planet] /= totalWeight
    }
  }

  return blended
}
```

### 5.2 Geospatial Optimizer

**File**: `convex/calculations/geospatial/optimizer.ts`

```typescript
import type {
  PlanetId,
  PlanetWeights,
  ZenithLine,
  ACGLine,
  ParanPoint,
  GeoLocation,
} from '../core/types'

interface OptimizationInput {
  zenithLines: ZenithLine[]
  acgLines: ACGLine[]
  parans: ParanPoint[]
  weights: PlanetWeights
  latitudeRange?: [number, number]
}

interface OptimalBand {
  minLat: number
  maxLat: number
  score: number
  dominantPlanets: PlanetId[]
  reasons: string[]
}

interface OptimizationResult {
  bands: OptimalBand[]
  paranLatitudes: Array<{
    latitude: number
    score: number
    parans: ParanPoint[]
  }>
  optimalLatitudes: number[]
}

const ZENITH_ORB = 1.0
const PARAN_ORB = 1.0
const BAND_SIZE = 5 // degrees

/**
 * Score a latitude band based on all factors
 */
function scoreBand(
  minLat: number,
  maxLat: number,
  input: OptimizationInput
): { score: number; dominantPlanets: PlanetId[]; reasons: string[] } {
  const { zenithLines, parans, weights } = input
  const midLat = (minLat + maxLat) / 2

  let score = 0
  const planetScores: Record<PlanetId, number> = {} as Record<PlanetId, number>
  const reasons: string[] = []

  // Score zenith lines in this band
  for (const zl of zenithLines) {
    if (zl.orbMax >= minLat && zl.orbMin <= maxLat) {
      const overlap = Math.min(zl.orbMax, maxLat) - Math.max(zl.orbMin, minLat)
      const overlapScore = (overlap / BAND_SIZE) * weights[zl.planet]

      score += overlapScore
      planetScores[zl.planet] = (planetScores[zl.planet] || 0) + overlapScore
      reasons.push(`${zl.planet} zenith`)
    }
  }

  // Score parans near this band
  for (const paran of parans) {
    if (paran.latitude >= minLat - PARAN_ORB && paran.latitude <= maxLat + PARAN_ORB) {
      const avgWeight = (weights[paran.planet1] + weights[paran.planet2]) / 2
      const paranScore = (paran.strength ?? 1) * avgWeight

      score += paranScore
      planetScores[paran.planet1] = (planetScores[paran.planet1] || 0) + paranScore / 2
      planetScores[paran.planet2] = (planetScores[paran.planet2] || 0) + paranScore / 2
      reasons.push(`${paran.planet1}-${paran.planet2} paran`)
    }
  }

  // Find dominant planets
  const sortedPlanets = Object.entries(planetScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([planet]) => planet as PlanetId)

  return { score, dominantPlanets: sortedPlanets, reasons: [...new Set(reasons)] }
}

/**
 * Find optimal latitude bands
 */
export function findOptimalBands(input: OptimizationInput): OptimizationResult {
  const [minRange, maxRange] = input.latitudeRange || [-85, 85]
  const bands: OptimalBand[] = []
  const paranLatitudes: OptimizationResult['paranLatitudes'] = []

  // Scan latitude bands
  for (let lat = minRange; lat < maxRange; lat += BAND_SIZE) {
    const bandResult = scoreBand(lat, lat + BAND_SIZE, input)

    if (bandResult.score > 0) {
      bands.push({
        minLat: lat,
        maxLat: lat + BAND_SIZE,
        score: bandResult.score,
        dominantPlanets: bandResult.dominantPlanets,
        reasons: bandResult.reasons,
      })
    }
  }

  // Find paran clusters
  const paranClusters = new Map<number, ParanPoint[]>()

  for (const paran of input.parans) {
    const roundedLat = Math.round(paran.latitude)
    if (!paranClusters.has(roundedLat)) {
      paranClusters.set(roundedLat, [])
    }
    paranClusters.get(roundedLat)!.push(paran)
  }

  for (const [lat, parans] of paranClusters) {
    const totalScore = parans.reduce((sum, p) => {
      const avgWeight = (input.weights[p.planet1] + input.weights[p.planet2]) / 2
      return sum + (p.strength ?? 1) * avgWeight
    }, 0)

    paranLatitudes.push({ latitude: lat, score: totalScore, parans })
  }

  // Sort by score
  bands.sort((a, b) => b.score - a.score)
  paranLatitudes.sort((a, b) => b.score - a.score)

  // Get optimal latitudes (top 5 from each category)
  const optimalLatitudes = [
    ...bands.slice(0, 5).map(b => (b.minLat + b.maxLat) / 2),
    ...paranLatitudes.slice(0, 5).map(p => p.latitude),
  ]

  return { bands, paranLatitudes, optimalLatitudes: [...new Set(optimalLatitudes)] }
}

/**
 * Score a specific location
 */
export function scoreLocation(
  location: GeoLocation,
  input: OptimizationInput
): { score: number; breakdown: Record<string, number> } {
  const { zenithLines, acgLines, parans, weights } = input
  const { latitude, longitude } = location

  const breakdown: Record<string, number> = {
    zenith: 0,
    acg: 0,
    paran: 0,
  }

  // Zenith score
  for (const zl of zenithLines) {
    const distance = Math.abs(latitude - zl.declination)
    if (distance <= ZENITH_ORB) {
      const proximity = 1 - distance / ZENITH_ORB
      breakdown.zenith += proximity * weights[zl.planet]
    }
  }

  // ACG score (check if near any line)
  for (const line of acgLines) {
    for (const point of line.points) {
      const latDist = Math.abs(latitude - point.latitude)
      const lonDist = Math.abs(longitude - point.longitude)

      if (latDist <= 2 && lonDist <= 5) {
        const distance = Math.sqrt(latDist * latDist + lonDist * lonDist)
        const proximity = 1 - Math.min(distance / 5, 1)
        breakdown.acg += proximity * weights[line.planet]
      }
    }
  }

  // Paran score
  for (const paran of parans) {
    const distance = Math.abs(latitude - paran.latitude)
    if (distance <= PARAN_ORB) {
      const proximity = 1 - distance / PARAN_ORB
      const avgWeight = (weights[paran.planet1] + weights[paran.planet2]) / 2
      breakdown.paran += proximity * (paran.strength ?? 1) * avgWeight
    }
  }

  const score = breakdown.zenith + breakdown.acg + breakdown.paran

  return { score, breakdown }
}
```

### 5.3 Safety Filter

**File**: `convex/calculations/safety/filter.ts`

```typescript
import type { PlanetId, SafetyScore, DignityScore } from '../core/types'

interface SafetyInput {
  /** Planets in each house (1-12) */
  housePlacements?: Record<number, PlanetId[]>
  /** Dignity scores for all planets */
  dignities?: Record<PlanetId, DignityScore>
  /** Planets making hard aspects to angles */
  angleAspects?: Array<{
    planet: PlanetId
    aspect: 'conjunction' | 'square' | 'opposition'
    angle: 'ASC' | 'MC'
  }>
}

// Challenging houses
const CHALLENGING_HOUSES = [6, 8, 12]

// Malefic planets (traditional)
const MALEFICS: PlanetId[] = ['mars', 'saturn', 'pluto']

// Benefic planets (traditional)
const BENEFICS: PlanetId[] = ['venus', 'jupiter']

// Dignity threshold for "weak"
const WEAK_DIGNITY_THRESHOLD = -3

/**
 * Calculate safety score for a relocated chart
 */
export function calculateSafetyScore(input: SafetyInput): SafetyScore {
  const warnings: string[] = []
  const challengingPlacements: SafetyScore['challengingPlacements'] = []
  const difficultAspects: SafetyScore['difficultAspects'] = []
  const weakDignity: SafetyScore['weakDignity'] = []

  let penaltyPoints = 0

  // Check house placements
  if (input.housePlacements) {
    for (const house of CHALLENGING_HOUSES) {
      const planets = input.housePlacements[house] || []

      for (const planet of planets) {
        challengingPlacements.push({ planet, house })

        // Malefic in challenging house = bigger concern
        if (MALEFICS.includes(planet)) {
          penaltyPoints += 15
          warnings.push(`${planet} (malefic) in ${house}th house may indicate challenges`)
        } else if (BENEFICS.includes(planet)) {
          penaltyPoints += 5
          warnings.push(`${planet} in ${house}th house - benefits may require effort`)
        } else {
          penaltyPoints += 10
          warnings.push(`${planet} in ${house}th house - area may need attention`)
        }
      }
    }
  }

  // Check dignity
  if (input.dignities) {
    for (const [planet, dignity] of Object.entries(input.dignities)) {
      if (dignity.total <= WEAK_DIGNITY_THRESHOLD) {
        weakDignity.push({ planet: planet as PlanetId, score: dignity.total })
        penaltyPoints += Math.abs(dignity.total) * 2
        warnings.push(`${planet} is weakly dignified (${dignity.total}) - may function poorly`)
      }
    }
  }

  // Check angle aspects
  if (input.angleAspects) {
    for (const aspect of input.angleAspects) {
      difficultAspects.push(aspect)

      if (MALEFICS.includes(aspect.planet)) {
        if (aspect.aspect === 'conjunction') {
          penaltyPoints += 20
          warnings.push(`${aspect.planet} conjunct ${aspect.angle} - intense but challenging energy`)
        } else if (aspect.aspect === 'square') {
          penaltyPoints += 15
          warnings.push(`${aspect.planet} square ${aspect.angle} - friction with life direction`)
        } else {
          penaltyPoints += 10
          warnings.push(`${aspect.planet} opposite ${aspect.angle} - external challenges`)
        }
      }
    }
  }

  // Calculate overall score (100 = safest, 0 = most challenging)
  const overall = Math.max(0, 100 - penaltyPoints)

  return {
    overall,
    challengingPlacements,
    difficultAspects,
    weakDignity,
    warnings,
  }
}

/**
 * Check if a location passes minimum safety threshold
 */
export function meetsMinimumSafety(
  safetyScore: SafetyScore,
  threshold: number = 60
): boolean {
  return safetyScore.overall >= threshold
}

/**
 * Get safety level descriptor
 */
export function getSafetyLevel(overall: number): string {
  if (overall >= 80) return 'excellent'
  if (overall >= 60) return 'good'
  if (overall >= 40) return 'moderate'
  if (overall >= 20) return 'challenging'
  return 'difficult'
}
```

### 5.4 City Ranking System

**File**: `convex/calculations/geospatial/ranking.ts`

```typescript
import type { Id } from '../../_generated/dataModel'
import type { PlanetId, PlanetWeights, ZenithLine, ACGLine, ParanPoint } from '../core/types'
import { scoreLocation } from './optimizer'
import { calculateSafetyScore, getSafetyLevel, type SafetyScore } from '../safety/filter'

interface CityData {
  _id: Id<'cities'>
  name: string
  country: string
  latitude: number
  longitude: number
  population: number
  timezone: string
  tier: 'major' | 'medium' | 'minor' | 'small'
}

interface RankedCity {
  city: CityData
  score: number
  breakdown: {
    zenith: number
    acg: number
    paran: number
  }
  safetyScore?: SafetyScore
  highlights: string[]
}

interface RankingInput {
  cities: CityData[]
  zenithLines: ZenithLine[]
  acgLines: ACGLine[]
  parans: ParanPoint[]
  weights: PlanetWeights
  dignities?: Record<PlanetId, { total: number }>
  limit?: number
  safetyThreshold?: number
}

/**
 * Rank cities by composite score
 */
export function rankCities(input: RankingInput): RankedCity[] {
  const {
    cities,
    zenithLines,
    acgLines,
    parans,
    weights,
    dignities,
    limit = 50,
    safetyThreshold = 40,
  } = input

  const rankedCities: RankedCity[] = []

  for (const city of cities) {
    // Calculate location score
    const locationResult = scoreLocation(
      { latitude: city.latitude, longitude: city.longitude },
      { zenithLines, acgLines, parans, weights }
    )

    // Calculate safety score (simplified without house data)
    const safetyInput = dignities ? {
      dignities: Object.fromEntries(
        Object.entries(dignities).map(([planet, d]) => [
          planet,
          { total: d.total } as any
        ])
      )
    } : {}

    const safety = calculateSafetyScore(safetyInput)

    // Generate highlights
    const highlights = generateHighlights(
      city,
      zenithLines,
      acgLines,
      parans,
      weights
    )

    // Apply safety filter
    if (safety.overall >= safetyThreshold || !dignities) {
      rankedCities.push({
        city,
        score: locationResult.score,
        breakdown: locationResult.breakdown,
        safetyScore: dignities ? safety : undefined,
        highlights,
      })
    }
  }

  // Sort by score (descending)
  rankedCities.sort((a, b) => b.score - a.score)

  // Apply limit
  return rankedCities.slice(0, limit)
}

/**
 * Generate human-readable highlights for a city
 */
function generateHighlights(
  city: CityData,
  zenithLines: ZenithLine[],
  acgLines: ACGLine[],
  parans: ParanPoint[],
  weights: PlanetWeights
): string[] {
  const highlights: string[] = []
  const { latitude, longitude } = city

  // Check zenith lines
  for (const zl of zenithLines) {
    if (Math.abs(latitude - zl.declination) <= 1.0) {
      if (weights[zl.planet] >= 1.5) {
        highlights.push(`${zl.planet.charAt(0).toUpperCase() + zl.planet.slice(1)} overhead (zenith)`)
      }
    }
  }

  // Check ACG lines (simplified - would need actual crossing check)
  const nearbyLines = acgLines.filter(line =>
    line.points.some(p =>
      Math.abs(latitude - p.latitude) <= 3 &&
      Math.abs(longitude - p.longitude) <= 10
    )
  )

  for (const line of nearbyLines.slice(0, 2)) {
    const lineTypeNames = {
      ASC: 'Rising',
      DSC: 'Setting',
      MC: 'Culminating',
      IC: 'Nadir'
    }
    highlights.push(`${line.planet} ${lineTypeNames[line.lineType]} line nearby`)
  }

  // Check parans
  const nearbyParans = parans.filter(p => Math.abs(latitude - p.latitude) <= 1.0)

  for (const paran of nearbyParans.slice(0, 2)) {
    if ((paran.strength ?? 0) >= 0.8) {
      highlights.push(`${paran.planet1}-${paran.planet2} paran (${paran.event1}/${paran.event2})`)
    }
  }

  return highlights.slice(0, 4) // Max 4 highlights
}

/**
 * Get cities within optimal latitude bands
 */
export function getCitiesInBands(
  cities: CityData[],
  bands: Array<{ minLat: number; maxLat: number; score: number }>
): Map<string, CityData[]> {
  const result = new Map<string, CityData[]>()

  for (const band of bands) {
    const key = `${band.minLat}-${band.maxLat}`
    const citiesInBand = cities.filter(
      c => c.latitude >= band.minLat && c.latitude < band.maxLat
    )
    result.set(key, citiesInBand)
  }

  return result
}

/**
 * Filter cities by tier
 */
export function filterByTier(
  cities: CityData[],
  minTier: 'major' | 'medium' | 'minor' | 'small'
): CityData[] {
  const tierOrder = ['major', 'medium', 'minor', 'small']
  const minIndex = tierOrder.indexOf(minTier)

  return cities.filter(c => tierOrder.indexOf(c.tier) <= minIndex)
}
```

### 5.5 Integration Action

**File**: `convex/calculations/vibes/index.ts`

```typescript
import { v } from 'convex/values'
import { internalAction, internalQuery } from '../../_generated/server'
import { PRESET_VIBES, matchVibeFromKeywords, blendVibes, getVibeById } from './categories'
import { findOptimalBands } from '../geospatial/optimizer'
import { rankCities } from '../geospatial/ranking'

export const getPresetVibes = internalQuery({
  args: {},
  handler: async (ctx) => {
    return PRESET_VIBES
  },
})

export const matchVibe = internalAction({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const matched = matchVibeFromKeywords(args.query)
    return matched
  },
})

export const calculateRecommendations = internalAction({
  args: {
    vibeId: v.optional(v.string()),
    customWeights: v.optional(v.object({
      sun: v.number(),
      moon: v.number(),
      mercury: v.number(),
      venus: v.number(),
      mars: v.number(),
      jupiter: v.number(),
      saturn: v.number(),
      uranus: v.number(),
      neptune: v.number(),
      pluto: v.number(),
    })),
    zenithLines: v.array(v.object({
      planet: v.string(),
      declination: v.number(),
      orbMin: v.number(),
      orbMax: v.number(),
    })),
    acgLines: v.array(v.object({
      planet: v.string(),
      lineType: v.string(),
      points: v.array(v.object({
        latitude: v.number(),
        longitude: v.number(),
      })),
    })),
    parans: v.array(v.object({
      planet1: v.string(),
      event1: v.string(),
      planet2: v.string(),
      event2: v.string(),
      latitude: v.number(),
      strength: v.optional(v.number()),
    })),
    latitudeRange: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    // Get weights from vibe or custom
    let weights = args.customWeights

    if (!weights && args.vibeId) {
      const vibe = getVibeById(args.vibeId)
      if (vibe) {
        weights = vibe.weights
      }
    }

    if (!weights) {
      // Default equal weights
      weights = {
        sun: 1, moon: 1, mercury: 1, venus: 1, mars: 1,
        jupiter: 1, saturn: 1, uranus: 1, neptune: 1, pluto: 1,
      }
    }

    // Find optimal bands
    const latRange = args.latitudeRange
      ? [args.latitudeRange[0], args.latitudeRange[1]] as [number, number]
      : undefined

    const optimization = findOptimalBands({
      zenithLines: args.zenithLines as any,
      acgLines: args.acgLines as any,
      parans: args.parans as any,
      weights,
      latitudeRange: latRange,
    })

    return {
      optimalBands: optimization.bands.slice(0, 10),
      paranLatitudes: optimization.paranLatitudes.slice(0, 10),
      optimalLatitudes: optimization.optimalLatitudes,
      weightsUsed: weights,
    }
  },
})
```

## Testing

### Unit Tests

**File**: `convex/calculations/vibes/__tests__/categories.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { matchVibeFromKeywords, blendVibes, PRESET_VIBES } from '../categories'

describe('Vibe Categories', () => {
  it('has all preset vibes defined', () => {
    expect(PRESET_VIBES.length).toBeGreaterThanOrEqual(8)
  })

  it('matches wealth keywords', () => {
    const vibe = matchVibeFromKeywords('I want to get rich')
    expect(vibe?.id).toBe('wealth')
  })

  it('matches love keywords', () => {
    const vibe = matchVibeFromKeywords('Looking for romance')
    expect(vibe?.id).toBe('love')
  })

  it('returns null for no match', () => {
    const vibe = matchVibeFromKeywords('Random words here')
    expect(vibe).toBeNull()
  })

  it('blends vibes correctly', () => {
    const wealth = PRESET_VIBES.find(v => v.id === 'wealth')!
    const love = PRESET_VIBES.find(v => v.id === 'love')!

    const blended = blendVibes([
      { vibe: wealth, weight: 0.5 },
      { vibe: love, weight: 0.5 },
    ])

    // Both Jupiter (wealth) and Venus (love) should have high weights
    expect(blended.jupiter).toBeGreaterThan(0.5)
    expect(blended.venus).toBeGreaterThan(0.5)
  })
})
```

**File**: `convex/calculations/safety/__tests__/filter.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { calculateSafetyScore, meetsMinimumSafety, getSafetyLevel } from '../filter'

describe('Safety Filter', () => {
  it('returns high score for safe chart', () => {
    const score = calculateSafetyScore({})
    expect(score.overall).toBe(100)
    expect(score.warnings.length).toBe(0)
  })

  it('penalizes malefic in 8th house', () => {
    const score = calculateSafetyScore({
      housePlacements: {
        8: ['mars', 'saturn'],
      },
    })

    expect(score.overall).toBeLessThan(100)
    expect(score.challengingPlacements.length).toBe(2)
    expect(score.warnings.length).toBe(2)
  })

  it('penalizes weak dignity', () => {
    const score = calculateSafetyScore({
      dignities: {
        sun: { total: -5 } as any,
        moon: { total: 3 } as any,
      } as any,
    })

    expect(score.weakDignity.length).toBe(1)
    expect(score.weakDignity[0].planet).toBe('sun')
  })

  it('correctly identifies safety levels', () => {
    expect(getSafetyLevel(85)).toBe('excellent')
    expect(getSafetyLevel(65)).toBe('good')
    expect(getSafetyLevel(45)).toBe('moderate')
    expect(getSafetyLevel(25)).toBe('challenging')
    expect(getSafetyLevel(10)).toBe('difficult')
  })
})
```

## Completion Criteria

- [ ] All preset vibes defined with correct weights
- [ ] Keyword matching finds appropriate vibes
- [ ] Vibe blending produces balanced weights
- [ ] Optimal bands calculated correctly
- [ ] City ranking produces sensible results
- [ ] Safety filter identifies challenging placements
- [ ] Highlights are generated for each city
- [ ] All unit tests pass

## Next Phase

Upon completion, proceed to [Phase 6: UI Enhancement](./phase-6-ui.md) for building the frontend results display and interactive globe layers.
