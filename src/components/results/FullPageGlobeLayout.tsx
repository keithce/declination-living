/**
 * Full Page Globe Layout - Immersive results view with full-viewport globe.
 *
 * Renders the globe as a fixed background with floating panels for data and controls.
 * Replaces the scrollable page layout when viewing calculation results.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { GlobeLayersPopover } from './GlobeLayersPopover'
import { FloatingDataPanel } from './FloatingDataPanel'
import type { BirthData } from '@/components/calculator/BirthDataForm'
import type { PlanetWeights } from '@/components/calculator/PlanetWeights'
import type { Declinations } from '@/components/calculator/DeclinationTable'
import type { UseGlobeStateReturn } from '@/components/globe/hooks/useGlobeState'
import type { BackendACGLine, BackendParanPoint } from '@/components/globe/utils'
import type { PlanetId } from '@/components/globe/layers/types'
import { EnhancedGlobeCanvas } from '@/components/globe/EnhancedGlobeCanvas'
import { GlobeView } from '@/components/globe'
import { transformACGLines, transformParans } from '@/components/globe/utils'

// =============================================================================
// Types
// =============================================================================

interface LatitudeScore {
  latitude: number
  score: number
  dominantPlanet: string
}

interface LatitudeBand {
  min: number
  max: number
  dominantPlanet: string
}

interface CalculationResult {
  declinations: Declinations
  optimalLatitudes: Array<LatitudeScore>
  latitudeBands: Array<LatitudeBand>
}

interface Phase2Data {
  declinations: Record<PlanetId, number>
  acgLines: Array<BackendACGLine>
  zenithLines: Array<any>
  parans: Array<BackendParanPoint>
  scoringGrid: Array<any>
}

interface FullPageGlobeLayoutProps {
  /** Birth data */
  birthData: BirthData | null
  /** Calculation result */
  result: CalculationResult
  /** Phase 2 enhanced data (optional) */
  phase2Data: Phase2Data | null
  /** Current weights */
  weights: PlanetWeights
  /** Globe state from useGlobeState hook */
  globeState: UseGlobeStateReturn
  /** Callback to edit birth data */
  onEditBirthData: () => void
  /** Callback to modify weights */
  onModifyWeights: () => void
  /** Callback to recalculate with new weights */
  onRecalculate: (weights: PlanetWeights) => void
  /** Callback to save chart */
  onSaveChart: () => void
  /** Whether calculation is in progress */
  isCalculating: boolean
}

// =============================================================================
// Component
// =============================================================================

export function FullPageGlobeLayout({
  birthData,
  result,
  phase2Data,
  weights,
  globeState,
  onEditBirthData,
  onModifyWeights,
  onRecalculate,
  onSaveChart,
  isCalculating,
}: FullPageGlobeLayoutProps) {
  // Transform data for globe (memoized)
  const transformedACGLines = useMemo(
    () => (phase2Data?.acgLines ? transformACGLines(phase2Data.acgLines) : []),
    [phase2Data?.acgLines],
  )
  const transformedParans = useMemo(
    () => (phase2Data?.parans ? transformParans(phase2Data.parans) : []),
    [phase2Data?.parans],
  )

  // Birth location for marker
  const birthLocation = birthData
    ? {
        latitude: birthData.birthLatitude,
        longitude: birthData.birthLongitude,
        city: birthData.birthCity,
      }
    : undefined

  return (
    <div className="fixed inset-0 top-[56px] overflow-hidden">
      {/* Full-page Globe Background */}
      <motion.div
        className="absolute inset-0 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {phase2Data ? (
          <EnhancedGlobeCanvas
            birthLocation={birthLocation}
            declinations={phase2Data.declinations}
            acgLines={transformedACGLines}
            parans={transformedParans}
            globeState={globeState}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-[#0a0f1f]">
            <GlobeView
              optimalLatitudes={result.optimalLatitudes}
              latitudeBands={result.latitudeBands}
              birthLocation={birthLocation}
            />
          </div>
        )}
      </motion.div>

      {/* Layer Controls Popover (top-left) */}
      {phase2Data && (
        <motion.div
          className="fixed top-[72px] left-4 z-30"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <GlobeLayersPopover globeState={globeState} />
        </motion.div>
      )}

      {/* Floating Data Panel (right side) */}
      <FloatingDataPanel
        birthData={birthData}
        result={result}
        phase2Data={phase2Data}
        weights={weights}
        globeState={globeState}
        onEditBirthData={onEditBirthData}
        onModifyWeights={onModifyWeights}
        onRecalculate={onRecalculate}
        onSaveChart={onSaveChart}
        isCalculating={isCalculating}
      />

      {/* Legend overlay (bottom-left) - only for Phase 2 globe */}
      {phase2Data && (
        <motion.div
          className="fixed bottom-4 left-4 z-20 flex flex-wrap gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {globeState.layers.zenithBands && (
            <div className="px-2 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded text-xs text-slate-300">
              Zenith Bands
            </div>
          )}
          {globeState.layers.acgLines && (
            <div className="px-2 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded text-xs text-slate-300">
              ACG Lines ({transformedACGLines.length})
            </div>
          )}
          {globeState.layers.paranPoints && (
            <div className="px-2 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded text-xs text-slate-300">
              Parans ({transformedParans.length})
            </div>
          )}
          {globeState.layers.heatmap && (
            <div className="px-2 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded text-xs text-slate-300">
              Heatmap
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default FullPageGlobeLayout
