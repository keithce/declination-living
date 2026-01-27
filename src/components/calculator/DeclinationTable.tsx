import { memo } from 'react'
import { motion } from 'framer-motion'
import type { PlanetId } from '@/lib/planet-constants'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PLANETS } from '@/lib/planet-constants'

export interface Declinations {
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

/** Enhanced declination with OOB status */
export interface EnhancedDeclination {
  value: number
  isOOB: boolean
  oobDegrees?: number
}

interface DeclinationTableProps {
  declinations: Declinations
  /** Current obliquity (for OOB limit display) */
  obliquity?: number
  /** Enhanced declinations with OOB status */
  enhancedDeclinations?: Record<PlanetId, EnhancedDeclination>
}

export const DeclinationTable = memo(function DeclinationTable({
  declinations,
  obliquity,
  enhancedDeclinations,
}: DeclinationTableProps) {
  const formatDeclination = (value: number): string => {
    const direction = value >= 0 ? 'N' : 'S'
    const degrees = Math.abs(value)
    const deg = Math.floor(degrees)
    const min = Math.floor((degrees - deg) * 60)
    return `${deg}°${min.toString().padStart(2, '0')}' ${direction}`
  }

  // Get OOB info for a planet
  const getOOBInfo = (planetKey: PlanetId): EnhancedDeclination | null => {
    if (!enhancedDeclinations) return null
    const enhanced = enhancedDeclinations[planetKey] as EnhancedDeclination | undefined
    if (!enhanced || !enhanced.isOOB) return null
    return enhanced
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden"
      >
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">
                Your Planetary Declinations
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                North/South celestial position at your birth
              </p>
            </div>
            {obliquity != null && (
              <div className="text-xs text-slate-500 text-right">
                <div>Current obliquity: {obliquity.toFixed(2)}°</div>
                <div className="text-amber-400/70">OOB limit: ±{obliquity.toFixed(2)}°</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5">
          {PLANETS.map((planet, index) => {
            const declination = declinations[planet.key as keyof Declinations]
            const oobInfo = getOOBInfo(planet.key)

            return (
              <motion.div
                key={planet.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border-b border-r border-slate-700/30 last:border-r-0 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl" style={{ color: planet.color }}>
                    {planet.symbol}
                  </span>
                  <span className="text-sm text-slate-400">{planet.name}</span>
                  {oobInfo && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 rounded border border-amber-500/30 cursor-help">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          OOB
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Out of Bounds by {oobInfo.oobDegrees?.toFixed(2) ?? '?'}°</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="font-mono text-lg font-semibold" style={{ color: planet.color }}>
                  {formatDeclination(declination)}
                </div>
                <div className="text-xs text-slate-500 mt-1">{declination.toFixed(2)}°</div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </TooltipProvider>
  )
})
