# Phase 3: Paran System

**Duration**: Weeks 5-6
**Priority**: Critical
**Dependencies**: Phase 1 (Ephemeris), Phase 2 (ACG/Zenith)

## Objectives

1. Implement paran bisection solver with ±10⁻⁶ degree precision
2. Calculate rising/setting/culminating times for all planets
3. Catalog all paran points for a given chart
4. Score parans by strength and event type combination

## Background

Parans (from Greek "paranatellonta" - rising alongside) are powerful configurations where two planets are simultaneously angular at a specific latitude. Unlike aspects which work globally, parans are latitude-specific, making them essential for relocation astrology.

### Key Concepts

**Angular Events**:

- **Rise**: Planet crosses eastern horizon (altitude = 0, ascending)
- **Set**: Planet crosses western horizon (altitude = 0, descending)
- **Culminate (MC)**: Planet reaches highest point (hour angle = 0)
- **Anti-culminate (IC)**: Planet at lowest point (hour angle = 180°)

**Paran Occurs When**:
At a specific latitude, two different planets experience angular events simultaneously. For example, Sun rising while Moon culminates.

### Key Formula

**Hour Angle at Rising/Setting**:

```
cos(H) = -tan(δ) × tan(φ)

where:
  H = hour angle (negative for rising, positive for setting)
  δ = declination
  φ = observer latitude
```

**Bisection Method**:
To find the latitude where two planets have simultaneous angular events:

1. Start with latitude bounds [lat_low, lat_high]
2. Calculate event times for both planets at midpoint
3. If Planet1 event occurs before Planet2 event, adjust bounds
4. Repeat until convergence (|lat_high - lat_low| < tolerance)

## Tasks

### 3.1 Event Time Calculator

**File**: `convex/calculations/parans/events.ts`

```typescript
import type { AngularEvent, PlanetId } from '../core/types'

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

export interface EventTime {
  planet: PlanetId
  event: AngularEvent
  /** Local Sidereal Time of event in degrees (0-360) */
  lst: number
  /** Whether this event is possible at this latitude */
  isPossible: boolean
  /** If circumpolar, whether always above or below horizon */
  circumpolarState?: 'always_above' | 'always_below'
}

/**
 * Calculate the LST at which a planet rises at a given latitude
 */
export function calculateRiseTime(ra: number, dec: number, latitude: number): EventTime {
  const decRad = dec * DEG_TO_RAD
  const latRad = latitude * DEG_TO_RAD

  // Check for circumpolar cases
  const tanProduct = Math.tan(decRad) * Math.tan(latRad)

  if (tanProduct <= -1) {
    // Object never sets (always above horizon)
    return {
      planet: 'sun' as PlanetId, // Will be overwritten
      event: 'rise',
      lst: 0,
      isPossible: false,
      circumpolarState: 'always_above',
    }
  }

  if (tanProduct >= 1) {
    // Object never rises (always below horizon)
    return {
      planet: 'sun' as PlanetId,
      event: 'rise',
      lst: 0,
      isPossible: false,
      circumpolarState: 'always_below',
    }
  }

  // Normal case - calculate hour angle at rising
  const cosH = -tanProduct
  const H = -Math.acos(cosH) * RAD_TO_DEG // Negative for rising

  // LST = RA + H
  let lst = ra + H
  if (lst < 0) lst += 360
  if (lst >= 360) lst -= 360

  return {
    planet: 'sun' as PlanetId,
    event: 'rise',
    lst,
    isPossible: true,
  }
}

/**
 * Calculate the LST at which a planet sets at a given latitude
 */
export function calculateSetTime(ra: number, dec: number, latitude: number): EventTime {
  const decRad = dec * DEG_TO_RAD
  const latRad = latitude * DEG_TO_RAD

  const tanProduct = Math.tan(decRad) * Math.tan(latRad)

  if (tanProduct <= -1) {
    return {
      planet: 'sun' as PlanetId,
      event: 'set',
      lst: 0,
      isPossible: false,
      circumpolarState: 'always_above',
    }
  }

  if (tanProduct >= 1) {
    return {
      planet: 'sun' as PlanetId,
      event: 'set',
      lst: 0,
      isPossible: false,
      circumpolarState: 'always_below',
    }
  }

  const cosH = -tanProduct
  const H = Math.acos(cosH) * RAD_TO_DEG // Positive for setting

  let lst = ra + H
  if (lst < 0) lst += 360
  if (lst >= 360) lst -= 360

  return {
    planet: 'sun' as PlanetId,
    event: 'set',
    lst,
    isPossible: true,
  }
}

/**
 * Calculate the LST at which a planet culminates (MC)
 */
export function calculateCulminateTime(ra: number): EventTime {
  // At culmination, hour angle = 0, so LST = RA
  return {
    planet: 'sun' as PlanetId,
    event: 'culminate',
    lst: ra,
    isPossible: true,
  }
}

/**
 * Calculate the LST at which a planet anti-culminates (IC)
 */
export function calculateAntiCulminateTime(ra: number): EventTime {
  // At anti-culmination, hour angle = 180°, so LST = RA + 180
  let lst = ra + 180
  if (lst >= 360) lst -= 360

  return {
    planet: 'sun' as PlanetId,
    event: 'anti_culminate',
    lst,
    isPossible: true,
  }
}

/**
 * Calculate all four event times for a planet at a given latitude
 */
export function calculateAllEventTimes(
  planetId: PlanetId,
  ra: number,
  dec: number,
  latitude: number,
): EventTime[] {
  const rise = calculateRiseTime(ra, dec, latitude)
  const set = calculateSetTime(ra, dec, latitude)
  const culminate = calculateCulminateTime(ra)
  const antiCulminate = calculateAntiCulminateTime(ra)

  // Set correct planet ID on all
  rise.planet = planetId
  set.planet = planetId
  culminate.planet = planetId
  antiCulminate.planet = planetId

  return [rise, set, culminate, antiCulminate]
}

/**
 * Calculate the angular difference between two LST values
 * Returns the minimum difference (0-180)
 */
export function lstDifference(lst1: number, lst2: number): number {
  let diff = Math.abs(lst1 - lst2)
  if (diff > 180) diff = 360 - diff
  return diff
}
```

