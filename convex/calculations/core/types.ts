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
    culminateSet: number
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
    zenithPlanets: Array<PlanetId>
    paranCount: number
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

// =============================================================================
// Swiss Ephemeris Types
// =============================================================================

/**
 * Core interface for a calculated planetary body.
 * PDF Reference: Part II, Section 2.3
 * Normalized to J2000 epoch where applicable.
 */
export interface CelestialBody {
  /** Swiss Ephemeris body ID (e.g., 0 = Sun) */
  id: number
  /** Display name */
  name: string
  /** Internal planet identifier */
  planetId: PlanetId
  /** Ecliptic coordinates */
  ecliptic: {
    /** 0-360 degrees */
    longitude: number
    /** +/- 90 degrees */
    latitude: number
    /** Distance in AU */
    distance: number
    /** Degrees per day */
    speed: number
  }
  /** Equatorial coordinates */
  equatorial: {
    /** 0-360 degrees (converted from hours) */
    rightAscension: number
    /** +/- 90 degrees */
    declination: number
    /** Degrees per day (critical for station detection) */
    speedDec: number
    /** RA speed in degrees per day */
    speedRA: number
  }
  /** Is the planet retrograde? */
  isRetrograde: boolean
  /** Is the planet out of bounds? */
  isOutOfBounds: boolean
  /** How far beyond obliquity (only if OOB) */
  oobDegrees?: number
  /** House position (only if location provided) */
  house?: number
}

/**
 * Configuration for the calculation request.
 * PDF Reference: Part II, Section 2.3
 */
export interface EphemerisConfig {
  /** Date/time in UTC */
  date: Date
  /** Observer location (optional) */
  location?: {
    latitude: number
    longitude: number
    /** Meters above sea level, defaults to 0 */
    altitude?: number
  }
  /** Bitwise flags for swisseph options */
  flags: number
  /** Array of body IDs to calculate */
  bodies: Array<number>
}

/**
 * Complete calculation result returned to the UI
 */
export interface CompleteCalculationResult {
  /** All celestial body positions */
  celestialBodies: Array<CelestialBody>
  /** Simplified declinations map */
  declinations: PlanetDeclinations
  /** Out of bounds planets */
  outOfBounds: Array<CelestialBody>
  /** Essential dignities for all planets */
  dignities: Record<PlanetId, DignityScore>
  /** Zenith lines for all planets */
  zenithLines: Array<ZenithLine>
  /** ACG lines (4 per planet) */
  acgLines: Array<ACGLine>
  /** Paran analysis */
  parans: ParanResult
  /** Vibe search results */
  vibeSearch: GeospatialSearchResult
  /** Calculation metadata */
  metadata: {
    calculatedAt: number
    julianDay: number
    greenwichSiderealTime: number
    obliquity: number
    /** Day or night chart for sect-based calculations */
    sect: 'day' | 'night'
  }
}

/**
 * Map planet ID to Swiss Ephemeris body ID
 */
export const PLANET_TO_SE_ID: Record<PlanetId, number> = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
  uranus: 7,
  neptune: 8,
  pluto: 9,
}

/**
 * Map Swiss Ephemeris body ID to planet ID
 */
export const SE_ID_TO_PLANET: Record<number, PlanetId> = {
  0: 'sun',
  1: 'moon',
  2: 'mercury',
  3: 'venus',
  4: 'mars',
  5: 'jupiter',
  6: 'saturn',
  7: 'uranus',
  8: 'neptune',
  9: 'pluto',
}

/**
 * Planet display names
 */
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
