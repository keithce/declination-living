#!/usr/bin/env bun
/**
 * Seed cities into Convex by reading the local JSON and calling the action.
 *
 * Chunks the data to avoid hitting Convex argument size limits.
 *
 * Usage: bun run scripts/seed-cities.ts [--max=1000]
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, '..', 'data', 'cities.json')

/** Number of cities per action call (keeps JSON arg under ~1MB) */
const CHUNK_SIZE = 2000

// Parse --max flag
const maxArg = process.argv.find((a) => a.startsWith('--max='))
const maxCities = maxArg ? parseInt(maxArg.split('=')[1], 10) : undefined

// Read the deployment URL from .env.local
const envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
const convexUrl = envFile
  .split('\n')
  .find((line) => line.startsWith('CONVEX_URL=') || line.startsWith('VITE_CONVEX_URL='))
  ?.split('=')
  .slice(1)
  .join('=')
  ?.trim()

if (!convexUrl) {
  console.error('Could not find CONVEX_URL or VITE_CONVEX_URL in .env.local')
  process.exit(1)
}

console.log(`Using Convex URL: ${convexUrl}`)
console.log(`Reading ${DATA_FILE}...`)

const allCities = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
const cities = maxCities ? allCities.slice(0, maxCities) : allCities
console.log(`Seeding ${cities.length} cities (of ${allCities.length} total)`)

const client = new ConvexHttpClient(convexUrl)

let totalInserted = 0
const totalChunks = Math.ceil(cities.length / CHUNK_SIZE)

for (let i = 0; i < totalChunks; i++) {
  const start = i * CHUNK_SIZE
  const end = Math.min(start + CHUNK_SIZE, cities.length)
  const chunk = cities.slice(start, end)

  console.log(`Chunk ${i + 1}/${totalChunks}: sending ${chunk.length} cities...`)

  const result = await client.action(api.cities.seed.seedCitiesFromJson, {
    citiesJson: JSON.stringify(chunk),
  })

  totalInserted += result.totalInserted
  console.log(`  Inserted: ${result.totalInserted}`)
}

console.log(`\nDone! Total cities inserted: ${totalInserted}`)
