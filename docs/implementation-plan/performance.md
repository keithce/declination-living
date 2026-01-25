# Performance Considerations

This document outlines performance optimization strategies for the Declination Living application.

## Performance Targets

| Metric                 | Target  | Critical |
| ---------------------- | ------- | -------- |
| Full chart calculation | < 500ms | < 1000ms |
| City search            | < 100ms | < 300ms  |
| Globe render (initial) | < 2s    | < 3s     |
| Tab switch (results)   | < 200ms | < 500ms  |
| Time to interactive    | < 3s    | < 5s     |

## Calculation Optimization

### 1. Swiss Ephemeris WASM

**Strategy**: Lazy load and cache the WASM module

```typescript
// Singleton pattern for ephemeris
let ephemerisInstance: SwissEph | null = null

async function getEphemeris(): Promise<SwissEph> {
  if (!ephemerisInstance) {
    const { default: init, SwissEph } = await import('swisseph-wasm')
    await init()
    ephemerisInstance = new SwissEph()
  }
  return ephemerisInstance
}
```

**Metrics**:

- First load: ~200ms (WASM initialization)
- Subsequent: ~5ms (cached instance)

### 2. Parallel Planet Calculations

**Strategy**: Calculate all planets concurrently

```typescript
// Sequential (slow)
for (const planet of planets) {
  positions[planet] = await calculatePosition(planet, jd)
}

// Parallel (fast)
const promises = planets.map((planet) => calculatePosition(planet, jd))
const results = await Promise.all(promises)
```

**Expected Improvement**: 10x faster (10 × 50ms → 50ms)

### 3. Paran Calculation Optimization

**Problem**: 720 paran searches per chart

**Strategy**: Early termination and caching

```typescript
// Skip impossible configurations early
function canFormParan(dec1: number, dec2: number): boolean {
  // If both declinations are same sign and close, parans will be near equator
  // If opposite extremes, may not form parans at habitable latitudes
  const combined = Math.abs(dec1) + Math.abs(dec2)
  return combined < 120 // Approximate bound
}

// Use memoization for repeated calculations
const paranCache = new Map<string, ParanResult>()

function getCacheKey(p1: PlanetData, e1: AngularEvent, p2: PlanetData, e2: AngularEvent): string {
  return `${p1.planetId}-${e1}-${p2.planetId}-${e2}`
}
```

### 4. ACG Line Resolution

**Problem**: High-resolution lines are memory-intensive

**Strategy**: Adaptive resolution based on zoom level

```typescript
function getACGLineResolution(zoomLevel: number): number {
  if (zoomLevel < 2) return 5 // 72 points per line
  if (zoomLevel < 4) return 2 // 180 points per line
  return 1 // 360 points per line
}
```

## Database Optimization

### 1. Index Strategy

```typescript
// Optimize for common queries
cities: defineTable({...})
  .index('by_latitude', ['latitude'])              // For band queries
  .index('by_tier_latitude', ['tier', 'latitude']) // For filtered queries
  .index('by_country_pop', ['countryCode', 'population']) // For regional queries
  .searchIndex('search_name', { searchField: 'nameAscii' }) // For text search
```

### 2. Pagination

```typescript
// Don't load all cities at once
const CITIES_PER_PAGE = 20

export const getCitiesPaginated = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? CITIES_PER_PAGE

    const cities = await ctx.db
      .query('cities')
      .order('desc')
      .paginate({ cursor: args.cursor, numItems: limit })

    return cities
  },
})
```

### 3. Data Separation

**Strategy**: Store summary data separately from full data

```typescript
// Quick access table
analysisResults: defineTable({
  chartId: v.id('charts'),
  // Summary data only
  topParans: v.array(paranSchema), // Max 20
  topCities: v.array(cityScoreSchema), // Max 50
  ...
})

// Full data table (loaded on demand)
chartParans: defineTable({
  chartId: v.id('charts'),
  parans: v.array(paranSchema), // All ~500 parans
})
```

## Frontend Optimization

### 1. Component Lazy Loading

```tsx
// Lazy load heavy components
const Globe = lazy(() => import('./components/globe/GlobeContainer'))
const ParanList = lazy(() => import('./components/results/ParanList'))

function ResultsPage() {
  return (
    <Suspense fallback={<GlobeSkeletion />}>
      <Globe {...props} />
    </Suspense>
  )
}
```

