/**
 * ACGLinesTab - Display ACG lines grouped by planet
 */

import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronRight, Filter } from 'lucide-react'
import {
  ACG_LINE_TYPE_LABELS,
  PLANET_COLORS,
  PLANET_NAMES,
  PLANET_SYMBOLS,
  formatLatitude,
  formatLongitude,
} from '../shared/constants'
import type { ACGLine, PlanetId } from '@/../convex/calculations/core/types'
import type { ResultsState } from '../hooks/useResultsState'

// =============================================================================
// Types
// =============================================================================

export interface ACGLinesTabProps {
  /** ACG lines from calculations */
  acgLines: Array<ACGLine>
  /** Results state for synchronization */
  resultsState?: ResultsState
}

type LineTypeFilter = 'all' | 'MC' | 'IC' | 'ASC' | 'DSC'

// =============================================================================
// Helper Functions
// =============================================================================

function groupLinesByPlanet(lines: Array<ACGLine>): Partial<Record<PlanetId, Array<ACGLine>>> {
  const grouped: Partial<Record<PlanetId, Array<ACGLine>>> = {}

  for (const line of lines) {
    if (!grouped[line.planet]) {
      grouped[line.planet] = []
    }
    grouped[line.planet]!.push(line)
  }

  return grouped
}

// =============================================================================
// Main Component
// =============================================================================

export const ACGLinesTab = memo(function ACGLinesTab({ acgLines }: ACGLinesTabProps) {
  const [expandedPlanets, setExpandedPlanets] = useState<Set<PlanetId>>(new Set())
  const [lineTypeFilter, setLineTypeFilter] = useState<LineTypeFilter>('all')

  // Group lines by planet
  const groupedLines = useMemo(() => groupLinesByPlanet(acgLines), [acgLines])

  // Filter lines by type
  const filteredGroupedLines = useMemo(() => {
    if (lineTypeFilter === 'all') return groupedLines

    const filtered: Partial<Record<PlanetId, Array<ACGLine>>> = {}
    for (const [planet, lines] of Object.entries(groupedLines) as Array<
      [PlanetId, Array<ACGLine> | undefined]
    >) {
      if (!lines) continue
      const filteredLines = lines.filter((line) => line.lineType === lineTypeFilter)
      if (filteredLines.length > 0) {
        filtered[planet] = filteredLines
      }
    }
    return filtered
  }, [groupedLines, lineTypeFilter])

  // Toggle planet expansion
  const togglePlanet = (planet: PlanetId) => {
    setExpandedPlanets((prev) => {
      const next = new Set(prev)
      if (next.has(planet)) {
        next.delete(planet)
      } else {
        next.add(planet)
      }
      return next
    })
  }

  // Expand all planets
  const expandAll = () => {
    setExpandedPlanets(new Set(Object.keys(filteredGroupedLines) as Array<PlanetId>))
  }

  // Collapse all planets
  const collapseAll = () => {
    setExpandedPlanets(new Set())
  }

  const planets = Object.keys(filteredGroupedLines) as Array<PlanetId>

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Line Type:</span>
          <div className="flex gap-1">
            {(['all', 'MC', 'IC', 'ASC', 'DSC'] as Array<LineTypeFilter>).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setLineTypeFilter(type)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  lineTypeFilter === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {type === 'all' ? 'All' : type}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Grouped Lines */}
      <div className="space-y-2">
        {planets.map((planet) => {
          const lines = filteredGroupedLines[planet]
          const isExpanded = expandedPlanets.has(planet)

          return (
            <motion.div
              key={planet}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-slate-800/30 border border-slate-700/50 overflow-hidden"
            >
              {/* Planet Header */}
              <button
                type="button"
                onClick={() => togglePlanet(planet)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-xl" style={{ color: PLANET_COLORS[planet] }}>
                    {PLANET_SYMBOLS[planet]}
                  </span>
                  <span className="text-white font-medium">{PLANET_NAMES[planet]}</span>
                  <span className="text-sm text-slate-500">({lines?.length || 0} lines)</span>
                </div>
              </button>

              {/* Lines List */}
              {isExpanded && lines && (
                <div className="px-4 pb-4 space-y-2">
                  {lines.map((line, index) => (
                    <motion.div
                      key={`${line.planet}-${line.lineType}-${index}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 rounded bg-slate-800/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {ACG_LINE_TYPE_LABELS[line.lineType].label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {line.points.length} points
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {ACG_LINE_TYPE_LABELS[line.lineType].description}
                      </div>

                      {/* Sample Points */}
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        {line.points.slice(0, 3).map((point, pointIndex) => (
                          <div
                            key={pointIndex}
                            className="p-2 rounded bg-slate-700/30 font-mono text-slate-400"
                          >
                            {formatLatitude(point.latitude)}, {formatLongitude(point.longitude)}
                          </div>
                        ))}
                      </div>
                      {line.points.length > 3 && (
                        <div className="mt-1 text-xs text-slate-500 text-center">
                          ... and {line.points.length - 3} more points
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Empty State */}
      {planets.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No ACG lines match the selected filter
        </div>
      )}
    </div>
  )
})

export default ACGLinesTab
