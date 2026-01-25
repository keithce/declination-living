/**
 * ScoringTab - Display scoring grid with expandable details
 */

import { memo, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronRight, Filter } from 'lucide-react'
import {
  PLANET_COLORS,
  PLANET_NAMES,
  PLANET_SYMBOLS,
  formatLatitude,
  formatLongitude,
} from '../shared/constants'
import type { GridCell } from '@/../convex/calculations/geospatial/grid'
import type { ResultsState } from '../hooks/useResultsState'

// =============================================================================
// Types
// =============================================================================

export interface ScoringTabProps {
  /** Scoring grid data */
  scoringGrid: Array<GridCell>
  /** Results state for synchronization */
  resultsState?: ResultsState
  /** Number of rows to display */
  displayLimit?: number
}

type DominantFactorFilter = 'all' | 'zenith' | 'acg' | 'paran' | 'mixed'
type SortField = 'score' | 'zenith' | 'acg' | 'paran'

// =============================================================================
// Main Component
// =============================================================================

export const ScoringTab = memo(function ScoringTab({
  scoringGrid,
  displayLimit = 50,
}: ScoringTabProps) {
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set())
  const [factorFilter, setFactorFilter] = useState<DominantFactorFilter>('all')
  const [sortField, setSortField] = useState<SortField>('score')

  // Generate unique key for cell
  const getCellKey = (cell: GridCell) => `${cell.lat}-${cell.lon}`

  // Toggle cell expansion
  const toggleCell = (cell: GridCell) => {
    const key = getCellKey(cell)
    setExpandedCells((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Filter and sort grid
  const processedGrid = useMemo(() => {
    let filtered = scoringGrid

    // Apply factor filter
    if (factorFilter !== 'all') {
      filtered = filtered.filter((cell) => cell.dominantFactor === factorFilter)
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortField === 'score') return b.score - a.score
      if (sortField === 'zenith') return b.zenithContribution - a.zenithContribution
      if (sortField === 'acg') return b.acgContribution - a.acgContribution
      if (sortField === 'paran') return b.paranContribution - a.paranContribution
      return 0
    })

    return filtered.slice(0, displayLimit)
  }, [scoringGrid, factorFilter, sortField, displayLimit])

  return (
    <div className="space-y-4">
      {/* Filter and Sort Controls */}
      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-3">
        {/* Factor Filter */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Factor:</span>
          <div className="flex gap-1">
            {(['all', 'zenith', 'acg', 'paran', 'mixed'] as Array<DominantFactorFilter>).map(
              (factor) => (
                <button
                  key={factor}
                  type="button"
                  onClick={() => setFactorFilter(factor)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors capitalize ${
                    factorFilter === factor
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {factor}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Sort Control */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Sort by:</span>
          <div className="flex gap-1">
            {(['score', 'zenith', 'acg', 'paran'] as Array<SortField>).map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => setSortField(field)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors capitalize ${
                  sortField === field
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {field}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Cells */}
      <div className="space-y-2">
        {processedGrid.map((cell, index) => {
          const key = getCellKey(cell)
          const isExpanded = expandedCells.has(key)

          // Calculate percentages for visual breakdown
          const total = cell.zenithContribution + cell.acgContribution + cell.paranContribution
          const zenithPercent = total > 0 ? (cell.zenithContribution / total) * 100 : 0
          const acgPercent = total > 0 ? (cell.acgContribution / total) * 100 : 0
          const paranPercent = total > 0 ? (cell.paranContribution / total) * 100 : 0

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="rounded-lg bg-slate-800/30 border border-slate-700/50 overflow-hidden"
            >
              {/* Cell Header */}
              <button
                type="button"
                onClick={() => toggleCell(cell)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <div className="text-left">
                    <div className="text-white font-mono text-sm">
                      {formatLatitude(cell.lat)}, {formatLongitude(cell.lon)}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {cell.dominantFactor} dominant
                      {cell.dominantPlanet && (
                        <>
                          {' • '}
                          <span style={{ color: PLANET_COLORS[cell.dominantPlanet] }}>
                            {PLANET_SYMBOLS[cell.dominantPlanet]}{' '}
                            {PLANET_NAMES[cell.dominantPlanet]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">{cell.score.toFixed(1)}</div>
                  <div className="text-xs text-slate-500">Total Score</div>
                </div>
              </button>

              {/* Score Breakdown Bar */}
              <div className="h-1.5 flex overflow-hidden">
                <div
                  className="bg-blue-500"
                  style={{ width: `${zenithPercent}%` }}
                  title={`Zenith: ${zenithPercent.toFixed(1)}%`}
                />
                <div
                  className="bg-purple-500"
                  style={{ width: `${acgPercent}%` }}
                  title={`ACG: ${acgPercent.toFixed(1)}%`}
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${paranPercent}%` }}
                  title={`Paran: ${paranPercent.toFixed(1)}%`}
                />
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-700/50"
                  >
                    <div className="p-4 space-y-3">
                      {/* Zenith Contribution */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-300">Zenith Contribution</span>
                          <span className="text-sm font-mono text-blue-400">
                            {cell.zenithContribution.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${zenithPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* ACG Contribution */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-300">ACG Contribution</span>
                          <span className="text-sm font-mono text-purple-400">
                            {cell.acgContribution.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${acgPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Paran Contribution */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-300">Paran Contribution</span>
                          <span className="text-sm font-mono text-amber-400">
                            {cell.paranContribution.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${paranPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Info Footer */}
      {processedGrid.length < scoringGrid.length && (
        <div className="text-xs text-slate-500 text-center">
          Showing top {processedGrid.length} of {scoringGrid.length} cells
        </div>
      )}
    </div>
  )
})

export default ScoringTab
