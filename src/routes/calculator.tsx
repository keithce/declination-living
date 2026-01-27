import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAction, useConvexAuth, useMutation } from 'convex/react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { BirthData } from '@/components/calculator/BirthDataForm'
import type { PlanetWeights } from '@/components/calculator/PlanetWeights'
import { BirthDataForm } from '@/components/calculator/BirthDataForm'
import { PlanetWeightsEditor } from '@/components/calculator/PlanetWeights'
import { SaveChartModal } from '@/components/calculator/SaveChartModal'
import { useCalculatorHydration, useCalculatorStore } from '@/stores/calculator-store'
import { FullPageGlobeLayout } from '@/components/results/FullPageGlobeLayout'
import { useGlobeState } from '@/components/globe/hooks/useGlobeState'
import { useProgressiveVisualization } from '@/hooks/useProgressiveVisualization'

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
  const hasHydrated = useCalculatorHydration()

  // During SSR and initial hydration, show loading state
  if (!hasHydrated) {
    return <CalculatorLoading />
  }

  return <CalculatorContent />
}

// Client-only content that uses the Zustand calculator store
function CalculatorContent() {
  const navigate = useNavigate()
  const { isAuthenticated } = useConvexAuth()
  const {
    step,
    birthData,
    weights,
    result,
    setStep,
    setBirthData,
    setWeights,
    setResult,
    updateResult,
    resetState,
  } = useCalculatorStore()
  const [isCalculating, setIsCalculating] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [chartName, setChartName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateComplete = useAction(api.calculations.actions.calculateComplete)
  const recalculateWithWeights = useAction(api.calculations.actions.recalculateWithWeights)
  const createChart = useMutation(api.charts.mutations.create)
  const globeState = useGlobeState()
  const viz = useProgressiveVisualization(birthData, weights, step === 'results' && !!result)

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
      const calcResult = await calculateComplete({
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        timezone: birthData.birthTimezone,
        weights,
      })
      setResult(calcResult)
      // TanStack Query auto-fetches: step transitions to 'results' → enabled becomes true
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
      const recalcResult = await recalculateWithWeights({
        declinations: result.declinations,
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
      // TanStack Query auto-refetches scoringGrid + rankedCities
      // (weights changed in query key). Zenith/ACG/parans stay cached.
    } catch (err) {
      console.error('Recalculation failed:', err)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSaveChart = async () => {
    if (isSaving || !birthData || !result || !chartName.trim()) return

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
      toast.error('Failed to save chart. Please try again.')
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

  // Full-page layout for results step
  if (step === 'results' && result) {
    return (
      <>
        <FullPageGlobeLayout
          viz={viz}
          birthData={birthData}
          result={result}
          weights={weights}
          globeState={globeState}
          onEditBirthData={() => setStep('birth-data')}
          onModifyWeights={() => setStep('weights')}
          onRecalculate={handleRecalculate}
          onSaveChart={openSaveModal}
          isCalculating={isCalculating}
        />

        <SaveChartModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveChart}
          chartName={chartName}
          onChartNameChange={setChartName}
          birthData={birthData}
          isSaving={isSaving}
        />
      </>
    )
  }

  // Standard scrollable layout for birth-data and weights steps
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
        </AnimatePresence>
      </div>
    </div>
  )
}
