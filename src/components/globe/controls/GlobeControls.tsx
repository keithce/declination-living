/**
 * Globe Controls - UI component for managing globe visualization layers.
 *
 * Provides toggles for layers, planet filters, and ACG line type filters.
 */

import { useState } from "react"
import {
  Layers,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Flame,
  Circle,
  Minus,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { PlanetId } from "../layers/types"
import { PLANET_COLORS_HEX, PLANET_IDS } from "../layers/types"
import type { UseGlobeStateReturn } from "../hooks/useGlobeState"
import {
  getVisiblePlanetCount,
  getVisibleACGLineTypeCount,
} from "../hooks/useGlobeState"

// =============================================================================
// Types
// =============================================================================

interface GlobeControlsProps {
  state: UseGlobeStateReturn
  className?: string
}

// =============================================================================
// Helper Components
// =============================================================================

interface ToggleButtonProps {
  enabled: boolean
  onClick: () => void
  label: string
  color?: string
  className?: string
}

function ToggleButton({
  enabled,
  onClick,
  label,
  color,
  className = "",
}: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all
        ${enabled ? "bg-slate-700/50 text-white" : "bg-slate-800/30 text-slate-500"}
        hover:bg-slate-700/70
        ${className}
      `}
    >
      {color && (
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span>{label}</span>
      {enabled ? (
        <Eye className="w-3.5 h-3.5 ml-auto" />
      ) : (
        <EyeOff className="w-3.5 h-3.5 ml-auto opacity-50" />
      )}
    </button>
  )
}

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string | number
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-slate-700/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/30 transition-colors"
      >
        {icon}
        <span>{title}</span>
        {badge !== undefined && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-700/50 rounded">
            {badge}
          </span>
        )}
        <span className="ml-auto">
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface SliderControlProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: SliderControlProps) {
  return (
    <div className="px-1">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span>{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:bg-amber-400
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-3
          [&::-moz-range-thumb]:h-3
          [&::-moz-range-thumb]:bg-amber-400
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:cursor-pointer
          [&::-moz-range-thumb]:border-0
        "
      />
    </div>
  )
}

// =============================================================================
// Planet Display Names
// =============================================================================

const PLANET_DISPLAY_NAMES: Record<PlanetId, string> = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptune",
  pluto: "Pluto",
}

const ACG_LINE_DISPLAY_NAMES: Record<string, string> = {
  ASC: "Ascending",
  DSC: "Descending",
  MC: "Midheaven",
  IC: "Imum Coeli",
}

// =============================================================================
// Main Component
// =============================================================================

export function GlobeControls({ state, className = "" }: GlobeControlsProps) {
  const visiblePlanetCount = getVisiblePlanetCount(state.planets)
  const visibleACGCount = getVisibleACGLineTypeCount(state.acgLineTypes)

  /**
   * Convert hex number to CSS hex string.
   */
  const hexToColor = (hex: number): string => {
    return `#${hex.toString(16).padStart(6, "0")}`
  }

  return (
    <div
      className={`
        bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl
        shadow-xl max-h-[80vh] overflow-y-auto
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-200 font-medium">
          <Layers className="w-4 h-4" />
          <span>Globe Layers</span>
        </div>
        <button
          onClick={state.resetState}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          title="Reset all settings"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Toggles */}
      <CollapsibleSection
        title="Visualization Layers"
        icon={<Layers className="w-4 h-4" />}
      >
        <ToggleButton
          enabled={state.layers.zenithBands}
          onClick={() => state.toggleLayer("zenithBands")}
          label="Zenith Bands"
        />
        <ToggleButton
          enabled={state.layers.acgLines}
          onClick={() => state.toggleLayer("acgLines")}
          label="ACG Lines"
        />
        <ToggleButton
          enabled={state.layers.paranPoints}
          onClick={() => state.toggleLayer("paranPoints")}
          label="Paran Points"
        />
        <ToggleButton
          enabled={state.layers.heatmap}
          onClick={() => state.toggleLayer("heatmap")}
          label="Heatmap"
        />
      </CollapsibleSection>

      {/* Heatmap Controls (when enabled) */}
      {state.layers.heatmap && (
        <CollapsibleSection
          title="Heatmap Settings"
          icon={<Flame className="w-4 h-4" />}
          defaultOpen={true}
        >
          <SliderControl
            label="Intensity"
            value={state.heatmapIntensity}
            min={0}
            max={2}
            step={0.1}
            onChange={state.setHeatmapIntensity}
          />
          <SliderControl
            label="Spread (degrees)"
            value={state.heatmapSpread}
            min={1}
            max={10}
            step={0.5}
            onChange={state.setHeatmapSpread}
          />
        </CollapsibleSection>
      )}

      {/* Planet Filters */}
      <CollapsibleSection
        title="Planets"
        icon={<Circle className="w-4 h-4" />}
        badge={`${visiblePlanetCount}/${PLANET_IDS.length}`}
      >
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => state.setAllPlanets(true)}
            className="flex-1 px-2 py-1 text-xs bg-slate-800/50 hover:bg-slate-700/50 rounded transition-colors"
          >
            Show All
          </button>
          <button
            onClick={() => state.setAllPlanets(false)}
            className="flex-1 px-2 py-1 text-xs bg-slate-800/50 hover:bg-slate-700/50 rounded transition-colors"
          >
            Hide All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {PLANET_IDS.map((planet) => (
            <ToggleButton
              key={planet}
              enabled={state.planets[planet]}
              onClick={() => state.togglePlanet(planet)}
              label={PLANET_DISPLAY_NAMES[planet]}
              color={hexToColor(PLANET_COLORS_HEX[planet])}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* ACG Line Type Filters (when ACG layer is enabled) */}
      {state.layers.acgLines && (
        <CollapsibleSection
          title="ACG Line Types"
          icon={<Minus className="w-4 h-4" />}
          badge={`${visibleACGCount}/4`}
        >
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => state.setAllACGLineTypes(true)}
              className="flex-1 px-2 py-1 text-xs bg-slate-800/50 hover:bg-slate-700/50 rounded transition-colors"
            >
              Show All
            </button>
            <button
              onClick={() => state.setAllACGLineTypes(false)}
              className="flex-1 px-2 py-1 text-xs bg-slate-800/50 hover:bg-slate-700/50 rounded transition-colors"
            >
              Hide All
            </button>
          </div>
          {(["ASC", "DSC", "MC", "IC"] as const).map((lineType) => (
            <ToggleButton
              key={lineType}
              enabled={state.acgLineTypes[lineType]}
              onClick={() => state.toggleACGLineType(lineType)}
              label={`${lineType} - ${ACG_LINE_DISPLAY_NAMES[lineType]}`}
            />
          ))}
          <p className="mt-2 text-xs text-slate-500">
            ASC/DSC: Rising/Setting (solid)
            <br />
            MC/IC: Culminating (dashed)
          </p>
        </CollapsibleSection>
      )}

      {/* Highlight Planet (for hover effects) */}
      {state.highlightedPlanet && (
        <div className="px-4 py-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: hexToColor(
                  PLANET_COLORS_HEX[state.highlightedPlanet]
                ),
              }}
            />
            <span className="text-sm text-slate-300">
              {PLANET_DISPLAY_NAMES[state.highlightedPlanet]} highlighted
            </span>
            <button
              onClick={() => state.setHighlightedPlanet(null)}
              className="ml-auto text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GlobeControls
