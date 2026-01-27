/**
 * Custom Earth shader with day/night blending, normal-mapped terrain,
 * and specular water highlights.
 */

import * as THREE from 'three'

const earthVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vTangent;
  varying vec3 vBitangent;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;

    // Approximate tangent from sphere UV mapping
    vec3 tangent = normalize(cross(vec3(0.0, 1.0, 0.0), normal));
    // Handle poles where cross product degenerates
    if (length(tangent) < 0.001) {
      tangent = normalize(cross(vec3(0.0, 0.0, 1.0), normal));
    }
    vec3 bitangent = normalize(cross(normal, tangent));

    vTangent = normalize(normalMatrix * tangent);
    vBitangent = normalize(normalMatrix * bitangent);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const earthFragmentShader = /* glsl */ `
  uniform sampler2D uDayMap;
  uniform sampler2D uNightMap;
  uniform sampler2D uNormalMap;
  uniform sampler2D uSpecularMap;
  uniform vec3 uSunDirection;
  uniform float uNormalScale;
  uniform float uAlwaysDay;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vTangent;
  varying vec3 vBitangent;

  void main() {
    // Sample textures
    vec3 dayColor = texture2D(uDayMap, vUv).rgb;
    vec3 nightColor = texture2D(uNightMap, vUv).rgb;
    float specMask = texture2D(uSpecularMap, vUv).r;

    // Normal mapping via TBN matrix
    vec3 normalSample = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;
    normalSample.xy *= uNormalScale;
    mat3 tbn = mat3(vTangent, vBitangent, vNormal);
    vec3 N = normalize(tbn * normalSample);

    // Sun direction in view space
    vec3 sunDirView = normalize((viewMatrix * vec4(uSunDirection, 0.0)).xyz);

    // Diffuse lighting
    float diffuse = dot(N, sunDirView);
    float dayFactor = smoothstep(-0.25, 0.5, diffuse);

    // Blinn-Phong specular (water only)
    vec3 viewDir = normalize(-vPosition);
    vec3 halfDir = normalize(sunDirView + viewDir);
    float spec = pow(max(dot(N, halfDir), 0.0), 64.0) * specMask;
    // Only show specular on the lit side
    spec *= smoothstep(0.0, 0.3, diffuse);

    // Combine day/night
    vec3 dayLit = dayColor * (0.1 + 0.9 * max(diffuse, 0.0));
    vec3 finalColor = mix(nightColor, dayLit, dayFactor);

    // Add specular highlights
    finalColor += vec3(0.4) * spec;

    // Always Day: show raw day texture at full brightness, skip all lighting
    finalColor = mix(finalColor, dayColor, uAlwaysDay);

    gl_FragColor = vec4(finalColor, 1.0);

    // Convert linear working space → output color space (sRGB)
    #include <colorspace_fragment>
  }
`

/** Placeholder 1×1 dark-blue texture for use before real textures load. */
function createPlaceholderTexture(color: [number, number, number]): THREE.DataTexture {
  const data = new Uint8Array([color[0], color[1], color[2], 255])
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat)
  tex.needsUpdate = true
  return tex
}

export interface EarthMaterialUniforms {
  uDayMap: THREE.IUniform<THREE.Texture>
  uNightMap: THREE.IUniform<THREE.Texture>
  uNormalMap: THREE.IUniform<THREE.Texture>
  uSpecularMap: THREE.IUniform<THREE.Texture>
  uSunDirection: THREE.IUniform<THREE.Vector3>
  uNormalScale: THREE.IUniform<number>
  uAlwaysDay: THREE.IUniform<number>
}

export function createEarthMaterial(): THREE.ShaderMaterial {
  const placeholder = createPlaceholderTexture([30, 58, 95])
  const blackPlaceholder = createPlaceholderTexture([0, 0, 0])
  const flatNormal = createPlaceholderTexture([128, 128, 255]) // flat normal

  const uniforms: EarthMaterialUniforms = {
    uDayMap: { value: placeholder },
    uNightMap: { value: blackPlaceholder },
    uNormalMap: { value: flatNormal },
    uSpecularMap: { value: blackPlaceholder },
    uSunDirection: { value: new THREE.Vector3(5, 3, 5).normalize() },
    uNormalScale: { value: 1.0 },
    uAlwaysDay: { value: 0.0 },
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: earthVertexShader,
    fragmentShader: earthFragmentShader,
  })

  material.userData.placeholders = { placeholder, blackPlaceholder, flatNormal }

  return material
}
