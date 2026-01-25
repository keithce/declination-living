# Database Schema Updates

This document outlines all required changes to the Convex schema to support the enhanced Declination Living application.

## Current Schema Analysis

The existing schema in `convex/schema.ts` provides a solid foundation but needs enhancements for:

1. **Enhanced declination storage** with OOB details
2. **Full dignity score storage** with breakdown
3. **Complete paran cataloging**
4. **Vibe category support**
5. **Analysis caching optimization**

## Schema Changes

### 1. Enhanced Charts Table

```typescript
// Add to schema.ts

// Enhanced declination with OOB status (already defined)
const enhancedDeclination = v.object({
  value: v.number(),
  isOOB: v.boolean(),
  oobDegrees: v.optional(v.number()),
})

// Full dignity score
const fullDignityScore = v.object({
  planet: v.string(),
  domicile: v.number(),
  exaltation: v.number(),
  triplicity: v.number(),
  terms: v.number(),
  face: v.number(),
  detriment: v.number(),
  fall: v.number(),
  peregrine: v.number(),
  total: v.number(),
  indicator: v.string(), // R, E, d, f, -
  breakdown: v.array(v.string()),
})

// Updated charts table
charts: defineTable({
  userId: v.id('users'),
  name: v.string(),
  birthDate: v.string(), // YYYY-MM-DD
  birthTime: v.string(), // HH:MM (24-hour)
  birthCity: v.string(),
  birthCountry: v.string(),
  birthLatitude: v.number(),
  birthLongitude: v.number(),
  birthTimezone: v.string(), // IANA timezone

  // Planetary data - Enhanced
  declinations: v.object({
    sun: enhancedDeclination,
    moon: enhancedDeclination,
    mercury: enhancedDeclination,
    venus: enhancedDeclination,
    mars: enhancedDeclination,
    jupiter: enhancedDeclination,
    saturn: enhancedDeclination,
    uranus: enhancedDeclination,
    neptune: enhancedDeclination,
    pluto: enhancedDeclination,
  }),

  // Ecliptic longitudes (for dignity calculation)
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

  // Right ascensions (for ACG/paran calculation)
  rightAscensions: v.object({
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

  // User preferences
  weights: planetWeights,
  vibeId: v.optional(v.string()),

  // Sharing
  isPublic: v.boolean(),
  shareSlug: v.optional(v.string()),

  // Metadata
  ascendant: v.optional(v.number()),
  sect: v.optional(v.union(v.literal('day'), v.literal('night'))),
  julianDay: v.optional(v.number()),
  obliquity: v.optional(v.number()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_share_slug', ['shareSlug'])
  .index('by_vibe', ['vibeId']),
```

### 2. Analysis Results Table (New)

```typescript
// New table for computed analysis results
analysisResults: defineTable({
  chartId: v.id('charts'),

  // Calculation metadata
  calculatedAt: v.number(),
  julianDay: v.number(),
  obliquity: v.number(),
  greenwichSiderealTime: v.number(),
  sect: v.union(v.literal('day'), v.literal('night')),

  // Dignity scores
  dignities: v.object({
    sun: fullDignityScore,
    moon: fullDignityScore,
    mercury: fullDignityScore,
    venus: fullDignityScore,
    mars: fullDignityScore,
    jupiter: fullDignityScore,
    saturn: fullDignityScore,
    uranus: fullDignityScore,
    neptune: fullDignityScore,
    pluto: fullDignityScore,
  }),

  // Zenith lines
  zenithLines: v.array(v.object({
    planet: v.string(),
    declination: v.number(),
    orbMin: v.number(),
    orbMax: v.number(),
  })),

  // ACG lines (stored as simplified points for quick retrieval)
  acgLinesSummary: v.object({
    totalLines: v.number(),
    planetsWithCircumpolar: v.array(v.string()),
  }),

  // Paran summary
  paranSummary: v.object({
    riseRise: v.number(),
    riseCulminate: v.number(),
    riseSet: v.number(),
    culminateCulminate: v.number(),
    setSet: v.number(),
    total: v.number(),
  }),

  // Top parans (limited for quick access)
  topParans: v.array(v.object({
    planet1: v.string(),
    event1: v.string(),
    planet2: v.string(),
    event2: v.string(),
    latitude: v.number(),
    strength: v.number(),
  })),

  // Top cities (pre-computed)
  topCities: v.array(v.object({
    cityId: v.id('cities'),
    score: v.number(),
    breakdown: v.object({
      zenith: v.number(),
      acg: v.number(),
      paran: v.number(),
    }),
    highlights: v.array(v.string()),
  })),

  // Optimal latitude bands
  optimalBands: v.array(v.object({
    minLat: v.number(),
    maxLat: v.number(),
    score: v.number(),
    dominantPlanets: v.array(v.string()),
  })),
})
  .index('by_chart', ['chartId'])
  .index('by_calculated_at', ['calculatedAt']),
```

### 3. Full Parans Table (New)

```typescript
// Separate table for full paran data (can be large)
chartParans: defineTable({
  chartId: v.id('charts'),

  // Full paran list
  parans: v.array(v.object({
    planet1: v.string(),
    event1: v.string(),
    planet2: v.string(),
    event2: v.string(),
    latitude: v.number(),
    strength: v.number(),
    lst: v.optional(v.number()), // Local sidereal time of event
  })),

  // Computed at
  calculatedAt: v.number(),
})
  .index('by_chart', ['chartId']),
```

### 4. Full ACG Lines Table (New)

```typescript
// Separate table for full ACG line data
chartACGLines: defineTable({
  chartId: v.id('charts'),

  // Full ACG lines with all points
  lines: v.array(v.object({
    planet: v.string(),
    lineType: v.string(), // ASC, DSC, MC, IC
    points: v.array(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    isCircumpolar: v.boolean(),
  })),

  // Computed at
  calculatedAt: v.number(),
})
  .index('by_chart', ['chartId']),
```

