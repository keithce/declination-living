import { useQuery } from '@tanstack/react-query'
import { convexAction } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import type { UseQueryResult } from '@tanstack/react-query'
import type { BirthData } from '@/components/calculator/BirthDataForm'
import type { PlanetWeights } from '@/components/calculator/PlanetWeights'
import type { FunctionReturnType } from 'convex/server'

// Infer result types from the Convex API
type ZenithResult = FunctionReturnType<typeof api.calculations.zenith.actions.calculateZenithLines>
type ACGResult = FunctionReturnType<typeof api.calculations.acg.actions.calculateACGAndZenithPublic>
type ParansResult = FunctionReturnType<
  typeof api.calculations.parans.actions.calculateParansFromBirthData
>
type ScoringGridResult = FunctionReturnType<
  typeof api.calculations.geospatial.actions.calculateScoringGrid
>
type RankedCitiesResult = FunctionReturnType<
  typeof api.calculations.geospatial.actions.rankTopCities
>

export type { ZenithResult, ACGResult, ParansResult, ScoringGridResult, RankedCitiesResult }

export interface ProgressiveVisualization {
  zenith: UseQueryResult<ZenithResult>
  acg: UseQueryResult<ACGResult>
  parans: UseQueryResult<ParansResult>
  scoringGrid: UseQueryResult<ScoringGridResult>
  rankedCities: UseQueryResult<RankedCitiesResult>
  isAnyLoading: boolean
  progress: number
}

interface BirthArgs {
  birthDate: string
  birthTime: string
  timezone: string
}

const STALE_TIME = 5 * 60 * 1000

export function useProgressiveVisualization(
  birthData: BirthData | null,
  weights: PlanetWeights,
  enabled: boolean,
): ProgressiveVisualization {
  const birthArgs: BirthArgs | null = birthData
    ? {
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        timezone: birthData.birthTimezone,
      }
    : null

  // Layer 1: Zenith (independent, fastest)
  const zenith = useQuery({
    ...convexAction(
      api.calculations.zenith.actions.calculateZenithLines,
      birthArgs ?? ('skip' as const),
    ),
    enabled: enabled && !!birthArgs,
    staleTime: STALE_TIME,
    retry: 3,
  })

  // Layer 2a: ACG Lines (independent)
  const acg = useQuery({
    ...convexAction(
      api.calculations.acg.actions.calculateACGAndZenithPublic,
      birthArgs ?? ('skip' as const),
    ),
    enabled: enabled && !!birthArgs,
    staleTime: STALE_TIME,
    retry: 3,
  })

  // Layer 2b: Parans (independent)
  const parans = useQuery({
    ...convexAction(
      api.calculations.parans.actions.calculateParansFromBirthData,
      birthArgs ?? ('skip' as const),
    ),
    enabled: enabled && !!birthArgs,
    staleTime: STALE_TIME,
    retry: 3,
  })

  // Layer 3a: Scoring Grid (waits for ACG + Parans)
  const scoringGrid = useQuery({
    ...convexAction(
      api.calculations.geospatial.actions.calculateScoringGrid,
      birthArgs ? { ...birthArgs, weights } : ('skip' as const),
    ),
    enabled: enabled && !!birthArgs && acg.isSuccess && parans.isSuccess,
    staleTime: STALE_TIME,
    retry: 3,
  })

  // Layer 3b: Ranked Cities (waits for ACG + Parans)
  const rankedCities = useQuery({
    ...convexAction(
      api.calculations.geospatial.actions.rankTopCities,
      birthArgs ? { ...birthArgs, weights, limit: 10 } : ('skip' as const),
    ),
    enabled: enabled && !!birthArgs && acg.isSuccess && parans.isSuccess,
    staleTime: STALE_TIME,
    retry: 3,
  })

  const queries = [zenith, acg, parans, scoringGrid, rankedCities]
  const isAnyLoading = queries.some((q) => q.isLoading || q.isFetching)
  const progress = queries.filter((q) => q.isSuccess).length / queries.length

  return { zenith, acg, parans, scoringGrid, rankedCities, isAnyLoading, progress }
}
