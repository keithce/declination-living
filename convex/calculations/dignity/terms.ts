/**
 * Terms (Bounds) - Essential Dignity.
 *
 * Each sign is divided into 5 unequal segments, each ruled by a planet.
 * Points: +2
 *
 * Two main systems:
 * - Egyptian Terms (most commonly used)
 * - Ptolemaic Terms (from Ptolemy's Tetrabiblos)
 */

import type { PlanetId, ZodiacSign } from "../core/types"

// =============================================================================
// Types
// =============================================================================

/** A term segment within a sign */
export interface TermSegment {
  planet: PlanetId
  /** End degree of this term (exclusive). Start is previous end or 0. */
  endDegree: number
}

// =============================================================================
// Egyptian Terms
// =============================================================================

/**
 * Egyptian Terms - the most widely used system.
 * Each sign has 5 terms ruled by Mercury, Venus, Mars, Jupiter, Saturn.
 * (Sun and Moon don't rule terms in traditional systems)
 */
export const EGYPTIAN_TERMS: Record<ZodiacSign, TermSegment[]> = {
  aries: [
    { planet: "jupiter", endDegree: 6 },
    { planet: "venus", endDegree: 12 },
    { planet: "mercury", endDegree: 20 },
    { planet: "mars", endDegree: 25 },
    { planet: "saturn", endDegree: 30 },
  ],
  taurus: [
    { planet: "venus", endDegree: 8 },
    { planet: "mercury", endDegree: 14 },
    { planet: "jupiter", endDegree: 22 },
    { planet: "saturn", endDegree: 27 },
    { planet: "mars", endDegree: 30 },
  ],
  gemini: [
    { planet: "mercury", endDegree: 6 },
    { planet: "jupiter", endDegree: 12 },
    { planet: "venus", endDegree: 17 },
    { planet: "mars", endDegree: 24 },
    { planet: "saturn", endDegree: 30 },
  ],
  cancer: [
    { planet: "mars", endDegree: 7 },
    { planet: "venus", endDegree: 13 },
    { planet: "mercury", endDegree: 19 },
    { planet: "jupiter", endDegree: 26 },
    { planet: "saturn", endDegree: 30 },
  ],
  leo: [
    { planet: "jupiter", endDegree: 6 },
    { planet: "venus", endDegree: 11 },
    { planet: "saturn", endDegree: 18 },
    { planet: "mercury", endDegree: 24 },
    { planet: "mars", endDegree: 30 },
  ],
  virgo: [
    { planet: "mercury", endDegree: 7 },
    { planet: "venus", endDegree: 17 },
    { planet: "jupiter", endDegree: 21 },
    { planet: "mars", endDegree: 28 },
    { planet: "saturn", endDegree: 30 },
  ],
  libra: [
    { planet: "saturn", endDegree: 6 },
    { planet: "mercury", endDegree: 14 },
    { planet: "jupiter", endDegree: 21 },
    { planet: "venus", endDegree: 28 },
    { planet: "mars", endDegree: 30 },
  ],
  scorpio: [
    { planet: "mars", endDegree: 7 },
    { planet: "venus", endDegree: 11 },
    { planet: "mercury", endDegree: 19 },
    { planet: "jupiter", endDegree: 24 },
    { planet: "saturn", endDegree: 30 },
  ],
  sagittarius: [
    { planet: "jupiter", endDegree: 12 },
    { planet: "venus", endDegree: 17 },
    { planet: "mercury", endDegree: 21 },
    { planet: "saturn", endDegree: 26 },
    { planet: "mars", endDegree: 30 },
  ],
  capricorn: [
    { planet: "mercury", endDegree: 7 },
    { planet: "jupiter", endDegree: 14 },
    { planet: "venus", endDegree: 22 },
    { planet: "saturn", endDegree: 26 },
    { planet: "mars", endDegree: 30 },
  ],
  aquarius: [
    { planet: "mercury", endDegree: 7 },
    { planet: "venus", endDegree: 13 },
    { planet: "jupiter", endDegree: 20 },
    { planet: "mars", endDegree: 25 },
    { planet: "saturn", endDegree: 30 },
  ],
  pisces: [
    { planet: "venus", endDegree: 12 },
    { planet: "jupiter", endDegree: 16 },
    { planet: "mercury", endDegree: 19 },
    { planet: "mars", endDegree: 28 },
    { planet: "saturn", endDegree: 30 },
  ],
}

// =============================================================================
// Ptolemaic Terms
// =============================================================================

/**
 * Ptolemaic Terms - an alternative system from Ptolemy.
 * Slightly different boundaries than Egyptian terms.
 */