### 5. Enhanced Cities Table

```typescript
// Update cities table with additional fields
cities: defineTable({
  name: v.string(),
  nameAscii: v.string(),
  country: v.string(),
  countryCode: v.string(),
  state: v.optional(v.string()),
  latitude: v.number(),
  longitude: v.number(),
  population: v.number(),
  timezone: v.string(),
  tier: v.union(
    v.literal('major'),   // >500k
    v.literal('medium'),  // 100k-500k
    v.literal('minor'),   // 50k-100k
    v.literal('small'),   // 10k-50k
  ),

  // NEW: Additional metadata
  elevation: v.optional(v.number()),    // meters
  region: v.optional(v.string()),       // continent/region
  alternateNames: v.optional(v.array(v.string())),
})
  .index('by_latitude', ['latitude'])
  .index('by_tier_latitude', ['tier', 'latitude'])
  .index('by_country', ['countryCode'])
  .index('by_population', ['population'])
  .searchIndex('search_name', { searchField: 'nameAscii' }),
```

### 6. Vibes Table Enhancement

```typescript
// Enhanced vibes table
vibes: defineTable({
  userId: v.optional(v.id('users')),
  name: v.string(),
  description: v.string(),

  // Weights configuration
  weights: planetWeights,

  // Keywords for NLP matching
  keywords: v.array(v.string()),

  // Primary planets for this vibe
  primaryPlanets: v.array(v.string()),

  // Visibility
  isPublic: v.boolean(),
  isPreset: v.boolean(),

  // NEW: Category and icon
  category: v.optional(v.string()), // wealth, love, career, etc.
  icon: v.optional(v.string()),      // emoji or icon name
  color: v.optional(v.string()),     // hex color for UI

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_user', ['userId'])
  .index('by_public', ['isPublic'])
  .index('by_preset', ['isPreset'])
  .index('by_category', ['category']),
```

### 7. User Sessions Table (New)

```typescript
// Track user calculation sessions
userSessions: defineTable({
  userId: v.optional(v.id('users')),
  anonymousUserId: v.optional(v.id('anonymousUsers')),

  // Session data
  chartId: v.optional(v.id('charts')),
  vibeId: v.optional(v.string()),
  customWeights: v.optional(planetWeights),

  // Location focus
  focusLatitude: v.optional(v.number()),
  focusLongitude: v.optional(v.number()),

  // Timestamps
  startedAt: v.number(),
  lastActivityAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_anonymous_user', ['anonymousUserId'])
  .index('by_last_activity', ['lastActivityAt']),
```

## Migration Strategy

### Phase 1: Add New Tables

1. Create `analysisResults`, `chartParans`, `chartACGLines` tables
2. Deploy schema changes
3. New calculations write to new tables

### Phase 2: Migrate Existing Data

```typescript
// Migration action
export const migrateChartData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all charts
    const charts = await ctx.db.query('charts').collect()

    for (const chart of charts) {
      // Check if analysis exists
      const existing = await ctx.db
        .query('analysisResults')
        .withIndex('by_chart', (q) => q.eq('chartId', chart._id))
        .first()

      if (!existing) {
        // Trigger recalculation
        await ctx.scheduler.runAfter(0, 'actions/calculate:calculateComplete', {
          chartId: chart._id,
        })
      }
    }
  },
})
```

### Phase 3: Update Queries

1. Update all queries to use new table structure
2. Add fallback to old data if migration incomplete
3. Remove old fields after verification

## Index Optimization

### Recommended Indexes

```typescript
// Charts: Common query patterns
.index('by_user_created', ['userId', 'createdAt'])
.index('by_vibe_user', ['vibeId', 'userId'])

// Cities: Location queries
.index('by_lat_lng', ['latitude', 'longitude'])
.index('by_country_population', ['countryCode', 'population'])

// Analysis: Quick lookup
.index('by_chart_calculated', ['chartId', 'calculatedAt'])

// Sessions: Cleanup
.index('by_last_activity', ['lastActivityAt'])
```

## Data Validation

### Convex Validators

```typescript
// Shared validators
export const planetIdValidator = v.union(
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

export const angularEventValidator = v.union(
  v.literal('rise'),
  v.literal('set'),
  v.literal('culminate'),
  v.literal('anti_culminate'),
)

export const sectValidator = v.union(v.literal('day'), v.literal('night'))

export const dignityIndicatorValidator = v.union(
  v.literal('R'),
  v.literal('E'),
  v.literal('d'),
  v.literal('f'),
  v.literal('-'),
)
```

## Storage Considerations

### Estimated Data Sizes

| Table           | Avg Row Size | Expected Rows | Total Size |
| --------------- | ------------ | ------------- | ---------- |
| charts          | 2 KB         | 10,000        | 20 MB      |
| analysisResults | 5 KB         | 10,000        | 50 MB      |
| chartParans     | 50 KB        | 10,000        | 500 MB     |
| chartACGLines   | 100 KB       | 10,000        | 1 GB       |
| cities          | 0.5 KB       | 50,000        | 25 MB      |
| vibes           | 1 KB         | 1,000         | 1 MB       |

### Optimization Strategies

1. **Separate large data**: ACG lines and full parans in separate tables
2. **Lazy loading**: Only fetch detailed data when needed
3. **Caching**: Use `analysisCache` for computed results
4. **TTL**: Clean up old sessions and cache entries

## Conclusion

These schema updates provide:

1. **Complete data storage** for all PDF-specified calculations
2. **Efficient querying** with appropriate indexes
3. **Scalable structure** separating summary from detail data
4. **Backward compatibility** through migration strategy