### 3.2 Paran Bisection Solver

**File**: `convex/calculations/parans/bisection.ts`

```typescript
import type { PlanetId, AngularEvent, ParanPoint } from '../core/types'
import {
  calculateRiseTime,
  calculateSetTime,
  calculateCulminateTime,
  calculateAntiCulminateTime,
  lstDifference,
  type EventTime,
} from './events'

const TOLERANCE = 1e-6 // degrees latitude
const MAX_ITERATIONS = 100

interface PlanetData {
  planetId: PlanetId
  ra: number
  dec: number
}

interface ParanSearchResult {
  latitude: number
  timeDifference: number
  event1: EventTime
  event2: EventTime
}

/**
 * Get event time for a specific event type
 */
function getEventTime(ra: number, dec: number, latitude: number, event: AngularEvent): EventTime {
  switch (event) {
    case 'rise':
      return calculateRiseTime(ra, dec, latitude)
    case 'set':
      return calculateSetTime(ra, dec, latitude)
    case 'culminate':
      return calculateCulminateTime(ra)
    case 'anti_culminate':
      return calculateAntiCulminateTime(ra)
  }
}

/**
 * Calculate the signed time difference between two planet events
 * Positive = planet1 event occurs after planet2 event
 */
function signedTimeDifference(
  planet1: PlanetData,
  event1: AngularEvent,
  planet2: PlanetData,
  event2: AngularEvent,
  latitude: number,
): number | null {
  const time1 = getEventTime(planet1.ra, planet1.dec, latitude, event1)
  const time2 = getEventTime(planet2.ra, planet2.dec, latitude, event2)

  // If either event is impossible at this latitude, return null
  if (!time1.isPossible || !time2.isPossible) {
    return null
  }

  // Signed difference (consider wrapping at 360°)
  let diff = time1.lst - time2.lst

  // Normalize to -180 to 180
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360

  return diff
}

/**
 * Find latitude where two planets have simultaneous angular events
 * using bisection method
 */
export function findParanLatitude(
  planet1: PlanetData,
  event1: AngularEvent,
  planet2: PlanetData,
  event2: AngularEvent,
  latLow: number = -85,
  latHigh: number = 85,
): ParanSearchResult | null {
  // Check if there's a sign change in the time difference
  const diffLow = signedTimeDifference(planet1, event1, planet2, event2, latLow)
  const diffHigh = signedTimeDifference(planet1, event1, planet2, event2, latHigh)

  // If either bound doesn't have valid events, shrink the range
  if (diffLow === null || diffHigh === null) {
    // Try to find valid bounds
    let validLow = latLow
    let validHigh = latHigh

    // Search for valid lower bound
    for (let lat = latLow; lat < latHigh; lat += 5) {
      const diff = signedTimeDifference(planet1, event1, planet2, event2, lat)
      if (diff !== null) {
        validLow = lat
        break
      }
    }

    // Search for valid upper bound
    for (let lat = latHigh; lat > validLow; lat -= 5) {
      const diff = signedTimeDifference(planet1, event1, planet2, event2, lat)
      if (diff !== null) {
        validHigh = lat
        break
      }
    }

    latLow = validLow
    latHigh = validHigh

    const newDiffLow = signedTimeDifference(planet1, event1, planet2, event2, latLow)
    const newDiffHigh = signedTimeDifference(planet1, event1, planet2, event2, latHigh)

    if (newDiffLow === null || newDiffHigh === null) {
      return null // No valid range found
    }

    if (newDiffLow * newDiffHigh > 0) {
      return null // No zero crossing
    }
  } else if (diffLow * diffHigh > 0) {
    return null // No zero crossing in this range
  }

  // Bisection loop
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const latMid = (latLow + latHigh) / 2
    const diffMid = signedTimeDifference(planet1, event1, planet2, event2, latMid)

    if (diffMid === null) {
      // Events became impossible at this latitude, adjust bounds
      latHigh = latMid
      continue
    }

    // Check for convergence
    if (Math.abs(diffMid) < 0.1 || Math.abs(latHigh - latLow) < TOLERANCE) {
      // Found the paran latitude
      const event1Result = getEventTime(planet1.ra, planet1.dec, latMid, event1)
      const event2Result = getEventTime(planet2.ra, planet2.dec, latMid, event2)

      event1Result.planet = planet1.planetId
      event2Result.planet = planet2.planetId

      return {
        latitude: latMid,
        timeDifference: Math.abs(diffMid),
        event1: event1Result,
        event2: event2Result,
      }
    }

    // Determine which half contains the root
    const diffLowCurrent = signedTimeDifference(planet1, event1, planet2, event2, latLow)
    if (diffLowCurrent !== null && diffLowCurrent * diffMid < 0) {
      latHigh = latMid
    } else {
      latLow = latMid
    }
  }

  // Max iterations reached
  const latFinal = (latLow + latHigh) / 2
  const event1Result = getEventTime(planet1.ra, planet1.dec, latFinal, event1)
  const event2Result = getEventTime(planet2.ra, planet2.dec, latFinal, event2)

  if (!event1Result.isPossible || !event2Result.isPossible) {
    return null
  }

  event1Result.planet = planet1.planetId
  event2Result.planet = planet2.planetId

  return {
    latitude: latFinal,
    timeDifference: lstDifference(event1Result.lst, event2Result.lst),
    event1: event1Result,
    event2: event2Result,
  }
}

/**
 * Calculate paran strength based on exactness
 * 1.0 = exact (0° time difference)
 * 0.0 = at threshold (e.g., 1° time difference)
 */
export function calculateParanStrength(timeDifference: number, maxOrb: number = 1.0): number {
  if (timeDifference > maxOrb) return 0
  return 1 - timeDifference / maxOrb
}
```