export const PTOLEMAIC_TERMS: Record<ZodiacSign, TermSegment[]> = {
  aries: [
    { planet: "jupiter", endDegree: 6 },
    { planet: "venus", endDegree: 14 },
    { planet: "mercury", endDegree: 21 },
    { planet: "mars", endDegree: 26 },
    { planet: "saturn", endDegree: 30 },
  ],
  taurus: [
    { planet: "venus", endDegree: 8 },
    { planet: "mercury", endDegree: 15 },
    { planet: "jupiter", endDegree: 22 },
    { planet: "saturn", endDegree: 26 },
    { planet: "mars", endDegree: 30 },
  ],
  gemini: [
    { planet: "mercury", endDegree: 7 },
    { planet: "jupiter", endDegree: 14 },
    { planet: "venus", endDegree: 21 },
    { planet: "saturn", endDegree: 25 },
    { planet: "mars", endDegree: 30 },
  ],
  cancer: [
    { planet: "mars", endDegree: 6 },
    { planet: "jupiter", endDegree: 13 },
    { planet: "mercury", endDegree: 20 },
    { planet: "venus", endDegree: 27 },
    { planet: "saturn", endDegree: 30 },
  ],
  leo: [
    { planet: "saturn", endDegree: 6 },
    { planet: "mercury", endDegree: 13 },
    { planet: "venus", endDegree: 19 },
    { planet: "jupiter", endDegree: 25 },
    { planet: "mars", endDegree: 30 },
  ],
  virgo: [
    { planet: "mercury", endDegree: 7 },
    { planet: "venus", endDegree: 13 },
    { planet: "jupiter", endDegree: 18 },
    { planet: "saturn", endDegree: 24 },
    { planet: "mars", endDegree: 30 },
  ],
  libra: [
    { planet: "saturn", endDegree: 6 },
    { planet: "venus", endDegree: 11 },
    { planet: "jupiter", endDegree: 19 },
    { planet: "mercury", endDegree: 24 },
    { planet: "mars", endDegree: 30 },
  ],
  scorpio: [
    { planet: "mars", endDegree: 6 },
    { planet: "jupiter", endDegree: 14 },
    { planet: "venus", endDegree: 21 },
    { planet: "mercury", endDegree: 27 },
    { planet: "saturn", endDegree: 30 },
  ],
  sagittarius: [
    { planet: "jupiter", endDegree: 8 },
    { planet: "venus", endDegree: 14 },
    { planet: "mercury", endDegree: 19 },
    { planet: "saturn", endDegree: 25 },
    { planet: "mars", endDegree: 30 },
  ],
  capricorn: [
    { planet: "venus", endDegree: 6 },
    { planet: "mercury", endDegree: 12 },
    { planet: "jupiter", endDegree: 19 },
    { planet: "mars", endDegree: 25 },
    { planet: "saturn", endDegree: 30 },
  ],
  aquarius: [
    { planet: "saturn", endDegree: 6 },
    { planet: "mercury", endDegree: 12 },
    { planet: "venus", endDegree: 20 },
    { planet: "jupiter", endDegree: 25 },
    { planet: "mars", endDegree: 30 },
  ],
  pisces: [
    { planet: "venus", endDegree: 8 },
    { planet: "jupiter", endDegree: 14 },
    { planet: "mercury", endDegree: 20 },
    { planet: "mars", endDegree: 26 },
    { planet: "saturn", endDegree: 30 },
  ],
}

// =============================================================================
// Term Functions
// =============================================================================

export type TermSystem = "egyptian" | "ptolemaic"

/**
 * Get the term ruler for a position in a sign.
 *
 * @param sign - Zodiac sign
 * @param degree - Degree within the sign (0-30)
 * @param system - Which term system to use
 * @returns Planet that rules this term
 */
export function getTermRuler(
  sign: ZodiacSign,
  degree: number,
  system: TermSystem = "egyptian"
): PlanetId {
  const terms = system === "egyptian" ? EGYPTIAN_TERMS[sign] : PTOLEMAIC_TERMS[sign]

  for (const term of terms) {
    if (degree < term.endDegree) {
      return term.planet
    }
  }

  // Should never reach here, but return last ruler just in case
  return terms[terms.length - 1].planet
}

/**
 * Check if a planet is in its own terms.
 *
 * @param planet - Planet to check
 * @param sign - Sign position
 * @param degree - Degree within sign
 * @param system - Term system
 * @returns True if planet is in its own terms
 */
export function isInOwnTerms(
  planet: PlanetId,
  sign: ZodiacSign,
  degree: number,
  system: TermSystem = "egyptian"
): boolean {
  // Sun and Moon don't have terms in traditional systems
  if (planet === "sun" || planet === "moon") {
    return false
  }

  // Outer planets don't have terms either
  if (planet === "uranus" || planet === "neptune" || planet === "pluto") {
    return false
  }

  return getTermRuler(sign, degree, system) === planet
}

/**
 * Get the term boundaries for a sign.
 *
 * @param sign - Zodiac sign
 * @param system - Term system
 * @returns Array of {planet, startDegree, endDegree}
 */
export function getTermBoundaries(
  sign: ZodiacSign,
  system: TermSystem = "egyptian"
): Array<{ planet: PlanetId; startDegree: number; endDegree: number }> {
  const terms = system === "egyptian" ? EGYPTIAN_TERMS[sign] : PTOLEMAIC_TERMS[sign]

  let startDegree = 0
  return terms.map((term) => {
    const result = {
      planet: term.planet,
      startDegree,
      endDegree: term.endDegree,
    }
    startDegree = term.endDegree
    return result
  })
}
