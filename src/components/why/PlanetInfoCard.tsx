import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { PlanetId } from '@/lib/planet-constants'
import { PLANET_COLORS, PLANET_SYMBOLS } from '@/lib/planet-constants'

interface PlanetInfoCardProps {
  planetId: PlanetId
  name: string
  lifeAreas: Array<string>
  whenStrong: string
  whenChallenging: string
  detailedInterpretation?: string
}

export function PlanetInfoCard({
  planetId,
  name,
  lifeAreas,
  whenStrong,
  whenChallenging,
  detailedInterpretation,
}: PlanetInfoCardProps) {
  const [expanded, setExpanded] = useState(false)
  const color = PLANET_COLORS[planetId] ?? '#6b7280'
  const symbol = PLANET_SYMBOLS[planetId] ?? '?'

  return (
    <motion.div
      className="relative p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ borderColor: color }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {symbol}
        </div>
        <div>
          <h3 className="font-display text-2xl font-semibold text-white">{name}</h3>
          <p className="text-sm text-slate-400">{symbol} Glyph</p>
        </div>
      </div>

      {/* Life Areas */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">
          Life Areas
        </h4>
        <div className="flex flex-wrap gap-2">
          {lifeAreas.map((area) => (
            <span
              key={area}
              className="px-3 py-1 rounded-full text-sm"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* When Strong / Challenging */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <h4 className="text-sm font-medium text-emerald-400 mb-2">When Strong</h4>
          <p className="text-sm text-slate-300">{whenStrong}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <h4 className="text-sm font-medium text-amber-400 mb-2">When Challenging</h4>
          <p className="text-sm text-slate-300">{whenChallenging}</p>
        </div>
      </div>

      {/* Expandable detailed interpretation */}
      {detailedInterpretation && (
        <>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-slate-700/50">
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">
                    Detailed Interpretation
                  </h4>
                  <p className="text-slate-300 leading-relaxed">{detailedInterpretation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm text-celestial-gold hover:text-celestial-amber transition-colors"
            >
              {expanded ? 'Show less' : 'Read more'}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>

            <Link
              to="/calculator"
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
            >
              See on globe
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </>
      )}
    </motion.div>
  )
}
