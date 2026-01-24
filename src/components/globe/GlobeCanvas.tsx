import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface LatitudeBand {
  min: number
  max: number
  dominantPlanet: string
}

interface LatitudeScore {
  latitude: number
  score: number
  dominantPlanet: string
}

interface GlobeCanvasProps {
  optimalLatitudes: Array<LatitudeScore>
  latitudeBands: Array<LatitudeBand>
  birthLocation?: {
    latitude: number
    longitude: number
    city: string
  }
}

const PLANET_COLORS: Record<string, string> = {
  sun: '#fbbf24',
  moon: '#e2e8f0',
  mercury: '#a78bfa',
  venus: '#f472b6',
  mars: '#ef4444',
  jupiter: '#f97316',
  saturn: '#78716c',
  uranus: '#22d3ee',
  neptune: '#818cf8',
  pluto: '#a3a3a3',
}

// Convert lat/lon to 3D position on sphere
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

export function GlobeCanvas({ optimalLatitudes, latitudeBands, birthLocation }: GlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    animationId: number
  } | null>(null)

  // Memoize data to prevent unnecessary re-renders
  const topLatitudes = useMemo(() => optimalLatitudes.slice(0, 10), [optimalLatitudes])

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene setup
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

    // Latitude rings (at specific latitudes)
    const createLatitudeRing = (lat: number, color: string, opacity: number = 1) => {
      const phi = (90 - lat) * (Math.PI / 180)
      const radius = Math.sin(phi) * 1.01
      const y = Math.cos(phi) * 1.01

      const ringGeometry = new THREE.RingGeometry(radius - 0.005, radius + 0.005, 64)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: opacity,
      })

      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.position.y = y
      ring.rotation.x = Math.PI / 2

      return ring
    }

    // Add latitude bands
    latitudeBands.forEach((band) => {
      const color = PLANET_COLORS[band.dominantPlanet] || '#fbbf24'
      const midLat = (band.min + band.max) / 2

      // Create a band (multiple rings)
      for (let lat = band.min; lat <= band.max; lat += 2) {
        const distFromCenter = Math.abs(lat - midLat)
        const maxDist = (band.max - band.min) / 2
        const opacity = 0.15 + 0.15 * (1 - distFromCenter / (maxDist || 1))
        const ring = createLatitudeRing(lat, color, opacity)
        scene.add(ring)
      }
    })

    // Add optimal latitude markers
    topLatitudes.forEach((latScore, index) => {
      const color = PLANET_COLORS[latScore.dominantPlanet] || '#fbbf24'

      // Create ring at this latitude
      const ring = createLatitudeRing(latScore.latitude, color, 0.6)
      scene.add(ring)

      // Add marker point on the ring
      const markerGeometry = new THREE.SphereGeometry(0.02 + index * 0.001, 16, 16)
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
      })
      const marker = new THREE.Mesh(markerGeometry, markerMaterial)

      // Position marker at a specific longitude on the latitude
      const lon = -90 + index * 18 // Spread markers around
      const pos = latLonToVector3(latScore.latitude, lon, 1.02)
      marker.position.copy(pos)
      scene.add(marker)
    })

    // Birth location marker
    if (birthLocation) {
      const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16)
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 })
      const marker = new THREE.Mesh(markerGeometry, markerMaterial)

      const pos = latLonToVector3(birthLocation.latitude, birthLocation.longitude, 1.02)
      marker.position.copy(pos)
      scene.add(marker)

      // Pulsing ring around birth location
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

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)

    // Point light (sun-like)
    const pointLight = new THREE.PointLight(0xffeedd, 1, 100)
    pointLight.position.set(5, 3, 5)
    scene.add(pointLight)

    // Stars background
    const starsGeometry = new THREE.BufferGeometry()
    const starsPositions = []
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 100
      const y = (Math.random() - 0.5) * 100
      const z = (Math.random() - 0.5) * 100

      // Only add if far enough from center
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
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)

    // Animation loop
    let time = 0
    const animate = () => {
      const animationId = requestAnimationFrame(animate)
      sceneRef.current = {
        scene,
        camera,
        renderer,
        controls,
        animationId,
      }

      time += 0.01
      controls.update()

      // Slow auto-rotation when not interacting
      if (!controls.enabled) {
        earth.rotation.y += 0.001
        wireframe.rotation.y += 0.001
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
      }
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [topLatitudes, latitudeBands, birthLocation])

  return <div ref={containerRef} className="w-full h-full" />
}

export default GlobeCanvas
