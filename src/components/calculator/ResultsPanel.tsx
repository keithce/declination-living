import { memo } from 'react'
import { motion } from 'framer-motion'
import { Compass, TrendingUp } from 'lucide-react'
import { PLANET_COLORS, PLANET_SYMBOLS } from '@/lib/planet-constants'

interface LatitudeScore {
  latitude: number
  score: number
  dominantPlanet: string
}

interface LatitudeBand {
  min: number
  max: number
  dominantPlanet: string
}

interface ResultsPanelProps {
  optimalLatitudes: Array<LatitudeScore>
  latitudeBands: Array<LatitudeBand>
}

export const ResultsPanel = memo(function ResultsPanel({
  optimalLatitudes,
  latitudeBands,
}: ResultsPanelProps) {
  const formatLatitude = (lat: number): string => {
    const direction = lat >= 0 ? 'N' : 'S'
    return `${Math.abs(lat).toFixed(1)}° ${direction}`
  }

  return (
    <div className="space-y-6">
      {/* Optimal Latitudes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden"
      >
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Top Latitudes</h3>
            <p className="text-sm text-slate-400">Ranked by planetary alignment strength</p>
          </div>
        </div>

        <div className="divide-y divide-slate-700/30">
          {optimalLatitudes.slice(0, 10).map((lat, index) => (
            <motion.div
              key={lat.latitude}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors"
            >
              {/* Rank */}
              <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm font-bold text-slate-400">
                {index + 1}
              </div>

              {/* Latitude */}
              <div className="flex-1">
                <div className="font-mono text-white font-semibold">
                  {formatLatitude(lat.latitude)}
                </div>
                <div className="text-xs text-slate-500">
                  Dominated by{' '}
                  <span
                    style={{ color: PLANET_COLORS[lat.dominantPlanet] }}
                    className="font-medium"
                  >
                    {PLANET_SYMBOLS[lat.dominantPlanet]}{' '}
                    {lat.dominantPlanet.charAt(0).toUpperCase() + lat.dominantPlanet.slice(1)}
                  </span>
                </div>
              </div>

              {/* Score bar */}
              <div className="w-32">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Score</span>
                  <span
                    className="font-semibold"
                    style={{ color: PLANET_COLORS[lat.dominantPlanet] }}
                  >
                    {lat.score.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${lat.score}%` }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(to right, ${PLANET_COLORS[lat.dominantPlanet]}80, ${PLANET_COLORS[lat.dominantPlanet]})`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Optimal Bands */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden"
      >
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
          <Compass className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Optimal Latitude Bands
            </h3>
            <p className="text-sm text-slate-400">Geographic zones with strong alignments</p>
          </div>
        </div>

        <div className="p-4 flex flex-wrap gap-2">
          {latitudeBands.map((band, index) => (
            <motion.div
              key={`${band.min}-${band.max}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{
                borderColor: `${PLANET_COLORS[band.dominantPlanet]}40`,
                backgroundColor: `${PLANET_COLORS[band.dominantPlanet]}10`,
              }}
            >
              <span style={{ color: PLANET_COLORS[band.dominantPlanet] }}>
                {PLANET_SYMBOLS[band.dominantPlanet]}
              </span>
              <span className="text-sm text-slate-300">
                {formatLatitude(band.min)} to {formatLatitude(band.max)}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
})
