import { motion } from 'framer-motion'
import { useId } from 'react'

interface ParanConceptDiagramProps {
  className?: string
}

export function ParanConceptDiagram({ className = '' }: ParanConceptDiagramProps) {
  const markerId = useId()
  return (
    <svg
      viewBox="0 0 500 300"
      className={`w-full max-w-xl ${className}`}
      role="img"
      aria-label="Diagram explaining how parans work: when two planets are simultaneously angular at a specific latitude"
    >
      <title>Paran Concept</title>
      <desc>
        Step-by-step visualization showing how parans form when two planets are both at angular
        positions (rising, setting, etc.) at the same moment, creating a powerful influence at
        specific latitudes.
      </desc>

      {/* Step 1: Two planets in different positions */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <text x="100" y="20" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
          Step 1: Two Planets
        </text>

        {/* Sky dome */}
        <path d="M25 100 Q100 30 175 100" fill="none" stroke="#334155" strokeWidth="1" />
        <line x1="25" y1="100" x2="175" y2="100" stroke="#475569" strokeWidth="1" />

        {/* Sun rising */}
        <motion.g
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <circle cx="45" cy="100" r="12" fill="#fbbf24" />
          <text x="45" y="104" textAnchor="middle" fill="#1e1b4b" fontSize="10">
            ☉
          </text>
          <text x="45" y="120" textAnchor="middle" fill="#fbbf24" fontSize="8">
            Rising
          </text>
        </motion.g>

        {/* Jupiter at MC */}
        <motion.g
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.7, type: 'spring' }}
        >
          <circle cx="100" cy="40" r="12" fill="#f97316" />
          <text x="100" y="44" textAnchor="middle" fill="white" fontSize="10">
            ♃
          </text>
          <text x="100" y="25" textAnchor="middle" fill="#f97316" fontSize="8">
            At MC
          </text>
        </motion.g>
      </motion.g>

      {/* Step 2: Same moment in time */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
        <text x="275" y="20" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
          Step 2: Same Moment
        </text>

        {/* Clock/time icon */}
        <circle cx="275" cy="70" r="25" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
        <line x1="275" y1="70" x2="275" y2="55" stroke="#6366f1" strokeWidth="2" />
        <line x1="275" y1="70" x2="285" y2="75" stroke="#6366f1" strokeWidth="2" />

        <text x="275" y="110" textAnchor="middle" fill="#94a3b8" fontSize="9">
          Both angular at
        </text>
        <text x="275" y="122" textAnchor="middle" fill="#6366f1" fontSize="9" fontWeight="500">
          the exact same time
        </text>

        {/* Arrow from step 1 */}
        <motion.path
          d="M185 70 L225 70"
          fill="none"
          stroke="#475569"
          strokeWidth="1"
          markerEnd={`url(#${markerId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.4, duration: 0.3 }}
        />
      </motion.g>

      {/* Step 3: Creates a paran line */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
        <text x="425" y="20" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
          Step 3: Paran Line
        </text>

        {/* Globe with latitude line */}
        <ellipse cx="425" cy="75" rx="50" ry="45" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" />

        {/* Paran latitude line */}
        <motion.ellipse
          cx="425"
          cy="60"
          rx={50 * Math.cos((35 * Math.PI) / 180)}
          ry={50 * Math.cos((35 * Math.PI) / 180) * 0.3}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 2.2, duration: 0.5 }}
        />

        <text x="425" y="130" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="500">
          35°N Latitude
        </text>

        {/* Arrow from step 2 */}
        <motion.path
          d="M325 70 L365 70"
          fill="none"
          stroke="#475569"
          strokeWidth="1"
          markerEnd={`url(#${markerId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 2, duration: 0.3 }}
        />
      </motion.g>

      {/* Arrow marker definition */}
      <defs>
        <marker id={markerId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
        </marker>
      </defs>

      {/* Explanation box */}
      <motion.g
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5 }}
      >
        <rect x="50" y="160" width="400" height="120" rx="8" fill="#0f172a" stroke="#334155" />

        <text x="250" y="185" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">
          Sun Rising + Jupiter at MC = Paran
        </text>

        <text x="250" y="210" textAnchor="middle" fill="#94a3b8" fontSize="10">
          At 35°N latitude, when your Sun rises, Jupiter is at its highest point.
        </text>
        <text x="250" y="225" textAnchor="middle" fill="#94a3b8" fontSize="10">
          This combines their energies in a powerful way.
        </text>

        <text x="250" y="255" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="500">
          Parans reveal hidden planetary relationships at specific latitudes
        </text>
      </motion.g>
    </svg>
  )
}
