import { memo } from 'react'
import { motion } from 'framer-motion'

export interface Declinations {
  sun: number
  moon: number
  mercury: number
  venus: number
  mars: number
  jupiter: number
  saturn: number
  uranus: number
  neptune: number
  pluto: number
}

const PLANETS = [
  { key: 'sun', name: 'Sun', symbol: '☉', color: '#fbbf24' },
  { key: 'moon', name: 'Moon', symbol: '☽', color: '#e2e8f0' },
  { key: 'mercury', name: 'Mercury', symbol: '☿', color: '#a78bfa' },
  { key: 'venus', name: 'Venus', symbol: '♀', color: '#f472b6' },
  { key: 'mars', name: 'Mars', symbol: '♂', color: '#ef4444' },
  { key: 'jupiter', name: 'Jupiter', symbol: '♃', color: '#f97316' },
  { key: 'saturn', name: 'Saturn', symbol: '♄', color: '#78716c' },
  { key: 'uranus', name: 'Uranus', symbol: '♅', color: '#22d3ee' },
  { key: 'neptune', name: 'Neptune', symbol: '♆', color: '#818cf8' },
  { key: 'pluto', name: 'Pluto', symbol: '♇', color: '#a3a3a3' },
] as const

interface DeclinationTableProps {
  declinations: Declinations
}

export const DeclinationTable = memo(function DeclinationTable({
  declinations,
}: DeclinationTableProps) {
  const formatDeclination = (value: number): string => {
    const direction = value >= 0 ? 'N' : 'S'
    const degrees = Math.abs(value)
    const deg = Math.floor(degrees)
    const min = Math.floor((degrees - deg) * 60)
    return `${deg}°${min.toString().padStart(2, '0')}' ${direction}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden"
    >
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="font-display text-lg font-semibold text-white">
          Your Planetary Declinations
        </h3>
        <p className="text-sm text-slate-400 mt-1">North/South celestial position at your birth</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5">
        {PLANETS.map((planet, index) => {
          const declination = declinations[planet.key as keyof Declinations]
          return (
            <motion.div
              key={planet.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 border-b border-r border-slate-700/30 last:border-r-0 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl" style={{ color: planet.color }}>
                  {planet.symbol}
                </span>
                <span className="text-sm text-slate-400">{planet.name}</span>
              </div>
              <div className="font-mono text-lg font-semibold" style={{ color: planet.color }}>
                {formatDeclination(declination)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{declination.toFixed(2)}°</div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
})
