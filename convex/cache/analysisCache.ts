/**
 * Analysis Cache
 *
 * Cache computed results to avoid recalculation.
 * Supports both authenticated and anonymous users.
 *
 * SECURITY: User identity is derived server-side for authenticated users.
 * Anonymous users must provide a valid anonymousUserId which is validated.
 */
import { v } from 'convex/values'
import { internalMutation, internalQuery, mutation, query } from '../_generated/server'
import { auth } from '../auth'
import type { Id, MutationCtx, QueryCtx } from '../_generated/server'

// Cache TTL in milliseconds (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000

// Shared cache lookup logic with optional ownership validation
async function lookupCache(
  ctx: Pick<QueryCtx, 'db'>,
  cacheKey: string,
  requestingUserId?: Id<'users'> | null,
  requestingAnonymousUserId?: Id<'anonymousUsers'>,
): Promise<unknown | null> {
  const cached = await ctx.db
    .query('calculationCache')
    .withIndex('by_cache_key', (q) => q.eq('cacheKey', cacheKey))
    .first()

  if (!cached) return null

  // Check expiry
  if (cached.expiresAt < Date.now()) {
    // Let mutation handle cleanup
    return null
  }

  // Ownership validation: if cache entry has a userId, verify requester owns it
  // Public/anonymous cache entries (no userId) can be accessed by anyone
  if (cached.userId) {
    if (requestingUserId !== cached.userId) {
      // Don't reveal existence - return null as if not found
      return null
    }
  } else if (cached.anonymousUserId) {
    if (requestingAnonymousUserId !== cached.anonymousUserId) {
      return null
    }
  }

  return cached.result
}

/**
 * Get cached result by cache key (public query)
 * Identity is derived server-side for ownership validation.
 */
export const getCachedResult = query({
  args: {
    cacheKey: v.string(),
    // Anonymous users must provide their ID for ownership validation
    anonymousUserId: v.optional(v.id('anonymousUsers')),
  },
  handler: async (ctx, { cacheKey, anonymousUserId }) => {
    // Derive authenticated user ID from context
    const userId = await auth.getUserId(ctx)

    // Validate anonymous user exists if provided
    let validatedAnonymousUserId: Id<'anonymousUsers'> | undefined
    if (anonymousUserId) {
      const anonUser = await ctx.db.get('anonymousUsers', anonymousUserId)
      if (anonUser) {
        validatedAnonymousUserId = anonymousUserId
      }
    }

    return lookupCache(ctx, cacheKey, userId, validatedAnonymousUserId)
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

// Calculation type union
const calculationTypeValidator = v.union(
  v.literal('full'),
  v.literal('declinations'),
  v.literal('parans'),
  v.literal('acg'),
  v.literal('vibes'),
)
type CalculationType = 'full' | 'declinations' | 'parans' | 'acg' | 'vibes'

// Cache set args validator for public mutations (no user IDs - derived server-side)
const setCacheArgsPublic = {
  cacheKey: v.string(),
  inputHash: v.string(),
  result: v.any(),
  calculationType: calculationTypeValidator,
  // Anonymous users can provide their ID for association (validated server-side)
  anonymousUserId: v.optional(v.id('anonymousUsers')),
}

// Cache set args validator for internal mutations (user IDs passed from trusted actions)
const setCacheArgsInternal = {
  cacheKey: v.string(),
  inputHash: v.string(),
  result: v.any(),
  calculationType: calculationTypeValidator,
  userId: v.optional(v.id('users')),
  anonymousUserId: v.optional(v.id('anonymousUsers')),
}

// Shared cache set logic
async function setCache(
  ctx: Pick<MutationCtx, 'db'>,
  args: {
    cacheKey: string
    inputHash: string
    result: unknown
    calculationType: CalculationType
    userId?: any
    anonymousUserId?: any
  },
): Promise<void> {
  // Delete existing cache with same key
  const existing = await ctx.db
    .query('calculationCache')
    .withIndex('by_cache_key', (q) => q.eq('cacheKey', args.cacheKey))
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
 * User identity is derived server-side for security.
 */
export const setCachedResult = mutation({
  args: setCacheArgsPublic,
  handler: async (ctx, args) => {
    // Derive authenticated user ID from context
    const userId = await auth.getUserId(ctx)

    // Validate anonymous user exists if provided
    let validatedAnonymousUserId: Id<'anonymousUsers'> | undefined
    if (args.anonymousUserId) {
      const anonUser = await ctx.db.get('anonymousUsers', args.anonymousUserId)
      if (anonUser) {
        validatedAnonymousUserId = args.anonymousUserId
      }
    }

    await setCache(ctx, {
      cacheKey: args.cacheKey,
      inputHash: args.inputHash,
      result: args.result,
      calculationType: args.calculationType,
      userId: userId ?? undefined,
      anonymousUserId: validatedAnonymousUserId,
    })
  },
})

/**
 * Set cached result (internal - for use in actions)
 * Internal mutations can pass user IDs directly (trusted source).
 */
export const setCachedResultInternal = internalMutation({
  args: setCacheArgsInternal,
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
 * Delete all cache entries for the current user
 * User identity is derived server-side for security.
 */
export const clearUserCache = mutation({
  args: {
    // Anonymous users must provide their ID (validated server-side)
    anonymousUserId: v.optional(v.id('anonymousUsers')),
  },
  handler: async (ctx, { anonymousUserId }) => {
    // Derive authenticated user ID from context
    const userId = await auth.getUserId(ctx)

    let entries
    if (userId) {
      // Clear cache for authenticated user
      entries = await ctx.db
        .query('calculationCache')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect()
    } else if (anonymousUserId) {
      // Validate anonymous user exists before clearing their cache
      const anonUser = await ctx.db.get('anonymousUsers', anonymousUserId)
      if (!anonUser) {
        return { deleted: 0 }
      }

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

  // Simple hash (djb2 variant)
  let hash = 0
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash >>> 0 // Convert to unsigned 32-bit integer
  }

  return hash.toString(36)
}
