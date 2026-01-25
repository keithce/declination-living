/**
 * Canonical source for planet display constants (frontend).
 *
 * All frontend components should import from here.
 * Convex backend has its own constants at convex/calculations/core/constants.ts
 */

// =============================================================================
// Planet Colors
// =============================================================================

export const PLANET_COLORS: Record<string, string> = {
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

export const PLANET_SYMBOLS: Record<string, string> = {
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

export const PLANET_NAMES: Record<string, string> = {
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
