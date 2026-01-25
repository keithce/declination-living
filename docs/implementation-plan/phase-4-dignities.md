# Phase 4: Dignity Engine

**Duration**: Week 7
**Priority**: High
**Dependencies**: Phase 1 (Ephemeris)

## Objectives

1. Implement essential dignity scoring for all planets
2. Build complete dignity tables (Domicile, Exaltation, Triplicity, Terms, Face)
3. Calculate sect (day/night) determination
4. Create composite dignity scores with indicators

## Background

Essential dignities are a classical astrological scoring system that evaluates planet strength based on zodiac position. The PDF specifies a comprehensive scoring system:

| Dignity | Points | Description |
|---------|--------|-------------|
| Domicile | +5 | Planet in sign it rules |
| Exaltation | +4 | Planet in sign of exaltation |
| Triplicity | +3 | Planet ruling element (by sect) |
| Terms/Bounds | +2 | Planet in its terms |
| Face/Decan | +1 | Planet in its face |
| Detriment | -5 | Planet opposite its domicile |
| Fall | -4 | Planet opposite its exaltation |
| Peregrine | -5 | No positive dignity |

### Indicators

The PDF specifies single-character indicators:
- **R** = Ruler (Domicile)
- **E** = Exalted
- **d** = Detriment
- **f** = Fall
- **-** = Peregrine or neutral

## Tasks

### 4.1 Zodiac Position Calculator

**File**: `convex/calculations/dignity/position.ts`

```typescript
import type { ZodiacSign, SignPosition } from '../core/types'

export const ZODIAC_SIGNS: ZodiacSign[] = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces'
]

/**
 * Convert ecliptic longitude to sign position
 */
export function longitudeToSign(longitude: number): SignPosition {
  // Normalize to 0-360
  let lon = longitude % 360
  if (lon < 0) lon += 360

  // Calculate sign index (0-11)
  const signIndex = Math.floor(lon / 30)
  const sign = ZODIAC_SIGNS[signIndex]

  // Degree within sign (0-30)
  const totalDegree = lon - (signIndex * 30)
  const degree = Math.floor(totalDegree)
  const minute = Math.floor((totalDegree - degree) * 60)

  return {
    sign,
    signIndex,
    degree,
    minute,
  }
}

/**
 * Get the sign index for a given sign name
 */
export function getSignIndex(sign: ZodiacSign): number {
  return ZODIAC_SIGNS.indexOf(sign)
}

/**
 * Get the opposite sign
 */
export function getOppositeSign(sign: ZodiacSign): ZodiacSign {
  const index = getSignIndex(sign)
  const oppositeIndex = (index + 6) % 12
  return ZODIAC_SIGNS[oppositeIndex]
}
```

### 4.2 Dignity Tables

**File**: `convex/calculations/dignity/tables.ts`

