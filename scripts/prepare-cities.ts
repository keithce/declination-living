#!/usr/bin/env bun
/**
 * City Data Preparation Script
 *
 * Downloads and transforms GeoNames cities15000 data for Convex seeding.
 * Run with: bun run scripts/prepare-cities.ts
 */

import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const OUTPUT_FILE = join(DATA_DIR, 'cities.json')
const CITIES_URL = 'https://download.geonames.org/export/dump/cities15000.zip'
const TEMP_ZIP = join(DATA_DIR, 'cities15000.zip')
const TEMP_TXT = join(DATA_DIR, 'cities15000.txt')

// GeoNames TSV column indices
const COL = {
  GEONAME_ID: 0,
  NAME: 1,
  ASCII_NAME: 2,
  ALTERNATE_NAMES: 3,
  LATITUDE: 4,
  LONGITUDE: 5,
  FEATURE_CLASS: 6,
  FEATURE_CODE: 7,
  COUNTRY_CODE: 8,
  CC2: 9,
  ADMIN1_CODE: 10, // State/Province
  ADMIN2_CODE: 11,
  ADMIN3_CODE: 12,
  ADMIN4_CODE: 13,
  POPULATION: 14,
  ELEVATION: 15,
  DEM: 16,
  TIMEZONE: 17,
  MODIFICATION_DATE: 18,
} as const

// Country code to name mapping (common countries)
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  JP: 'Japan',
  CN: 'China',
  IN: 'India',
  BR: 'Brazil',
  MX: 'Mexico',
  RU: 'Russia',
  KR: 'South Korea',
  NL: 'Netherlands',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  PT: 'Portugal',
  IE: 'Ireland',
  NZ: 'New Zealand',
  ZA: 'South Africa',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  VE: 'Venezuela',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
  ID: 'Indonesia',
  MY: 'Malaysia',
  SG: 'Singapore',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  IL: 'Israel',
  TR: 'Turkey',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  GH: 'Ghana',
  MA: 'Morocco',
  GR: 'Greece',
  CZ: 'Czech Republic',
  HU: 'Hungary',
  RO: 'Romania',
  UA: 'Ukraine',
  SK: 'Slovakia',
  HR: 'Croatia',
  RS: 'Serbia',
  BG: 'Bulgaria',
  SI: 'Slovenia',
}

interface CityRecord {
  name: string
  nameAscii: string
  country: string
  countryCode: string
  state: string | undefined
  latitude: number
  longitude: number
  population: number
  timezone: string
  tier: 'major' | 'medium' | 'minor' | 'small'
}

/**
 * Determine city tier based on population.
 */
function getTier(population: number): CityRecord['tier'] {
  if (population >= 500000) return 'major'
  if (population >= 100000) return 'medium'
  if (population >= 50000) return 'minor'
  return 'small'
}

/**
 * Download a file from URL.
 */
async function downloadFile(url: string, dest: string): Promise<void> {
  console.log(`Downloading ${url}...`)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    writeFileSync(dest, Buffer.from(buffer))
    console.log(`Downloaded to ${dest}`)
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Extract zip file using Bun's native capabilities.
 */
async function extractZip(zipPath: string, destDir: string): Promise<void> {
  console.log(`Extracting ${zipPath}...`)
  const proc = Bun.spawn(['unzip', '-o', zipPath, '-d', destDir], {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  await proc.exited
  if (proc.exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(
      `Failed to extract zip: exit code ${proc.exitCode}${stderr ? `\n${stderr}` : ''}`,
    )
  }
  console.log('Extracted successfully')
}

/**
 * Parse TSV line into city record.
 */
function parseLine(line: string): CityRecord | null {
  const cols = line.trim().split('\t')
  if (cols.length < 18) return null

  const population = parseInt(cols[COL.POPULATION], 10)
  if (isNaN(population) || population < 15000) return null

  const latitude = parseFloat(cols[COL.LATITUDE])
  const longitude = parseFloat(cols[COL.LONGITUDE])
  if (isNaN(latitude) || isNaN(longitude)) return null

  const countryCode = cols[COL.COUNTRY_CODE]
  const country = COUNTRY_NAMES[countryCode] || countryCode

  return {
    name: cols[COL.NAME],
    nameAscii: cols[COL.ASCII_NAME] || cols[COL.NAME],
    country,
    countryCode,
    state: cols[COL.ADMIN1_CODE] || undefined,
    latitude,
    longitude,
    population,
    timezone: cols[COL.TIMEZONE] || 'UTC',
    tier: getTier(population),
  }
}

/**
 * Process the cities file and generate JSON.
 */
async function processCities(): Promise<void> {
  console.log(`Reading ${TEMP_TXT}...`)
  const file = Bun.file(TEMP_TXT)
  const text = await file.text()
  const lines = text.split('\n')

  console.log(`Processing ${lines.length} lines...`)

  const cities: Array<CityRecord> = []
  let skipped = 0

  for (const line of lines) {
    if (!line.trim()) continue

    const city = parseLine(line)
    if (city) {
      cities.push(city)
    } else {
      skipped++
    }
  }

  // Sort by population descending
  cities.sort((a, b) => b.population - a.population)

  // Log stats
  const stats = {
    total: cities.length,
    skipped,
    byTier: {
      major: cities.filter((c) => c.tier === 'major').length,
      medium: cities.filter((c) => c.tier === 'medium').length,
      minor: cities.filter((c) => c.tier === 'minor').length,
      small: cities.filter((c) => c.tier === 'small').length,
    },
  }

  console.log('Stats:', stats)

  // Write JSON
  console.log(`Writing ${OUTPUT_FILE}...`)
  writeFileSync(OUTPUT_FILE, JSON.stringify(cities, null, 2))
  console.log(`Done! Wrote ${cities.length} cities`)
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  // Ensure data directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  // Check if we already have the txt file
  if (!existsSync(TEMP_TXT)) {
    // Download if we don't have the zip
    if (!existsSync(TEMP_ZIP)) {
      await downloadFile(CITIES_URL, TEMP_ZIP)
    }
    await extractZip(TEMP_ZIP, DATA_DIR)
  } else {
    console.log('Using existing cities15000.txt')
  }

  await processCities()
}

main().catch(console.error)
