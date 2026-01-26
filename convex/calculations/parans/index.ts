/**
 * Paran calculation module exports.
 *
 * Phase 3 implementation: high-precision paran finding with modular architecture.
 */

// Events module - event time calculations
export {
  calculateRiseTime,
  calculateSetTime,
  calculateCulminateTime,
  calculateAntiCulminateTime,
  calculateAllEventTimes,
  calculateEventTime,
  lstDifference,
  lstAbsDifference,
  type EventTime,
} from './events'

// Bisection module - paran latitude finding
export {
  findParanLatitude,
  findAllParansForPair,
  calculateParanStrength,
  type PlanetData,
  type ParanSearchResult,
} from './bisection'

// Catalog module - paran catalog generation and querying
export {
  findAllParans,
  getTopParans,
  getParansForPlanet,
  getParansAtLatitude,
  getParansByEvent,
  getParansByStrength,
  groupParansByLatitude,
  groupParansByPlanetPair,
  groupParansByEventType,
  getParanStatistics,
  type PlanetPosition,
} from './catalog'

// Backward compatible exports from solver (legacy API that takes ParanPoint[] arrays)
// These are explicitly named to avoid conflicts with catalog.ts exports
export {
  // Main calculation function (backward compatible wrapper)
  calculateAllParans,
  // Re-exports from catalog with different names
  calculateAllParansNew,
  // Legacy query functions (take ParanPoint[] arrays)
  getParansNearLatitude,
  getParansForPlanet as getParansForPlanetLegacy,
  getParansByEvent as getParansByEventLegacy,
  getStrongestParans,
  groupParansByLatitudeBand,
  // Description utilities
  describeParan,
  getParanKeywords,
  // Types
  type ParanInput,
  type DetailedParanPoint,
} from './solver'

// Note: Convex actions are accessed via internal API, not re-exported here
