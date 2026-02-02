# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Astrology app for planetary declinations and location matching. Calculates ACG (Astro*Carto*Graphy) lines, zenith bands, and paran points to find optimal geographic locations based on birth chart data.

## Commands

```bash
# Development (run in parallel)
bun --bun run dev          # Frontend on :3000
npx convex dev             # Backend (Convex)

# Build & Test
bun --bun run build
bun --bun run test
bun --bun run test <pattern>   # Single test: bun --bun run test zenith

# Lint/Format
bun --bun run check            # Format + lint
bun --bun run typecheck        # TypeScript only
```

## Architecture

**Stack:** TanStack Start (Vite + React 19) + Convex + Tailwind v4 + shadcn/ui

**Frontend (`src/`):**
- File-based routing via TanStack Router in `src/routes/`
- Main flow: `/calculator` → birth data → planet weights → results with 3D globe
- Globe visualization using `three-globe` with ACG lines, zenith bands
- Planet constants centralized in `src/lib/planet-constants.ts`

**Backend (`convex/`):**
- All calculations server-side in Convex actions
- Two-phase pipeline: Phase 1 (core positions/declinations) → Phase 2 (ACG/Parans/Grid)
- Astronomical calculations use `astronomia` (VSOP87) + `sweph-wasm` (Swiss Ephemeris)
- Aggressive caching via `@convex-dev/action-cache` (30-day TTL for most results)

**Calculation modules:**
- `convex/calculations/ephemeris/` - Planetary positions, Julian Day, OOB detection
- `convex/calculations/acg/` - ACG line generation, zenith lines
- `convex/calculations/parans/` - Paran point calculation
- `convex/calculations/coordinates/` - Ecliptic↔Equatorial transforms, SDA
- `convex/calculations/dignity/` - Essential dignities scoring
- `convex/calculations/geospatial/` - Location scoring grids, city ranking

**Core types:** `convex/calculations/core/types.ts` defines `PlanetId`, coordinate interfaces, ACG/Paran types

## Key Patterns

- **Validators:** Convex validators in `convex/calculations/validators.ts`; reuse for schema and function args
- **Index naming:** Use `by_*` prefix (e.g., `by_user`, `by_cache_key`)
- **Add shadcn components:** `bunx --bun shadcn@latest add <component>`
- **Environment variables:** Client-side must have `VITE_` prefix, defined in `src/env.ts`

## Detailed Docs

- [Architecture](./docs/claude/architecture.md) - Component hierarchy, data flow, caching strategy
- [Convex Patterns](./docs/claude/convex.md) - Schema patterns, validator reference
- [Styling](./docs/claude/styling.md) - Tailwind v4, shadcn/ui (new-york style, zinc base)
