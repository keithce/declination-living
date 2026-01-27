import { useEffect, useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'
import type { StateStorage } from 'zustand/middleware'
import type { PlanetWeights } from '@/components/calculator/PlanetWeights'
import type { Declinations } from '@/components/calculator/DeclinationTable'
import { DEFAULT_WEIGHTS } from '@/components/calculator/PlanetWeights'

const DEBUG_STORAGE = import.meta.env.DEV

// Shared planet keys for consistent schema definitions
const PLANET_KEYS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
] as const

const planetNumberSchema = Object.fromEntries(
  PLANET_KEYS.map((key) => [key, z.number()]),
) as Record<(typeof PLANET_KEYS)[number], z.ZodNumber>

export const BirthDataSchema = z.object({
  birthDate: z.string(),
  birthTime: z.string(),
  birthCity: z.string(),
  birthCountry: z.string(),
  birthLatitude: z.number(),
  birthLongitude: z.number(),
  birthTimezone: z.string(),
})

const PersistedStateSchema = z.object({
  step: z.enum(['birth-data', 'weights', 'results']),
  birthData: BirthDataSchema.nullable(),
  weights: z.object(planetNumberSchema),
  result: z
    .object({
      declinations: z.object(planetNumberSchema),
      optimalLatitudes: z.array(
        z.object({
          latitude: z.number(),
          score: z.number(),
          dominantPlanet: z.string(),
        }),
      ),
      latitudeBands: z.array(
        z.object({
          min: z.number(),
          max: z.number(),
          dominantPlanet: z.string(),
        }),
      ),
    })
    .nullable(),
})

// Types
export type Step = 'birth-data' | 'weights' | 'results'
export type BirthDataState = z.infer<typeof BirthDataSchema>

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

interface CalculatorActions {
  setStep: (step: Step) => void
  setBirthData: (birthData: BirthDataState) => void
  setWeights: (weights: PlanetWeights) => void
  setResult: (result: CalculationResultState) => void
  updateResult: (result: CalculationResultState, weights: PlanetWeights) => void
  resetState: () => void
}

type CalculatorStore = CalculatorState & CalculatorActions

const STORAGE_KEY = 'declination-calculator-state'

// Validated storage with Zod - validates on read to handle schema migrations
const createValidatedStorage = (): StateStorage => ({
  getItem: (name) => {
    if (typeof window === 'undefined') return null
    const str = localStorage.getItem(name)
    if (!str) {
      if (DEBUG_STORAGE) console.log('[Calculator Store] No persisted state found')
      return null
    }

    try {
      const parsed = JSON.parse(str)
      const validation = PersistedStateSchema.safeParse(parsed.state)
      if (!validation.success) {
        console.warn('[Calculator Store] Invalid state schema, resetting:', validation.error.issues)
        localStorage.removeItem(name)
        return null
      }

      // Validate state consistency
      const state = validation.data
      if (state.step === 'weights' && !state.birthData) {
        console.warn('[Calculator Store] Invalid state: weights step without birthData, resetting')
        localStorage.removeItem(name)
        return null
      }
      if (state.step === 'results' && (!state.birthData || !state.result)) {
        console.warn('[Calculator Store] Invalid state: results step without data, resetting')
        localStorage.removeItem(name)
        return null
      }

      if (DEBUG_STORAGE) {
        console.log('[Calculator Store] Loaded state from localStorage:', {
          step: state.step,
          hasBirthData: !!state.birthData,
          hasResult: !!state.result,
        })
      }

      return str
    } catch (e) {
      console.warn('[Calculator Store] Failed to parse localStorage:', e)
      localStorage.removeItem(name)
      return null
    }
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return
    if (DEBUG_STORAGE) {
      try {
        const parsed = JSON.parse(value)
        console.log('[Calculator Store] Saving state to localStorage:', {
          step: parsed.state?.step,
          hasBirthData: !!parsed.state?.birthData,
          hasResult: !!parsed.state?.result,
        })
      } catch {
        // Ignore parse errors in debug logging
      }
    }
    localStorage.setItem(name, value)
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(name)
  },
})

// Store
export const useCalculatorStore = create<CalculatorStore>()(
  persist(
    (set) => ({
      // State
      step: 'birth-data',
      birthData: null,
      weights: DEFAULT_WEIGHTS,
      result: null,

      // Actions
      setStep: (step) => set({ step }),
      setBirthData: (birthData) => set({ birthData, step: 'weights' }),
      setWeights: (weights) => set({ weights }),
      setResult: (result) => set({ result, step: 'results' }),
      updateResult: (result, weights) => set({ result, weights }),
      resetState: () =>
        set({
          step: 'birth-data',
          birthData: null,
          weights: DEFAULT_WEIGHTS,
          result: null,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 6, // Bump: visualization state removed (now managed by TanStack Query)
      storage: createJSONStorage(() => createValidatedStorage()),
      partialize: (state) => ({
        step: state.step,
        birthData: state.birthData,
        weights: state.weights,
        result: state.result,
      }),
    },
  ),
)

/**
 * Hook to track hydration status of the calculator store.
 * Returns true when the store has finished loading from localStorage.
 *
 * Uses useSyncExternalStore to properly subscribe to Zustand's persist API.
 */
export function useCalculatorHydration() {
  const hasHydrated = useSyncExternalStore(
    useCalculatorStore.persist.onFinishHydration,
    () => useCalculatorStore.persist.hasHydrated(),
    () => false, // Server snapshot - always false
  )

  useEffect(() => {
    if (DEBUG_STORAGE) {
      console.log('[Calculator Store] Hydration status:', hasHydrated)
    }
  }, [hasHydrated])

  return hasHydrated
}
