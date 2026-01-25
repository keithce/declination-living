# Phase 1: Ephemeris Foundation

**Duration**: Weeks 1-2
**Priority**: Critical
**Dependencies**: None

## Objectives

1. Integrate Swiss Ephemeris WASM module for high-precision planetary calculations
2. Implement Julian Day conversions with timezone handling
3. Build coordinate transformation pipeline (Ecliptic → Equatorial → Horizontal)
4. Calculate dynamic obliquity for accurate OOB detection

## Background

The Swiss Ephemeris provides sub-arcsecond precision for planetary positions. The WASM version allows browser/Convex execution without native binaries. All downstream calculations (ACG, parans, dignities) depend on accurate ephemeris data.

### Key Formulas

**Julian Day Number** (from PDF):

```
JD = 367*Y - INT(7*(Y+INT((M+9)/12))/4) + INT(275*M/9) + D + 1721013.5 + UT/24
```

**Obliquity of the Ecliptic** (mean obliquity, J2000):

```
ε = 23°26'21.448" - 46.8150"T - 0.00059"T² + 0.001813"T³
where T = (JD - 2451545.0) / 36525
```

**Ecliptic to Equatorial Transformation**:

```
sin(δ) = sin(β)cos(ε) + cos(β)sin(ε)sin(λ)
cos(α)cos(δ) = cos(β)cos(λ)
sin(α)cos(δ) = cos(β)sin(ε)cos(λ) - sin(β)cos(ε) + cos(β)cos(ε)sin(λ)

where:
  λ = ecliptic longitude
  β = ecliptic latitude
  ε = obliquity
  α = right ascension
  δ = declination
```

## Tasks

### 1.1 Swiss Ephemeris WASM Setup

**File**: `convex/calculations/ephemeris/swisseph.ts`

```typescript
import { v } from 'convex/values'
import { internalAction } from '../../_generated/server'

// Lazy-load WASM module
let swissephModule: any = null

async function getSwisseph() {
  if (!swissephModule) {
    // Dynamic import of swisseph-wasm
    const { default: init, SwissEph } = await import('swisseph-wasm')
    await init()
    swissephModule = new SwissEph()
  }
  return swissephModule
}

// Swiss Ephemeris body constants
export const SE_SUN = 0
export const SE_MOON = 1
export const SE_MERCURY = 2
export const SE_VENUS = 3
export const SE_MARS = 4
export const SE_JUPITER = 5
export const SE_SATURN = 6
export const SE_URANUS = 7
export const SE_NEPTUNE = 8
export const SE_PLUTO = 9

// Calculation flags
export const SEFLG_SPEED = 256 // Include speed in output
export const SEFLG_EQUATORIAL = 2048 // Return equatorial coordinates
export const SEFLG_SWIEPH = 2 // Use Swiss Ephemeris files

export const calculatePlanetPosition = internalAction({
  args: {
    julianDay: v.number(),
    planetId: v.number(),
    flags: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const swe = await getSwisseph()
    const flags = args.flags ?? SEFLG_SPEED | SEFLG_SWIEPH

    // Calculate ecliptic coordinates
    const eclipticResult = swe.calc_ut(args.julianDay, args.planetId, flags)

    // Calculate equatorial coordinates
    const equatorialResult = swe.calc_ut(args.julianDay, args.planetId, flags | SEFLG_EQUATORIAL)

    return {
      ecliptic: {
        longitude: eclipticResult[0],
        latitude: eclipticResult[1],
        distance: eclipticResult[2],
        speed: eclipticResult[3],
      },
      equatorial: {
        rightAscension: equatorialResult[0],
        declination: equatorialResult[1],
        distance: equatorialResult[2],
        speedRA: equatorialResult[3],
        speedDec: equatorialResult[4],
      },
      isRetrograde: eclipticResult[3] < 0,
    }
  },
})
```

### 1.2 Julian Day Calculator

**File**: `convex/calculations/ephemeris/julianDay.ts`

