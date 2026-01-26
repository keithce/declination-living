/**
 * useResultsState - Bidirectional synchronization between globe and results tabs
 *
 * Manages hover, selection, and filter state to keep globe visualization
 * and results tabs in sync.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlanetId } from '@convex/calculations/core/types'

// =============================================================================
// Types
// =============================================================================

export type ElementType = 'acg-line' | 'zenith-line' | 'paran' | 'grid-cell'

export interface ElementIdentifier {
  type: ElementType
  id: string // Unique identifier for the element
  planet?: PlanetId // Primary planet for the element
  latitude?: number // For location-based elements
  longitude?: number // For location-based elements
}

export interface ResultsState {
  // Hover state
  hoveredElement: ElementIdentifier | null
  setHoveredElement: (element: ElementIdentifier | null) => void

  // Selection state
  selectedElement: ElementIdentifier | null
  setSelectedElement: (element: ElementIdentifier | null) => void

  // Filter state
  activeFilters: {
    planets: Set<PlanetId>
    elementTypes: Set<ElementType>
    minScore?: number
    maxScore?: number
  }
  togglePlanetFilter: (planet: PlanetId) => void
  toggleElementTypeFilter: (type: ElementType) => void
  setScoreRange: (min?: number, max?: number) => void
  clearFilters: () => void

  // Visibility state
  visibleLayers: Set<ElementType>
  toggleLayer: (type: ElementType) => void
  showAllLayers: () => void
  hideAllLayers: () => void

  // Scroll/focus helpers
  scrollToElement: (element: ElementIdentifier) => void
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing synchronized state between globe and results tabs
 */
export function useResultsState(): ResultsState {
  const [hoveredElement, setHoveredElement] = useState<ElementIdentifier | null>(null)
  const [selectedElement, setSelectedElement] = useState<ElementIdentifier | null>(null)
  const [activeFilters, setActiveFilters] = useState<ResultsState['activeFilters']>({
    planets: new Set(),
    elementTypes: new Set(),
  })
  const [visibleLayers, setVisibleLayers] = useState<Set<ElementType>>(
    new Set(['acg-line', 'zenith-line', 'paran', 'grid-cell']),
  )
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevHighlightedRef = useRef<string | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
    }
  }, [])

  // Filter management
  const togglePlanetFilter = useCallback((planet: PlanetId) => {
    setActiveFilters((prev) => {
      const planets = new Set(prev.planets)
      if (planets.has(planet)) {
        planets.delete(planet)
      } else {
        planets.add(planet)
      }
      return { ...prev, planets }
    })
  }, [])

  const toggleElementTypeFilter = useCallback((type: ElementType) => {
    setActiveFilters((prev) => {
      const elementTypes = new Set(prev.elementTypes)
      if (elementTypes.has(type)) {
        elementTypes.delete(type)
      } else {
        elementTypes.add(type)
      }
      return { ...prev, elementTypes }
    })
  }, [])

  const setScoreRange = useCallback((min?: number, max?: number) => {
    setActiveFilters((prev) => ({
      ...prev,
      minScore: min,
      maxScore: max,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setActiveFilters({
      planets: new Set(),
      elementTypes: new Set(),
    })
  }, [])

  // Layer visibility
  const toggleLayer = useCallback((type: ElementType) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  const showAllLayers = useCallback(() => {
    setVisibleLayers(new Set(['acg-line', 'zenith-line', 'paran', 'grid-cell']))
  }, [])

  const hideAllLayers = useCallback(() => {
    setVisibleLayers(new Set())
  }, [])

  // Scroll to element helper
  const scrollToElement = useCallback((element: ElementIdentifier) => {
    // Generate DOM ID from element identifier
    const domId = generateElementId(element)
    const targetElement = document.getElementById(domId)

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })

      // Clear any existing timeout before setting new one
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }

      // Remove highlight from previously highlighted element
      if (prevHighlightedRef.current && prevHighlightedRef.current !== domId) {
        const prevElement = document.getElementById(prevHighlightedRef.current)
        if (prevElement) {
          prevElement.classList.remove('highlight-flash')
        }
      }

      // Highlight element briefly
      targetElement.classList.add('highlight-flash')
      prevHighlightedRef.current = domId
      highlightTimeoutRef.current = setTimeout(() => {
        // Re-query element in case it was detached during the timeout
        const currentElement = document.getElementById(domId)
        if (currentElement) {
          currentElement.classList.remove('highlight-flash')
        }
        prevHighlightedRef.current = null
        highlightTimeoutRef.current = null
      }, 1000)
    }
  }, [])

  return {
    hoveredElement,
    setHoveredElement,
    selectedElement,
    setSelectedElement,
    activeFilters,
    togglePlanetFilter,
    toggleElementTypeFilter,
    setScoreRange,
    clearFilters,
    visibleLayers,
    toggleLayer,
    showAllLayers,
    hideAllLayers,
    scrollToElement,
  }
}

/**
 * Helper to generate unique ID for an element
 *
 * Generates consistent IDs using a parts array for all element types.
 */
export function generateElementId(element: Partial<ElementIdentifier>): string {
  const parts: Array<string> = []

  if (element.type === 'acg-line') {
    parts.push('acg-line')
    if (element.planet) parts.push(element.planet)
    if (element.id) parts.push(element.id)
    return parts.length > 1 ? parts.join('-') : 'acg-line-unknown'
  }
  if (element.type === 'zenith-line' && element.planet) {
    return `zenith-${element.planet}`
  }
  if (element.type === 'paran' && element.id) {
    return `paran-${element.id}`
  }
  if (
    element.type === 'grid-cell' &&
    element.latitude !== undefined &&
    element.longitude !== undefined
  ) {
    return `grid-${element.latitude.toFixed(1)}-${element.longitude.toFixed(1)}`
  }
  // Deterministic fallback: serialize available properties into a stable ID
  parts.push(element.type || 'element')
  if (element.id) parts.push(element.id)
  if (element.planet) parts.push(element.planet)
  if (element.latitude !== undefined) parts.push(element.latitude.toFixed(2))
  if (element.longitude !== undefined) parts.push(element.longitude.toFixed(2))
  return parts.join('-')
}
