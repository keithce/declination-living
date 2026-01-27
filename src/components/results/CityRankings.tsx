/**
 * CityRankings - Display ranked city recommendations.
 *
 * Shows top locations with filtering and sorting options.
 * Supports click-to-zoom interaction with the globe.
 */

import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Filter, MapPin, Shield, Star } from 'lucide-react'
import type { SafetyScore } from '@convex/calculations/core/types'
import { ScrollArea } from '@/components/ui/scroll-area'

// =============================================================================
// Types
// =============================================================================

export interface RankedCityData {
  name: string
  country: string
  latitude: number
  longitude: number
  population: number
  tier: 'major' | 'medium' | 'minor' | 'small'
}

export interface RankedCity {
  city: RankedCityData
  score: number
  breakdown: {
    zenith: number
    acg: number
    paran: number
  }
  safetyScore?: SafetyScore
  highlights: Array<string>
}

interface CityRankingsProps {
  /** Ranked cities to display */
  cities: Array<RankedCity>
  /** Callback when a city is clicked */
  onCityClick?: (city: RankedCity) => void
  /** Compact mode for narrow panels */
  compact?: boolean
  /** Max cities to display */
  maxDisplay?: number
}

type TierFilter = 'all' | 'major' | 'medium' | 'minor' | 'small'
type SortOption = 'score' | 'safety' | 'population'

// =============================================================================
// Constants
// =============================================================================

const TIER_LABELS: Record<TierFilter, string> = {
  all: 'All',
  major: 'Major',
  medium: 'Medium',
  minor: 'Minor',
  small: 'Small',
}

const SORT_LABELS: Record<SortOption, string> = {
  score: 'Score',
  safety: 'Safety',
  population: 'Population',
}

// =============================================================================
// Sub-components
// =============================================================================

function FilterControls({
  tierFilter,
  setTierFilter,
  sortOption,
  setSortOption,
  compact,
}: {
  tierFilter: TierFilter
  setTierFilter: (tier: TierFilter) => void
  sortOption: SortOption
  setSortOption: (sort: SortOption) => void
  compact: boolean
}) {
  return (
    <div
      className={`${compact ? 'p-2' : 'p-3'} rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-2`}
    >
      {/* Tier Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-xs text-slate-400">Tier:</span>
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(TIER_LABELS) as Array<TierFilter>).map((tier) => (
            <button
              key={tier}
              type="button"
              aria-pressed={tierFilter === tier}
              onClick={() => setTierFilter(tier)}
              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                tierFilter === tier
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {TIER_LABELS[tier]}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Option */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 ml-6">Sort:</span>
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(SORT_LABELS) as Array<SortOption>).map((sort) => (
            <button
              key={sort}
              type="button"
              aria-pressed={sortOption === sort}
              onClick={() => setSortOption(sort)}
              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                sortOption === sort
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {SORT_LABELS[sort]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function CityCard({
  city,
  rank,
  onClick,
  compact,
  index,
}: {
  city: RankedCity
  rank: number
  onClick?: () => void
  compact: boolean
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`${compact ? 'p-2' : 'p-3'} rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={
        onClick ? `${city.city.name}, rank ${rank}, score ${city.score.toFixed(1)}` : undefined
      }
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {/* Top Row: Rank, City, Score */}
      <div className="flex items-center gap-2 mb-2">
        {/* Rank Badge */}
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            rank <= 3 ? 'bg-amber-500 text-slate-900' : 'bg-slate-700/50 text-slate-400'
          }`}
        >
          {rank}
        </span>

        {/* City Name */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{city.city.name}</div>
          <div className="text-xs text-slate-500 truncate">{city.city.country}</div>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1" title="Match Score">
            <Star className="w-3 h-3 text-amber-400" />
            <span className="text-sm font-mono font-bold text-amber-400">
              {city.score.toFixed(1)}
            </span>
          </div>
          {city.safetyScore && (
            <div className="flex items-center gap-1" title="Safety Score">
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-sm font-mono font-bold text-green-400">
                {city.safetyScore.overall.toFixed(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
          Z:{city.breakdown.zenith.toFixed(1)}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
          A:{city.breakdown.acg.toFixed(1)}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 bg-pink-500/20 text-pink-400 rounded">
          P:{city.breakdown.paran.toFixed(1)}
        </span>
      </div>

      {/* Highlights (first 3) */}
      {city.highlights.length > 0 && !compact && (
        <div className="mt-2 flex flex-wrap gap-1">
          {city.highlights.slice(0, 3).map((highlight, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-300 rounded"
            >
              {highlight}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export const CityRankings = memo(function CityRankings({
  cities,
  onCityClick,
  compact = false,
  maxDisplay = 20,
}: CityRankingsProps) {
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('score')

  // Filter and sort cities
  const filteredCities = useMemo(() => {
    let filtered = cities

    // Filter by tier
    if (tierFilter !== 'all') {
      filtered = filtered.filter((c) => c.city.tier === tierFilter)
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'safety': {
          const aScore = a.safetyScore?.overall
          const bScore = b.safetyScore?.overall
          if (aScore == null && bScore == null) return 0
          if (aScore == null) return 1 // a to end
          if (bScore == null) return -1 // b to end
          return bScore - aScore
        }
        case 'population':
          return b.city.population - a.city.population
        case 'score':
        default:
          return b.score - a.score
      }
    })

    return sorted.slice(0, maxDisplay)
  }, [cities, tierFilter, sortOption, maxDisplay])

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-amber-400" />
        <h3 className="font-display text-lg font-semibold text-white">Top Locations</h3>
        <span className="text-xs text-slate-500">({filteredCities.length})</span>
      </div>

      {/* Filter Controls */}
      <FilterControls
        tierFilter={tierFilter}
        setTierFilter={setTierFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
        compact={compact}
      />

      {/* City List */}
      {filteredCities.length > 0 ? (
        <ScrollArea className={compact ? 'h-[300px]' : 'h-[400px]'}>
          <div className="space-y-2 pr-4">
            {filteredCities.map((city, index) => (
              <CityCard
                key={`${city.city.name}-${city.city.latitude}-${city.city.longitude}`}
                city={city}
                rank={index + 1}
                onClick={onCityClick ? () => onCityClick(city) : undefined}
                compact={compact}
                index={index}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-8 text-slate-500">No cities match the selected filters</div>
      )}

      {/* Footer */}
      {filteredCities.length < cities.length && (
        <div className="text-xs text-slate-500 text-center">
          Showing {filteredCities.length} of {cities.length} cities
        </div>
      )}
    </div>
  )
})

export default CityRankings
