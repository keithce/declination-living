/**
 * Data Transformers - Convert Phase 2 backend data to globe layer format.
 *
 * The backend uses different field naming conventions than the globe layers:
 * - Backend GeoLocation: { latitude, longitude }
 * - Globe ACGLineData: { lat, lon }
 *
 * These utilities handle the transformation.
 */

import type { AngularEvent } from '@convex/calculations/core/types'
import type { ACGLineData, ParanPointData, PlanetId, ZenithLineData } from '../layers/types'

// =============================================================================
// Backend Types (from convex/calculations/core/types.ts)
// =============================================================================

/** Backend GeoLocation format */
export interface BackendGeoLocation {
  latitude: number
  longitude: number
}

/** Backend ACGLine format */
export interface BackendACGLine {
  planet: PlanetId
  lineType: 'ASC' | 'DSC' | 'MC' | 'IC'
  points: Array<BackendGeoLocation>
  isCircumpolar?: boolean
}

/** Backend ZenithLine format */
export interface BackendZenithLine {
  planet: PlanetId
  declination: number
  orbMin: number
  orbMax: number
}

/** Backend ParanPoint format */
export interface BackendParanPoint {
  planet1: PlanetId
  event1: AngularEvent
  planet2: PlanetId
  event2: AngularEvent
  latitude: number
  strength?: number
}

// =============================================================================
// Transformers
// =============================================================================

/**
 * Transform backend ACG lines to globe layer format.
 *
 * Converts point coordinates from { latitude, longitude } to { lat, lon }.
 */
export function transformACGLines(lines: Array<BackendACGLine>): Array<ACGLineData> {
  return lines.map((line) => ({
    planet: line.planet,
    lineType: line.lineType,
    isCircumpolar: line.isCircumpolar ?? false,
    points: line.points.map((point) => ({
      lat: point.latitude,
      lon: point.longitude,
    })),
  }))
}

/**
 * Transform backend zenith lines to globe layer format.
 *
 * Converts from declination-based to latitude-based format.
 */
export function transformZenithLines(lines: Array<BackendZenithLine>): Array<ZenithLineData> {
  return lines.map((line) => ({
    planet: line.planet,
    latitude: line.declination, // Declination equals zenith latitude
    orbMin: line.orbMin,
    orbMax: line.orbMax,
  }))
}

/**
 * Transform backend paran points to globe layer format.
 *
 * Direct pass-through since types are compatible.
 */
export function transformParans(parans: Array<BackendParanPoint>): Array<ParanPointData> {
  return parans.map((paran) => ({
    planet1: paran.planet1,
    event1: paran.event1,
    planet2: paran.planet2,
    event2: paran.event2,
    latitude: paran.latitude,
    strength: paran.strength,
  }))
}

/**
 * Check if Phase 2 data is available and valid.
 */
export function hasPhase2Data(phase2Data: unknown): phase2Data is {
  acgLines: Array<BackendACGLine>
  zenithLines: Array<BackendZenithLine>
  parans: Array<BackendParanPoint>
  declinations: Record<PlanetId, number>
} {
  if (!phase2Data || typeof phase2Data !== 'object') return false

  const data = phase2Data as Record<string, unknown>
  return (
    Array.isArray(data.acgLines) &&
    Array.isArray(data.zenithLines) &&
    Array.isArray(data.parans) &&
    typeof data.declinations === 'object' &&
    data.declinations !== null &&
    !Array.isArray(data.declinations)
  )
}
