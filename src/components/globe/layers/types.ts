/**
 * Types for globe visualization layers.
 */

import type * as THREE from 'three'
import type { AngularEvent } from '@convex/calculations/core/types'
import { PLANET_COLORS } from '@/lib/planet-constants'

// Re-export for convenience
export { PLANET_COLORS }

// =============================================================================
// Planet Types
// =============================================================================

export type PlanetId =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'

export const PLANET_IDS: ReadonlyArray<PlanetId> = [
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
] as const

// =============================================================================
// Color Mapping (Hex format for Three.js)
// =============================================================================

export const PLANET_COLORS_HEX: Record<PlanetId, number> = {
  sun: 0xfbbf24,
  moon: 0xe2e8f0,
  mercury: 0xa78bfa,
  venus: 0xf472b6,
  mars: 0xef4444,
  jupiter: 0xf97316,
  saturn: 0x78716c,
  uranus: 0x22d3ee,
  neptune: 0x818cf8,
  pluto: 0xa3a3a3,
}

// =============================================================================
// Layer Data Types
// =============================================================================

/** Zenith line data from backend */
export interface ZenithLineData {
  planet: PlanetId
  latitude: number
  orbMin: number
  orbMax: number
}

/** ACG line data from backend */
export interface ACGLineData {
  planet: PlanetId
  lineType: 'ASC' | 'DSC' | 'MC' | 'IC'
  isCircumpolar: boolean
  points: Array<{ lat: number; lon: number }>
}

/** Paran point data from backend */
export interface ParanPointData {
  planet1: PlanetId
  event1: AngularEvent
  planet2: PlanetId
  event2: AngularEvent
  latitude: number
  strength?: number
}

/** City marker data for globe visualization */
export interface CityMarkerData {
  /** Unique identifier (database ID) */
  id: string
  /** City name */
  name: string
  /** Country name */
  country: string
  /** City latitude */
  latitude: number
  /** City longitude */
  longitude: number
  /** Combined score (0-100) */
  score: number
  /** Rank in the results (1-based) */
  rank: number
  /** City population tier */
  tier: 'major' | 'medium' | 'minor' | 'small'
  /** Human-readable highlight strings */
  highlights: Array<string>
}

// =============================================================================
// Visibility State
// =============================================================================

/** Layer visibility toggles */
export interface LayerVisibility {
  zenithBands: boolean
  acgLines: boolean
  paranPoints: boolean
  heatmap: boolean
  latitudeBands: boolean // Original latitude bands
  birthLocation: boolean
  cityMarkers: boolean
}

/** ACG line type filters */
export interface ACGLineFilters {
  ASC: boolean
  DSC: boolean
  MC: boolean
  IC: boolean
}

/** Planet visibility filters */
export type PlanetVisibility = Record<PlanetId, boolean>

/** Complete visibility state */
export interface GlobeVisibilityState {
  layers: LayerVisibility
  acgTypes: ACGLineFilters
  planets: PlanetVisibility
}

// =============================================================================
// Layer Creation Results
// =============================================================================

/** Result of creating a layer group */
export interface LayerGroup {
  group: THREE.Group
  update?: (time: number) => void
  dispose: () => void
}

// =============================================================================
// Extended Props
// =============================================================================

/** Extended props for GlobeCanvas with all visualization data */
export interface ExtendedGlobeCanvasProps {
  // Original props (optional for enhanced mode)
  optimalLatitudes?: Array<{
    latitude: number
    score: number
    dominantPlanet: PlanetId
  }>
  latitudeBands?: Array<{
    min: number
    max: number
    dominantPlanet: PlanetId
  }>
  birthLocation?: {
    latitude: number
    longitude: number
    city: string
  }

  // New visualization data
  declinations?: Partial<Record<PlanetId, number>>
  zenithLines?: Array<ZenithLineData>
  acgLines?: Array<ACGLineData>
  parans?: Array<ParanPointData>
  dignityScores?: Record<PlanetId, { total: number; indicator: string }>

  // Visibility control (optional - defaults provided)
  visibility?: Partial<GlobeVisibilityState>
  onVisibilityChange?: (visibility: GlobeVisibilityState) => void
}

// =============================================================================
// Default Values
// =============================================================================

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  zenithBands: true,
  acgLines: false,
  paranPoints: false,
  heatmap: false,
  latitudeBands: true,
  birthLocation: true,
  cityMarkers: true,
}

export const DEFAULT_ACG_FILTERS: ACGLineFilters = {
  ASC: true,
  DSC: true,
  MC: true,
  IC: true,
}

export function createDefaultPlanetVisibility(): PlanetVisibility {
  return PLANET_IDS.reduce((acc, planet) => {
    acc[planet] = true
    return acc
  }, {} as PlanetVisibility)
}

export const DEFAULT_VISIBILITY_STATE: GlobeVisibilityState = {
  layers: DEFAULT_LAYER_VISIBILITY,
  acgTypes: DEFAULT_ACG_FILTERS,
  planets: createDefaultPlanetVisibility(),
}
