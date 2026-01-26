import { motion } from 'framer-motion'
import * as Slider from '@radix-ui/react-slider'
import { PLANETS } from '@/lib/planet-constants'

export interface PlanetWeights {
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

const DEFAULT_WEIGHTS: PlanetWeights = {
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
}

const PRESETS = [
  {
    name: 'Balanced',
    icon: '⚖️',
    description: 'Equal weight to all planets',
    weights: { ...DEFAULT_WEIGHTS },
  },
  {
    name: 'Relationships',
    icon: '❤️',
    description: 'Love and connection focus',
    weights: { ...DEFAULT_WEIGHTS, venus: 3, moon: 2.5, mars: 1.5 },
  },
  {
    name: 'Career',
    icon: '💼',
    description: 'Professional success',
    weights: { ...DEFAULT_WEIGHTS, saturn: 3, sun: 2.5, jupiter: 2 },
  },
  {
    name: 'Wealth',
    icon: '💰',
    description: 'Financial abundance',
    weights: { ...DEFAULT_WEIGHTS, jupiter: 3, venus: 2.5, mercury: 2 },
  },
  {
    name: 'Creativity',
    icon: '🎨',
    description: 'Artistic expression',
    weights: { ...DEFAULT_WEIGHTS, neptune: 3, venus: 2.5, moon: 2 },
  },
  {
    name: 'Spiritual',
    icon: '🧘',
    description: 'Inner growth',
    weights: { ...DEFAULT_WEIGHTS, neptune: 3, jupiter: 2.5, moon: 2 },
  },
]

interface PlanetWeightsProps {
  weights: PlanetWeights
  onChange: (weights: PlanetWeights) => void
}

export function PlanetWeightsEditor({ weights, onChange }: PlanetWeightsProps) {
  const handlePreset = (presetWeights: PlanetWeights) => {
    onChange(presetWeights)
  }

  const handleSliderChange = (planet: keyof PlanetWeights, value: Array<number>) => {
    onChange({ ...weights, [planet]: value[0] })
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Presets */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-4">Quick Presets</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePreset(preset.weights)}
              className="group p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-amber-500/30 hover:bg-slate-800/50 transition-all text-left"
            >
              <div className="text-2xl mb-2">{preset.icon}</div>
              <div className="font-medium text-white group-hover:text-amber-400 transition-colors">
                {preset.name}
              </div>
              <div className="text-xs text-slate-500">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Individual sliders */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-4">Fine-tune Weights</h3>
        <div className="space-y-4">
          {PLANETS.map((planet) => (
            <div
              key={planet.key}
              className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/20"
            >
              {/* Planet symbol and name */}
              <div className="w-24 flex items-center gap-2">
                <span className="text-xl" style={{ color: planet.color }}>
                  {planet.symbol}
                </span>
                <span className="text-sm text-slate-300">{planet.name}</span>
              </div>

              {/* Slider */}
              <div className="flex-1">
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5"
                  value={[weights[planet.key]]}
                  onValueChange={(v) => handleSliderChange(planet.key, v)}
                  max={3}
                  min={0}
                  step={0.5}
                >
                  <Slider.Track className="bg-slate-700 relative grow rounded-full h-2">
                    <Slider.Range
                      className="absolute rounded-full h-full"
                      style={{
                        background: `linear-gradient(to right, ${planet.color}40, ${planet.color})`,
                      }}
                    />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-5 h-5 bg-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 hover:scale-110 transition-transform"
                    style={{
                      boxShadow: `0 0 10px ${planet.color}80`,
                    }}
                  />
                </Slider.Root>
              </div>

              {/* Value display */}
              <div className="w-12 text-right">
                <span className="text-sm font-medium" style={{ color: planet.color }}>
                  {weights[planet.key].toFixed(1)}x
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weight explanation */}
      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
        <p className="text-sm text-slate-400">
          <strong className="text-slate-300">How weights work:</strong> Higher weights (up to 3x)
          increase that planet's influence when scoring locations. A weight of 0 ignores that planet
          entirely.
        </p>
      </div>
    </motion.div>
  )
}

export { DEFAULT_WEIGHTS }
