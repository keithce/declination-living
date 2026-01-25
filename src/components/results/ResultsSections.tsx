/**
 * Results Sections - Tabbed interface for displaying calculation results.
 * PDF Reference: Part VI - UI Components
 *
 * Displays calculation results in separate, verifiable sections:
 * - Declinations with OOB status
 * - Essential Dignities
 * - Zenith Lines
 * - Parans
 * - Optimal Locations
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownUp, CircleDot, Crown, MapPin, Sparkles, Zap } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// =============================================================================
// Types
// =============================================================================

export interface EnhancedDeclination {
  value: number
  isOOB: boolean
  oobDegrees: number | null
}

export interface DignityScore {
  total: number
  indicator: 'R' | 'E' | 'd' | 'f' | '-'
}

export interface ZenithLine {
  planet: string
  latitude: number
  orbMin: number
  orbMax: number
}

export interface ParanPoint {
  planet1: string
  event1: string
  planet2: string
  event2: string
  latitude: number
}

export interface LatitudeResult {
  latitude: number
  score: number
  dominantPlanet: string
}

export interface ParanSummary {
  riseRise: number
  riseCulminate: number
  riseSet: number
  culminateCulminate: number
  setSet: number
  total: number
}

export interface EnhancedResults {
  declinations: Record<string, EnhancedDeclination>
  dignities: Record<string, DignityScore>
  zenithLines: Array<ZenithLine>
  parans: Array<ParanPoint>
  paranSummary: ParanSummary
  optimalLatitudes: Array<LatitudeResult>
  sect: 'day' | 'night'
  julianDay: number
  obliquity: number
}

interface ResultsSectionsProps {
  results: EnhancedResults
}

// =============================================================================
// Constants
// =============================================================================

const PLANET_COLORS: Record<string, string> = {
  sun: '#fbbf24',
  moon: '#e2e8f0',
  mercury: '#a78bfa',
  venus: '#f472b6',
  mars: '#ef4444',
  jupiter: '#f97316',
  saturn: '#78716c',
  uranus: '#22d3ee',
  neptune: '#818cf8',
  pluto: '#a3a3a3',
}

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
}

const PLANET_NAMES: Record<string, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
}

const DIGNITY_LABELS: Record<string, { label: string; color: string }> = {
  R: { label: 'Rulership', color: 'text-amber-400' },
  E: { label: 'Exaltation', color: 'text-green-400' },
  d: { label: 'Detriment', color: 'text-red-400' },
  f: { label: 'Fall', color: 'text-orange-400' },
  '-': { label: 'Neutral', color: 'text-slate-400' },
}

const EVENT_LABELS: Record<string, string> = {
  rise: 'Rising',
  set: 'Setting',
  culminate: 'Culminating',
  anti_culminate: 'Anti-Culminating',
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatLatitude(lat: number): string {
  const direction = lat >= 0 ? 'N' : 'S'
  return `${Math.abs(lat).toFixed(1)}° ${direction}`
}

function formatDeclination(dec: number): string {
  const direction = dec >= 0 ? 'N' : 'S'
  return `${Math.abs(dec).toFixed(2)}° ${direction}`
}

// =============================================================================
// Section Components
// =============================================================================

const DeclinationsSection = memo(function DeclinationsSection({
  declinations,
  obliquity,
}: {
  declinations: Record<string, EnhancedDeclination>
  obliquity: number
}) {
  const planets = Object.entries(declinations)

  const oobPlanets = planets.filter(([, d]) => d.isOOB)
  const normalPlanets = planets.filter(([, d]) => !d.isOOB)

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500">
        Obliquity: {obliquity.toFixed(4)}° (OOB threshold: ±{obliquity.toFixed(2)}°)
      </div>

      {oobPlanets.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Out of Bounds Planets</span>
          </div>
          <div className="grid gap-2">
            {oobPlanets.map(([planet, dec]) => (
              <div
                key={planet}
                className="flex items-center justify-between p-2 rounded bg-slate-800/50"
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: PLANET_COLORS[planet] }}>{PLANET_SYMBOLS[planet]}</span>
                  <span className="text-white">{PLANET_NAMES[planet]}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono">{formatDeclination(dec.value)}</div>
                  <div className="text-xs text-amber-400">
                    +{dec.oobDegrees?.toFixed(2)}° beyond limit
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-2">
        {normalPlanets.map(([planet, dec]) => (
          <div
            key={planet}
            className="flex items-center justify-between p-2 rounded bg-slate-800/30"
          >
            <div className="flex items-center gap-2">
              <span style={{ color: PLANET_COLORS[planet] }}>{PLANET_SYMBOLS[planet]}</span>
              <span className="text-slate-300">{PLANET_NAMES[planet]}</span>
            </div>
            <div className="text-white font-mono">{formatDeclination(dec.value)}</div>
          </div>
        ))}
      </div>
    </div>
  )
})

const DignitiesSection = memo(function DignitiesSection({
  dignities,
  sect,
}: {
  dignities: Record<string, DignityScore>
  sect: 'day' | 'night'
}) {
  const planets = Object.entries(dignities).sort((a, b) => b[1].total - a[1].total)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span
          className={`px-2 py-0.5 rounded ${sect === 'day' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600/20 text-slate-400'}`}
        >
          {sect === 'day' ? '☀️ Day Chart' : '🌙 Night Chart'}
        </span>
      </div>

      <div className="grid gap-2">
        {planets.map(([planet, dignity]) => {
          const { label, color } = DIGNITY_LABELS[dignity.indicator]
          return (
            <div
              key={planet}
              className="flex items-center justify-between p-3 rounded bg-slate-800/30"
            >
              <div className="flex items-center gap-3">
                <span style={{ color: PLANET_COLORS[planet] }} className="text-lg">
                  {PLANET_SYMBOLS[planet]}
                </span>
                <div>
                  <div className="text-white">{PLANET_NAMES[planet]}</div>
                  <div className={`text-xs ${color}`}>{label}</div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-lg font-bold ${dignity.total > 0 ? 'text-green-400' : dignity.total < 0 ? 'text-red-400' : 'text-slate-400'}`}
                >
                  {dignity.total > 0 ? '+' : ''}
                  {dignity.total}
                </div>
                <div className={`text-sm font-mono ${color}`}>{dignity.indicator}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

const ZenithSection = memo(function ZenithSection({
  zenithLines,
}: {
  zenithLines: Array<ZenithLine>
}) {
  // Sort by absolute latitude for visual grouping
  const sortedLines = [...zenithLines].sort((a, b) => Math.abs(b.latitude) - Math.abs(a.latitude))

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500">
        Zenith lines show where each planet passes directly overhead.
      </div>

      <div className="grid gap-2">
        {sortedLines.map((line) => (
          <div
            key={line.planet}
            className="flex items-center justify-between p-3 rounded bg-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <span style={{ color: PLANET_COLORS[line.planet] }} className="text-lg">
                {PLANET_SYMBOLS[line.planet]}
              </span>
              <span className="text-white">{PLANET_NAMES[line.planet]}</span>
            </div>
            <div className="text-right">
              <div className="text-white font-mono">{formatLatitude(line.latitude)}</div>
              <div className="text-xs text-slate-500">
                {formatLatitude(line.orbMin)} to {formatLatitude(line.orbMax)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

const ParansSection = memo(function ParansSection({
  parans,
  summary,
}: {
  parans: Array<ParanPoint>
  summary: ParanSummary
}) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded bg-slate-800/30">
          <div className="text-lg font-bold text-white">{summary.total}</div>
          <div className="text-xs text-slate-500">Total Parans</div>
        </div>
        <div className="p-2 rounded bg-slate-800/30">
          <div className="text-lg font-bold text-amber-400">
            {summary.riseRise + summary.setSet}
          </div>
          <div className="text-xs text-slate-500">Horizon Parans</div>
        </div>
        <div className="p-2 rounded bg-slate-800/30">
          <div className="text-lg font-bold text-blue-400">{summary.culminateCulminate}</div>
          <div className="text-xs text-slate-500">Meridian Parans</div>
        </div>
      </div>

      {/* Top Parans */}
      <div className="space-y-2">
        {parans.slice(0, 10).map((paran, index) => (
          <motion.div
            key={`${paran.planet1}-${paran.planet2}-${paran.latitude}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 rounded bg-slate-800/30"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span style={{ color: PLANET_COLORS[paran.planet1] }}>
                  {PLANET_SYMBOLS[paran.planet1]}
                </span>
                <span className="text-xs text-slate-500">{EVENT_LABELS[paran.event1]}</span>
                <span className="text-slate-500">×</span>
                <span style={{ color: PLANET_COLORS[paran.planet2] }}>
                  {PLANET_SYMBOLS[paran.planet2]}
                </span>
                <span className="text-xs text-slate-500">{EVENT_LABELS[paran.event2]}</span>
              </div>
              <div className="text-white font-mono text-sm">{formatLatitude(paran.latitude)}</div>
            </div>
            <div className="text-xs text-slate-400">
              {PLANET_NAMES[paran.planet1]} {EVENT_LABELS[paran.event1].toLowerCase()} as{' '}
              {PLANET_NAMES[paran.planet2]} is {EVENT_LABELS[paran.event2].toLowerCase()}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
})

const LocationsSection = memo(function LocationsSection({
  optimalLatitudes,
}: {
  optimalLatitudes: Array<LatitudeResult>
}) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500">
        Optimal latitudes ranked by weighted planetary alignment strength.
      </div>

      <div className="space-y-2">
        {optimalLatitudes.slice(0, 15).map((loc, index) => (
          <motion.div
            key={loc.latitude}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center gap-3 p-3 rounded bg-slate-800/30"
          >
            <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm font-bold text-slate-400">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="text-white font-mono">{formatLatitude(loc.latitude)}</div>
              <div className="text-xs text-slate-500">
                Dominated by{' '}
                <span style={{ color: PLANET_COLORS[loc.dominantPlanet] }} className="font-medium">
                  {PLANET_SYMBOLS[loc.dominantPlanet]} {PLANET_NAMES[loc.dominantPlanet]}
                </span>
              </div>
            </div>
            <div className="w-24">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Score</span>
                <span
                  className="font-semibold"
                  style={{ color: PLANET_COLORS[loc.dominantPlanet] }}
                >
                  {loc.score.toFixed(1)}
                </span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(loc.score, 100)}%` }}
                  transition={{ delay: 0.2 + index * 0.03, duration: 0.4 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${PLANET_COLORS[loc.dominantPlanet]}80, ${PLANET_COLORS[loc.dominantPlanet]})`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
})

// =============================================================================
// Main Component
// =============================================================================

export const ResultsSections = memo(function ResultsSections({ results }: ResultsSectionsProps) {
  const oobCount = Object.values(results.declinations).filter((d) => d.isOOB).length

  return (
    <Tabs defaultValue="declinations" className="w-full">
      <TabsList className="w-full grid grid-cols-5 bg-slate-800/50">
        <TabsTrigger value="declinations" className="flex items-center gap-1.5">
          <ArrowDownUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Declinations</span>
          {oobCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
              {oobCount} OOB
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="dignities" className="flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dignities</span>
        </TabsTrigger>
        <TabsTrigger value="zenith" className="flex items-center gap-1.5">
          <CircleDot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Zenith</span>
        </TabsTrigger>
        <TabsTrigger value="parans" className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Parans</span>
        </TabsTrigger>
        <TabsTrigger value="locations" className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Locations</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
        <TabsContent value="declinations">
          <DeclinationsSection declinations={results.declinations} obliquity={results.obliquity} />
        </TabsContent>

        <TabsContent value="dignities">
          <DignitiesSection dignities={results.dignities} sect={results.sect} />
        </TabsContent>

        <TabsContent value="zenith">
          <ZenithSection zenithLines={results.zenithLines} />
        </TabsContent>

        <TabsContent value="parans">
          <ParansSection parans={results.parans} summary={results.paranSummary} />
        </TabsContent>

        <TabsContent value="locations">
          <LocationsSection optimalLatitudes={results.optimalLatitudes} />
        </TabsContent>
      </div>
    </Tabs>
  )
})

export default ResultsSections