```typescript
import type { PlanetId, ZodiacSign } from '../core/types'

/**
 * Domicile rulerships (traditional + modern)
 * Each sign has a ruler (some have day/night rulers)
 */
export const DOMICILE: Record<ZodiacSign, PlanetId[]> = {
  aries: ['mars'],
  taurus: ['venus'],
  gemini: ['mercury'],
  cancer: ['moon'],
  leo: ['sun'],
  virgo: ['mercury'],
  libra: ['venus'],
  scorpio: ['mars', 'pluto'], // Traditional + modern
  sagittarius: ['jupiter'],
  capricorn: ['saturn'],
  aquarius: ['saturn', 'uranus'], // Traditional + modern
  pisces: ['jupiter', 'neptune'], // Traditional + modern
}

/**
 * Exaltation positions
 */
export const EXALTATION: Partial<Record<PlanetId, ZodiacSign>> = {
  sun: 'aries',
  moon: 'taurus',
  mercury: 'virgo',
  venus: 'pisces',
  mars: 'capricorn',
  jupiter: 'cancer',
  saturn: 'libra',
  // Outer planets don't have traditional exaltations
}

/**
 * Triplicity rulers by element and sect
 * Day = Sun above horizon, Night = Sun below horizon
 */
export const TRIPLICITY: Record<string, { day: PlanetId; night: PlanetId; participating: PlanetId }> = {
  fire: { day: 'sun', night: 'jupiter', participating: 'saturn' },
  earth: { day: 'venus', night: 'moon', participating: 'mars' },
  air: { day: 'saturn', night: 'mercury', participating: 'jupiter' },
  water: { day: 'venus', night: 'mars', participating: 'moon' },
}

/**
 * Sign to element mapping
 */
export const SIGN_ELEMENT: Record<ZodiacSign, string> = {
  aries: 'fire',
  taurus: 'earth',
  gemini: 'air',
  cancer: 'water',
  leo: 'fire',
  virgo: 'earth',
  libra: 'air',
  scorpio: 'water',
  sagittarius: 'fire',
  capricorn: 'earth',
  aquarius: 'air',
  pisces: 'water',
}

/**
 * Egyptian/Ptolemaic Terms (bounds within signs)
 * Each entry is [planet, endDegree] where the term starts after previous end
 */
export const TERMS_EGYPTIAN: Record<ZodiacSign, Array<[PlanetId, number]>> = {
  aries: [['jupiter', 6], ['venus', 12], ['mercury', 20], ['mars', 25], ['saturn', 30]],
  taurus: [['venus', 8], ['mercury', 14], ['jupiter', 22], ['saturn', 27], ['mars', 30]],
  gemini: [['mercury', 6], ['jupiter', 12], ['venus', 17], ['mars', 24], ['saturn', 30]],
  cancer: [['mars', 7], ['venus', 13], ['mercury', 19], ['jupiter', 26], ['saturn', 30]],
  leo: [['jupiter', 6], ['venus', 11], ['saturn', 18], ['mercury', 24], ['mars', 30]],
  virgo: [['mercury', 7], ['venus', 17], ['jupiter', 21], ['mars', 28], ['saturn', 30]],
  libra: [['saturn', 6], ['mercury', 14], ['jupiter', 21], ['venus', 28], ['mars', 30]],
  scorpio: [['mars', 7], ['venus', 11], ['mercury', 19], ['jupiter', 24], ['saturn', 30]],
  sagittarius: [['jupiter', 12], ['venus', 17], ['mercury', 21], ['saturn', 26], ['mars', 30]],
  capricorn: [['mercury', 7], ['jupiter', 14], ['venus', 22], ['saturn', 26], ['mars', 30]],
  aquarius: [['mercury', 7], ['venus', 13], ['jupiter', 20], ['mars', 25], ['saturn', 30]],
  pisces: [['venus', 12], ['jupiter', 16], ['mercury', 19], ['mars', 28], ['saturn', 30]],
}

/**
 * Faces (Decans) - each sign divided into three 10° sections
 * Chaldean order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon (repeat)
 */
export const FACES: Record<ZodiacSign, [PlanetId, PlanetId, PlanetId]> = {
  aries: ['mars', 'sun', 'venus'],
  taurus: ['mercury', 'moon', 'saturn'],
  gemini: ['jupiter', 'mars', 'sun'],
  cancer: ['venus', 'mercury', 'moon'],
  leo: ['saturn', 'jupiter', 'mars'],
  virgo: ['sun', 'venus', 'mercury'],
  libra: ['moon', 'saturn', 'jupiter'],
  scorpio: ['mars', 'sun', 'venus'],
  sagittarius: ['mercury', 'moon', 'saturn'],
  capricorn: ['jupiter', 'mars', 'sun'],
  aquarius: ['venus', 'mercury', 'moon'],
  pisces: ['saturn', 'jupiter', 'mars'],
}

/**
 * Get the term ruler for a position
 */
export function getTermRuler(sign: ZodiacSign, degree: number): PlanetId {
  const terms = TERMS_EGYPTIAN[sign]

  for (const [planet, endDegree] of terms) {
    if (degree < endDegree) {
      return planet
    }
  }

  // Should never reach here if degree < 30
  return terms[terms.length - 1][0]
}

/**
 * Get the face ruler for a position
 */
export function getFaceRuler(sign: ZodiacSign, degree: number): PlanetId {
  const faceIndex = Math.floor(degree / 10)
  return FACES[sign][faceIndex]
}

/**
 * Get triplicity ruler based on element and sect
 */
export function getTriplicityRuler(
  sign: ZodiacSign,
  sect: 'day' | 'night'
): PlanetId {
  const element = SIGN_ELEMENT[sign]
  return TRIPLICITY[element][sect]
}
```

