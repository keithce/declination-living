/**
 * City Marker Layer - Renders ranked city markers on the globe.
 *
 * Displays recommended relocation cities as interactive markers with
 * score-based coloring, size based on rank, and optional labels.
 */

import * as THREE from 'three'
import type { CityMarkerData, LayerGroup } from './types'

// =============================================================================
// Constants
// =============================================================================

/** Radius offset for pin tip (near globe surface) */
const MARKER_OFFSET = 0.02

/** Base size of city markers */
const BASE_MARKER_SIZE = 0.018

/** Size multiplier for top 3 cities */
const TOP_RANK_SIZE_MULTIPLIER = 1.5

/** Glow sprite size multiplier */
const GLOW_SIZE_MULTIPLIER = 2.5

/** Pin head radius relative to base size */
const PIN_HEAD_SCALE = 0.7

/** Pin shaft length relative to base size */
const PIN_SHAFT_LENGTH_SCALE = 2.5

/** Pin shaft radius relative to base size */
const PIN_SHAFT_RADIUS_SCALE = 0.15

/** Shaft color (dark metallic gray) */
const PIN_SHAFT_COLOR = 0x666666

/** Score thresholds for coloring */
const SCORE_COLORS = {
  excellent: 0x22c55e, // green - score >= 80
  good: 0x84cc16, // lime - score >= 60
  moderate: 0xeab308, // yellow - score >= 40
  fair: 0xf97316, // orange - score >= 20
  low: 0xef4444, // red - score < 20
} as const

/** Highlight color when city is selected */
const HIGHLIGHT_COLOR = 0xffffff

/** Label font settings */
const LABEL_FONT_SIZE = 32
const LABEL_CANVAS_WIDTH = 256
const LABEL_CANVAS_HEIGHT = 64

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

// =============================================================================
// Color Helper
// =============================================================================

/**
 * Get marker color based on score.
 */
function getScoreColor(score: number): number {
  if (score >= 80) return SCORE_COLORS.excellent
  if (score >= 60) return SCORE_COLORS.good
  if (score >= 40) return SCORE_COLORS.moderate
  if (score >= 20) return SCORE_COLORS.fair
  return SCORE_COLORS.low
}

// =============================================================================
// Glow Texture
// =============================================================================

let cachedGlowTexture: THREE.Texture | null = null
let glowTextureRefCount = 0

/**
 * Create or reuse a glow texture for markers.
 */
function getGlowTexture(): THREE.Texture {
  if (cachedGlowTexture) return cachedGlowTexture

  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get 2D canvas context for glow texture')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)

  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  cachedGlowTexture = new THREE.CanvasTexture(canvas)
  cachedGlowTexture.needsUpdate = true

  return cachedGlowTexture
}

// =============================================================================
// Label Texture
// =============================================================================

/**
 * Create a text label texture for a city.
 */