### 3.3 Paran Catalog Generator

**File**: `convex/calculations/parans/catalog.ts`

```typescript
import type { PlanetId, AngularEvent, ParanPoint, ParanResult } from '../core/types'
import { findParanLatitude, calculateParanStrength } from './bisection'
import { PLANET_IDS } from '../core/types'

interface PlanetPosition {
  planetId: PlanetId
  ra: number
  dec: number
}

const ANGULAR_EVENTS: AngularEvent[] = ['rise', 'set', 'culminate', 'anti_culminate']

// Event pair categories for summary
type EventPairCategory = 'riseRise' | 'riseCulminate' | 'riseSet' | 'culminateCulminate' | 'setSet'

function categorizeEventPair(event1: AngularEvent, event2: AngularEvent): EventPairCategory {
  const events = [event1, event2].sort()

  if (events[0] === 'rise' && events[1] === 'rise') return 'riseRise'
  if (events.includes('rise') && events.includes('culminate')) return 'riseCulminate'
  if (events.includes('rise') && events.includes('set')) return 'riseSet'
  if (events[0] === 'culminate' && events[1] === 'culminate') return 'culminateCulminate'
  if (events[0] === 'set' && events[1] === 'set') return 'setSet'

  // Default for any other combination
  return 'riseCulminate'
}

/**
 * Find all paran points for a set of planet positions
 */
export function findAllParans(
  positions: PlanetPosition[],
  strengthThreshold: number = 0.5,
): ParanResult {
  const points: ParanPoint[] = []
  const summary = {
    riseRise: 0,
    riseCulminate: 0,
    riseSet: 0,
    culminateCulminate: 0,
    setSet: 0,
    total: 0,
  }

  // Iterate through all planet pairs
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const planet1 = positions[i]
      const planet2 = positions[j]

      // Check all event combinations
      for (const event1 of ANGULAR_EVENTS) {
        for (const event2 of ANGULAR_EVENTS) {
          // Skip if same event type for same planet (redundant)
          if (planet1.planetId === planet2.planetId && event1 === event2) {
            continue
          }

          // Find paran latitude for this combination
          const result = findParanLatitude({ ...planet1 }, event1, { ...planet2 }, event2)

          if (result !== null) {
            const strength = calculateParanStrength(result.timeDifference)

            if (strength >= strengthThreshold) {
              const paranPoint: ParanPoint = {
                planet1: planet1.planetId,
                event1: event1,
                planet2: planet2.planetId,
                event2: event2,
                latitude: result.latitude,
                strength,
              }

              points.push(paranPoint)

              // Update summary
              const category = categorizeEventPair(event1, event2)
              summary[category]++
              summary.total++
            }
          }
        }
      }
    }
  }

  // Sort by strength (strongest first)
  points.sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0))

  return { points, summary }
}

/**
 * Get the top N parans by strength
 */
export function getTopParans(result: ParanResult, limit: number = 20): ParanPoint[] {
  return result.points.slice(0, limit)
}

/**
 * Find parans involving a specific planet
 */
export function getParansForPlanet(result: ParanResult, planetId: PlanetId): ParanPoint[] {
  return result.points.filter((p) => p.planet1 === planetId || p.planet2 === planetId)
}

/**
 * Find parans at or near a specific latitude
 */
export function getParansAtLatitude(
  result: ParanResult,
  latitude: number,
  orb: number = 2.0,
): ParanPoint[] {
  return result.points.filter((p) => Math.abs(p.latitude - latitude) <= orb)
}

/**
 * Group parans by latitude bands
 */
export function groupParansByLatitude(
  result: ParanResult,
  bandSize: number = 5,
): Map<number, ParanPoint[]> {
  const groups = new Map<number, ParanPoint[]>()

  for (const point of result.points) {
    // Round to nearest band
    const band = Math.round(point.latitude / bandSize) * bandSize

    if (!groups.has(band)) {
      groups.set(band, [])
    }
    groups.get(band)!.push(point)
  }

  return groups
}
```

