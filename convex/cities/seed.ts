/**
 * City Seeding Action - Batch insert cities from JSON data.
 *
 * Run with: npx convex run cities/seed:seedCities
 */

import { v } from 'convex/values'
import { action, internalMutation, internalQuery } from '../_generated/server'
import { internal } from '../_generated/api'

/** City record from prepared JSON data */
interface CityRecord {
  name: string
  nameAscii: string
  country: string
  countryCode: string
  state?: string
  latitude: number
  longitude: number
  population: number
  timezone: string
  tier: 'major' | 'medium' | 'minor' | 'small'
}

/** Batch size for inserts (Convex mutation limit) */
const BATCH_SIZE = 100

/**
 * Internal mutation to insert a batch of cities.
 */
export const insertCityBatch = internalMutation({
  args: {
    cities: v.array(
      v.object({
        name: v.string(),
        nameAscii: v.string(),
        country: v.string(),
        countryCode: v.string(),
        state: v.optional(v.string()),
        latitude: v.number(),
        longitude: v.number(),
        population: v.number(),
        timezone: v.string(),
        tier: v.union(
          v.literal('major'),
          v.literal('medium'),
          v.literal('minor'),
          v.literal('small'),
        ),
      }),
    ),
  },
  handler: async (ctx, { cities }) => {
    const results = []
    for (const city of cities) {
      const id = await ctx.db.insert('cities', city)
      results.push(id)
    }
    return results.length
  },
})

/**
 * Main seeding action - reads JSON and batches inserts.
 *
 * Usage: npx convex run cities/seed:seedCities
 *
 * Options:
 * - maxCities: Maximum number of cities to seed (default: all)
 * - clearExisting: Whether to clear existing cities first (default: false)
 */
export const seedCities = action({
  args: {
    maxCities: v.optional(v.number()),
  },
  handler: async (
    _ctx,
    { maxCities },
  ): Promise<{
    status: string
    message: string
    steps: Array<string>
  }> => {
    console.log('City seeding started')
    console.log('Options:', { maxCities })

    // Return instructions for manual seeding
    return {
      status: 'instructions',
      message: 'Run the prepare-cities.ts script first, then use seedCitiesFromJson with the data',
      steps: [
        '1. bun run scripts/prepare-cities.ts',
        '2. Use the seedCitiesFromJson action with the generated data',
      ],
    }
  },
})

/**
 * Seed cities from a JSON string (for use with prepared data).
 *
 * Usage: Call from another action or script with the JSON data.
 */
export const seedCitiesFromJson = action({
  args: {
    citiesJson: v.string(),
    maxCities: v.optional(v.number()),
  },
  handler: async (ctx, { citiesJson, maxCities }) => {
    let allCities: Array<CityRecord>
    try {
      allCities = JSON.parse(citiesJson)
    } catch (e) {
      throw new Error(`Failed to parse citiesJson: ${e instanceof Error ? e.message : String(e)}`)
    }
    if (!Array.isArray(allCities)) {
      throw new Error(`citiesJson must parse to an array, got ${typeof allCities}`)
    }
    const cities = maxCities ? allCities.slice(0, maxCities) : allCities

    console.log(`Seeding ${cities.length} cities in batches of ${BATCH_SIZE}...`)

    let totalInserted = 0
    const batches = Math.ceil(cities.length / BATCH_SIZE)

    for (let i = 0; i < batches; i++) {
      const start = i * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, cities.length)
      const batch = cities.slice(start, end)

      const inserted = await ctx.runMutation(internal.cities.seed.insertCityBatch, {
        cities: batch,
      })

      totalInserted += inserted
      console.log(`Batch ${i + 1}/${batches}: inserted ${inserted} cities`)
    }

    console.log(`Done! Total cities inserted: ${totalInserted}`)

    return {
      status: 'success',
      totalInserted,
      batches,
    }
  },
})

/**
 * Clear all cities from the database.
 *
 * Usage: npx convex run cities/seed:clearCities
 */
export const clearCities = action({
  args: {},
  handler: async (ctx): Promise<{ deleted: number }> => {
    console.log('Clearing all cities...')

    const deleted: number = await ctx.runMutation(internal.cities.seed.deleteAllCities, {})

    console.log(`Deleted ${deleted} cities`)
    return { deleted }
  },
})

/**
 * Internal mutation to delete all cities.
 */
export const deleteAllCities = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cities = await ctx.db.query('cities').collect()
    for (const city of cities) {
      await ctx.db.delete('cities', city._id)
    }
    return cities.length
  },
})

/**
 * Get city count for verification.
 */
export const getCityCount = action({
  args: {},
  handler: async (ctx): Promise<{ count: number }> => {
    const count: number = await ctx.runQuery(internal.cities.seed.countCities, {})
    return { count }
  },
})

export const countCities = internalQuery({
  args: {},
  handler: async (ctx) => {
    const cities = await ctx.db.query('cities').collect()
    return cities.length
  },
})
