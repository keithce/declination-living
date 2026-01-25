import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  LayoutGrid,
  Loader2,
  MapPin,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { PLANET_COLORS, PLANET_SYMBOLS } from '@/lib/planet-constants'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

interface Chart {
  _id: Id<'charts'>
  name: string
  birthDate: string
  birthTime: string
  birthCity: string
  birthCountry: string
  declinations: Record<string, number>
  weights: Record<string, number>
  isPublic: boolean
  shareSlug?: string
  createdAt: number
  updatedAt: number
}

function ChartCard({
  chart,
  onDelete,
  onShare,
}: {
  chart: Chart
  onDelete: (id: Id<'charts'>) => void
  onShare: (id: Id<'charts'>) => void
}) {
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  // Find the dominant planet (highest weight)
  const dominantPlanet = Object.entries(chart.weights).reduce((a, b) => (a[1] > b[1] ? a : b))[0]

  const handleCopyLink = async () => {
    if (chart.shareSlug) {
      await navigator.clipboard.writeText(`${window.location.origin}/chart/${chart.shareSlug}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all"
    >
      {/* Color accent based on dominant planet */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: PLANET_COLORS[dominantPlanet] }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-white truncate">{chart.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{chart.birthDate}</span>
              <span className="text-slate-600">•</span>
              <span>{chart.birthTime}</span>
            </div>
          </div>
          <span className="text-2xl ml-2" style={{ color: PLANET_COLORS[dominantPlanet] }}>
            {PLANET_SYMBOLS[dominantPlanet]}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">
            {chart.birthCity}, {chart.birthCountry}
          </span>
        </div>

        {/* Declination preview - mini visualization */}
        <div className="flex gap-1 mb-4">
          {Object.entries(chart.declinations).map(([planet, dec]) => (
            <div
              key={planet}
              className="flex-1 h-8 rounded relative overflow-hidden"
              style={{ backgroundColor: `${PLANET_COLORS[planet]}20` }}
              title={`${planet}: ${dec.toFixed(1)}°`}
            >
              <div
                className="absolute bottom-0 left-0 right-0 transition-all"
                style={{
                  height: `${Math.abs(dec) * 3}%`,
                  backgroundColor: PLANET_COLORS[planet],
                  opacity: 0.6,
                }}
              />
            </div>
          ))}
        </div>

        {/* Meta */}
        <div className="text-xs text-slate-500 mb-4">
          Created {formatDate(chart.createdAt)}
          {chart.isPublic && (
            <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
              Public
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-700/30">
          <button
            onClick={() => navigate({ to: '/calculator' })}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View
          </button>

          {chart.shareSlug ? (
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          ) : (
            <button
              onClick={() => onShare(chart._id)}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onDelete(chart._id)}
            className="flex items-center justify-center px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
        <LayoutGrid className="w-10 h-10 text-slate-600" />
      </div>
      <h3 className="font-display text-xl font-semibold text-white mb-2">No charts yet</h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">
        Create your first declination chart to discover your optimal living locations based on
        planetary alignments.
      </p>
      <Link
        to="/calculator"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all"
      >
        <Plus className="w-5 h-5" />
        Create Your First Chart
      </Link>
    </motion.div>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const charts = useQuery(api.charts.queries.listMine, isAuthenticated ? {} : 'skip')
  const deleteChart = useMutation(api.charts.mutations.remove)
  const generateShareSlug = useMutation(api.charts.mutations.generateShareSlug)

  const [deletingId, setDeletingId] = useState<Id<'charts'> | null>(null)

  // Redirect to signin if not authenticated
  if (!isAuthLoading && !isAuthenticated) {
    navigate({ to: '/auth/signin' })
    return null
  }

  const handleDelete = async (id: Id<'charts'>) => {
    if (confirm('Are you sure you want to delete this chart?')) {
      setDeletingId(id)
      try {
        await deleteChart({ id })
      } finally {
        setDeletingId(null)
      }
    }
  }

  const handleShare = async (id: Id<'charts'>) => {
    try {
      const slug = await generateShareSlug({ id })
      const url = `${window.location.origin}/chart/${slug}`
      await navigator.clipboard.writeText(url)
      alert('Share link copied to clipboard!')
    } catch (error) {
      console.error('Failed to generate share link:', error)
    }
  }

  const isLoading = isAuthLoading || charts === undefined

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050714] via-[#0a0f1f] to-[#0f172a] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-white mb-2">
              Your Charts
            </h1>
            <p className="text-slate-400">Manage your saved declination calculations</p>
          </div>

          <Link
            to="/calculator"
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Chart</span>
          </Link>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : charts.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence mode="popLayout">
              {charts.map((chart) => (
                <ChartCard
                  key={chart._id}
                  chart={chart as Chart}
                  onDelete={handleDelete}
                  onShare={handleShare}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Deleting overlay */}
        <AnimatePresence>
          {deletingId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <div className="bg-slate-800 rounded-xl p-6 flex items-center gap-4">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                <span className="text-white">Deleting chart...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
