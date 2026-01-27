/**
 * DignityScores - Display essential dignities for all planets.
 *
 * Shows sect (day/night), dignity indicators, and total scores with progress bars.
 * Glass-morphism styling matching existing components.
 */

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import type { DignityIndicator, Sect } from '@convex/calculations/core/types'
import type { PlanetId } from '@/lib/planet-constants'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PLANETS } from '@/lib/planet-constants'

// =============================================================================
// Types
// =============================================================================

export interface DignityScoreData {
  total: number
  indicator: DignityIndicator | string
  breakdown?: Array<string>
}

interface DignityScoresProps {
  /** Dignity scores for each planet */
  dignities: Record<PlanetId, DignityScoreData>
  /** Chart sect (day or night) */
  sect: Sect
  /** Compact mode for narrow panels */
  compact?: boolean
}

// =============================================================================
// Constants
// =============================================================================

/** Indicator colors and labels */
const INDICATOR_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  R: { color: 'text-green-400', bgColor: 'bg-green-500', label: 'Ruler/Domicile' },
  E: { color: 'text-blue-400', bgColor: 'bg-blue-500', label: 'Exalted' },
  d: { color: 'text-orange-400', bgColor: 'bg-orange-500', label: 'Detriment' },
  f: { color: 'text-red-400', bgColor: 'bg-red-500', label: 'Fall' },
  '-': { color: 'text-slate-400', bgColor: 'bg-slate-500', label: 'Peregrine' },
}

// Score normalization range
const MIN_SCORE = -14
const MAX_SCORE = 15
const SCORE_RANGE = MAX_SCORE - MIN_SCORE

// =============================================================================
// Helper Functions
// =============================================================================

function normalizeScore(score: number): number {
  // Clamp to range and normalize to 0-100
  const clamped = Math.max(MIN_SCORE, Math.min(MAX_SCORE, score))
  return ((clamped - MIN_SCORE) / SCORE_RANGE) * 100
}

function getProgressColor(score: number): string {
  if (score >= 5) return 'bg-green-500'
  if (score >= 0) return 'bg-blue-500'
  if (score >= -5) return 'bg-orange-500'
  return 'bg-red-500'
}

// =============================================================================
// Sub-components
// =============================================================================

function SectHeader({ sect }: { sect: Sect }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
      {sect === 'day' ? (
        <>
          <Sun className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium text-white">Day Chart</span>
          <span className="text-xs text-slate-400">(Sun above horizon)</span>
        </>
      ) : (
        <>
          <Moon className="w-5 h-5 text-blue-300" />
          <span className="text-sm font-medium text-white">Night Chart</span>
          <span className="text-xs text-slate-400">(Sun below horizon)</span>
        </>
      )}
    </div>
  )
}

function IndicatorLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {Object.entries(INDICATOR_CONFIG).map(([key, config]) => (
        <div key={key} className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${config.bgColor}`} />
          <span className="text-slate-400">
            {key}={config.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function IndicatorBadge({
  indicator,
  breakdown,
}: {
  indicator: string
  breakdown?: Array<string>
}) {
  const config = INDICATOR_CONFIG[indicator] ?? INDICATOR_CONFIG['-']

  const badge = (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded ${config.bgColor} text-white cursor-help`}
    >
      {indicator}
    </span>
  )

  if (breakdown && breakdown.length > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <ul className="text-xs space-y-0.5">
            {breakdown.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    )
  }

  return badge
}

// =============================================================================
// Main Component
// =============================================================================

export const DignityScores = memo(function DignityScores({
  dignities,
  sect,
  compact = false,
}: DignityScoresProps) {
  // Sort planets by total score descending
  const sortedPlanets = useMemo(() => {
    return [...PLANETS].sort((a, b) => {
      const scoreA = dignities[a.key]?.total ?? 0
      const scoreB = dignities[b.key]?.total ?? 0
      return scoreB - scoreA
    })
  }, [dignities])

  return (
    <TooltipProvider>
      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        {/* Sect Header */}
        <SectHeader sect={sect} />

        {/* Legend */}
        {!compact && <IndicatorLegend />}

        {/* Planet List */}
        <div className="space-y-2">
          {sortedPlanets.map((planet, index) => {
            const dignity = dignities[planet.key]
            if (!dignity) return null

            const normalizedScore = normalizeScore(dignity.total)
            const progressColor = getProgressColor(dignity.total)

            return (
              <motion.div
                key={planet.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex items-center gap-3 ${compact ? 'p-2' : 'p-3'} rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors`}
              >
                {/* Planet Symbol */}
                <span
                  className={compact ? 'text-lg' : 'text-xl'}
                  style={{ color: planet.color }}
                  title={planet.name}
                >
                  {planet.symbol}
                </span>

                {/* Indicator Badge */}
                <IndicatorBadge indicator={dignity.indicator} breakdown={dignity.breakdown} />

                {/* Progress Bar */}
                <div className="flex-1">
                  <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${progressColor}`}
                      style={{ width: `${normalizedScore}%` }}
                    />
                    {/* Zero line marker */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-slate-500/50"
                      style={{ left: `${normalizeScore(0)}%` }}
                    />
                  </div>
                </div>

                {/* Score */}
                <span
                  className={`font-mono text-sm font-bold min-w-[3rem] text-right ${
                    dignity.total >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {dignity.total >= 0 ? '+' : ''}
                  {dignity.total}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
})

export default DignityScores
