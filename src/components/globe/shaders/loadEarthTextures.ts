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

function loadTexture(
  loader: THREE.TextureLoader,
  path: string,
  colorSpace: THREE.ColorSpace,
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (texture) => {
        texture.colorSpace = colorSpace
        texture.anisotropy = 8
        resolve(texture)
      },
      undefined,
      reject,
    )
  })
}

export async function loadEarthTextures(): Promise<EarthTextures> {
  const loader = new THREE.TextureLoader()

  const [day, night, normal, specular] = await Promise.all([
    loadTexture(loader, TEXTURE_PATHS.day, THREE.SRGBColorSpace),
    loadTexture(loader, TEXTURE_PATHS.night, THREE.SRGBColorSpace),
    loadTexture(loader, TEXTURE_PATHS.normal, THREE.LinearSRGBColorSpace),
    loadTexture(loader, TEXTURE_PATHS.specular, THREE.LinearSRGBColorSpace),
  ])

  return { day, night, normal, specular }
}

export function disposeEarthTextures(textures: EarthTextures): void {
  textures.day.dispose()
  textures.night.dispose()
  textures.normal.dispose()
  textures.specular.dispose()
}
