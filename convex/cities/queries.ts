import { v } from 'convex/values'
import { query } from '../_generated/server'

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query: searchQuery }) => {
    if (searchQuery.length < 2) return []

    const results = await ctx.db
      .query('cities')
      .withSearchIndex('search_name', (q) => q.search('nameAscii', searchQuery))
      .take(10)

    return results.map((city) => ({
      id: city._id,
      name: city.name,
      country: city.country,
      state: city.state,
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone,
    }))
  },
})

export const getByLatitudeRange = query({
  args: {
    minLat: v.number(),
    maxLat: v.number(),
    tier: v.optional(
      v.union(v.literal('major'), v.literal('medium'), v.literal('minor'), v.literal('small')),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { minLat, maxLat, tier, limit = 100 }) => {
    if (tier) {
      return await ctx.db
        .query('cities')
        .withIndex('by_tier_latitude', (q) =>
          q.eq('tier', tier).gte('latitude', minLat).lte('latitude', maxLat),
        )
        .take(limit)
    } else {
      return await ctx.db
        .query('cities')
        .withIndex('by_latitude', (q) => q.gte('latitude', minLat).lte('latitude', maxLat))
        .take(limit)
    }
  },
})

export const getById = query({
  args: { id: v.id('cities') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get('cities', id)
  },
})

export const getManyByIds = query({
  args: { ids: v.array(v.id('cities')) },
  handler: async (ctx, { ids }) => {
    const cities = await Promise.all(ids.map((id) => ctx.db.get('cities', id)))
    return cities.filter((c): c is NonNullable<typeof c> => c !== null)
  },
})
