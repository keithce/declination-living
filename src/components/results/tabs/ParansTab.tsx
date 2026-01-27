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
import type { ParanPoint, PlanetId } from '@convex/calculations/core/types'

// =============================================================================
// Types
// =============================================================================

export interface ParansTabProps {
  /** Paran points from calculations */
  parans: Array<ParanPoint>
  /** Number of parans to display */
  displayLimit?: number
  /** Compact mode for narrow panels */
  compact?: boolean
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

export const ParansTab = memo(function ParansTab({
  parans,
  displayLimit = 100,
  compact = false,
}: ParansTabProps) {
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

  // Calculate summary statistics including average strength
  const summary = useMemo(() => {
    const stats = {
      riseRise: 0,
      riseCulminate: 0,
      riseSet: 0,
      culminateCulminate: 0,
      setSet: 0,
      total: filteredParans.length,
      avgStrength: 0,
    }

    let totalStrength = 0
    let strengthCount = 0

    for (const paran of filteredParans) {
      const e1 = paran.event1
      const e2 = paran.event2

      if (e1 === 'rise' && e2 === 'rise') stats.riseRise++
      else if (
        (e1 === 'rise' && (e2 === 'culminate' || e2 === 'anti_culminate')) ||
        (e2 === 'rise' && (e1 === 'culminate' || e1 === 'anti_culminate'))
      )
        stats.riseCulminate++
      else if ((e1 === 'rise' && e2 === 'set') || (e1 === 'set' && e2 === 'rise')) stats.riseSet++
      else if (
        (e1 === 'culminate' || e1 === 'anti_culminate') &&
        (e2 === 'culminate' || e2 === 'anti_culminate')
      )
        stats.culminateCulminate++
      else if (e1 === 'set' && e2 === 'set') stats.setSet++

      // Track strength for average
      if (paran.strength !== undefined) {
        totalStrength += paran.strength
        strengthCount++
      }
    }

    stats.avgStrength = strengthCount > 0 ? totalStrength / strengthCount : 0

    return stats
  }, [filteredParans])

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className={`${compact ? 'p-2' : 'p-3'} rounded-lg bg-slate-800/50`}>
          <div className={`${compact ? 'text-base' : 'text-xl'} font-bold text-white`}>
            {summary.total}
          </div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className={`${compact ? 'p-2' : 'p-3'} rounded-lg bg-slate-800/50`}>
          <div className={`${compact ? 'text-base' : 'text-xl'} font-bold text-amber-400`}>
            {(summary.riseRise || 0) + (summary.setSet || 0) + (summary.riseSet || 0)}
          </div>
          <div className="text-xs text-slate-500">Horizon</div>
        </div>
        <div className={`${compact ? 'p-2' : 'p-3'} rounded-lg bg-slate-800/50`}>
          <div className={`${compact ? 'text-base' : 'text-xl'} font-bold text-blue-400`}>
            {summary.culminateCulminate}
          </div>
          <div className="text-xs text-slate-500">Meridian</div>
        </div>
        <div className={`${compact ? 'p-2' : 'p-3'} rounded-lg bg-slate-800/50`}>
          <div className={`${compact ? 'text-base' : 'text-xl'} font-bold text-purple-400`}>
            {(summary.avgStrength * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">Avg Strength</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div
        className={`${compact ? 'p-2' : 'p-3'} rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-2`}
      >
        {/* Event Type Filter */}
        <div className={`flex ${compact ? 'flex-wrap' : ''} items-center gap-2`}>
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Event:</span>
          <div className="flex flex-wrap gap-1">
            {(['all', 'rise', 'set', 'culminate', 'mixed'] as Array<EventTypeFilter>).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEventFilter(type)}
                  className={`px-2 py-0.5 text-xs font-medium rounded transition-colors capitalize ${
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
        <div className={`flex ${compact ? 'flex-wrap' : ''} items-center gap-2`}>
          <span className="text-xs text-slate-400">Planet:</span>
          <div className="flex gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedPlanet('all')}
              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
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
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
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
                {PLANET_SYMBOLS[planet]}
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
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    role="progressbar"
                    aria-valuenow={Math.round(paran.strength * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-[width]"
                    style={{ width: `${paran.strength * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-purple-400 min-w-[3rem] text-right">
                  {(paran.strength * 100).toFixed(0)}%
                </span>
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
