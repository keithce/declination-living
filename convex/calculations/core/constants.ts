/**
 * Astronomical constants for celestial calculations.
 * All angles in degrees unless otherwise noted.
 */

// =============================================================================
// Time Constants
// =============================================================================

/** J2000.0 epoch in Julian Days */
export const J2000 = 2451545.0

/** Julian days per century */
export const JULIAN_DAYS_PER_CENTURY = 36525.0

/** Julian days per year */
export const JULIAN_DAYS_PER_YEAR = 365.25

/** Seconds per day */
export const SECONDS_PER_DAY = 86400

/** Hours per day */
export const HOURS_PER_DAY = 24

// =============================================================================
// Angular Constants
// =============================================================================

/** Degrees per radian */
export const DEG_PER_RAD = 180 / Math.PI

/** Radians per degree */
export const RAD_PER_DEG = Math.PI / 180

/** Degrees per hour (Earth rotation) */
export const DEG_PER_HOUR = 15.0

/** Hours per degree */
export const HOUR_PER_DEG = 1 / 15

/** Degrees per arc minute */
export const DEG_PER_ARCMIN = 1 / 60

/** Degrees per arc second */
export const DEG_PER_ARCSEC = 1 / 3600

// =============================================================================
// Obliquity Constants
// =============================================================================

/**
 * Mean obliquity of the ecliptic at J2000.0 in degrees.
 * This is the angle between Earth's equator and the ecliptic plane.
 * IAU 2006 value: 23°26'21.406"
 */
export const MEAN_OBLIQUITY_J2000 = 23.439291111

/**
 * Rate of change of mean obliquity (degrees per Julian century).
 * Negative because Earth's axial tilt is slowly decreasing.
 */
export const OBLIQUITY_RATE = -0.0130042

/**
 * Current approximate obliquity (for quick OOB checks).
 * For precise calculations, use getObliquity(jd) function.
 */
export const APPROX_OBLIQUITY = 23.44

// =============================================================================
// ACG Calculation Constants
// =============================================================================

/** Longitude step for ACG line calculation (degrees) */
export const ACG_LONGITUDE_STEP = 1.0

/** Latitude step for ACG line calculation (degrees) */
export const ACG_LATITUDE_STEP = 0.5

/** Maximum latitude for ACG calculations (degrees) */
export const ACG_MAX_LATITUDE = 89.5

// =============================================================================
// Paran Calculation Constants
// =============================================================================

/**
 * Bisection tolerance for paran latitude finding (degrees).
 * Converges within 10⁻⁶ degrees; intentional for precision,
 * adjust based on profiling if performance is an issue.
 */
export const PARAN_BISECTION_TOL = 1e-6

/** Maximum bisection iterations for high precision */
export const PARAN_MAX_ITERATIONS = 100

/** Latitude step for initial paran search (degrees) */
export const PARAN_LATITUDE_STEP = 0.25

/** Maximum orb for paran strength calculation (degrees of LST difference) */
export const PARAN_MAX_ORB = 1.0

/** Default strength threshold for filtering weak parans */
export const PARAN_STRENGTH_THRESHOLD = 0.5

/** Default paran strength when not provided */
export const DEFAULT_PARAN_STRENGTH = 0.5

// =============================================================================
// Declination/Zenith Constants
// =============================================================================

/** Default orb for declination alignment (degrees) */
export const DEFAULT_DECLINATION_ORB = 1.0

/** Maximum orb to consider for declination scoring */
export const MAX_DECLINATION_ORB = 10.0

/** Gaussian sigma for declination scoring */
export const DECLINATION_SIGMA = 3.0

// =============================================================================
// Sidereal Time Constants
// =============================================================================

/** GMST at 0h UT1 on J2000.0 (degrees) */
export const GMST_AT_J2000 = 280.46061837

/** GMST rate (degrees per Julian day) */
export const GMST_RATE = 360.98564736629

/** GMST quadratic term coefficient */
export const GMST_QUAD = 0.000387933

/** GMST cubic term coefficient */
export const GMST_CUBIC = -1 / 38710000

// =============================================================================
// Planetary Constants
// =============================================================================

/** Average daily motion in longitude (degrees/day) for rough estimates */
export const AVERAGE_DAILY_MOTION: Record<string, number> = {
  sun: 0.9856,
  moon: 13.176,
  mercury: 1.383,
  venus: 1.2,
  mars: 0.524,
  jupiter: 0.083,
  saturn: 0.033,
  uranus: 0.012,
  neptune: 0.006,
  pluto: 0.004,
}

/** Sidereal period in days */
export const SIDEREAL_PERIODS: Record<string, number> = {
  mercury: 87.97,
  venus: 224.7,
  mars: 686.98,
  jupiter: 4332.59,
  saturn: 10759.22,
  uranus: 30688.5,
  neptune: 60182.0,
  pluto: 90560.0,
}

// =============================================================================
// Numerical Constants
// =============================================================================

/** Small value for floating point comparisons */
export const EPSILON = 1e-10

/** Small angle in degrees for numerical derivatives */
export const DERIVATIVE_STEP = 0.001

/** Speed calculation step in days (for 3-point derivative) */
export const SPEED_CALC_STEP = 0.5

// =============================================================================
// Dignity Point Values
// =============================================================================

export const DIGNITY_POINTS = {
  domicile: 5,
  exaltation: 4,
  triplicity: 3,
  terms: 2,
  face: 1,
  detriment: -5,
  fall: -4,
  peregrine: -5,
} as const

// =============================================================================
// Planet Display Information
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

export const PLANET_COLORS: Record<string, string> = {
  sun: '#FFD700', // Gold
  moon: '#C0C0C0', // Silver
  mercury: '#A0522D', // Sienna
  venus: '#FF69B4', // Hot pink
  mars: '#FF4500', // Red-orange
  jupiter: '#4169E1', // Royal blue
  saturn: '#8B4513', // Saddle brown
  uranus: '#00CED1', // Dark turquoise
  neptune: '#4682B4', // Steel blue
  pluto: '#800080', // Purple
}

// =============================================================================
// Sign Constants
// =============================================================================

export const SIGN_NAMES = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const

export const SIGN_SYMBOLS = [
  '♈',
  '♉',
  '♊',
  '♋',
  '♌',
  '♍',
  '♎',
  '♏',
  '♐',
  '♑',
  '♒',
  '♓',
] as const

export const ZODIAC_ELEMENT_SEQUENCE = [
  'fire',
  'earth',
  'air',
  'water',
  'fire',
  'earth',
  'air',
  'water',
  'fire',
  'earth',
  'air',
  'water',
] as const

export const SIGN_MODALITIES = [
  'cardinal',
  'fixed',
  'mutable',
  'cardinal',
  'fixed',
  'mutable',
  'cardinal',
  'fixed',
  'mutable',
  'cardinal',
  'fixed',
  'mutable',
] as const

// =============================================================================
// Cache Constants
// =============================================================================

/** 30-day cache TTL in milliseconds */
export const CACHE_TTL_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000
