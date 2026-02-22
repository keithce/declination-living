# API Reference (Reconciled)

_Last reconciled: February 22, 2026._

This document lists the **current callable Convex API namespaces** used by the app. Names are aligned with `convex/_generated/api.d.ts`.

## Calculations

### Core actions (`api.calculations.actions.*`)

- `calculateBirthDeclinations`
- `findOptimalLatitudesAction`
- `scoreCitiesAction`
- `getOptimalBandsAction`
- `calculateComplete`
- `recalculateWithWeights`

### Enhanced actions (`api.calculations.enhanced_actions.*`)

- `calculateEnhancedPositions`
- `calculateACGLinesAction`
- `findACGLinesNearLocationAction`
- `calculateZenithLinesAction`
- `calculateParansAction`
- `calculateDignitiesAction`
- `searchByVibeAction`
- `getVibeWeightsAction`
- `checkLocationSafetyAction`
- `calculateCompleteEnhanced`
- `generateSearchBandsAction`

### Domain actions

- `api.calculations.acg.actions.calculateACGAndZenithPublic`
- `api.calculations.zenith.actions.calculateZenithLines`
- `api.calculations.zenith.actions.calculateZenithLinesFromDeclinations`
- `api.calculations.parans.actions.calculateParansFromBirthData`
- `api.calculations.geospatial.actions.calculateScoringGrid`
- `api.calculations.geospatial.actions.rankTopCities`
- `api.calculations.batch.actions.calculateAllVisualizationData`

## Charts

### Queries (`api.charts.queries.*`)

- `listMine`
- `getById`
- `getByShareSlug`

### Mutations (`api.charts.mutations.*`)

- `create`
- `update`
- `remove`
- `generateShareSlug`

## Cache

### Analysis cache (`api.cache.analysisCache.*`)

- Queries: `getCachedResult`, `getByChart`
- Mutations: `setCachedResult`, `cleanupExpiredCache`, `clearUserCache`

Notes:

- Internal helpers like `getCachedResultInternal` / `setCachedResultInternal` exist but are not frontend-callable.
- `getByChart` is used by saved-chart results to load precomputed analysis data when available.

## Cities and Presets

### Cities (`api.cities.queries.*`)

- `search`
- `getByLatitudeRange`
- `getById`
- `getManyByIds`

### Presets (`api.presets.queries.*`)

- `list`

## Current Route Usage

- Calculator route (`src/routes/calculator.tsx`) uses `api.calculations.actions.calculateComplete` and `api.calculations.actions.recalculateWithWeights`, then progressively loads domain actions.
- Saved results route (`src/routes/results.$chartId.tsx`) reads `api.charts.queries.getById` and `api.cache.analysisCache.getByChart`.
- Shared route (`src/routes/chart.$slug.tsx`) uses `api.charts.queries.getByShareSlug`.
