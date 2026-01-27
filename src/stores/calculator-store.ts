import { useEffect, useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'
import type { StateStorage } from 'zustand/middleware'
import type { PlanetWeights } from '@/components/calculator/PlanetWeights'
import type { Declinations } from '@/components/calculator/DeclinationTable'
import type { ACGLine, ParanPoint, ZenithLine } from '@convex/calculations/core/types'
import type { GridCell } from '@convex/calculations/geospatial/grid'
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

// Phase 2 data schema - permissive since it's complex and refetchable
// We validate structure exists but don't deeply validate all fields
const Phase2DataSchema = z
  .object({
    julianDay: z.number(),
    acgLines: z.array(z.any()),
    zenithLines: z.array(z.any()),
    parans: z.array(z.any()),
    paranSummary: z.any(),
    scoringGrid: z.any(),
    declinations: z.object(planetNumberSchema),
  })
  .nullable()

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
  phase2Data: Phase2DataSchema.optional(),
})

// Types
export type Step = 'birth-data' | 'weights' | 'results'
export type BirthDataState = z.infer<typeof BirthDataSchema>

export interface CalculationResultState {
  declinations: Declinations
  optimalLatitudes: Array<{ latitude: number; score: number; dominantPlanet: string }>
  latitudeBands: Array<{ min: number; max: number; dominantPlanet: string }>
}

// Phase 2 data type (ACG lines, parans, scoring grid, etc.)
// @deprecated Use visualization slice for progressive loading
export interface Phase2DataState {
  julianDay: number
  acgLines: Array<unknown>
  zenithLines: Array<unknown>
  parans: Array<unknown>
  paranSummary: unknown
  scoringGrid: unknown
  declinations: Declinations
}

// =============================================================================
// Visualization State Types (Progressive Loading)
// =============================================================================

/** Individual loading state for a visualization layer */
interface LoadingState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/** Zenith data from domain action */
export interface ZenithData {
  julianDay: number
  zenithLines: Array<ZenithLine>
  declinations: Declinations
}

/** ACG data from domain action */
export interface ACGData {
  julianDay: number
  acgLines: Array<ACGLine>
  zenithLines: Array<ZenithLine>
}

/** Paran data from domain action */
export interface ParanData {
  points: Array<ParanPoint>
  summary: {
    riseRise: number
    riseCulminate: number
    riseSet: number
    culminateCulminate: number
    culminateSet: number
    setSet: number
    total: number
  }
}

/** Scoring grid data from domain action */
export interface ScoringGridData {
  grid: Array<GridCell>
  gridStats: {
    totalCells: number
    maxScore: number
    minScore: number
  }
}

/** Visualization state for progressive loading */
export interface VisualizationState {
  zenith: LoadingState<ZenithData>
  acg: LoadingState<ACGData>
  parans: LoadingState<ParanData>
  scoringGrid: LoadingState<ScoringGridData>
}

/** Initial visualization state */
const initialVisualizationState: VisualizationState = {
  zenith: { data: null, loading: false, error: null },
  acg: { data: null, loading: false, error: null },
  parans: { data: null, loading: false, error: null },
  scoringGrid: { data: null, loading: false, error: null },
}

interface CalculatorState {
  step: Step
  birthData: BirthDataState | null
  weights: PlanetWeights
  result: CalculationResultState | null
  /** @deprecated Use visualization slice instead */
  phase2Data: Phase2DataState | null
  /** Progressive loading visualization state */
  visualization: VisualizationState
}

interface CalculatorActions {
  setStep: (step: Step) => void
  setBirthData: (birthData: BirthDataState) => void
  setWeights: (weights: PlanetWeights) => void
  setResult: (result: CalculationResultState) => void
  /** @deprecated Use setZenithData, setACGData, setParansData, setScoringGridData */
  setPhase2Data: (phase2Data: Phase2DataState | null) => void
  updateResult: (result: CalculationResultState, weights: PlanetWeights) => void
  resetState: () => void

