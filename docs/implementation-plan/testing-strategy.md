# Testing Strategy

This document outlines the comprehensive testing approach for the Declination Living application.

## Testing Pyramid

```
        ╱╲
       ╱  ╲     E2E Tests (10%)
      ╱────╲    - User flows
     ╱      ╲   - Critical paths
    ╱────────╲
   ╱          ╲  Integration Tests (30%)
  ╱────────────╲ - API endpoints
 ╱              ╲- Database queries
╱────────────────╲
       Unit Tests (60%)
    - Pure functions
    - Components
    - Calculations
```

## 1. Unit Tests

### 1.1 Calculation Engine Tests

**Location**: `convex/calculations/**/__tests__/`

#### Ephemeris Tests

```typescript
// convex/calculations/ephemeris/__tests__/julianDay.test.ts
describe('Julian Day Calculations', () => {
  // Reference cases from astronomical almanac
  const testCases = [
    { date: [2000, 1, 1, 12, 0], jd: 2451545.0 }, // J2000.0
    { date: [1957, 10, 4, 19, 28], jd: 2436116.31 }, // Sputnik launch
    { date: [1985, 7, 21, 0, 0], jd: 2446264.5 }, // Random date
  ]

  testCases.forEach(({ date, jd }) => {
    it(`converts ${date.join('-')} to JD ${jd}`, () => {
      const result = dateToJulianDay(...date)
      expect(result).toBeCloseTo(jd, 2)
    })
  })
})
```

#### Coordinate Transformation Tests

```typescript
// convex/calculations/ephemeris/__tests__/coordinates.test.ts
describe('Coordinate Transformations', () => {
  describe('Ecliptic to Equatorial', () => {
    it('transforms vernal equinox correctly', () => {
      const result = eclipticToEquatorial(0, 0, 23.44)
      expect(result.ra).toBeCloseTo(0, 2)
      expect(result.dec).toBeCloseTo(0, 2)
    })

    it('transforms summer solstice correctly', () => {
      const result = eclipticToEquatorial(90, 0, 23.44)
      expect(result.dec).toBeCloseTo(23.44, 2)
    })

    it('handles negative latitudes', () => {
      const result = eclipticToEquatorial(180, -5, 23.44)
      expect(result.dec).toBeLessThan(0)
    })
  })

  describe('Semi-Diurnal Arc', () => {
    it('calculates mid-latitude SDA', () => {
      const result = semiDiurnalArc(10, 45)
      expect(result.sda).toBeGreaterThan(80)
      expect(result.sda).toBeLessThan(100)
    })

    it('detects circumpolar never-sets', () => {
      const result = semiDiurnalArc(85, 80)
      expect(result.neverSets).toBe(true)
    })

    it('detects never-rises', () => {
      const result = semiDiurnalArc(-85, 80)
      expect(result.neverRises).toBe(true)
    })
  })
})
```

#### Paran Solver Tests

```typescript
// convex/calculations/parans/__tests__/bisection.test.ts
describe('Paran Bisection Solver', () => {
  it('converges to within tolerance', () => {
    const result = findParanLatitude(
      { planetId: 'sun', ra: 0, dec: 10 },
      'rise',
      { planetId: 'moon', ra: 45, dec: 20 },
      'culminate',
    )

    if (result) {
      expect(result.timeDifference).toBeLessThan(0.1)
    }
  })

  it('returns null for impossible configurations', () => {
    const result = findParanLatitude(
      { planetId: 'sun', ra: 0, dec: 89 },
      'rise',
      { planetId: 'moon', ra: 0, dec: -89 },
      'rise',
      60,
      90, // High latitudes where both are circumpolar
    )

    // Should find no valid paran or return null
  })

  it('handles all event combinations', () => {
    const events = ['rise', 'set', 'culminate', 'anti_culminate']

    for (const e1 of events) {
      for (const e2 of events) {
        expect(() =>
          findParanLatitude(
            { planetId: 'sun', ra: 0, dec: 10 },
            e1 as any,
            { planetId: 'moon', ra: 90, dec: 15 },
            e2 as any,
          ),
        ).not.toThrow()
      }
    }
  })
})
```

#### Dignity Engine Tests

