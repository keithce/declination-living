/**
 * Essential Dignity Tables.
 *
 * Traditional dignity assignments based on Hellenistic and Medieval astrology.
 * Includes domicile (rulership), exaltation, detriment, fall, and triplicity.
 */

import type { PlanetId, ZodiacSign } from "../core/types"

// =============================================================================
// Domicile (Rulership)
// =============================================================================

/**
 * Domicile rulership - each planet rules one or two signs.
 * The planet is "at home" in these signs.
 * Points: +5
 */
export const DOMICILE: Record<ZodiacSign, PlanetId[]> = {
  aries: ["mars"],
  taurus: ["venus"],
  gemini: ["mercury"],
  cancer: ["moon"],
  leo: ["sun"],
  virgo: ["mercury"],
  libra: ["venus"],
  scorpio: ["mars", "pluto"], // Traditional: Mars, Modern: Pluto
  sagittarius: ["jupiter"],
  capricorn: ["saturn"],
  aquarius: ["saturn", "uranus"], // Traditional: Saturn, Modern: Uranus
  pisces: ["jupiter", "neptune"], // Traditional: Jupiter, Modern: Neptune
}

/**
 * Get the sign(s) a planet rules.
 */
export function getRuledSigns(planet: PlanetId): ZodiacSign[] {
  const signs: ZodiacSign[] = []
  for (const [sign, rulers] of Object.entries(DOMICILE)) {
    if (rulers.includes(planet)) {
      signs.push(sign as ZodiacSign)
    }
  }
  return signs
}

/**
 * Check if a planet is in its domicile.
 */
export function isInDomicile(planet: PlanetId, sign: ZodiacSign): boolean {
  return DOMICILE[sign].includes(planet)
}

// =============================================================================
// Exaltation
// =============================================================================

/**
 * Exaltation - each planet has one sign where it is exalted.
 * Also includes the exact degree of exaltation.
 * Points: +4
 */
export const EXALTATION: Partial<
  Record<PlanetId, { sign: ZodiacSign; exactDegree: number }>
> = {
  sun: { sign: "aries", exactDegree: 19 },
  moon: { sign: "taurus", exactDegree: 3 },
  mercury: { sign: "virgo", exactDegree: 15 },
  venus: { sign: "pisces", exactDegree: 27 },
  mars: { sign: "capricorn", exactDegree: 28 },
  jupiter: { sign: "cancer", exactDegree: 15 },
  saturn: { sign: "libra", exactDegree: 21 },
  // Outer planets - various traditions
  uranus: { sign: "scorpio", exactDegree: 15 }, // Some traditions
  neptune: { sign: "cancer", exactDegree: 15 }, // Some traditions
  pluto: { sign: "leo", exactDegree: 15 }, // Some traditions
}

/**
 * Get the sign a planet is exalted in.
 */
export function getExaltationSign(planet: PlanetId): ZodiacSign | null {
  return EXALTATION[planet]?.sign ?? null
}

/**
 * Check if a planet is in its exaltation.
 */
export function isInExaltation(planet: PlanetId, sign: ZodiacSign): boolean {
  return EXALTATION[planet]?.sign === sign
}

// =============================================================================
// Detriment
// =============================================================================

/**
 * Detriment - opposite sign from domicile.
 * The planet is uncomfortable/weakened here.
 * Points: -5
 */
export const DETRIMENT: Partial<Record<PlanetId, ZodiacSign[]>> = {
  sun: ["aquarius"],
  moon: ["capricorn"],
  mercury: ["sagittarius", "pisces"],
  venus: ["aries", "scorpio"],
  mars: ["taurus", "libra"],
  jupiter: ["gemini", "virgo"],
  saturn: ["cancer", "leo"],
  uranus: ["leo"],
  neptune: ["virgo"],
  pluto: ["taurus"],
}

/**
 * Check if a planet is in its detriment.
 */