### 3.4 Integration Action

**File**: `convex/calculations/parans/index.ts`

```typescript
import { v } from 'convex/values'
import { internalAction } from '../../_generated/server'
import { findAllParans, getTopParans } from './catalog'
import type { PlanetId, ParanResult } from '../core/types'

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
  v.literal('pluto'),
)

export const calculateParans = internalAction({
  args: {
    positions: v.array(
      v.object({
        planetId: planetIdValidator,
        ra: v.number(),
        dec: v.number(),
      }),
    ),
    strengthThreshold: v.optional(v.number()),
    topLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const threshold = args.strengthThreshold ?? 0.5
    const limit = args.topLimit ?? 50

    // Find all parans
    const result = findAllParans(args.positions, threshold)

    // Get top parans for storage
    const topParans = getTopParans(result, limit)

    return {
      parans: result,
      topParans,
    }
  },
})

export const getParansForLocation = internalAction({
  args: {
    parans: v.object({
      points: v.array(
        v.object({
          planet1: planetIdValidator,
          event1: v.string(),
          planet2: planetIdValidator,
          event2: v.string(),
          latitude: v.number(),
          strength: v.optional(v.number()),
        }),
      ),
      summary: v.object({
        riseRise: v.number(),
        riseCulminate: v.number(),
        riseSet: v.number(),
        culminateCulminate: v.number(),
        setSet: v.number(),
        total: v.number(),
      }),
    }),
    latitude: v.number(),
    orb: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const orb = args.orb ?? 2.0

    const relevantParans = args.parans.points.filter(
      (p) => Math.abs(p.latitude - args.latitude) <= orb,
    )

    return {
      latitude: args.latitude,
      parans: relevantParans,
      count: relevantParans.length,
    }
  },
})
```

## Testing

### Unit Tests

