/**
 * Full Page Globe Layout - Immersive results view with full-viewport globe.
 *
 * Renders the globe as a fixed background with floating panels for data and controls.
 * Replaces the scrollable page layout when viewing calculation results.
 */

import { useEffect, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Globe, Loader2 } from 'lucide-react'
import { GlobeLayersPopover } from './GlobeLayersPopover'
import { FloatingDataPanel } from './FloatingDataPanel'
import type { BirthData } from '@/components/calculator/BirthDataForm'
import type { PlanetWeights } from '@/components/calculator/PlanetWeights'
import type { Declinations } from '@/components/calculator/DeclinationTable'
import type { UseGlobeStateReturn } from '@/components/globe/hooks/useGlobeState'
import type { PlanetId } from '@/components/globe/layers/types'
import type { ProgressiveVisualization } from '@/hooks/useProgressiveVisualization'
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

interface FullPageGlobeLayoutProps {
  /** Progressive visualization state from TanStack Query */
  viz: ProgressiveVisualization
  /** Birth data */
  birthData: BirthData | null
  /** Calculation result */
  result: CalculationResult
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
  viz,
  birthData,
  result,
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
  // Use progressive zenith data if available, otherwise fall back to Phase 1
  const declinationsForGlobe = useMemo((): Partial<Record<PlanetId, number>> => {
    // Prefer progressive zenith data (includes declinations)
    if (viz.zenith.data?.declinations) return viz.zenith.data.declinations
    // Convert from Phase 1 Declinations type to Partial<Record<PlanetId, number>>
    const converted: Partial<Record<PlanetId, number>> = {}
    for (const planet of PLANET_IDS) {
      const value = result.declinations[planet as keyof Declinations]
      if (typeof value === 'number') {
        converted[planet] = value
      }
    }
    return converted
  }, [viz.zenith.data?.declinations, result.declinations])

  // Transform data for globe (memoized) - use progressive data from TanStack Query
  const transformedACGLines = useMemo(() => {
    if (viz.acg.data?.acgLines) return transformACGLines(viz.acg.data.acgLines)
    return []
  }, [viz.acg.data?.acgLines])

  const transformedParans = useMemo(() => {
    if (viz.parans.data?.points) return transformParans(viz.parans.data.points)
    return []
  }, [viz.parans.data?.points])

  // Transform ranked cities to CityMarkerData for globe
  const rankedCitiesForGlobe = useMemo(() => {
    if (!viz.rankedCities.data) return undefined
    return viz.rankedCities.data.map((city) => ({
      id: city.id,
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
      score: city.score,
      rank: city.rank,
      tier: city.tier,
      highlights: city.highlights,
    }))
  }, [viz.rankedCities.data])

  // Birth location for marker (memoized to prevent scene recreation)
  const birthLocation = useMemo(
    () =>
      birthData
        ? {
            latitude: birthData.birthLatitude,
            longitude: birthData.birthLongitude,
            city: birthData.birthCity,
          }
        : undefined,
    [birthData?.birthLatitude, birthData?.birthLongitude, birthData?.birthCity],
  )

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
          rankedCities={rankedCitiesForGlobe}
          globeState={globeState}
          className="w-full h-full"
        />
      </motion.div>

      {/* Progressive loading indicator */}
      <AnimatePresence>
        {viz.isAnyLoading && (
          <motion.div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg flex items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <div className="flex flex-col">
              <span className="text-sm text-slate-300">Loading visualizations...</span>
              <div className="flex items-center gap-2 mt-1">
                {/* Progress bar */}
                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${viz.progress * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-xs text-slate-400">{Math.round(viz.progress * 100)}%</span>
              </div>
            </div>
            {/* Individual layer status indicators */}
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-700 pl-3">
              <div
                className={`w-2 h-2 rounded-full ${viz.zenith.isSuccess ? 'bg-green-400' : viz.zenith.isFetching ? 'bg-amber-400 animate-pulse' : viz.zenith.isError ? 'bg-red-400' : 'bg-slate-600'}`}
                title={`Zenith: ${viz.zenith.isSuccess ? 'loaded' : viz.zenith.isFetching ? 'loading' : viz.zenith.isError ? 'error' : 'pending'}`}
              />
              <div
                className={`w-2 h-2 rounded-full ${viz.acg.isSuccess ? 'bg-green-400' : viz.acg.isFetching ? 'bg-amber-400 animate-pulse' : viz.acg.isError ? 'bg-red-400' : 'bg-slate-600'}`}
                title={`ACG: ${viz.acg.isSuccess ? 'loaded' : viz.acg.isFetching ? 'loading' : viz.acg.isError ? 'error' : 'pending'}`}
              />
              <div
                className={`w-2 h-2 rounded-full ${viz.parans.isSuccess ? 'bg-green-400' : viz.parans.isFetching ? 'bg-amber-400 animate-pulse' : viz.parans.isError ? 'bg-red-400' : 'bg-slate-600'}`}
                title={`Parans: ${viz.parans.isSuccess ? 'loaded' : viz.parans.isFetching ? 'loading' : viz.parans.isError ? 'error' : 'pending'}`}
              />
              <div
                className={`w-2 h-2 rounded-full ${viz.scoringGrid.isSuccess ? 'bg-green-400' : viz.scoringGrid.isFetching ? 'bg-amber-400 animate-pulse' : viz.scoringGrid.isError ? 'bg-red-400' : 'bg-slate-600'}`}
                title={`Grid: ${viz.scoringGrid.isSuccess ? 'loaded' : viz.scoringGrid.isFetching ? 'loading' : viz.scoringGrid.isError ? 'error' : 'pending'}`}
              />
              <div
                className={`w-2 h-2 rounded-full ${viz.rankedCities.isSuccess ? 'bg-green-400' : viz.rankedCities.isFetching ? 'bg-amber-400 animate-pulse' : viz.rankedCities.isError ? 'bg-red-400' : 'bg-slate-600'}`}
                title={`Cities: ${viz.rankedCities.isSuccess ? 'loaded' : viz.rankedCities.isFetching ? 'loading' : viz.rankedCities.isError ? 'error' : 'pending'}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        viz={viz}
        birthData={birthData}
        result={result}
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
          <div className="px-2 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded text-xs text-slate-300 flex items-center gap-1.5">
            Zenith Bands
            {viz.zenith.isFetching && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
          </div>
        )}
        {globeState.layers.acgLines && viz.acg.data && (
          <div className="px-2 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded text-xs text-slate-300 flex items-center gap-1.5">
            ACG Lines ({transformedACGLines.length})
            {viz.acg.isFetching && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
          </div>
        )}
        {globeState.layers.paranPoints && viz.parans.data && (
          <div className="px-2 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded text-xs text-slate-300 flex items-center gap-1.5">
            Parans ({transformedParans.length})
            {viz.parans.isFetching && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
          </div>
        )}
        {globeState.layers.heatmap && (
          <div className="px-2 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded text-xs text-slate-300 flex items-center gap-1.5">
            Heatmap
            {viz.scoringGrid.isFetching && (
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            )}
          </div>
        )}
        {globeState.layers.cityMarkers && viz.rankedCities.data && (
          <div className="px-2 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded text-xs text-slate-300 flex items-center gap-1.5">
            Cities ({viz.rankedCities.data.length})
            {viz.rankedCities.isFetching && (
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default FullPageGlobeLayout
