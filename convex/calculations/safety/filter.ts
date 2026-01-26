/**
 * Safety Filter - Evaluate relocated chart for problematic placements.
 *
 * Calculates a safety score based on:
 * - Planets in challenging houses (6, 8, 12)
 * - Hard aspects to angles (ASC, MC)
 * - Planets with poor essential dignity
 *
 * Higher score = safer location.
 */

import { PLANET_IDS } from '../core/types'
import type { DignityScore, PlanetId, SafetyScore } from '../core/types'

// =============================================================================
// Types
// =============================================================================

/** Relocated chart data needed for safety analysis */
export interface RelocatedChartData {
  /** House position for each planet (1-12) */
  housePlacements: Record<PlanetId, number>
  /** Distance from ASC in degrees (0-360) */
  aspectToASC: Record<PlanetId, number>
  /** Distance from MC in degrees (0-360) */
  aspectToMC: Record<PlanetId, number>
  /** Dignity scores for each planet */
  dignities: Record<PlanetId, DignityScore>
}

/** Aspect definition */
export interface Aspect {
  name: string
  angle: number
  orb: number
  nature: 'hard' | 'soft' | 'neutral'
}

// =============================================================================
// Constants
// =============================================================================

/** Houses considered challenging for planet placement */
export const CHALLENGING_HOUSES = [6, 8, 12]

/** Difficult aspects */
export const HARD_ASPECTS: Array<Aspect> = [
  { name: 'conjunction', angle: 0, orb: 8, nature: 'neutral' }, // Can go either way
  { name: 'opposition', angle: 180, orb: 8, nature: 'hard' },
  { name: 'square', angle: 90, orb: 8, nature: 'hard' },
]

/** Malefic planets (traditionally problematic) */
export const MALEFIC_PLANETS: Array<PlanetId> = ['mars', 'saturn', 'uranus', 'pluto']

/** Weight modifiers for different safety factors */
export const SAFETY_WEIGHTS = {
  challengingHouse: -10,
  hardAspectToASC: -8,
  hardAspectToMC: -6,
  weakDignity: -5,
  maleficAngular: -7,
  beneficAngular: 5,
}

/** Safety level score thresholds */
export const SAFETY_LEVEL_THRESHOLDS = {
  excellent: 85,
  good: 70,
  moderate: 55,
  challenging: 40,
} as const

// =============================================================================
// Aspect Detection
// =============================================================================

/**
 * Check if a planet makes a hard aspect to an angle.
 *
 * @param aspectDegrees - Distance from the angle in degrees
 * @returns Matching hard aspect or null
 */
export function findHardAspect(aspectDegrees: number): Aspect | null {
  // Normalize to 0-180
  const normalized = Math.abs(((aspectDegrees % 360) + 360) % 360)
  const angle = normalized > 180 ? 360 - normalized : normalized

  for (const aspect of HARD_ASPECTS) {
    const distance = Math.abs(angle - aspect.angle)
    if (distance <= aspect.orb) {
      return aspect
    }
  }

  return null
}

/**
 * Check if a planet is angular (conjunct ASC/MC within orb).
 */
export function isAngular(aspectToASC: number, aspectToMC: number, orb: number = 10): boolean {
  const normalizedASC = Math.min(Math.abs(aspectToASC), Math.abs(360 - aspectToASC))
  const normalizedMC = Math.min(Math.abs(aspectToMC), Math.abs(360 - aspectToMC))

  return normalizedASC <= orb || normalizedMC <= orb
}

// =============================================================================
// Safety Score Calculation
// =============================================================================

/**
 * Calculate the safety score for a relocated chart.
 *
 * @param chartData - Relocated chart data
 * @param targetPlanets - Optional: only consider these planets
 * @returns Complete safety score with breakdown
 */
export function calculateSafetyScore(
  chartData: RelocatedChartData,
  targetPlanets?: Array<PlanetId>,
): SafetyScore {
  const planets = targetPlanets ?? PLANET_IDS

  const challengingPlacements: SafetyScore['challengingPlacements'] = []
  const difficultAspects: SafetyScore['difficultAspects'] = []
  const weakDignity: SafetyScore['weakDignity'] = []
  const warnings: Array<string> = []

  let rawScore = 100 // Start at 100, deduct for problems

  for (const planet of planets) {
    const house = chartData.housePlacements[planet]
    const aspectASC = chartData.aspectToASC[planet]
    const aspectMC = chartData.aspectToMC[planet]
    const dignity = chartData.dignities[planet]

    // Check for challenging house placement
    if (CHALLENGING_HOUSES.includes(house)) {
      challengingPlacements.push({ planet, house })
      rawScore += SAFETY_WEIGHTS.challengingHouse

      if (MALEFIC_PLANETS.includes(planet)) {
        // Extra penalty for malefics in challenging houses
        rawScore += SAFETY_WEIGHTS.challengingHouse * 0.5
        warnings.push(`${formatPlanet(planet)} in ${formatHouse(house)} may indicate challenges`)
      }
    }

    // Check for hard aspects to ASC
    const ascAspect = findHardAspect(aspectASC)
    if (ascAspect && ascAspect.nature === 'hard') {
      difficultAspects.push({
        planet,
        aspect: ascAspect.name,
        target: 'ASC',
      })
      rawScore += SAFETY_WEIGHTS.hardAspectToASC

      if (MALEFIC_PLANETS.includes(planet)) {
        warnings.push(`${formatPlanet(planet)} ${ascAspect.name} ASC may bring intensity`)
      }
    }

    // Check for hard aspects to MC
    const mcAspect = findHardAspect(aspectMC)
    if (mcAspect && mcAspect.nature === 'hard') {
      difficultAspects.push({
        planet,
        aspect: mcAspect.name,
        target: 'MC',
      })
      rawScore += SAFETY_WEIGHTS.hardAspectToMC
    }

    // Check dignity
    if (dignity.total < -2) {
      weakDignity.push({ planet, score: dignity.total })
      rawScore += SAFETY_WEIGHTS.weakDignity

      if (dignity.total < -5) {
        warnings.push(`${formatPlanet(planet)} is significantly debilitated`)
      }
    }

    // Check for malefic angular
    if (MALEFIC_PLANETS.includes(planet) && isAngular(aspectASC, aspectMC)) {
      rawScore += SAFETY_WEIGHTS.maleficAngular
      warnings.push(`${formatPlanet(planet)} is angular at this location`)
    }

    // Bonus for benefic angular
    if ((planet === 'venus' || planet === 'jupiter') && isAngular(aspectASC, aspectMC)) {
      rawScore += SAFETY_WEIGHTS.beneficAngular
    }
  }

  // Normalize score to 0-100
  const normalizedScore = Math.max(0, Math.min(100, rawScore))

  return {
    overall: normalizedScore,
    challengingPlacements,
    difficultAspects,
    weakDignity,
    warnings,
  }
}

