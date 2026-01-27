/**
 * Async texture loader with proper color spaces and anisotropic filtering.
 */

import * as THREE from 'three'

export interface EarthTextures {
  day: THREE.Texture
  night: THREE.Texture
  normal: THREE.Texture
  specular: THREE.Texture
}

const TEXTURE_PATHS = {
  day: '/textures/earth_atmos_2048.jpg',
  night: '/textures/earth_lights_2048.png',
  normal: '/textures/earth_normal_2048.jpg',
  specular: '/textures/earth_specular_2048.jpg',
} as const

const TEXTURE_ENTRIES = [
  { key: 'day', path: TEXTURE_PATHS.day, colorSpace: THREE.SRGBColorSpace },
  { key: 'night', path: TEXTURE_PATHS.night, colorSpace: THREE.SRGBColorSpace },
  { key: 'normal', path: TEXTURE_PATHS.normal, colorSpace: THREE.LinearSRGBColorSpace },
  { key: 'specular', path: TEXTURE_PATHS.specular, colorSpace: THREE.LinearSRGBColorSpace },
] as const

function createFallbackTexture(
  colorSpace: THREE.ColorSpace,
  maxAnisotropy: number,
): THREE.DataTexture {
  const data = new Uint8Array([128, 128, 128, 255])
  const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat)
  texture.colorSpace = colorSpace
  texture.anisotropy = Math.min(8, maxAnisotropy)
  texture.needsUpdate = true
  return texture
}

function loadTexture(
  loader: THREE.TextureLoader,
  path: string,
  colorSpace: THREE.ColorSpace,
  maxAnisotropy: number,
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (texture) => {
        texture.colorSpace = colorSpace
        texture.anisotropy = Math.min(8, maxAnisotropy)
        resolve(texture)
      },
      undefined,
      reject,
    )
  })
}

export async function loadEarthTextures(maxAnisotropy = 8): Promise<EarthTextures> {
  const loader = new THREE.TextureLoader()

  const results = await Promise.allSettled(
    TEXTURE_ENTRIES.map(({ path, colorSpace }) =>
      loadTexture(loader, path, colorSpace, maxAnisotropy),
    ),
  )

  const textures = {} as Record<string, THREE.Texture>
  for (let i = 0; i < TEXTURE_ENTRIES.length; i++) {
    const { key, colorSpace } = TEXTURE_ENTRIES[i]
    const result = results[i]
    if (result.status === 'fulfilled') {
      textures[key] = result.value
    } else {
      console.warn(`Failed to load texture "${key}" (${TEXTURE_ENTRIES[i].path}):`, result.reason)
      textures[key] = createFallbackTexture(colorSpace, maxAnisotropy)
    }
  }

  return textures as EarthTextures
}

export function disposeEarthTextures(textures: EarthTextures): void {
  textures.day.dispose()
  textures.night.dispose()
  textures.normal.dispose()
  textures.specular.dispose()
}
