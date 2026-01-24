import { eq, useLiveQuery } from '@tanstack/react-db'
import type { PlanetWeights } from '@/components/calculator/PlanetWeights'
import type {
  BirthDataState,
  CalculationResultState,
  CalculatorState,
} from '@/lib/calculator-store'
import { calculatorStateCollection } from '@/lib/calculator-store'
import { DEFAULT_WEIGHTS } from '@/components/calculator/PlanetWeights'

type Step = 'birth-data' | 'weights' | 'results'

const DEFAULT_STATE: Omit<CalculatorState, 'id'> = {
  step: 'birth-data',
  birthData: null,
  weights: DEFAULT_WEIGHTS,
  result: null,
  updatedAt: Date.now(),
}

/**
 * Calculator state hook using TanStack React DB with localStorage persistence.
 *
 * IMPORTANT: This hook uses useLiveQuery which doesn't support SSR.
 * Components using this hook must ensure they only render on the client.
 * See calculator.tsx for the client-only rendering pattern.
 */
export function useCalculatorState() {
  const { data, isLoading } = useLiveQuery((q) =>
    q.from({ state: calculatorStateCollection }).where(({ state }) => eq(state.id, 'current')),
  )

  // Explicitly type as nullable since the query might return empty array
  const currentState: CalculatorState | null = data.length > 0 ? data[0] : null

  const updateState = (updates: Partial<Omit<CalculatorState, 'id'>>) => {
    const newState: CalculatorState = {
      ...DEFAULT_STATE,
      ...currentState,
      ...updates,
      id: 'current' as const,
      updatedAt: Date.now(),
    }

    if (currentState !== null) {
      calculatorStateCollection.update('current', () => newState)
    } else {
      calculatorStateCollection.insert(newState)
    }
  }

  const setStep = (step: Step) => {
    updateState({ step })
  }

  const setBirthData = (birthData: BirthDataState) => {
    updateState({ birthData, step: 'weights' })
  }

  const setWeights = (weights: PlanetWeights) => {
    updateState({ weights })
  }

  const setResult = (result: CalculationResultState) => {
    updateState({ result, step: 'results' })
  }

  const updateResult = (result: CalculationResultState, weights: PlanetWeights) => {
    updateState({ result, weights })
  }

  const resetState = () => {
    if (currentState !== null) {
      calculatorStateCollection.delete('current')
    }
  }

  return {
    // State
    step: currentState !== null ? currentState.step : DEFAULT_STATE.step,
    birthData: currentState !== null ? currentState.birthData : DEFAULT_STATE.birthData,
    weights: currentState !== null ? currentState.weights : DEFAULT_STATE.weights,
    result: currentState !== null ? currentState.result : DEFAULT_STATE.result,
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
