# Phase 6: UI Enhancement

**Duration**: Weeks 10-12
**Priority**: High
**Dependencies**: Phases 1-5 (All backend calculations)

## Objectives

1. Build comprehensive results dashboard
2. Create interactive globe with toggle-able layers
3. Implement heatmap visualization
4. Design city detail cards with explanations

## Background

The current UI shows a basic 3D globe with minimal information. The PDF specifications require a rich visualization including:

- Declination table with OOB indicators
- Dignity scores with indicators (R, E, d, f, -)
- Interactive ACG/zenith/paran layers on globe
- Heatmap overlay showing optimal regions
- Ranked city list with details
- Paran summary and breakdown

## Tasks

### 6.1 Results Dashboard Layout

**File**: `src/routes/results.$chartId.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { GlobeContainer } from '@/components/globe/GlobeContainer'
import { DeclinationTable } from '@/components/results/DeclinationTable'
import { DignityScores } from '@/components/results/DignityScores'
import { ParanList } from '@/components/results/ParanList'
import { CityRankings } from '@/components/results/CityRankings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/results/$chartId')({
  component: ResultsPage,
})

function ResultsPage() {
  const { chartId } = Route.useParams()

  const chart = useQuery(api.queries.charts.getById, { id: chartId as any })
  const analysis = useQuery(api.queries.charts.getAnalysis, { chartId: chartId as any })

  if (!chart || !analysis) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{chart.name}'s Chart</h1>
          <p className="text-muted-foreground">
            {chart.birthDate} • {chart.birthTime} • {chart.birthCity}, {chart.birthCountry}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Globe */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>Location Map</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <GlobeContainer
                  zenithLines={analysis.zenithLines}
                  acgLines={analysis.acgLines}
                  parans={analysis.parans}
                  weights={chart.weights}
                />
              </CardContent>
            </Card>

            {/* City Rankings */}
            <CityRankings
              cities={analysis.rankedCities}
              onCityClick={(city) => {
                // Zoom globe to city
              }}
            />
          </div>

          {/* Right Column - Data Tables */}
          <div className="space-y-6">
            <Tabs defaultValue="declinations">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="declinations">Declinations</TabsTrigger>
                <TabsTrigger value="dignities">Dignities</TabsTrigger>
                <TabsTrigger value="parans">Parans</TabsTrigger>
              </TabsList>

              <TabsContent value="declinations" className="mt-4">
                <DeclinationTable
                  declinations={analysis.declinations}
                  obliquity={analysis.metadata.obliquity}
                />
              </TabsContent>

              <TabsContent value="dignities" className="mt-4">
                <DignityScores dignities={analysis.dignities} sect={analysis.metadata.sect} />
              </TabsContent>

              <TabsContent value="parans" className="mt-4">
                <ParanList parans={analysis.parans} summary={analysis.paranSummary} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 6.2 Declination Table Component

**File**: `src/components/results/DeclinationTable.tsx`

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PlanetId } from '@/convex/calculations/core/types'

interface DeclinationTableProps {
  declinations: Record<
    PlanetId,
    {
      value: number
      isOOB: boolean
      oobDegrees?: number
    }
  >
  obliquity: number
}

const PLANET_SYMBOLS: Record<PlanetId, string> = {
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

const PLANET_NAMES: Record<PlanetId, string> = {
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

function formatDeclination(dec: number): string {
  const sign = dec >= 0 ? 'N' : 'S'
  const abs = Math.abs(dec)
  const degrees = Math.floor(abs)
  const minutes = Math.round((abs - degrees) * 60)
  return `${degrees}°${minutes.toString().padStart(2, '0')}'${sign}`
}

