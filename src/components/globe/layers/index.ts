/**
 * Globe Visualization Layers - Main exports.
 */

// Types
export * from './types'

// Layer creators
export {
  createZenithBandLayer,
  updateZenithBandVisibility,
  highlightZenithBand,
} from './ZenithBandLayer'
export {
  createACGLineLayer,
  updateACGLineVisibility,
  highlightACGLines,
  getLineTypeDisplayName,
  getLineTypeDescription,
} from './ACGLineLayer'
export {
  createParanPointLayer,
  updateParanPointVisibility,
  getParanTooltip,
  findParanAtPosition,
} from './ParanPointLayer'
export {
  createHeatmapLayer,
  updateHeatmap,
  setHeatmapIntensity,
  setHeatmapSpread,
} from './HeatmapLayer'
