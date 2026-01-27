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
let maxCities: number | undefined
if (maxArg) {
  const parsed = parseInt(maxArg.split('=')[1], 10)
  if (Number.isInteger(parsed) && parsed > 0) {
    maxCities = parsed
  } else {
    console.warn(`Warning: invalid --max value "${maxArg.split('=')[1]}", ignoring flag`)
  }
}

// Read the deployment URL from .env.local
let envFile: string
try {
  envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
} catch (e) {
  console.error('Could not read .env.local — does the file exist?')
  process.exit(1)
}
const convexUrl = envFile
  .split('\n')
  .find((line) => line.startsWith('CONVEX_URL=') || line.startsWith('VITE_CONVEX_URL='))
  ?.split('=')
  .slice(1)
  .join('=')
  ?.trim()
  ?.replace(/^["']|["']$/g, '')

if (!convexUrl) {
  console.error('Could not find CONVEX_URL or VITE_CONVEX_URL in .env.local')
  process.exit(1)
}

console.log(`Using Convex URL: ${convexUrl}`)
console.log(`Reading ${DATA_FILE}...`)

let allCities: Array<unknown>
try {
  allCities = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
} catch (e) {
  console.error(`Failed to read or parse ${DATA_FILE}:`, e instanceof Error ? e.message : e)
  process.exit(1)
}
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

  try {
    const result = await client.action(api.cities.seed.seedCitiesFromJson, {
      citiesJson: JSON.stringify(chunk),
    })

    totalInserted += result.totalInserted
    console.log(`  Inserted: ${result.totalInserted}`)
  } catch (e) {
    console.error(
      `Failed at chunk ${i + 1}/${totalChunks}. ${totalInserted} cities inserted so far.`,
      e instanceof Error ? e.message : e,
    )
    process.exit(1)
  }
}

console.log(`\nDone! Total cities inserted: ${totalInserted}`)