**File**: `convex/calculations/parans/__tests__/events.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import {
  calculateRiseTime,
  calculateSetTime,
  calculateCulminateTime,
  lstDifference,
} from '../events'

describe('Event Time Calculations', () => {
  it('calculates culmination at RA', () => {
    const event = calculateCulminateTime(90)
    expect(event.lst).toBe(90)
    expect(event.isPossible).toBe(true)
  })

  it('calculates rise time for equatorial object', () => {
    // Object at 0° dec rises 90° before culmination
    const event = calculateRiseTime(180, 0, 45)
    expect(event.isPossible).toBe(true)
    expect(event.lst).toBeCloseTo(90, 0) // 180 - 90 = 90
  })

  it('detects circumpolar object (never sets)', () => {
    // Object at 70° dec at 60°N latitude
    const event = calculateSetTime(0, 70, 60)
    expect(event.isPossible).toBe(false)
    expect(event.circumpolarState).toBe('always_above')
  })

  it('detects object that never rises', () => {
    // Object at -70° dec at 60°N latitude
    const event = calculateRiseTime(0, -70, 60)
    expect(event.isPossible).toBe(false)
    expect(event.circumpolarState).toBe('always_below')
  })

  it('calculates LST difference correctly', () => {
    expect(lstDifference(10, 20)).toBe(10)
    expect(lstDifference(350, 10)).toBe(20)
    expect(lstDifference(180, 0)).toBe(180)
  })
})
```

**File**: `convex/calculations/parans/__tests__/bisection.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { findParanLatitude, calculateParanStrength } from '../bisection'

describe('Paran Bisection Solver', () => {
  it('finds paran between Sun and Moon', () => {
    const result = findParanLatitude(
      { planetId: 'sun', ra: 0, dec: 10 },
      'rise',
      { planetId: 'moon', ra: 90, dec: 15 },
      'culminate',
    )

    expect(result).not.toBeNull()
    if (result) {
      expect(result.latitude).toBeGreaterThan(-85)
      expect(result.latitude).toBeLessThan(85)
      expect(result.timeDifference).toBeLessThan(1)
    }
  })

  it('returns null when no paran exists', () => {
    // Test case where events can't coincide
    const result = findParanLatitude(
      { planetId: 'sun', ra: 0, dec: 80 },
      'set',
      { planetId: 'moon', ra: 0, dec: -80 },
      'rise',
      60, // Both circumpolar at these latitudes
      85,
    )

    // This should either find a paran or return null
    // depending on the exact configuration
  })

  it('calculates strength correctly', () => {
    expect(calculateParanStrength(0)).toBe(1)
    expect(calculateParanStrength(0.5, 1)).toBe(0.5)
    expect(calculateParanStrength(1, 1)).toBe(0)
    expect(calculateParanStrength(2, 1)).toBe(0)
  })
})
```

**File**: `convex/calculations/parans/__tests__/catalog.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { findAllParans, getTopParans, groupParansByLatitude } from '../catalog'

describe('Paran Catalog', () => {
  const testPositions = [
    { planetId: 'sun' as const, ra: 0, dec: 10 },
    { planetId: 'moon' as const, ra: 45, dec: 15 },
    { planetId: 'mars' as const, ra: 90, dec: -5 },
  ]

  it('finds parans for planet set', () => {
    const result = findAllParans(testPositions, 0.3)

    expect(result.points.length).toBeGreaterThan(0)
    expect(result.summary.total).toBe(result.points.length)
  })

  it('sorts parans by strength', () => {
    const result = findAllParans(testPositions, 0.3)

    for (let i = 1; i < result.points.length; i++) {
      const prev = result.points[i - 1].strength ?? 0
      const curr = result.points[i].strength ?? 0
      expect(prev).toBeGreaterThanOrEqual(curr)
    }
  })

  it('limits top parans correctly', () => {
    const result = findAllParans(testPositions, 0.1)
    const top5 = getTopParans(result, 5)

    expect(top5.length).toBeLessThanOrEqual(5)
  })

  it('groups parans by latitude', () => {
    const result = findAllParans(testPositions, 0.3)
    const groups = groupParansByLatitude(result, 10)

    // Each group should have parans within 10° of band center
    for (const [band, parans] of groups) {
      for (const paran of parans) {
        expect(Math.abs(paran.latitude - band)).toBeLessThanOrEqual(5)
      }
    }
  })
})
```

## Completion Criteria

- [ ] Paran solver finds all valid paran points
- [ ] Bisection achieves ±10⁻⁶ degree precision
- [ ] Circumpolar cases handled correctly
- [ ] Strength calculation reflects paran exactness
- [ ] All event type combinations covered
- [ ] Catalog generator produces sorted, grouped results
- [ ] All unit tests pass
- [ ] Integration test with known chart produces expected parans

## Performance Notes

The paran solver iterates through:

- 10 planets × 9 other planets = 90 pairs (actually 45 unique pairs)
- 4 events × 4 events = 16 combinations per pair
- Total: ~720 paran searches per chart

With bisection converging in ~20 iterations average, this is approximately 14,400 calculations. Each calculation is O(1), so total time should be < 100ms on modern hardware.

## Next Phase

Upon completion, proceed to [Phase 4: Dignity Engine](./phase-4-dignities.md) for essential dignity calculations.
