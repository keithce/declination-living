import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { auth } from '../auth'

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

const planetDeclinationsValidator = v.object({
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

export const create = mutation({
  args: {
    name: v.string(),
    birthDate: v.string(),
    birthTime: v.string(),
    birthCity: v.string(),
    birthCountry: v.string(),
    birthLatitude: v.number(),
    birthLongitude: v.number(),
    birthTimezone: v.string(),
    declinations: planetDeclinationsValidator,
    weights: planetWeightsValidator,
    topLocations: v.optional(
      v.array(
        v.object({
          cityId: v.id('cities'),
          score: v.number(),
        }),
      ),
    ),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const now = Date.now()
    return await ctx.db.insert('charts', {
      name: args.name,
      birthDate: args.birthDate,
      birthTime: args.birthTime,
      birthCity: args.birthCity,
      birthCountry: args.birthCountry,
      birthLatitude: args.birthLatitude,
      birthLongitude: args.birthLongitude,
      birthTimezone: args.birthTimezone,
      declinations: args.declinations,
      weights: args.weights,
      topLocations: args.topLocations ?? [],
      userId,
      isPublic: args.isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('charts'),
    name: v.optional(v.string()),
    weights: v.optional(planetWeightsValidator),
    topLocations: v.optional(
      v.array(
        v.object({
          cityId: v.id('cities'),
          score: v.number(),
        }),
      ),
    ),
    isPublic: v.optional(v.boolean()),
    shareSlug: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const chart = await ctx.db.get('charts', id)
    if (!chart || chart.userId !== userId) {
      throw new Error('Chart not found or not authorized')
    }

    // Filter out undefined values (Convex optional args may be undefined at runtime)
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates as Record<string, unknown>).filter(
        (entry): entry is [string, NonNullable<(typeof entry)[1]>] => entry[1] !== undefined,
      ),
    )

    await ctx.db.patch('charts', id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    })

    return id
  },
})

export const remove = mutation({
  args: { id: v.id('charts') },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const chart = await ctx.db.get('charts', id)
    if (!chart || chart.userId !== userId) {
      throw new Error('Chart not found or not authorized')
    }

    await ctx.db.delete('charts', id)
    return { success: true }
  },
})

// Generate a shareable link
export const generateShareSlug = mutation({
  args: { id: v.id('charts') },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const chart = await ctx.db.get('charts', id)
    if (!chart || chart.userId !== userId) {
      throw new Error('Chart not found or not authorized')
    }

    // Generate a simple slug using timestamp + random chars
    const slug = Date.now().toString(36) + Math.random().toString(36).substring(2, 8)

    await ctx.db.patch('charts', id, {
      shareSlug: slug,
      isPublic: true,
      updatedAt: Date.now(),
    })

    return slug
  },
})
