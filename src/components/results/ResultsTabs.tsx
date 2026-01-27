/**
 * ResultsTabs - Phase 2 Enhanced Results Interface
 *
 * Dropdown-based interface for displaying ACG, zenith, scoring, and paran results
 * with globe visualization integration. Optimized for narrow panel widths.
 */

import { memo, useState } from 'react'
import { BarChart3, Globe, Loader2, MapPin, Sparkles, Target } from 'lucide-react'
import { APPROX_OBLIQUITY } from '@convex/calculations/core/constants'
import { OverviewTab } from './tabs/OverviewTab'
import { ACGLinesTab } from './tabs/ACGLinesTab'
import { ZenithTab } from './tabs/ZenithTab'
import { ScoringTab } from './tabs/ScoringTab'
import { ParansTab } from './tabs/ParansTab'
import type { ACGLine, ParanPoint, ZenithLine } from '@convex/calculations/core/types'
import type { GridCell } from '@convex/calculations/geospatial/grid'
import type { GlobeState } from '../globe/hooks/useGlobeState'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// =============================================================================
// Types
// =============================================================================

export interface ResultsTabsProps {
  /** ACG lines from calculations */
  acgLines: Array<ACGLine>
  /** Zenith lines from calculations */
  zenithLines: Array<ZenithLine>
  /** Paran points from calculations */
  parans: Array<ParanPoint>
  /** Scoring grid for heatmap */
  scoringGrid: Array<GridCell>
  /** Globe state for synchronization */
  globeState: GlobeState
  /** Compact mode for narrow panels (default: true) */
  compact?: boolean
  /** Loading state for ACG lines (progressive loading) */
  isACGLoading?: boolean
  /** Loading state for zenith lines (progressive loading) */
  isZenithLoading?: boolean
  /** Loading state for parans (progressive loading) */
  isParansLoading?: boolean
  /** Loading state for scoring grid (progressive loading) */
  isScoringGridLoading?: boolean
}

type TabValue = 'overview' | 'acg' | 'zenith' | 'scoring' | 'parans'

const VALID_TAB_VALUES: ReadonlyArray<TabValue> = ['overview', 'acg', 'zenith', 'scoring', 'parans']

function isValidTabValue(v: string): v is TabValue {
  return (VALID_TAB_VALUES as ReadonlyArray<string>).includes(v)
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * ResultsTabs - Main results interface with dropdown selector
 *
 * Sections:
 * 1. Overview - Summary statistics and top locations
 * 2. ACG Lines - All 40 ACG lines grouped by planet
 * 3. Zenith - Zenith bands with OOB status
 * 4. Scoring - Grid cells with score breakdowns
 * 5. Parans - Paran aspects filtered by type
 */
export const ResultsTabs = memo(function ResultsTabs({
  acgLines,
  zenithLines,
  parans,
  scoringGrid,
  globeState: _globeState, // Future: Sync with globe visualization
  compact = true,
  isACGLoading = false,
  isZenithLoading = false,
  isParansLoading = false,
  isScoringGridLoading = false,
}: ResultsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('overview')

  // Calculate summary statistics
  const acgCount = acgLines.length
  const paranCount = parans.length
  const gridCellCount = scoringGrid.length

  // Count OOB zenith lines
  const oobCount = zenithLines.filter((z) => Math.abs(z.declination) > APPROX_OBLIQUITY).length

  // Tab options with icons, counts, and loading states
  const tabOptions: Array<{
    value: TabValue
    label: string
    icon: React.ReactNode
    badge?: string
    isLoading?: boolean
  }> = [
    {
      value: 'overview',
      label: 'Overview',
      icon: <Target className="w-4 h-4" />,
      isLoading: isScoringGridLoading,
    },
    {
      value: 'acg',
      label: 'ACG Lines',
      icon: <Globe className="w-4 h-4" />,
      badge: `${acgCount}`,
      isLoading: isACGLoading,
    },
    {
      value: 'zenith',
      label: 'Zenith',
      icon: <MapPin className="w-4 h-4" />,
      badge: oobCount > 0 ? `${oobCount} OOB` : undefined,
      isLoading: isZenithLoading,
    },
    {
      value: 'scoring',
      label: 'Scoring',
      icon: <BarChart3 className="w-4 h-4" />,
      badge: `${gridCellCount}`,
      isLoading: isScoringGridLoading,
    },
    {
      value: 'parans',
      label: 'Parans',
      icon: <Sparkles className="w-4 h-4" />,
      badge: `${paranCount}`,
      isLoading: isParansLoading,
    },
  ]

  return (
    <div className="w-full space-y-3">
      {/* Dropdown Selector */}
      <Select
        value={activeTab}
        onValueChange={(v: string) => {
          if (isValidTabValue(v)) setActiveTab(v)
        }}
      >
        <SelectTrigger className="w-full bg-slate-800/50 border-slate-700/50 text-white">
          <SelectValue placeholder="Select view" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {tabOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-slate-200 focus:bg-slate-700 focus:text-white"
            >
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
                {option.isLoading && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
                {option.badge && !option.isLoading && (
                  <span className="ml-auto px-1.5 py-0.5 text-xs bg-slate-700/50 rounded">
                    {option.badge}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Content Area */}
      <div
        className={
          compact
            ? 'p-2 rounded-md bg-slate-800/20 border border-slate-700/30'
            : 'p-4 rounded-xl bg-slate-800/30 border border-slate-700/50'
        }
      >
        {activeTab === 'overview' && (
          <OverviewTab scoringGrid={scoringGrid} topN={10} compact={compact} />
        )}
        {activeTab === 'acg' && <ACGLinesTab acgLines={acgLines} compact={compact} />}
        {activeTab === 'zenith' && (
          <ZenithTab zenithLines={zenithLines} initialOrb={1.0} compact={compact} />
        )}
        {activeTab === 'scoring' && (
          <ScoringTab scoringGrid={scoringGrid} displayLimit={50} compact={compact} />
        )}
        {activeTab === 'parans' && (
          <ParansTab parans={parans} displayLimit={100} compact={compact} />
        )}
      </div>
    </div>
  )
})

export default ResultsTabs
