/**
 * Decans (Faces) - Essential Dignity.
 *
 * Each sign is divided into three 10° segments called decans or faces.
 * Points: +1
 *
 * The Chaldean order assigns rulers based on the traditional planet order:
 * Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon (then repeats)
 *
 * Starting from Aries first decan (Mars), this creates a continuous cycle.
 */

import type { PlanetId, ZodiacSign } from "../core/types"

// =============================================================================
// Chaldean Order
// =============================================================================

/**
 * The Chaldean order of planets (by orbital period, slowest to fastest).
 * This order is used for decan assignments and planetary hours.
 */
export const CHALDEAN_ORDER: PlanetId[] = [
  "saturn",
  "jupiter",
  "mars",
  "sun",
  "venus",
  "mercury",
  "moon",
]

// =============================================================================
// Decan Assignments
// =============================================================================

/**
 * Decan rulers for each sign.
 * Each sign has three decans (0-10°, 10-20°, 20-30°).
 *
 * The pattern follows the Chaldean order starting from Mars for Aries.
 */
export const DECANS: Record<ZodiacSign, [PlanetId, PlanetId, PlanetId]> = {
  // Fire signs
  aries: ["mars", "sun", "venus"],
  leo: ["saturn", "jupiter", "mars"],
  sagittarius: ["mercury", "moon", "saturn"],

  // Earth signs
  taurus: ["mercury", "moon", "saturn"],
  virgo: ["sun", "venus", "mercury"],
  capricorn: ["jupiter", "mars", "sun"],

  // Air signs
  gemini: ["jupiter", "mars", "sun"],
  libra: ["moon", "saturn", "jupiter"],
  aquarius: ["venus", "mercury", "moon"],

  // Water signs
  cancer: ["venus", "mercury", "moon"],
  scorpio: ["mars", "sun", "venus"],
  pisces: ["saturn", "jupiter", "mars"],
}

// =============================================================================
// Decan Functions
// =============================================================================

/**
 * Get the decan number (1, 2, or 3) for a degree within a sign.
 *
 * @param degree - Degree within the sign (0-30)
 * @returns Decan number (1, 2, or 3)
 */
export function getDecanNumber(degree: number): 1 | 2 | 3 {
  if (degree < 10) return 1
  if (degree < 20) return 2
  return 3
}

/**
 * Get the decan ruler for a position.
 *
 * @param sign - Zodiac sign
 * @param degree - Degree within the sign (0-30)
 * @returns Planet that rules this decan
 */
export function getDecanRuler(sign: ZodiacSign, degree: number): PlanetId {
  const decanNumber = getDecanNumber(degree)
  return DECANS[sign][decanNumber - 1]
}

/**
 * Check if a planet is in its own decan/face.
 *
 * @param planet - Planet to check
 * @param sign - Sign position
 * @param degree - Degree within sign
 * @returns True if planet is in its own face
 */
export function isInOwnFace(
  planet: PlanetId,
  sign: ZodiacSign,
  degree: number
): boolean {
  return getDecanRuler(sign, degree) === planet
}

/**
 * Get all three decan rulers for a sign.
 *
 * @param sign - Zodiac sign
 * @returns Array of three planet rulers
 */
export function getSignDecans(sign: ZodiacSign): [PlanetId, PlanetId, PlanetId] {
  return DECANS[sign]
}

// =============================================================================
// Decan by Absolute Degree
// =============================================================================

/**
 * Get the decan ruler for an absolute zodiac longitude.
 *
 * @param longitude - Absolute zodiac longitude (0-360)
 * @returns Decan ruler
 */
export function getDecanRulerByLongitude(longitude: number): PlanetId {
  // Normalize to 0-360
  const normalizedLon = ((longitude % 360) + 360) % 360

  // Calculate sign (0-11) and degree within sign (0-30)
  const signIndex = Math.floor(normalizedLon / 30)
  const degree = normalizedLon % 30

  const signs: ZodiacSign[] = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
  ]

  return getDecanRuler(signs[signIndex], degree)
}

// =============================================================================
// Decan Information
// =============================================================================

/**
 * Get detailed information about a decan.
 */
export interface DecanInfo {
  sign: ZodiacSign
  decanNumber: 1 | 2 | 3
  ruler: PlanetId
  startDegree: number
  endDegree: number
  /** Absolute zodiac degree range */
  absoluteStart: number
  absoluteEnd: number
}

/**
 * Get information about all decans.
 *
 * @returns Array of 36 decan info objects
 */
export function getAllDecans(): DecanInfo[] {
  const signs: ZodiacSign[] = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
  ]

  const decans: DecanInfo[] = []

  for (let signIndex = 0; signIndex < 12; signIndex++) {
    const sign = signs[signIndex]
    for (let decanIndex = 0; decanIndex < 3; decanIndex++) {
      const decanNumber = (decanIndex + 1) as 1 | 2 | 3
      const startDegree = decanIndex * 10
      const endDegree = startDegree + 10

      decans.push({
        sign,
        decanNumber,
        ruler: DECANS[sign][decanIndex],
        startDegree,
        endDegree,
        absoluteStart: signIndex * 30 + startDegree,
        absoluteEnd: signIndex * 30 + endDegree,
      })
    }
  }

  return decans
}

/**
 * Get information about a specific decan by longitude.
 *
 * @param longitude - Absolute zodiac longitude (0-360)
 * @returns Decan information
 */
export function getDecanInfo(longitude: number): DecanInfo {
  const normalizedLon = ((longitude % 360) + 360) % 360

  const allDecans = getAllDecans()
  const decanIndex = Math.floor(normalizedLon / 10)

  return allDecans[decanIndex]
}
