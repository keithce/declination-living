/**
 * Scoring Grid Generator
 *
 * Generates a heatmap grid combining zenith, ACG, and paran scoring
 * for visualization on a globe or map.
 */

import { scoreLatitude, scoreLocationForACG, scoreParanProximity } from './search'
import type {
  ACGLine,
  ParanPoint,
  PlanetDeclinations,
  PlanetId,
  PlanetWeights,
} from '../core/types'

/**
 * Cell in the scoring grid with contribution breakdowns
 */
export interface GridCell {
  lat: number
  lon: number
  score: number
  zenithContribution: number
  acgContribution: number
  paranContribution: number
  dominantFactor: 'zenith' | 'acg' | 'paran' | 'mixed'
  dominantPlanet?: PlanetId
}

/**
 * Options for grid generation
 */
export interface ScoringGridOptions {
  /** Latitude step in degrees (default: 5) */
  latStep?: number
  /** Longitude step in degrees (default: 10) */
  lonStep?: number
  /** Minimum latitude (default: -85) */
  latMin?: number
  /** Maximum latitude (default: 85) */
  latMax?: number
  /** Minimum longitude (default: -180) */
  lonMin?: number
  /** Maximum longitude (default: 180) */
  lonMax?: number
  /** Orb for ACG proximity in degrees (default: 2.0) */
  acgOrb?: number
  /** Orb for paran proximity in degrees (default: 1.0) */
  paranOrb?: number
}

/**
 * Generate a scoring grid for heatmap visualization.
 *
 * Combines zenith, ACG, and paran scoring to produce a comprehensive
 * grid showing optimal locations worldwide.
 *
 * @param declinations - Planet declinations
 * @param weights - Planet weights
 * @param acgLines - Array of ACG lines
 * @param parans - Array of paran points
 * @param options - Grid generation options
 * @returns Array of grid cells
 */
export function generateScoringGrid(
  declinations: PlanetDeclinations,
  weights: PlanetWeights,
  acgLines: Array<ACGLine>,
  parans: Array<ParanPoint>,
  options: ScoringGridOptions = {},
): Array<GridCell> {
  const {
    latStep = 5,
    lonStep = 10,
    latMin = -85,
    latMax = 85,
    lonMin = -180,
    lonMax = 180,
    acgOrb = 2.0,
    paranOrb = 1.0,
  } = options

  const grid: Array<GridCell> = []

  for (let lat = latMin; lat <= latMax; lat += latStep) {
    for (let lon = lonMin; lon <= lonMax; lon += lonStep) {
      // Zenith scoring (latitude only)
      const zenithResult = scoreLatitude(lat, declinations, weights)

      // ACG proximity scoring
      const acgResult = scoreLocationForACG(lat, lon, acgLines, weights, acgOrb)

      // Paran scoring (latitude only)
      const paranScore = scoreParanProximity(lat, parans, weights, paranOrb)

      // Determine dominant factor
      const scores = {
        zenith: zenithResult.score,
        acg: acgResult.score,
        paran: paranScore,
      }

      let dominantFactor: 'zenith' | 'acg' | 'paran' | 'mixed'
      const maxScore = Math.max(scores.zenith, scores.acg, scores.paran)

      if (maxScore === 0) {
        dominantFactor = 'mixed'
      } else {
        const countAtMax = Object.values(scores).filter((s) => s === maxScore).length
        if (countAtMax > 1) {
          dominantFactor = 'mixed'
        } else if (scores.zenith === maxScore) {
          dominantFactor = 'zenith'
        } else if (scores.acg === maxScore) {
          dominantFactor = 'acg'
        } else {
          dominantFactor = 'paran'
        }
      }

      // Determine dominant planet
      let dominantPlanet: PlanetId | undefined
      if (dominantFactor === 'zenith' && zenithResult.contributions.length > 0) {
        dominantPlanet = zenithResult.contributions[0].planet
      } else if (dominantFactor === 'acg') {
        dominantPlanet = acgResult.dominantPlanet
      } else if (dominantFactor === 'paran' && parans.length > 0) {
        // Find paran with highest contribution using same formula as scoreParanProximity
        let bestParan = parans[0]
        let bestContribution = 0

        for (const paran of parans) {
          const distance = Math.abs(lat - paran.latitude)
          if (distance <= paranOrb) {
            const proximityScore = 1 - distance / paranOrb
            const w1 = weights[paran.planet1]
            const w2 = weights[paran.planet2]
            const avgWeight = (w1 + w2) / 2
            const contribution = proximityScore * avgWeight * (paran.strength ?? 1)

            if (contribution > bestContribution) {
              bestContribution = contribution
              bestParan = paran
            }
          }
        }

        // Pick higher-weighted planet from best paran
        const w1 = weights[bestParan.planet1]
        const w2 = weights[bestParan.planet2]
        dominantPlanet = w1 >= w2 ? bestParan.planet1 : bestParan.planet2
      }

      grid.push({
        lat,
        lon,
        score: zenithResult.score + acgResult.score + paranScore,
        zenithContribution: zenithResult.score,
        acgContribution: acgResult.score,
        paranContribution: paranScore,
        dominantFactor,
        dominantPlanet,
      })
    }
  }

  return grid
}

