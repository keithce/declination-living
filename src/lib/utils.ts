import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

/**
 * Type for a debounced function that includes a cancel method.
 */
export interface DebouncedFunction<T extends (...args: Array<any>) => void> {
  (...args: Parameters<T>): void
  cancel: () => void
}

/**
 * Debounce a function call.
 * Delays invoking the function until after `delay` milliseconds have elapsed
 * since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: Array<any>) => void>(
  fn: T,
  delay: number,
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      timeoutId = null
      fn.apply(this, args)
    }, delay)
  } as DebouncedFunction<T>

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debounced
}
