# Testing Strategy (Reconciled)

_Last reconciled: February 22, 2026._

## Test Commands

- `bun run test`
- `bun run typecheck`
- `bun run build`
- `bun run docs:check`

## Backend Calculation Coverage

Primary suites live under `convex/calculations/`:

- `convex/calculations/acg/__tests__/`
- `convex/calculations/parans/__tests__/`
- `convex/calculations/dignity/__tests__/`
- `convex/calculations/geospatial/__tests__/`
- `convex/calculations/ephemeris/__tests__/`
- Integration flow tests in `convex/calculations/__tests__/`

## Frontend Validation

Frontend correctness is currently enforced by TypeScript + route behavior checks and integration with Convex action outputs.

Focus areas for manual QA:

- Globe layer toggles and slider behavior
- City marker lifecycle and highlighting
- Saved route and shared route behavior differences
- Mobile panel interactions in the calculator results view

## Benchmark Policy

Performance checks in `convex/calculations/__tests__/calculation_flow.test.ts` are retained as hard guards where stable, with CI-skipping behavior to avoid environment-specific timing flakes.
