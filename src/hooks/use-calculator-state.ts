import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import type { PlanetWeights } from '@/components/calculator/PlanetWeights'
import type { Declinations } from '@/components/calculator/DeclinationTable'
import { DEFAULT_WEIGHTS } from '@/components/calculator/PlanetWeights'

type Step = 'birth-data' | 'weights' | 'results'

// Zod schemas for runtime validation
const BirthDataSchema = z.object({
  birthDate: z.string(),
  birthTime: z.string(),
  birthCity: z.string(),
  birthCountry: z.string(),
  birthLatitude: z.number(),
  birthLongitude: z.number(),
  birthTimezone: z.string(),
})

const PlanetWeightsSchema = z.object({
  sun: z.number(),
  moon: z.number(),
  mercury: z.number(),
  venus: z.number(),
  mars: z.number(),
  jupiter: z.number(),
  saturn: z.number(),
  uranus: z.number(),
  neptune: z.number(),
  pluto: z.number(),
})

const DeclinationsSchema = z.object({
  sun: z.number(),
  moon: z.number(),
  mercury: z.number(),
  venus: z.number(),
  mars: z.number(),
  jupiter: z.number(),
  saturn: z.number(),
  uranus: z.number(),
  neptune: z.number(),
  pluto: z.number(),
})

const CalculatorStateSchema = z.object({
  step: z.enum(['birth-data', 'weights', 'results']),
  birthData: BirthDataSchema.nullable(),
  weights: PlanetWeightsSchema,
  result: z
    .object({
      declinations: DeclinationsSchema,
      optimalLatitudes: z.array(
        z.object({ latitude: z.number(), score: z.number(), dominantPlanet: z.string() }),
      ),
      latitudeBands: z.array(
        z.object({ min: z.number(), max: z.number(), dominantPlanet: z.string() }),
      ),
    })
    .nullable(),
})

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

    const json = JSON.parse(saved)
    const parsed = CalculatorStateSchema.safeParse(json)

    if (!parsed.success) {
      return DEFAULT_STATE
    }

    const state = parsed.data

    // Validate state consistency: if step is 'weights' but no birthData, reset
    if (state.step === 'weights' && !state.birthData) {
      return DEFAULT_STATE
    }
    if (state.step === 'results' && (!state.birthData || !state.result)) {
      return { ...state, step: 'birth-data' }
    }

    return state
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
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
