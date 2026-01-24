/**
 * Essential Dignity Calculator.
 *
 * Calculates the complete dignity score for a planet based on:
 * - Domicile: +5 (planet in its own sign)
 * - Exaltation: +4 (planet in its exaltation sign)
 * - Triplicity: +3 (planet is triplicity ruler of element)
 * - Terms: +2 (planet in its own terms)
 * - Face: +1 (planet in its own decan)
 * - Detriment: -5 (planet in sign opposite its domicile)
 * - Fall: -4 (planet in sign opposite its exaltation)
 * - Peregrine: -5 (no positive dignities)
 */

import type { PlanetId, ZodiacSign, DignityScore, SignPosition } from "../core/types"
import { ZODIAC_SIGNS, PLANET_IDS } from "../core/types"
import { DIGNITY_POINTS } from "../core/constants"
import {
  isInDomicile,
  isInExaltation,
  isInDetriment,
  isInFall,
  isTriplicityRuler,
  getDignities,
} from "./tables"
import { isInOwnTerms, type TermSystem } from "./terms"
import { isInOwnFace } from "./decans"

// =============================================================================
// Position Conversion
// =============================================================================

/**
 * Convert absolute zodiac longitude to sign and degree.
 *
 * @param longitude - Absolute longitude (0-360)
 * @returns Sign position with sign, degree, and minute
 */
export function longitudeToSignPosition(longitude: number): SignPosition {
  // Normalize to 0-360
  const normalizedLon = ((longitude % 360) + 360) % 360

  const signIndex = Math.floor(normalizedLon / 30)
  const degreeFloat = normalizedLon % 30
  const degree = Math.floor(degreeFloat)
  const minute = Math.floor((degreeFloat - degree) * 60)

  return {
    sign: ZODIAC_SIGNS[signIndex],
    signIndex,
    degree,
    minute,
  }
}

/**
 * Convert sign position back to absolute longitude.
 */
export function signPositionToLongitude(position: SignPosition): number {
  return position.signIndex * 30 + position.degree + position.minute / 60
}

// =============================================================================
// Dignity Score Calculator
// =============================================================================

/**
 * Calculate the complete essential dignity score for a planet.
 *
 * @param planet - Planet to calculate dignity for
 * @param longitude - Absolute zodiac longitude (0-360)
 * @param isDay - Whether it's a day chart (for triplicity)
 * @param termSystem - Which term system to use
 * @returns Complete dignity score breakdown
 */
export function calculateDignity(
  planet: PlanetId,
  longitude: number,
  isDay: boolean = true,
  termSystem: TermSystem = "egyptian"
): DignityScore {
  const position = longitudeToSignPosition(longitude)
  const { sign, degree } = position

  // Initialize scores
  let domicile = 0
  let exaltation = 0
  let triplicity = 0
  let terms = 0
  let face = 0
  let detriment = 0
  let fall = 0
  let peregrine = 0

  const breakdown: string[] = []

  // Check each dignity
  if (isInDomicile(planet, sign)) {
    domicile = DIGNITY_POINTS.domicile
    breakdown.push(`Domicile (+${domicile})`)
  }

  if (isInExaltation(planet, sign)) {
    exaltation = DIGNITY_POINTS.exaltation
    breakdown.push(`Exaltation (+${exaltation})`)
  }

  if (isTriplicityRuler(planet, sign, isDay)) {
    triplicity = DIGNITY_POINTS.triplicity
    breakdown.push(`Triplicity (+${triplicity})`)
  }

  if (isInOwnTerms(planet, sign, degree, termSystem)) {
    terms = DIGNITY_POINTS.terms
    breakdown.push(`Terms (+${terms})`)
  }

  if (isInOwnFace(planet, sign, degree)) {
    face = DIGNITY_POINTS.face
    breakdown.push(`Face (+${face})`)
  }

  // Check debilities
  if (isInDetriment(planet, sign)) {
    detriment = DIGNITY_POINTS.detriment
    breakdown.push(`Detriment (${detriment})`)
  }

  if (isInFall(planet, sign)) {
    fall = DIGNITY_POINTS.fall
    breakdown.push(`Fall (${fall})`)
  }

  // Check for peregrine (no essential dignity)
  const hasPositiveDignity =
    domicile > 0 || exaltation > 0 || triplicity > 0 || terms > 0 || face > 0

  if (!hasPositiveDignity && detriment === 0 && fall === 0) {
    peregrine = DIGNITY_POINTS.peregrine
    breakdown.push(`Peregrine (${peregrine})`)
  }

  const total =
    domicile + exaltation + triplicity + terms + face + detriment + fall + peregrine

  return {
    planet,
    domicile,
    exaltation,
    triplicity,
    terms,
    face,
    detriment,
    fall,
    peregrine,
    total,
    breakdown,
  }
}

/**
 * Calculate dignities for all planets.
 *
 * @param positions - Map of planet to longitude
 * @param isDay - Whether it's a day chart
 * @param termSystem - Term system to use
 * @returns Map of planet to dignity score
 */
