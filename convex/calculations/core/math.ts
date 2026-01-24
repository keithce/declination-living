/**
 * Mathematical utility functions for celestial calculations.
 * Provides trigonometric functions with degree inputs and numerical solvers.
 */

import {
  DEG_PER_RAD,
  EPSILON,
  PARAN_BISECTION_TOL,
  PARAN_MAX_ITERATIONS,
  RAD_PER_DEG,
} from './constants'

// =============================================================================
// Angle Normalization
// =============================================================================

/**
 * Normalize an angle to the range [0, 360).
 */
export function normalizeDegrees(degrees: number): number {
  const result = degrees % 360
  return result < 0 ? result + 360 : result
}

/**
 * Normalize an angle to the range [-180, 180).
 */
export function normalizeDegreesSymmetric(degrees: number): number {
  let result = normalizeDegrees(degrees)
  if (result >= 180) result -= 360
  return result
}

/**
 * Normalize an angle to the range [0, 2π).
 */
export function normalizeRadians(radians: number): number {
  const twoPi = 2 * Math.PI
  const result = radians % twoPi
  return result < 0 ? result + twoPi : result
}

/**
 * Normalize an hour angle to the range [-12, 12) hours.
 */
export function normalizeHourAngle(hours: number): number {
  let result = hours % 24
  if (result < -12) result += 24
  if (result >= 12) result -= 24
  return result
}

// =============================================================================
// Trigonometric Functions with Degree Input
// =============================================================================

/**
 * Sine of an angle in degrees.
 */
export function sinDeg(degrees: number): number {
  return Math.sin(degrees * RAD_PER_DEG)
}

/**
 * Cosine of an angle in degrees.
 */
export function cosDeg(degrees: number): number {
  return Math.cos(degrees * RAD_PER_DEG)
}

/**
 * Tangent of an angle in degrees.
 */
export function tanDeg(degrees: number): number {
  return Math.tan(degrees * RAD_PER_DEG)
}

/**
 * Arcsine returning degrees.
 */
export function asinDeg(x: number): number {
  // Clamp to valid range to avoid NaN from floating point errors
  const clamped = Math.max(-1, Math.min(1, x))
  return Math.asin(clamped) * DEG_PER_RAD
}

/**
 * Arccosine returning degrees.
 */
export function acosDeg(x: number): number {
  // Clamp to valid range to avoid NaN from floating point errors
  const clamped = Math.max(-1, Math.min(1, x))
  return Math.acos(clamped) * DEG_PER_RAD
}

/**
 * Arctangent returning degrees.
 */
export function atanDeg(x: number): number {
  return Math.atan(x) * DEG_PER_RAD
}

/**
 * Two-argument arctangent returning degrees.
 */
export function atan2Deg(y: number, x: number): number {
  return Math.atan2(y, x) * DEG_PER_RAD
}

// =============================================================================
// Conversion Functions
// =============================================================================

/**
 * Convert degrees to radians.
 */
export function toRadians(degrees: number): number {
  return degrees * RAD_PER_DEG
}

/**
 * Convert radians to degrees.
 */
export function toDegrees(radians: number): number {
  return radians * DEG_PER_RAD
}

/**
 * Convert degrees to hours (for RA).
 */
export function degreesToHours(degrees: number): number {
  return degrees / 15
}

/**
 * Convert hours to degrees.
 */
export function hoursToDegrees(hours: number): number {
  return hours * 15
}

/**
 * Convert decimal degrees to degrees, minutes, seconds.
 */
export function toDMS(decimal: number): {
  degrees: number
  minutes: number
  seconds: number
  sign: 1 | -1
} {
  const sign = decimal < 0 ? -1 : 1
  const abs = Math.abs(decimal)
  const degrees = Math.floor(abs)
  const minFloat = (abs - degrees) * 60
  const minutes = Math.floor(minFloat)
  const seconds = (minFloat - minutes) * 60
  return { degrees, minutes, seconds, sign }
}

/**
 * Convert degrees, minutes, seconds to decimal degrees.
 */
export function fromDMS(degrees: number, minutes: number, seconds: number): number {
  const sign = degrees < 0 ? -1 : 1
  return sign * (Math.abs(degrees) + minutes / 60 + seconds / 3600)
}

/**
 * Convert decimal hours to hours, minutes, seconds.
 */
export function toHMS(decimal: number): { hours: number; minutes: number; seconds: number } {
  const abs = Math.abs(decimal)
  const hours = Math.floor(abs)
  const minFloat = (abs - hours) * 60
  const minutes = Math.floor(minFloat)
  const seconds = (minFloat - minutes) * 60
  return { hours, minutes, seconds }
}

// =============================================================================
// Numerical Solvers
// =============================================================================

/**
 * Result of a root-finding operation.
 */
export interface BisectionResult {
  /** The root found, or null if no root exists */
  root: number | null
  /** Number of iterations used */
  iterations: number
  /** Whether the solver converged */
  converged: boolean
  /** Final function value at root (should be ~0) */
  residual?: number
}

