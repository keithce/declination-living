# Declination Living - Complete Implementation Plan

## Overview

This multi-phase plan transforms the current rudimentary implementation into a comprehensive planetary declination and relocation astrology application. The plan is based on the theoretical foundation in `Declination_Living_Theory.md` and the detailed technical specifications in the two PDF documents.

## Current State Assessment

### What's Already Built

**Backend (Convex)**:
- Basic schema with charts, cities, analysis cache, vibes, presets
- Calculation modules structure in `convex/calculations/`
- Authentication tables via @convex-dev/auth
- City database with population tiers and timezone support

**Frontend**:
- TanStack Start router setup
- Basic calculator page with 3-step flow (birth data → weights → results)
- 3D globe visualization with three-globe
- shadcn/ui component integration

**Types & Interfaces**:
- Comprehensive type definitions in `core/types.ts`
- Planet IDs, coordinate types, ACG/Paran/Dignity structures defined

### Gap Analysis

| Feature | PDF Spec | Current State | Gap |
|---------|----------|---------------|-----|
| Swiss Ephemeris | Full WASM integration with lazy-loading | Basic stub/placeholder | **Major** |
| ACG Line Solver | Circumpolar handling, 361-point resolution | Skeleton implementation | **Major** |
| Paran Solver | Bisection method, ±10⁻⁶ precision | Not implemented | **Critical** |
| Dignity Engine | Full essential dignity with bounds | Basic structure only | **Major** |
| OOB Detection | Dynamic obliquity calculation | Flag in types | **Minor** |
| Vibe Search | NLP keywords, weighted scoring | Schema exists | **Moderate** |
| Safety Filter | House/aspect warnings | Types defined only | **Major** |
| UI Results | Full analysis display | Minimal globe view | **Critical** |
| Heatmaps | Latitude-longitude scoring grid | Not implemented | **Major** |
| City Recommendations | Ranked list with details | Top locations array | **Moderate** |

## Plan Structure

This implementation plan is divided into 6 phases across 11 detailed documents:

### Phase Documents

1. **[Phase 1: Ephemeris Foundation](./phase-1-ephemeris.md)** (Weeks 1-2)
   - Swiss Ephemeris WASM integration
   - Julian Day calculations
   - Coordinate transformations
   - Obliquity computation

2. **[Phase 2: Core Calculations](./phase-2-calculations.md)** (Weeks 3-4)
   - ACG line solver with circumpolar handling
   - Zenith line calculations
   - OOB planet detection
   - Semi-diurnal arc computations

3. **[Phase 3: Paran System](./phase-3-parans.md)** (Weeks 5-6)
   - Paran bisection solver
   - Event time calculations
   - Paran point cataloging
   - Strength scoring

4. **[Phase 4: Dignity Engine](./phase-4-dignities.md)** (Week 7)
   - Sign position calculations
   - Essential dignity tables
   - Sect determination
   - Composite scoring

5. **[Phase 5: Recommendation System](./phase-5-recommendations.md)** (Weeks 8-9)
   - Vibe category matching
   - Geospatial optimization
   - Safety filter implementation
   - City ranking algorithm

6. **[Phase 6: UI Enhancement](./phase-6-ui.md)** (Weeks 10-12)
   - Results dashboard
   - Interactive globe layers
   - Heatmap visualization
   - City detail cards

### Supporting Documents

- **[Database Schema Updates](./schema-updates.md)** - Required Convex schema changes
- **[Type Definitions](./type-definitions.md)** - New and updated TypeScript interfaces
- **[Testing Strategy](./testing-strategy.md)** - Unit, integration, and E2E test plans
- **[API Reference](./api-reference.md)** - All Convex actions and queries
- **[Performance Considerations](./performance.md)** - Optimization strategies

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | TanStack Start + React 19 | SSR/SPA framework |
| Styling | Tailwind CSS v4 + shadcn/ui | UI components |
| 3D Visualization | three-globe + Three.js | Globe rendering |
| Backend | Convex | Real-time database & functions |
| Ephemeris | swisseph-wasm | Planetary calculations |
| Geocoding | Geoapify | City search & coordinates |
| Auth | @convex-dev/auth | Anonymous + authenticated users |

## Success Metrics

1. **Accuracy**: All calculations within 0.01° of reference ephemeris
2. **Performance**: Full chart calculation < 500ms
3. **Coverage**: 10,000+ cities in database
4. **Completeness**: All PDF-specified features implemented
5. **User Experience**: Results displayed in < 2 seconds

## Quick Start

```bash
# Development
bun --bun run dev        # Frontend
npx convex dev           # Backend

# Testing
bun --bun run test       # Unit tests
bun --bun run check      # Lint + format
```

## File Structure (After Implementation)

```
src/
├── routes/
│   ├── calculator.tsx          # Enhanced calculator
│   ├── results.$chartId.tsx    # Full results page
│   └── explore.tsx             # Location explorer
├── components/
│   ├── calculator/             # Multi-step form components
│   ├── globe/                  # 3D visualization
│   │   ├── GlobeContainer.tsx
│   │   ├── layers/
│   │   │   ├── ZenithLayer.tsx
│   │   │   ├── ACGLayer.tsx
│   │   │   ├── ParanLayer.tsx
│   │   │   └── HeatmapLayer.tsx
│   │   └── controls/
│   ├── results/                # Results display
│   │   ├── DeclinationTable.tsx
│   │   ├── DignityScores.tsx
│   │   ├── ParanList.tsx
│   │   └── CityRankings.tsx
│   └── ui/                     # shadcn components
convex/
├── calculations/
│   ├── core/
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── ephemeris/
│   │   ├── swisseph.ts         # WASM wrapper
│   │   ├── julianDay.ts
│   │   └── coordinates.ts
│   ├── acg/
│   │   ├── solver.ts           # Main ACG solver
│   │   └── circumpolar.ts
│   ├── parans/
│   │   ├── bisection.ts        # Paran solver
│   │   └── events.ts
│   ├── dignity/
│   │   ├── engine.ts
│   │   └── tables.ts
│   ├── geospatial/
│   │   ├── scoring.ts
│   │   └── heatmap.ts
│   ├── safety/
│   │   └── filter.ts
│   └── vibes/
│       ├── matcher.ts
│       └── presets.ts
├── actions/
│   └── calculate.ts            # Main action entry
├── queries/
│   ├── charts.ts
│   ├── cities.ts
│   └── vibes.ts
└── schema.ts
```

## Next Steps

1. Review each phase document in order
2. Start with Phase 1 ephemeris integration
3. Complete each phase before moving to the next
4. Run tests at each phase boundary
5. Deploy incrementally to staging

---

*Plan created: January 2026*
*Target completion: March 2026*
