import { v } from 'convex/values'
import { query } from '../_generated/server'
import { auth } from '../auth'

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) return []

    return await ctx.db
      .query('charts')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})

export const getById = query({
  args: { id: v.id('charts') },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx)
    const chart = await ctx.db.get('charts', id)

    if (!chart) return null

    // Allow access if public or owned by user
    if (chart.isPublic || chart.userId === userId) {
      return chart
    }

    return null
  },
})

export const getByShareSlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const chart = await ctx.db
      .query('charts')
      .withIndex('by_share_slug', (q) => q.eq('shareSlug', slug))
      .first()

    if (!chart || !chart.isPublic) return null

    return chart
  },
})
