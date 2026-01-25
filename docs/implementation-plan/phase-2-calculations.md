# Phase 2: Core Calculations

**Duration**: Weeks 3-4
**Priority**: Critical
**Dependencies**: Phase 1 (Ephemeris Foundation)

## Objectives

1. Implement ACG (Astro*Carto*Graphy) line solver with circumpolar handling
2. Calculate zenith lines from declinations
3. Build the semi-diurnal arc computation engine
4. Create the core scoring function for location evaluation

## Background

ACG lines show where planets are angular (on ASC, DSC, MC, or IC) around the globe. The PDF specifies a 361-point longitude sampling with bisection refinement for MC/IC lines and hour-angle solving for ASC/DSC lines.

### Key Formulas

**MC/IC Line** (meridian crossing):

```text
At any longitude λ, the planet is on MC/IC when:
  Local Sidereal Time = Right Ascension (for MC)
  Local Sidereal Time = Right Ascension ± 180° (for IC)

Solving for latitude where this occurs at each longitude.
```

**ASC/DSC Line** (horizon crossing):

```text
For a planet to be rising/setting at latitude φ:
  cos(H) = -tan(δ) × tan(φ)

where:
  H = hour angle at rising/setting
  δ = declination
  φ = latitude

Solving: given RA, dec, and LST, find latitude where altitude = 0
```

**Zenith Line**:

```text
A planet is directly overhead (zenith) when:
  Observer latitude = Planet declination

The zenith band extends ± orb around this latitude.
```

## Tasks

### 2.1 ACG Line Solver

**File**: `convex/calculations/acg/solver.ts`

