/**
 * Vibe Translator - Map user goals to planetary weights.
 *
 * Translates natural language queries about life goals into
 * weighted planetary importance for location optimization.
 */

import { PLANET_IDS } from '../core/types'
import type { PlanetId, PlanetWeights, VibeCategory } from '../core/types'

// =============================================================================
// Default Weights
// =============================================================================

/**
 * Default equal weights for all planets.
 */
export const DEFAULT_WEIGHTS: PlanetWeights = {
  sun: 1,
  moon: 1,
  mercury: 1,
  venus: 1,
  mars: 1,
  jupiter: 1,
  saturn: 1,
  uranus: 1,
  neptune: 1,
  pluto: 1,
}

/**
 * Create weights with all zeros.
 */
export function zeroWeights(): PlanetWeights {
  return {
    sun: 0,
    moon: 0,
    mercury: 0,
    venus: 0,
    mars: 0,
    jupiter: 0,
    saturn: 0,
    uranus: 0,
    neptune: 0,
    pluto: 0,
  }
}

// =============================================================================
// Vibe Categories
// =============================================================================

/**
 * Predefined vibe categories mapping life goals to planetary weights.
 */
export const VIBE_CATEGORIES: Array<VibeCategory> = [
  {
    id: 'wealth',
    name: 'Wealth & Abundance',
    description: 'Financial prosperity, material success, and abundance',
    keywords: [
      'wealth',
      'money',
      'rich',
      'financial',
      'prosperity',
      'abundance',
      'fortune',
      'income',
      'profitable',
    ],
    primaryPlanets: ['jupiter', 'venus'],
    weights: {
      sun: 3, // Success, recognition
      moon: 1,
      mercury: 4, // Business acumen
      venus: 7, // Material pleasures, values
      mars: 2,
      jupiter: 10, // Expansion, luck, abundance
      saturn: 3, // Structure, long-term building
      uranus: 2,
      neptune: 1,
      pluto: 4, // Power, transformation
    },
  },
  {
    id: 'career',
    name: 'Career & Achievement',
    description: 'Professional success, recognition, and accomplishment',
    keywords: [
      'career',
      'job',
      'work',
      'professional',
      'success',
      'achievement',
      'promotion',
      'business',
      'leadership',
      'ambition',
    ],
    primaryPlanets: ['sun', 'saturn', 'mars'],
    weights: {
      sun: 10, // Identity, success, recognition
      moon: 2,
      mercury: 5, // Communication, skills
      venus: 2,
      mars: 7, // Drive, ambition, action
      jupiter: 5, // Growth, opportunities
      saturn: 8, // Discipline, mastery, status
      uranus: 3,
      neptune: 1,
      pluto: 4, // Power, influence
    },
  },
  {
    id: 'love',
    name: 'Love & Relationships',
    description: 'Romantic love, partnerships, and deep connections',
    keywords: [
      'love',
      'romance',
      'relationship',
      'marriage',
      'partner',
      'dating',
      'soulmate',
      'connection',
      'intimacy',
    ],
    primaryPlanets: ['venus', 'moon'],
    weights: {
      sun: 3,
      moon: 8, // Emotions, nurturing, intimacy
      mercury: 4, // Communication in relationships
      venus: 10, // Love, attraction, harmony
      mars: 5, // Passion, desire
      jupiter: 4, // Joy, expansion
      saturn: 2, // Commitment
      uranus: 2,
      neptune: 6, // Romance, idealism
      pluto: 5, // Deep bonding, transformation
    },
  },
  {
    id: 'spirituality',
    name: 'Spirituality & Enlightenment',
    description: 'Spiritual growth, inner peace, and transcendence',
    keywords: [
      'spiritual',
      'meditation',
      'enlightenment',
      'peace',
      'mindfulness',
      'consciousness',
      'awakening',
      'mystical',
      'sacred',
      'divine',
    ],
    primaryPlanets: ['neptune', 'jupiter', 'moon'],
    weights: {
      sun: 3,
      moon: 7, // Intuition, inner life
      mercury: 2,
      venus: 3,
      mars: 1,
      jupiter: 8, // Wisdom, higher learning
      saturn: 4, // Discipline, mastery
      uranus: 5, // Higher consciousness
      neptune: 10, // Transcendence, spirituality
      pluto: 6, // Transformation, rebirth
    },
  },
  {
    id: 'creativity',
    name: 'Creativity & Art',
    description: 'Artistic expression, imagination, and creative flow',
    keywords: [
      'creative',
      'art',
      'artist',
      'music',
      'writing',
      'design',
      'imagination',
      'inspiration',
      'expression',
    ],
    primaryPlanets: ['venus', 'neptune', 'moon'],
    weights: {
      sun: 5, // Self-expression
      moon: 7, // Imagination, emotions
      mercury: 6, // Communication, ideas
      venus: 9, // Beauty, aesthetics
      mars: 3,
      jupiter: 4,
      saturn: 2,
      uranus: 7, // Originality, innovation
      neptune: 10, // Inspiration, artistry
      pluto: 3,
    },
  },
  {
    id: 'health',
    name: 'Health & Vitality',
    description: 'Physical health, energy, and well-being',
    keywords: [
      'health',
      'fitness',
      'energy',
      'vitality',
      'wellness',
      'healing',
      'strength',
      'longevity',
    ],
    primaryPlanets: ['sun', 'mars', 'moon'],
    weights: {
      sun: 10, // Vitality, life force
      moon: 6, // Emotional health, cycles
      mercury: 3,
      venus: 4, // Pleasure, self-care
      mars: 8, // Physical energy, strength
      jupiter: 5, // Abundance, growth
      saturn: 4, // Structure, discipline
      uranus: 2,
      neptune: 3,
      pluto: 4, // Regeneration
    },
  },
  {
    id: 'adventure',
    name: 'Adventure & Travel',
    description: 'Exploration, travel, and new experiences',
    keywords: [
      'adventure',
      'travel',
      'explore',
      'journey',
      'freedom',
      'excitement',
      'discovery',
      'wanderlust',
    ],
    primaryPlanets: ['jupiter', 'uranus', 'mars'],
    weights: {
      sun: 4,
      moon: 2,
      mercury: 6, // Communication, short travel
      venus: 4,
      mars: 7, // Action, courage
      jupiter: 10, // Long journeys, expansion
      saturn: 1,
      uranus: 8, // Freedom, unexpected
      neptune: 5, // Dreams, far places
      pluto: 3,
    },
  },
  {
    id: 'knowledge',
    name: 'Knowledge & Wisdom',
    description: 'Learning, education, and intellectual growth',
    keywords: [
      'knowledge',
      'learning',
      'education',
      'study',
      'wisdom',
      'intellectual',
      'research',
      'understanding',
      'teaching',
    ],
    primaryPlanets: ['mercury', 'jupiter', 'saturn'],
    weights: {
      sun: 3,
      moon: 2,
      mercury: 10, // Intellect, learning
      venus: 2,
      mars: 3,
      jupiter: 8, // Higher learning, wisdom
      saturn: 7, // Discipline, mastery, depth
      uranus: 6, // Innovation, insight
      neptune: 4, // Intuitive knowing
      pluto: 4, // Deep research
    },
  },
  {
    id: 'transformation',
    name: 'Transformation & Rebirth',
    description: 'Personal transformation and profound change',
    keywords: [
      'transformation',
      'change',
      'rebirth',
      'evolution',
      'growth',
      'healing',
      'crisis',
      'phoenix',
      'renewal',
    ],
    primaryPlanets: ['pluto', 'uranus', 'saturn'],
    weights: {
      sun: 4,
      moon: 5, // Emotional processing
      mercury: 2,
      venus: 2,
      mars: 5, // Action for change
      jupiter: 3,
      saturn: 7, // Structure, endings
      uranus: 8, // Sudden change, breakthrough
      neptune: 5, // Dissolution, letting go
      pluto: 10, // Deep transformation
    },
  },
  {
    id: 'stability',
    name: 'Stability & Security',
    description: 'Groundedness, security, and solid foundations',
    keywords: [
      'stability',
      'security',
      'grounded',
      'safe',
      'home',
      'foundation',
      'routine',
      'reliable',
      'steady',
    ],
    primaryPlanets: ['saturn', 'moon', 'venus'],
    weights: {
      sun: 4,
      moon: 8, // Home, comfort, security
      mercury: 3,
      venus: 6, // Comfort, values
      mars: 2,
      jupiter: 4,
      saturn: 10, // Structure, stability
      uranus: 1, // (Avoid sudden change)
      neptune: 2,
      pluto: 3,
    },
  },
]

