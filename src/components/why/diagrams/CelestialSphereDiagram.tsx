import { motion } from 'framer-motion'
import { useId } from 'react'

interface CelestialSphereDiagramProps {
  className?: string
}

export default function CelestialSphereDiagram({ className = '' }: CelestialSphereDiagramProps) {
  const id = useId()
  const sphereGlowId = `sphereGlow${id}`
  const goldGradientId = `goldGradient${id}`
  const eclipticGradientId = `eclipticGradient${id}`

  return (
    <svg
      viewBox="0 0 400 400"
      className={`w-full max-w-md ${className}`}
      role="img"
      aria-label="Diagram showing Earth inside the celestial sphere with the celestial equator and ecliptic plane"
    >
      <title>Celestial Sphere Diagram</title>
      <desc>
        Earth shown as a small sphere at the center, surrounded by the larger celestial sphere. The
        celestial equator extends outward as a ring, while the ecliptic plane is tilted at 23.4
        degrees.
      </desc>

      {/* Background glow */}
      <defs>
        <radialGradient id={sphereGlowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#050714" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={goldGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id={eclipticGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      {/* Background */}
      <circle cx="200" cy="200" r="190" fill={`url(#${sphereGlowId})`} />

      {/* Celestial sphere outline */}
      <motion.circle
        cx="200"
        cy="200"
        r="180"
        fill="none"
        stroke="#334155"
        strokeWidth="1"
        strokeDasharray="4 4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Celestial equator (horizontal ring) */}
      <motion.ellipse
        cx="200"
        cy="200"
        rx="180"
        ry="40"
        fill="none"
        stroke={`url(#${goldGradientId})`}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />

      {/* Ecliptic plane (tilted 23.4 degrees) */}
      <motion.ellipse
        cx="200"
        cy="200"
        rx="180"
        ry="50"
        fill="none"
        stroke={`url(#${eclipticGradientId})`}
        strokeWidth="2"
        strokeDasharray="8 4"
        transform="rotate(-23.4 200 200)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.8 }}
      />

      {/* Earth at center */}
      <motion.circle
        cx="200"
        cy="200"
        r="25"
        fill="#1e40af"
        stroke="#3b82f6"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />

      {/* Earth's continents (simplified) */}
      <motion.path
        d="M185 195 Q190 185 200 188 Q210 185 215 195 Q220 200 215 210 Q200 215 185 210 Q180 200 185 195Z"
        fill="#22c55e"
        opacity="0.6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.5 }}
      />

      {/* North celestial pole */}
      <motion.g
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <circle cx="200" cy="30" r="4" fill="#fbbf24" />
        <text x="200" y="15" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="500">
          North Celestial Pole
        </text>
      </motion.g>

      {/* South celestial pole */}
      <motion.g
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <circle cx="200" cy="370" r="4" fill="#fbbf24" />
        <text x="200" y="390" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="500">
          South Celestial Pole
        </text>
      </motion.g>

      {/* Labels */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
        {/* Celestial equator label */}
        <text x="380" y="215" textAnchor="end" fill="#fbbf24" fontSize="11" fontWeight="500">
          Celestial Equator
        </text>

        {/* Ecliptic label */}
        <text
          x="350"
          y="130"
          textAnchor="middle"
          fill="#818cf8"
          fontSize="11"
          fontWeight="500"
          transform="rotate(-23.4 350 130)"
        >
          Ecliptic (23.4°)
        </text>

        {/* Earth label */}
        <text x="200" y="245" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="500">
          Earth
        </text>
      </motion.g>

      {/* Planet on the sphere */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
        <circle cx="320" cy="140" r="8" fill="#ef4444" />
        <text x="340" y="135" fill="#ef4444" fontSize="10">
          Planet
        </text>
        {/* Declination line */}
        <line
          x1="200"
          y1="200"
          x2="320"
          y2="140"
          stroke="#ef4444"
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.5"
        />
      </motion.g>
    </svg>
  )
}