export function isInDetriment(planet: PlanetId, sign: ZodiacSign): boolean {
  return DETRIMENT[planet]?.includes(sign) ?? false
}

// =============================================================================
// Fall
// =============================================================================

/**
 * Fall - opposite sign from exaltation.
 * The planet is weakened/debilitated here.
 * Points: -4
 */
export const FALL: Partial<Record<PlanetId, ZodiacSign>> = {
  sun: "libra",
  moon: "scorpio",
  mercury: "pisces",
  venus: "virgo",
  mars: "cancer",
  jupiter: "capricorn",
  saturn: "aries",
  uranus: "taurus", // Some traditions
  neptune: "capricorn", // Some traditions
  pluto: "aquarius", // Some traditions
}

/**
 * Check if a planet is in its fall.
 */
export function isInFall(planet: PlanetId, sign: ZodiacSign): boolean {
  return FALL[planet] === sign
}

// =============================================================================
// Triplicity (Elemental Rulership)
// =============================================================================

/**
 * Elements for each sign.
 */
export const SIGN_ELEMENTS: Record<ZodiacSign, "fire" | "earth" | "air" | "water"> = {
  aries: "fire",
  leo: "fire",
  sagittarius: "fire",
  taurus: "earth",
  virgo: "earth",
  capricorn: "earth",
  gemini: "air",
  libra: "air",
  aquarius: "air",
  cancer: "water",
  scorpio: "water",
  pisces: "water",
}

/**
 * Triplicity rulers by element (Dorothean system).
 * Points: +3
 *
 * Day ruler is used when Sun is above horizon.
 * Night ruler is used when Sun is below horizon.
 * Participating ruler always applies (weaker).
 */
export const TRIPLICITY_DOROTHEAN: Record<
  "fire" | "earth" | "air" | "water",
  { day: PlanetId; night: PlanetId; participating: PlanetId }
> = {
  fire: { day: "sun", night: "jupiter", participating: "saturn" },
  earth: { day: "venus", night: "moon", participating: "mars" },
  air: { day: "saturn", night: "mercury", participating: "jupiter" },
  water: { day: "venus", night: "mars", participating: "moon" },
}

/**
 * Check if a planet has triplicity in a sign.
 *
 * @param planet - Planet to check
 * @param sign - Sign position
 * @param isDay - Whether it's a day chart (Sun above horizon)
 * @returns "day" | "night" | "participating" | null
 */
export function getTriplicityStatus(
  planet: PlanetId,
  sign: ZodiacSign,
  isDay: boolean
): "day" | "night" | "participating" | null {
  const element = SIGN_ELEMENTS[sign]
  const triplicity = TRIPLICITY_DOROTHEAN[element]

  if (isDay && triplicity.day === planet) return "day"
  if (!isDay && triplicity.night === planet) return "night"
  if (triplicity.participating === planet) return "participating"

  return null
}

/**
 * Check if a planet is a triplicity ruler.
 */
export function isTriplicityRuler(
  planet: PlanetId,
  sign: ZodiacSign,
  isDay: boolean
): boolean {
  return getTriplicityStatus(planet, sign, isDay) !== null
}

// =============================================================================
// Quick Lookups
// =============================================================================

/**
 * Get all dignities for a planet in a sign.
 */
export function getDignities(
  planet: PlanetId,
  sign: ZodiacSign,
  isDay: boolean
): {
  domicile: boolean
  exaltation: boolean
  triplicity: "day" | "night" | "participating" | null
  detriment: boolean
  fall: boolean
} {
  return {
    domicile: isInDomicile(planet, sign),
    exaltation: isInExaltation(planet, sign),
    triplicity: getTriplicityStatus(planet, sign, isDay),
    detriment: isInDetriment(planet, sign),
    fall: isInFall(planet, sign),
  }
}

/**
 * Get the natural significator for a sign (its ruler).
 */
export function getSignRuler(sign: ZodiacSign): PlanetId {
  // Return traditional ruler (first in array)
  return DOMICILE[sign][0]
}
