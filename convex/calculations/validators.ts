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

// =============================================================================
// Equatorial Position Validator
// =============================================================================

/**
 * Validator for equatorial position input (for paran calculations).
 */
export const equatorialPositionValidator = v.object({
  planetId: planetIdValidator,
  ra: v.number(),
  dec: v.number(),
})
