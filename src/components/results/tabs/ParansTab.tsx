/**
 * ParansTab - Display paran aspects with filtering
 */

import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Filter } from 'lucide-react'
import {
  ANGULAR_EVENT_LABELS,
  PLANET_COLORS,
  PLANET_NAMES,
  PLANET_SYMBOLS,
  formatLatitude,
} from '../shared/constants'
import type { ParanPoint, PlanetId } from '@/../convex/calculations/core/types'
import type { ResultsState } from '../hooks/useResultsState'

// =============================================================================
// Types
// =============================================================================

export interface ParansTabProps {
  /** Paran points from calculations */
  parans: Array<ParanPoint>
  /** Results state for synchronization */
  resultsState?: ResultsState
  /** Number of parans to display */
  displayLimit?: number
}

type EventTypeFilter = 'all' | 'rise' | 'set' | 'culminate' | 'mixed'

// =============================================================================
// Helper Functions
// =============================================================================

function getParanEventTypes(paran: ParanPoint): Set<string> {
  return new Set([paran.event1, paran.event2])
}

function matchesEventFilter(paran: ParanPoint, filter: EventTypeFilter): boolean {
  if (filter === 'all') return true

  const events = getParanEventTypes(paran)

  if (filter === 'rise') return events.has('rise')
  if (filter === 'set') return events.has('set')
  if (filter === 'culminate') return events.has('culminate') || events.has('anti_culminate')
  // filter === 'mixed'
  return events.size > 1 && paran.event1 !== paran.event2
}

// =============================================================================
// Main Component
// =============================================================================

export const ParansTab = memo(function ParansTab({ parans, displayLimit = 100 }: ParansTabProps) {
  const [eventFilter, setEventFilter] = useState<EventTypeFilter>('all')
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId | 'all'>('all')

  // Get unique planets involved in parans
  const involvedPlanets = useMemo(() => {
    const planets = new Set<PlanetId>()
    for (const paran of parans) {
      planets.add(paran.planet1)
      planets.add(paran.planet2)
    }
    return Array.from(planets).sort()
  }, [parans])

  // Filter parans
  const filteredParans = useMemo(() => {
    let filtered = parans

    // Filter by event type
    filtered = filtered.filter((paran) => matchesEventFilter(paran, eventFilter))

    // Filter by planet
    if (selectedPlanet !== 'all') {
      filtered = filtered.filter(
        (paran) => paran.planet1 === selectedPlanet || paran.planet2 === selectedPlanet,
      )
    }

    return filtered.slice(0, displayLimit)
  }, [parans, eventFilter, selectedPlanet, displayLimit])

  // Calculate summary statistics
  const summary = useMemo(() => {
    const stats = {
      riseRise: 0,
      riseCulminate: 0,
      riseSet: 0,
      culminateCulminate: 0,
      setSet: 0,
      total: filteredParans.length,
    }

    for (const paran of filteredParans) {
      const e1 = paran.event1
      const e2 = paran.event2

      if (e1 === 'rise' && e2 === 'rise') stats.riseRise++
      else if (
        (e1 === 'rise' && (e2 === 'culminate' || e2 === 'anti_culminate')) ||
        (e2 === 'rise' && (e1 === 'culminate' || e1 === 'anti_culminate'))
      )
        stats.riseCulminate++
      else if (e1 === 'rise' && e2 === 'set') stats.riseSet++
      else if (
        (e1 === 'culminate' || e1 === 'anti_culminate') &&
        (e2 === 'culminate' || e2 === 'anti_culminate')
      )
        stats.culminateCulminate++
      else if (e1 === 'set' && e2 === 'set') stats.setSet++
    }

    return stats
  }, [filteredParans])

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 rounded-lg bg-slate-800/50">
          <div className="text-xl font-bold text-white">{summary.total}</div>
          <div className="text-xs text-slate-500">Total Parans</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50">
          <div className="text-xl font-bold text-amber-400">
            {(summary.riseRise || 0) + (summary.setSet || 0) + (summary.riseSet || 0)}
          </div>
          <div className="text-xs text-slate-500">Horizon Parans</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50">
          <div className="text-xl font-bold text-blue-400">{summary.culminateCulminate}</div>
          <div className="text-xs text-slate-500">Meridian Parans</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-3">
        {/* Event Type Filter */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Event Type:</span>
          <div className="flex gap-1">
            {(['all', 'rise', 'set', 'culminate', 'mixed'] as Array<EventTypeFilter>).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEventFilter(type)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors capitalize ${
                    eventFilter === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Planet Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Planet:</span>
          <div className="flex gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedPlanet('all')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                selectedPlanet === 'all'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              All
            </button>
            {involvedPlanets.map((planet) => (
              <button
                key={planet}
                type="button"
                onClick={() => setSelectedPlanet(planet)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  selectedPlanet === planet
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
                style={
                  selectedPlanet === planet
                    ? undefined
                    : { color: PLANET_COLORS[planet], opacity: 0.7 }
                }
              >
                {PLANET_SYMBOLS[planet]} {PLANET_NAMES[planet]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parans List */}
      <div className="space-y-2">
        {filteredParans.map((paran, index) => (
          <motion.div
            key={`${paran.planet1}-${paran.planet2}-${paran.latitude}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg" style={{ color: PLANET_COLORS[paran.planet1] }}>
                  {PLANET_SYMBOLS[paran.planet1]}
                </span>
                <span className="text-xs text-slate-500">
                  {ANGULAR_EVENT_LABELS[paran.event1] ?? paran.event1}
                </span>
                <span className="text-slate-600">×</span>
                <span className="text-lg" style={{ color: PLANET_COLORS[paran.planet2] }}>
                  {PLANET_SYMBOLS[paran.planet2]}
                </span>
                <span className="text-xs text-slate-500">
                  {ANGULAR_EVENT_LABELS[paran.event2] ?? paran.event2}
                </span>
              </div>
              <div className="text-white font-mono text-sm">{formatLatitude(paran.latitude)}</div>
            </div>
            <div className="text-xs text-slate-400">
              {PLANET_NAMES[paran.planet1]}{' '}
              {(ANGULAR_EVENT_LABELS[paran.event1] ?? paran.event1).toLowerCase()} as{' '}
              {PLANET_NAMES[paran.planet2]} is{' '}
              {(ANGULAR_EVENT_LABELS[paran.event2] ?? paran.event2).toLowerCase()}
            </div>
            {paran.strength !== undefined && (
              <div className="mt-2">
                <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${paran.strength * 100}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Info Footer */}
      {filteredParans.length === 0 && (
        <div className="text-center py-8 text-slate-500">No parans match the selected filters</div>
      )}
      {filteredParans.length < parans.length && (
        <div className="text-xs text-slate-500 text-center">
          Showing {filteredParans.length} of {parans.length} parans
        </div>
      )}
    </div>
  )
})

export default ParansTab
