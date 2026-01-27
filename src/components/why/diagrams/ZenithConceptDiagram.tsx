import { motion } from 'framer-motion'
import { useId } from 'react'

/** Latitude (in degrees) at which the zenith band is drawn */
const ZENITH_LATITUDE = 23
/** Y position for the zenith latitude line: y = 200 - lat * 1.8 */
const ZENITH_BAND_Y = 200 - ZENITH_LATITUDE * 1.8

interface ZenithConceptDiagramProps {
  className?: string
}

export function ZenithConceptDiagram({ className = '' }: ZenithConceptDiagramProps) {
  const id = useId()
  const zenithBandId = `zenithBand${id}`
  const earthGradientId = `earthGradient${id}`

  return (
    <svg
      viewBox="0 0 400 350"
      className={`w-full max-w-md ${className}`}
      role="img"
      aria-label="Diagram showing a zenith band on Earth where a planet passes directly overhead"
    >
      <title>Zenith Band Concept</title>
      <desc>
        A 3D perspective of Earth showing a horizontal band of latitude where a specific planet
        passes directly overhead (at zenith). An observer figure looks straight up at the planet.
      </desc>

      <defs>
        <linearGradient id={zenithBandId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={earthGradientId} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>

      {/* Earth */}
      <motion.ellipse
        cx="200"
        cy="200"
        rx="150"
        ry="130"
        fill={`url(#${earthGradientId})`}
        stroke="#3b82f6"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8 }}
      />

      {/* Latitude lines */}
      {[-60, -30, 0, 30, 60].map((lat, i) => {
        const y = 200 - lat * 1.8
        const rx = Math.cos((Math.abs(lat) * Math.PI) / 180) * 150
        return (
          <motion.ellipse
            key={lat}
            cx="200"
            cy={y}
            rx={rx}
            ry={rx * 0.3}
            fill="none"
            stroke={lat === 0 ? '#64748b' : '#475569'}
            strokeWidth={lat === 0 ? 1.5 : 0.5}
            strokeDasharray="4 4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          />
        )
      })}

      {/* Zenith band (highlighted latitude zone) */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
        {/* Band highlight */}
        <ellipse
          cx="200"
          cy={ZENITH_BAND_Y}
          rx={Math.cos((ZENITH_LATITUDE * Math.PI) / 180) * 150}
          ry={Math.cos((ZENITH_LATITUDE * Math.PI) / 180) * 150 * 0.3}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="3"
        />

        {/* Band width visualization */}
        <rect
          x="60"
          y={ZENITH_BAND_Y - 15}
          width="280"
          height="30"
          fill={`url(#${zenithBandId})`}
          opacity="0.5"
        />
      </motion.g>

      {/* Observer on Earth */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
        {/* Observer body (stick figure) */}
        <circle cx="280" cy={ZENITH_BAND_Y - 5} r="5" fill="#22c55e" />
        <line
          x1="280"
          y1={ZENITH_BAND_Y}
          x2="280"
          y2={ZENITH_BAND_Y + 15}
          stroke="#22c55e"
          strokeWidth="2"
        />
        {/* Arms pointing up */}
        <line
          x1="275"
          y1={ZENITH_BAND_Y + 5}
          x2="270"
          y2={ZENITH_BAND_Y - 5}
          stroke="#22c55e"
          strokeWidth="2"
        />
        <line
          x1="285"
          y1={ZENITH_BAND_Y + 5}
          x2="290"
          y2={ZENITH_BAND_Y - 5}
          stroke="#22c55e"
          strokeWidth="2"
        />
      </motion.g>

      {/* Planet directly overhead */}
      <motion.g
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <circle cx="280" cy="40" r="12" fill="#fbbf24" />
        <text x="280" y="45" textAnchor="middle" fill="#1e1b4b" fontSize="14" fontWeight="bold">
          ☉
        </text>

        {/* Line from observer to planet */}
        <line
          x1="280"
          y1={ZENITH_BAND_Y - 10}
          x2="280"
          y2="55"
          stroke="#fbbf24"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.6"
        />

        {/* "Zenith" label */}
        <text x="310" y="45" fill="#fbbf24" fontSize="11" fontWeight="500">
          Zenith
        </text>
        <text x="310" y="58" fill="#94a3b8" fontSize="10">
          (directly overhead)
        </text>
      </motion.g>

      {/* Labels */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
        {/* Zenith band label */}
        <text x="50" y={ZENITH_BAND_Y + 5} fill="#fbbf24" fontSize="11" fontWeight="500">
          {ZENITH_LATITUDE}°N Zenith Band
        </text>

        {/* Equator label */}
        <text x="50" y="205" fill="#64748b" fontSize="10">
          Equator 0°
        </text>
      </motion.g>

      {/* Explanation */}
      <motion.g
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <text x="200" y="330" textAnchor="middle" fill="#94a3b8" fontSize="12">
          At this latitude, the Sun passes directly overhead
        </text>
        <text x="200" y="345" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="500">
          Maximum planetary influence
        </text>
      </motion.g>
    </svg>
  )
}
