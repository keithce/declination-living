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
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Focus management - trap focus within a container
 */
export function trapFocus(containerElement: HTMLElement): () => void {
  const focusableElements = containerElement.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  function handleTabKey(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement?.focus()
        e.preventDefault()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement?.focus()
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
  event: React.KeyboardEvent,
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
    case 'Space':
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
      break
    case 'ArrowRight':
      handlers.onArrowRight?.()
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
