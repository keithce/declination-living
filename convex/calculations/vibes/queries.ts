/**
 * Vibe/Search Module - Internal Queries.
 *
 * Queries for use in actions. Separated from actions.ts to avoid
 * 'use node' restrictions (queries cannot run in Node.js).
 */

import { v } from 'convex/values'
import { internalQuery } from '../../_generated/server'
import type { CityData } from '../geospatial/ranking'

// =============================================================================
// Internal Queries
// =============================================================================

/**
 * Get all preset vibes (internal query for use in actions).
 */
export const getPresetVibesInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('vibes')
      .withIndex('by_preset', (q) => q.eq('isPreset', true))
      .collect()
  },
})

/**
 * Get cities in latitude ranges (internal query for use in actions).
 */
export const getCitiesInRangesInternal = internalQuery({
  args: {
    ranges: v.array(v.object({ min: v.number(), max: v.number() })),
    tiers: v.optional(
      v.array(
        v.union(v.literal('major'), v.literal('medium'), v.literal('minor'), v.literal('small')),
      ),
    ),
    limitPerRange: v.optional(v.number()),
  },
  handler: async (ctx, { ranges, tiers, limitPerRange = 50 }) => {
    const allCities: Array<CityData> = []
    const seenIds = new Set<string>()

    for (const range of ranges) {
      const query = ctx.db.query('cities')

      // If tiers specified, query each tier separately
      if (tiers && tiers.length > 0) {
        for (const tier of tiers) {
          const tierCities = await ctx.db
            .query('cities')
            .withIndex('by_tier_latitude', (q) =>
              q.eq('tier', tier).gte('latitude', range.min).lte('latitude', range.max),
            )
            .take(limitPerRange)

          for (const city of tierCities) {
            if (!seenIds.has(city._id.toString())) {
              seenIds.add(city._id.toString())
              allCities.push({
                _id: city._id,
                name: city.name,
                country: city.country,
                latitude: city.latitude,
                longitude: city.longitude,
                tier: city.tier,
                population: city.population,
              })
            }
          }
        }
      } else {
        // Query all tiers
        const cities = await query
          .withIndex('by_latitude', (q) => q.gte('latitude', range.min).lte('latitude', range.max))
          .take(limitPerRange)

        for (const city of cities) {
          if (!seenIds.has(city._id.toString())) {
            seenIds.add(city._id.toString())
            allCities.push({
              _id: city._id,
              name: city.name,
              country: city.country,
              latitude: city.latitude,
              longitude: city.longitude,
              tier: city.tier,
              population: city.population,
            })
          }
        }
      }
    }

    return allCities
  },
})
