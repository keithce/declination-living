/**
 * Sect Calculator.
 *
 * Determines chart sect (day/night) and planet sect classification.
 * Sect affects triplicity rulership and provides dignity modifiers.
 */

import type { PlanetId, Sect } from '../core/types'

// Re-export Sect type for convenience
export type { Sect }

// =============================================================================
// Types
// =============================================================================

/** Planet sect classification */
export type SectPlanetClass = 'day' | 'night' | 'neutral'

// =============================================================================
// Constants
// =============================================================================

/**
 * Sect classification for each planet.
 *
 * Day sect (diurnal): Sun, Jupiter, Saturn
 * Night sect (nocturnal): Moon, Venus, Mars
 * Neutral (common): Mercury, outer planets
 */
export const SECT_PLANETS: Record<PlanetId, SectPlanetClass> = {
  sun: 'day',
  jupiter: 'day',
  saturn: 'day',
  moon: 'night',
  venus: 'night',
  mars: 'night',
  mercury: 'neutral',
  uranus: 'neutral',
  neptune: 'neutral',
  pluto: 'neutral',
}

// =============================================================================
// Sect Determination
// =============================================================================

/**
 * Determine sect from Sun's altitude (most accurate method).
 *
 * @param sunAltitude - Sun's altitude in degrees (positive = above horizon)
 * @returns 'day' if Sun is above horizon, 'night' if below
 */
export function sectFromSunAltitude(sunAltitude: number): Sect {
  return sunAltitude >= 0 ? 'day' : 'night'
}

/**
 * Determine sect from Sun and Ascendant positions.
 *
 * This is a simplified calculation based on zodiacal longitude.
 * For precise sect determination, use sectFromSunAltitude with
 * actual altitude calculations.
 *
 * @param sunLongitude - Sun's zodiac longitude (0-360)
 * @param ascendant - Ascendant longitude (0-360)
 * @returns 'day' if Sun is in upper hemisphere, 'night' if lower
 */
export function sectFromPositions(sunLongitude: number, ascendant: number): Sect {
  // Descendant is opposite the Ascendant
  const descendant = (ascendant + 180) % 360

  // Normalize all values
  const sunNorm = ((sunLongitude % 360) + 360) % 360
  const ascNorm = ((ascendant % 360) + 360) % 360
  const dscNorm = ((descendant % 360) + 360) % 360

  // Sun is above horizon if it's between ASC and DSC (going counterclockwise)
  // Upper hemisphere: from ASC counterclockwise to DSC
  if (ascNorm < dscNorm) {
    return sunNorm >= ascNorm && sunNorm < dscNorm ? 'day' : 'night'
  } else {
    // ASC > DSC (e.g., ASC = 350°, DSC = 170°)
    return sunNorm >= ascNorm || sunNorm < dscNorm ? 'day' : 'night'
  }
}

// =============================================================================
// Planet Sect Functions
// =============================================================================

/**
 * Check if a planet is in its preferred sect.
 *
 * Day planets prefer day charts, night planets prefer night charts.
 * Mercury and outer planets are neutral (return null).
 *
 * @param planet - Planet to check
 * @param sect - Current chart sect
 * @returns true if in-sect, false if out-of-sect, null if neutral
 */
export function isPlanetInSect(planet: PlanetId, sect: Sect): boolean | null {
  const planetSect = SECT_PLANETS[planet]

  if (planetSect === 'neutral') {
    return null
  }

  return planetSect === sect
}

/**
 * Get the sect-based dignity modifier for a planet.
 *
 * Traditional astrology gives subtle bonuses/penalties based on sect:
 * - In-sect planet: +1
 * - Out-of-sect planet: -1
 * - Neutral planet: 0
 *
 * @param planet - Planet to check
 * @param sect - Current chart sect
 * @returns +1, -1, or 0
 */
export function getSectModifier(planet: PlanetId, sect: Sect): number {
  const inSect = isPlanetInSect(planet, sect)

  if (inSect === null) {
    return 0 // Neutral planets
  }

  return inSect ? 1 : -1
}

/**
 * Get the sect classification for a planet.
 *
 * @param planet - Planet to check
 * @returns 'day', 'night', or 'neutral'
 */
export function getPlanetSectClass(planet: PlanetId): SectPlanetClass {
  return SECT_PLANETS[planet]
}

/**
 * Get all planets of a given sect class.
 *
 * @param sectClass - 'day', 'night', or 'neutral'
 * @returns Array of planet IDs in that class
 */
export function getPlanetsBySectClass(sectClass: SectPlanetClass): Array<PlanetId> {
  return (Object.entries(SECT_PLANETS) as Array<[PlanetId, SectPlanetClass]>)
    .filter(([, sc]) => sc === sectClass)
    .map(([planet]) => planet)
}
