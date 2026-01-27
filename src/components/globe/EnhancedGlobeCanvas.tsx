/**
 * Enhanced Globe Canvas - 3D globe with declination visualization layers.
 *
 * Renders the Earth with multiple visualization layers:
 * - Zenith bands (declination latitudes)
 * - ACG lines (ASC/DSC/MC/IC)
 * - Paran intersection points
 * - Heatmap overlay
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createZenithBandLayer, updateZenithBandVisibility } from './layers/ZenithBandLayer'
import { createACGLineLayer, updateACGLineVisibility } from './layers/ACGLineLayer'
import { createParanPointLayer, updateParanPointVisibility } from './layers/ParanPointLayer'
import { createHeatmapLayer } from './layers/HeatmapLayer'
import { PLANET_IDS } from './layers/types'
import type { UseGlobeStateReturn } from './hooks/useGlobeState'
import type { ExtendedGlobeCanvasProps, LayerGroup } from './layers/types'

// =============================================================================
// Types
// =============================================================================

interface EnhancedGlobeCanvasProps extends ExtendedGlobeCanvasProps {
  /** Globe state from useGlobeState hook */
  globeState: UseGlobeStateReturn
  /** Optional class name */
  className?: string
  /** Callback when user clicks on globe surface */
  onLocationSelect?: (lat: number, lon: number) => void
}

/** Imperative handle for controlling the globe */
export interface EnhancedGlobeCanvasRef {
  /** Zoom/pan to a specific location */
  focusLocation: (lat: number, lon: number, zoom?: number) => void
}

interface SceneRefs {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  animationId: number
  layers: {
    zenithBands?: LayerGroup
    acgLines?: LayerGroup
    paranPoints?: LayerGroup
    heatmap?: LayerGroup
  }
}

// =============================================================================
// Helper Functions
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
 * Create stars background.
 */
function createStars(): THREE.Points {
  const starsGeometry = new THREE.BufferGeometry()
  const starsPositions: Array<number> = []

  for (let i = 0; i < 2000; i++) {
    const x = (Math.random() - 0.5) * 100
    const y = (Math.random() - 0.5) * 100
    const z = (Math.random() - 0.5) * 100

    if (Math.sqrt(x * x + y * y + z * z) > 20) {
      starsPositions.push(x, y, z)
    }
  }

  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsPositions, 3))

  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.8,
  })

  return new THREE.Points(starsGeometry, starsMaterial)
}

// =============================================================================
// Main Component
// =============================================================================

