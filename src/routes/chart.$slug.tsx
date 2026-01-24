import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Calendar, Loader2, MapPin } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Declinations } from '@/components/calculator/DeclinationTable'
import { DeclinationTable } from '@/components/calculator/DeclinationTable'
import { ResultsPanel } from '@/components/calculator/ResultsPanel'
import { GlobeView } from '@/components/globe'

export const Route = createFileRoute('/chart/$slug')({
  component: SharedChartPage,
})

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

function SharedChartPage() {
  const { slug } = Route.useParams()
  const chart = useQuery(api.charts.queries.getByShareSlug, { slug })

  // Loading state
  if (chart === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050714] via-[#0a0f1f] to-[#0f172a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
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
            This chart may have been deleted or the link is invalid.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  // Find dominant planet for accent color
  const dominantPlanet = Object.entries(chart.weights).reduce((a, b) => (a[1] > b[1] ? a : b))[0]

  // Create mock latitude data for visualization (since we don't store full results)
  const mockLatitudes = Object.entries(chart.declinations)
    .map(([planet, dec]) => ({
      latitude: dec,
      score: (chart.weights as Record<string, number>)[planet] * 30 + 40,
      dominantPlanet: planet,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  const mockBands = Object.entries(chart.declinations)
    .filter(([planet]) => (chart.weights as Record<string, number>)[planet] > 0.8)
    .map(([planet, dec]) => ({
      min: dec - 3,
      max: dec + 3,
      dominantPlanet: planet,
    }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050714] via-[#0a0f1f] to-[#0f172a] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl" style={{ color: PLANET_COLORS[dominantPlanet] }}>
              {PLANET_SYMBOLS[dominantPlanet]}
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-white mb-4">
            {chart.name}
          </h1>
          <div className="flex items-center justify-center gap-6 text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {chart.birthDate} at {chart.birthTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>
                {chart.birthCity}, {chart.birthCountry}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="space-y-8">
          {/* Declinations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <DeclinationTable declinations={chart.declinations as Declinations} />
          </motion.div>

          {/* Globe */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-4"
          >
            <h3 className="font-display text-lg font-semibold text-white mb-4">
              Global Visualization
            </h3>
            <GlobeView
              optimalLatitudes={mockLatitudes}
              latitudeBands={mockBands}
              birthLocation={{
                latitude: chart.birthLatitude,
                longitude: chart.birthLongitude,
                city: chart.birthCity,
              }}
            />
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ResultsPanel optimalLatitudes={mockLatitudes} latitudeBands={mockBands} />
          </motion.div>

          {/* Weights used */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-6"
          >
            <h3 className="font-display text-lg font-semibold text-white mb-4">Planet Weights</h3>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(chart.weights).map(([planet, weight]) => (
                <div key={planet} className="text-center">
                  <span className="text-2xl block mb-1" style={{ color: PLANET_COLORS[planet] }}>
                    {PLANET_SYMBOLS[planet]}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{planet}</span>
                  <div className="text-sm font-medium text-white">{weight.toFixed(1)}x</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center py-8"
          >
            <p className="text-slate-400 mb-4">Want to calculate your own optimal locations?</p>
            <Link
              to="/calculator"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all"
            >
              Create Your Chart
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
