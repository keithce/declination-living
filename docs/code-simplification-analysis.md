# Code Simplification Analysis

Analysis date: 2026-01-26

## Executive Summary

Thorough analysis of the Declination Living codebase identified **12 improvement opportunities** across the Convex backend (6 issues), frontend webapp (5 issues), and documentation (1 gap). The codebase is generally well-structured with good separation of concerns—issues are primarily around code duplication and large files that would benefit from splitting.

---

## Backend Analysis (Convex)

### Architecture Overview

- **59 TypeScript files** across calculations, cache, charts, cities, users, and presets
- **Well-structured tables** with proper validators and indices
- **Good security patterns**: Server-side user ID derivation, ownership checks

### Issues Identified

#### HIGH: Duplicate `eclipticToEquatorial` Function

| Location                         | Return Type                     | Notes                    |
| -------------------------------- | ------------------------------- | ------------------------ |
| `phase2_actions.ts:47-78`        | `{ra, dec}`                     | Hardcoded obliquity      |
| `coordinates/transform.ts:22-44` | `{rightAscension, declination}` | Parameterized, canonical |

**Impact**: Inconsistent calculations possible, maintenance burden
**Recommendation**: Remove duplicate from `phase2_actions.ts`

#### MEDIUM: Hardcoded Planet ID Lists

| Location         | Lines |
| ---------------- | ----- |
| `acg/actions.ts` | 57-68 |
| `optimizer.ts`   | 40-51 |

**Canonical source**: `core/types.ts:22-33` defines `PLANET_IDS`
**Recommendation**: Import from canonical source everywhere

#### MEDIUM: Degree/Radian Constants Inconsistency

| Location                  | Naming                       |
| ------------------------- | ---------------------------- |
| `phase2_actions.ts:34-35` | `DEG_TO_RAD`, `RAD_TO_DEG`   |
| `transform.ts:10-11`      | `toRad()`, `toDeg()` lambdas |
| `core/constants.ts:30-31` | `DEG_PER_RAD`, `RAD_PER_DEG` |

**Recommendation**: Standardize on `core/constants.ts` with helper functions

#### MEDIUM: Large Action File

`enhanced_actions.ts` is **665 lines** with 18+ functions mixing:

- Position calculations
- ACG line calculations
- Zenith calculations
- Paran calculations
- Dignity calculations
- Vibe search
- Geospatial operations

**Recommendation**: Split into focused modules under `convex/calculations/actions/`

#### MEDIUM: Cache Key Collision Risk

`analysisCache.ts:274-293` uses FNV-1a hash which is non-cryptographic.

**Assessment**: Low actual risk for cache deduplication use case. FNV-1a is sufficient—collisions are improbable for this input space.

#### LOW: No Scheduled Cache Cleanup

`cleanupExpiredCache()` is a public mutation requiring manual invocation.

**Recommendation**: Add `convex/crons.ts` for automated daily cleanup

---

## Frontend Analysis

### Architecture Overview

- **TanStack Start** with file-based routing
- **Convex integration** via `useQuery`, `useMutation`, `useAction`
- **Good patterns**: Memoization, SSR handling, component composition

### Issues Identified

#### HIGH: Inline SaveChartModal - **COMPLETE**

`calculator.tsx` is 461 lines with save modal inline (lines 233-332).

**Recommendation**: Extract to `components/calculator/SaveChartModal.tsx`

**Status**: Implemented in `src/components/calculator/SaveChartModal.tsx`

#### HIGH: Duplicate Format Functions

| Location                     | Function                              |
| ---------------------------- | ------------------------------------- |
| `DeclinationTable.tsx:37-43` | `formatDeclination()` - DMS style     |
| `shared/constants.ts:46-49`  | `formatDeclination()` - decimal style |

**Recommendation**: Consolidate in `shared/constants.ts` with distinct names

#### MEDIUM: Duplicate Planet Data

PLANETS array defined in 4 locations:

- `PlanetWeights.tsx:69-80`
- `DeclinationTable.tsx:17-28`
- `FloatingDataPanel.tsx:121-132`
- `index.tsx:22-93`