// =============================================================================
// Vibe Matching
// =============================================================================

/**
 * Match a user query to a vibe category using keyword matching.
 *
 * @param query - User's natural language query
 * @returns Best matching vibe category, or null if no match
 */
export function matchVibeFromQuery(query: string): VibeCategory | null {
  const queryLower = query.toLowerCase()
  let bestMatch: VibeCategory | null = null
  let bestScore = 0

  for (const vibe of VIBE_CATEGORIES) {
    let score = 0

    // Check for exact ID match
    if (queryLower.includes(vibe.id)) {
      score += 10
    }

    // Check for name match
    if (queryLower.includes(vibe.name.toLowerCase())) {
      score += 8
    }

    // Check keyword matches
    for (const keyword of vibe.keywords) {
      if (queryLower.includes(keyword)) {
        score += 2
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = vibe
    }
  }

  // Require minimum score to return a match
  return bestScore >= 2 ? bestMatch : null
}

/**
 * Find all vibes that match a query (may return multiple).
 *
 * @param query - User's natural language query
 * @returns Array of matching vibes with scores
 */
export function findMatchingVibes(query: string): Array<{ vibe: VibeCategory; score: number }> {
  const queryLower = query.toLowerCase()
  const matches: Array<{ vibe: VibeCategory; score: number }> = []

  for (const vibe of VIBE_CATEGORIES) {
    let score = 0

    if (queryLower.includes(vibe.id)) score += 10
    if (queryLower.includes(vibe.name.toLowerCase())) score += 8

    for (const keyword of vibe.keywords) {
      if (queryLower.includes(keyword)) score += 2
    }

    if (score >= 2) {
      matches.push({ vibe, score })
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score)

  return matches
}

// =============================================================================
// Weight Blending
// =============================================================================

/**
 * Blend multiple vibe weights together.
 *
 * @param vibes - Array of {vibe, ratio} where ratio is 0-1
 * @returns Blended planet weights
 */
export function blendVibes(vibes: Array<{ vibe: VibeCategory; ratio: number }>): PlanetWeights {
  const result = zeroWeights()

  // Normalize ratios to sum to 1
  const totalRatio = vibes.reduce((sum, v) => sum + v.ratio, 0)
  if (totalRatio === 0) return DEFAULT_WEIGHTS

  for (const { vibe, ratio } of vibes) {
    const normalizedRatio = ratio / totalRatio

    for (const planet of PLANET_IDS) {
      result[planet] += vibe.weights[planet] * normalizedRatio
    }
  }

  return result
}

/**
 * Combine weights from a primary vibe with secondary influences.
 *
 * @param primary - Primary vibe (70% influence)
 * @param secondary - Optional secondary vibe (30% influence)
 * @returns Combined weights
 */
export function combineVibeWeights(primary: VibeCategory, secondary?: VibeCategory): PlanetWeights {
  if (!secondary) {
    return { ...primary.weights }
  }

  return blendVibes([
    { vibe: primary, ratio: 0.7 },
    { vibe: secondary, ratio: 0.3 },
  ])
}

// =============================================================================
// Weight Normalization
// =============================================================================

/**
 * Normalize weights to sum to a specific total.
 *
 * @param weights - Raw weights
 * @param targetSum - Desired sum (default 100)
 * @returns Normalized weights
 */
export function normalizeWeights(weights: PlanetWeights, targetSum: number = 100): PlanetWeights {
  const currentSum = PLANET_IDS.reduce((sum, p) => sum + weights[p], 0)
  if (currentSum === 0) return DEFAULT_WEIGHTS

  const factor = targetSum / currentSum
  const result = zeroWeights()

  for (const planet of PLANET_IDS) {
    result[planet] = weights[planet] * factor
  }

  return result
}

/**
 * Scale weights by a factor.
 */
export function scaleWeights(weights: PlanetWeights, factor: number): PlanetWeights {
  const result = zeroWeights()

  for (const planet of PLANET_IDS) {
    result[planet] = weights[planet] * factor
  }

  return result
}

// =============================================================================
// Vibe Information
// =============================================================================

/**
 * Get a vibe category by ID.
 */
export function getVibeById(id: string): VibeCategory | undefined {
  return VIBE_CATEGORIES.find((v) => v.id === id)
}

/**
 * Get all available vibe categories.
 */
export function getAllVibes(): Array<VibeCategory> {
  return [...VIBE_CATEGORIES]
}

/**
 * Get the primary planets for a vibe.
 */
export function getPrimaryPlanets(vibe: VibeCategory): Array<PlanetId> {
  return vibe.primaryPlanets
}

/**
 * Describe what a weight distribution prioritizes.
 */
export function describeWeights(weights: PlanetWeights): string {
  const sorted = PLANET_IDS.map((p) => ({ planet: p, weight: weights[p] })).sort(
    (a, b) => b.weight - a.weight,
  )

  const top3 = sorted.slice(0, 3)
  const planetNames: Record<PlanetId, string> = {
    sun: 'Sun',
    moon: 'Moon',
    mercury: 'Mercury',
    venus: 'Venus',
    mars: 'Mars',
    jupiter: 'Jupiter',
    saturn: 'Saturn',
    uranus: 'Uranus',
    neptune: 'Neptune',
    pluto: 'Pluto',
  }

  return `Prioritizes ${top3.map((p) => planetNames[p.planet]).join(', ')}`
}