export const EnhancedGlobeCanvas = forwardRef<EnhancedGlobeCanvasRef, EnhancedGlobeCanvasProps>(
  function EnhancedGlobeCanvas(
    { birthLocation, declinations, acgLines, parans, globeState, className = '', onLocationSelect },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<SceneRefs | null>(null)
    const raycasterRef = useRef<THREE.Raycaster | null>(null)

    // ==========================================================================
    // Imperative Handle
    // ==========================================================================

    useImperativeHandle(ref, () => ({
      focusLocation: (lat: number, lon: number, zoom = 3) => {
        if (!sceneRef.current) return

        const { camera, controls } = sceneRef.current
        const pos = latLonToVector3(lat, lon, zoom)

        // Animate camera to position
        camera.position.set(pos.x * 1.5, pos.y * 1.5, pos.z * 1.5)
        controls.target.set(0, 0, 0)
        controls.update()
      },
    }))

    // ==========================================================================
    // Click Handler
    // ==========================================================================

    const handleClick = useCallback(
      (event: MouseEvent) => {
        if (!sceneRef.current || !containerRef.current || !onLocationSelect) return

        const { camera } = sceneRef.current
        const container = containerRef.current

        // Calculate mouse position in normalized device coordinates
        const rect = container.getBoundingClientRect()
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        )

        // Raycast to find intersection with globe (reuse raycaster)
        if (!raycasterRef.current) {
          raycasterRef.current = new THREE.Raycaster()
        }
        raycasterRef.current.setFromCamera(mouse, camera)

        // Check intersection with a sphere at origin with radius 1
        const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
        const sphereMaterial = new THREE.MeshBasicMaterial()
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
        const intersects = raycasterRef.current.intersectObject(sphere)

        if (intersects.length > 0) {
          const point = intersects[0].point

          // Convert 3D point to lat/lon
          const lat = (Math.asin(point.y) * 180) / Math.PI
          const lon = (Math.atan2(-point.z, -point.x) * 180) / Math.PI + 180

          onLocationSelect(lat, lon > 180 ? lon - 360 : lon)
        }

        // Cleanup
        sphereGeometry.dispose()
        sphereMaterial.dispose()
      },
      [onLocationSelect],
    )

    // ==========================================================================
    // Scene Setup
    // ==========================================================================

    useEffect(() => {
      if (!containerRef.current) return

      const container = containerRef.current
      const width = container.clientWidth
      const height = container.clientHeight

      // Scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#0a0f1f')

      // Camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
      camera.position.z = 4

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      container.appendChild(renderer.domElement)

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.minDistance = 2
      controls.maxDistance = 8
      controls.enablePan = false

      // Earth sphere
      const earthGeometry = new THREE.SphereGeometry(1, 64, 64)
      const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x1e3a5f,
        emissive: 0x112244,
        emissiveIntensity: 0.2,
        shininess: 5,
      })
      const earth = new THREE.Mesh(earthGeometry, earthMaterial)
      scene.add(earth)

      // Wireframe overlay
      const wireframeGeometry = new THREE.SphereGeometry(1.001, 32, 32)
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x334455,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      })
      const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial)
      scene.add(wireframe)

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
      scene.add(ambientLight)

      const pointLight = new THREE.PointLight(0xffeedd, 1, 100)
      pointLight.position.set(5, 3, 5)
      scene.add(pointLight)

      // Stars
      const stars = createStars()
      scene.add(stars)

      // Birth location marker
      if (birthLocation) {
        const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16)
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 })
        const marker = new THREE.Mesh(markerGeometry, markerMaterial)

        const pos = latLonToVector3(birthLocation.latitude, birthLocation.longitude, 1.02)
        marker.position.copy(pos)
        scene.add(marker)

        // Pulsing ring
        const pulseGeometry = new THREE.RingGeometry(0.03, 0.05, 32)
        const pulseMaterial = new THREE.MeshBasicMaterial({
          color: 0xff4444,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
        })
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial)
        pulse.position.copy(pos)
        pulse.lookAt(0, 0, 0)
        scene.add(pulse)
      }

      // Store refs
      sceneRef.current = {
        scene,
        camera,
        renderer,
        controls,
        animationId: 0,
        layers: {},
      }

      // Animation loop
      let time = 0
      const animate = () => {
        const animationId = requestAnimationFrame(animate)
        if (sceneRef.current) {
          sceneRef.current.animationId = animationId
        }

        time += 0.016 // ~60fps
        controls.update()

        // Update layer animations
        const layers = sceneRef.current?.layers
        if (layers) {
          layers.zenithBands?.update?.(time)
          layers.paranPoints?.update?.(time)
          layers.heatmap?.update?.(time)
        }

        renderer.render(scene, camera)
      }

      animate()

      // Handle resize
      const handleResize = () => {
        const newWidth = container.clientWidth
        const newHeight = container.clientHeight

        camera.aspect = newWidth / newHeight
        camera.updateProjectionMatrix()
        renderer.setSize(newWidth, newHeight)
      }

      window.addEventListener('resize', handleResize)

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize)
        if (sceneRef.current) {
          cancelAnimationFrame(sceneRef.current.animationId)

          // Dispose layers
          Object.values(sceneRef.current.layers).forEach((layer) => {
            layer.dispose()
          })
        }
        renderer.dispose()
        container.removeChild(renderer.domElement)
      }
    }, [birthLocation])

    // ==========================================================================
    // Click Handler Effect (separate to avoid scene recreation on callback change)
    // ==========================================================================

    useEffect(() => {
      if (!sceneRef.current || !onLocationSelect) return

      const renderer = sceneRef.current.renderer
      renderer.domElement.addEventListener('click', handleClick)

      return () => {
        renderer.domElement.removeEventListener('click', handleClick)
      }
    }, [handleClick, onLocationSelect])

    // ==========================================================================
    // Layer Management
    // ==========================================================================

    // Create/update zenith bands when data changes
    useEffect(() => {
      if (!sceneRef.current || !declinations) return

      const { scene, layers } = sceneRef.current

      // Remove existing layer
      if (layers.zenithBands) {
        scene.remove(layers.zenithBands.group)
        layers.zenithBands.dispose()
      }

      // Create zenith line data from declinations (filter out undefined values)
      const zenithLines = PLANET_IDS.filter((planet) => declinations[planet] !== undefined).map(
        (planet) => {
          const lat = declinations[planet]!
          return {
            planet,
            latitude: lat,
            orbMin: lat - 1,
            orbMax: lat + 1,
          }
        },
      )

      // Create new layer
      const layer = createZenithBandLayer(zenithLines, globeState.planets)
      scene.add(layer.group)
      layers.zenithBands = layer
    }, [declinations, globeState.planets])

    // Create/update ACG lines when data changes
    useEffect(() => {
      if (!sceneRef.current || !acgLines) return

      const { scene, layers } = sceneRef.current

      // Remove existing layer
      if (layers.acgLines) {
        scene.remove(layers.acgLines.group)
        layers.acgLines.dispose()
      }

      // Create new layer
      const layer = createACGLineLayer(acgLines, globeState.planets, globeState.acgLineTypes)
      scene.add(layer.group)
      layers.acgLines = layer
    }, [acgLines, globeState.planets, globeState.acgLineTypes])

    // Create/update paran points when data changes
    useEffect(() => {
      if (!sceneRef.current || !parans) return

      const { scene, layers } = sceneRef.current

      // Remove existing layer
      if (layers.paranPoints) {
        scene.remove(layers.paranPoints.group)
        layers.paranPoints.dispose()
      }

      // Create new layer
      const layer = createParanPointLayer(parans, globeState.planets)
      scene.add(layer.group)
      layers.paranPoints = layer
    }, [parans, globeState.planets])

    // Update heatmap when data or settings change
    useEffect(() => {
      if (!sceneRef.current || !declinations) return

      const { scene, layers } = sceneRef.current

      // Remove existing layer
      if (layers.heatmap) {
        scene.remove(layers.heatmap.group)
        layers.heatmap.dispose()
      }

      if (!globeState.layers.heatmap) return

      // Create weights from planet visibility
      const weights = PLANET_IDS.reduce(
        (acc, planet) => ({
          ...acc,
          [planet]: globeState.planets[planet] ? 5 : 0,
        }),
        {} as Record<string, number>,
      )

      // Create new heatmap layer
      const layer = createHeatmapLayer({
        declinations,
        weights,
        intensity: globeState.heatmapIntensity,
        sigma: globeState.heatmapSpread,
      })
      scene.add(layer.group)
      layers.heatmap = layer
    }, [
      declinations,
      globeState.planets,
      globeState.layers.heatmap,
      globeState.heatmapIntensity,
      globeState.heatmapSpread,
    ])

    // ==========================================================================
    // Layer Visibility (separate effects to avoid race conditions)
    // ==========================================================================

    // Zenith bands visibility
    useEffect(() => {
      if (sceneRef.current?.layers.zenithBands) {
        sceneRef.current.layers.zenithBands.group.visible = globeState.layers.zenithBands
      }
    }, [globeState.layers.zenithBands])

    // ACG lines visibility
    useEffect(() => {
      if (sceneRef.current?.layers.acgLines) {
        sceneRef.current.layers.acgLines.group.visible = globeState.layers.acgLines
      }
    }, [globeState.layers.acgLines])

    // Paran points visibility
    useEffect(() => {
      if (sceneRef.current?.layers.paranPoints) {
        sceneRef.current.layers.paranPoints.group.visible = globeState.layers.paranPoints
      }
    }, [globeState.layers.paranPoints])

    // Heatmap visibility
    useEffect(() => {
      if (sceneRef.current?.layers.heatmap) {
        sceneRef.current.layers.heatmap.group.visible = globeState.layers.heatmap
      }
    }, [globeState.layers.heatmap])

    // Planet/ACG type filters - updates individual mesh visibility within layers
    useEffect(() => {
      if (!sceneRef.current) return
      const { layers } = sceneRef.current

      if (layers.zenithBands) {
        updateZenithBandVisibility(layers.zenithBands.group, globeState.planets)
      }
      if (layers.acgLines) {
        updateACGLineVisibility(layers.acgLines.group, globeState.planets, globeState.acgLineTypes)
      }
      if (layers.paranPoints) {
        updateParanPointVisibility(layers.paranPoints.group, globeState.planets)
      }
    }, [globeState.planets, globeState.acgLineTypes])

    return <div ref={containerRef} className={`w-full h-full ${className}`} />
  },
)

export default EnhancedGlobeCanvas
