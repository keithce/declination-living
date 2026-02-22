# Phase 5: Recommendations and Geospatial Ranking (Reconciled)

_Last reconciled: February 22, 2026._

## Scope In Code

- Vibe mapping and query translation:
  - `convex/calculations/vibes/translator.ts`
  - `convex/calculations/vibes/index.ts`
- Geospatial ranking and optimization:
  - `convex/calculations/geospatial/ranking.ts`
  - `convex/calculations/geospatial/optimizer.ts`
  - `convex/calculations/geospatial/actions.ts`
- Safety checks:
  - `convex/calculations/safety/filter.ts`

## Validation

- `convex/calculations/geospatial/__tests__/ranking.test.ts`
- `convex/calculations/geospatial/__tests__/scoring.test.ts`
- `convex/calculations/vibes/__tests__/categories.test.ts`

## Current Notes

- Recommendation scoring and ranked-city generation are implemented in backend actions.
- Frontend parity differs by route; calculator flow is progressive and richer than saved/shared routes today.