```typescript
import type { PlanetId, ACGLine, ACGLineType, GeoLocation } from '../core/types'

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

interface ACGSolverInput {
  planetId: PlanetId
  ra: number // Right ascension in degrees
  dec: number // Declination in degrees
  gst: number // Greenwich Sidereal Time in degrees
}

/**
 * Solve for MC line points (planet on meridian, upper)
 * At MC: LST = RA, so we solve for latitude at each longitude
 */
function solveMCLine(input: ACGSolverInput): GeoLocation[] {
  const points: GeoLocation[] = []

  for (let lon = -180; lon <= 180; lon += 1) {
    // LST at this longitude
    let lst = input.gst + lon
    if (lst < 0) lst += 360
    if (lst >= 360) lst -= 360

    // For MC, planet RA should equal LST
    // Hour angle at MC = 0
    // Latitude where planet culminates at current RA

    // At MC, the altitude is: alt = 90 - |latitude - dec|
    // We want the highest point, which occurs at latitude = dec for |dec| < 90-lat_limit

    // For the MC line, we need to find where HA = 0 corresponds to current LST
    // This happens when LST = RA
    // The longitude where this is true:
    const mcLongitude = input.ra - input.gst

    // At this longitude, the MC point exists at any latitude
    // But we plot the line at the longitude where HA=0
    // For visualization, we just mark the latitude = declination as the "power point"

    // Actually, MC line runs N-S at fixed longitude where LST=RA
    // Let's correct this:
    const hourAngle = lst - input.ra

    // If HA is near 0 (within tolerance), planet is on MC at this longitude
    const haTolerance = 1 // degree
    if (
      Math.abs(hourAngle % 360) < haTolerance ||
      Math.abs((hourAngle % 360) - 360) < haTolerance
    ) {
      // MC line exists at this longitude for all latitudes
      // Sample latitudes
      for (let lat = -80; lat <= 80; lat += 5) {
        points.push({ latitude: lat, longitude: lon })
      }
    }
  }

  return points
}

/**
 * Solve for IC line points (planet on meridian, lower)
 */
function solveICLine(input: ACGSolverInput): GeoLocation[] {
  // IC is 180° from MC
  return solveMCLine({
    ...input,
    ra: (input.ra + 180) % 360,
  }).map((p) => ({ ...p }))
}

/**
 * Solve for ASC line (planet rising)
 * Uses hour angle at rising: cos(H) = -tan(dec) * tan(lat)
 */
function solveASCLine(input: ACGSolverInput): GeoLocation[] {
  const points: GeoLocation[] = []
  const { dec, ra, gst } = input
  const decRad = dec * DEG_TO_RAD

  // Sample longitudes
  for (let lon = -180; lon <= 180; lon += 1) {
    // Calculate LST at this longitude
    let lst = gst + lon
    if (lst < 0) lst += 360
    if (lst >= 360) lst -= 360

    // For each latitude, check if planet is rising
    for (let lat = -89; lat <= 89; lat += 0.5) {
      const latRad = lat * DEG_TO_RAD

      // Check for circumpolar
      const tanProduct = Math.tan(decRad) * Math.tan(latRad)
      if (Math.abs(tanProduct) > 1) continue // Circumpolar, no rising

      // Hour angle at rising (negative, before meridian)
      const haRising = -Math.acos(-tanProduct) * RAD_TO_DEG

      // Current hour angle at this LST
      let currentHA = lst - ra
      if (currentHA < -180) currentHA += 360
      if (currentHA > 180) currentHA -= 360

      // Check if near rising hour angle
      if (Math.abs(currentHA - haRising) < 1) {
        points.push({ latitude: lat, longitude: lon })
      }
    }
  }

  return smoothLine(points)
}

/**
 * Solve for DSC line (planet setting)
 */
function solveDSCLine(input: ACGSolverInput): GeoLocation[] {
  const points: GeoLocation[] = []
  const { dec, ra, gst } = input
  const decRad = dec * DEG_TO_RAD

  for (let lon = -180; lon <= 180; lon += 1) {
    let lst = gst + lon
    if (lst < 0) lst += 360
    if (lst >= 360) lst -= 360

    for (let lat = -89; lat <= 89; lat += 0.5) {
      const latRad = lat * DEG_TO_RAD

      const tanProduct = Math.tan(decRad) * Math.tan(latRad)
      if (Math.abs(tanProduct) > 1) continue

      // Hour angle at setting (positive, after meridian)
      const haSetting = Math.acos(-tanProduct) * RAD_TO_DEG

      let currentHA = lst - ra
      if (currentHA < -180) currentHA += 360
      if (currentHA > 180) currentHA -= 360

      if (Math.abs(currentHA - haSetting) < 1) {
        points.push({ latitude: lat, longitude: lon })
      }
    }
  }

  return smoothLine(points)
}

/**
 * Smooth and deduplicate line points
 */
function smoothLine(points: GeoLocation[]): GeoLocation[] {
  if (points.length === 0) return []

  // Sort by longitude
  const sorted = [...points].sort((a, b) => a.longitude - b.longitude)

  // Remove duplicates and smooth
  const smoothed: GeoLocation[] = []
  let prevLon = -999

  for (const point of sorted) {
    if (Math.abs(point.longitude - prevLon) >= 1) {
      smoothed.push(point)
      prevLon = point.longitude
    }
  }

  return smoothed
}

/**
 * Check if line is circumpolar (doesn't cross all longitudes)
 */
function isCircumpolar(dec: number, lineType: ACGLineType): boolean {
  const absDec = Math.abs(dec)

  // ASC/DSC lines don't exist at extreme latitudes for high-declination objects
  if (lineType === 'ASC' || lineType === 'DSC') {
    // Object with dec > 90 - |observer_lat| is circumpolar at that latitude
    return absDec > 66.5 // Approximate arctic circle
  }

  return false
}

/**
 * Main ACG solver - generates all 4 lines for a planet
 */
export function solveACGLines(input: ACGSolverInput): ACGLine[] {
  const lines: ACGLine[] = []
  const lineTypes: ACGLineType[] = ['MC', 'IC', 'ASC', 'DSC']

  for (const lineType of lineTypes) {
    let points: GeoLocation[] = []

    switch (lineType) {
      case 'MC':
        points = solveMCLine(input)
        break
      case 'IC':
        points = solveICLine(input)
        break
      case 'ASC':
        points = solveASCLine(input)
        break
      case 'DSC':
        points = solveDSCLine(input)
        break
    }

    if (points.length > 0) {
      lines.push({
        planet: input.planetId,
        lineType,
        points,
        isCircumpolar: isCircumpolar(input.dec, lineType),
      })
    }
  }

  return lines
}
```

### 2.2 Optimized ACG Solver with Bisection

**File**: `convex/calculations/acg/bisection.ts`

```typescript
/**
 * High-precision ACG solver using bisection method
 * Reference: Astronomical Calculation PDF, Section 3.2
 */

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI
const TOLERANCE = 1e-6 // degrees
const MAX_ITERATIONS = 50

interface BisectionInput {
  ra: number
  dec: number
  gst: number
  longitude: number
}

/**
 * Calculate hour angle for a given LST and RA
 */
function hourAngle(lst: number, ra: number): number {
  let ha = lst - ra
  while (ha < -180) ha += 360
  while (ha > 180) ha -= 360
  return ha
}

/**
 * Calculate altitude given hour angle, declination, and latitude
 */
function altitude(ha: number, dec: number, lat: number): number {
  const haRad = ha * DEG_TO_RAD
  const decRad = dec * DEG_TO_RAD
  const latRad = lat * DEG_TO_RAD

  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad)

  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD_TO_DEG
}

/**
 * Find latitude where altitude = 0 (rising/setting) using bisection
 */
export function bisectRisingLatitude(input: BisectionInput, isRising: boolean): number | null {
  const { ra, dec, gst, longitude } = input

  // Calculate LST at this longitude
  let lst = gst + longitude
  if (lst < 0) lst += 360
  if (lst >= 360) lst -= 360

  const ha = hourAngle(lst, ra)

  // For rising, HA should be negative; for setting, positive
  // Check if planet is in the right half of the sky
  if (isRising && ha > 0) return null
  if (!isRising && ha < 0) return null

  // Bisection bounds
  let latLow = -89
  let latHigh = 89

  // Check if there's a sign change in altitude
  const altLow = altitude(ha, dec, latLow)
  const altHigh = altitude(ha, dec, latHigh)

  if (altLow * altHigh > 0) {
    // No zero crossing in this range
    return null
  }

  // Bisection loop
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const latMid = (latLow + latHigh) / 2
    const altMid = altitude(ha, dec, latMid)

    if (Math.abs(altMid) < TOLERANCE) {
      return latMid
    }

    if (altLow * altMid < 0) {
      latHigh = latMid
    } else {
      latLow = latMid
    }
  }

  return (latLow + latHigh) / 2
}

/**
 * Find longitude where MC/IC occurs for a given latitude
 */
export function bisectMeridianLongitude(ra: number, gst: number, isIC: boolean): number {
  // MC occurs when LST = RA
  // IC occurs when LST = RA + 180
  const targetRA = isIC ? (ra + 180) % 360 : ra

  // LST = GST + longitude
  // targetRA = GST + longitude
  // longitude = targetRA - GST
  let longitude = targetRA - gst

  // Normalize to -180 to 180
  while (longitude < -180) longitude += 360
  while (longitude > 180) longitude -= 360

  return longitude
}

/**
 * Generate high-precision ACG line using bisection
 */
export function generatePreciseACGLine(
  ra: number,
  dec: number,
  gst: number,
  lineType: 'ASC' | 'DSC' | 'MC' | 'IC',
): Array<{ latitude: number; longitude: number }> {
  const points: Array<{ latitude: number; longitude: number }> = []

  if (lineType === 'MC' || lineType === 'IC') {
    // MC/IC lines are vertical (constant longitude)
    const longitude = bisectMeridianLongitude(ra, gst, lineType === 'IC')

    for (let lat = -85; lat <= 85; lat += 2) {
      points.push({ latitude: lat, longitude })
    }
  } else {
    // ASC/DSC lines curve across the globe
    const isRising = lineType === 'ASC'

    for (let lon = -180; lon <= 180; lon += 1) {
      const lat = bisectRisingLatitude({ ra, dec, gst, longitude: lon }, isRising)

      if (lat !== null) {
        points.push({ latitude: lat, longitude: lon })
      }
    }
  }

  return points
}
```

### 2.3 Zenith Line Calculator

**File**: `convex/calculations/acg/zenith.ts`

