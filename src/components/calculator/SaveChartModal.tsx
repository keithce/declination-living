/**
 * SaveChartModal - Modal for saving a chart with a name
 */

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Save, X } from 'lucide-react'
import type { BirthData } from '@/components/calculator/BirthDataForm'

interface SaveChartModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Close the modal */
  onClose: () => void
  /** Submit handler */
  onSave: () => void
  /** Chart name value */
  chartName: string
  /** Update chart name */
  onChartNameChange: (name: string) => void
  /** Birth data for display */
  birthData: BirthData | null
  /** Whether save is in progress */
  isSaving: boolean
}

export function SaveChartModal({
  isOpen,
  onClose,
  onSave,
  chartName,
  onChartNameChange,
  birthData,
  isSaving,
}: SaveChartModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-chart-title"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onAnimationComplete={() => {
              inputRef.current?.focus()
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="save-chart-title" className="font-display text-xl font-semibold text-white">
                Save Chart
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!chartName.trim() || isSaving) return
                onSave()
              }}
            >
              <div className="mb-6">
                <label
                  htmlFor="chart-name"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Chart Name
                </label>
                <input
                  id="chart-name"
                  type="text"
                  value={chartName}
                  onChange={(e) => onChartNameChange(e.target.value)}
                  placeholder="Enter a name for this chart"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  ref={inputRef}
                />
              </div>

              {birthData && (
                <div className="mb-6 p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                  <div className="text-sm text-slate-400">
                    <span className="text-white font-medium">
                      {birthData.birthCity}, {birthData.birthCountry}
                    </span>
                    <br />
                    {birthData.birthDate} at {birthData.birthTime}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!chartName.trim() || isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
