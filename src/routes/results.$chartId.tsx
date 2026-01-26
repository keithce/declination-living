/**
 * Results Route - Full results view for saved charts.
 *
 * Displays comprehensive analysis including globe, city rankings,
 * declinations, dignities, and parans.
 */

import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { motion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Calendar, Globe, Loader2, MapPin, Sparkles } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import type { Declinations, EnhancedDeclination } from '@/components/calculator/DeclinationTable'
import type { ACGLine, ParanPoint, Sect, ZenithLine } from '@convex/calculations/core/types'
import type { RankedCity } from '@/components/results/CityRankings'
import type { PlanetId } from '@/lib/planet-constants'
import type { DignityScoreData } from '@/components/results/DignityScores'
import { DeclinationTable } from '@/components/calculator/DeclinationTable'
import { DignityScores } from '@/components/results/DignityScores'
import { CityRankings } from '@/components/results/CityRankings'
import { EnhancedGlobeCanvas } from '@/components/globe/EnhancedGlobeCanvas'
import { useGlobeState } from '@/components/globe/hooks/useGlobeState'
import { GlobeLayersPopover } from '@/components/results/GlobeLayersPopover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ParansTab } from '@/components/results/tabs/ParansTab'
import { PLANET_COLORS, PLANET_SYMBOLS } from '@/lib/planet-constants'

// =============================================================================
// Route Definition
// =============================================================================

export const Route = createFileRoute('/results/$chartId')({
  component: ResultsPage,
})

// =============================================================================
// Types
// =============================================================================

interface GlobeRef {
  focusLocation: (lat: number, lon: number, zoom?: number) => void
}

// =============================================================================
// Main Component
// =============================================================================

function ResultsPage() {
  const { chartId } = Route.useParams()
  const globeRef = useRef<GlobeRef>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Load chart data
  const chart = useQuery(api.charts.queries.getById, {
    id: chartId as Id<'charts'>,
  })

  // Load analysis cache
  const analysisCache = useQuery(api.cache.analysisCache.getByChart, {
    chartId: chartId as Id<'charts'>,
  })

  // Globe state
  const globeState = useGlobeState()

  // Handle city click - zoom globe to location
  const handleCityClick = useCallback((city: RankedCity) => {
    globeRef.current?.focusLocation(city.city.latitude, city.city.longitude, 3)
  }, [])

  // Loading state
  if (chart === undefined || analysisCache === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050714] via-[#0a0f1f] to-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          <p className="text-slate-400">Loading chart data...</p>
        </div>
      </div>
    )
  }

  // Not found state
  if (chart === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050714] via-[#0a0f1f] to-[#0f172a] py-20 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white mb-4">Chart Not Found</h1>
          <p className="text-slate-400 mb-8">
            This chart may have been deleted or you don't have access to view it.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Find dominant planet for accent color
  const dominantPlanet = Object.entries(chart.weights).reduce((a, b) => (a[1] > b[1] ? a : b))[0]

  // Extract data for components
  const declinations = chart.declinations as Declinations
  const enhancedDeclinations = analysisCache?.enhancedDeclinations as
    | Record<PlanetId, EnhancedDeclination>
    | undefined
  const obliquity = analysisCache?.obliquity
  const sect = (analysisCache?.sect ?? chart.sect ?? 'day') as Sect
  const dignities = (analysisCache?.dignities ?? chart.dignities) as
    | Record<PlanetId, DignityScoreData>
    | undefined
  const zenithLines = analysisCache?.zenithLines as Array<ZenithLine> | undefined
  const parans = analysisCache?.topParans as Array<ParanPoint> | undefined

  // Create mock ACG lines (would need to be computed/cached)
  const acgLines: Array<ACGLine> = []

  // Create mock ranked cities (would need city scoring data)
  const rankedCities: Array<RankedCity> = []

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050714] via-[#0a0f1f] to-[#0f172a]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <span className="text-2xl" style={{ color: PLANET_COLORS[dominantPlanet] }}>
                  {PLANET_SYMBOLS[dominantPlanet]}
                </span>
                <h1 className="font-display text-xl font-semibold text-white">{chart.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="hidden md:flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {chart.birthDate} at {chart.birthTime}
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>
                  {chart.birthCity}, {chart.birthCountry}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Globe + City Rankings */}
          <div className="space-y-6">
            {/* Globe Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-amber-400" />
                  <h2 className="font-display text-lg font-semibold text-white">Global View</h2>
                </div>
                <GlobeLayersPopover globeState={globeState} />
              </div>
              <div className="aspect-square md:aspect-video">
                <EnhancedGlobeCanvas
                  birthLocation={{
                    latitude: chart.birthLatitude,
                    longitude: chart.birthLongitude,
                  }}
                  declinations={declinations}
                  acgLines={acgLines}
                  parans={parans ?? []}
                  globeState={globeState}
                />
              </div>
            </motion.div>

            {/* City Rankings */}
            {rankedCities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-4"
              >
                <CityRankings cities={rankedCities} onCityClick={handleCityClick} />
              </motion.div>
            )}
          </div>

          {/* Right Column: Tabbed Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="border-b border-slate-700/50">
                <TabsList className="w-full justify-start bg-transparent border-none p-0">
                  <TabsTrigger
                    value="overview"
                    className="px-4 py-3 text-sm font-medium data-[state=active]:text-amber-400 data-[state=active]:border-b-2 data-[state=active]:border-amber-400 rounded-none"
                  >
                    Declinations
                  </TabsTrigger>
                  {dignities && (
                    <TabsTrigger
                      value="dignities"
                      className="px-4 py-3 text-sm font-medium data-[state=active]:text-amber-400 data-[state=active]:border-b-2 data-[state=active]:border-amber-400 rounded-none"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Dignities
                    </TabsTrigger>
                  )}
                  {parans && parans.length > 0 && (
                    <TabsTrigger
                      value="parans"
                      className="px-4 py-3 text-sm font-medium data-[state=active]:text-amber-400 data-[state=active]:border-b-2 data-[state=active]:border-amber-400 rounded-none"
                    >
                      Parans
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <TabsContent value="overview" className="mt-0">
                  <DeclinationTable
                    declinations={declinations}
                    obliquity={obliquity}
                    enhancedDeclinations={enhancedDeclinations}
                  />
                </TabsContent>

                {dignities && (
                  <TabsContent value="dignities" className="mt-0">
                    <DignityScores dignities={dignities} sect={sect} />
                  </TabsContent>
                )}

                {parans && parans.length > 0 && (
                  <TabsContent value="parans" className="mt-0">
                    <ParansTab parans={parans} />
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