### 4.3 Dignity Engine

**File**: `convex/calculations/dignity/engine.ts`

```typescript
import type { PlanetId, DignityScore, ZodiacSign, SignPosition } from '../core/types'
import { longitudeToSign, getOppositeSign } from './position'
import {
  DOMICILE,
  EXALTATION,
  getTermRuler,
  getFaceRuler,
  getTriplicityRuler,
} from './tables'

// Point values
const DOMICILE_POINTS = 5
const EXALTATION_POINTS = 4
const TRIPLICITY_POINTS = 3
const TERMS_POINTS = 2
const FACE_POINTS = 1
const DETRIMENT_POINTS = -5
const FALL_POINTS = -4
const PEREGRINE_POINTS = -5

interface DignityInput {
  planetId: PlanetId
  longitude: number
  sect: 'day' | 'night'
}

/**
 * Check if planet is in domicile (rules the sign)
 */
function checkDomicile(planetId: PlanetId, sign: ZodiacSign): boolean {
  return DOMICILE[sign].includes(planetId)
}

/**
 * Check if planet is exalted in sign
 */
function checkExaltation(planetId: PlanetId, sign: ZodiacSign): boolean {
  return EXALTATION[planetId] === sign
}

/**
 * Check if planet is in detriment (opposite domicile)
 */
function checkDetriment(planetId: PlanetId, sign: ZodiacSign): boolean {
  const oppositeSign = getOppositeSign(sign)
  return DOMICILE[oppositeSign].includes(planetId)
}

/**
 * Check if planet is in fall (opposite exaltation)
 */
function checkFall(planetId: PlanetId, sign: ZodiacSign): boolean {
  const exaltSign = EXALTATION[planetId]
  if (!exaltSign) return false
  return sign === getOppositeSign(exaltSign)
}

/**
 * Calculate complete dignity score for a planet
 */
export function calculateDignity(input: DignityInput): DignityScore {
  const { planetId, longitude, sect } = input
  const position = longitudeToSign(longitude)
  const { sign, degree } = position

  const breakdown: string[] = []
  let domicile = 0
  let exaltation = 0
  let triplicity = 0
  let terms = 0
  let face = 0
  let detriment = 0
  let fall = 0
  let peregrine = 0

  // Check positive dignities
  if (checkDomicile(planetId, sign)) {
    domicile = DOMICILE_POINTS
    breakdown.push(`Domicile (+${DOMICILE_POINTS})`)
  }

  if (checkExaltation(planetId, sign)) {
    exaltation = EXALTATION_POINTS
    breakdown.push(`Exaltation (+${EXALTATION_POINTS})`)
  }

  const triplicityRuler = getTriplicityRuler(sign, sect)
  if (triplicityRuler === planetId) {
    triplicity = TRIPLICITY_POINTS
    breakdown.push(`Triplicity ${sect} (+${TRIPLICITY_POINTS})`)
  }

  const termRuler = getTermRuler(sign, degree)
  if (termRuler === planetId) {
    terms = TERMS_POINTS
    breakdown.push(`Terms (+${TERMS_POINTS})`)
  }

  const faceRuler = getFaceRuler(sign, degree)
  if (faceRuler === planetId) {
    face = FACE_POINTS
    breakdown.push(`Face (+${FACE_POINTS})`)
  }

  // Check debilities
  if (checkDetriment(planetId, sign)) {
    detriment = DETRIMENT_POINTS
    breakdown.push(`Detriment (${DETRIMENT_POINTS})`)
  }

  if (checkFall(planetId, sign)) {
    fall = FALL_POINTS
    breakdown.push(`Fall (${FALL_POINTS})`)
  }

  // Check peregrine (no positive dignity)
  const positiveTotal = domicile + exaltation + triplicity + terms + face
  if (positiveTotal === 0) {
    peregrine = PEREGRINE_POINTS
    breakdown.push(`Peregrine (${PEREGRINE_POINTS})`)
  }

  const total = domicile + exaltation + triplicity + terms + face +
                detriment + fall + peregrine

  return {
    planet: planetId,
    domicile,
    exaltation,
    triplicity,
    terms,
    face,
    detriment,
    fall,
    peregrine,
    total,
    breakdown,
  }
}

/**
 * Get single-character indicator for dignity state
 */
export function getDignityIndicator(score: DignityScore): string {
  if (score.domicile > 0) return 'R' // Ruler
  if (score.exaltation > 0) return 'E' // Exalted
  if (score.detriment < 0) return 'd' // Detriment
  if (score.fall < 0) return 'f' // Fall
  return '-' // Neutral/Peregrine
}

/**
 * Calculate dignities for all planets
 */
export function calculateAllDignities(
  longitudes: Record<PlanetId, number>,
  sect: 'day' | 'night'
): Record<PlanetId, DignityScore> {
  const dignities: Partial<Record<PlanetId, DignityScore>> = {}

  for (const [planetId, longitude] of Object.entries(longitudes)) {
    dignities[planetId as PlanetId] = calculateDignity({
      planetId: planetId as PlanetId,
      longitude,
      sect,
    })
  }

  return dignities as Record<PlanetId, DignityScore>
}

/**
 * Get simplified dignity for storage/display
 */
export function getSimplifiedDignity(score: DignityScore): {
  total: number
  indicator: string
} {
  return {
    total: score.total,
    indicator: getDignityIndicator(score),
  }
}
```

