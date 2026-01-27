/**
 * Calculator Store Selectors
 *
 * Memoized selectors for accessing visualization state.
 * These hooks provide optimized access to individual visualization layers,
 * preventing unnecessary re-renders when unrelated state changes.
 */

import { useCalculatorStore } from './calculator-store'
import type {
  ACGData,
  ParanData,
  ScoringGridData,
  VisualizationState,
  ZenithData,
} from './calculator-store'

// =============================================================================
// Visualization Layer Selectors
// =============================================================================

/**
 * Hook to access zenith visualization state.
 * Returns data, loading, and error state for zenith lines.
 */
export function useZenithData() {
  return useCalculatorStore((state) => state.visualization.zenith)
}

/**
 * Hook to access ACG visualization state.
 * Returns data, loading, and error state for ACG lines.
 */
export function useACGData() {
  return useCalculatorStore((state) => state.visualization.acg)
}

/**
 * Hook to access paran visualization state.
 * Returns data, loading, and error state for parans.
 */
export function useParansData() {
  return useCalculatorStore((state) => state.visualization.parans)
}

/**
 * Hook to access scoring grid visualization state.
 * Returns data, loading, and error state for scoring grid.
 */
export function useScoringGridData() {
  return useCalculatorStore((state) => state.visualization.scoringGrid)
}

// =============================================================================
// Combined Selectors
// =============================================================================

/**
 * Hook to access the entire visualization state.
 * Use this only when you need all visualization layers.
 */
export function useVisualizationState(): VisualizationState {
  return useCalculatorStore((state) => state.visualization)
}

/**
 * Hook to check if any visualization is currently loading.
 */
export function useAnyVisualizationLoading(): boolean {
  return useCalculatorStore(
    (state) =>
      state.visualization.zenith.loading ||
      state.visualization.acg.loading ||
      state.visualization.parans.loading ||
      state.visualization.scoringGrid.loading,
  )
}

/**
 * Hook to check if all visualizations have data (fully loaded).
 */
export function useAllVisualizationsLoaded(): boolean {
  return useCalculatorStore(
    (state) =>
      state.visualization.zenith.data !== null &&
      state.visualization.acg.data !== null &&
      state.visualization.parans.data !== null &&
      state.visualization.scoringGrid.data !== null,
  )
}

/**
 * Hook to check if primary visualizations have data (zenith + ACG + parans).
 * Scoring grid is considered secondary since it loads last.
 */
export function usePrimaryVisualizationsLoaded(): boolean {
  return useCalculatorStore(
    (state) =>
      state.visualization.zenith.data !== null &&
      state.visualization.acg.data !== null &&
      state.visualization.parans.data !== null,
  )
}

/**
 * Hook to get loading progress as a fraction (0-1).
 */
export function useVisualizationProgress(): number {
  return useCalculatorStore((state) => {
    let loaded = 0
    if (state.visualization.zenith.data !== null) loaded++
    if (state.visualization.acg.data !== null) loaded++
    if (state.visualization.parans.data !== null) loaded++
    if (state.visualization.scoringGrid.data !== null) loaded++
    return loaded / 4
  })
}

// =============================================================================
// Action Selectors
// =============================================================================

/**
 * Hook to access visualization action setters.
 * Useful when you need multiple setters without subscribing to state changes.
 */
export function useVisualizationActions() {
  const setZenithLoading = useCalculatorStore((state) => state.setZenithLoading)
  const setZenithData = useCalculatorStore((state) => state.setZenithData)
  const setZenithError = useCalculatorStore((state) => state.setZenithError)
  const setACGLoading = useCalculatorStore((state) => state.setACGLoading)
  const setACGData = useCalculatorStore((state) => state.setACGData)
  const setACGError = useCalculatorStore((state) => state.setACGError)
  const setParansLoading = useCalculatorStore((state) => state.setParansLoading)
  const setParansData = useCalculatorStore((state) => state.setParansData)
  const setParansError = useCalculatorStore((state) => state.setParansError)
  const setScoringGridLoading = useCalculatorStore((state) => state.setScoringGridLoading)
  const setScoringGridData = useCalculatorStore((state) => state.setScoringGridData)
  const setScoringGridError = useCalculatorStore((state) => state.setScoringGridError)
  const resetVisualization = useCalculatorStore((state) => state.resetVisualization)

  return {
    setZenithLoading,
    setZenithData,
    setZenithError,
    setACGLoading,
    setACGData,
    setACGError,
    setParansLoading,
    setParansData,
    setParansError,
    setScoringGridLoading,
    setScoringGridData,
    setScoringGridError,
    resetVisualization,
  }
}

// =============================================================================
// Type Exports
// =============================================================================

export type { ZenithData, ACGData, ParanData, ScoringGridData, VisualizationState }
