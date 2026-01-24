import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { Globe, Loader2 } from 'lucide-react'

// Lazy load the 3D canvas to avoid SSR issues
const GlobeCanvas = lazy(() => import('./GlobeCanvas'))

interface LatitudeBand {
  min: number
  max: number
  dominantPlanet: string
}

interface LatitudeScore {
  latitude: number
  score: number
  dominantPlanet: string
}

interface GlobeViewProps {
  optimalLatitudes: LatitudeScore[]
  latitudeBands: LatitudeBand[]
  birthLocation?: {
    latitude: number
    longitude: number
    city: string
  }
}

function GlobeLoading() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80">
      <div className="relative">
        <Globe className="w-16 h-16 text-amber-400/50" />
        <Loader2 className="absolute inset-0 w-16 h-16 text-amber-400 animate-spin" />
      </div>
      <p className="mt-4 text-slate-400">Loading 3D Globe...</p>
    </div>
  )
}

export function GlobeView({
  optimalLatitudes,
  latitudeBands,
  birthLocation,
}: GlobeViewProps) {
  // Check if we're in the browser
  const isBrowser = typeof window !== 'undefined'

  if (!isBrowser) {
    return (
      <div className="relative w-full aspect-square max-w-2xl mx-auto">
        <GlobeLoading />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full aspect-square max-w-2xl mx-auto rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-700/50"
    >
      <Suspense fallback={<GlobeLoading />}>
        <GlobeCanvas
          optimalLatitudes={optimalLatitudes}
          latitudeBands={latitudeBands}
          birthLocation={birthLocation}
        />
      </Suspense>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center">
        <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-sm rounded-full text-xs text-slate-400">
          Drag to rotate • Scroll to zoom
        </div>
      </div>
    </motion.div>
  )
}

export default GlobeView
