import { motion } from 'framer-motion'
import { useState } from 'react'
import { PLANET_COLORS, PLANET_SYMBOLS } from '@/lib/planet-constants'

interface WeightingDiagramProps {
  className?: string
}

interface Preset {
  name: string
  description: string
  weights: Record<string, number>
}

const PRESETS: Array<Preset> = [
  {
    name: 'Balanced',
    description: 'Equal weight to all planets',
    weights: {
      sun: 1,
      moon: 1,
      mercury: 1,
      venus: 1,
      mars: 1,
      jupiter: 1,
      saturn: 1,
      uranus: 1,
      neptune: 1,
      pluto: 1,
    },
  },
  {
    name: 'Relationships',
    description: 'Focus on love and connection',
    weights: {
      sun: 0.6,
      moon: 1,
      mercury: 0.5,
      venus: 1,
      mars: 0.8,
      jupiter: 0.7,
      saturn: 0.3,
      uranus: 0.2,
      neptune: 0.6,
      pluto: 0.4,
    },
  },
  {
    name: 'Career',
    description: 'Focus on professional success',
    weights: {
      sun: 1,
      moon: 0.4,
      mercury: 0.8,
      venus: 0.3,
      mars: 0.9,
      jupiter: 1,
      saturn: 1,
      uranus: 0.5,
      neptune: 0.2,
      pluto: 0.7,
    },
  },
  {
    name: 'Creativity',
    description: 'Focus on artistic expression',
    weights: {
      sun: 0.8,
      moon: 0.9,
      mercury: 0.7,
      venus: 1,
      mars: 0.5,
      jupiter: 0.6,
      saturn: 0.2,
      uranus: 0.9,
      neptune: 1,
      pluto: 0.6,
    },
  },
]

const PLANETS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]

export default function WeightingDiagram({ className = '' }: WeightingDiagramProps) {
  const [activePreset, setActivePreset] = useState(0)
  const currentWeights = PRESETS[activePreset].weights

  const maxBarHeight = 80

  return (
    <div className={`${className}`}>
      {/* Preset selector */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {PRESETS.map((preset, index) => (
          <button
            key={preset.name}
            onClick={() => setActivePreset(index)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activePreset === index
                ? 'bg-celestial-gold text-slate-900'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-center text-slate-400 text-sm mb-6">{PRESETS[activePreset].description}</p>

      {/* Bar chart */}
      <svg
        viewBox="0 0 400 150"
        className="w-full max-w-lg mx-auto"
        role="img"
        aria-label={`Bar chart showing planet weights for ${PRESETS[activePreset].name} preset`}
      >
        <title>Planet Weighting: {PRESETS[activePreset].name}</title>
        <desc>
          A bar chart showing the relative importance of each planet for the selected life focus.
          Taller bars indicate higher weight/priority.
        </desc>

        {/* Axis */}
        <line x1="40" y1="120" x2="380" y2="120" stroke="#334155" strokeWidth="1" />

        {/* Bars */}
        {PLANETS.map((planet, index) => {
          const x = 50 + index * 34
          const weight = currentWeights[planet]
          const barHeight = weight * maxBarHeight
          const color = PLANET_COLORS[planet]

          return (
            <g key={planet}>
              {/* Bar */}
              <motion.rect
                x={x}
                y={120 - barHeight}
                width="24"
                height={barHeight}
                fill={color}
                rx="2"
                initial={{ height: 0, y: 120 }}
                animate={{ height: barHeight, y: 120 - barHeight }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              />

              {/* Planet symbol */}
              <text x={x + 12} y="135" textAnchor="middle" fill={color} fontSize="14">
                {PLANET_SYMBOLS[planet]}
              </text>

              {/* Weight value */}
              <motion.text
                x={x + 12}
                y={115 - barHeight}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
              >
                {weight.toFixed(1)}
              </motion.text>
            </g>
          )
        })}

        {/* Y-axis labels */}
        <text x="30" y="45" textAnchor="end" fill="#64748b" fontSize="9">
          High
        </text>
        <text x="30" y="120" textAnchor="end" fill="#64748b" fontSize="9">
          Low
        </text>
      </svg>

      {/* Legend explanation */}
      <div className="mt-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <p className="text-sm text-slate-300 text-center">
          <span className="text-celestial-gold font-medium">Higher weights</span> = more influence
          on your location score
        </p>
      </div>
    </div>
  )
}
