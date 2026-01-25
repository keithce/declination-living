/**
 * Accessibility utilities and helpers
 */

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get animation duration based on user preference
 * Returns 0 if user prefers reduced motion, otherwise returns the provided duration
 */
export function getAnimationDuration(durationMs: number): number {
  return prefersReducedMotion() ? 0 : durationMs
}

/**
 * Create accessible label for screen readers
 */
export function createAriaLabel(primaryText: string, secondaryText?: string): string {
  return secondaryText ? `${primaryText}, ${secondaryText}` : primaryText
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string): void {
  if (typeof window === 'undefined') return

  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement (defensive check in case element was already removed)
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement)
    }
  }, 1000)
}

/**
 * Focus management - trap focus within a container
 *
 * Note: This function captures focusable elements at call time (static snapshot).
 * If the DOM changes after calling trapFocus, the focus trap will not update
 * to include new elements or exclude removed ones. Call the cleanup function
 * and re-invoke trapFocus if the container's content changes dynamically.
 */
export function trapFocus(containerElement: HTMLElement): () => void {
  const focusableElements = containerElement.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )

  if (focusableElements.length === 0) {
    return () => {} // No-op cleanup
  }

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  function handleTabKey(e: globalThis.KeyboardEvent): void {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus()
        e.preventDefault()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus()
        e.preventDefault()
      }
    }
  }

  containerElement.addEventListener('keydown', handleTabKey)

  // Return cleanup function
  return () => {
    containerElement.removeEventListener('keydown', handleTabKey)
  }
}

/**
 * Keyboard navigation handler
 */
export function handleKeyboardNavigation(
  event: globalThis.KeyboardEvent,
  handlers: {
    onEnter?: () => void
    onSpace?: () => void
    onEscape?: () => void
    onArrowUp?: () => void
    onArrowDown?: () => void
    onArrowLeft?: () => void
    onArrowRight?: () => void
  },
): void {
  switch (event.key) {
    case 'Enter':
      handlers.onEnter?.()
      break
    case ' ':
      handlers.onSpace?.()
      event.preventDefault() // Prevent page scroll
      break
    case 'Escape':
      handlers.onEscape?.()
      break
    case 'ArrowUp':
      handlers.onArrowUp?.()
      event.preventDefault()
      break
    case 'ArrowDown':
      handlers.onArrowDown?.()
      event.preventDefault()
      break
    case 'ArrowLeft':
      handlers.onArrowLeft?.()
      event.preventDefault()
      break
    case 'ArrowRight':
      handlers.onArrowRight?.()
      event.preventDefault()
      break
  }
}

/**
 * Generate unique ID for ARIA relationships
 */
let idCounter = 0
export function generateA11yId(prefix: string): string {
  return `${prefix}-${++idCounter}`
}

/**
 * Reset the ID counter (for testing purposes only)
 */
export function resetA11yIdCounter(): void {
  idCounter = 0
}
