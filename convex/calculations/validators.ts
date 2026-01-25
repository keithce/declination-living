/**
 * Shared validators for planet data.
 *
 * Canonical source for planet-related validators used across Convex actions.
 */

import { v } from 'convex/values'

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