### 4.4 Sect Calculator

**File**: `convex/calculations/dignity/sect.ts`

```typescript
import type { PlanetId } from '../core/types'

/**
 * Determine sect (day/night) based on Sun's position relative to horizon
 *
 * Day chart: Sun above horizon (in houses 7-12 or 1)
 * Night chart: Sun below horizon (in houses 2-6)
 *
 * Simplified: Use Sun altitude or compare Sun longitude to Ascendant
 */

/**
 * Calculate sect from Sun altitude
 */
export function sectFromSunAltitude(sunAltitude: number): 'day' | 'night' {
  return sunAltitude >= 0 ? 'day' : 'night'
}

/**
 * Calculate sect from Sun longitude and Ascendant
 * Day = Sun in upper hemisphere (ASC to DSC going up)
 */
export function sectFromPositions(
  sunLongitude: number,
  ascendant: number
): 'day' | 'night' {
  // Normalize
  let sun = sunLongitude % 360
  let asc = ascendant % 360
  if (sun < 0) sun += 360
  if (asc < 0) asc += 360

  // Descendant is ASC + 180
  const desc = (asc + 180) % 360

  // Check if Sun is in upper hemisphere
  // Upper hemisphere: from ASC going through MC to DSC (clockwise)
  if (asc < desc) {
    // Normal case
    return (sun >= asc && sun < desc) ? 'day' : 'night'
  } else {
    // Wraps around 360
    return (sun >= asc || sun < desc) ? 'day' : 'night'
  }
}

/**
 * Sect-based planet classification
 * Day planets: Sun, Jupiter, Saturn
 * Night planets: Moon, Venus, Mars
 * Mercury: Depends on position relative to Sun
 */
export const SECT_PLANETS: Record<'day' | 'night', PlanetId[]> = {
  day: ['sun', 'jupiter', 'saturn'],
  night: ['moon', 'venus', 'mars'],
}

/**
 * Check if a planet is in sect (matches chart sect)
 */
export function isPlanetInSect(
  planetId: PlanetId,
  chartSect: 'day' | 'night'
): boolean | null {
  // Mercury is neutral
  if (planetId === 'mercury') return null

  // Outer planets don't have traditional sect
  if (['uranus', 'neptune', 'pluto'].includes(planetId)) return null

  return SECT_PLANETS[chartSect].includes(planetId)
}

/**
 * Get sect bonus/malus for dignity calculation
 * In-sect planets are strengthened, out-of-sect weakened
 */
export function getSectModifier(
  planetId: PlanetId,
  chartSect: 'day' | 'night'
): number {
  const inSect = isPlanetInSect(planetId, chartSect)

  if (inSect === null) return 0 // Neutral
  return inSect ? 1 : -1 // Small modifier
}
```

