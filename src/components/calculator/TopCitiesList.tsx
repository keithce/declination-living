import { motion } from 'framer-motion'
import { MapPin, ExternalLink } from 'lucide-react'

interface City {
  id: string
  name: string
  country: string
  state?: string
  latitude: number
  longitude: number
  score: number
  dominantPlanet: string
}

interface TopCitiesListProps {
  cities: City[]
  onCityClick?: (city: City) => void
}

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

export function TopCitiesList({ cities, onCityClick }: TopCitiesListProps) {
  const formatLatitude = (lat: number): string => {
    const direction = lat >= 0 ? 'N' : 'S'
    return `${Math.abs(lat).toFixed(2)}° ${direction}`
  }

  if (cities.length === 0) {
    return (
      <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-8 text-center">
        <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">
          No cities loaded. Import city data to see recommendations.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden"
    >
      <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
        <MapPin className="w-5 h-5 text-amber-400" />
        <div>
          <h3 className="font-display text-lg font-semibold text-white">
            Top Cities
          </h3>
          <p className="text-sm text-slate-400">
            Cities with strongest planetary alignments
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-700/30">
        {cities.slice(0, 20).map((city, index) => (
          <motion.div
            key={city.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="group p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
            onClick={() => onCityClick?.(city)}
          >
            {/* Rank */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: `${PLANET_COLORS[city.dominantPlanet]}20`,
                color: PLANET_COLORS[city.dominantPlanet],
              }}
            >
              {index + 1}
            </div>

            {/* City info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white truncate">
                  {city.name}
                </span>
                <span
                  className="text-lg"
                  style={{ color: PLANET_COLORS[city.dominantPlanet] }}
                >
                  {PLANET_SYMBOLS[city.dominantPlanet]}
                </span>
              </div>
              <div className="text-sm text-slate-500 truncate">
                {city.state && `${city.state}, `}
                {city.country} • {formatLatitude(city.latitude)}
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <div
                className="font-semibold text-lg"
                style={{ color: PLANET_COLORS[city.dominantPlanet] }}
              >
                {city.score.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">alignment</div>
            </div>

            {/* External link */}
            <a
              href={`https://www.google.com/maps?q=${city.latitude},${city.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        ))}
      </div>

      {cities.length > 20 && (
        <div className="p-4 text-center border-t border-slate-700/30">
          <span className="text-sm text-slate-500">
            +{cities.length - 20} more cities
          </span>
        </div>
      )}
    </motion.div>
  )
}
