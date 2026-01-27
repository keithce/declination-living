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
import { createHeatmapLayer, updateHeatmap } from './layers/HeatmapLayer'
import {
  createCityMarkerLayer,
  findCityAtPosition,
  highlightCityMarker,
  updateCityLabels,
} from './layers/CityMarkerLayer'
import { PLANET_IDS } from './layers/types'
import type { UseGlobeStateReturn } from './hooks/useGlobeState'
import type { CityMarkerData, ExtendedGlobeCanvasProps, LayerGroup } from './layers/types'

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
  /** Ranked cities to display as markers */
  rankedCities?: Array<CityMarkerData>
  /** Callback when user clicks on a city marker */
  onCityMarkerClick?: (city: CityMarkerData) => void
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
    cityMarkers?: LayerGroup
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
    {
      birthLocation,
      declinations,
      acgLines,
      parans,
      globeState,
      className = '',
      onLocationSelect,
      rankedCities,
      onCityMarkerClick,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<SceneRefs | null>(null)
    const raycasterRef = useRef<THREE.Raycaster | null>(null)
    const hitTestSphereRef = useRef<THREE.Mesh | null>(null)

    // Refs for visibility state to avoid recreation when visibility changes
    const planetsRef = useRef(globeState.planets)
    const acgLineTypesRef = useRef(globeState.acgLineTypes)
    const heatmapIntensityRef = useRef(globeState.heatmapIntensity)
    const heatmapSpreadRef = useRef(globeState.heatmapSpread)
    const layersVisibilityRef = useRef(globeState.layers)
    const showCityLabelsRef = useRef(globeState.showCityLabels)
    const highlightedCityRef = useRef(globeState.highlightedCity)

    // Keep refs in sync with state
    useEffect(() => {
      planetsRef.current = globeState.planets
    }, [globeState.planets])

    useEffect(() => {
      acgLineTypesRef.current = globeState.acgLineTypes
    }, [globeState.acgLineTypes])

    useEffect(() => {
      heatmapIntensityRef.current = globeState.heatmapIntensity
    }, [globeState.heatmapIntensity])

    useEffect(() => {
      heatmapSpreadRef.current = globeState.heatmapSpread
    }, [globeState.heatmapSpread])

    useEffect(() => {
      layersVisibilityRef.current = globeState.layers
    }, [globeState.layers])

    useEffect(() => {
      showCityLabelsRef.current = globeState.showCityLabels
    }, [globeState.showCityLabels])

    useEffect(() => {
      highlightedCityRef.current = globeState.highlightedCity
    }, [globeState.highlightedCity])

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
        if (!sceneRef.current || !containerRef.current) return

        const { camera, layers } = sceneRef.current
        const container = containerRef.current

        // Calculate mouse position in normalized device coordinates
        const rect = container.getBoundingClientRect()
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        )

        // Raycast to find intersection (reuse raycaster)
        if (!raycasterRef.current) {
          raycasterRef.current = new THREE.Raycaster()
        }

        // Check city markers first (they're above the globe surface)
        if (layers.cityMarkers && layersVisibilityRef.current.cityMarkers && onCityMarkerClick) {
          const city = findCityAtPosition(
            layers.cityMarkers.group,
            raycasterRef.current,
            camera,
            mouse,
          )
          if (city) {
            onCityMarkerClick(city)
            return // Don't also trigger location select
          }
        }

        // If no city marker hit and we have a location select handler, check globe
        if (!onLocationSelect) return

        raycasterRef.current.setFromCamera(mouse, camera)

        // Lazy-initialize hit test sphere (reused across clicks)
        if (!hitTestSphereRef.current) {
          const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
          const sphereMaterial = new THREE.MeshBasicMaterial({ visible: false })
          hitTestSphereRef.current = new THREE.Mesh(sphereGeometry, sphereMaterial)
        }

        const intersects = raycasterRef.current.intersectObject(hitTestSphereRef.current)

        if (intersects.length > 0) {
          const point = intersects[0].point

          // Convert 3D point to lat/lon (inverse of latLonToVector3)
          const lat = (Math.asin(point.y) * 180) / Math.PI
          let lon = (Math.atan2(point.z, -point.x) * 180) / Math.PI - 180

          // Normalize to -180 to 180
          if (lon < -180) lon += 360
          if (lon > 180) lon -= 360

          onLocationSelect(lat, lon)
        }
      },
      [onLocationSelect, onCityMarkerClick],
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
          layers.cityMarkers?.update?.(time)
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

        // Capture ref value at cleanup time to avoid stale closure issues
        const currentRef = sceneRef.current
        if (!currentRef) return

        const { scene: sceneToDispose, renderer: rendererToDispose } = currentRef

        // Stop animation loop first
        cancelAnimationFrame(currentRef.animationId)

        // Dispose OrbitControls
        currentRef.controls.dispose()

        // Remove and dispose layers (remove from scene BEFORE disposing)
        // Cast needed: optional properties can be explicitly set to undefined at runtime
        ;(Object.values(currentRef.layers) as Array<LayerGroup | undefined>).forEach((layer) => {
          if (!layer) return
          sceneToDispose.remove(layer.group)
          layer.dispose()
        })

        // Dispose hit test sphere
        if (hitTestSphereRef.current) {
          hitTestSphereRef.current.geometry.dispose()
          if (hitTestSphereRef.current.material instanceof THREE.Material) {
            hitTestSphereRef.current.material.dispose()
          }
          hitTestSphereRef.current = null
        }

        // Dispose all remaining scene objects safely
        // Make a copy of children array since we'll be modifying it
        const children = [...sceneToDispose.children]
        children.forEach((object) => {
          sceneToDispose.remove(object)
          if (
            object instanceof THREE.Mesh ||
            object instanceof THREE.Line ||
            object instanceof THREE.Points
          ) {
            object.geometry?.dispose()
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            materials.forEach((mat) => {
              if (mat) {
                Object.values(mat).forEach((value) => {
                  if (value instanceof THREE.Texture) value.dispose()
                })
                mat.dispose()
              }
            })
          }
        })

        // Dispose renderer and remove from DOM
        rendererToDispose.dispose()
        const domElement = rendererToDispose.domElement
        if (domElement.parentNode) {
          domElement.parentNode.removeChild(domElement)
        }

        // Prevent double-cleanup
        sceneRef.current = null
      }
    }, [birthLocation])

    // ==========================================================================
    // Click Handler Effect (separate to avoid scene recreation on callback change)
    // ==========================================================================

    useEffect(() => {
      if (!sceneRef.current) return
      // Only attach if we have either callback
      if (!onLocationSelect && !onCityMarkerClick) return

      const renderer = sceneRef.current.renderer
      renderer.domElement.addEventListener('click', handleClick)

      return () => {
        renderer.domElement.removeEventListener('click', handleClick)
      }
    }, [handleClick, onLocationSelect, onCityMarkerClick])

    // ==========================================================================
    // Layer Management
    // ==========================================================================

    // Create/update zenith bands when DATA changes (not visibility)
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

      // Create new layer with current visibility from ref (avoids stale closure)
      const layer = createZenithBandLayer(zenithLines, planetsRef.current)
      layer.group.visible = layersVisibilityRef.current.zenithBands // Sync visibility on creation
      scene.add(layer.group)
      layers.zenithBands = layer
    }, [declinations]) // Only DATA dependency - visibility handled by separate effect

    // Create/update ACG lines when DATA changes (not visibility)
    useEffect(() => {
      if (!sceneRef.current || !acgLines) return

      const { scene, layers } = sceneRef.current

      // Remove existing layer
      if (layers.acgLines) {
        scene.remove(layers.acgLines.group)
        layers.acgLines.dispose()
      }

      // Create new layer with current visibility from refs (avoids stale closure)
      const layer = createACGLineLayer(acgLines, planetsRef.current, acgLineTypesRef.current)
      layer.group.visible = layersVisibilityRef.current.acgLines // Sync visibility on creation
      scene.add(layer.group)
      layers.acgLines = layer
    }, [acgLines]) // Only DATA dependency - visibility handled by separate effect

    // Create/update paran points when DATA changes (not visibility)
    useEffect(() => {
      if (!sceneRef.current || !parans) return

      const { scene, layers } = sceneRef.current

      // Remove existing layer
      if (layers.paranPoints) {
        scene.remove(layers.paranPoints.group)
        layers.paranPoints.dispose()
      }

      // Create new layer with current visibility from ref (avoids stale closure)
      const layer = createParanPointLayer(parans, planetsRef.current)
      layer.group.visible = layersVisibilityRef.current.paranPoints // Sync visibility on creation
      scene.add(layer.group)
      layers.paranPoints = layer
    }, [parans]) // Only DATA dependency - visibility handled by separate effect

    // Create heatmap when DATA changes or layer is toggled on/off
    useEffect(() => {
      if (!sceneRef.current || !declinations) return

      const { scene, layers } = sceneRef.current

      // Remove existing layer
      if (layers.heatmap) {
        scene.remove(layers.heatmap.group)
        layers.heatmap.dispose()
        layers.heatmap = undefined
      }

      // Only create if layer is enabled
      if (!globeState.layers.heatmap) return

      // Create weights from planet visibility using ref
      const weights = PLANET_IDS.reduce(
        (acc, planet) => ({
          ...acc,
          [planet]: planetsRef.current[planet] ? 5 : 0,
        }),
        {} as Record<string, number>,
      )

      // Create new heatmap layer with current settings from refs
      const layer = createHeatmapLayer({
        declinations,
        weights,
        intensity: heatmapIntensityRef.current,
        sigma: heatmapSpreadRef.current,
      })
      scene.add(layer.group)
      layers.heatmap = layer
    }, [declinations, globeState.layers.heatmap]) // DATA + heatmap toggle dependency

    // Update heatmap when visibility or settings change (without recreation)
    useEffect(() => {
      if (!sceneRef.current?.layers.heatmap || !declinations) return

      const weights = PLANET_IDS.reduce(
        (acc, planet) => ({
          ...acc,
          [planet]: globeState.planets[planet] ? 5 : 0,
        }),
        {} as Record<string, number>,
      )

      updateHeatmap(sceneRef.current.layers.heatmap.group, {
        declinations,
        weights,
        intensity: globeState.heatmapIntensity,
        sigma: globeState.heatmapSpread,
      })
    }, [declinations, globeState.planets, globeState.heatmapIntensity, globeState.heatmapSpread])

    // Create/update city markers when DATA changes
    useEffect(() => {
      if (!sceneRef.current || !rankedCities || rankedCities.length === 0) return

      const { scene, layers } = sceneRef.current

      // Remove existing layer
      if (layers.cityMarkers) {
        scene.remove(layers.cityMarkers.group)
        layers.cityMarkers.dispose()
      }

      // Create new layer with current settings
      const layer = createCityMarkerLayer(rankedCities, {
        showLabels: showCityLabelsRef.current,
        maxMarkers: 50,
      })
      layer.group.visible = layersVisibilityRef.current.cityMarkers
      scene.add(layer.group)
      layers.cityMarkers = layer

      // Apply current highlight if any
      if (highlightedCityRef.current) {
        highlightCityMarker(layer.group, highlightedCityRef.current)
      }
    }, [rankedCities])

    // ==========================================================================
    // Layer Visibility (using group.visible)
    // ==========================================================================

    // Layer visibility (using group.visible) - consolidated for atomicity
    useEffect(() => {
      if (!sceneRef.current) return
      const { layers } = sceneRef.current

      if (layers.zenithBands) {
        layers.zenithBands.group.visible = globeState.layers.zenithBands
      }
      if (layers.acgLines) {
        layers.acgLines.group.visible = globeState.layers.acgLines
      }
      if (layers.paranPoints) {
        layers.paranPoints.group.visible = globeState.layers.paranPoints
      }
      if (layers.cityMarkers) {
        layers.cityMarkers.group.visible = globeState.layers.cityMarkers
      }
    }, [
      globeState.layers.zenithBands,
      globeState.layers.acgLines,
      globeState.layers.paranPoints,
      globeState.layers.cityMarkers,
    ])

    // Heatmap visibility (handled by creation/destruction in the heatmap effect above)

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

    // City label visibility
    useEffect(() => {
      if (!sceneRef.current?.layers.cityMarkers) return
      updateCityLabels(sceneRef.current.layers.cityMarkers.group, globeState.showCityLabels)
    }, [globeState.showCityLabels])

    // City marker highlighting
    useEffect(() => {
      if (!sceneRef.current?.layers.cityMarkers) return
      highlightCityMarker(sceneRef.current.layers.cityMarkers.group, globeState.highlightedCity)
    }, [globeState.highlightedCity])

    return <div ref={containerRef} className={`w-full h-full ${className}`} />
  },
)

export default EnhancedGlobeCanvas
