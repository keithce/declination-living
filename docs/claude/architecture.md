# Architecture (Current)

_Last reconciled: February 22, 2026._

## Frontend (`src/`)

### Routing

TanStack file-based routes in `src/routes/`.

Primary routes:

- `/` landing
- `/calculator` interactive calculation flow + progressive enhanced visualization
- `/dashboard` saved charts list
- `/results/$chartId` saved chart detail (partial enhanced pipeline)
- `/chart/$slug` shared chart (legacy lightweight visualization path)
- `/why` educational content

### Globe/Visualization Stack

The app currently uses a **custom Three.js implementation**, not `three-globe`, for the enhanced globe path.

Key files:

- `src/components/globe/EnhancedGlobeCanvas.tsx` scene orchestration, layer lifecycle, controls
- `src/components/globe/layers/*.ts` ACG, zenith, parans, heatmap, city markers
- `src/components/globe/shaders/*.ts` earth + atmosphere custom shaders and texture loading
- `src/components/results/FullPageGlobeLayout.tsx` immersive full-screen globe layout for calculator results

Legacy path still exists for shared charts:

- `src/components/globe/GlobeView.tsx` / `src/components/globe/GlobeCanvas.tsx`

### State and Data Flow

- Calculator UI state: `src/stores/calculator-store.ts` (persisted Zustand store)
- Globe controls/state: `src/components/globe/hooks/useGlobeState.ts`
- Progressive result loading: `src/hooks/useProgressiveVisualization.ts`

Calculator flow:

1. Submit birth data and weights
2. Run core calculate action
3. Progressive queries load zenith, ACG, parans, scoring grid, ranked cities
4. Render/update globe layers incrementally

## Backend (`convex/`)

### Core Modules

- `convex/calculations/actions.ts` core declinations + latitude optimization
- `convex/calculations/enhanced_actions.ts` enhanced pipeline orchestration
- `convex/calculations/acg/actions.ts` cached ACG/zenith public action
- `convex/calculations/parans/actions.ts` cached paran public action
- `convex/calculations/zenith/actions.ts` zenith-only actions
- `convex/calculations/geospatial/actions.ts` scoring grid + ranked city actions

### Data Modules

- `convex/charts/queries.ts`, `convex/charts/mutations.ts`
- `convex/cache/analysisCache.ts`
- `convex/cities/queries.ts`
- `convex/presets/queries.ts`

### Caching

- Internal analysis cache table (`calculationCache`) for selective server-side reuse
- `ActionCache` wrappers for expensive public actions (ACG/parans/scoring/city ranking/enhanced pipelines)

## Known Gaps

- `src/routes/results.$chartId.tsx` still has TODO placeholders for ACG lines and ranked cities.
- `src/routes/chart.$slug.tsx` uses derived/mock visual summary data instead of full enhanced analysis.
- Enhanced and legacy globe paths coexist; migration is in progress.
