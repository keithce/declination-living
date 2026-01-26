/**
 * ZenithTab - Display zenith latitude bands
 */

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { APPROX_OBLIQUITY } from '@convex/calculations/core/constants'
import {
  PLANET_COLORS,
  PLANET_NAMES,
  PLANET_SYMBOLS,
  formatDeclination,
  formatLatitude,
} from '../shared/constants'
import type { ZenithLine } from '@convex/calculations/core/types'

// =============================================================================
// Types
// =============================================================================

export interface ZenithTabProps {
  /** Zenith lines from calculations */
  zenithLines: Array<ZenithLine>
  /** Initial orb value */
  initialOrb?: number
  /** Compact mode for narrow panels */
  compact?: boolean
}

// =============================================================================
// Main Component
// =============================================================================

export const ZenithTab = memo(function ZenithTab({
  zenithLines,
  initialOrb = 1.0,
  compact = false,
}: ZenithTabProps) {
  const [orb, setOrb] = useState(initialOrb)

  // Sort by absolute declination (most extreme first)
  const sortedLines = [...zenithLines].sort(
    (a, b) => Math.abs(b.declination) - Math.abs(a.declination),
  )

  // Identify OOB planets
  const oobLines = sortedLines.filter((line) => Math.abs(line.declination) > APPROX_OBLIQUITY)
  const normalLines = sortedLines.filter((line) => Math.abs(line.declination) <= APPROX_OBLIQUITY)

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Orb Control */}
      <div
        className={`${compact ? 'p-2' : 'p-4'} rounded-lg bg-slate-800/50 border border-slate-700/50`}
      >
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="zenith-orb-range" className="text-xs font-medium text-white">
            Band Orb
          </label>
          <span className="text-xs font-mono text-blue-400">{orb.toFixed(1)}°</span>
        </div>
        <input
          id="zenith-orb-range"
          type="range"
          min="0.5"
          max="5.0"
          step="0.1"
          value={orb}
          onChange={(e) => setOrb(Number.parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Out of Bounds Section */}
      {oobLines.length > 0 && (
        <div
          className={`rounded-lg border border-amber-500/30 bg-amber-500/5 ${compact ? 'p-2' : 'p-4'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">
              OOB Planets ({oobLines.length})
            </span>
          </div>
          <div className="space-y-2">
            {oobLines.map((line, index) => {
              const oobDegrees = Math.abs(line.declination) - APPROX_OBLIQUITY
              const orbMin = line.declination - orb
              const orbMax = line.declination + orb

              return (
                <motion.div
                  key={line.planet}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${compact ? 'p-2' : 'p-3'} rounded bg-slate-800/50`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={compact ? 'text-base' : 'text-xl'}
                        style={{ color: PLANET_COLORS[line.planet] }}
                      >
                        {PLANET_SYMBOLS[line.planet]}
                      </span>
                      <div>
                        <div className="text-white text-sm font-medium">
                          {PLANET_NAMES[line.planet]}
                        </div>
                        <div className="text-xs text-amber-400">+{oobDegrees.toFixed(1)}° OOB</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm font-mono">
                        {formatDeclination(line.declination)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatLatitude(orbMin)} to {formatLatitude(orbMax)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Normal Zenith Lines */}
      <div className="space-y-2">
        {normalLines.map((line, index) => {
          const orbMin = line.declination - orb
          const orbMax = line.declination + orb

          return (
            <motion.div
              key={line.planet}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + oobLines.length) * 0.03 }}
              className={`${compact ? 'p-2' : 'p-4'} rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={compact ? 'text-base' : 'text-xl'}
                    style={{ color: PLANET_COLORS[line.planet] }}
                  >
                    {PLANET_SYMBOLS[line.planet]}
                  </span>
                  <span className="text-white text-sm font-medium">
                    {PLANET_NAMES[line.planet]}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm font-mono">
                    {formatDeclination(line.declination)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatLatitude(orbMin)} to {formatLatitude(orbMax)}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
})

export default ZenithTab