function createLabelTexture(text: string): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = LABEL_CANVAS_WIDTH
  canvas.height = LABEL_CANVAS_HEIGHT

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get 2D canvas context for label texture')

  // Clear with transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw text with shadow for visibility
  ctx.font = `bold ${LABEL_FONT_SIZE}px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillText(text, canvas.width / 2 + 2, canvas.height / 2 + 2)

  // Text
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  return texture
}

// =============================================================================
// Marker Creation
// =============================================================================

/**
 * Create a single city marker with optional label.
 */
function createCityMarker(city: CityMarkerData, showLabel: boolean): THREE.Group {
  const markerGroup = new THREE.Group()

  const color = getScoreColor(city.score)
  const isTopRank = city.rank <= 3
  const size = BASE_MARKER_SIZE * (isTopRank ? TOP_RANK_SIZE_MULTIPLIER : 1)

  const headRadius = size * PIN_HEAD_SCALE
  const shaftLength = size * PIN_SHAFT_LENGTH_SCALE
  const shaftRadius = size * PIN_SHAFT_RADIUS_SCALE

  // Pin sub-group holds head + shaft, oriented so shaft points along -Y (local)
  const pinGroup = new THREE.Group()
  pinGroup.name = 'pinGroup'

  // Pin head (sphere at top)
  const headGeometry = new THREE.SphereGeometry(headRadius, 12, 8)
  const headMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
  })
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.name = 'cityMarker'
  head.position.y = shaftLength + headRadius // sit above shaft
  pinGroup.add(head)

  // Pin shaft (cone tapering to a point downward)
  const shaftGeometry = new THREE.ConeGeometry(shaftRadius, shaftLength, 8)
  const shaftMaterial = new THREE.MeshBasicMaterial({
    color: PIN_SHAFT_COLOR,
    transparent: true,
    opacity: 0.85,
  })
  const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial)
  shaft.name = 'cityShaft'
  // ConeGeometry is centered; move so tip is at y=0 and base at y=shaftLength
  shaft.position.y = shaftLength / 2
  pinGroup.add(shaft)

  markerGroup.add(pinGroup)

  // Glow sprite (around pin head)
  const glowMaterial = new THREE.SpriteMaterial({
    map: getGlowTexture(),
    color,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const glow = new THREE.Sprite(glowMaterial)
  glow.scale.setScalar(size * GLOW_SIZE_MULTIPLIER)
  glow.position.y = shaftLength + headRadius // align with head
  glow.name = 'cityGlow'
  markerGroup.add(glow)

  // Label sprite (billboard) — "City, Country"
  const labelText = `${city.name}, ${city.country}`
  const labelTexture = createLabelTexture(labelText)
  const labelMaterial = new THREE.SpriteMaterial({
    map: labelTexture,
    transparent: true,
    depthTest: false,
  })
  const label = new THREE.Sprite(labelMaterial)
  label.scale.set(0.15, 0.04, 1)
  label.position.y = shaftLength + headRadius * 2 + size * 2 // above pin head
  label.name = 'cityLabel'
  label.visible = showLabel
  markerGroup.add(label)

  // Position on globe surface and orient pin radially outward
  const surfacePos = latLonToVector3(city.latitude, city.longitude, 1 + MARKER_OFFSET)
  markerGroup.position.copy(surfacePos)

  // Orient so local +Y points away from globe center (along surface normal)
  const up = surfacePos.clone().normalize()
  const target = surfacePos.clone().add(up)
  markerGroup.lookAt(target)
  // lookAt aligns -Z toward target; we need +Y toward target instead
  markerGroup.rotateX(Math.PI / 2)

  // Store city data for interaction
  markerGroup.userData = {
    cityId: city.id,
    cityName: city.name,
    country: city.country,
    latitude: city.latitude,
    longitude: city.longitude,
    score: city.score,
    rank: city.rank,
    tier: city.tier,
    highlights: city.highlights,
  }

  return markerGroup
}

// =============================================================================
// Layer Creation
// =============================================================================

export interface CityMarkerLayerOptions {
  /** Whether to show city name labels */
  showLabels?: boolean
  /** Maximum number of markers to display */
  maxMarkers?: number
}

/**
 * Create the city marker layer group.
 *
 * @param cities - Array of ranked city data
 * @param options - Layer options
 * @returns LayerGroup with city markers
 */
export function createCityMarkerLayer(
  cities: Array<CityMarkerData>,
  options: CityMarkerLayerOptions = {},
): LayerGroup {
  const { showLabels = false, maxMarkers = 50 } = options
  const group = new THREE.Group()
  group.name = 'cityMarkers'

  // Limit to max markers (clamp to non-negative)
  const safeMax = Math.max(0, maxMarkers)
  const displayCities = cities.slice(0, safeMax)

  for (const city of displayCities) {
    const marker = createCityMarker(city, showLabels)
    group.add(marker)
  }
  glowTextureRefCount++

  // Pulse animation for glow
  const update = (time: number) => {
    const pulse = 0.4 + 0.15 * Math.sin(time * 2)
    group.traverse((child) => {
      if (child instanceof THREE.Sprite && child.name === 'cityGlow') {
        child.material.opacity = pulse
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
        // Don't dispose the shared glow texture, only label textures
        if (child.name === 'cityLabel' && child.material.map) {
          child.material.map.dispose()
        }
      }
    })
    group.clear()

    // Dispose shared glow texture when no more layers reference it
    glowTextureRefCount--
    if (glowTextureRefCount <= 0 && cachedGlowTexture) {
      cachedGlowTexture.dispose()
      cachedGlowTexture = null
      glowTextureRefCount = 0
    }
  }

  return { group, update, dispose }
}

// =============================================================================
// Update Functions
// =============================================================================

/**
 * Update city marker labels visibility.
 */
export function updateCityLabels(group: THREE.Group, showLabels: boolean): void {
  group.traverse((child) => {
    if (child instanceof THREE.Sprite && child.name === 'cityLabel') {
      child.visible = showLabels
    }
  })
}

/**
 * Highlight a specific city marker.
 */
export function highlightCityMarker(group: THREE.Group, cityId: string | null): void {
  group.traverse((child) => {
    if (child.userData.cityId) {
      const isHighlighted = child.userData.cityId === cityId

      // Find the marker mesh and glow within this group
      child.traverse((subChild) => {
        if (
          subChild instanceof THREE.Mesh &&
          (subChild.name === 'cityMarker' || subChild.name === 'cityShaft')
        ) {
          const material = subChild.material as THREE.MeshBasicMaterial
          if (isHighlighted) {
            if (subChild.userData.originalColor === undefined) {
              subChild.userData.originalColor = material.color.getHex()
            }
            material.color.setHex(HIGHLIGHT_COLOR)
            if (subChild.name === 'cityMarker') {
              subChild.scale.setScalar(1.3)
            }
          } else {
            if (subChild.userData.originalColor !== undefined) {
              material.color.setHex(subChild.userData.originalColor)
            }
            if (subChild.name === 'cityMarker') {
              subChild.scale.setScalar(1)
            }
          }
        }

        if (subChild instanceof THREE.Sprite && subChild.name === 'cityGlow') {
          const material = subChild.material
          if (isHighlighted) {
            if (subChild.userData.originalColor === undefined) {
              subChild.userData.originalColor = material.color.getHex()
            }
            material.color.setHex(HIGHLIGHT_COLOR)
            material.opacity = 0.8
          } else {
            if (subChild.userData.originalColor !== undefined) {
              material.color.setHex(subChild.userData.originalColor)
            }
            // Opacity will be set by animation
          }
        }
      })
    }
  })
}

/**
 * Find city at screen position (for hover/click).
 */
export function findCityAtPosition(
  group: THREE.Group,
  raycaster: THREE.Raycaster,
  camera: THREE.Camera,
  mousePosition: THREE.Vector2,
): CityMarkerData | null {
  raycaster.setFromCamera(mousePosition, camera)

  const meshes: Array<THREE.Object3D> = []
  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name === 'cityMarker') {
      meshes.push(child)
    }
  })

  const intersects = raycaster.intersectObjects(meshes)

  if (intersects.length > 0) {
    // Find the parent group that has the city data
    let parent = intersects[0].object.parent
    while (parent && !parent.userData.cityId) {
      parent = parent.parent
    }

    if (parent && parent.userData.cityId) {
      return {
        id: parent.userData.cityId,
        name: parent.userData.cityName,
        country: parent.userData.country,
        latitude: parent.userData.latitude,
        longitude: parent.userData.longitude,
        score: parent.userData.score,
        rank: parent.userData.rank,
        tier: parent.userData.tier,
        highlights: parent.userData.highlights || [],
      }
    }
  }

  return null
}

/**
 * Get tooltip content for a city marker.
 */
export function getCityTooltip(city: CityMarkerData): string {
  const lines = [
    `${city.name}, ${city.country}`,
    `Score: ${city.score.toFixed(0)}`,
    `Rank: #${city.rank}`,
  ]

  if (city.highlights.length > 0) {
    lines.push('', ...city.highlights.slice(0, 2))
  }

  return lines.join('\n')
}
