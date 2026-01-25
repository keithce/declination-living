import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAction, useConvexAuth, useMutation } from 'convex/react'
import { ChevronLeft, ChevronRight, Loader2, Save, Sparkles, X } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { BirthData } from '@/components/calculator/BirthDataForm'
import type { PlanetWeights } from '@/components/calculator/PlanetWeights'
import { BirthDataForm } from '@/components/calculator/BirthDataForm'
import { PlanetWeightsEditor } from '@/components/calculator/PlanetWeights'
import { useCalculatorState } from '@/hooks/use-calculator-state'
import { DeclinationTable } from '@/components/calculator/DeclinationTable'
import { ResultsPanel } from '@/components/calculator/ResultsPanel'
import { ResultsTabs } from '@/components/results/ResultsTabs'
import { GlobeView } from '@/components/globe'
import { useGlobeState } from '@/components/globe/hooks/useGlobeState'

export const Route = createFileRoute('/calculator')({
  component: CalculatorPage,
})

// Loading component shown during SSR and initial hydration
function CalculatorLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050714] via-[#0a0f1f] to-[#0f172a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
    </div>
  )
}

// Main page wrapper - handles SSR by only rendering content on client
function CalculatorPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // During SSR and initial hydration, show loading state
  // This prevents useLiveQuery from being called on the server
  if (!isClient) {
    return <CalculatorLoading />
  }

  return <CalculatorContent />
}

