import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

const planetWeights = v.object({
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

const planetDeclinations = v.object({
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

// Enhanced declination with OOB status
const enhancedDeclination = v.object({
  value: v.number(),
  isOOB: v.boolean(),
  oobDegrees: v.optional(v.number()),
})

const enhancedDeclinations = v.object({
  sun: enhancedDeclination,
  moon: enhancedDeclination,
  mercury: enhancedDeclination,
  venus: enhancedDeclination,
  mars: enhancedDeclination,
  jupiter: enhancedDeclination,
  saturn: enhancedDeclination,
  uranus: enhancedDeclination,
  neptune: enhancedDeclination,
  pluto: enhancedDeclination,
})

// Dignity score for a single planet
const dignityScore = v.object({
  total: v.number(),
  indicator: v.string(), // R, E, d, f, or -
})

// All planet dignity scores
const planetDignities = v.object({
  sun: dignityScore,
  moon: dignityScore,
  mercury: dignityScore,
  venus: dignityScore,
  mars: dignityScore,
  jupiter: dignityScore,
  saturn: dignityScore,
  uranus: dignityScore,
  neptune: dignityScore,
  pluto: dignityScore,
})

// Zenith line definition
const zenithLine = v.object({
  planet: v.string(),
  latitude: v.number(),
  orbMin: v.number(),
  orbMax: v.number(),
})

// Paran point definition
const paranPoint = v.object({
  planet1: v.string(),
  event1: v.string(),
  planet2: v.string(),
  event2: v.string(),
  latitude: v.number(),
})

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id('users'),
    displayName: v.optional(v.string()),
    defaultWeights: v.optional(planetWeights),
  }).index('by_user', ['userId']),

  charts: defineTable({
    userId: v.id('users'),
    name: v.string(),
    birthDate: v.string(), // YYYY-MM-DD
    birthTime: v.string(), // HH:MM (24-hour)
    birthCity: v.string(),
    birthCountry: v.string(),
    birthLatitude: v.number(),
    birthLongitude: v.number(),
    birthTimezone: v.string(), // IANA timezone
    declinations: planetDeclinations,
    weights: planetWeights,
    topLocations: v.array(
      v.object({
        cityId: v.id('cities'),
        score: v.number(),
      }),
    ),
    isPublic: v.boolean(),
    shareSlug: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Enhanced fields (optional for backward compatibility)
    dignities: v.optional(planetDignities),
    sect: v.optional(v.union(v.literal('day'), v.literal('night'))),
    vibeId: v.optional(v.string()),
    ascendant: v.optional(v.number()), // For sect determination
  })
    .index('by_user', ['userId'])
    .index('by_share_slug', ['shareSlug']),

  cities: defineTable({
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
      v.literal('major'), // >500k
      v.literal('medium'), // 100k-500k
      v.literal('minor'), // 50k-100k
      v.literal('small'), // 10k-50k
    ),
  })
    .index('by_latitude', ['latitude'])
    .index('by_tier_latitude', ['tier', 'latitude'])
    .searchIndex('search_name', { searchField: 'nameAscii' }),

  presets: defineTable({
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    weights: planetWeights,
    order: v.number(),
  }).index('by_order', ['order']),

  // Analysis cache for storing computed results
  analysisCache: defineTable({
    chartId: v.id('charts'),
    julianDay: v.number(),
    obliquity: v.number(),
    enhancedDeclinations: enhancedDeclinations,
    zenithLines: v.array(zenithLine),
    topParans: v.array(paranPoint),
    paranSummary: v.object({
      riseRise: v.number(),
      riseCulminate: v.number(),
      riseSet: v.number(),
      culminateCulminate: v.number(),
      setSet: v.number(),
      total: v.number(),
    }),
    dignities: planetDignities,
    sect: v.union(v.literal('day'), v.literal('night')),
    computedAt: v.number(),
  }).index('by_chart', ['chartId']),

  // Anonymous users for fingerprint-based identification
  anonymousUsers: defineTable({
    fingerprintId: v.string(),
    createdAt: v.number(),
    lastSeen: v.number(),
    chartCount: v.number(),
  }).index('by_fingerprint', ['fingerprintId']),

  // Standalone calculation cache (not tied to charts)
  calculationCache: defineTable({
    cacheKey: v.string(),
    userId: v.optional(v.id('users')),
    anonymousUserId: v.optional(v.id('anonymousUsers')),
    inputHash: v.string(),
    result: v.any(),
    calculationType: v.union(
      v.literal('full'),
      v.literal('declinations'),
      v.literal('parans'),
      v.literal('acg'),
      v.literal('vibes'),
    ),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_cache_key', ['cacheKey'])
    .index('by_user', ['userId'])
    .index('by_anonymous_user', ['anonymousUserId']),

  // User-defined and preset vibes for search
  vibes: defineTable({
    userId: v.optional(v.id('users')),
    name: v.string(),
    description: v.string(),
    weights: planetWeights,
    keywords: v.array(v.string()),
    primaryPlanets: v.array(v.string()),
    isPublic: v.boolean(),
    isPreset: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_public', ['isPublic'])
    .index('by_preset', ['isPreset']),
})
