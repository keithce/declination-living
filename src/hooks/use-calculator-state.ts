import { useLiveQuery, eq } from '@tanstack/react-db'
import {
  calculatorStateCollection,
  type CalculatorState,
  type BirthDataState,
  type CalculationResultState,
} from '@/lib/calculator-store'
import { DEFAULT_WEIGHTS, type PlanetWeights } from '@/components/calculator/PlanetWeights'

type Step = 'birth-data' | 'weights' | 'results'

const DEFAULT_STATE: Omit<CalculatorState, 'id'> = {
  step: 'birth-data',
  birthData: null,
  weights: DEFAULT_WEIGHTS,
  result: null,
  updatedAt: Date.now(),
}

export function useCalculatorState() {
  const { data, isLoading } = useLiveQuery((q) =>
    q.from({ state: calculatorStateCollection }).where(({ state }) => eq(state.id, 'current'))
  )

  const currentState = data?.[0] ?? null

  const updateState = (updates: Partial<Omit<CalculatorState, 'id'>>) => {
    const newState: CalculatorState = {
      ...DEFAULT_STATE,
      ...currentState,
      ...updates,
      id: 'current' as const,
      updatedAt: Date.now(),
    }

    if (currentState) {
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
    if (currentState) {
      calculatorStateCollection.delete('current')
    }
  }

  return {
    // State
    step: currentState?.step ?? DEFAULT_STATE.step,
    birthData: currentState?.birthData ?? DEFAULT_STATE.birthData,
    weights: currentState?.weights ?? DEFAULT_STATE.weights,
    result: currentState?.result ?? DEFAULT_STATE.result,
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
