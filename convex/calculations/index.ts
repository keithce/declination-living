/**
 * Celestial Sphere Engineering - Main Module Exports
 *
 * This module provides comprehensive astrology calculations including:
 * - Ephemeris calculations (planetary positions, speeds, OOB detection)
 * - ACG (Astro*Carto*Graphy) lines
 * - Paran calculations
 * - Essential dignity scoring
 * - Vibe-based search
 * - Geospatial optimization
 * - Safety analysis
 */

// Core types and utilities
export * from "./core/types"
export * from "./core/constants"
export * from "./core/math"

// Coordinate calculations
export * from "./coordinates/hour-angle"
export * from "./coordinates/sda"
export * from "./coordinates/geocentric"

// Ephemeris
export { dateToJulianDay, calculateAllPositions, calculateDeclinations } from "./ephemeris"
export * from "./ephemeris/speed"
export * from "./ephemeris/oob"

// ACG lines
export * from "./acg/zenith"
export * from "./acg/line-solver"

// Parans
export * from "./parans/solver"

// Essential dignity
export * from "./dignity/tables"
export * from "./dignity/terms"
export * from "./dignity/decans"
export * from "./dignity/calculator"

// Vibe search
export * from "./vibes/translator"

// Geospatial search
export * from "./geospatial/search"

// Safety filter
export * from "./safety/filter"

// Optimizer (existing)
export {
  calculateAlignmentScore,
  calculateLatitudeScore,
  findOptimalLatitudes,
  scoreCities,
  getOptimalLatitudeBands,
} from "./optimizer"