// =============================================================================
// Safety Interpretation
// =============================================================================

/**
 * Get a safety level description from score.
 */
export function getSafetyLevel(
  score: number,
): 'excellent' | 'good' | 'moderate' | 'challenging' | 'difficult' {
  if (score >= SAFETY_LEVEL_THRESHOLDS.excellent) return 'excellent'
  if (score >= SAFETY_LEVEL_THRESHOLDS.good) return 'good'
  if (score >= SAFETY_LEVEL_THRESHOLDS.moderate) return 'moderate'
  if (score >= SAFETY_LEVEL_THRESHOLDS.challenging) return 'challenging'
  return 'difficult'
}

/**
 * Get color for safety score display.
 */
export function getSafetyColor(score: number): string {
  if (score >= 85) return '#4CAF50' // Green
  if (score >= 70) return '#8BC34A' // Light green
  if (score >= 55) return '#FFC107' // Yellow/amber
  if (score >= 40) return '#FF9800' // Orange
  return '#F44336' // Red
}

/**
 * Generate a summary of the safety analysis.
 */
export function generateSafetySummary(safetyScore: SafetyScore): string {
  const level = getSafetyLevel(safetyScore.overall)

  let summary = `Safety Level: ${level.toUpperCase()} (${safetyScore.overall.toFixed(0)}/100)\n\n`

  if (safetyScore.challengingPlacements.length > 0) {
    summary += 'Challenging Placements:\n'
    for (const p of safetyScore.challengingPlacements) {
      summary += `  - ${formatPlanet(p.planet)} in ${formatHouse(p.house)}\n`
    }
    summary += '\n'
  }

  if (safetyScore.difficultAspects.length > 0) {
    summary += 'Difficult Aspects:\n'
    for (const a of safetyScore.difficultAspects) {
      summary += `  - ${formatPlanet(a.planet)} ${a.aspect} ${a.target}\n`
    }
    summary += '\n'
  }

  if (safetyScore.warnings.length > 0) {
    summary += 'Warnings:\n'
    for (const w of safetyScore.warnings) {
      summary += `  ⚠️ ${w}\n`
    }
  }

  return summary
}

// =============================================================================
// Helpers
// =============================================================================

function formatPlanet(planet: PlanetId): string {
  const names: Record<PlanetId, string> = {
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
  return names[planet]
}

function formatHouse(house: number): string {
  const ordinals = [
    '',
    '1st',
    '2nd',
    '3rd',
    '4th',
    '5th',
    '6th',
    '7th',
    '8th',
    '9th',
    '10th',
    '11th',
    '12th',
  ]
  return ordinals[house] + ' house'
}

// =============================================================================
// Quick Safety Check
// =============================================================================

/**
 * Quick safety check for a latitude without full chart calculation.
 * Uses simplified heuristics based on zenith proximity.
 *
 * @param latitude - Location latitude
 * @param declinations - Planet declinations
 * @param weights - Planet weights
 * @returns Quick safety indicator
 */
export function quickSafetyCheck(
  latitude: number,
  declinations: Record<PlanetId, number>,
  weights: Record<PlanetId, number>,
): {
  hasRisks: boolean
  riskPlanets: Array<PlanetId>
  benefits: Array<PlanetId>
} {
  const riskPlanets: Array<PlanetId> = []
  const benefits: Array<PlanetId> = []

  for (const planet of PLANET_IDS) {
    const distance = Math.abs(latitude - declinations[planet])

    // Check if malefic planet is very close (zenith)
    if (MALEFIC_PLANETS.includes(planet) && distance < 1) {
      riskPlanets.push(planet)
    }

    // Check if benefic is close
    if ((planet === 'venus' || planet === 'jupiter') && distance < 2) {
      benefits.push(planet)
    }

    // Saturn exactly on zenith is traditionally challenging
    if (planet === 'saturn' && distance < 0.5 && weights[planet] > 0) {
      riskPlanets.push(planet)
    }
  }

  return {
    hasRisks: riskPlanets.length > 0,
    riskPlanets,
    benefits,
  }
}

// =============================================================================
// Safety Threshold Check
// =============================================================================

/**
 * Check if a safety score meets a minimum threshold level.
 *
 * @param score - Safety score (0-100)
 * @param minLevel - Minimum safety level required
 * @returns True if score meets or exceeds the threshold
 */
export function meetsMinimumSafety(
  score: number,
  minLevel: 'excellent' | 'good' | 'moderate' | 'challenging' = 'moderate',
): boolean {
  return score >= SAFETY_LEVEL_THRESHOLDS[minLevel]
}
