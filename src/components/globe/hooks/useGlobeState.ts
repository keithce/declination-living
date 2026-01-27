/**
 * Globe State Hook - Manages visibility and filter state for globe layers.
 *
 * Provides centralized state management for layer toggles, planet filters,
 * and ACG line type filters.
 */

import { useCallback, useMemo, useState } from 'react'
import { PLANET_IDS } from '../layers/types'
import type { ACGLineFilters, LayerVisibility, PlanetId, PlanetVisibility } from '../layers/types'

// =============================================================================
// Types
// =============================================================================

export interface GlobeState {
  /** Which layers are visible */
  layers: LayerVisibility
  /** Which planets are visible */
  planets: PlanetVisibility
  /** Which ACG line types are visible */
  acgLineTypes: ACGLineFilters
  /** Heatmap intensity (0-2) */
  heatmapIntensity: number
  /** Heatmap spread in degrees (1-10) */
  heatmapSpread: number
  /** Currently highlighted planet */
  highlightedPlanet: PlanetId | null
  /** Currently highlighted city (by ID) */
  highlightedCity: string | null
  /** Whether to show city labels on the globe */
  showCityLabels: boolean
  /** Sun time of day in hours (0-24) */
  sunTimeOfDay: number
  /** Whether to force full daylight (no day/night cycle) */
  sunAlwaysDay: boolean
}

export interface GlobeStateActions {
  /** Toggle a layer's visibility */
  toggleLayer: (layer: keyof LayerVisibility) => void
  /** Toggle a planet's visibility */
  togglePlanet: (planet: PlanetId) => void
  /** Toggle an ACG line type's visibility */
  toggleACGLineType: (lineType: keyof ACGLineFilters) => void
  /** Set all planets visible/hidden */
  setAllPlanets: (visible: boolean) => void
  /** Set all ACG line types visible/hidden */
  setAllACGLineTypes: (visible: boolean) => void
  /** Set heatmap intensity */
  setHeatmapIntensity: (intensity: number) => void
  /** Set heatmap spread */
  setHeatmapSpread: (spread: number) => void
  /** Set highlighted planet */
  setHighlightedPlanet: (planet: PlanetId | null) => void
  /** Set highlighted city by ID */
  setHighlightedCity: (cityId: string | null) => void
  /** Toggle city labels visibility */
  toggleCityLabels: () => void
  /** Set sun time of day (0-24 hours) */
  setSunTimeOfDay: (hour: number) => void
  /** Toggle always-day mode */
  toggleSunAlwaysDay: () => void
  /** Reset all state to defaults */
  resetState: () => void
}

export type UseGlobeStateReturn = GlobeState & GlobeStateActions

// =============================================================================
// Default State
// =============================================================================

const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  zenithBands: true,
  acgLines: false,
  paranPoints: false,
  heatmap: false,
  latitudeBands: true,
  birthLocation: true,
  cityMarkers: true,
}

const DEFAULT_PLANET_VISIBILITY: PlanetVisibility = PLANET_IDS.reduce(
  (acc, planet) => ({ ...acc, [planet]: true }),
  {} as PlanetVisibility,
)

const DEFAULT_ACG_LINE_FILTERS: ACGLineFilters = {
  ASC: true,
  DSC: true,
  MC: true,
  IC: true,
}

const DEFAULT_STATE: GlobeState = {
  layers: DEFAULT_LAYER_VISIBILITY,
  planets: DEFAULT_PLANET_VISIBILITY,
  acgLineTypes: DEFAULT_ACG_LINE_FILTERS,
  heatmapIntensity: 1.0,
  heatmapSpread: 3.0,
  highlightedPlanet: null,
  highlightedCity: null,
  showCityLabels: false,
  sunTimeOfDay: 12,
  sunAlwaysDay: false,
}

// =============================================================================
// Hook
// =============================================================================

