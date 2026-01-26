/**
 * Globe Layers Popover - Top-left layer controls for full-page globe view.
 *
 * Provides a popover button that opens the GlobeControls panel.
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Layers, X } from 'lucide-react'
import type { UseGlobeStateReturn } from '@/components/globe/hooks/useGlobeState'
import { GlobeControls } from '@/components/globe/controls'

// =============================================================================
// Types
// =============================================================================

interface GlobeLayersPopoverProps {
  /** Globe state for controls */
  globeState: UseGlobeStateReturn
}

// =============================================================================
// Component
// =============================================================================

export function GlobeLayersPopover({ globeState }: GlobeLayersPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Combined effect for event listeners and focus management
  useEffect(() => {
    if (!isOpen) return

    // Focus the popover when opened
    const firstFocusable = popoverRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (firstFocusable) {
      firstFocusable.focus()
    } else {
      popoverRef.current?.focus()
    }

    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={popoverRef} className="relative" tabIndex={-1}>
      {/* Trigger Button */}
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2.5
          rounded-xl backdrop-blur-md transition-all
          border shadow-lg
          ${
            isOpen
              ? 'bg-amber-500 text-slate-900 border-amber-400'
              : 'bg-slate-900/85 text-slate-200 border-slate-700/50 hover:bg-slate-800/90 hover:border-slate-600'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={isOpen ? 'Hide layer controls' : 'Show layer controls'}
        aria-expanded={isOpen}
      >
        <Layers className="w-4 h-4" />
        <span className="text-sm font-medium">Layers</span>
      </motion.button>

      {/* Popover Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-72 z-10"
          >
            <div className="relative">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute -top-2 -right-2 z-20 w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 transition-colors shadow-md"
                aria-label="Close controls"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <GlobeControls state={globeState} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GlobeLayersPopover
