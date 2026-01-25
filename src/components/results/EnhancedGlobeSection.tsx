/**
 * Enhanced Globe Section - 3D globe with Phase 2 visualization layers.
 *
 * Wraps EnhancedGlobeCanvas with GlobeControls for layer management.
 * Transforms Phase 2 backend data to globe layer format.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Layers, X } from 'lucide-react'
import type { PlanetId } from '@/components/globe/layers/types'
import type { UseGlobeStateReturn } from '@/components/globe/hooks/useGlobeState'
import { EnhancedGlobeCanvas } from '@/components/globe/EnhancedGlobeCanvas'
import { GlobeControls } from '@/components/globe/controls'
import { transformACGLines, transformParans } from '@/components/globe/utils'

// =============================================================================
// Types
// =============================================================================

/** Backend ACGLine format */
interface BackendACGLine {
  planet: PlanetId
  lineType: 'ASC' | 'DSC' | 'MC' | 'IC'
  points: Array<{ latitude: number; longitude: number }>
  isCircumpolar?: boolean
}

/** Backend ParanPoint format */
interface BackendParanPoint {
  planet1: PlanetId
  event1: string
  planet2: PlanetId
  event2: string
  latitude: number
  strength?: number
}

interface EnhancedGlobeSectionProps {
  /** Birth location for marker */
  birthLocation?: {
    latitude: number
    longitude: number
    city: string
  }
  /** Planet declinations from Phase 2 */
  declinations: Record<PlanetId, number>
  /** ACG lines from Phase 2 */
  acgLines: Array<BackendACGLine>
  /** Paran points from Phase 2 */
  parans: Array<BackendParanPoint>
  /** Globe state from useGlobeState hook */
  globeState: UseGlobeStateReturn
}

// =============================================================================
// Component
// =============================================================================

export function EnhancedGlobeSection({
  birthLocation,
  declinations,
  acgLines,
  parans,
  globeState,
}: EnhancedGlobeSectionProps) {
  const [showControls, setShowControls] = useState(false)

  // Transform data to globe layer format (memoized to avoid recalculation on re-renders)
  const transformedACGLines = useMemo(() => transformACGLines(acgLines), [acgLines])
  const transformedParans = useMemo(() => transformParans(parans), [parans])

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden bg-slate-900">
      {/* Globe Canvas */}
      <EnhancedGlobeCanvas
        birthLocation={birthLocation}
        declinations={declinations}
        acgLines={transformedACGLines}
        parans={transformedParans}
        globeState={globeState}
        className="w-full h-full"
        // Required by ExtendedGlobeCanvasProps but not used for enhanced mode
        optimalLatitudes={[]}
        latitudeBands={[]}
      />

      {/* Controls Toggle Button */}
      <button
        type="button"
        onClick={() => setShowControls(!showControls)}
        className={`
          absolute top-4 right-4 z-10
          flex items-center gap-2 px-3 py-2
          rounded-lg backdrop-blur-sm transition-all
          ${showControls ? 'bg-amber-500 text-slate-900' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80'}
        `}
        aria-label={showControls ? 'Hide layer controls' : 'Show layer controls'}
      >
        <Layers className="w-4 h-4" />
        <span className="text-sm font-medium">Layers</span>
      </button>

      {/* Controls Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-16 right-4 z-10 w-72"
          >
            <div className="relative">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowControls(false)}
                className="absolute -top-2 -right-2 z-20 w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 transition-colors"
                aria-label="Close controls"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <GlobeControls state={globeState} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend for visible layers */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2">
        {globeState.layers.zenithBands && (
          <div className="px-2 py-1 bg-slate-800/80 backdrop-blur-sm rounded text-xs text-slate-300">
            Zenith Bands
          </div>
        )}
        {globeState.layers.acgLines && (
          <div className="px-2 py-1 bg-slate-800/80 backdrop-blur-sm rounded text-xs text-slate-300">
            ACG Lines ({transformedACGLines.length})
          </div>
        )}
        {globeState.layers.paranPoints && (
          <div className="px-2 py-1 bg-slate-800/80 backdrop-blur-sm rounded text-xs text-slate-300">
            Parans ({transformedParans.length})
          </div>
        )}
        {globeState.layers.heatmap && (
          <div className="px-2 py-1 bg-slate-800/80 backdrop-blur-sm rounded text-xs text-slate-300">
            Heatmap
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedGlobeSection
