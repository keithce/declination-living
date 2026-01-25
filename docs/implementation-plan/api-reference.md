# API Reference

Complete reference for all Convex actions, mutations, and queries in the Declination Living application.

## Actions

### `actions/calculate.calculateComplete`

Main entry point for chart calculations. Computes all planetary data, dignities, ACG lines, parans, and recommendations.

**Arguments:**

```typescript
{
  chartId: Id<'charts'>
}
```

**Returns:**

```typescript
{
  celestialBodies: CelestialBody[]
  declinations: Record<PlanetId, EnhancedDeclination>
  outOfBounds: CelestialBody[]
  dignities: Record<PlanetId, DignityScore>
  zenithLines: ZenithLine[]
  acgLines: ACGLine[]
  parans: ParanResult
  vibeSearch: GeospatialSearchResult
  metadata: {
    calculatedAt: number
    julianDay: number
    greenwichSiderealTime: number
    obliquity: number
    sect: 'day' | 'night'
  }
}
```

**Example:**

```typescript
const result = await ctx.runAction(api.actions.calculate.calculateComplete, {
  chartId: 'kx7j9d8s...',
})
```

---

### `actions/calculate.calculateForDate`

Calculates positions for a specific date without saving to database.

**Arguments:**

```typescript
{
  year: number
  month: number
  day: number
  hour: number
  minute: number
  latitude?: number
  longitude?: number
}
```

**Returns:**

```typescript
{
  celestialBodies: CelestialBody[]
  declinations: Record<PlanetId, number>
  metadata: {
    julianDay: number
    obliquity: number
    gst: number
  }
}
```

---

### `actions/cities.geocode`

Geocodes a city name using the Geoapify API.

**Arguments:**

```typescript
{
  query: string
  limit?: number
}
```

**Returns:**

```typescript
{
  results: Array<{
    name: string
    country: string
    latitude: number
    longitude: number
    timezone: string
    population?: number
  }>
}
```

---

### `actions/vibes.matchFromQuery`

Matches a natural language query to a vibe category.

**Arguments:**

```typescript
{
  query: string
}
```

**Returns:**

```typescript
{
  matched: VibeCategory | null
  confidence: number
  suggestions: VibeCategory[]
}
```

---

## Mutations

### `mutations/charts.create`

Creates a new chart with birth data.

**Arguments:**

```typescript
{
  name: string
  birthDate: string        // YYYY-MM-DD
  birthTime: string        // HH:MM
  birthCity: string
  birthCountry: string
  birthLatitude: number
  birthLongitude: number
  birthTimezone: string    // IANA timezone
  weights?: PlanetWeights
  vibeId?: string
  isPublic?: boolean
}
```

**Returns:**

```typescript
Id<'charts'>
```

---

### `mutations/charts.update`

Updates an existing chart.

**Arguments:**

```typescript
{
  chartId: Id<'charts'>
  name?: string
  weights?: PlanetWeights
  vibeId?: string
  isPublic?: boolean
}
```

**Returns:**

```typescript
void
```

---

### `mutations/charts.delete`

Deletes a chart and associated analysis data.

**Arguments:**

```typescript
{
  chartId: Id<'charts'>
}
```

**Returns:**

```typescript
void
```

---

### `mutations/charts.generateShareSlug`

Generates a unique sharing slug for a chart.

**Arguments:**

```typescript
{
  chartId: Id<'charts'>
}
```

**Returns:**

```typescript
string // The generated slug
```

---

### `mutations/vibes.create`

Creates a custom vibe preset.

**Arguments:**

```typescript
{
  name: string
  description: string
  weights: PlanetWeights
  keywords: string[]
  primaryPlanets: PlanetId[]
  isPublic?: boolean
}
```

**Returns:**

```typescript
Id<'vibes'>
```

---

### `mutations/profiles.updateWeights`

Updates default weights for user profile.

**Arguments:**

```typescript
{
  weights: PlanetWeights
}
```

**Returns:**

```typescript
void
```

---

## Queries

### `queries/charts.getById`

Gets a chart by ID.

**Arguments:**

```typescript
{
  id: Id<'charts'>
}
```

**Returns:**

```typescript
Chart | null
```

---

### `queries/charts.getByShareSlug`

Gets a public chart by its share slug.

**Arguments:**

```typescript
{
  slug: string
}
```

**Returns:**

```typescript
Chart | null
```

---

### `queries/charts.listByUser`

Lists all charts for the current user.

**Arguments:**

```typescript
{
  limit?: number
  cursor?: string
}
```

**Returns:**

```typescript
{
  charts: Chart[]
  nextCursor?: string
}
```

---

### `queries/charts.getAnalysis`

Gets the computed analysis for a chart.

**Arguments:**

```typescript
{
  chartId: Id<'charts'>
}
```

**Returns:**

```typescript
AnalysisResult | null
```

---

### `queries/cities.search`

Searches cities by name.

**Arguments:**

```typescript
{
  query: string
  limit?: number
}
```

**Returns:**

```typescript
City[]
```

---

### `queries/cities.getByLatitudeRange`

Gets cities within a latitude range.

**Arguments:**

```typescript
{
  minLat: number
  maxLat: number
  tier?: 'major' | 'medium' | 'minor' | 'small'
  limit?: number
}
```

**Returns:**

```typescript
City[]
```

---

### `queries/cities.getById`

Gets a city by ID.

**Arguments:**

