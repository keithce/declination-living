/**
 * Analysis Cache
 *
 * Cache computed results to avoid recalculation.
 * Supports both authenticated and anonymous users.
 */
import { v } from 'convex/values'
import { internalMutation, internalQuery, mutation, query } from '../_generated/server'

// Cache TTL in milliseconds (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000

// Shared cache lookup logic
async function lookupCache(ctx: { db: any }, cacheKey: string): Promise<unknown | null> {
  const cached = await ctx.db
    .query('calculationCache')
    .withIndex('by_cache_key', (q: any) => q.eq('cacheKey', cacheKey))
    .first()

  if (!cached) return null

  // Check expiry
  if (cached.expiresAt < Date.now()) {
    // Let mutation handle cleanup
    return null
  }

  return cached.result
}

/**
 * Get cached result by cache key (public query)
 */
export const getCachedResult = query({
  args: {
    cacheKey: v.string(),
  },
  handler: async (ctx, { cacheKey }) => {
    return lookupCache(ctx, cacheKey)
  },
})

/**
 * Get cached result by cache key (internal - for use in actions)
 */
export const getCachedResultInternal = internalQuery({
  args: {
    cacheKey: v.string(),
  },
  handler: async (ctx, { cacheKey }) => {
    return lookupCache(ctx, cacheKey)
  },
})

// Cache set args validator
const setCacheArgs = {
  cacheKey: v.string(),
  inputHash: v.string(),
  result: v.any(),
  calculationType: v.string(),
  userId: v.optional(v.id('users')),
  anonymousUserId: v.optional(v.id('anonymousUsers')),
}

// Shared cache set logic
async function setCache(
  ctx: { db: any },
  args: {
    cacheKey: string
    inputHash: string
    result: unknown
    calculationType: string
    userId?: any
    anonymousUserId?: any
  },
): Promise<void> {
  // Delete existing cache with same key
  const existing = await ctx.db
    .query('calculationCache')
    .withIndex('by_cache_key', (q: any) => q.eq('cacheKey', args.cacheKey))
    .first()

  if (existing) {
    await ctx.db.delete('calculationCache', existing._id)
  }

  // Insert new cache entry
  await ctx.db.insert('calculationCache', {
    cacheKey: args.cacheKey,
    inputHash: args.inputHash,
    result: args.result,
    calculationType: args.calculationType,
    userId: args.userId,
    anonymousUserId: args.anonymousUserId,
    createdAt: Date.now(),
    expiresAt: Date.now() + CACHE_TTL,
  })
}

/**
 * Set cached result (public mutation)
 */
export const setCachedResult = mutation({
  args: setCacheArgs,
  handler: async (ctx, args) => {
    await setCache(ctx, args)
  },
})

/**
 * Set cached result (internal - for use in actions)
 */
export const setCachedResultInternal = internalMutation({
  args: setCacheArgs,
  handler: async (ctx, args) => {
    await setCache(ctx, args)
  },
})

/**
 * Delete expired cache entries
 */
export const cleanupExpiredCache = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const expired = await ctx.db
      .query('calculationCache')
      .filter((q) => q.lt(q.field('expiresAt'), now))
      .collect()

    let deleted = 0
    for (const entry of expired) {
      await ctx.db.delete('calculationCache', entry._id)
      deleted++
    }

    return { deleted }
  },
})

/**
 * Delete all cache entries for a user
 */
export const clearUserCache = mutation({
  args: {
    userId: v.optional(v.id('users')),
    anonymousUserId: v.optional(v.id('anonymousUsers')),
  },
  handler: async (ctx, { userId, anonymousUserId }) => {
    let entries
    if (userId) {
      entries = await ctx.db
        .query('calculationCache')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect()
    } else if (anonymousUserId) {
      entries = await ctx.db
        .query('calculationCache')
        .withIndex('by_anonymous_user', (q) => q.eq('anonymousUserId', anonymousUserId))
        .collect()
    } else {
      return { deleted: 0 }
    }

    for (const entry of entries) {
      await ctx.db.delete('calculationCache', entry._id)
    }

    return { deleted: entries.length }
  },
})

/**
 * Generate a cache key from input parameters
 *
 * @param birthDate - Birth date string
 * @param birthTime - Birth time string
 * @param timezone - Timezone string
 * @param weightsHash - Stringified weights
 */
export function generateCacheKey(
  birthDate: string,
  birthTime: string,
  timezone: string,
  weightsHash: string,
): string {
  const input = `${birthDate}|${birthTime}|${timezone}|${weightsHash}`

  // Simple hash function (FNV-1a)
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  // Convert to positive integer and base36
  return `calc_${Math.abs(hash).toString(36)}`
}

/**
 * Generate hash from weights object
 */
export function hashWeights(weights: Record<string, number>): string {
  // Sort keys for consistent ordering
  const sorted = Object.keys(weights)
    .sort()
    .map((k) => `${k}:${weights[k]}`)
    .join(',')

  // Simple hash
  let hash = 0
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  return Math.abs(hash).toString(36)
}
