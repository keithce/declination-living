/**
 * Paran Solver - Re-exports from modular implementation
 *
 * This file maintains backward compatibility with existing code (e.g., phase2_actions.ts)
 * while using the new modular paran implementation.
 *
 * The original solver is replaced by:
 * - events.ts: Event time calculator
 * - bisection.ts: Paran bisection solver
 * - catalog.ts: Paran catalog generator
 */

import { ANGULAR_EVENT_NAMES, PLANET_IDS } from '../core/types'
import { PARAN_STRENGTH_THRESHOLD } from '../core/constants'
import { findAllParans as findAllParansNew, groupParansByLatitude } from './catalog'
import type {
  AngularEvent,
  EquatorialCoordinates,
  ParanPoint,
  ParanResult,
  PlanetId,
} from '../core/types'
import type { PlanetPosition } from './catalog'

// =============================================================================
// Re-exports from new modules (non-conflicting)
// =============================================================================

export { findAllParans as calculateAllParansNew, getParanStatistics } from './catalog'

export type { ParanSearchResult } from './bisection'
export type { EventTime } from './events'

// =============================================================================
// Backward Compatible Interface
// =============================================================================

/** Input for paran calculation (legacy interface) */
export interface ParanInput {
  planet1: PlanetId
  ra1: number
  dec1: number
  planet2: PlanetId
  ra2: number
  dec2: number
}

/** Detailed paran point with additional info (legacy interface) */
export interface DetailedParanPoint extends ParanPoint {
  lst: number
  isExact: boolean
  description: string
}

/**
 * Calculate all parans for all planet pairs.
 *
 * This is the main entry point used by phase2_actions.ts.
 * Wraps the new modular implementation to maintain the same interface.
 *
 * @param positions - Equatorial positions for all planets
 * @param threshold - Minimum strength threshold (default: PARAN_STRENGTH_THRESHOLD)
 * @returns Complete paran result
 */
export function calculateAllParans(
  positions: Record<PlanetId, EquatorialCoordinates>,
  threshold: number = PARAN_STRENGTH_THRESHOLD,
): ParanResult {
  // Validate input: ensure all planets have valid positions
  const positionArray: Array<PlanetPosition> = []

  for (const planetId of PLANET_IDS) {
    const pos = positions[planetId]
    if (typeof pos.ra !== 'number' || typeof pos.dec !== 'number') {
      throw new Error(`Invalid position data for planet ${planetId}: ra and dec must be numbers`)
    }
    if (!Number.isFinite(pos.ra) || !Number.isFinite(pos.dec)) {
      throw new Error(
        `Invalid position data for planet ${planetId}: ra and dec must be finite numbers`,
      )
    }
    positionArray.push({
      planetId,
      ra: pos.ra,
      dec: pos.dec,
    })
  }

  // Use new implementation with threshold
  return findAllParansNew(positionArray, threshold)
}

// =============================================================================
// Legacy Query Functions (maintained for compatibility)
// These take ParanPoint[] arrays directly, matching the old API
// =============================================================================

/**
 * Get parans near a specific latitude.
 *
 * @param parans - Array of paran points
 * @param latitude - Target latitude
 * @param orb - Maximum distance in degrees
 * @returns Filtered parans
 */
export function getParansNearLatitude(
  parans: Array<ParanPoint>,
  latitude: number,
  orb: number = 2,
): Array<ParanPoint> {
  return parans.filter((p) => Math.abs(p.latitude - latitude) <= orb)
}

/**
 * Get parans involving a specific planet.
 *
 * @param parans - Array of paran points
 * @param planet - Planet to filter by
 * @returns Filtered parans
 */
export function getParansForPlanet(parans: Array<ParanPoint>, planet: PlanetId): Array<ParanPoint> {
  return parans.filter((p) => p.planet1 === planet || p.planet2 === planet)
}

/**
 * Get parans of a specific event type.
 *
 * @param parans - Array of paran points
 * @param event - Event type to filter by
 * @returns Filtered parans where either planet has this event
 */
export function getParansByEvent(
  parans: Array<ParanPoint>,
  event: AngularEvent,
): Array<ParanPoint> {
  return parans.filter((p) => p.event1 === event || p.event2 === event)
}

/**
 * Get the strongest parans (highest strength values).
 * Legacy API that takes array directly.
 *
 * @param parans - Array of paran points
 * @param topN - Number of top parans to return
 * @returns Top N parans by strength
 */
export function getStrongestParans(
  parans: Array<ParanPoint>,
  topN: number = 10,
): Array<ParanPoint> {
  return [...parans].sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0)).slice(0, topN)
}

/**
 * Group parans into latitude bands for visualization.
 * Delegates to catalog implementation for consistency.
 *
 * @param parans - Array of paran points
 * @param bandSize - Size of each band in degrees
 * @returns Map of band center to parans in that band
 */
export function groupParansByLatitudeBand(
  parans: Array<ParanPoint>,
  bandSize: number = 5,
): Map<number, Array<ParanPoint>> {
  // Wrap array in ParanResult format for catalog function
  return groupParansByLatitude(
    {
      points: parans,
      summary: {
        riseRise: 0,
        riseCulminate: 0,
        riseSet: 0,
        culminateCulminate: 0,
        culminateSet: 0,
        setSet: 0,
        total: parans.length,
      },
    },
    bandSize,
  )
}

// =============================================================================
// Paran Description
// =============================================================================

/**
 * Generate a human-readable description of a paran.
 *
 * @param paran - Paran point
 * @returns Description string
 */
export function describeParan(paran: ParanPoint): string {
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

  const p1 = planetNames[paran.planet1]
  const p2 = planetNames[paran.planet2]
  const e1 = ANGULAR_EVENT_NAMES[paran.event1]
  const e2 = ANGULAR_EVENT_NAMES[paran.event2]
  const lat = paran.latitude.toFixed(1)

  return `${p1} ${e1} / ${p2} ${e2} at ${lat}°`
}

/**
 * Get interpretation keywords for a paran based on the planets involved.
 *
 * @param paran - Paran point
 * @returns Array of interpretation keywords
 */
export function getParanKeywords(paran: ParanPoint): Array<string> {
  const keywords: Record<PlanetId, Array<string>> = {
    sun: ['identity', 'vitality', 'success', 'leadership'],
    moon: ['emotions', 'intuition', 'nurturing', 'public'],
    mercury: ['communication', 'intellect', 'travel', 'commerce'],
    venus: ['love', 'beauty', 'harmony', 'values'],
    mars: ['action', 'energy', 'courage', 'competition'],
    jupiter: ['expansion', 'luck', 'wisdom', 'optimism'],
    saturn: ['discipline', 'structure', 'responsibility', 'mastery'],
    uranus: ['innovation', 'freedom', 'sudden changes', 'originality'],
    neptune: ['spirituality', 'imagination', 'transcendence', 'confusion'],
    pluto: ['transformation', 'power', 'intensity', 'rebirth'],
  }

  return [...keywords[paran.planet1], ...keywords[paran.planet2]]
}