export function useGlobeState(initialState?: Partial<GlobeState>): UseGlobeStateReturn {
  const [state, setState] = useState<GlobeState>({
    ...DEFAULT_STATE,
    ...initialState,
  })

  // Layer toggle
  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setState((prev) => ({
      ...prev,
      layers: {
        ...prev.layers,
        [layer]: !prev.layers[layer],
      },
    }))
  }, [])

  // Planet toggle
  const togglePlanet = useCallback((planet: PlanetId) => {
    setState((prev) => ({
      ...prev,
      planets: {
        ...prev.planets,
        [planet]: !prev.planets[planet],
      },
    }))
  }, [])

  // ACG line type toggle
  const toggleACGLineType = useCallback((lineType: keyof ACGLineFilters) => {
    setState((prev) => ({
      ...prev,
      acgLineTypes: {
        ...prev.acgLineTypes,
        [lineType]: !prev.acgLineTypes[lineType],
      },
    }))
  }, [])

  // Set all planets
  const setAllPlanets = useCallback((visible: boolean) => {
    setState((prev) => ({
      ...prev,
      planets: PLANET_IDS.reduce(
        (acc, planet) => ({ ...acc, [planet]: visible }),
        {} as PlanetVisibility,
      ),
    }))
  }, [])

  // Set all ACG line types
  const setAllACGLineTypes = useCallback((visible: boolean) => {
    setState((prev) => ({
      ...prev,
      acgLineTypes: {
        ASC: visible,
        DSC: visible,
        MC: visible,
        IC: visible,
      },
    }))
  }, [])

  // Heatmap intensity
  const setHeatmapIntensity = useCallback((intensity: number) => {
    setState((prev) => ({
      ...prev,
      heatmapIntensity: Math.max(0, Math.min(2, intensity)),
    }))
  }, [])

  // Heatmap spread
  const setHeatmapSpread = useCallback((spread: number) => {
    setState((prev) => ({
      ...prev,
      heatmapSpread: Math.max(1, Math.min(10, spread)),
    }))
  }, [])

  // Highlighted planet
  const setHighlightedPlanet = useCallback((planet: PlanetId | null) => {
    setState((prev) => ({
      ...prev,
      highlightedPlanet: planet,
    }))
  }, [])

  // Highlighted city
  const setHighlightedCity = useCallback((cityId: string | null) => {
    setState((prev) => ({
      ...prev,
      highlightedCity: cityId,
    }))
  }, [])

  // Sun time of day
  const setSunTimeOfDay = useCallback((hour: number) => {
    setState((prev) => ({
      ...prev,
      sunTimeOfDay: Math.max(0, Math.min(24, hour)),
    }))
  }, [])

  // Toggle always-day mode
  const toggleSunAlwaysDay = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sunAlwaysDay: !prev.sunAlwaysDay,
    }))
  }, [])

  // Toggle city labels
  const toggleCityLabels = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showCityLabels: !prev.showCityLabels,
    }))
  }, [])

  // Reset state
  const resetState = useCallback(() => {
    setState(DEFAULT_STATE)
  }, [])

  // Memoized return value
  return useMemo(
    () => ({
      ...state,
      toggleLayer,
      togglePlanet,
      toggleACGLineType,
      setAllPlanets,
      setAllACGLineTypes,
      setHeatmapIntensity,
      setHeatmapSpread,
      setHighlightedPlanet,
      setHighlightedCity,
      toggleCityLabels,
      setSunTimeOfDay,
      toggleSunAlwaysDay,
      resetState,
    }),
    [
      state,
      toggleLayer,
      togglePlanet,
      toggleACGLineType,
      setAllPlanets,
      setAllACGLineTypes,
      setHeatmapIntensity,
      setHeatmapSpread,
      setHighlightedPlanet,
      setHighlightedCity,
      toggleCityLabels,
      setSunTimeOfDay,
      toggleSunAlwaysDay,
      resetState,
    ],
  )
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get count of visible planets.
 */
export function getVisiblePlanetCount(visibility: PlanetVisibility): number {
  return Object.values(visibility).filter(Boolean).length
}

/**
 * Get count of visible ACG line types.
 */
export function getVisibleACGLineTypeCount(filters: ACGLineFilters): number {
  return Object.values(filters).filter(Boolean).length
}
