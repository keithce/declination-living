/**
 * Floating Data Panel - Right-side collapsible panel for results data.
 *
 * Contains birth summary, declinations, results, enhanced analysis, and actions.
 * Glass-morphism styling with collapse/expand functionality.
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Edit3, Loader2, Save, Settings, Sparkles } from 'lucide-react'
import type { BirthData } from '@/components/calculator/BirthDataForm'
import type { PlanetWeights } from '@/components/calculator/PlanetWeights'
import type { UseGlobeStateReturn } from '@/components/globe/hooks/useGlobeState'
import type { Declinations } from '@/components/calculator/DeclinationTable'
import { PlanetWeightsEditor } from '@/components/calculator/PlanetWeights'
import { ResultsTabs } from '@/components/results/ResultsTabs'

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

interface FloatingDataPanelProps {
  /** Birth data for summary */
  birthData: BirthData | null
  /** Calculation result */
  result: CalculationResult
  /** Phase 2 enhanced data */
  phase2Data: any | null
  /** Current weights */
  weights: PlanetWeights
  /** Globe state for ResultsTabs */
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
// Sub-components
// =============================================================================

function BirthSummary({ birthData, onEdit }: { birthData: BirthData; onEdit: () => void }) {
  return (
    <div className="p-4 border-b border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Birth Data
        </h3>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-2 py-1 text-xs text-amber-400 hover:text-amber-300 hover:bg-slate-800/50 rounded transition-colors"
        >
          <Edit3 className="w-3 h-3" />
          Edit
        </button>
      </div>
      <div className="text-white font-medium">
        {birthData.birthCity}, {birthData.birthCountry}
      </div>
      <div className="text-sm text-slate-400">
        {birthData.birthDate} at {birthData.birthTime}
      </div>
    </div>
  )
}

function CompactDeclinations({ declinations }: { declinations: Declinations }) {
  const planets = [
    { key: 'sun', symbol: '☉', color: '#fbbf24' },
    { key: 'moon', symbol: '☽', color: '#e2e8f0' },
    { key: 'mercury', symbol: '☿', color: '#a78bfa' },
    { key: 'venus', symbol: '♀', color: '#f472b6' },
    { key: 'mars', symbol: '♂', color: '#ef4444' },
    { key: 'jupiter', symbol: '♃', color: '#f97316' },
    { key: 'saturn', symbol: '♄', color: '#78716c' },
    { key: 'uranus', symbol: '♅', color: '#22d3ee' },
    { key: 'neptune', symbol: '♆', color: '#818cf8' },
    { key: 'pluto', symbol: '♇', color: '#a3a3a3' },
  ] as const

  const formatDeclination = (value: number): string => {
    const direction = value >= 0 ? 'N' : 'S'
    const degrees = Math.abs(value)
    return `${degrees.toFixed(1)}° ${direction}`
  }

  return (
    <div className="p-4 border-b border-slate-700/50">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Declinations
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {planets.map((planet) => {
          const value = declinations[planet.key as keyof Declinations]
          return (
            <div
              key={planet.key}
              className="flex flex-col items-center p-2 bg-slate-800/30 rounded-lg"
              title={planet.key.charAt(0).toUpperCase() + planet.key.slice(1)}
            >
              <span className="text-lg" style={{ color: planet.color }}>
                {planet.symbol}
              </span>
              <span className="text-xs text-slate-400 mt-1">{formatDeclination(value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function FloatingDataPanel({
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
}: FloatingDataPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showWeights, setShowWeights] = useState(false)

  return (
    <>
      {/* Collapse/Expand Toggle */}
      <motion.button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`
          fixed z-20 top-1/2 -translate-y-1/2
          w-6 h-16 flex items-center justify-center
          bg-slate-800/90 backdrop-blur-sm border border-slate-700/50
          text-slate-300 hover:text-white hover:bg-slate-700/90
          transition-all shadow-lg
          ${isCollapsed ? 'right-0 rounded-l-lg' : 'right-80 lg:right-96 rounded-l-lg'}
        `}
        style={{ top: 'calc(50% + 28px)' }}
        aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        layout
      >
        {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </motion.button>

      {/* Panel */}
      <motion.aside
        className={`
          fixed top-[56px] right-0 bottom-0 z-20
          w-80 lg:w-96
          bg-slate-900/85 backdrop-blur-md border-l border-slate-700/50
          flex flex-col overflow-hidden
          shadow-2xl
        `}
        initial={false}
        animate={{
          x: isCollapsed ? '100%' : 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/50">
          <h2 className="font-display text-lg font-semibold text-white">Results</h2>
          {isCalculating && (
            <div className="flex items-center gap-2 text-amber-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Calculating...</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Birth Summary */}
          {birthData && <BirthSummary birthData={birthData} onEdit={onEditBirthData} />}

          {/* Compact Declinations */}
          <CompactDeclinations declinations={result.declinations} />

          {/* Top Latitudes (compact version) */}
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Top Latitudes
            </h3>
            <div className="space-y-2">
              {result.optimalLatitudes.slice(0, 5).map((lat, index) => {
                const direction = lat.latitude >= 0 ? 'N' : 'S'
                return (
                  <div
                    key={lat.latitude}
                    className="flex items-center gap-3 p-2 bg-slate-800/30 rounded-lg"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-700/50 flex items-center justify-center text-xs font-bold text-slate-400">
                      {index + 1}
                    </span>
                    <span className="font-mono text-sm text-white flex-1">
                      {Math.abs(lat.latitude).toFixed(1)}° {direction}
                    </span>
                    <span className="text-xs text-amber-400">{lat.score.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Latitude Bands */}
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Latitude Bands
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.latitudeBands.slice(0, 6).map((band) => {
                const formatLat = (lat: number) => {
                  const direction = lat >= 0 ? 'N' : 'S'
                  return `${Math.abs(lat).toFixed(0)}°${direction}`
                }
                return (
                  <span
                    key={`${band.min}-${band.max}`}
                    className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-xs text-slate-300"
                  >
                    {formatLat(band.min)} - {formatLat(band.max)}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Enhanced Analysis (Phase 2) */}
          {phase2Data && (
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Enhanced Analysis
                </h3>
              </div>
              <ResultsTabs
                acgLines={phase2Data.acgLines}
                zenithLines={phase2Data.zenithLines}
                parans={phase2Data.parans}
                scoringGrid={phase2Data.scoringGrid}
                globeState={globeState}
              />
            </div>
          )}

          {/* Weights Adjuster */}
          <div className="p-4 border-b border-slate-700/50">
            <button
              onClick={() => setShowWeights(!showWeights)}
              className="flex items-center gap-2 w-full text-left"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex-1">
                Adjust Weights
              </span>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${showWeights ? 'rotate-90' : ''}`}
              />
            </button>
            <AnimatePresence>
              {showWeights && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <PlanetWeightsEditor weights={weights} onChange={onRecalculate} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 space-y-2">
          <button
            onClick={onModifyWeights}
            className="w-full px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors text-sm"
          >
            Modify Weights
          </button>
          <button
            onClick={onSaveChart}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-lg hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all text-sm"
          >
            <Save className="w-4 h-4" />
            Save Chart
          </button>
        </div>
      </motion.aside>
    </>
  )
}

export default FloatingDataPanel