```typescript
import type { PlanetId, ZenithLine, PlanetDeclinations } from '../core/types'

const DEFAULT_ORB = 1.0 // degrees

/**
 * Calculate zenith lines for all planets
 * A zenith line is the latitude where a planet is directly overhead
 * This equals the planet's declination
 */
export function calculateZenithLines(
  declinations: PlanetDeclinations,
  orb: number = DEFAULT_ORB,
): ZenithLine[] {
  const zenithLines: ZenithLine[] = []

  for (const [planetId, dec] of Object.entries(declinations)) {
    // Zenith can only occur between tropics (roughly ±23.5°)
    // But planets can be OOB, so we check the full range
    if (Math.abs(dec) <= 90) {
      zenithLines.push({
        planet: planetId as PlanetId,
        declination: dec,
        orbMin: dec - orb,
        orbMax: dec + orb,
      })
    }
  }

  return zenithLines
}

/**
 * Check if a location is within a zenith band
 */
export function isInZenithBand(latitude: number, zenithLine: ZenithLine): boolean {
  return latitude >= zenithLine.orbMin && latitude <= zenithLine.orbMax
}

/**
 * Calculate distance from zenith line in degrees
 */
export function distanceFromZenith(latitude: number, zenithLine: ZenithLine): number {
  return Math.abs(latitude - zenithLine.declination)
}

/**
 * Score a location based on zenith proximity
 * Returns 1.0 for exact zenith, decreasing to 0 at orb boundary
 */
export function zenithScore(
  latitude: number,
  zenithLine: ZenithLine,
  orb: number = DEFAULT_ORB,
): number {
  const distance = distanceFromZenith(latitude, zenithLine)
  if (distance > orb) return 0
  return 1 - distance / orb
}

/**
 * Find all zenith bands that overlap with a latitude range
 */
export function findOverlappingZeniths(
  minLat: number,
  maxLat: number,
  zenithLines: ZenithLine[],
): ZenithLine[] {
  return zenithLines.filter((zl) => zl.orbMax >= minLat && zl.orbMin <= maxLat)
}
```

### 2.4 Location Scoring Engine

**File**: `convex/calculations/geospatial/scoring.ts`

