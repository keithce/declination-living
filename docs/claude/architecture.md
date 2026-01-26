# Architecture

## Frontend (`src/`)

### Routes

TanStack Router file-based routing in `src/routes/`. Root layout at `__root.tsx`, routes auto-generate `routeTree.gen.ts`.

Key routes:

- `/` - Landing page
- `/calculator` - Main calculation flow
- `/dashboard` - User's saved charts
- `/chart/:slug` - Shared chart view

### Component Hierarchy

```text
src/components/
├── calculator/           # Calculator flow components
│   ├── BirthDataForm.tsx    # Step 1: Birth data input
│   ├── PlanetWeights.tsx    # Step 2: Weight adjustment
│   └── SaveChartModal.tsx   # Save chart dialog
├── globe/                # 3D globe visualization
│   ├── GlobeVisualization.tsx  # Main globe component
│   └── hooks/useGlobeState.ts  # Globe interaction state
├── results/              # Results display
│   ├── FullPageGlobeLayout.tsx # Main results layout
│   ├── FloatingDataPanel.tsx   # Collapsible data panel
│   ├── ResultsTabs.tsx         # ACG/Zenith/Paran tabs
│   └── shared/constants.ts     # Shared formatters
├── ui/                   # shadcn/ui components
└── Header.tsx            # Site header
```

### Shared Constants

Planet display data is centralized in `src/lib/planet-constants.ts`:

- `PLANET_COLORS` - Hex colors for each planet
- `PLANET_SYMBOLS` - Unicode symbols (☉, ☽, ☿, etc.)
- `PLANET_NAMES` - Display names
- `PLANETS` - Combined array for iteration

## Backend (`convex/`)

### Schema

Tables defined in `convex/schema.ts`:

- `charts` - User's saved charts
- `cities` - City database
- `presets` - Weight presets
- `profiles` - User profiles
- `calculationCache` - Cached analysis results
- `anonymousUsers` - Anonymous session tracking

### Calculations (`convex/calculations/`)

```text
calculations/
├── core/
│   ├── types.ts        # PLANET_IDS, coordinate types
│   └── constants.ts    # Astronomical constants, toRadians/toDegrees
├── coordinates/
│   ├── transform.ts    # Ecliptic ↔ Equatorial conversion
│   ├── sda.ts          # Semi-diurnal arc calculations
│   └── hour_angle.ts   # Hour angle utilities
├── acg/
│   ├── line_solver.ts  # ACG line generation
│   ├── zenith.ts       # Zenith line calculation
│   └── actions.ts      # Cached ACG/Zenith action
├── parans/
│   └── solver.ts       # Paran point calculation
├── dignity/
│   └── calculator.ts   # Essential dignities
├── geospatial/
│   ├── grid.ts         # Scoring grid generation
│   └── search.ts       # Location search
├── ephemeris.ts        # Core position calculations
├── optimizer.ts        # Latitude scoring
├── actions.ts          # Phase 1 actions
├── phase2_actions.ts   # Phase 2 (ACG/Paran/Grid) actions
└── enhanced_actions.ts # Combined analysis pipeline
```

### Calculation Pipeline

**Phase 1 (Core)** - `actions.ts`:

1. Calculate Julian Day from birth date/time
2. Calculate planetary positions (astronomia/VSOP87)
3. Extract declinations
4. Score latitudes against declinations
5. Return optimal latitudes and bands

**Phase 2 (Enhanced)** - `phase2_actions.ts`:

1. Convert ecliptic → equatorial coordinates
2. Generate ACG lines (ASC/DSC/MC/IC per planet)
3. Calculate zenith lines (declination bands)
4. Find paran points (planet conjunctions at angles)
5. Generate scoring grid for visualization

### Caching

Results are cached in `calculationCache` table for 24 hours to optimize performance. Cache keys include birth data + weights hash.

## Data Flow

```text
User Input → BirthDataForm
    ↓
PlanetWeights (adjust influence)
    ↓
calculateComplete (Phase 1)
    ↓
calculatePhase2Complete (Phase 2)
    ↓
FullPageGlobeLayout
    ├── GlobeVisualization (ACG lines, zenith bands)
    └── FloatingDataPanel (declinations, scores, parans)
```

## Error Handling

- Toast notifications via `sonner` library
- Phase 2 failures show warning toast, don't block Phase 1 results
- Save failures show error toast

## Environment Variables

- Client-side: Must have `VITE_` prefix, defined in `src/env.ts` with T3Env
- Convex: Only `VITE_CONVEX_URL` is required in `.env.local` for frontend usage
- Note: `CONVEX_DEPLOYMENT` is used by the Convex CLI, not the frontend application
