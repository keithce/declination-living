/**
 * Shared validators for planet data.
 *
 * Canonical source for planet-related validators used across Convex actions.
 */

import { v } from 'convex/values'

// =============================================================================
// Planet ID Validator
// =============================================================================

/**
 * Validator for planet identifiers.
 */
export const planetIdValidator = v.union(
  v.literal('sun'),
  v.literal('moon'),
  v.literal('mercury'),
  v.literal('venus'),
  v.literal('mars'),
  v.literal('jupiter'),
  v.literal('saturn'),
  v.literal('uranus'),
  v.literal('neptune'),
  v.literal('pluto'),
)

// =============================================================================
// Planet Weights Validator
// =============================================================================

/**
 * Validator for planet weight configuration.
 * Used in calculations to weight each planet's influence.
 */
export const planetWeightsValidator = v.object({
  sun: v.number(),
  moon: v.number(),
  mercury: v.number(),
  venus: v.number(),
  mars: v.number(),
  jupiter: v.number(),
  saturn: v.number(),
  uranus: v.number(),
  neptune: v.number(),
  pluto: v.number(),
})

// =============================================================================
// Planet Declinations Validator
// =============================================================================

/**
 * Validator for planet declination values.
 * Used when passing pre-calculated declinations between actions.
 */
export const planetDeclinationsValidator = v.object({
  sun: v.number(),
  moon: v.number(),
  mercury: v.number(),
  venus: v.number(),
  mars: v.number(),
  jupiter: v.number(),
  saturn: v.number(),
  uranus: v.number(),
  neptune: v.number(),
  pluto: v.number(),
})

// =============================================================================
// Angular Event Validator
// =============================================================================

/**
 * Validator for angular event types (rise, set, culminate, anti-culminate).
 */
export const angularEventValidator = v.union(
  v.literal('rise'),
  v.literal('set'),
  v.literal('culminate'),
  v.literal('anti_culminate'),
)

// =============================================================================
// Paran Validators
// =============================================================================

/**
 * Validator for a single paran point.
 */
export const paranPointValidator = v.object({
  planet1: planetIdValidator,
  event1: angularEventValidator,
  planet2: planetIdValidator,
  event2: angularEventValidator,
  latitude: v.number(),
  strength: v.optional(v.number()),
})

/**
 * Validator for paran summary statistics.
 */
export const paranSummaryValidator = v.object({
  riseRise: v.number(),
  riseCulminate: v.number(),
  riseSet: v.number(),
  culminateCulminate: v.number(),
  culminateSet: v.number(),
  setSet: v.number(),
  total: v.number(),
})

/**
 * Validator for complete paran result.
 */
export const paranResultValidator = v.object({
  points: v.array(paranPointValidator),
  summary: paranSummaryValidator,
})

/**
 * Validator for paran statistics.
 */
export const paranStatisticsValidator = v.object({
  total: v.number(),
  averageStrength: v.number(),
  medianStrength: v.number(),
  latitudeRange: v.object({ min: v.number(), max: v.number() }),
  strongestParan: v.union(paranPointValidator, v.null()),
  byHemisphere: v.object({ northern: v.number(), southern: v.number() }),
})

// =============================================================================
// Equatorial Position Validator
// =============================================================================

/**
 * Convex schema validator for equatorial position (structural check only).
 * Validates: planetId is valid, ra/dec exist and are numbers.
 *
 * NOTE: Does NOT enforce numeric ranges. Callers performing calculations
 * should also call validateEquatorialPosition(ra, dec) for range validation.
 */
export const equatorialPositionValidator = v.object({
  planetId: planetIdValidator,
  ra: v.number(),
  dec: v.number(),
})

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate equatorial position values are within valid ranges.
 * RA: 0-360 degrees, Dec: -90 to +90 degrees
 *
 * @throws Error if values are out of range
 */
export function validateEquatorialPosition(ra: number, dec: number): void {
  if (ra < 0 || ra > 360) {
    throw new Error(`Right Ascension must be 0-360 degrees, got ${ra}`)
  }
  if (dec < -90 || dec > 90) {
    throw new Error(`Declination must be -90 to +90 degrees, got ${dec}`)
  }
}

// =============================================================================
// Zodiac Sign Validator
// =============================================================================

/**
 * Validator for zodiac signs.
 */
export const zodiacSignValidator = v.union(
  v.literal('aries'),
  v.literal('taurus'),
  v.literal('gemini'),
  v.literal('cancer'),
  v.literal('leo'),
  v.literal('virgo'),
  v.literal('libra'),
  v.literal('scorpio'),
  v.literal('sagittarius'),
  v.literal('capricorn'),
  v.literal('aquarius'),
  v.literal('pisces'),
)

// =============================================================================
// Sect Validator
// =============================================================================

/**
 * Validator for chart sect (day or night).
 */
export const sectValidator = v.union(v.literal('day'), v.literal('night'))

// =============================================================================
// Dignity Validators
// =============================================================================

/**
 * Validator for complete dignity score.
 */
export const dignityScoreValidator = v.object({
  planet: planetIdValidator,
  domicile: v.number(),
  exaltation: v.number(),
  triplicity: v.number(),
  terms: v.number(),
  face: v.number(),
  detriment: v.number(),
  fall: v.number(),
  peregrine: v.number(),
  total: v.number(),
  breakdown: v.array(v.string()),
})

/**
 * Validator for dignity indicator characters.
 * R=Ruler, E=Exalted, d=Detriment, f=Fall, -=Peregrine
 */
export const dignityIndicatorValidator = v.union(
  v.literal('R'),
  v.literal('E'),
  v.literal('d'),
  v.literal('f'),
  v.literal('-'),
)

/**
 * Validator for simplified dignity (total + indicator).
 */
export const simplifiedDignityValidator = v.object({
  total: v.number(),
  indicator: dignityIndicatorValidator,
})

/**
 * Validator for term system selection.
 */
export const termSystemValidator = v.union(v.literal('egyptian'), v.literal('ptolemaic'))

// =============================================================================
// Grid Options Validator
// =============================================================================

/**
 * Validator for grid calculation options.
 * Used in Phase 2 actions for scoring grid generation.
 */
export const gridOptionsValidator = v.optional(
  v.object({
    latStep: v.optional(v.number()),
    lonStep: v.optional(v.number()),
    latMin: v.optional(v.number()),
    latMax: v.optional(v.number()),
    lonMin: v.optional(v.number()),
    lonMax: v.optional(v.number()),
    acgOrb: v.optional(v.number()),
    paranOrb: v.optional(v.number()),
  }),
)