### 4.5 Integration Action

**File**: `convex/calculations/dignity/index.ts`

```typescript
import { v } from 'convex/values'
import { internalAction } from '../../_generated/server'
import { calculateAllDignities, getSimplifiedDignity } from './engine'
import { sectFromPositions } from './sect'
import type { PlanetId, DignityScore } from '../core/types'

const planetIdValidator = v.union(
  v.literal('sun'),
  v.literal('moon'),
  v.literal('mercury'),
  v.literal('venus'),
  v.literal('mars'),
  v.literal('jupiter'),
  v.literal('saturn'),
  v.literal('uranus'),
  v.literal('neptune'),
  v.literal('pluto')
)

export const calculateDignities = internalAction({
  args: {
    longitudes: v.object({
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
    }),
    ascendant: v.optional(v.number()),
    sunAltitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Determine sect
    let sect: 'day' | 'night' = 'day'

    if (args.sunAltitude !== undefined) {
      sect = args.sunAltitude >= 0 ? 'day' : 'night'
    } else if (args.ascendant !== undefined) {
      sect = sectFromPositions(args.longitudes.sun, args.ascendant)
    }

    // Calculate all dignities
    const fullDignities = calculateAllDignities(args.longitudes, sect)

    // Create simplified version for storage
    const simplifiedDignities: Record<PlanetId, { total: number; indicator: string }> = {} as any

    for (const [planetId, score] of Object.entries(fullDignities)) {
      simplifiedDignities[planetId as PlanetId] = getSimplifiedDignity(score)
    }

    return {
      dignities: fullDignities,
      simplified: simplifiedDignities,
      sect,
    }
  },
})
```

## Testing

### Unit Tests

**File**: `convex/calculations/dignity/__tests__/position.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { longitudeToSign, getOppositeSign } from '../position'

describe('Position Calculations', () => {
  it('converts 0° to Aries 0°', () => {
    const pos = longitudeToSign(0)
    expect(pos.sign).toBe('aries')
    expect(pos.degree).toBe(0)
  })

  it('converts 45° to Taurus 15°', () => {
    const pos = longitudeToSign(45)
    expect(pos.sign).toBe('taurus')
    expect(pos.degree).toBe(15)
  })

  it('converts 359° to Pisces 29°', () => {
    const pos = longitudeToSign(359)
    expect(pos.sign).toBe('pisces')
    expect(pos.degree).toBe(29)
  })

  it('finds correct opposite signs', () => {
    expect(getOppositeSign('aries')).toBe('libra')
    expect(getOppositeSign('taurus')).toBe('scorpio')
    expect(getOppositeSign('leo')).toBe('aquarius')
  })
})
```

