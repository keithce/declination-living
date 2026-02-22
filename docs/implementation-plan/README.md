# Declination Living Implementation Plan (Reconciled)

_Last reconciled: February 22, 2026._

## Purpose

This folder tracks implementation status against the original multi-phase plan. It is now a **living implementation reference**, not a promise that every historical phase document is fully shipped.

## Current Status Snapshot

Implemented in production code:

- Core declination calculations and latitude optimization (`convex/calculations/actions.ts`)
- Enhanced calculation pipeline with ACG, parans, dignities, vibes, safety, and geospatial search (`convex/calculations/enhanced_actions.ts`)
- Cached domain actions for ACG, parans, scoring grid, and city ranking
- Custom Three.js globe pipeline with layered rendering (`src/components/globe/EnhancedGlobeCanvas.tsx`)
- Progressive results flow in calculator route (`src/routes/calculator.tsx`)

Partially implemented / still in progress:

- Saved-chart enhanced visualization parity in `src/routes/results.$chartId.tsx` (contains explicit TODOs for ACG/city-ranking wiring)
- Shared-chart route still uses legacy lightweight globe path in `src/routes/chart.$slug.tsx`
- Some historical docs still describe aspirational milestones; use this file and `docs/claude/architecture.md` for current architecture

## How To Read This Folder

- `phase-1-ephemeris.md` through `phase-6-ui.md`: historical phased execution guides
- `api-reference.md`: reconciled with current Convex namespaces (`api.calculations.*`, `api.charts.*`, `api.cache.*`)
- `testing-strategy.md` and `performance.md`: guidance docs, not release gates by themselves

## Source Of Truth

For shipped behavior, prioritize:

1. Runtime code under `src/` and `convex/`
2. Generated API types in `convex/_generated/api.d.ts`
3. Reconciled architecture docs in `docs/claude/architecture.md`

Historical plan docs are retained for context, but should not be treated as completion evidence without checking code.