```typescript
import type {
  PlanetId,
  PlanetWeights,
  PlanetDeclinations,
  ZenithLine,
  ACGLine,
  ParanPoint,
} from '../core/types'
import { calculateZenithLines, zenithScore } from '../acg/zenith'

const DEFAULT_ZENITH_ORB = 1.0
const DEFAULT_ACG_ORB = 2.0
const DEFAULT_PARAN_ORB = 1.0

interface LocationScore {
  latitude: number
  longitude: number
  totalScore: number
  zenithScore: number
  acgScore: number
  paranScore: number
  contributingPlanets: Array<{
    planet: PlanetId
    type: 'zenith' | 'acg' | 'paran'
    score: number
  }>
}

interface ScoringInput {
  latitude: number
  longitude: number
  declinations: PlanetDeclinations
  weights: PlanetWeights
  zenithLines: ZenithLine[]
  acgLines: ACGLine[]
  parans: ParanPoint[]
}

/**
 * Calculate ACG proximity score for a location
 */
function calculateACGScore(
  lat: number,
  lon: number,
  acgLines: ACGLine[],
  weights: PlanetWeights,
  orb: number = DEFAULT_ACG_ORB,
): { score: number; contributions: Array<{ planet: PlanetId; score: number }> } {
  let totalScore = 0
  const contributions: Array<{ planet: PlanetId; score: number }> = []

  for (const line of acgLines) {
    // Find closest point on this line to our location
    let minDistance = Infinity

    for (const point of line.points) {
      // Simple Euclidean distance (good enough for scoring)
      const dLat = lat - point.latitude
      const dLon = lon - point.longitude
      const distance = Math.sqrt(dLat * dLat + dLon * dLon)
      minDistance = Math.min(minDistance, distance)
    }

    if (minDistance <= orb) {
      const lineScore = (1 - minDistance / orb) * weights[line.planet]
      totalScore += lineScore
      contributions.push({ planet: line.planet, score: lineScore })
    }
  }

  return { score: totalScore, contributions }
}

/**
 * Calculate zenith proximity score for a location
 */
function calculateZenithScore(
  lat: number,
  zenithLines: ZenithLine[],
  weights: PlanetWeights,
  orb: number = DEFAULT_ZENITH_ORB,
): { score: number; contributions: Array<{ planet: PlanetId; score: number }> } {
  let totalScore = 0
  const contributions: Array<{ planet: PlanetId; score: number }> = []

  for (const zl of zenithLines) {
    const zScore = zenithScore(lat, zl, orb)
    if (zScore > 0) {
      const weightedScore = zScore * weights[zl.planet]
      totalScore += weightedScore
      contributions.push({ planet: zl.planet, score: weightedScore })
    }
  }

  return { score: totalScore, contributions }
}

/**
 * Calculate paran score for a latitude
 * (Parans are latitude-specific, longitude doesn't matter)
 */
function calculateParanScore(
  lat: number,
  parans: ParanPoint[],
  weights: PlanetWeights,
  orb: number = DEFAULT_PARAN_ORB,
): { score: number; contributions: Array<{ planet: PlanetId; score: number }> } {
  let totalScore = 0
  const contributions: Array<{ planet: PlanetId; score: number }> = []

  for (const paran of parans) {
    const distance = Math.abs(lat - paran.latitude)
    if (distance <= orb) {
      const proximityScore = 1 - distance / orb

      // Average weight of both planets in the paran
      const avgWeight = (weights[paran.planet1] + weights[paran.planet2]) / 2
      const paranScore = proximityScore * avgWeight * (paran.strength ?? 1)

      totalScore += paranScore
      contributions.push({ planet: paran.planet1, score: paranScore / 2 })
      contributions.push({ planet: paran.planet2, score: paranScore / 2 })
    }
  }

  return { score: totalScore, contributions }
}

/**
 * Calculate complete location score
 */
export function scoreLocation(input: ScoringInput): LocationScore {
  const { latitude, longitude, weights, zenithLines, acgLines, parans } = input

  const zenith = calculateZenithScore(latitude, zenithLines, weights)
  const acg = calculateACGScore(latitude, longitude, acgLines, weights)
  const paran = calculateParanScore(latitude, parans, weights)

  const contributingPlanets: LocationScore['contributingPlanets'] = []

  for (const c of zenith.contributions) {
    contributingPlanets.push({ ...c, type: 'zenith' })
  }
  for (const c of acg.contributions) {
    contributingPlanets.push({ ...c, type: 'acg' })
  }
  for (const c of paran.contributions) {
    contributingPlanets.push({ ...c, type: 'paran' })
  }

  return {
    latitude,
    longitude,
    totalScore: zenith.score + acg.score + paran.score,
    zenithScore: zenith.score,
    acgScore: acg.score,
    paranScore: paran.score,
    contributingPlanets,
  }
}

/**
 * Generate a scoring grid for heatmap visualization
 */
export function generateScoringGrid(
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
  zenithLines: ZenithLine[],
  acgLines: ACGLine[],
  parans: ParanPoint[],
  latStep: number = 5,
  lonStep: number = 10,
): Array<{ lat: number; lon: number; score: number }> {
  const grid: Array<{ lat: number; lon: number; score: number }> = []

  for (let lat = -85; lat <= 85; lat += latStep) {
    for (let lon = -180; lon <= 180; lon += lonStep) {
      const score = scoreLocation({
        latitude: lat,
        longitude: lon,
        declinations,
        weights,
        zenithLines,
        acgLines,
        parans,
      })

      grid.push({ lat, lon, score: score.totalScore })
    }
  }

  return grid
}
```

### 2.5 Integration Action

**File**: `convex/calculations/acg/index.ts`

```typescript
import { v } from 'convex/values'
import { internalAction } from '../../_generated/server'
import { solveACGLines } from './solver'
import { calculateZenithLines } from './zenith'
import type { PlanetId, ACGLine, ZenithLine } from '../core/types'

export const calculateACGAndZenith = internalAction({
  args: {
    celestialBodies: v.array(
      v.object({
        planetId: v.string(),
        ra: v.number(),
        dec: v.number(),
      }),
    ),
    gst: v.number(),
  },
  handler: async (ctx, args) => {
    const acgLines: ACGLine[] = []
    const declinations: Record<string, number> = {}

    // Calculate ACG lines for each planet
    for (const body of args.celestialBodies) {
      const planetId = body.planetId as PlanetId
      declinations[planetId] = body.dec

      const lines = solveACGLines({
        planetId,
        ra: body.ra,
        dec: body.dec,
        gst: args.gst,
      })

      acgLines.push(...lines)
    }

    // Calculate zenith lines
    const zenithLines = calculateZenithLines(declinations as Record<PlanetId, number>)

    return {
      acgLines,
      zenithLines,
    }
  },
})
```

