/**
 * Shared constants for results components
 *
 * Re-exports planet constants from canonical source for backwards compatibility.
 */

// Re-export planet constants from canonical source
export { PLANET_COLORS, PLANET_NAMES, PLANET_SYMBOLS } from '@/lib/planet-constants'

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
