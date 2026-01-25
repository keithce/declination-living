/**
 * Shared constants for results components
 */

import type { PlanetId } from '@/../convex/calculations/core/types'

// =============================================================================
// Planet Colors
// =============================================================================

export const PLANET_COLORS: Record<PlanetId, string> = {
  sun: '#fbbf24',
  moon: '#e2e8f0',
  mercury: '#a78bfa',
  venus: '#f472b6',
  mars: '#ef4444',
  jupiter: '#f97316',
  saturn: '#78716c',
  uranus: '#22d3ee',
  neptune: '#818cf8',
  pluto: '#a3a3a3',
}

// =============================================================================
// Planet Symbols
// =============================================================================

export const PLANET_SYMBOLS: Record<PlanetId, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
}

// =============================================================================
// Planet Names
// =============================================================================

export const PLANET_NAMES: Record<PlanetId, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
}

// =============================================================================
// ACG Line Type Labels
// =============================================================================

export const ACG_LINE_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  MC: { label: 'MC (Midheaven)', description: 'Planet at highest point in sky' },
  IC: { label: 'IC (Imum Coeli)', description: 'Planet at lowest point in sky' },
  ASC: { label: 'ASC (Ascendant)', description: 'Planet rising on eastern horizon' },
  DSC: { label: 'DSC (Descendant)', description: 'Planet setting on western horizon' },
}

// =============================================================================
// Angular Event Labels
// =============================================================================

export const ANGULAR_EVENT_LABELS: Record<string, string> = {
  rise: 'Rising',
  set: 'Setting',
  culminate: 'Culminating',
  anti_culminate: 'Anti-Culminating',
}

// =============================================================================
// Format Helpers
// =============================================================================

export function formatLatitude(lat: number): string {
  const direction = lat >= 0 ? 'N' : 'S'
  return `${Math.abs(lat).toFixed(1)}° ${direction}`
}

export function formatLongitude(lon: number): string {
  const direction = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lon).toFixed(1)}° ${direction}`
}

export function formatDeclination(dec: number): string {
  const direction = dec >= 0 ? 'N' : 'S'
  return `${Math.abs(dec).toFixed(2)}° ${direction}`
}
