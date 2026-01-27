import { motion } from 'framer-motion'

interface ACGLinesDiagramProps {
  className?: string
}

export default function ACGLinesDiagram({ className = '' }: ACGLinesDiagramProps) {
  return (
    <svg
      viewBox="0 0 500 350"
      className={`w-full max-w-xl ${className}`}
      role="img"
      aria-label="Diagram showing the four ACG angular positions: Rising, Setting, Midheaven, and Imum Coeli"
    >
      <title>ACG Lines - Angular Positions</title>
      <desc>
        Shows a horizon circle with four key positions where planets have strongest influence:
        Ascendant (Rising), Descendant (Setting), Midheaven (MC), and Imum Coeli (IC).
      </desc>

      <defs>
        <linearGradient id="horizonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0a0f1f" />
        </linearGradient>
      </defs>

      {/* Title */}
      <text x="250" y="25" textAnchor="middle" fill="#94a3b8" fontSize="11">
        The Four Angular Positions
      </text>

      {/* Horizon circle */}
      <motion.circle
        cx="175"
        cy="190"
        r="120"
        fill="url(#horizonGradient)"
        stroke="#334155"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8 }}
      />

      {/* Horizon line */}
      <motion.line
        x1="55"
        y1="190"
        x2="295"
        y2="190"
        stroke="#64748b"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />

      {/* Meridian line (vertical) */}
      <motion.line
        x1="175"
        y1="70"
        x2="175"
        y2="310"
        stroke="#64748b"
        strokeWidth="1"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />

      {/* Compass directions */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
        <text x="175" y="55" textAnchor="middle" fill="#475569" fontSize="10">
          N
        </text>
        <text x="175" y="335" textAnchor="middle" fill="#475569" fontSize="10">
          S
        </text>
        <text x="40" y="195" textAnchor="middle" fill="#475569" fontSize="10">
          E
        </text>
        <text x="310" y="195" textAnchor="middle" fill="#475569" fontSize="10">
          W
        </text>
      </motion.g>

      {/* Angular positions */}
      {/* MC - Midheaven (top) */}
      <motion.g
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <circle cx="175" cy="70" r="15" fill="#f97316" />
        <text x="175" y="75" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          MC
        </text>
        <text x="175" y="45" textAnchor="middle" fill="#f97316" fontSize="9">
          Midheaven
        </text>
        <text x="175" y="35" textAnchor="middle" fill="#94a3b8" fontSize="8">
          Highest point
        </text>
      </motion.g>

      {/* IC - Imum Coeli (bottom) */}
      <motion.g
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
      >
        <circle cx="175" cy="310" r="15" fill="#8b5cf6" />
        <text x="175" y="315" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          IC
        </text>
        <text x="175" y="340" textAnchor="middle" fill="#8b5cf6" fontSize="9">
          Imum Coeli
        </text>
      </motion.g>

      {/* ASC - Ascendant (left/East - Rising) */}
      <motion.g
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.6 }}
      >
        <circle cx="55" cy="190" r="15" fill="#22c55e" />
        <text x="55" y="195" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
          ASC
        </text>
        <text x="55" y="220" textAnchor="middle" fill="#22c55e" fontSize="9">
          Rising
        </text>
      </motion.g>

      {/* DSC - Descendant (right/West - Setting) */}
      <motion.g
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.8 }}
      >
        <circle cx="295" cy="190" r="15" fill="#ef4444" />
        <text x="295" y="195" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
          DSC
        </text>
        <text x="295" y="220" textAnchor="middle" fill="#ef4444" fontSize="9">
          Setting
        </text>
      </motion.g>

      {/* Right side - Map projection showing curved lines */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
        <rect x="340" y="60" width="150" height="260" rx="8" fill="#0f172a" stroke="#334155" />
        <text x="415" y="80" textAnchor="middle" fill="#64748b" fontSize="10">
          World Map View
        </text>

        {/* Simplified world map outline */}
        <rect x="350" y="90" width="130" height="80" rx="4" fill="#1e1b4b" opacity="0.5" />

        {/* ACG lines on map */}
        {/* MC line (curved) */}
        <motion.path
          d="M360 110 Q415 90 470 105"
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 2.2, duration: 0.5 }}
        />

        {/* IC line (curved opposite) */}
        <motion.path
          d="M360 160 Q415 180 470 165"
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 2.4, duration: 0.5 }}
        />

        {/* ASC line */}
        <motion.path
          d="M380 90 Q370 130 385 170"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 2.6, duration: 0.5 }}
        />

        {/* DSC line */}
        <motion.path
          d="M450 90 Q460 130 445 170"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 2.8, duration: 0.5 }}
        />

        {/* Legend */}
        <g transform="translate(350, 200)">
          <circle cx="10" cy="10" r="4" fill="#f97316" />
          <text x="20" y="14" fill="#94a3b8" fontSize="9">
            MC - Career, public life
          </text>

          <circle cx="10" cy="30" r="4" fill="#8b5cf6" />
          <text x="20" y="34" fill="#94a3b8" fontSize="9">
            IC - Home, roots
          </text>

          <circle cx="10" cy="50" r="4" fill="#22c55e" />
          <text x="20" y="54" fill="#94a3b8" fontSize="9">
            ASC - Identity, beginnings
          </text>

          <circle cx="10" cy="70" r="4" fill="#ef4444" />
          <text x="20" y="74" fill="#94a3b8" fontSize="9">
            DSC - Relationships
          </text>
        </g>
      </motion.g>
    </svg>
  )
}
