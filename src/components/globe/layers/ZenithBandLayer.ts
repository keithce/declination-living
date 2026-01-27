/**
 * Zenith Band Layer - Renders declination bands on the globe.
 *
 * Creates tube-like bands at constant latitudes representing where
 * each planet passes directly overhead (zenith).
 */

import * as THREE from 'three'
import { PLANET_COLORS_HEX } from './types'
import type { LayerGroup, PlanetId, PlanetVisibility, ZenithLineData } from './types'

// =============================================================================
// Constants
// =============================================================================

/** Radius of the globe */
const GLOBE_RADIUS = 1.0

/** Offset above globe surface for zenith bands */
const BAND_OFFSET = 0.015

/** Number of segments around the latitude circle */
const LATITUDE_SEGMENTS = 128

/** Default band width in degrees */
const DEFAULT_BAND_WIDTH = 1.0

// =============================================================================
// Geometry Helpers
// =============================================================================

/**
 * Create a latitude ring geometry at a specific latitude.
 *
 * @param latitude - Latitude in degrees
 * @param radius - Radius of the globe
 * @param width - Width of the band in degrees
 * @returns BufferGeometry for the ring
 */
function createLatitudeRingGeometry(
  latitude: number,
  radius: number,
  width: number = DEFAULT_BAND_WIDTH,
): THREE.BufferGeometry {
  const phi = ((90 - latitude) * Math.PI) / 180
  const ringRadius = Math.sin(phi) * radius
  const y = Math.cos(phi) * radius

  // Create a tube-like ring using ExtrudeGeometry with a small profile
  const innerRadius = ringRadius - (width * Math.PI) / 180 / 2
  const outerRadius = ringRadius + (width * Math.PI) / 180 / 2

  const geometry = new THREE.RingGeometry(
    Math.max(0.001, innerRadius),
    outerRadius,
    LATITUDE_SEGMENTS,
  )

  // Position the geometry
  geometry.translate(0, y, 0)
  geometry.rotateX(Math.PI / 2)

  return geometry
}

/**
 * Create a smooth latitude band with gradient falloff at edges.
 *
 * @param latitude - Center latitude in degrees
 * @param orbMin - Minimum orb latitude
 * @param orbMax - Maximum orb latitude
 * @param radius - Globe radius
 */
function createLatitudeBandGeometry(
  latitude: number,
  orbMin: number,
  orbMax: number,
  radius: number,
): THREE.BufferGeometry {
  const segments = LATITUDE_SEGMENTS
  const bandSegments = 5 // Segments across the width

  const vertices: Array<number> = []
  const colors: Array<number> = []
  const indices: Array<number> = []

  // Create vertex grid
  for (let i = 0; i <= bandSegments; i++) {
    const latFraction = i / bandSegments
    const lat = orbMin + (orbMax - orbMin) * latFraction
    const phi = ((90 - lat) * Math.PI) / 180
    const ringRadius = Math.sin(phi) * radius
    const y = Math.cos(phi) * radius

    // Opacity based on distance from center
    const distFromCenter = Math.abs(lat - latitude)
    const maxDist = (orbMax - orbMin) / 2
    const alpha = Math.max(0, 1 - distFromCenter / (maxDist || 1))

    for (let j = 0; j <= segments; j++) {
      const theta = (j / segments) * Math.PI * 2

      // Position
      const x = ringRadius * Math.cos(theta)
      const z = ringRadius * Math.sin(theta)
      vertices.push(x, y, z)

      // Color with alpha (stored in color.a for custom shader)
      colors.push(1, 1, 1, alpha)
    }
  }

  // Create indices for triangle strip
  for (let i = 0; i < bandSegments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j
      const b = a + 1
      const c = a + segments + 1
      const d = c + 1

      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

// =============================================================================
// Layer Creation
// =============================================================================

/**
 * Create the zenith band layer group.
 *
 * @param zenithLines - Array of zenith line data from backend
 * @param planetVisibility - Which planets to show
 * @returns LayerGroup with the band meshes
 */
export function createZenithBandLayer(
  zenithLines: Array<ZenithLineData>,
  planetVisibility: PlanetVisibility,
): LayerGroup {
  const group = new THREE.Group()
  group.name = 'zenithBands'

  const meshes: Array<THREE.Mesh> = []

  for (const line of zenithLines) {
    // Create ALL meshes regardless of visibility - visibility applied after
    const color = PLANET_COLORS_HEX[line.planet]

    // Create the band geometry
    const geometry = createLatitudeBandGeometry(
      line.latitude,
      line.orbMin,
      line.orbMax,
      GLOBE_RADIUS + BAND_OFFSET,
    )

    // Create material with vertex colors for gradient
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = { planet: line.planet, latitude: line.latitude }
    meshes.push(mesh)
    group.add(mesh)

    // Add a brighter center line
    const centerRing = createLatitudeRingGeometry(
      line.latitude,
      GLOBE_RADIUS + BAND_OFFSET + 0.002,
      0.2,
    )
    const centerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const centerMesh = new THREE.Mesh(centerRing, centerMaterial)
    centerMesh.userData = { planet: line.planet, type: 'center' }
    group.add(centerMesh)
  }

  // Apply initial visibility after all meshes are created
  updateZenithBandVisibility(group, planetVisibility)

  // Optional: Add glow animation
  const update = (time: number) => {
    // Subtle pulsing effect
    const pulse = 0.6 + 0.1 * Math.sin(time * 2)
    meshes.forEach((mesh) => {
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.opacity = pulse
      }
    })
  }

  const dispose = () => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    })
    group.clear()
  }

  return { group, update, dispose }
}

// =============================================================================
// Update Functions
// =============================================================================

/**
 * Update zenith band visibility based on planet filter.
 */
export function updateZenithBandVisibility(
  group: THREE.Group,
  planetVisibility: PlanetVisibility,
): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.userData.planet) {
      child.visible = planetVisibility[child.userData.planet as PlanetId]
    }
  })
}

/**
 * Highlight a specific planet's zenith band.
 */
export function highlightZenithBand(group: THREE.Group, planet: PlanetId | null): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
      const isPlanet = child.userData.planet === planet
      child.material.opacity = isPlanet ? 1.0 : 0.3
    }
  })
}
