import { motion } from 'framer-motion'

interface DeclinationLatitudeDiagramProps {
  className?: string
}

export function DeclinationLatitudeDiagram({ className = '' }: DeclinationLatitudeDiagramProps) {
  return (
    <svg
      viewBox="0 0 600 300"
      className={`w-full max-w-2xl ${className}`}
      role="img"
      aria-label="Diagram showing how celestial declination corresponds to geographic latitude"
    >
      <title>Declination-Latitude Correspondence</title>
      <desc>
        Split view showing Earth with latitude lines on the left and the celestial sphere with
        declination lines on the right. Matching lines are highlighted to show the direct
        correspondence between a planet's declination and Earth's latitude.
      </desc>

      <defs>
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
        </marker>
      </defs>

      {/* Left side - Earth with latitude */}
      <g>
        {/* Earth circle */}
        <circle cx="120" cy="150" r="100" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" />

        {/* Latitude lines */}
        {[-60, -30, 0, 30, 60].map((lat, i) => {
          const y = 150 - lat * 1.5
          const width = Math.cos((Math.abs(lat) * Math.PI) / 180) * 100
          return (
            <motion.g
              key={lat}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <line
                x1={120 - width}
                y1={y}
                x2={120 + width}
                y2={y}
                stroke="#64748b"
                strokeWidth={lat === 0 ? 2 : 1}
                strokeDasharray={lat === 0 ? 'none' : '4 2'}
              />
              <text x="15" y={y + 4} fill="#94a3b8" fontSize="10">
                {lat}°{lat >= 0 ? 'N' : 'S'}
              </text>
            </motion.g>
          )
        })}

        {/* Highlighted latitude (23°N) */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          <line
            x1={120 - 92}
            y1={150 - 23 * 1.5}
            x2={120 + 92}
            y2={150 - 23 * 1.5}
            stroke="#fbbf24"
            strokeWidth="2"
          />
          <text x="15" y={150 - 23 * 1.5 + 4} fill="#fbbf24" fontSize="10" fontWeight="500">
            23°N
          </text>
        </motion.g>

        {/* Label */}
        <text x="120" y="275" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="500">
          Earth Latitude
        </text>
      </g>

      {/* Center - Connection arrow */}
      <motion.g
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
      >
        <line
          x1="240"
          y1={150 - 23 * 1.5}
          x2="360"
          y2={150 - 23 * 1.5}
          stroke="url(#connectionGradient)"
          strokeWidth="3"
          markerEnd="url(#arrowhead)"
        />
        <text x="300" y={150 - 23 * 1.5 - 15} textAnchor="middle" fill="#fbbf24" fontSize="11">
          = Same position
        </text>
      </motion.g>

      {/* Right side - Celestial sphere */}
      <g>
        {/* Celestial sphere circle */}
        <circle cx="480" cy="150" r="100" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />

        {/* Declination lines */}
        {[-60, -30, 0, 30, 60].map((dec, i) => {
          const y = 150 - dec * 1.5
          const width = Math.cos((Math.abs(dec) * Math.PI) / 180) * 100
          return (
            <motion.g
              key={dec}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <line
                x1={480 - width}
                y1={y}
                x2={480 + width}
                y2={y}
                stroke="#64748b"
                strokeWidth={dec === 0 ? 2 : 1}
                strokeDasharray={dec === 0 ? 'none' : '4 2'}
              />
              <text x="590" y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
                {dec}°{dec >= 0 ? 'N' : 'S'}
              </text>
            </motion.g>
          )
        })}

        {/* Highlighted declination (23°N) with planet */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          <line
            x1={480 - 92}
            y1={150 - 23 * 1.5}
            x2={480 + 92}
            y2={150 - 23 * 1.5}
            stroke="#fbbf24"
            strokeWidth="2"
          />
          <text
            x="590"
            y={150 - 23 * 1.5 + 4}
            fill="#fbbf24"
            fontSize="10"
            fontWeight="500"
            textAnchor="end"
          >
            23°N
          </text>

          {/* Planet marker */}
          <motion.circle
            cx="520"
            cy={150 - 23 * 1.5}
            r="10"
            fill="#fbbf24"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: 'spring' }}
          />
          <text x="520" y={150 - 23 * 1.5 + 4} textAnchor="middle" fill="#1e1b4b" fontSize="12">
            ☉
          </text>
        </motion.g>

        {/* Label */}
        <text x="480" y="275" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="500">
          Celestial Declination
        </text>
      </g>

      {/* Key insight text */}
      <motion.text
        x="300"
        y="290"
        textAnchor="middle"
        fill="#fbbf24"
        fontSize="13"
        fontWeight="600"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        Your Sun at 23°N declination = strongest at 23°N latitude
      </motion.text>
    </svg>
  )
}
