# Phase 1: Ephemeris Foundation (Reconciled)

_Last reconciled: February 22, 2026._

## Scope In Code

Phase 1 foundations are implemented primarily in:

- `convex/calculations/ephemeris.ts`
- `convex/calculations/ephemeris/index.ts`
- `convex/calculations/ephemeris/julian.ts`
- `convex/calculations/ephemeris/swissephService.ts`
- `convex/calculations/coordinates/transform.ts`

## Validation

- `convex/calculations/ephemeris/__tests__/julian.test.ts`
- `convex/calculations/ephemeris/__tests__/oob.test.ts`
- `convex/calculations/coordinates/__tests__/transform.test.ts`

## Current Notes

- Timezone-aware Julian conversion is in active use via `dateToJulianDay`.
- Ephemeris and coordinate conversion are stable dependencies for ACG, parans, and geospatial scoring layers.
- This phase is considered implemented for current production behavior.