### 2. Virtual Lists

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function CityRankings({ cities }: { cities: RankedCity[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: cities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height
    overscan: 5,
  })

  return (
    <div ref={parentRef} className="h-[500px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <CityCard
            key={virtualItem.key}
            city={cities[virtualItem.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

### 3. Memoization

```tsx
// Memoize expensive computations
const sortedCities = useMemo(() => {
  return [...cities].sort((a, b) => b.score - a.score)
}, [cities])

// Memoize components
const CityCard = memo(function CityCard({ city }: { city: RankedCity }) {
  return (...)
})
```

### 4. Globe Optimization

```tsx
// Reduce draw calls
const zenithArcs = useMemo(() => {
  return zenithLines
    .filter(zl => weights[zl.planet] > 0.5) // Only show significant
    .map(zl => ({...}))
}, [zenithLines, weights])

// Use instancing for repeated geometries
// Reduce point count for parans
const visibleParans = useMemo(() => {
  return parans.slice(0, 50) // Limit visible points
}, [parans])
```

## Network Optimization

### 1. Batch Requests

```typescript
// Instead of multiple queries
const chart = await ctx.query(api.charts.getById, { id })
const analysis = await ctx.query(api.analysis.get, { chartId: id })
const parans = await ctx.query(api.parans.get, { chartId: id })

// Use a single action that returns all data
const result = await ctx.action(api.getChartComplete, { chartId: id })
```

### 2. Progressive Loading

```typescript
// Load essential data first
const { chart, declinations, dignities } = await ctx.action(api.getChartEssentials, { chartId })

// Load heavy data in background
const analysisPromise = ctx.query(api.getChartAnalysis, { chartId })

// Show UI immediately with essential data
// Analysis arrives and updates reactively
```

### 3. Response Compression

```typescript
// Convex automatically compresses, but ensure data is compact

// Bad: Storing full breakdown text
breakdown: ["Domicile (+5)", "Triplicity day (+3)", ...]

// Better: Store only non-zero values
breakdown: { domicile: 5, triplicity: 3 }
```

## Caching Strategy

### 1. Analysis Cache

```typescript
// Check cache before calculating
export const getOrCalculate = action({
  args: { chartId: v.id('charts') },
  handler: async (ctx, args) => {
    // Check if recent analysis exists
    const cached = await ctx.runQuery(internal.analysis.getRecent, {
      chartId: args.chartId,
      maxAgeMs: 24 * 60 * 60 * 1000, // 24 hours
    })

    if (cached) return cached

    // Calculate and store
    const result = await calculateComplete(ctx, args.chartId)
    await ctx.runMutation(internal.analysis.store, {
      chartId: args.chartId,
      result,
    })

    return result
  },
})
```

### 2. City Score Cache

```typescript
// Cache city scores per chart+weights combination
const cacheKey = `${chartId}-${JSON.stringify(weights)}`

const cached = await ctx.db
  .query('calculationCache')
  .withIndex('by_cache_key', (q) => q.eq('cacheKey', cacheKey))
  .first()

if (cached && cached.expiresAt > Date.now()) {
  return cached.result
}
```

### 3. Browser Caching

```typescript
// Use React Query with stale-while-revalidate
const { data } = useQuery({
  queryKey: ['chart', chartId],
  queryFn: () => fetchChart(chartId),
  staleTime: 5 * 60 * 1000, // Consider fresh for 5 min
  cacheTime: 30 * 60 * 1000, // Keep in cache for 30 min
})
```

## Monitoring

### 1. Performance Metrics

```typescript
// Instrument critical functions
export const calculateComplete = action({
  handler: async (ctx, args) => {
    const start = performance.now()

    try {
      const result = await doCalculation(ctx, args)

      const duration = performance.now() - start
      await ctx.runMutation(internal.metrics.record, {
        metric: 'calculation_duration_ms',
        value: duration,
        tags: { chartId: args.chartId },
      })

      return result
    } catch (error) {
      await ctx.runMutation(internal.metrics.recordError, {
        metric: 'calculation_error',
        error: error.message,
      })
      throw error
    }
  },
})
```

### 2. Client Performance

```typescript
// Track Core Web Vitals
import { getCLS, getINP, getLCP } from 'web-vitals'

getCLS((metric) => sendToAnalytics('CLS', metric.value))
getINP((metric) => sendToAnalytics('INP', metric.value))
getLCP((metric) => sendToAnalytics('LCP', metric.value))
```

## Bundle Size

### 1. Tree Shaking

```typescript
// Import only what's needed
import { Button } from '@/components/ui/button' // Good
import * as UI from '@/components/ui' // Bad

// For lodash
import debounce from 'lodash/debounce' // Good
import { debounce } from 'lodash' // Bad
```

### 2. Code Splitting

```typescript
// Split by route
const CalculatorPage = lazy(() => import('./routes/calculator'))
const ResultsPage = lazy(() => import('./routes/results'))

// Split heavy libraries
const ThreeGlobe = lazy(() => import('three-globe'))
```

### 3. Bundle Analysis

```bash
# Analyze bundle size
bun run build
bun run analyze

# Expected output
# - Main bundle: < 200KB
# - Three.js chunk: < 500KB
# - React chunk: < 100KB
```

## Summary

| Optimization          | Impact | Effort |
| --------------------- | ------ | ------ |
| Parallel calculations | High   | Low    |
| Lazy loading          | High   | Low    |
| Virtual lists         | High   | Medium |
| Data separation       | Medium | Medium |
| Caching               | Medium | Medium |
| Bundle splitting      | Medium | Low    |
| Globe optimization    | Medium | High   |
| WASM caching          | Low    | Low    |
