import { mutation } from '../_generated/server'

const DEFAULT_WEIGHTS = {
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

const PRESETS = [
  {
    name: 'Balanced',
    description: 'Equal weight to all planets for a holistic assessment',
    icon: 'balance-scale',
    weights: { ...DEFAULT_WEIGHTS },
    order: 0,
  },
  {
    name: 'Relationships',
    description: 'Emphasizes Venus, Moon, and Mars for love and connection',
    icon: 'heart',
    weights: {
      ...DEFAULT_WEIGHTS,
      venus: 3,
      moon: 2.5,
      mars: 1.5,
    },
    order: 1,
  },
  {
    name: 'Career',
    description: 'Focuses on Saturn, Sun, and Jupiter for professional success',
    icon: 'briefcase',
    weights: {
      ...DEFAULT_WEIGHTS,
      saturn: 3,
      sun: 2.5,
      jupiter: 2,
    },
    order: 2,
  },
  {
    name: 'Wealth',
    description: 'Prioritizes Jupiter, Venus, and Mercury for financial abundance',
    icon: 'coins',
    weights: {
      ...DEFAULT_WEIGHTS,
      jupiter: 3,
      venus: 2.5,
      mercury: 2,
    },
    order: 3,
  },
  {
    name: 'Creativity',
    description: 'Highlights Neptune, Venus, and Moon for artistic expression',
    icon: 'palette',
    weights: {
      ...DEFAULT_WEIGHTS,
      neptune: 3,
      venus: 2.5,
      moon: 2,
    },
    order: 4,
  },
  {
    name: 'Spiritual',
    description: 'Emphasizes Neptune, Jupiter, and Moon for inner growth',
    icon: 'lotus',
    weights: {
      ...DEFAULT_WEIGHTS,
      neptune: 3,
      jupiter: 2.5,
      moon: 2,
    },
    order: 5,
  },
  {
    name: 'Health',
    description: 'Focuses on Sun, Mars, and Jupiter for vitality and wellness',
    icon: 'heart-pulse',
    weights: {
      ...DEFAULT_WEIGHTS,
      sun: 3,
      mars: 2.5,
      jupiter: 2,
    },
    order: 6,
  },
]

export const seedPresets = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if presets already exist
    const existing = await ctx.db.query('presets').first()
    if (existing) {
      return { message: 'Presets already seeded' }
    }

    // Insert all presets
    for (const preset of PRESETS) {
      await ctx.db.insert('presets', preset)
    }

    return { message: `Seeded ${PRESETS.length} presets` }
  },
})
