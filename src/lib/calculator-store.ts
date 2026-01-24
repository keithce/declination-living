import { createCollection, localStorageCollectionOptions } from '@tanstack/react-db'
import { z } from 'zod'

// Schema for birth data
const birthDataSchema = z.object({
  birthDate: z.string(),
  birthTime: z.string(),
  birthCity: z.string(),
  birthCountry: z.string(),
  birthLatitude: z.number(),
  birthLongitude: z.number(),
  birthTimezone: z.string(),
})

// Schema for planet weights
const planetWeightsSchema = z.object({
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

// Schema for calculation result
const calculationResultSchema = z.object({
  declinations: z.object({
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
  }),
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

// Complete calculator state schema
const calculatorStateSchema = z.object({
  id: z.literal('current'),
  step: z.enum(['birth-data', 'weights', 'results']),
  birthData: birthDataSchema.nullable(),
  weights: planetWeightsSchema,
  result: calculationResultSchema.nullable(),
  updatedAt: z.number(),
})

export type CalculatorState = z.infer<typeof calculatorStateSchema>
export type BirthDataState = z.infer<typeof birthDataSchema>
export type CalculationResultState = z.infer<typeof calculationResultSchema>

export const calculatorStateCollection = createCollection(
  localStorageCollectionOptions({
    id: 'calculator-state',
    storageKey: 'declination-calculator-state',
    getKey: (item) => item.id,
    schema: calculatorStateSchema,
  }),
)