  // Visualization slice actions
  setZenithLoading: (loading: boolean) => void
  setZenithData: (data: ZenithData | null) => void
  setZenithError: (error: string | null) => void
  setACGLoading: (loading: boolean) => void
  setACGData: (data: ACGData | null) => void
  setACGError: (error: string | null) => void
  setParansLoading: (loading: boolean) => void
  setParansData: (data: ParanData | null) => void
  setParansError: (error: string | null) => void
  setScoringGridLoading: (loading: boolean) => void
  setScoringGridData: (data: ScoringGridData | null) => void
  setScoringGridError: (error: string | null) => void
  resetVisualization: () => void
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
          hasPhase2Data: !!state.phase2Data,
          // visualization is transient, not persisted
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
    if (DEBUG_STORAGE) {
      try {
        const parsed = JSON.parse(value)
        console.log('[Calculator Store] Saving state to localStorage:', {
          step: parsed.state?.step,
          hasBirthData: !!parsed.state?.birthData,
          hasResult: !!parsed.state?.result,
          hasPhase2Data: !!parsed.state?.phase2Data,
        })
      } catch {
        // Ignore parse errors in debug logging
      }
    }
    localStorage.setItem(name, value)
  },
  removeItem: (name) => localStorage.removeItem(name),
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
      phase2Data: null,
      visualization: initialVisualizationState,

      // Actions
      setStep: (step) => set({ step }),
      setBirthData: (birthData) => set({ birthData, step: 'weights' }),
      setWeights: (weights) => set({ weights }),
      setResult: (result) => set({ result, step: 'results' }),
      setPhase2Data: (phase2Data) => set({ phase2Data }),
      updateResult: (result, weights) => set({ result, weights }),
      resetState: () =>
        set({
          step: 'birth-data',
          birthData: null,
          weights: DEFAULT_WEIGHTS,
          result: null,
          phase2Data: null,
          visualization: initialVisualizationState,
        }),

      // Visualization slice actions
      setZenithLoading: (loading) =>
        set((state) => ({
          visualization: {
            ...state.visualization,
            zenith: {
              ...state.visualization.zenith,
              loading,
              error: loading ? null : state.visualization.zenith.error,
            },
          },
        })),
      setZenithData: (data) =>
        set((state) => ({
          visualization: {
            ...state.visualization,
            zenith: { data, loading: false, error: null },
          },
        })),
      setZenithError: (error) =>
        set((state) => ({
          visualization: {
            ...state.visualization,
            zenith: { ...state.visualization.zenith, loading: false, error },
          },
        })),

      setACGLoading: (loading) =>
        set((state) => ({
          visualization: {
            ...state.visualization,
            acg: {
              ...state.visualization.acg,
              loading,
              error: loading ? null : state.visualization.acg.error,
            },
          },
        })),
      setACGData: (data) =>
        set((state) => ({
          visualization: {
            ...state.visualization,
            acg: { data, loading: false, error: null },
          },
        })),
      setACGError: (error) =>
        set((state) => ({
          visualization: {
            ...state.visualization,
            acg: { ...state.visualization.acg, loading: false, error },
          },
        })),

      setParansLoading: (loading) =>
        set((state) => ({
          visualization: {
            ...state.visualization,
            parans: {
              ...state.visualization.parans,
              loading,
              error: loading ? null : state.visualization.parans.error,
            },
          },
        })),
      setParansData: (data) =>
        set((state) => ({
          visualization: {
            ...state.visualization,
            parans: { data, loading: false, error: null },
          },
        })),
      setParansError: (error) =>
        set((state) => ({
          visualization: {
            ...state.visualization,
            parans: { ...state.visualization.parans, loading: false, error },
          },
        })),

      setScoringGridLoading: (loading) =>
        set((state) => ({
          visualization: {
            ...state.visualization,
            scoringGrid: {
              ...state.visualization.scoringGrid,
              loading,
              error: loading ? null : state.visualization.scoringGrid.error,
            },
          },
        })),
      setScoringGridData: (data) =>
        set((state) => ({
          visualization: {
            ...state.visualization,
            scoringGrid: { data, loading: false, error: null },
          },
        })),
      setScoringGridError: (error) =>
        set((state) => ({
          visualization: {
            ...state.visualization,
            scoringGrid: { ...state.visualization.scoringGrid, loading: false, error },
          },
        })),

      resetVisualization: () => set({ visualization: initialVisualizationState }),
    }),
    {
      name: STORAGE_KEY,
      version: 3, // Bump version for visualization slice
      storage: createJSONStorage(() => createValidatedStorage()),
      partialize: (state) => ({
        step: state.step,
        birthData: state.birthData,
        weights: state.weights,
        result: state.result,
        phase2Data: state.phase2Data,
        // Note: visualization state is not persisted - it's transient and refetchable
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