Canonical source exists: `lib/planet-constants.ts`

**Recommendation**: Import from canonical source everywhere

#### MEDIUM: Inconsistent Loading States

6+ different loading implementations:

- `CalculatorLoading()` custom function
- Inline `<Loader2 />` spinners
- `ui/Loading` component (exists but underused)

**Recommendation**: Standardize on `ui/Loading` component

#### LOW: Phase 2 Silent Failure - **COMPLETE**

`calculator.tsx:111` sets `setPhase2Data(null)` silently on error.

**Recommendation**: Add warning toast after implementing toast system

**Status**: Uses `toast.warning()` from sonner

---

## Documentation Analysis

### Strengths

- Clear `architecture.md` for high-level structure
- Good `convex.md` for patterns and validators
- Comprehensive phase documents for implementation

### Gaps

1. **No frontend component hierarchy** documented
2. **No data flow diagrams** showing calculation pipeline
3. **No UI/UX guidance** for layouts and workflows

---

## Improvement Priority Matrix

| Priority | Issue                                 | Risk   | Effort | Status   |
| -------- | ------------------------------------- | ------ | ------ | -------- |
| 1        | Remove duplicate eclipticToEquatorial | Low    | 30min  | Pending  |
| 2        | Consolidate degree/radian constants   | Low    | 20min  | Pending  |
| 3        | Use PLANET_IDS everywhere             | Low    | 20min  | Pending  |
| 4        | Extract SaveChartModal                | Low    | 1hr    | Complete |
| 5        | Consolidate format utilities          | Low    | 30min  | Pending  |
| 6        | Consolidate planet data               | Low    | 45min  | Pending  |
| 7        | Standardize loading states            | Low    | 45min  | Pending  |
| 8        | Split enhanced_actions.ts             | Medium | 3hr    | Pending  |
| 9        | Add scheduled cache cleanup           | Low    | 1hr    | Pending  |
| 10       | Create toast system                   | Medium | 2hr    | Complete |
| 11       | Add Phase 2 feedback                  | Low    | 30min  | Complete |
| 12       | Update documentation                  | Low    | 1hr    | Pending  |

---

## Implementation Recommendations

### Phase 1: Quick Wins (2-3 hours)

Items 1-3 above. Low risk, immediate code quality improvement.

### Phase 2: Frontend Consolidation (3-4 hours)

Items 4-7 above. Improves maintainability and consistency.

### Phase 3: Backend Refactoring (4-6 hours)

Items 8-9 above. Requires careful testing but improves architecture.

### Phase 4: Error Handling (2-3 hours)

Items 10-11 above. Improves user experience.

### Phase 5: Documentation (1-2 hours)

Item 12 above. Improves developer experience.

---

## Verification Strategy

After each phase:

1. Run `bun --bun run test` - All tests pass
2. Run `npx convex dev --once` - No Convex errors
3. Manual testing - Calculator flow works end-to-end
4. Visual check - Loading states and error displays consistent

---

## Files Summary

### Backend Files to Modify

- `convex/calculations/phase2_actions.ts`
- `convex/calculations/enhanced_actions.ts`
- `convex/calculations/core/constants.ts`
- `convex/calculations/coordinates/transform.ts`
- `convex/calculations/acg/actions.ts`
- `convex/calculations/optimizer.ts`
- `convex/cache/analysisCache.ts`

### Frontend Files to Modify

- `src/routes/calculator.tsx`
- `src/components/calculator/DeclinationTable.tsx`
- `src/components/calculator/PlanetWeights.tsx`
- `src/components/results/FloatingDataPanel.tsx`
- `src/components/results/shared/constants.ts`
- `src/lib/planet-constants.ts`

### Files to Create

- `convex/calculations/actions/*.ts` (7 modules)
- `convex/crons.ts`
- ~~`src/components/calculator/SaveChartModal.tsx`~~ - Created
- ~~`src/components/ui/Toaster.tsx`~~ - Using sonner's Toaster directly in `__root.tsx`
