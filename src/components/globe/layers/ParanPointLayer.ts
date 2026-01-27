/**
 * Paran Point Layer - Renders paran intersection points on the globe.
 *
 * Parans are latitudes where two planets are simultaneously angular
 * (e.g., one rising while another culminates).
 */

import * as THREE from 'three'
import { PLANET_COLORS_HEX } from './types'
import type { LayerGroup, ParanPointData, PlanetId, PlanetVisibility } from './types'

// =============================================================================
// Constants
// =============================================================================

/** Radius offset for paran points */
const POINT_OFFSET = 0.025

/** Base size of paran point markers */
const BASE_POINT_SIZE = 0.015

/** Glow sprite size multiplier */
const GLOW_SIZE_MULTIPLIER = 3

// =============================================================================
// Coordinate Conversion
// =============================================================================

/**
 * Convert lat/lon to 3D position on sphere.
 */
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lon + 180) * Math.PI) / 180

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

/**
 * Blend two colors.
 */
function blendColors(color1: number, color2: number, ratio: number = 0.5): number {
  const r1 = (color1 >> 16) & 0xff
  const g1 = (color1 >> 8) & 0xff
  const b1 = color1 & 0xff

  const r2 = (color2 >> 16) & 0xff
  const g2 = (color2 >> 8) & 0xff
  const b2 = color2 & 0xff

  const r = Math.round(r1 * (1 - ratio) + r2 * ratio)
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio)
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio)

  return (r << 16) | (g << 8) | b
}

// =============================================================================
// Glow Texture
// =============================================================================

/**
 * Create a glow texture for paran points.
 */
function createGlowTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)

  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  return texture
}

// =============================================================================
// Point Creation
// =============================================================================

/**
 * Create a paran point marker with glow effect.
 */
function createParanMarker(paran: ParanPointData, longitude: number): THREE.Group {
  const markerGroup = new THREE.Group()

  // Blend colors of both planets
  const color1 = PLANET_COLORS_HEX[paran.planet1]
  const color2 = PLANET_COLORS_HEX[paran.planet2]
  const blendedColor = blendColors(color1, color2)

  // Size based on strength
  const strength = paran.strength ?? 0.5
  const size = BASE_POINT_SIZE * (0.8 + strength * 0.4)

  // Core sphere
  const sphereGeometry = new THREE.SphereGeometry(size, 16, 16)
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color: blendedColor,
    transparent: true,
    opacity: 0.9,
  })
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  markerGroup.add(sphere)

  // Glow sprite
  const glowTexture = createGlowTexture()
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: blendedColor,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const glow = new THREE.Sprite(glowMaterial)
  glow.scale.setScalar(size * GLOW_SIZE_MULTIPLIER)
  markerGroup.add(glow)

  // Position on globe
  const position = latLonToVector3(paran.latitude, longitude, 1 + POINT_OFFSET)
  markerGroup.position.copy(position)

  // Store data for interaction
  markerGroup.userData = {
    planet1: paran.planet1,
    planet2: paran.planet2,
    event1: paran.event1,
    event2: paran.event2,
    latitude: paran.latitude,
    strength: paran.strength,
  }

  return markerGroup
}

// =============================================================================
// Layer Creation
// =============================================================================

/**
 * Create the paran point layer group.
 *
 * @param parans - Array of paran point data from backend
 * @param planetVisibility - Which planets to show
 * @returns LayerGroup with the point markers
 */
export function createParanPointLayer(
  parans: Array<ParanPointData>,
  planetVisibility: PlanetVisibility,
): LayerGroup {
  const group = new THREE.Group()
  group.name = 'paranPoints'

  // Group parans by latitude to avoid overlap
  const latitudeGroups = new Map<number, Array<ParanPointData>>()

  for (const paran of parans) {
    // Create ALL points regardless of visibility - visibility applied after
    const roundedLat = Math.round(paran.latitude * 10) / 10
    if (!latitudeGroups.has(roundedLat)) {
      latitudeGroups.set(roundedLat, [])
    }
    latitudeGroups.get(roundedLat)!.push(paran)
  }

  // Create markers, spreading them around the longitude
  for (const [_lat, groupParans] of latitudeGroups) {
    const lonStep = 360 / (groupParans.length + 1)

    groupParans.forEach((paran, index) => {
      const longitude = -180 + lonStep * (index + 1)
      const marker = createParanMarker(paran, longitude)
      group.add(marker)
    })
  }

  // Apply initial visibility after all points are created
  updateParanPointVisibility(group, planetVisibility)

  // Animation update for pulsing effect
  const update = (time: number) => {
    const pulse = 0.6 + 0.2 * Math.sin(time * 3)
    group.traverse((child) => {
      if (child instanceof THREE.Sprite) {
        child.material.opacity = pulse * 0.6
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
      if (child instanceof THREE.Sprite) {
        child.material.dispose()
        child.material.map?.dispose()
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
 * Update paran point visibility based on planet filter.
 */
export function updateParanPointVisibility(
  group: THREE.Group,
  planetVisibility: PlanetVisibility,
): void {
  group.traverse((child) => {
    if (child.userData.planet1 && child.userData.planet2) {
      const p1 = child.userData.planet1 as PlanetId
      const p2 = child.userData.planet2 as PlanetId
      child.visible = planetVisibility[p1] && planetVisibility[p2]
    }
  })
}

/**
 * Get tooltip content for a paran point.
 */
export function getParanTooltip(userData: Record<string, unknown>): string {
  const eventNames: Record<string, string> = {
    rise: 'Rising',
    set: 'Setting',
    culminate: 'Culminating',
    anti_culminate: 'Anti-culminating',
  }

  const p1 =
    (userData.planet1 as string).charAt(0).toUpperCase() + (userData.planet1 as string).slice(1)
  const p2 =
    (userData.planet2 as string).charAt(0).toUpperCase() + (userData.planet2 as string).slice(1)
  const e1 = eventNames[userData.event1 as string] || userData.event1
  const e2 = eventNames[userData.event2 as string] || userData.event2
  const lat = (userData.latitude as number).toFixed(1)

  return `${p1} ${e1} / ${p2} ${e2}\nLatitude: ${lat}°`
}

/**
 * Find paran at screen position (for hover/click).
 */
export function findParanAtPosition(
  group: THREE.Group,
  raycaster: THREE.Raycaster,
  camera: THREE.Camera,
  mousePosition: THREE.Vector2,
): Record<string, unknown> | null {
  raycaster.setFromCamera(mousePosition, camera)

  const meshes: Array<THREE.Object3D> = []
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child)
    }
  })

  const intersects = raycaster.intersectObjects(meshes)

  if (intersects.length > 0) {
    // Return the parent group's userData (which has the paran data)
    const parent = intersects[0].object.parent
    if (parent && parent.userData.planet1) {
      return parent.userData
    }
  }

  return null
}