// Client-only content that uses useCalculatorState (which uses useLiveQuery)
function CalculatorContent() {
  const navigate = useNavigate()
  const { isAuthenticated } = useConvexAuth()
  const {
    step,
    birthData,
    weights,
    result,
    isLoading: isStateLoading,
    setStep,
    setBirthData,
    setWeights,
    setResult,
    updateResult,
    resetState,
  } = useCalculatorState()
  const [isCalculating, setIsCalculating] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [chartName, setChartName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phase2Data, setPhase2Data] = useState<any | null>(null)

  const calculateComplete = useAction(api.calculations.actions.calculateComplete)
  const calculatePhase2 = useAction(api.calculations.phase2_actions.calculatePhase2Complete)
  const recalculateWithWeights = useAction(api.calculations.actions.recalculateWithWeights)
  const createChart = useMutation(api.charts.mutations.create)
  const globeState = useGlobeState()

  const handleBirthDataSubmit = (data: BirthData) => {
    setBirthData(data)
  }

  const handleCalculate = async () => {
    setError(null)

    if (!birthData) {
      setError('Birth data is missing. Please go back and enter your details.')
      return
    }

    setIsCalculating(true)
    try {
      // Run both calculations in parallel
      const [calcResult, phase2Result] = await Promise.all([
        calculateComplete({
          birthDate: birthData.birthDate,
          birthTime: birthData.birthTime,
          timezone: birthData.birthTimezone,
          weights,
        }),
        calculatePhase2({
          birthDate: birthData.birthDate,
          birthTime: birthData.birthTime,
          timezone: birthData.birthTimezone,
          weights,
        }),
      ])

      setResult(calcResult)
      setPhase2Data(phase2Result)
    } catch (err) {
      console.error('Calculation failed:', err)
      setError('Calculation failed. Please try again.')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleRecalculate = async (newWeights: PlanetWeights) => {
    if (!result || !birthData) return

    setIsCalculating(true)

    try {
      // Recalculate Phase 1 results (lightweight)
      const recalcResult = await recalculateWithWeights({
        declinations: result.declinations,
        weights: newWeights,
      })

      // Recalculate Phase 2 results with new weights
      const phase2Result = await calculatePhase2({
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        timezone: birthData.birthTimezone,
        weights: newWeights,
      })

      updateResult(
        {
          ...result,
          optimalLatitudes: recalcResult.optimalLatitudes,
          latitudeBands: recalcResult.latitudeBands,
        },
        newWeights,
      )
      setPhase2Data(phase2Result)
    } catch (err) {
      console.error('Recalculation failed:', err)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSaveChart = async () => {
    if (!birthData || !result || !chartName.trim()) return

    setIsSaving(true)
    try {
      await createChart({
        name: chartName.trim(),
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        birthCity: birthData.birthCity,
        birthCountry: birthData.birthCountry,
        birthLatitude: birthData.birthLatitude,
        birthLongitude: birthData.birthLongitude,
        birthTimezone: birthData.birthTimezone,
        declinations: result.declinations,
        weights,
      })

      // Reset state and navigate to dashboard
      resetState()
      navigate({ to: '/dashboard' })
    } catch (err) {
      console.error('Failed to save chart:', err)
      alert('Failed to save chart. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const openSaveModal = () => {
    // Redirect to signin if not authenticated
    if (!isAuthenticated) {
      navigate({ to: '/auth/signin' })
      return
    }
    // Pre-fill with city name as default
    setChartName(birthData?.birthCity ? `${birthData.birthCity} Chart` : '')
    setShowSaveModal(true)
  }

  // Show loading state while reading from localStorage
  if (isStateLoading) {
    return <CalculatorLoading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050714] via-[#0a0f1f] to-[#0f172a] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-white mb-4">
            Declination Calculator
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Enter your birth details to discover the latitudes where your planetary energies
            resonate most strongly.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { key: 'birth-data', label: 'Birth Data' },
            { key: 'weights', label: 'Weights' },
            { key: 'results', label: 'Results' },
          ].map((s, index) => (
            <div key={s.key} className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (s.key === 'birth-data') setStep('birth-data')
                  else if (s.key === 'weights' && birthData) setStep('weights')
                  else if (s.key === 'results' && result) setStep('results')
                }}
                disabled={(s.key === 'weights' && !birthData) || (s.key === 'results' && !result)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  step === s.key
                    ? 'bg-amber-500 text-slate-900 font-semibold'
                    : (s.key === 'weights' && !birthData) || (s.key === 'results' && !result)
                      ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm">
                  {index + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {index < 2 && <div className="w-8 h-px bg-slate-700 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === 'birth-data' && (
            <motion.div
              key="birth-data"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-lg mx-auto"
            >
              <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-8">
                <BirthDataForm onSubmit={handleBirthDataSubmit} isLoading={false} />
              </div>
            </motion.div>
          )}

          {step === 'weights' && (
            <motion.div
              key="weights"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-8">
                <PlanetWeightsEditor weights={weights} onChange={setWeights} />

                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                    {error}
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={() => setStep('birth-data')}
                    className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>

                  <motion.button
                    onClick={handleCalculate}
                    disabled={isCalculating}
                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isCalculating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        Calculate
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'results' && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Birth data summary */}
              {birthData && (
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-4 flex items-center justify-between">
                  <div className="text-slate-400 text-sm">
                    <span className="text-white font-medium">
                      {birthData.birthCity}, {birthData.birthCountry}
                    </span>{' '}
                    • {birthData.birthDate} at {birthData.birthTime}
                  </div>
                  <button
                    onClick={() => setStep('birth-data')}
                    className="text-sm text-amber-400 hover:text-amber-300"
                  >
                    Edit
                  </button>
                </div>
              )}

              {/* Declinations */}
              <DeclinationTable declinations={result.declinations} />

              {/* 3D Globe Visualization */}
              <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-4">
                <h3 className="font-display text-lg font-semibold text-white mb-4">
                  Global Visualization
                </h3>
                <GlobeView
                  optimalLatitudes={result.optimalLatitudes}
                  latitudeBands={result.latitudeBands}
                  birthLocation={
                    birthData
                      ? {
                          latitude: birthData.birthLatitude,
                          longitude: birthData.birthLongitude,
                          city: birthData.birthCity,
                        }
                      : undefined
                  }
                />
              </div>

              {/* Weights adjuster (collapsed) */}
              <details className="group rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
                <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                  <span className="font-medium text-white">Adjust Weights</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90" />
                </summary>
                <div className="p-4 border-t border-slate-700/30">
                  <PlanetWeightsEditor weights={weights} onChange={handleRecalculate} />
                </div>
              </details>

              {/* Phase 1 Results */}
              <ResultsPanel
                optimalLatitudes={result.optimalLatitudes}
                latitudeBands={result.latitudeBands}
              />

              {/* Phase 2 Enhanced Results */}
              {phase2Data && (
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="font-display text-xl font-semibold text-white">
                      Enhanced Analysis
                    </h3>
                  </div>
                  <ResultsTabs
                    acgLines={phase2Data.acgLines}
                    zenithLines={phase2Data.zenithLines}
                    parans={phase2Data.parans}
                    scoringGrid={phase2Data.scoringGrid}
                    globeState={globeState}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setStep('weights')}
                  className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
                >
                  Modify Weights
                </button>
                <button
                  onClick={openSaveModal}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Chart
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Chart Modal */}
        <AnimatePresence>
          {showSaveModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowSaveModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-xl font-semibold text-white">Save Chart</h3>
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

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
                    onChange={(e) => setChartName(e.target.value)}
                    placeholder="Enter a name for this chart"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    autoFocus
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
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChart}
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