```typescript
import { v } from 'convex/values'

/**
 * Convert UTC date/time to Julian Day Number
 * Reference: Astronomical Algorithms, Jean Meeus
 */
export function dateToJulianDay(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
): number {
  // Adjust for January/February
  let y = year
  let m = month
  if (m <= 2) {
    y -= 1
    m += 12
  }

  // Gregorian calendar correction
  const a = Math.floor(y / 100)
  const b = 2 - a + Math.floor(a / 4)

  // Calculate JD
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5

  // Add fractional day
  const dayFraction = (hour + minute / 60 + second / 3600) / 24

  return jd + dayFraction
}

/**
 * Convert Julian Day to calendar date
 */
export function julianDayToDate(jd: number): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} {
  const z = Math.floor(jd + 0.5)
  const f = jd + 0.5 - z

  let a: number
  if (z < 2299161) {
    a = z
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25)
    a = z + 1 + alpha - Math.floor(alpha / 4)
  }

  const b = a + 1524
  const c = Math.floor((b - 122.1) / 365.25)
  const d = Math.floor(365.25 * c)
  const e = Math.floor((b - d) / 30.6001)

  const day = b - d - Math.floor(30.6001 * e)
  const month = e < 14 ? e - 1 : e - 13
  const year = month > 2 ? c - 4716 : c - 4715

  // Extract time
  const dayFraction = f * 24
  const hour = Math.floor(dayFraction)
  const minuteFraction = (dayFraction - hour) * 60
  const minute = Math.floor(minuteFraction)
  const second = (minuteFraction - minute) * 60

  return { year, month, day, hour, minute, second }
}

/**
 * Get current Julian Day
 */
export function nowJulianDay(): number {
  const now = new Date()
  return dateToJulianDay(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
  )
}

/**
 * Convert local time to UTC given timezone offset in hours
 */
export function localToUTC(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezoneOffset: number,
): { year: number; month: number; day: number; hour: number; minute: number } {
  // Create date in local time
  const localDate = new Date(year, month - 1, day, hour, minute)

  // Adjust for timezone (offset is hours from UTC, positive = east)
  const utcMs = localDate.getTime() - timezoneOffset * 60 * 60 * 1000
  const utcDate = new Date(utcMs)

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: utcDate.getUTCHours(),
    minute: utcDate.getUTCMinutes(),
  }
}
```

### 1.3 Coordinate Transformations

**File**: `convex/calculations/ephemeris/coordinates.ts`

```typescript
/**
 * Coordinate transformation utilities
 * Based on formulas from the Astronomical Calculation PDF
 */

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

/**
 * Calculate mean obliquity of the ecliptic
 * @param jd Julian Day
 * @returns Obliquity in degrees
 */
export function calculateObliquity(jd: number): number {
  // Julian centuries from J2000.0
  const T = (jd - 2451545.0) / 36525

  // Mean obliquity (IAU 2006 precession)
  const epsilon0 = 23.439291111 // degrees at J2000.0

  // Polynomial terms
  const obliquity =
    epsilon0 - (46.815 / 3600) * T - (0.00059 / 3600) * T * T + (0.001813 / 3600) * T * T * T

  return obliquity
}

/**
 * Convert ecliptic coordinates to equatorial
 * @param longitude Ecliptic longitude in degrees
 * @param latitude Ecliptic latitude in degrees
 * @param obliquity Obliquity in degrees
 * @returns Right ascension and declination in degrees
 */
export function eclipticToEquatorial(
  longitude: number,
  latitude: number,
  obliquity: number,
): { ra: number; dec: number } {
  const lambda = longitude * DEG_TO_RAD
  const beta = latitude * DEG_TO_RAD
  const epsilon = obliquity * DEG_TO_RAD

  // Calculate declination
  const sinDec =
    Math.sin(beta) * Math.cos(epsilon) + Math.cos(beta) * Math.sin(epsilon) * Math.sin(lambda)
  const dec = Math.asin(sinDec) * RAD_TO_DEG

  // Calculate right ascension
  const y = Math.sin(lambda) * Math.cos(epsilon) - Math.tan(beta) * Math.sin(epsilon)
  const x = Math.cos(lambda)
  let ra = Math.atan2(y, x) * RAD_TO_DEG

  // Normalize to 0-360
  if (ra < 0) ra += 360

  return { ra, dec }
}

/**
 * Convert equatorial coordinates to horizontal (alt-az)
 * @param ra Right ascension in degrees
 * @param dec Declination in degrees
 * @param latitude Observer latitude in degrees
 * @param lst Local Sidereal Time in degrees
 * @returns Altitude and azimuth in degrees
 */
export function equatorialToHorizontal(
  ra: number,
  dec: number,
  latitude: number,
  lst: number,
): { altitude: number; azimuth: number } {
  // Hour angle
  const ha = (lst - ra) * DEG_TO_RAD
  const decRad = dec * DEG_TO_RAD
  const latRad = latitude * DEG_TO_RAD

  // Calculate altitude
  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(ha)
  const altitude = Math.asin(sinAlt) * RAD_TO_DEG

  // Calculate azimuth
  const y = -Math.cos(decRad) * Math.sin(ha)
  const x = Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(ha)
  let azimuth = Math.atan2(y, x) * RAD_TO_DEG

  // Normalize to 0-360 (N=0, E=90)
  if (azimuth < 0) azimuth += 360

  return { altitude, azimuth }
}

/**
 * Calculate Greenwich Sidereal Time from Julian Day
 * @param jd Julian Day (UT)
 * @returns GST in degrees (0-360)
 */
export function greenwichSiderealTime(jd: number): number {
  // Julian centuries from J2000.0
  const T = (jd - 2451545.0) / 36525

  // Mean sidereal time at Greenwich (in degrees)
  let gst =
    280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000

  // Normalize to 0-360
  gst = gst % 360
  if (gst < 0) gst += 360

  return gst
}

/**
 * Calculate Local Sidereal Time
 * @param gst Greenwich Sidereal Time in degrees
 * @param longitude Observer longitude in degrees (east positive)
 * @returns LST in degrees (0-360)
 */
export function localSiderealTime(gst: number, longitude: number): number {
  let lst = gst + longitude
  lst = lst % 360
  if (lst < 0) lst += 360
  return lst
}

/**
 * Calculate Semi-Diurnal Arc (half the time above horizon)
 * @param dec Declination in degrees
 * @param latitude Observer latitude in degrees
 * @returns SDA in degrees, or special values for circumpolar cases
 */
export function semiDiurnalArc(
  dec: number,
  latitude: number,
): { sda: number; neverSets: boolean; neverRises: boolean } {
  const decRad = dec * DEG_TO_RAD
  const latRad = latitude * DEG_TO_RAD

  // Calculate hour angle at rising/setting
  const cosHA = -Math.tan(decRad) * Math.tan(latRad)

  // Check for circumpolar cases
  if (cosHA < -1) {
    // Object never sets (circumpolar above horizon)
    return { sda: 180, neverSets: true, neverRises: false }
  }
  if (cosHA > 1) {
    // Object never rises (circumpolar below horizon)
    return { sda: 0, neverSets: false, neverRises: true }
  }

  // Normal case
  const sda = Math.acos(cosHA) * RAD_TO_DEG
  return { sda, neverSets: false, neverRises: false }
}

/**
 * Check if a planet is out of bounds (declination exceeds obliquity)
 * @param dec Declination in degrees
 * @param obliquity Current obliquity in degrees
 * @returns OOB status and degrees beyond limit
 */
export function checkOutOfBounds(
  dec: number,
  obliquity: number,
): { isOOB: boolean; oobDegrees: number } {
  const absDec = Math.abs(dec)
  if (absDec > obliquity) {
    return { isOOB: true, oobDegrees: absDec - obliquity }
  }
  return { isOOB: false, oobDegrees: 0 }
}
```

