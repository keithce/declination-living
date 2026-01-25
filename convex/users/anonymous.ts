/**
 * Anonymous User Identification
 *
 * Identify users without requiring login using fingerprint + localStorage.
 * This allows anonymous users to have their calculations cached and
 * persist across sessions.
 */
import { v } from 'convex/values'
import { mutation, query } from '../_generated/server'

/**
 * Get or create an anonymous user by fingerprint ID
 */
export const getOrCreateAnonymousUser = mutation({
  args: {
    fingerprintId: v.string(),
  },
  handler: async (ctx, { fingerprintId }) => {
    // Check if user exists
    const existing = await ctx.db
      .query('anonymousUsers')
      .withIndex('by_fingerprint', (q) => q.eq('fingerprintId', fingerprintId))
      .first()

    if (existing) {
      // Update last seen
      await ctx.db.patch('anonymousUsers', existing._id, { lastSeen: Date.now() })
      return existing._id
    }

    // Create new anonymous user
    const userId = await ctx.db.insert('anonymousUsers', {
      fingerprintId,
      createdAt: Date.now(),
      lastSeen: Date.now(),
      chartCount: 0,
    })

    return userId
  },
})

/**
 * Get anonymous user by fingerprint
 */
export const getAnonymousUser = query({
  args: {
    fingerprintId: v.string(),
  },
  handler: async (ctx, { fingerprintId }) => {
    return ctx.db
      .query('anonymousUsers')
      .withIndex('by_fingerprint', (q) => q.eq('fingerprintId', fingerprintId))
      .first()
  },
})

/**
 * Increment chart count for anonymous user
 */
export const incrementChartCount = mutation({
  args: {
    anonymousUserId: v.id('anonymousUsers'),
  },
  handler: async (ctx, { anonymousUserId }) => {
    const user = await ctx.db.get('anonymousUsers', anonymousUserId)
    if (!user) return

    await ctx.db.patch('anonymousUsers', anonymousUserId, {
      chartCount: user.chartCount + 1,
      lastSeen: Date.now(),
    })
  },
})

/**
 * Update last seen for anonymous user
 */
export const updateLastSeen = mutation({
  args: {
    anonymousUserId: v.id('anonymousUsers'),
  },
  handler: async (ctx, { anonymousUserId }) => {
    const user = await ctx.db.get('anonymousUsers', anonymousUserId)
    if (!user) return

    await ctx.db.patch('anonymousUsers', anonymousUserId, {
      lastSeen: Date.now(),
    })
  },
})
