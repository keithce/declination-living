/**
 * Paran calculation module exports.
 *
 * Phase 3 implementation: high-precision paran finding with modular architecture.
 */

// Core paran functionality (new modular API)
export * from './events'
export * from './bisection'
export * from './catalog'

// Backward compatible exports from solver (legacy API that takes ParanPoint[] arrays)
// These are explicitly named to avoid conflicts with catalog.ts exports
export {
  // Main calculation function (backward compatible wrapper)
  calculateAllParans,
  // Re-exports from catalog with different names
  calculateAllParansNew,
  getParanStatistics,
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
