/**
 * Out of Bounds (OOB) Detection - Swiss Ephemeris Enhanced
 * PDF Reference: Part I, Section 1.2
 *
 * OOB planets operate outside the "jurisdiction" of the solar hierarchy.
 * They manifest as extreme, non-conforming, or genius archetypes.
 *
 * This module uses Swiss Ephemeris for true obliquity calculation
 * which includes nutation effects.
 */
import { SwissEphService } from './swissephService'
import type { PlanetDeclinations, PlanetId } from '../core/types'

export interface OOBResult {
  isOutOfBounds: boolean
  declination: number
  obliquity: number
  oobDegrees: number
  direction: 'north' | 'south' | null
}

export interface EnhancedOOBResult extends OOBResult {
  planet: PlanetId
  meanObliquity: number
  trueObliquity: number
  nutationInObliquity: number
}

/**
 * Check if a planet is Out of Bounds using Swiss Ephemeris true obliquity
 * Uses dynamic obliquity calculation for the exact epoch
 *
 * @param jd - Julian Day
 * @param declination - Planet's declination in degrees
 * @returns OOB status with full details
 */
export async function checkOutOfBounds(jd: number, declination: number): Promise<OOBResult> {
  // Validate input to ensure consistent behavior with checkAllOutOfBounds
  if (!Number.isFinite(declination)) {
    throw new Error(`Invalid declination: ${declination}`)
  }

  const swe = SwissEphService.getInstance()
  await swe.initialize()

  const obliquity = await swe.getTrueObliquity(jd)
  const absDec = Math.abs(declination)
  const isOOB = absDec > obliquity

  return {
    isOutOfBounds: isOOB,
    declination,
    obliquity,
    oobDegrees: isOOB ? absDec - obliquity : 0,
    direction: isOOB ? (declination > 0 ? 'north' : 'south') : null,
  }
}

/**
 * Check OOB status for all planets with full obliquity details
 *
 * @param jd - Julian Day
 * @param declinations - All planet declinations
 * @returns Map of planet to enhanced OOB result
 */
export async function checkAllOutOfBounds(
  jd: number,
  declinations: PlanetDeclinations,
): Promise<Record<PlanetId, EnhancedOOBResult>> {
  const swe = SwissEphService.getInstance()
  await swe.initialize()

  const trueObliquity = await swe.getTrueObliquity(jd)
  const meanObliquity = await swe.getMeanObliquity(jd)
  const nutationInObliquity = trueObliquity - meanObliquity

  const result: Partial<Record<PlanetId, EnhancedOOBResult>> = {}

  const planets: Array<PlanetId> = [
    'sun',
    'moon',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
    'pluto',
  ]

  for (const planet of planets) {
    const dec = declinations[planet]
    if (!Number.isFinite(dec)) {
      throw new Error(`Invalid declination for ${planet}: ${dec}`)
    }
    const absDec = Math.abs(dec)
    const isOOB = absDec > trueObliquity

    result[planet] = {
      planet,
      isOutOfBounds: isOOB,
      declination: dec,
      obliquity: trueObliquity,
      oobDegrees: isOOB ? absDec - trueObliquity : 0,
      direction: isOOB ? (dec > 0 ? 'north' : 'south') : null,
      meanObliquity,
      trueObliquity,
      nutationInObliquity,
    }
  }

  return result as Record<PlanetId, EnhancedOOBResult>
}

/**
 * Get list of OOB planets
 */
export async function getOOBPlanets(
  jd: number,
  declinations: PlanetDeclinations,
): Promise<Array<{ planet: PlanetId; oobDegrees: number; direction: 'north' | 'south' }>> {
  const allStatus = await checkAllOutOfBounds(jd, declinations)

  return Object.values(allStatus)
    .filter((s) => s.isOutOfBounds)
    .map((s) => ({
      planet: s.planet,
      oobDegrees: s.oobDegrees,
      direction: s.direction as 'north' | 'south',
    }))
    .sort((a, b) => b.oobDegrees - a.oobDegrees) // Sort by most OOB first
}

/**
 * Interpret the significance of being OOB
 *
 * Moon OOB: Enhanced intuition, emotional extremes
 * Mercury OOB: Unconventional thinking, unique communication
 * Venus OOB: Extreme tastes, unusual relationships
 * Mars OOB: Exceptional drive or aggression
 * Pluto OOB: Intensified transformation energy
 */
export const OOB_INTERPRETATIONS: Record<PlanetId, string> = {
  sun: 'The Sun cannot be OOB as it defines the obliquity limit.',
  moon: 'Heightened emotional nature, strong intuition, may feel like an outsider emotionally.',
  mercury: 'Unconventional thinking, unique communication style, original ideas.',
  venus: 'Unusual tastes in art, love, or values. May attract unconventional relationships.',
  mars: 'Exceptional drive and energy. May excel in athletics or face anger management challenges.',
  jupiter: 'Extreme optimism or excess. Philosophical beliefs may be unconventional.',
  saturn: 'Unusual approach to structure and authority. May reject or transform traditions.',
  uranus: 'Intensified originality and independence. Strong desire to break free.',
  neptune: 'Heightened imagination and spiritual sensitivity. May struggle with boundaries.',
  pluto: 'Intensified transformation drive. Deep psychological insights or power issues.',
}

/**
 * Calculate the maximum possible declination for each planet
 * Based on their orbital inclinations relative to the ecliptic
 */
export const PLANET_MAX_DECLINATIONS: Record<PlanetId, number> = {
  sun: 23.44, // By definition (obliquity)
  moon: 28.58, // Moon's orbit inclined 5.14° to ecliptic, so max = 23.44 + 5.14
  mercury: 27.1, // Orbital inclination ~7°
  venus: 28.0, // Orbital inclination ~3.4°, observed max ~28°
  mars: 28.9, // Orbital inclination ~1.85°, observed historical max ~28°54′
  jupiter: 23.5, // Orbital inclination ~1.3°
  saturn: 23.44, // Orbital inclination ~2.5° but max matches obliquity
  uranus: 24.0, // Orbital inclination ~0.77°
  neptune: 23.6, // Orbital inclination ~1.77°
  pluto: 40.0, // Orbital inclination ~17°, frequently OOB!
}