/**
 * Find the top N locations from a scoring grid.
 *
 * @param grid - Scoring grid
 * @param topN - Number of top locations to return
 * @returns Top N grid cells sorted by score
 */
export function getTopLocations(grid: Array<GridCell>, topN: number = 10): Array<GridCell> {
  return [...grid].sort((a, b) => b.score - a.score).slice(0, topN)
}

/**
 * Filter grid cells by dominant factor.
 *
 * @param grid - Scoring grid
 * @param factor - Factor to filter by
 * @returns Filtered grid cells
 */
export function filterByDominantFactor(
  grid: Array<GridCell>,
  factor: 'zenith' | 'acg' | 'paran' | 'mixed',
): Array<GridCell> {
  return grid.filter((cell) => cell.dominantFactor === factor)
}

/**
 * Filter grid cells by dominant planet.
 *
 * @param grid - Scoring grid
 * @param planet - Planet to filter by
 * @returns Filtered grid cells
 */
export function filterByDominantPlanet(grid: Array<GridCell>, planet: PlanetId): Array<GridCell> {
  return grid.filter((cell) => cell.dominantPlanet === planet)
}

/**
 * Get grid statistics.
 *
 * @param grid - Scoring grid
 * @returns Statistics about the grid
 */
export function getGridStatistics(grid: Array<GridCell>): {
  totalCells: number
  avgScore: number
  maxScore: number
  minScore: number
  zenithDominant: number
  acgDominant: number
  paranDominant: number
  mixedDominant: number
} {
  if (grid.length === 0) {
    return {
      totalCells: 0,
      avgScore: 0,
      maxScore: 0,
      minScore: 0,
      zenithDominant: 0,
      acgDominant: 0,
      paranDominant: 0,
      mixedDominant: 0,
    }
  }

  let totalScore = 0
  let maxScore = -Infinity
  let minScore = Infinity
  let zenithDominant = 0
  let acgDominant = 0
  let paranDominant = 0
  let mixedDominant = 0

  for (const cell of grid) {
    totalScore += cell.score
    maxScore = Math.max(maxScore, cell.score)
    minScore = Math.min(minScore, cell.score)

    if (cell.dominantFactor === 'zenith') zenithDominant++
    else if (cell.dominantFactor === 'acg') acgDominant++
    else if (cell.dominantFactor === 'paran') paranDominant++
    else mixedDominant++
  }

  return {
    totalCells: grid.length,
    avgScore: totalScore / grid.length,
    maxScore,
    minScore,
    zenithDominant,
    acgDominant,
    paranDominant,
    mixedDominant,
  }
}
