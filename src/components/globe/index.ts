/**
 * Globe Visualization Components - Main exports.
 *
 * Provides 3D globe visualization for declination data, ACG lines,
 * paran points, and heatmap overlays.
 */

// Original components
export { GlobeView } from './GlobeView'
export { default as GlobeCanvas } from './GlobeCanvas'

// Enhanced globe canvas with layers
export { EnhancedGlobeCanvas } from './EnhancedGlobeCanvas'

// Controls
export { GlobeControls } from './controls'

// Hooks
export { useGlobeState, getVisiblePlanetCount, getVisibleACGLineTypeCount } from './hooks'
export type { GlobeState, GlobeStateActions, UseGlobeStateReturn } from './hooks'

// Utils
export { transformACGLines, transformZenithLines, transformParans, hasPhase2Data } from './utils'

// Layer types
export type {
  PlanetId,
  PlanetVisibility,
  ACGLineFilters,
  LayerVisibility,
  ZenithLineData,
  ACGLineData,
  ParanPointData,
  LayerGroup,
  ExtendedGlobeCanvasProps,
} from './layers/types'

// Layer constants
export { PLANET_IDS, PLANET_COLORS_HEX } from './layers/types'

// Layer creators (for advanced usage)
export {
  createZenithBandLayer,
  updateZenithBandVisibility,
  highlightZenithBand,
} from './layers/ZenithBandLayer'

export {
  createACGLineLayer,
  updateACGLineVisibility,
  highlightACGLines,
  getLineTypeDisplayName,
  getLineTypeDescription,
} from './layers/ACGLineLayer'

export {
  createParanPointLayer,
  updateParanPointVisibility,
  getParanTooltip,
  findParanAtPosition,
} from './layers/ParanPointLayer'

export {
  createHeatmapLayer,
  updateHeatmap,
  setHeatmapIntensity,
  setHeatmapSpread,
} from './layers/HeatmapLayer'