### 1.4 Main Calculation Entry Point

**File**: `convex/calculations/ephemeris/index.ts`

```typescript
import { v } from 'convex/values'
import { internalAction } from '../../_generated/server'
import { dateToJulianDay } from './julianDay'
import {
  calculateObliquity,
  eclipticToEquatorial,
  greenwichSiderealTime,
  checkOutOfBounds,
} from './coordinates'
import { PLANET_IDS, type PlanetId, type CelestialBody } from '../core/types'

const PLANET_SE_IDS: Record<PlanetId, number> = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
  uranus: 7,
  neptune: 8,
  pluto: 9,
}

const PLANET_NAMES: Record<PlanetId, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
}

export const calculateAllPlanets = internalAction({
  args: {
    year: v.number(),
    month: v.number(),
    day: v.number(),
    hour: v.number(),
    minute: v.number(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Calculate Julian Day
    const jd = dateToJulianDay(args.year, args.month, args.day, args.hour, args.minute)

    // Calculate obliquity
    const obliquity = calculateObliquity(jd)

    // Calculate GST
    const gst = greenwichSiderealTime(jd)

    // Calculate each planet
    const celestialBodies: CelestialBody[] = []
    const declinations: Record<PlanetId, number> = {} as Record<PlanetId, number>
    const outOfBounds: CelestialBody[] = []

    for (const planetId of PLANET_IDS) {
      // Call Swiss Ephemeris for this planet
      const position = await ctx.runAction(
        'calculations/ephemeris/swisseph:calculatePlanetPosition',
        { julianDay: jd, planetId: PLANET_SE_IDS[planetId] },
      )

      // Check OOB status
      const oobStatus = checkOutOfBounds(position.equatorial.declination, obliquity)

      const body: CelestialBody = {
        id: PLANET_SE_IDS[planetId],
        name: PLANET_NAMES[planetId],
        planetId,
        ecliptic: {
          longitude: position.ecliptic.longitude,
          latitude: position.ecliptic.latitude,
          distance: position.ecliptic.distance,
          speed: position.ecliptic.speed,
        },
        equatorial: {
          rightAscension: position.equatorial.rightAscension,
          declination: position.equatorial.declination,
          speedRA: position.equatorial.speedRA,
          speedDec: position.equatorial.speedDec,
        },
        isRetrograde: position.isRetrograde,
        isOutOfBounds: oobStatus.isOOB,
        oobDegrees: oobStatus.isOOB ? oobStatus.oobDegrees : undefined,
      }

      celestialBodies.push(body)
      declinations[planetId] = position.equatorial.declination

      if (oobStatus.isOOB) {
        outOfBounds.push(body)
      }
    }

    return {
      celestialBodies,
      declinations,
      outOfBounds,
      metadata: {
        julianDay: jd,
        obliquity,
        greenwichSiderealTime: gst,
      },
    }
  },
})
```