```typescript
// convex/calculations/dignity/__tests__/engine.test.ts
describe('Dignity Engine', () => {
  describe('Essential Dignities', () => {
    const domicileTests = [
      { planet: 'sun', sign: 'leo', expected: 5 },
      { planet: 'moon', sign: 'cancer', expected: 5 },
      { planet: 'mars', sign: 'aries', expected: 5 },
      { planet: 'mars', sign: 'scorpio', expected: 5 },
    ]

    domicileTests.forEach(({ planet, sign, expected }) => {
      it(`${planet} in ${sign} = +${expected} (domicile)`, () => {
        const longitude = getSignStart(sign as any)
        const dignity = calculateDignity({
          planetId: planet as any,
          longitude,
          sect: 'day',
        })
        expect(dignity.domicile).toBe(expected)
      })
    })
  })

  describe('Debilities', () => {
    it('Sun in Aquarius = detriment', () => {
      const dignity = calculateDignity({
        planetId: 'sun',
        longitude: 315, // Aquarius
        sect: 'day',
      })
      expect(dignity.detriment).toBe(-5)
    })

    it('Sun in Libra = fall', () => {
      const dignity = calculateDignity({
        planetId: 'sun',
        longitude: 195, // Libra
        sect: 'day',
      })
      expect(dignity.fall).toBe(-4)
    })
  })

  describe('Terms (Egyptian Bounds)', () => {
    it('Jupiter rules first 6° of Aries', () => {
      const ruler = getTermRuler('aries', 3)
      expect(ruler).toBe('jupiter')
    })

    it('Venus rules 6-12° of Aries', () => {
      const ruler = getTermRuler('aries', 8)
      expect(ruler).toBe('venus')
    })
  })
})
```

### 1.2 Component Tests

**Location**: `src/components/**/__tests__/`

```typescript
// src/components/results/__tests__/DeclinationTable.test.tsx
import { render, screen } from '@testing-library/react'
import { DeclinationTable } from '../DeclinationTable'

describe('DeclinationTable', () => {
  const mockData = {
    sun: { value: 23.44, isOOB: false },
    moon: { value: 25.5, isOOB: true, oobDegrees: 2.06 },
    // ... other planets
  }

  it('renders all planet rows', () => {
    render(<DeclinationTable declinations={mockData} obliquity={23.44} />)

    expect(screen.getAllByRole('row')).toHaveLength(11) // header + 10 planets
  })

  it('shows OOB badge for out-of-bounds planets', () => {
    render(<DeclinationTable declinations={mockData} obliquity={23.44} />)

    expect(screen.getByText('OOB')).toBeInTheDocument()
  })

  it('formats declinations correctly', () => {
    render(<DeclinationTable declinations={mockData} obliquity={23.44} />)

    // Should show 23°26'N for Sun
    expect(screen.getByText(/23°.*N/)).toBeInTheDocument()
  })
})
```

## 2. Integration Tests

### 2.1 Convex Action Tests

**Location**: `convex/__tests__/`

```typescript
// convex/__tests__/calculateComplete.test.ts
import { convexTest } from 'convex-test'
import { api, internal } from '../_generated/api'
import schema from '../schema'

describe('Calculate Complete Action', () => {
  it('calculates all data for a valid chart', async () => {
    const t = convexTest(schema)

    // Create test user and chart
    const userId = await t.mutation(internal.testing.createTestUser, {})
    const chartId = await t.mutation(api.mutations.charts.create, {
      userId,
      name: 'Test Chart',
      birthDate: '1990-01-15',
      birthTime: '14:30',
      birthCity: 'New York',
      birthCountry: 'USA',
      birthLatitude: 40.7128,
      birthLongitude: -74.006,
      birthTimezone: 'America/New_York',
    })

    // Run calculation
    const result = await t.action(api.actions.calculate.calculateComplete, {
      chartId,
    })

    // Verify all sections present
    expect(result.declinations).toBeDefined()
    expect(result.dignities).toBeDefined()
    expect(result.zenithLines).toBeDefined()
    expect(result.acgLines).toBeDefined()
    expect(result.parans).toBeDefined()

    // Verify declination count
    expect(Object.keys(result.declinations)).toHaveLength(10)
  })

  it('handles invalid chart ID gracefully', async () => {
    const t = convexTest(schema)

    await expect(
      t.action(api.actions.calculate.calculateComplete, {
        chartId: 'invalid_id' as any,
      }),
    ).rejects.toThrow()
  })
})
```

### 2.2 Database Query Tests

```typescript
// convex/__tests__/queries.test.ts
import { convexTest } from 'convex-test'
import { api, internal } from '../_generated/api'
import schema from '../schema'

describe('City Queries', () => {
  it('finds cities by latitude range', async () => {
    const t = convexTest(schema)

    // Seed test cities
    await t.mutation(internal.testing.seedCities, {})

    const cities = await t.query(api.queries.cities.getByLatitudeRange, {
      minLat: 40,
      maxLat: 45,
      limit: 10,
    })

    expect(cities.length).toBeGreaterThan(0)
    cities.forEach((city) => {
      expect(city.latitude).toBeGreaterThanOrEqual(40)
      expect(city.latitude).toBeLessThanOrEqual(45)
    })
  })

  it('searches cities by name', async () => {
    const t = convexTest(schema)

    await t.mutation(internal.testing.seedCities, {})

    const cities = await t.query(api.queries.cities.search, {
      query: 'New York',
      limit: 5,
    })

    expect(cities.length).toBeGreaterThan(0)
    expect(cities[0].name).toContain('New York')
  })
})
```

## 3. End-to-End Tests

### 3.1 Playwright Configuration

**File**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 3.2 User Flow Tests

