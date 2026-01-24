/**
 * ACG Line Layer - Renders Astro*Carto*Graphy lines on the globe.
 *
 * Creates curved lines representing where planets are:
 * - ASC: Rising (ascending horizon)
 * - DSC: Setting (descending horizon)
 * - MC: Culminating (on meridian)
 * - IC: Anti-culminating (opposite meridian)
 */

import * as THREE from "three"
import type {
  ACGLineData,
  PlanetVisibility,
  ACGLineFilters,
  LayerGroup,
  PlanetId,
} from "./types"
import { PLANET_COLORS_HEX } from "./types"

// =============================================================================
// Constants
// =============================================================================

/** Radius offset for ACG lines above globe */
const LINE_OFFSET = 0.02

/** Line width */
const LINE_WIDTH = 2

/** Dash pattern for MC/IC lines */
const DASH_SIZE = 0.1
const GAP_SIZE = 0.05

// =============================================================================
// Coordinate Conversion
// =============================================================================

/**
 * Convert lat/lon to 3D position on sphere.
 */
function latLonToVector3(
  lat: number,
  lon: number,
  radius: number
): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lon + 180) * Math.PI) / 180

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

// =============================================================================
// Line Creation
// =============================================================================

/**
 * Create a line from an array of lat/lon points.
 */
function createACGLine(
  points: Array<{ lat: number; lon: number }>,
  color: number,
  isDashed: boolean
): THREE.Line {
  const linePoints = points.map((p) =>
    latLonToVector3(p.lat, p.lon, 1 + LINE_OFFSET)
  )

  const geometry = new THREE.BufferGeometry().setFromPoints(linePoints)

  let material: THREE.LineBasicMaterial | THREE.LineDashedMaterial

  if (isDashed) {
    material = new THREE.LineDashedMaterial({
      color: color,
      linewidth: LINE_WIDTH,
      scale: 1,
      dashSize: DASH_SIZE,
      gapSize: GAP_SIZE,
      transparent: true,
      opacity: 0.8,
    })
  } else {
    material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: LINE_WIDTH,
      transparent: true,
      opacity: 0.9,
    })
  }

  const line = new THREE.Line(geometry, material)

  // Compute line distances for dashed material
  if (isDashed) {
    line.computeLineDistances()
  }

  return line
}

/**
 * Create a line with multiple segments (handling longitude wrapping).
 */
function createWrappedACGLine(
  points: Array<{ lat: number; lon: number }>,
  color: number,
  isDashed: boolean
): THREE.Group {
  const lineGroup = new THREE.Group()

  if (points.length < 2) return lineGroup

  // Split into segments at longitude discontinuities
  const segments: Array<Array<{ lat: number; lon: number }>> = []
  let currentSegment: Array<{ lat: number; lon: number }> = [points[0]]

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]

    // Check for longitude wrap (more than 180° jump)
    const lonDiff = Math.abs(curr.lon - prev.lon)
    if (lonDiff > 180) {
      // Start new segment
      if (currentSegment.length >= 2) {
        segments.push(currentSegment)
      }
      currentSegment = [curr]
    } else {
      currentSegment.push(curr)
    }
  }

  // Add final segment
  if (currentSegment.length >= 2) {
    segments.push(currentSegment)
  }

  // Create lines for each segment
  for (const segment of segments) {
    const line = createACGLine(segment, color, isDashed)
    lineGroup.add(line)
  }

  return lineGroup
}

// =============================================================================
// Layer Creation
// =============================================================================

/**
 * Create the ACG line layer group.
 *
 * @param acgLines - Array of ACG line data from backend
 * @param planetVisibility - Which planets to show
 * @param typeFilters - Which line types to show
 * @returns LayerGroup with the line meshes
 */
export function createACGLineLayer(
  acgLines: ACGLineData[],
  planetVisibility: PlanetVisibility,
  typeFilters: ACGLineFilters
): LayerGroup {
  const group = new THREE.Group()
  group.name = "acgLines"

  for (const line of acgLines) {
    // Skip if planet or type is not visible
    if (!planetVisibility[line.planet]) continue
    if (!typeFilters[line.lineType]) continue

    const color = PLANET_COLORS_HEX[line.planet]
    const isDashed = line.lineType === "MC" || line.lineType === "IC"

    const lineGroup = createWrappedACGLine(line.points, color, isDashed)
    lineGroup.userData = {
      planet: line.planet,
      lineType: line.lineType,
      isCircumpolar: line.isCircumpolar,
    }

    group.add(lineGroup)
  }

  const dispose = () => {
    group.traverse((child) => {
      if (child instanceof THREE.Line) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    })
    group.clear()
  }

  return { group, dispose }
}

// =============================================================================
// Update Functions
// =============================================================================

/**
 * Update ACG line visibility based on filters.
 */
export function updateACGLineVisibility(
  group: THREE.Group,
  planetVisibility: PlanetVisibility,
  typeFilters: ACGLineFilters
): void {
  group.traverse((child) => {
    if (child.userData.planet && child.userData.lineType) {
      const planet = child.userData.planet as PlanetId
      const lineType = child.userData.lineType as keyof ACGLineFilters

      child.visible = planetVisibility[planet] && typeFilters[lineType]
    }
  })
}

/**
 * Highlight lines for a specific planet or type.
 */
export function highlightACGLines(
  group: THREE.Group,
  options: {
    planet?: PlanetId | null
    lineType?: keyof ACGLineFilters | null
  }
): void {
  const { planet, lineType } = options

  group.traverse((child) => {
    if (child instanceof THREE.Line && child.material instanceof THREE.Material) {
      const matchesPlanet = !planet || child.parent?.userData.planet === planet
      const matchesType =
        !lineType || child.parent?.userData.lineType === lineType

      child.material.opacity = matchesPlanet && matchesType ? 1.0 : 0.2
    }
  })
}

/**
 * Get line type display name.
 */
export function getLineTypeDisplayName(lineType: string): string {
  const names: Record<string, string> = {
    ASC: "Ascending",
    DSC: "Descending",
    MC: "Midheaven",
    IC: "Imum Coeli",
  }
  return names[lineType] || lineType
}

/**
 * Get line type description.
 */
export function getLineTypeDescription(lineType: string): string {
  const descriptions: Record<string, string> = {
    ASC: "Where the planet is rising (ascending horizon)",
    DSC: "Where the planet is setting (descending horizon)",
    MC: "Where the planet is culminating (on the meridian)",
    IC: "Where the planet is at anti-culmination",
  }
  return descriptions[lineType] || ""
}