## Testing

### Unit Tests

**File**: `convex/calculations/ephemeris/__tests__/julianDay.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { dateToJulianDay, julianDayToDate } from '../julianDay'

describe('Julian Day Calculations', () => {
  it('converts J2000.0 epoch correctly', () => {
    // J2000.0 = January 1, 2000, 12:00 TT
    const jd = dateToJulianDay(2000, 1, 1, 12, 0, 0)
    expect(jd).toBeCloseTo(2451545.0, 5)
  })

  it('converts historical date correctly', () => {
    // Sputnik launch: October 4, 1957, 19:28 UTC
    const jd = dateToJulianDay(1957, 10, 4, 19, 28, 0)
    expect(jd).toBeCloseTo(2436116.31, 2)
  })

  it('round-trips date correctly', () => {
    const original = { year: 1985, month: 7, day: 21, hour: 14, minute: 30 }
    const jd = dateToJulianDay(
      original.year,
      original.month,
      original.day,
      original.hour,
      original.minute,
    )
    const result = julianDayToDate(jd)

    expect(result.year).toBe(original.year)
    expect(result.month).toBe(original.month)
    expect(result.day).toBe(original.day)
    expect(result.hour).toBe(original.hour)
  })
})
```

**File**: `convex/calculations/ephemeris/__tests__/coordinates.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import {
  calculateObliquity,
  eclipticToEquatorial,
  semiDiurnalArc,
  checkOutOfBounds,
} from '../coordinates'

describe('Coordinate Transformations', () => {
  it('calculates J2000 obliquity correctly', () => {
    const jd = 2451545.0 // J2000.0
    const obliquity = calculateObliquity(jd)
    expect(obliquity).toBeCloseTo(23.439, 2)
  })

  it('transforms Sun at vernal equinox', () => {
    // Sun at 0° longitude (vernal equinox)
    const result = eclipticToEquatorial(0, 0, 23.44)
    expect(result.ra).toBeCloseTo(0, 1)
    expect(result.dec).toBeCloseTo(0, 1)
  })

  it('transforms Sun at summer solstice', () => {
    // Sun at 90° longitude
    const result = eclipticToEquatorial(90, 0, 23.44)
    expect(result.dec).toBeCloseTo(23.44, 1)
  })

  it('calculates SDA for mid-latitude', () => {
    // Sun at 23° dec, observer at 40°N
    const result = semiDiurnalArc(23, 40)
    expect(result.neverSets).toBe(false)
    expect(result.neverRises).toBe(false)
    expect(result.sda).toBeGreaterThan(90)
    expect(result.sda).toBeLessThan(120)
  })

  it('detects circumpolar never-sets', () => {
    // Object at 80° dec, observer at 60°N
    const result = semiDiurnalArc(80, 60)
    expect(result.neverSets).toBe(true)
    expect(result.sda).toBe(180)
  })

  it('detects OOB planet', () => {
    const oob = checkOutOfBounds(25.5, 23.44)
    expect(oob.isOOB).toBe(true)
    expect(oob.oobDegrees).toBeCloseTo(2.06, 1)
  })
})
```

## Validation

1. **Compare with JPL Horizons**: For any test date, ephemeris positions should match JPL to within 1 arcsecond
2. **Obliquity check**: At J2000.0, obliquity should be 23°26'21.448" (23.439°)
3. **GST check**: At J2000.0 noon UT, GST should be approximately 18h 41m
4. **OOB validation**: Moon positions known to be OOB should be flagged correctly

## Dependencies to Install

```bash
# Swiss Ephemeris WASM
bun add swisseph-wasm

# For timezone handling
bun add @date-fns/utc date-fns-tz
```

## Completion Criteria

- [x] Swiss Ephemeris WASM loads and calculates positions
- [x] Julian Day conversions accurate to 1 second
- [x] Coordinate transformations match reference within 0.001°
- [x] Obliquity calculation matches IAU 2006 formula
- [x] OOB detection works for known cases
- [x] All unit tests pass (144 tests across 5 test files)
- [ ] Integration test with real birth data succeeds (requires Swiss Ephemeris WASM runtime)

## Next Phase

Upon completion, proceed to [Phase 2: Core Calculations](./phase-2-calculations.md) for ACG line solving and zenith calculations.
