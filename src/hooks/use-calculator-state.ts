import { useCallback, useEffect, useState } from 'react'
import type { PlanetWeights } from '@/components/calculator/PlanetWeights'
import type { Declinations } from '@/components/calculator/DeclinationTable'
import { DEFAULT_WEIGHTS } from '@/components/calculator/PlanetWeights'

type Step = 'birth-data' | 'weights' | 'results'

export interface BirthDataState {
  birthDate: string
  birthTime: string
  birthCity: string
  birthCountry: string
  birthLatitude: number
  birthLongitude: number
  birthTimezone: string
}

export interface CalculationResultState {
  declinations: Declinations
  optimalLatitudes: Array<{ latitude: number; score: number; dominantPlanet: string }>
  latitudeBands: Array<{ min: number; max: number; dominantPlanet: string }>
}

interface CalculatorState {
  step: Step
  birthData: BirthDataState | null
  weights: PlanetWeights
  result: CalculationResultState | null
}

const STORAGE_KEY = 'declination-calculator-state'

const DEFAULT_STATE: CalculatorState = {
  step: 'birth-data',
  birthData: null,
  weights: DEFAULT_WEIGHTS,
  result: null,
}

function loadState(): CalculatorState {
  if (typeof window === 'undefined') return DEFAULT_STATE

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_STATE

    const parsed = JSON.parse(saved) as CalculatorState

    // Validate step is a valid value
    if (!['birth-data', 'weights', 'results'].includes(parsed.step)) {
      return DEFAULT_STATE
    }

    // Validate state consistency: if step is 'weights' but no birthData, reset
    if (parsed.step === 'weights' && !parsed.birthData) {
      return DEFAULT_STATE
    }
    if (parsed.step === 'results' && (!parsed.birthData || !parsed.result)) {
      return { ...parsed, step: 'birth-data' }
    }

    return parsed
  } catch {
    return DEFAULT_STATE
  }
}

function saveState(state: CalculatorState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/**
 * Calculator state hook using useState with localStorage persistence.
 *
 * IMPORTANT: This hook uses useEffect for hydration which requires client-side rendering.
 * Components using this hook must ensure they only render on the client.
 * See calculator.tsx for the client-only rendering pattern.
 */
export function useCalculatorState() {
  const [state, setState] = useState<CalculatorState>(DEFAULT_STATE)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadState()
    setState(loaded)
    setIsLoading(false)
  }, [])

  // Save to localStorage on state change (skip during initial load)
  useEffect(() => {
    if (!isLoading) {
      saveState(state)
    }
  }, [state, isLoading])

  const setStep = useCallback((step: Step) => {
    setState((prev) => ({ ...prev, step }))
  }, [])

  const setBirthData = useCallback((birthData: BirthDataState) => {
    setState((prev) => ({ ...prev, birthData, step: 'weights' }))
  }, [])

  const setWeights = useCallback((weights: PlanetWeights) => {
    setState((prev) => ({ ...prev, weights }))
  }, [])

  const setResult = useCallback((result: CalculationResultState) => {
    setState((prev) => ({ ...prev, result, step: 'results' }))
  }, [])

  const updateResult = useCallback((result: CalculationResultState, weights: PlanetWeights) => {
    setState((prev) => ({ ...prev, result, weights }))
  }, [])

  const resetState = useCallback(() => {
    setState(DEFAULT_STATE)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    // State
    step: state.step,
    birthData: state.birthData,
    weights: state.weights,
    result: state.result,
    isLoading,

    // Actions
    setStep,
    setBirthData,
    setWeights,
    setResult,
    updateResult,
    resetState,
  }
}
