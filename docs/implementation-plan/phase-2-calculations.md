# Phase 2: Core Calculations (Reconciled)

_Last reconciled: February 22, 2026._

## Scope In Code

Phase 2 calculations are implemented in:

- `convex/calculations/acg/line_solver.ts`
- `convex/calculations/acg/zenith.ts`
- `convex/calculations/parans/solver.ts`
- `convex/calculations/geospatial/search.ts`
- `convex/calculations/geospatial/grid.ts`

## Actions and Delivery

- `convex/calculations/acg/actions.ts`
- `convex/calculations/parans/actions.ts`
- `convex/calculations/zenith/actions.ts`
- `convex/calculations/geospatial/actions.ts`

## Validation

- `convex/calculations/acg/__tests__/line_solver.test.ts`
- `convex/calculations/acg/__tests__/zenith.test.ts`
- `convex/calculations/parans/__tests__/events.test.ts`
- `convex/calculations/geospatial/__tests__/scoring.test.ts`
- `convex/calculations/__tests__/calculation_flow.test.ts`

## Current Notes

- Core math modules are implemented and tested.
- Some route-level consumption remains partial (notably saved/shared result route parity), tracked in architecture docs.
