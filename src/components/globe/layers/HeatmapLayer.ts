/**
 * Heatmap Layer - Shader-based heat overlay showing optimal latitudes.
 *
 * Uses a custom shader to color the globe surface based on proximity
 * to optimal latitudes (declination/zenith lines).
 */

import * as THREE from 'three'
import { PLANET_COLORS_HEX, PLANET_IDS } from './types'
import type { LayerGroup, PlanetId } from './types'

// =============================================================================
// Constants
// =============================================================================

/** Number of hot latitudes the shader can handle */
const MAX_HOT_LATITUDES = 20

/** Heatmap sphere radius offset */
const HEATMAP_OFFSET = 0.005

// =============================================================================
// Shader Code
// =============================================================================

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uHotLatitudes[${MAX_HOT_LATITUDES}];
  uniform vec3 uHotColors[${MAX_HOT_LATITUDES}];
  uniform float uHotWeights[${MAX_HOT_LATITUDES}];
  uniform int uHotCount;
  uniform float uIntensity;
  uniform float uSigma;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  // Convert position to latitude
  float getLatitude(vec3 pos) {
    float y = pos.y / length(pos);
    return asin(y) * 57.2957795; // Convert to degrees
  }

  // Gaussian function
  float gaussian(float x, float mu, float sigma) {
    float diff = x - mu;
    return exp(-(diff * diff) / (2.0 * sigma * sigma));
  }

  // Heat color gradient (blue -> cyan -> green -> yellow -> red)
  vec3 heatGradient(float t) {
    t = clamp(t, 0.0, 1.0);

    if (t < 0.25) {
      // Blue to cyan
      return mix(vec3(0.0, 0.0, 0.8), vec3(0.0, 0.8, 0.8), t * 4.0);
    } else if (t < 0.5) {
      // Cyan to green
      return mix(vec3(0.0, 0.8, 0.8), vec3(0.0, 0.8, 0.0), (t - 0.25) * 4.0);
    } else if (t < 0.75) {
      // Green to yellow
      return mix(vec3(0.0, 0.8, 0.0), vec3(1.0, 0.9, 0.0), (t - 0.5) * 4.0);
    } else {
      // Yellow to red
      return mix(vec3(1.0, 0.9, 0.0), vec3(1.0, 0.2, 0.0), (t - 0.75) * 4.0);
    }
  }

  void main() {
    float latitude = getLatitude(vPosition);

    // Calculate heat from all hot latitudes
    float totalHeat = 0.0;
    vec3 weightedColor = vec3(0.0);
    float totalWeight = 0.0;

    for (int i = 0; i < ${MAX_HOT_LATITUDES}; i++) {
      if (i >= uHotCount) break;

      float dist = abs(latitude - uHotLatitudes[i]);
      float heat = gaussian(dist, 0.0, uSigma) * uHotWeights[i];

      totalHeat += heat;
      weightedColor += uHotColors[i] * heat;
      totalWeight += heat;
    }

    // Normalize color
    if (totalWeight > 0.0) {
      weightedColor /= totalWeight;
    }

    // Apply intensity
    totalHeat = clamp(totalHeat * uIntensity, 0.0, 1.0);

    // Use either gradient or planet colors
    // vec3 color = heatGradient(totalHeat);
    vec3 color = mix(vec3(0.1, 0.1, 0.2), weightedColor, totalHeat);

    // Apply transparency based on heat
    float alpha = totalHeat * 0.7;

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`

interface HeatmapState {
  baseIntensity: number
  hotLatitudes: Array<number>
  hotColors: Array<number>
  hotWeights: Array<number>
}

function fillHeatmapUniformArrays(
  declinations: Partial<Record<PlanetId, number>>,
  weights: Record<PlanetId, number>,
  hotLatitudes: Array<number>,
  hotColors: Array<number>,
  hotWeights: Array<number>,
): number {
  hotLatitudes.length = 0
  hotColors.length = 0
  hotWeights.length = 0

  for (const planet of PLANET_IDS) {
    const lat = declinations[planet]
    if (weights[planet] <= 0 || lat === undefined) continue

    hotLatitudes.push(lat)

    const hexColor = PLANET_COLORS_HEX[planet]
    hotColors.push(
      ((hexColor >> 16) & 0xff) / 255,
      ((hexColor >> 8) & 0xff) / 255,
      (hexColor & 0xff) / 255,
    )
    hotWeights.push(weights[planet] / 10)
  }

  const actualHotCount = hotLatitudes.length
  while (hotLatitudes.length < MAX_HOT_LATITUDES) {
    hotLatitudes.push(0)
    hotColors.push(0, 0, 0)
    hotWeights.push(0)
  }

  return actualHotCount
}

// =============================================================================
// Layer Creation
// =============================================================================

export interface HeatmapOptions {
  /** Planet declinations (latitudes) to highlight */
  declinations: Partial<Record<PlanetId, number>>
  /** Planet weights for intensity */
  weights: Record<PlanetId, number>
  /** Overall intensity multiplier (0-2) */
  intensity?: number
  /** Gaussian sigma for heat spread (degrees) */
  sigma?: number
}

/**
 * Create the heatmap layer.
 *
 * @param options - Heatmap configuration
 * @returns LayerGroup with the heatmap mesh
 */
export function createHeatmapLayer(options: HeatmapOptions): LayerGroup {
  const group = new THREE.Group()
  group.name = 'heatmap'

  const { declinations, weights, intensity = 1.0, sigma = 3.0 } = options

  const hotLatitudes: Array<number> = []
  const hotColors: Array<number> = []
  const hotWeights: Array<number> = []
  const actualHotCount = fillHeatmapUniformArrays(
    declinations,
    weights,
    hotLatitudes,
    hotColors,
    hotWeights,
  )

  // Create shader material
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uHotLatitudes: { value: hotLatitudes },
      uHotColors: { value: hotColors },
      uHotWeights: { value: hotWeights },
      uHotCount: { value: actualHotCount },
      uIntensity: { value: intensity },
      uSigma: { value: sigma },
    },
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  // Create sphere geometry
  const geometry = new THREE.SphereGeometry(1 + HEATMAP_OFFSET, 128, 64)
  const mesh = new THREE.Mesh(geometry, material)

  group.add(mesh)
  group.userData.heatmapState = {
    baseIntensity: intensity,
    hotLatitudes,
    hotColors,
    hotWeights,
  }

  // Update function to animate intensity
  const update = (time: number) => {
    const state = group.userData.heatmapState as HeatmapState | undefined
    const baseIntensity = state?.baseIntensity ?? intensity
    // Optional: subtle pulsing
    const pulse = baseIntensity * (0.9 + 0.1 * Math.sin(time * 0.5))
    material.uniforms.uIntensity.value = pulse
  }

  const dispose = () => {
    geometry.dispose()
    material.dispose()
    group.clear()
  }

  return { group, update, dispose }
}

// =============================================================================
// Update Functions
// =============================================================================

/**
 * Update heatmap with new data.
 */
export function updateHeatmap(group: THREE.Group, options: HeatmapOptions): void {
  const mesh = group.children[0]
  if (!(mesh instanceof THREE.Mesh) || !(mesh.material instanceof THREE.ShaderMaterial)) return

  const material = mesh.material
  const { declinations, weights, intensity = 1.0, sigma = 3.0 } = options

  const state = (group.userData.heatmapState as HeatmapState | undefined) ?? {
    baseIntensity: intensity,
    hotLatitudes: [],
    hotColors: [],
    hotWeights: [],
  }
  const actualHotCount = fillHeatmapUniformArrays(
    declinations,
    weights,
    state.hotLatitudes,
    state.hotColors,
    state.hotWeights,
  )

  // Update uniforms
  material.uniforms.uHotLatitudes.value = state.hotLatitudes
  material.uniforms.uHotColors.value = state.hotColors
  material.uniforms.uHotWeights.value = state.hotWeights
  material.uniforms.uHotCount.value = actualHotCount
  material.uniforms.uIntensity.value = intensity
  material.uniforms.uSigma.value = sigma
  group.userData.heatmapState = {
    ...state,
    baseIntensity: intensity,
  } satisfies HeatmapState
}

/**
 * Set heatmap intensity.
 */
export function setHeatmapIntensity(group: THREE.Group, intensity: number): void {
  const mesh = group.children[0]
  if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.ShaderMaterial) {
    mesh.material.uniforms.uIntensity.value = intensity
    const state = group.userData.heatmapState as HeatmapState | undefined
    group.userData.heatmapState = {
      ...(state ?? { hotLatitudes: [], hotColors: [], hotWeights: [] }),
      baseIntensity: intensity,
    } satisfies HeatmapState
  }
}

/**
 * Set heatmap spread (sigma).
 */
export function setHeatmapSpread(group: THREE.Group, sigma: number): void {
  const mesh = group.children[0]
  if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.ShaderMaterial) {
    mesh.material.uniforms.uSigma.value = sigma
  }
}
