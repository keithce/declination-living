/**
 * Performance monitoring utilities for development
 */

/**
 * Measure execution time of an async function
 */
export async function measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    console.log(`⏱️ [${label}] ${duration.toFixed(2)}ms`)
    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`❌ [${label}] Failed after ${duration.toFixed(2)}ms`, error)
    throw error
  }
}

/**
 * Measure execution time of a synchronous function
 */
export function measureSync<T>(label: string, fn: () => T): T {
  const start = performance.now()
  try {
    const result = fn()
    const duration = performance.now() - start
    console.log(`⏱️ [${label}] ${duration.toFixed(2)}ms`)
    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`❌ [${label}] Failed after ${duration.toFixed(2)}ms`, error)
    throw error
  }
}

/**
 * Create a performance marker for web performance timeline
 */
export function mark(name: string): void {
  if (typeof window !== 'undefined' && window.performance) {
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
  if (typeof window !== 'undefined' && window.performance) {
    try {
      performance.measure(measureName, startMark, endMark)
      const measure = performance.getEntriesByName(measureName)[0]
      return measure?.duration ?? null
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
  if (process.env.NODE_ENV === 'development') {
    const renderStart = performance.now()
    const renderEnd = performance.now()
    console.log(`🎨 [${componentName}] Render: ${(renderEnd - renderStart).toFixed(2)}ms`)
  }
}