**File**: `convex/calculations/dignity/__tests__/engine.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { calculateDignity, getDignityIndicator } from '../engine'

describe('Dignity Engine', () => {
  it('scores Sun in Leo as domicile', () => {
    const dignity = calculateDignity({
      planetId: 'sun',
      longitude: 120, // Leo 0°
      sect: 'day',
    })

    expect(dignity.domicile).toBe(5)
    expect(getDignityIndicator(dignity)).toBe('R')
  })

  it('scores Sun in Aries as exalted', () => {
    const dignity = calculateDignity({
      planetId: 'sun',
      longitude: 15, // Aries 15°
      sect: 'day',
    })

    expect(dignity.exaltation).toBe(4)
    expect(getDignityIndicator(dignity)).toBe('E')
  })

  it('scores Sun in Aquarius as detriment', () => {
    const dignity = calculateDignity({
      planetId: 'sun',
      longitude: 315, // Aquarius 15°
      sect: 'day',
    })

    expect(dignity.detriment).toBe(-5)
    expect(getDignityIndicator(dignity)).toBe('d')
  })

  it('scores Sun in Libra as fall', () => {
    const dignity = calculateDignity({
      planetId: 'sun',
      longitude: 195, // Libra 15°
      sect: 'day',
    })

    expect(dignity.fall).toBe(-4)
    expect(getDignityIndicator(dignity)).toBe('f')
  })

  it('assigns peregrine when no dignity', () => {
    const dignity = calculateDignity({
      planetId: 'sun',
      longitude: 60, // Gemini - no dignity for Sun
      sect: 'day',
    })

    expect(dignity.peregrine).toBe(-5)
    expect(getDignityIndicator(dignity)).toBe('-')
  })

  it('calculates terms correctly', () => {
    // Jupiter has first term of Aries (0-6°)
    const dignity = calculateDignity({
      planetId: 'jupiter',
      longitude: 3, // Aries 3°
      sect: 'day',
    })

    expect(dignity.terms).toBe(2)
  })

  it('calculates faces correctly', () => {
    // Mars rules first face of Aries (0-10°)
    const dignity = calculateDignity({
      planetId: 'mars',
      longitude: 5, // Aries 5°
      sect: 'day',
    })

    expect(dignity.face).toBe(1)
  })
})
```

**File**: `convex/calculations/dignity/__tests__/sect.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { sectFromPositions, sectFromSunAltitude, isPlanetInSect } from '../sect'

describe('Sect Calculations', () => {
  it('determines day chart from positive altitude', () => {
    expect(sectFromSunAltitude(10)).toBe('day')
    expect(sectFromSunAltitude(0)).toBe('day')
    expect(sectFromSunAltitude(-1)).toBe('night')
  })

  it('classifies planets by sect', () => {
    expect(isPlanetInSect('sun', 'day')).toBe(true)
    expect(isPlanetInSect('moon', 'night')).toBe(true)
    expect(isPlanetInSect('jupiter', 'night')).toBe(false)
    expect(isPlanetInSect('mercury', 'day')).toBe(null)
  })
})
```

## Completion Criteria

- [ ] All dignity types calculated correctly
- [ ] Term and Face assignments match reference tables
- [ ] Sect determination works for both methods
- [ ] Indicators display correctly (R, E, d, f, -)
- [ ] Composite scores sum correctly
- [ ] Breakdown strings are informative
- [ ] All unit tests pass
- [ ] Known chart dignities match reference

## Reference Tables

### Domicile Rulers (Quick Reference)

| Sign | Ruler(s) |
|------|----------|
| Aries | Mars |
| Taurus | Venus |
| Gemini | Mercury |
| Cancer | Moon |
| Leo | Sun |
| Virgo | Mercury |
| Libra | Venus |
| Scorpio | Mars (Pluto) |
| Sagittarius | Jupiter |
| Capricorn | Saturn |
| Aquarius | Saturn (Uranus) |
| Pisces | Jupiter (Neptune) |

### Exaltation Signs

| Planet | Exaltation |
|--------|------------|
| Sun | Aries |
| Moon | Taurus |
| Mercury | Virgo |
| Venus | Pisces |
| Mars | Capricorn |
| Jupiter | Cancer |
| Saturn | Libra |

## Next Phase

Upon completion, proceed to [Phase 5: Recommendation System](./phase-5-recommendations.md) for vibe matching and geospatial optimization.
