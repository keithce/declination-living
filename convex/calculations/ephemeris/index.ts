/**
 * Ephemeris module exports.
 */

export * from './speed'
export * from './oob'
export * from './julian'
// Explicitly export from oobCalculator to avoid conflicts with oob
export {
  checkOutOfBounds,
  checkAllOutOfBounds,
  getOOBPlanets as getOOBPlanetsEnhanced,
  OOB_INTERPRETATIONS,
  PLANET_MAX_DECLINATIONS,
  type OOBResult,
  type EnhancedOOBResult,
} from './oobCalculator'
export * from './swissephService'
