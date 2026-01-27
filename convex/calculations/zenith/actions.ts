'use node'

/**
 * Zenith Calculation Actions
 *
 * Domain-specific action for calculating zenith lines.
 * Zenith lines are instant calculations based on declinations,
 * so no caching is needed.
 */

import { v } from 'convex/values'
import { action } from '../../_generated/server'
import { calculateDeclinations, dateToJulianDay } from '../ephemeris'
import { calculateAllZenithLines } from '../acg/zenith'
import { DEFAULT_DECLINATION_ORB } from '../core/constants'
import type { PlanetDeclinations } from '../ephemeris'
import type { ZenithLine } from '../core/types'

// =============================================================================
// Result Types
// =============================================================================

/** Zenith calculation result type */
interface ZenithResult {
  julianDay: number
  zenithLines: Array<ZenithLine>
  declinations: PlanetDeclinations
}

// =============================================================================
// Zenith Calculation Action
// =============================================================================

/**
 * Calculate zenith lines for a given birth date and time.
 *
 * This is the fastest visualization calculation - it only depends on
 * declinations and can render immediately after Phase 1 completes.
 *
 * Zenith lines represent latitudes where planets pass directly overhead.
 * No caching needed as this is an instant calculation.
 *
 * @param birthDate - Birth date in YYYY-MM-DD format
 * @param birthTime - Birth time in HH:MM format
 * @param timezone - IANA timezone string
 * @param orb - Orb in degrees for zenith bands (default: 1.0)
 * @returns Zenith lines, declinations, and Julian Day
 */
export const calculateZenithLines = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    timezone: v.string(),
    orb: v.optional(v.number()),
  },
  handler: async (_ctx, { birthDate, birthTime, timezone, orb }): Promise<ZenithResult> => {
    const effectiveOrb = orb ?? DEFAULT_DECLINATION_ORB

    // Calculate Julian Day and declinations
    const jd = dateToJulianDay(birthDate, birthTime, timezone)
    const declinations = calculateDeclinations(jd)

    // Calculate zenith lines (instant - just maps declinations)
    const zenithLines = calculateAllZenithLines(declinations, effectiveOrb)

    return {
      julianDay: jd,
      zenithLines,
      declinations,
    }
  },
})

/**
 * Calculate zenith lines from pre-computed declinations.
 *
 * Useful when declinations are already available from Phase 1 results.
 *
 * @param declinations - Pre-computed planet declinations
 * @param orb - Orb in degrees for zenith bands (default: 1.0)
 * @returns Zenith lines
 */
export const calculateZenithLinesFromDeclinations = action({
  args: {
    declinations: v.object({
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
    }),
    orb: v.optional(v.number()),
  },
  handler: async (_ctx, { declinations, orb }): Promise<{ zenithLines: Array<ZenithLine> }> => {
    const effectiveOrb = orb ?? DEFAULT_DECLINATION_ORB
    const zenithLines = calculateAllZenithLines(declinations, effectiveOrb)

    return { zenithLines }
  },
})
