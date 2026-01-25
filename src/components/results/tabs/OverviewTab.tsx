/**
 * OverviewTab - Summary statistics and top locations
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Globe, MapPin, Sparkles, TrendingUp } from 'lucide-react'
import {
  PLANET_COLORS,
  PLANET_NAMES,
  PLANET_SYMBOLS,
  formatLatitude,
  formatLongitude,
} from '../shared/constants'
import type { GridCell } from '@/../convex/calculations/geospatial/grid'

// =============================================================================
// Types
// =============================================================================

export interface OverviewTabProps {
  /** Scoring grid data */
  scoringGrid: Array<GridCell>
  /** Top N locations to display */
  topN?: number
}

// =============================================================================
// Main Component
// =============================================================================

export const OverviewTab = memo(function OverviewTab({ scoringGrid, topN = 10 }: OverviewTabProps) {
  // Calculate statistics with empty array handling
  const totalCells = scoringGrid.length
  const scores = scoringGrid.map((c) => c.score)
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / totalCells : 0

  // Get top locations
  const topLocations = [...scoringGrid].sort((a, b) => b.score - a.score).slice(0, topN)

  // Count dominant factors
  const factorCounts = scoringGrid.reduce(
    (acc, cell) => {
      acc[cell.dominantFactor]++
      return acc
    },
    { zenith: 0, acg: 0, paran: 0, mixed: 0 } as Record<string, number>,
  )

  // Calculate percentages
  const factorPercentages = Object.entries(factorCounts).map(([factor, count]) => ({
    factor,
    count,
    percentage: (count / totalCells) * 100,
  }))

  const factorLabels: Record<string, { label: string; color: string }> = {
    zenith: { label: 'Zenith Dominant', color: 'bg-blue-500' },
    acg: { label: 'ACG Dominant', color: 'bg-purple-500' },
    paran: { label: 'Paran Dominant', color: 'bg-amber-500' },
    mixed: { label: 'Mixed Influence', color: 'bg-slate-500' },
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Grid Cells</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalCells}</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-500">Max Score</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{maxScore.toFixed(1)}</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-500">Avg Score</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{avgScore.toFixed(1)}</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-500">Top Location</span>
          </div>
          <div className="text-sm font-mono text-amber-400">
            {topLocations[0] ? formatLatitude(topLocations[0].lat) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <h3 className="text-sm font-semibold text-white mb-4">Score Distribution</h3>
        <div className="space-y-3">
          {factorPercentages.map(({ factor, count, percentage }) => {
            const { label, color } = factorLabels[factor]
            return (
              <div key={factor}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">{label}</span>
                  <span className="text-sm font-mono text-slate-400">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full ${color}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Locations */}
      <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <h3 className="text-sm font-semibold text-white mb-4">Top {topN} Locations</h3>
        <div className="space-y-2">
          {topLocations.map((location, index) => (
            <motion.div
              key={`${location.lat}-${location.lon}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm font-bold text-slate-400">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-mono text-sm">
                    {formatLatitude(location.lat)}, {formatLongitude(location.lon)}
                  </span>
                  {location.dominantPlanet && (
                    <span
                      className="text-xs"
                      style={{ color: PLANET_COLORS[location.dominantPlanet] }}
                    >
                      {PLANET_SYMBOLS[location.dominantPlanet]}{' '}
                      {PLANET_NAMES[location.dominantPlanet]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">
                    Zenith: {location.zenithContribution.toFixed(1)}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">ACG: {location.acgContribution.toFixed(1)}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">
                    Paran: {location.paranContribution.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-400">{location.score.toFixed(1)}</div>
                <div className="text-xs text-slate-500 capitalize">{location.dominantFactor}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default OverviewTab