```typescript
{
  id: Id<'cities'>
}
```

**Returns:**

```typescript
City | null
```

---

### `queries/cities.getNearLocation`

Gets cities near a specific location.

**Arguments:**

```typescript
{
  latitude: number
  longitude: number
  radiusKm?: number
  limit?: number
}
```

**Returns:**

```typescript
Array<City & { distance: number }>
```

---

### `queries/vibes.getPresets`

Gets all preset vibe categories.

**Arguments:**

```typescript
{
}
```

**Returns:**

```typescript
VibeCategory[]
```

---

### `queries/vibes.getById`

Gets a vibe by ID.

**Arguments:**

```typescript
{
  id: string
}
```

**Returns:**

```typescript
VibeCategory | null
```

---

### `queries/vibes.listByUser`

Lists custom vibes created by user.

**Arguments:**

```typescript
{
}
```

**Returns:**

```typescript
VibeCategory[]
```

---

### `queries/analysis.getParans`

Gets full paran data for a chart.

**Arguments:**

```typescript
{
  chartId: Id<'charts'>
}
```

**Returns:**

```typescript
{
  points: ParanPoint[]
  summary: ParanSummary
}
```

---

### `queries/analysis.getACGLines`

Gets full ACG line data for a chart.

**Arguments:**

```typescript
{
  chartId: Id<'charts'>
}
```

**Returns:**

```typescript
ACGLine[]
```

---

### `queries/analysis.getCityRankings`

Gets ranked cities for a chart.

**Arguments:**

```typescript
{
  chartId: Id<'charts'>
  limit?: number
  tier?: 'major' | 'medium' | 'minor' | 'small'
}
```

**Returns:**

```typescript
RankedCity[]
```

---

## Internal Actions

These are used internally and not exposed to the client.

### `internal/ephemeris.calculatePlanetPosition`

Calculates position for a single planet using Swiss Ephemeris.

### `internal/acg.calculateACGAndZenith`

Calculates ACG lines and zenith bands.

### `internal/parans.calculateParans`

Calculates all parans for a chart.

### `internal/dignity.calculateDignities`

Calculates essential dignities.

### `internal/geospatial.calculateOptimalBands`

Calculates optimal latitude bands.

### `internal/geospatial.scoreLocations`

Scores a batch of locations.

---

## Type Definitions

### `PlanetId`

```typescript
type PlanetId =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'
```

### `PlanetWeights`

```typescript
type PlanetWeights = Record<PlanetId, number>
```

### `EnhancedDeclination`

```typescript
interface EnhancedDeclination {
  value: number
  isOOB: boolean
  oobDegrees?: number
}
```

### `DignityScore`

```typescript
interface DignityScore {
  planet: PlanetId
  domicile: number // +5
  exaltation: number // +4
  triplicity: number // +3
  terms: number // +2
  face: number // +1
  detriment: number // -5
  fall: number // -4
  peregrine: number // -5
  total: number
  indicator: 'R' | 'E' | 'd' | 'f' | '-'
  breakdown: string[]
}
```

### `ZenithLine`

```typescript
interface ZenithLine {
  planet: PlanetId
  declination: number
  orbMin: number
  orbMax: number
}
```

### `ACGLine`

```typescript
interface ACGLine {
  planet: PlanetId
  lineType: 'ASC' | 'DSC' | 'MC' | 'IC'
  points: Array<{ latitude: number; longitude: number }>
  isCircumpolar?: boolean
}
```

### `ParanPoint`

```typescript
interface ParanPoint {
  planet1: PlanetId
  event1: AngularEvent
  planet2: PlanetId
  event2: AngularEvent
  latitude: number
  strength?: number
}
```

### `AngularEvent`

```typescript
type AngularEvent = 'rise' | 'set' | 'culminate' | 'anti_culminate'
```

### `VibeCategory`

```typescript
interface VibeCategory {
  id: string
  name: string
  description: string
  keywords: string[]
  primaryPlanets: PlanetId[]
  weights: PlanetWeights
}
```

### `RankedCity`

```typescript
interface RankedCity {
  city: City
  score: number
  breakdown: {
    zenith: number
    acg: number
    paran: number
  }
  safetyScore?: SafetyScore
  highlights: string[]
}
```

### `SafetyScore`

```typescript
interface SafetyScore {
  overall: number
  challengingPlacements: Array<{
    planet: PlanetId
    house: number
  }>
  difficultAspects: Array<{
    planet: PlanetId
    aspect: string
    target: 'ASC' | 'MC'
  }>
  weakDignity: Array<{
    planet: PlanetId
    score: number
  }>
  warnings: string[]
}
```

---

## Error Codes

| Code                | Description                                |
| ------------------- | ------------------------------------------ |
| `CHART_NOT_FOUND`   | Chart ID does not exist                    |
| `UNAUTHORIZED`      | User not authenticated or lacks permission |
| `INVALID_DATE`      | Birth date format invalid                  |
| `CITY_NOT_FOUND`    | City could not be geocoded                 |
| `CALCULATION_ERROR` | Ephemeris calculation failed               |
| `RATE_LIMITED`      | Too many requests                          |

---

## Rate Limits

| Endpoint               | Limit      |
| ---------------------- | ---------- |
| `calculateComplete`    | 10/minute  |
| `cities.search`        | 60/minute  |
| `vibes.matchFromQuery` | 30/minute  |
| Other queries          | 100/minute |
