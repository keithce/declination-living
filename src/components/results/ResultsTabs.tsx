/**
 * ResultsTabs - Phase 2 Enhanced Results Interface
 *
 * Comprehensive tabbed interface for displaying ACG, zenith, scoring, and paran results
 * with globe visualization integration.
 */

import { memo } from 'react'
import { BarChart3, Globe, MapPin, Sparkles, Target } from 'lucide-react'
import { OverviewTab } from './tabs/OverviewTab'
import { ACGLinesTab } from './tabs/ACGLinesTab'
import { ZenithTab } from './tabs/ZenithTab'
import { ScoringTab } from './tabs/ScoringTab'
import { ParansTab } from './tabs/ParansTab'
import { useResultsState } from './hooks/useResultsState'
import type { ACGLine, ParanPoint, ZenithLine } from '@/../convex/calculations/core/types'
import type { GridCell } from '@/../convex/calculations/geospatial/grid'
import type { GlobeState } from '../globe/hooks/useGlobeState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * ResultsTabs - Main results interface with 5 tabs
 *
 * Tabs:
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
}: ResultsTabsProps) {
  // Initialize results state for synchronization
  const resultsState = useResultsState()

  // Calculate summary statistics
  const acgCount = acgLines.length
  const paranCount = parans.length
  const gridCellCount = scoringGrid.length

  // Count OOB zenith lines
  const oobCount = zenithLines.filter(
    (z) => Math.abs(z.declination) > 23.44, // Approximate obliquity
  ).length

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full grid grid-cols-5 bg-slate-800/50">
        <TabsTrigger value="overview" className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="acg" className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ACG Lines</span>
          <span className="text-xs text-slate-400 hidden md:inline">({acgCount})</span>
        </TabsTrigger>
        <TabsTrigger value="zenith" className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Zenith</span>
          {oobCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
              {oobCount} OOB
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="scoring" className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Scoring</span>
          <span className="text-xs text-slate-400 hidden md:inline">({gridCellCount})</span>
        </TabsTrigger>
        <TabsTrigger value="parans" className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Parans</span>
          <span className="text-xs text-slate-400 hidden md:inline">({paranCount})</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
        <TabsContent value="overview" className="m-0">
          <OverviewTab scoringGrid={scoringGrid} topN={10} />
        </TabsContent>

        <TabsContent value="acg" className="m-0">
          <ACGLinesTab acgLines={acgLines} resultsState={resultsState} />
        </TabsContent>

        <TabsContent value="zenith" className="m-0">
          <ZenithTab zenithLines={zenithLines} resultsState={resultsState} initialOrb={1.0} />
        </TabsContent>

        <TabsContent value="scoring" className="m-0">
          <ScoringTab scoringGrid={scoringGrid} resultsState={resultsState} displayLimit={50} />
        </TabsContent>

        <TabsContent value="parans" className="m-0">
          <ParansTab parans={parans} resultsState={resultsState} displayLimit={100} />
        </TabsContent>
      </div>
    </Tabs>
  )
})

export default ResultsTabs