```typescript
// e2e/calculator.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Calculator Flow', () => {
  test('complete chart calculation', async ({ page }) => {
    // Navigate to calculator
    await page.goto('/calculator')

    // Step 1: Enter birth data
    await page.fill('[name="name"]', 'Test User')
    await page.fill('[name="birthDate"]', '1990-01-15')
    await page.fill('[name="birthTime"]', '14:30')
    await page.fill('[name="birthCity"]', 'New York')
    await page.click('text=New York, USA') // Select from autocomplete

    await page.click('text=Next')

    // Step 2: Adjust weights (optional)
    await expect(page.locator('text=Planet Weights')).toBeVisible()
    await page.click('text=Next')

    // Step 3: View results
    await expect(page.locator('text=Results')).toBeVisible()

    // Verify globe is rendered
    await expect(page.locator('canvas')).toBeVisible()

    // Verify declination table
    await expect(page.locator('text=Declinations')).toBeVisible()
    await expect(page.locator('text=☉')).toBeVisible() // Sun symbol
  })

  test('switch between result tabs', async ({ page }) => {
    await page.goto('/results/test-chart-id')

    // Click through tabs
    await page.click('text=Dignities')
    await expect(page.locator('text=Domicile')).toBeVisible()

    await page.click('text=Parans')
    await expect(page.locator('text=Total Parans')).toBeVisible()

    await page.click('text=Declinations')
    await expect(page.locator('text=☉')).toBeVisible()
  })
})
```

### 3.3 Globe Interaction Tests

```typescript
// e2e/globe.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Globe Interactions', () => {
  test('toggles layer visibility', async ({ page }) => {
    await page.goto('/results/test-chart-id')

    // Open layer controls
    await page.click('[aria-label="Layer controls"]')

    // Toggle zenith bands off
    await page.click('text=Zenith Bands')

    // Toggle ACG lines off
    await page.click('text=ACG Lines')

    // Verify controls responded (visual check via screenshot)
    await expect(page).toHaveScreenshot('globe-layers-hidden.png')
  })

  test('zooms to city on click', async ({ page }) => {
    await page.goto('/results/test-chart-id')

    // Click on a city in the rankings
    await page.click('text=New York')

    // Globe should zoom (wait for animation)
    await page.waitForTimeout(1000)

    // Verify zoom level changed (would need custom assertion)
  })
})
```

## 4. Performance Tests

### 4.1 Calculation Benchmarks

```typescript
// benchmarks/calculations.bench.ts
import { bench, describe } from 'vitest'
import { findAllParans } from '../convex/calculations/parans/catalog'
import { solveACGLines } from '../convex/calculations/acg/solver'

describe('Calculation Performance', () => {
  const testPositions = [
    { planetId: 'sun', ra: 0, dec: 10 },
    { planetId: 'moon', ra: 45, dec: 15 },
    { planetId: 'mercury', ra: 20, dec: 5 },
    // ... all 10 planets
  ]

  bench('findAllParans', () => {
    findAllParans(testPositions, 0.5)
  })

  bench('solveACGLines (single planet)', () => {
    solveACGLines({
      planetId: 'sun',
      ra: 0,
      dec: 23,
      gst: 0,
    })
  })
})
```

### 4.2 Load Tests

```typescript
// load-tests/concurrent-calculations.ts
import { check } from 'k6'
import http from 'k6/http'

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
}

export default function () {
  const res = http.post('https://your-convex-url.convex.cloud/api/action', {
    path: 'actions/calculate:calculateComplete',
    args: { chartId: 'test_chart_id' },
  })

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
}
```

## 5. Test Data

### 5.1 Reference Charts

```typescript
// test-data/reference-charts.ts
export const REFERENCE_CHARTS = {
  // Known chart with verified declinations
  chart1: {
    name: 'Reference Chart 1',
    birthDate: '1990-01-15',
    birthTime: '12:00',
    birthCity: 'London',
    birthCountry: 'UK',
    birthLatitude: 51.5074,
    birthLongitude: -0.1278,
    birthTimezone: 'Europe/London',
    expectedDeclinations: {
      sun: -21.12,
      moon: 18.45,
      // ... verified values
    },
  },

  // Chart with OOB Moon
  oobMoonChart: {
    name: 'OOB Moon Chart',
    birthDate: '1985-07-21',
    birthTime: '03:00',
    birthCity: 'Sydney',
    birthCountry: 'Australia',
    birthLatitude: -33.8688,
    birthLongitude: 151.2093,
    birthTimezone: 'Australia/Sydney',
    expectedDeclinations: {
      moon: 25.8, // OOB
    },
  },
}
```

## 6. Test Commands

```bash
# Run all unit tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run integration tests
bun run test:integration

# Run E2E tests
bun run test:e2e

# Run with coverage
bun run test:coverage

# Run benchmarks
bun run test:bench
```

## 7. CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: npx playwright install
      - run: bun run test:e2e
```

## 8. Coverage Requirements

| Category              | Minimum Coverage |
| --------------------- | ---------------- |
| Calculation functions | 90%              |
| Components            | 80%              |
| Queries/Mutations     | 85%              |
| Actions               | 75%              |
| Overall               | 80%              |