export function calculateAllDignities(
  positions: Record<PlanetId, number>,
  isDay: boolean = true,
  termSystem: TermSystem = "egyptian"
): Record<PlanetId, DignityScore> {
  const result: Partial<Record<PlanetId, DignityScore>> = {}

  for (const planet of PLANET_IDS) {
    result[planet] = calculateDignity(
      planet,
      positions[planet],
      isDay,
      termSystem
    )
  }

  return result as Record<PlanetId, DignityScore>
}

// =============================================================================
// Dignity Analysis
// =============================================================================

/**
 * Get planets sorted by dignity score (best to worst).
 */
export function rankPlanetsByDignity(
  dignities: Record<PlanetId, DignityScore>
): Array<{ planet: PlanetId; score: DignityScore }> {
  return PLANET_IDS.map((planet) => ({
    planet,
    score: dignities[planet],
  })).sort((a, b) => b.score.total - a.score.total)
}

/**
 * Get the strongest planets (total > 0).
 */
export function getStrongPlanets(
  dignities: Record<PlanetId, DignityScore>
): PlanetId[] {
  return PLANET_IDS.filter((p) => dignities[p].total > 0)
}

/**
 * Get the weakest planets (total < 0).
 */
export function getWeakPlanets(
  dignities: Record<PlanetId, DignityScore>
): PlanetId[] {
  return PLANET_IDS.filter((p) => dignities[p].total < 0)
}

/**
 * Get planets that are essentially dignified (domicile or exaltation).
 */
export function getEssentiallyDignified(
  dignities: Record<PlanetId, DignityScore>
): PlanetId[] {
  return PLANET_IDS.filter(
    (p) => dignities[p].domicile > 0 || dignities[p].exaltation > 0
  )
}

/**
 * Get planets that are essentially debilitated (detriment or fall).
 */
export function getEssentiallyDebilitated(
  dignities: Record<PlanetId, DignityScore>
): PlanetId[] {
  return PLANET_IDS.filter(
    (p) => dignities[p].detriment < 0 || dignities[p].fall < 0
  )
}

// =============================================================================
// Dignity Display Helpers
// =============================================================================

/**
 * Get a single-character dignity indicator.
 *
 * @param score - Dignity score
 * @returns Character like "R" (ruler), "E" (exalted), "d" (detriment), etc.
 */
export function getDignityIndicator(score: DignityScore): string {
  if (score.domicile > 0) return "R" // Ruler
  if (score.exaltation > 0) return "E" // Exalted
  if (score.triplicity > 0) return "T" // Triplicity
  if (score.terms > 0) return "t" // Terms (lowercase)
  if (score.face > 0) return "F" // Face
  if (score.detriment < 0) return "d" // Detriment
  if (score.fall < 0) return "f" // Fall
  if (score.peregrine < 0) return "p" // Peregrine
  return "-" // No significant dignity
}

/**
 * Get a color code for dignity score.
 *
 * @param score - Dignity score
 * @returns Color string for UI
 */
export function getDignityColor(score: DignityScore): string {
  if (score.total >= 5) return "#4CAF50" // Strong green
  if (score.total >= 3) return "#8BC34A" // Light green
  if (score.total >= 1) return "#CDDC39" // Yellow-green
  if (score.total === 0) return "#9E9E9E" // Gray
  if (score.total >= -2) return "#FFC107" // Amber
  if (score.total >= -4) return "#FF9800" // Orange
  return "#F44336" // Red
}

/**
 * Format dignity score as a brief string.
 *
 * @param score - Dignity score
 * @returns String like "+5 (R)" or "-4 (f)"
 */
export function formatDignityScore(score: DignityScore): string {
  const sign = score.total >= 0 ? "+" : ""
  const indicator = getDignityIndicator(score)
  return `${sign}${score.total} (${indicator})`
}

// =============================================================================
// Sect Determination
// =============================================================================

/**
 * Determine if a chart is a day chart or night chart.
 *
 * @param sunLongitude - Sun's zodiac longitude
 * @param ascendant - Ascendant longitude
 * @returns True if day chart (Sun above horizon)
 */
export function isDayChart(sunLongitude: number, ascendant: number): boolean {
  // Sun is above horizon if it's in the upper hemisphere
  // Upper hemisphere: ASC to DSC going counterclockwise
  // This is a simplified check - full calculation needs house cusps

  // Descendant is opposite the Ascendant
  const descendant = (ascendant + 180) % 360

  // Normalize all values
  const sunNorm = ((sunLongitude % 360) + 360) % 360
  const ascNorm = ((ascendant % 360) + 360) % 360
  const dscNorm = ((descendant % 360) + 360) % 360

  // Sun is above horizon if it's between ASC and DSC (going counterclockwise)
  if (ascNorm < dscNorm) {
    return sunNorm >= ascNorm && sunNorm < dscNorm
  } else {
    // ASC > DSC (e.g., ASC = 350°, DSC = 170°)
    return sunNorm >= ascNorm || sunNorm < dscNorm
  }
}
