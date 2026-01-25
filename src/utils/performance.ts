/**
 * Performance monitoring utilities for development
 */

import { useEffect, useRef } from 'react'

/** Check if running in development mode */
const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'

/** SSR-safe time function */
const getTime = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/**
 * Measure execution time of an async function
 */
export async function measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = getTime()
  try {
    const result = await fn()
    if (isDev) {
      console.log(`⏱️ [${label}] ${(getTime() - start).toFixed(2)}ms`)
    }
    return result
  } catch (error) {
    if (isDev) {
      console.error(`❌ [${label}] Failed after ${(getTime() - start).toFixed(2)}ms`, error)
    }
    throw error
  }
}

/**
 * Measure execution time of a synchronous function
 */
export function measureSync<T>(label: string, fn: () => T): T {
  const start = getTime()
  try {
    const result = fn()
    if (isDev) {
      console.log(`⏱️ [${label}] ${(getTime() - start).toFixed(2)}ms`)
    }
    return result
  } catch (error) {
    if (isDev) {
      console.error(`❌ [${label}] Failed after ${(getTime() - start).toFixed(2)}ms`, error)
    }
    throw error
  }
}

/**
 * Create a performance marker for web performance timeline
 */
export function mark(name: string): void {
  if (!isDev) return
  if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
    performance.mark(name)
  }
}

/**
 * Measure time between two performance markers
 */
export function measureBetween(
  measureName: string,
  startMark: string,
  endMark: string,
): number | null {
  if (typeof window !== 'undefined') {
    try {
      performance.measure(measureName, startMark, endMark)
      const measures = performance.getEntriesByName(measureName)
      const measure = measures[measures.length - 1]
      const duration = measure.duration

      // Clear accumulated entries to prevent memory leak
      performance.clearMeasures(measureName)
      performance.clearMarks(startMark)
      performance.clearMarks(endMark)

      return duration
    } catch {
      return null
    }
  }
  return null
}

/**
 * Log component render performance (use in development only)
 */
export function useRenderPerformance(componentName: string): void {
  const renderStartRef = useRef<number>(0)

  // Capture start time during render (synchronous)
  if (typeof window !== 'undefined' && isDev) {
    renderStartRef.current = performance.now()
  }

  // Capture end time after commit (in effect)
  // Intentional: empty deps to measure every render
  useEffect(() => {
    if (typeof window !== 'undefined' && isDev) {
      const renderEnd = performance.now()
      const duration = renderEnd - renderStartRef.current
      console.log(`🎨 [${componentName}] Render: ${duration.toFixed(2)}ms`)
    }
  })
}
