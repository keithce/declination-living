/**
 * Fresnel atmosphere glow rendered on a BackSide sphere outside the globe.
 * Blue on the day side, warm orange at the terminator, dim on the night side.
 */

import * as THREE from 'three'

const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform float uAlwaysDay;

  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 N = normalize(vNormal);

    // Fresnel effect — stronger at edges
    float fresnel = pow(1.0 - abs(dot(viewDir, N)), 2.0);

    // Sun direction in view space
    vec3 sunDirView = normalize((viewMatrix * vec4(uSunDirection, 0.0)).xyz);
    float sunDot = dot(N, sunDirView);

    // Day side: blue atmosphere; terminator: warm orange; night: dim
    vec3 dayGlow = vec3(0.3, 0.6, 1.0);
    vec3 twilightGlow = vec3(1.0, 0.5, 0.2);
    vec3 nightGlow = vec3(0.05, 0.05, 0.15);

    // Blend between day and twilight near terminator
    float twilightFactor = (1.0 - uAlwaysDay) * (1.0 - smoothstep(-0.1, 0.3, abs(sunDot)));
    float dayFactor = smoothstep(-0.1, 0.5, sunDot);
    dayFactor = mix(dayFactor, 1.0, uAlwaysDay);

    vec3 glowColor = mix(nightGlow, dayGlow, dayFactor);
    glowColor = mix(glowColor, twilightGlow, twilightFactor * 0.6);

    // Intensity modulated by fresnel
    float intensity = fresnel * mix(0.3, 1.0, dayFactor);

    gl_FragColor = vec4(glowColor, intensity * 0.6);
  }
`

export function createAtmosphereMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSunDirection: { value: new THREE.Vector3(5, 3, 5).normalize() },
      uAlwaysDay: { value: 0.0 },
    },
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })
}