## Testing

### Unit Tests

**File**: `convex/calculations/acg/__tests__/solver.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { solveACGLines } from '../solver'
import { bisectMeridianLongitude, bisectRisingLatitude } from '../bisection'

describe('ACG Line Solver', () => {
  it('generates all 4 line types', () => {
    const lines = solveACGLines({
      planetId: 'sun',
      ra: 90,
      dec: 23.44,
      gst: 0,
    })

    const types = lines.map((l) => l.lineType)
    expect(types).toContain('MC')
    expect(types).toContain('IC')
    expect(types).toContain('ASC')
    expect(types).toContain('DSC')
  })

  it('MC line is at correct longitude', () => {
    const longitude = bisectMeridianLongitude(90, 0, false)
    expect(longitude).toBeCloseTo(90, 1)
  })

  it('IC line is 180° from MC', () => {
    const mcLon = bisectMeridianLongitude(90, 0, false)
    const icLon = bisectMeridianLongitude(90, 0, true)

    const diff = Math.abs(Math.abs(mcLon - icLon) - 180)
    expect(diff).toBeLessThan(1)
  })

  it('finds rising latitude for Sun at equinox', () => {
    const lat = bisectRisingLatitude(
      {
        ra: 0,
        dec: 0,
        gst: 90,
        longitude: 0,
      },
      true,
    )

    // At equinox, Sun rises due east at equator
    expect(lat).not.toBeNull()
    if (lat !== null) {
      expect(Math.abs(lat)).toBeLessThan(5)
    }
  })
})
```

**File**: `convex/calculations/acg/__tests__/zenith.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { calculateZenithLines, isInZenithBand, zenithScore } from '../zenith'

describe('Zenith Line Calculator', () => {
  const testDeclinations = {
    sun: 23.44,
    moon: 20.5,
    mercury: 15.0,
    venus: -10.0,
    mars: 5.0,
    jupiter: 0.0,
    saturn: -5.0,
    uranus: 10.0,
    neptune: -15.0,
    pluto: 22.0,
  }

  it('creates zenith line for each planet', () => {
    const zenithLines = calculateZenithLines(testDeclinations)
    expect(zenithLines.length).toBe(10)
  })

  it('zenith latitude equals declination', () => {
    const zenithLines = calculateZenithLines(testDeclinations)
    const sunZenith = zenithLines.find((z) => z.planet === 'sun')

    expect(sunZenith).toBeDefined()
    expect(sunZenith!.declination).toBe(23.44)
  })

  it('detects location in zenith band', () => {
    const zenithLines = calculateZenithLines(testDeclinations, 1.0)
    const sunZenith = zenithLines.find((z) => z.planet === 'sun')!

    expect(isInZenithBand(23.44, sunZenith)).toBe(true)
    expect(isInZenithBand(23.0, sunZenith)).toBe(true)
    expect(isInZenithBand(25.0, sunZenith)).toBe(false)
  })

  it('calculates zenith score correctly', () => {
    const zenithLines = calculateZenithLines(testDeclinations, 1.0)
    const sunZenith = zenithLines.find((z) => z.planet === 'sun')!

    // Exact zenith = 1.0
    expect(zenithScore(23.44, sunZenith)).toBeCloseTo(1.0, 2)

    // 0.5° away = 0.5
    expect(zenithScore(23.94, sunZenith)).toBeCloseTo(0.5, 2)

    // Beyond orb = 0
    expect(zenithScore(25.0, sunZenith)).toBe(0)
  })
})
```

## Completion Criteria

- [ ] ACG lines render correctly on globe for all planets
- [ ] MC/IC lines are vertical at correct longitudes
- [ ] ASC/DSC lines curve appropriately with latitude
- [ ] Circumpolar cases handled (lines terminate at appropriate latitudes)
- [ ] Zenith lines calculated for all planets
- [ ] Location scoring function produces sensible results
- [ ] Scoring grid generates data for heatmap
- [ ] All unit tests pass
- [ ] Visual verification against reference ACG maps

## Next Phase

Upon completion, proceed to [Phase 3: Paran System](./phase-3-parans.md) for paran bisection solver and event calculations.
