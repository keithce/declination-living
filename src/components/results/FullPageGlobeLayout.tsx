/**
 * Full Page Globe Layout - Immersive results view with full-viewport globe.
 *
 * Renders the globe as a fixed background with floating panels for data and controls.
 * Replaces the scrollable page layout when viewing calculation results.
 */

import { useEffect, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Globe, Loader2 } from 'lucide-react'
import { GlobeLayersPopover } from './GlobeLayersPopover'
import { FloatingDataPanel } from './FloatingDataPanel'
import type { BirthData } from '@/components/calculator/BirthDataForm'
import type { PlanetWeights } from '@/components/calculator/PlanetWeights'
import type { Declinations } from '@/components/calculator/DeclinationTable'
import type { UseGlobeStateReturn } from '@/components/globe/hooks/useGlobeState'
import type { BackendACGLine } from '@/components/globe/utils'
import type { PlanetId } from '@/components/globe/layers/types'
import type { GridCell } from '@/../convex/calculations/geospatial/grid'
import type { ParanPoint, ZenithLine } from '@/../convex/calculations/core/types'
import { PLANET_IDS } from '@/components/globe/layers/types'
import { EnhancedGlobeCanvas } from '@/components/globe/EnhancedGlobeCanvas'
import { transformACGLines, transformParans } from '@/components/globe/utils'
import { useHeaderVisibility } from '@/contexts/HeaderContext'

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

export interface Phase2Data {
  declinations: Record<PlanetId, number>
  acgLines: Array<BackendACGLine>
  zenithLines: Array<ZenithLine>
  parans: Array<ParanPoint>
  scoringGrid: Array<GridCell>
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
  // Hide the root header when this layout is mounted
  const { setHideHeader } = useHeaderVisibility()

  useEffect(() => {
    setHideHeader(true)
    return () => setHideHeader(false)
  }, [setHideHeader])

  // Convert Phase 1 declinations to globe format (Partial<Record<PlanetId, number>>)
  // Phase 2 data has this already, but Phase 1 uses a different type
  const declinationsForGlobe = useMemo((): Partial<Record<PlanetId, number>> => {
    if (phase2Data?.declinations) return phase2Data.declinations
    // Convert from Phase 1 Declinations type to Partial<Record<PlanetId, number>>
    const converted: Partial<Record<PlanetId, number>> = {}
    for (const planet of PLANET_IDS) {
      const value = result.declinations[planet as keyof Declinations]
      if (typeof value === 'number') {
        converted[planet] = value
      }
    }
    return converted
  }, [phase2Data?.declinations, result.declinations])

  // Transform data for globe (memoized) - empty arrays when phase2 not ready
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
    <div className="fixed inset-0 overflow-hidden">
      {/* Minimal Header - transparent, centered title only */}
      <header className="absolute top-0 left-0 right-0 z-40 p-4 flex items-center justify-center bg-gradient-to-b from-slate-900/60 to-transparent">
        <Link to="/" className="flex items-center gap-2 group">
          <Globe className="w-6 h-6 text-amber-400 group-hover:text-amber-300 transition-colors" />
          <span className="text-lg font-bold text-white/90 group-hover:text-white transition-colors">
            Declination Living
          </span>
        </Link>
      </header>

      {/* Full-page Globe Background - Always use EnhancedGlobeCanvas */}
      <motion.div
        className="absolute inset-0 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <EnhancedGlobeCanvas
          birthLocation={birthLocation}
          declinations={declinationsForGlobe}
          acgLines={transformedACGLines}
          parans={transformedParans}
          globeState={globeState}
          className="w-full h-full"
        />
      </motion.div>

      {/* Loading indicator when Phase 2 is calculating */}
      {isCalculating && !phase2Data && (
        <motion.div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span className="text-sm text-slate-300">Loading enhanced data...</span>
        </motion.div>
      )}

      {/* Layer Controls Popover (top-left, below header) */}
      <motion.div
        className="fixed top-16 left-4 z-30"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <GlobeLayersPopover globeState={globeState} />
      </motion.div>

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

      {/* Legend overlay (bottom-left) */}
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
        {globeState.layers.acgLines && phase2Data && (
          <div className="px-2 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded text-xs text-slate-300">
            ACG Lines ({transformedACGLines.length})
          </div>
        )}
        {globeState.layers.paranPoints && phase2Data && (
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
    </div>
  )
}

export default FullPageGlobeLayout