export function DeclinationTable({ declinations, obliquity }: DeclinationTableProps) {
  const planets = Object.keys(declinations) as PlanetId[]

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Current obliquity: {obliquity.toFixed(2)}°
        <span className="ml-2">(OOB limit: ±{obliquity.toFixed(2)}°)</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Planet</TableHead>
            <TableHead>Declination</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {planets.map((planet) => {
            const data = declinations[planet]
            const direction = data.value >= 0 ? 'North' : 'South'

            return (
              <TableRow key={planet}>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xl">{PLANET_SYMBOLS[planet]}</span>
                    </TooltipTrigger>
                    <TooltipContent>{PLANET_NAMES[planet]}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="font-mono">{formatDeclination(data.value)}</TableCell>
                <TableCell>{direction}</TableCell>
                <TableCell className="text-right">
                  {data.isOOB ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="destructive">OOB</Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        Out of Bounds by {data.oobDegrees?.toFixed(2)}°
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Badge variant="secondary">Normal</Badge>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
```

### 6.3 Dignity Scores Component

**File**: `src/components/results/DignityScores.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import type { PlanetId, DignityScore } from '@/convex/calculations/core/types'

interface DignityScoresProps {
  dignities: Record<PlanetId, DignityScore>
  sect: 'day' | 'night'
}

const PLANET_SYMBOLS: Record<PlanetId, string> = {
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

const INDICATOR_LABELS: Record<string, string> = {
  R: 'Ruler (Domicile)',
  E: 'Exalted',
  d: 'Detriment',
  f: 'Fall',
  '-': 'Peregrine',
}

const INDICATOR_COLORS: Record<string, string> = {
  R: 'bg-green-500',
  E: 'bg-blue-500',
  d: 'bg-orange-500',
  f: 'bg-red-500',
  '-': 'bg-gray-400',
}

function getIndicator(score: DignityScore): string {
  if (score.domicile > 0) return 'R'
  if (score.exaltation > 0) return 'E'
  if (score.detriment < 0) return 'd'
  if (score.fall < 0) return 'f'
  return '-'
}

function normalizeScore(total: number): number {
  // Score ranges from -14 (all debilities) to +15 (all dignities)
  // Normalize to 0-100 for progress bar
  return Math.max(0, Math.min(100, ((total + 14) / 29) * 100))
}

export function DignityScores({ dignities, sect }: DignityScoresProps) {
  const planets = Object.keys(dignities) as PlanetId[]

  // Sort by total score descending
  const sorted = [...planets].sort((a, b) => dignities[b].total - dignities[a].total)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {sect === 'day' ? '☀️ Day Chart' : '🌙 Night Chart'}
        </span>
        <div className="flex gap-2 text-xs">
          {Object.entries(INDICATOR_LABELS).map(([key, label]) => (
            <span key={key} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${INDICATOR_COLORS[key]}`} />
              <span className="text-muted-foreground">
                {key}: {label}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((planet) => {
          const dignity = dignities[planet]
          const indicator = getIndicator(dignity)
          const normalized = normalizeScore(dignity.total)

          return (
            <div key={planet} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{PLANET_SYMBOLS[planet]}</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="outline"
                        className={`${INDICATOR_COLORS[indicator]} text-white border-0`}
                      >
                        {indicator}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        {dignity.breakdown.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span
                  className={`font-mono ${
                    dignity.total > 0
                      ? 'text-green-600'
                      : dignity.total < 0
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                  }`}
                >
                  {dignity.total > 0 ? '+' : ''}
                  {dignity.total}
                </span>
              </div>
              <Progress value={normalized} className="h-2" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### 6.4 Paran List Component

**File**: `src/components/results/ParanList.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ParanPoint } from '@/convex/calculations/core/types'

interface ParanListProps {
  parans: {
    points: ParanPoint[]
    summary: {
      riseRise: number
      riseCulminate: number
      riseSet: number
      culminateCulminate: number
      setSet: number
      total: number
    }
  }
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

const EVENT_LABELS: Record<string, string> = {
  rise: 'Rising',
  set: 'Setting',
  culminate: 'MC',
  anti_culminate: 'IC',
}

function formatLatitude(lat: number): string {
  const sign = lat >= 0 ? 'N' : 'S'
  return `${Math.abs(lat).toFixed(1)}°${sign}`
}

function getStrengthColor(strength: number): string {
  if (strength >= 0.9) return 'bg-green-500'
  if (strength >= 0.7) return 'bg-blue-500'
  if (strength >= 0.5) return 'bg-yellow-500'
  return 'bg-gray-400'
}

export function ParanList({ parans }: ParanListProps) {
  const { points, summary } = parans

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Card className="p-2 text-center">
          <div className="font-bold">{summary.total}</div>
          <div className="text-xs text-muted-foreground">Total Parans</div>
        </Card>
        <Card className="p-2 text-center">
          <div className="font-bold">{summary.riseCulminate}</div>
          <div className="text-xs text-muted-foreground">Rise/MC</div>
        </Card>
        <Card className="p-2 text-center">
          <div className="font-bold">{summary.riseSet}</div>
          <div className="text-xs text-muted-foreground">Rise/Set</div>
        </Card>
      </div>

      {/* Paran List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {points.slice(0, 30).map((paran, index) => {
            const strength = paran.strength ?? 0.5

            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{PLANET_SYMBOLS[paran.planet1]}</span>
                  <span className="text-xs text-muted-foreground">
                    {EVENT_LABELS[paran.event1]}
                  </span>
                  <span className="text-muted-foreground">↔</span>
                  <span className="text-lg">{PLANET_SYMBOLS[paran.planet2]}</span>
                  <span className="text-xs text-muted-foreground">
                    {EVENT_LABELS[paran.event2]}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline">{formatLatitude(paran.latitude)}</Badge>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getStrengthColor(strength)}`} />
                    <span className="text-xs text-muted-foreground">
                      {(strength * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
```

### 6.5 City Rankings Component

**File**: `src/components/results/CityRankings.tsx`

```tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin, Star, TrendingUp, Shield } from 'lucide-react'

interface RankedCity {
  city: {
    name: string
    country: string
    latitude: number
    longitude: number
    population: number
    tier: string
  }
  score: number
  breakdown: {
    zenith: number
    acg: number
    paran: number
  }
  safetyScore?: {
    overall: number
    warnings: string[]
  }
  highlights: string[]
}

interface CityRankingsProps {
  cities: RankedCity[]
  onCityClick?: (city: RankedCity) => void
}

type SortOption = 'score' | 'safety' | 'population'

export function CityRankings({ cities, onCityClick }: CityRankingsProps) {
  const [sortBy, setSortBy] = useState<SortOption>('score')
  const [tierFilter, setTierFilter] = useState<string>('all')

  const filteredCities = cities.filter((c) => tierFilter === 'all' || c.city.tier === tierFilter)

  const sortedCities = [...filteredCities].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.score - a.score
      case 'safety':
        return (b.safetyScore?.overall ?? 100) - (a.safetyScore?.overall ?? 100)
      case 'population':
        return b.city.population - a.city.population
      default:
        return 0
    }
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Top Locations
          </CardTitle>
          <div className="flex gap-2">
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="population">Population</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {sortedCities.slice(0, 20).map((item, index) => (
              <CityCard
                key={`${item.city.name}-${item.city.country}`}
                rank={index + 1}
                item={item}
                onClick={() => onCityClick?.(item)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function CityCard({
  rank,
  item,
  onClick,
}: {
  rank: number
  item: RankedCity
  onClick: () => void
}) {
  const { city, score, breakdown, safetyScore, highlights } = item

  return (
    <div
      className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {rank}
          </div>
          <div>
            <h4 className="font-semibold">{city.name}</h4>
            <p className="text-sm text-muted-foreground">{city.country}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-bold">{score.toFixed(1)}</span>
          </div>
          {safetyScore && (
            <div className="flex items-center gap-1 text-sm">
              <Shield
                className={`h-3 w-3 ${
                  safetyScore.overall >= 70
                    ? 'text-green-500'
                    : safetyScore.overall >= 50
                      ? 'text-yellow-500'
                      : 'text-red-500'
                }`}
              />
              <span className="text-muted-foreground">{safetyScore.overall}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="mt-2 flex gap-2">
        <Badge variant="secondary" className="text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          Z:{breakdown.zenith.toFixed(1)}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          A:{breakdown.acg.toFixed(1)}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          P:{breakdown.paran.toFixed(1)}
        </Badge>
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {highlights.slice(0, 3).map((highlight, i) => (
            <span key={i} className="text-xs text-muted-foreground">
              • {highlight}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 6.6 Enhanced Globe Container

**File**: `src/components/globe/GlobeContainer.tsx`

```tsx
import { useState, useRef, useEffect } from 'react'
import Globe from 'react-globe.gl'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Settings, Layers, Eye, EyeOff } from 'lucide-react'
import type {
  ZenithLine,
  ACGLine,
  ParanPoint,
  PlanetWeights,
} from '@/convex/calculations/core/types'

interface GlobeContainerProps {
  zenithLines: ZenithLine[]
  acgLines: ACGLine[]
  parans: { points: ParanPoint[] }
  weights: PlanetWeights
}

const PLANET_COLORS: Record<string, string> = {
  sun: '#FFD700',
  moon: '#C0C0C0',
  mercury: '#FFA500',
  venus: '#00FF00',
  mars: '#FF0000',
  jupiter: '#4169E1',
  saturn: '#8B4513',
  uranus: '#00CED1',
  neptune: '#4682B4',
  pluto: '#800080',
}

export function GlobeContainer({ zenithLines, acgLines, parans, weights }: GlobeContainerProps) {
  const globeRef = useRef<any>()

  // Layer visibility
  const [showZenith, setShowZenith] = useState(true)
  const [showACG, setShowACG] = useState(true)
  const [showParans, setShowParans] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [zenithOpacity, setZenithOpacity] = useState(0.3)

  // Convert zenith lines to arcs
  const zenithArcs = showZenith
    ? zenithLines.flatMap((zl) => {
        const lat = zl.declination
        const color = PLANET_COLORS[zl.planet]
        const weight = weights[zl.planet] || 1

        // Create arc spanning the globe at this latitude
        return [
          {
            startLat: lat,
            startLng: -180,
            endLat: lat,
            endLng: 180,
            color,
            opacity: zenithOpacity * weight,
            name: `${zl.planet} zenith`,
          },
        ]
      })
    : []

  // Convert ACG lines to paths
  const acgPaths = showACG
    ? acgLines.map((line) => ({
        coords: line.points.map((p) => [p.longitude, p.latitude]),
        color: PLANET_COLORS[line.planet],
        name: `${line.planet} ${line.lineType}`,
      }))
    : []

  // Convert parans to points
  const paranPoints = showParans
    ? parans.points.slice(0, 50).map((p) => ({
        lat: p.latitude,
        lng: 0, // Parans are latitude-specific
        size: (p.strength ?? 0.5) * 0.5,
        color: PLANET_COLORS[p.planet1],
        name: `${p.planet1} ${p.event1} / ${p.planet2} ${p.event2}`,
      }))
    : []

  // Auto-rotate
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true
      globeRef.current.controls().autoRotateSpeed = 0.5
    }
  }, [])

  return (
    <div className="relative">
      {/* Layer Controls */}
      <div className="absolute top-4 right-4 z-10">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Layers className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Layer Visibility</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Zenith Bands</span>
                  <Toggle pressed={showZenith} onPressedChange={setShowZenith} size="sm">
                    {showZenith ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Toggle>
                </div>
                {showZenith && (
                  <Slider
                    value={[zenithOpacity * 100]}
                    onValueChange={([v]) => setZenithOpacity(v / 100)}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">ACG Lines</span>
                <Toggle pressed={showACG} onPressedChange={setShowACG} size="sm">
                  {showACG ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Toggle>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Paran Points</span>
                <Toggle pressed={showParans} onPressedChange={setShowParans} size="sm">
                  {showParans ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Toggle>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Heatmap</span>
                <Toggle pressed={showHeatmap} onPressedChange={setShowHeatmap} size="sm">
                  {showHeatmap ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Toggle>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Globe */}
      <div className="h-[500px]">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          backgroundColor="rgba(0,0,0,0)"
          arcsData={zenithArcs}
          arcColor="color"
          arcAltitude={0}
          arcStroke={2}
          pathsData={acgPaths}
          pathColor="color"
          pathStroke={1}
          pointsData={paranPoints}
          pointColor="color"
          pointAltitude={0.01}
          pointRadius="size"
          width={500}
          height={500}
        />
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/80 rounded-lg p-2 text-xs">
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(PLANET_COLORS)
            .slice(0, 5)
            .map(([planet, color]) => (
              <div key={planet} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize">{planet.slice(0, 3)}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
```

## Testing

### Component Tests

**File**: `src/components/results/__tests__/DeclinationTable.test.tsx`

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeclinationTable } from '../DeclinationTable'

describe('DeclinationTable', () => {
  const mockDeclinations = {
    sun: { value: 23.44, isOOB: false },
    moon: { value: 25.5, isOOB: true, oobDegrees: 2.06 },
    mercury: { value: 15.0, isOOB: false },
    venus: { value: -10.0, isOOB: false },
    mars: { value: 5.0, isOOB: false },
    jupiter: { value: 0.0, isOOB: false },
    saturn: { value: -5.0, isOOB: false },
    uranus: { value: 10.0, isOOB: false },
    neptune: { value: -15.0, isOOB: false },
    pluto: { value: 22.0, isOOB: false },
  }

  it('renders all planets', () => {
    render(<DeclinationTable declinations={mockDeclinations} obliquity={23.44} />)

    expect(screen.getByText('☉')).toBeInTheDocument() // Sun
    expect(screen.getByText('☽')).toBeInTheDocument() // Moon
  })

  it('shows OOB badge for out-of-bounds planets', () => {
    render(<DeclinationTable declinations={mockDeclinations} obliquity={23.44} />)

    expect(screen.getByText('OOB')).toBeInTheDocument()
  })

  it('displays obliquity value', () => {
    render(<DeclinationTable declinations={mockDeclinations} obliquity={23.44} />)

    expect(screen.getByText(/23\.44°/)).toBeInTheDocument()
  })
})
```

## Completion Criteria

- [ ] Results dashboard renders all data sections
- [ ] Declination table shows all planets with OOB status
- [ ] Dignity scores display with correct indicators
- [ ] Paran list shows sorted parans with strength
- [ ] City rankings are filterable and sortable
- [ ] Globe renders all layers correctly
- [ ] Layer toggles work properly
- [ ] Legend displays planet colors
- [ ] Mobile responsive layout
- [ ] All component tests pass

## Performance Optimization

1. **Lazy loading**: Use React.lazy for Globe component
2. **Virtualization**: Use react-virtual for city list
3. **Memoization**: Memo heavy components (Globe, large lists)
4. **Data pagination**: Limit parans/cities shown initially
5. **WebGL optimization**: Reduce polygon count for ACG lines

## Accessibility

1. **Keyboard navigation**: All interactive elements focusable
2. **Screen reader support**: ARIA labels on icons
3. **Color contrast**: Ensure legend colors are distinguishable
4. **Alternative text**: Describe globe contents

## Next Steps

After completing Phase 6, the core application is feature-complete. Consider:

1. **Documentation**: User guides, API docs
2. **Testing**: E2E tests with Playwright
3. **Performance**: Lighthouse audit and optimization
4. **Analytics**: Track user engagement
5. **Deployment**: Production setup and monitoring
