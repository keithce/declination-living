/**
 * Core types for the Celestial Sphere Engineering system.
 * Defines planet identifiers, coordinate interfaces, and ACG/Paran types.
 */

// =============================================================================
// Planet Types
// =============================================================================

export type PlanetId =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'

export const PLANET_IDS: ReadonlyArray<PlanetId> = [
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

// =============================================================================
// Coordinate Types
// =============================================================================

/** Ecliptic coordinates (heliocentric or geocentric) */
export interface EclipticCoordinates {
  /** Ecliptic longitude in degrees (0-360) */
  longitude: number
  /** Ecliptic latitude in degrees (-90 to +90) */
  latitude: number
  /** Distance from Sun/Earth in AU */
  distance?: number
}

/** Equatorial coordinates */
export interface EquatorialCoordinates {
  /** Right Ascension in degrees (0-360) */
  ra: number
  /** Declination in degrees (-90 to +90) */
  dec: number
  /** Distance from Earth in AU */
  distance?: number
}

/** Horizontal coordinates (observer-centric) */
export interface HorizontalCoordinates {
  /** Azimuth in degrees (0-360, N=0, E=90) */
  azimuth: number
  /** Altitude in degrees (-90 to +90) */
  altitude: number
}

/** Geographic location on Earth */
export interface GeoLocation {
  /** Latitude in degrees (-90 to +90) */
  latitude: number
  /** Longitude in degrees (-180 to +180) */
  longitude: number
}

/** Complete planetary position data */
export interface PlanetPosition {
  id: PlanetId
  ecliptic: EclipticCoordinates
  equatorial: EquatorialCoordinates
  /** Daily motion in longitude (degrees/day), negative = retrograde */
  longitudeSpeed?: number
  /** Daily motion in declination (degrees/day) */
  declinationSpeed?: number
  /** Whether planet is retrograde */
  isRetrograde?: boolean
  /** Whether planet is out-of-bounds (|dec| > obliquity) */
  isOOB?: boolean
  /** Degrees beyond the obliquity limit (only if OOB) */
  oobDegrees?: number
}

/** Map of all planet positions */
export type PlanetPositions = Record<PlanetId, PlanetPosition>

/** Map of planet declinations only (simplified for scoring) */
export type PlanetDeclinations = Record<PlanetId, number>

/** Map of planet weights for scoring */
export type PlanetWeights = Record<PlanetId, number>

// =============================================================================
// ACG (Astro*Carto*Graphy) Types
// =============================================================================

/** Types of angular lines in ACG mapping */
export type ACGLineType = 'ASC' | 'DSC' | 'MC' | 'IC'

/** ACG line data - a planetary line on the globe */
export interface ACGLine {
  planet: PlanetId
  lineType: ACGLineType
  /** Array of lat/lon points forming the line */
  points: Array<GeoLocation>
  /** Whether this is a circumpolar case (line doesn't exist at some latitudes) */
  isCircumpolar?: boolean
}

// =============================================================================
// Zenith Types
// =============================================================================

/** Zenith line - latitude where planet is directly overhead */
export interface ZenithLine {
  planet: PlanetId
  /** The declination of the planet (equals zenith latitude) */
  declination: number
  /** Minimum latitude of the band (declination - orb) */
  orbMin: number
  /** Maximum latitude of the band (declination + orb) */
  orbMax: number
}

// =============================================================================
// Paran Types
// =============================================================================

/** Angular events for paran calculations */
export type AngularEvent = 'rise' | 'set' | 'culminate' | 'anti_culminate'

/** Display names for angular events */
export const ANGULAR_EVENT_NAMES: Record<AngularEvent, string> = {
  rise: 'Rising',
  set: 'Setting',
  culminate: 'Culminating',
  anti_culminate: 'Anti-culminating',
}

/** A paran intersection point */
export interface ParanPoint {
  planet1: PlanetId
  event1: AngularEvent
  planet2: PlanetId
  event2: AngularEvent
  /** Latitude where this paran occurs */
  latitude: number
  /** Strength of the paran (1.0 = exact, decreases with separation) */
  strength?: number
}

/** Full paran analysis result */
export interface ParanResult {
  /** All paran points found */
  points: Array<ParanPoint>
  /** Count by event type combinations */
  summary: {
    riseRise: number
    riseCulminate: number
    riseSet: number
    culminateCulminate: number
    setSet: number
    total: number
  }
}

// =============================================================================
// Semi-Diurnal Arc Types
// =============================================================================

/** Semi-diurnal arc result */
export interface SemiDiurnalArc {
  /** Half the time from rise to set in degrees (0-180) */
  sda: number
  /** Whether the object never sets at this latitude */
  neverSets: boolean
  /** Whether the object never rises at this latitude */
  neverRises: boolean
  /** Hour angle at rising (negative) */
  riseHA?: number
  /** Hour angle at setting (positive) */
  setHA?: number
}

// =============================================================================
// Dignity Types
// =============================================================================

/** Zodiac signs (0-indexed for array access) */
export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces'

export const ZODIAC_SIGNS: ReadonlyArray<ZodiacSign> = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const

/** Sign and degree position within the zodiac */
export interface SignPosition {
  sign: ZodiacSign
  signIndex: number
  /** Degree within the sign (0-30) */
  degree: number
  /** Minute within the degree (0-60) */
  minute: number
}

/** Complete dignity score for a planet */
export interface DignityScore {
  planet: PlanetId
  /** Domicile rulership (+5) */
  domicile: number
  /** Exaltation (+4) */
  exaltation: number
  /** Triplicity rulership (+3) */
  triplicity: number
  /** Terms/bounds (+2) */
  terms: number
  /** Face/decan (+1) */
  face: number
  /** Detriment (-5) */
  detriment: number
  /** Fall (-4) */
  fall: number
  /** Peregrine penalty (-5 if no positive dignity) */
  peregrine: number
  /** Total score */
  total: number
  /** Human-readable breakdown */
  breakdown: Array<string>
}

// =============================================================================
// Vibe/Search Types
// =============================================================================

/** Vibe category for location search */
export interface VibeCategory {
  id: string
  name: string
  description: string
  keywords: Array<string>
  primaryPlanets: Array<PlanetId>
  weights: PlanetWeights
}

/** Geospatial search result */
export interface GeospatialSearchResult {
  /** Latitude bands with high scores */
  bands: Array<{
    minLat: number
    maxLat: number
    score: number
    dominantPlanets: Array<PlanetId>
  }>
  /** Specific paran latitudes */
  paranLatitudes: Array<{
    latitude: number
    parans: Array<ParanPoint>
  }>
  /** Combined optimal latitudes */
  optimalLatitudes: Array<number>
}

// =============================================================================
// Safety Filter Types
// =============================================================================

/** Safety score for a relocated chart */
export interface SafetyScore {
  /** Overall safety score (0-100, higher = safer) */
  overall: number
  /** Planets in challenging houses (6, 8, 12) */
  challengingPlacements: Array<{
    planet: PlanetId
    house: number
  }>
  /** Hard aspects to ASC/MC */
  difficultAspects: Array<{
    planet: PlanetId
    aspect: string
    target: 'ASC' | 'MC'
  }>
  /** Planets with poor dignity */
  weakDignity: Array<{
    planet: PlanetId
    score: number
  }>
  /** Warnings for the user */
  warnings: Array<string>
}
