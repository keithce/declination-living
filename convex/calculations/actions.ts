"use node"

import { action } from "../_generated/server"
import { v } from "convex/values"
import {
  dateToJulianDay,
  calculateDeclinations,
  type PlanetDeclinations,
} from "./ephemeris"
import {
  findOptimalLatitudes,
  scoreCities,
  getOptimalLatitudeBands,
  type LatitudeScore,
  type CityScore,
} from "./optimizer"

const planetWeightsValidator = v.object({
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

/**
 * Calculate planetary declinations for a birth date/time
 */
export const calculateBirthDeclinations = action({
  args: {
    birthDate: v.string(), // YYYY-MM-DD
    birthTime: v.string(), // HH:MM
    timezone: v.string(), // IANA timezone
  },
  handler: async (_ctx, { birthDate, birthTime }): Promise<PlanetDeclinations> => {
    const jd = dateToJulianDay(birthDate, birthTime)
    return calculateDeclinations(jd)
  },
})

/**
 * Find optimal latitudes given declinations and weights
 */
export const findOptimalLatitudesAction = action({
  args: {
    declinations: v.object({
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
    }),
    weights: planetWeightsValidator,
    topN: v.optional(v.number()),
  },
  handler: async (_ctx, { declinations, weights, topN }): Promise<LatitudeScore[]> => {
    return findOptimalLatitudes(declinations, weights, topN ?? 10)
  },
})

/**
 * Score a list of city latitudes
 */
export const scoreCitiesAction = action({
  args: {
    cities: v.array(
      v.object({
        id: v.string(),
        latitude: v.number(),
      })
    ),
    declinations: v.object({
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
    }),
    weights: planetWeightsValidator,
  },
  handler: async (_ctx, { cities, declinations, weights }): Promise<CityScore[]> => {
    return scoreCities(cities, declinations, weights)
  },
})

/**
 * Get optimal latitude bands (ranges with high scores)
 */
export const getOptimalBandsAction = action({
  args: {
    declinations: v.object({
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
    }),
    weights: planetWeightsValidator,
    threshold: v.optional(v.number()),
  },
  handler: async (_ctx, { declinations, weights, threshold }) => {
    return getOptimalLatitudeBands(declinations, weights, threshold ?? 50)
  },
})

/**
 * Complete calculation pipeline:
 * 1. Calculate declinations from birth data
 * 2. Find optimal latitudes
 * 3. Return everything needed for visualization
 */
export const calculateComplete = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    weights: planetWeightsValidator,
  },
  handler: async (_ctx, { birthDate, birthTime, weights }) => {
    // 1. Calculate declinations
    const jd = dateToJulianDay(birthDate, birthTime)
    const declinations = calculateDeclinations(jd)

    // 2. Find optimal latitudes (top 20)
    const optimalLatitudes = findOptimalLatitudes(declinations, weights, 20, 0.5)

    // 3. Get latitude bands for visualization
    const latitudeBands = getOptimalLatitudeBands(declinations, weights, 40)

    return {
      declinations,
      optimalLatitudes,
      latitudeBands,
      julianDay: jd,
    }
  },
})

/**
 * Recalculate with new weights (no need to recalculate declinations)
 */
export const recalculateWithWeights = action({
  args: {
    declinations: v.object({
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
    }),
    weights: planetWeightsValidator,
  },
  handler: async (_ctx, { declinations, weights }) => {
    const optimalLatitudes = findOptimalLatitudes(declinations, weights, 20, 0.5)
    const latitudeBands = getOptimalLatitudeBands(declinations, weights, 40)

    return {
      optimalLatitudes,
      latitudeBands,
    }
  },
})