/**
 * Bisection method root finder.
 * Finds x where f(x) = 0 in the interval [a, b].
 *
 * @param f - Function to find root of
 * @param a - Lower bound of search interval
 * @param b - Upper bound of search interval
 * @param tolerance - Convergence tolerance (default from constants)
 * @param maxIterations - Maximum iterations (default from constants)
 * @returns BisectionResult with root or null if no sign change
 */
export function bisectionSolve(
  f: (x: number) => number,
  a: number,
  b: number,
  tolerance: number = PARAN_BISECTION_TOL,
  maxIterations: number = PARAN_MAX_ITERATIONS,
): BisectionResult {
  let fa = f(a)
  let fb = f(b)

  // Check if there's a sign change
  if (fa * fb > 0) {
    // No sign change, check if either endpoint is a root
    if (Math.abs(fa) < tolerance) {
      return { root: a, iterations: 0, converged: true, residual: fa }
    }
    if (Math.abs(fb) < tolerance) {
      return { root: b, iterations: 0, converged: true, residual: fb }
    }
    return { root: null, iterations: 0, converged: false }
  }

  // Bisection loop
  let iterations = 0
  while (iterations < maxIterations) {
    const mid = (a + b) / 2
    const fm = f(mid)

    if (Math.abs(fm) < tolerance || (b - a) / 2 < tolerance) {
      return { root: mid, iterations, converged: true, residual: fm }
    }

    iterations++

    if (fa * fm < 0) {
      b = mid
      fb = fm
    } else {
      a = mid
      fa = fm
    }
  }

  // Max iterations reached
  const mid = (a + b) / 2
  return { root: mid, iterations, converged: false, residual: f(mid) }
}

/**
 * Newton-Raphson root finder with numerical derivative.
 * Faster convergence than bisection but may not converge.
 *
 * @param f - Function to find root of
 * @param x0 - Initial guess
 * @param tolerance - Convergence tolerance
 * @param maxIterations - Maximum iterations
 * @param h - Step size for numerical derivative
 */
export function newtonRaphson(
  f: (x: number) => number,
  x0: number,
  tolerance: number = PARAN_BISECTION_TOL,
  maxIterations: number = PARAN_MAX_ITERATIONS,
  h: number = 0.0001,
): BisectionResult {
  let x = x0
  let iterations = 0

  while (iterations < maxIterations) {
    const fx = f(x)
    if (Math.abs(fx) < tolerance) {
      return { root: x, iterations, converged: true, residual: fx }
    }

    // Numerical derivative
    const fp = (f(x + h) - f(x - h)) / (2 * h)

    if (Math.abs(fp) < EPSILON) {
      // Derivative too small, can't continue
      return { root: null, iterations, converged: false }
    }

    const xNew = x - fx / fp
    iterations++

    if (Math.abs(xNew - x) < tolerance) {
      return { root: xNew, iterations, converged: true, residual: f(xNew) }
    }

    x = xNew
  }

  return { root: x, iterations, converged: false, residual: f(x) }
}

// =============================================================================
// Interpolation Functions
// =============================================================================

/**
 * Linear interpolation between two values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Inverse linear interpolation - find t given a, b, and result.
 */
export function inverseLerp(a: number, b: number, value: number): number {
  if (Math.abs(b - a) < EPSILON) return 0
  return (value - a) / (b - a)
}

/**
 * Clamp a value to a range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Three-point Lagrange interpolation.
 * Given values at x-h, x, x+h, interpolate for any x.
 */
export function lagrangeInterp3(yMinus: number, y0: number, yPlus: number, t: number): number {
  // t is the fractional position from -1 to 1
  // Lagrange basis polynomials for 3 points at -1, 0, 1
  const L0 = (t * (t - 1)) / 2
  const L1 = (1 - t) * (1 + t)
  const L2 = (t * (t + 1)) / 2
  return L0 * yMinus + L1 * y0 + L2 * yPlus
}

// =============================================================================
// Statistical Functions
// =============================================================================

/**
 * Gaussian function (bell curve).
 * @param x - Input value
 * @param mu - Mean (center)
 * @param sigma - Standard deviation (width)
 */
export function gaussian(x: number, mu: number, sigma: number): number {
  const exponent = -((x - mu) ** 2) / (2 * sigma ** 2)
  return Math.exp(exponent)
}

/**
 * Standard normal distribution value.
 */
export function standardNormal(x: number): number {
  return gaussian(x, 0, 1)
}

// =============================================================================
// Angular Distance Functions
// =============================================================================

/**
 * Calculate the shortest angular distance between two angles (in degrees).
 * Result is always positive and in [0, 180].
 */
export function angularDistance(angle1: number, angle2: number): number {
  const diff = Math.abs(normalizeDegrees(angle1) - normalizeDegrees(angle2))
  return diff > 180 ? 360 - diff : diff
}

/**
 * Calculate the signed angular difference (angle2 - angle1) in [-180, 180).
 */
export function angularDifference(angle1: number, angle2: number): number {
  return normalizeDegreesSymmetric(angle2 - angle1)
}

/**
 * Check if an angle is within an orb of a target angle.
 */
export function isWithinOrb(angle: number, target: number, orb: number): boolean {
  return angularDistance(angle, target) <= orb
}
