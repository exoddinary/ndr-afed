'use client'

import React, { useState, Suspense, useEffect, useMemo, useRef, type FC } from 'react'
import * as THREE from 'three'
import { Play, Pause } from 'lucide-react'

// We need to dynamically import WebGPU components
let WebGPURenderer: any = null
let PostProcessing: any = null

// Dynamic import for WebGPU
const loadWebGPU = async () => {
    try {
        const webgpu = await import('three/webgpu')
        WebGPURenderer = webgpu.WebGPURenderer
        return true
    } catch (e) {
        console.error('WebGPU not available:', e)
        return false
    }
}

// Import Takram atmosphere
import {
    getECIToECEFRotationMatrix,
    getMoonDirectionECI,
    getSunDirectionECI
} from '@takram/three-atmosphere'

// Import block data
import blockData from '@/data/exploration-blocks.json'

// Earth constants
const EARTH_RADIUS = 6.371 // km scaled

interface GlobeTakramFullProps {
    onBlockSelect?: (properties: any) => void
    selectedBlock?: any
    blockData?: any
}

// Convert lat/lng to 3D position
const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    const x = -radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.cos(phi)
    const z = radius * Math.sin(phi) * Math.sin(theta)
    return new THREE.Vector3(x, y, z)
}

// Get polygon center
const getPolygonCenter = (coordinates: number[][][]): [number, number] => {
    const coords = coordinates[0]
    let sumLng = 0, sumLat = 0
    coords.forEach(([lng, lat]) => {
        sumLng += lng
        sumLat += lat
    })
    return [sumLng / coords.length, sumLat / coords.length]
}

// Main component using Takram's R3F components
const GlobeTakramFull: FC<GlobeTakramFullProps> = ({
    onBlockSelect = () => {},
    selectedBlock,
    blockData: propBlockData
}) => {
    const [isAutoRotating, setIsAutoRotating] = useState(true)
    const [date, setDate] = useState(() => new Date())
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<any>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const animationRef = useRef<number>(0)
    const [isReady, setIsReady] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Refs for dynamic updates from Leva
    const earthRef = useRef<THREE.Mesh | null>(null)
    const atmosphereMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null)
    const sunLightRef = useRef<THREE.DirectionalLight | null>(null)
    const flowParticlesRef = useRef<THREE.Mesh[]>([])
    const lineMaterialsRef = useRef<THREE.LineBasicMaterial[]>([])
    const sunSpeedRef = useRef(0.01)
    
    // Default settings (from Leva adjustments)
    const dayOfYear = 172
    const timeOfDay = 12
    const exposure = 1.0
    const sunSpeed = 0.01
    const earthRotationY = -2.5
    const earthRotationX = -0.1
    const showFlowParticles = true
    
    const atmosphereOpacity = 0.15
    const lineOpacity = 0.15
    const sunIntensity = 3
    
    // Set initial values
    useEffect(() => {
        sunSpeedRef.current = sunSpeed
    }, [sunSpeed])

    // Update date for sun position
    useEffect(() => {
        if (!isAutoRotating) return
        
        const interval = setInterval(() => {
            setDate(prev => {
                const newDate = new Date(prev)
                newDate.setMinutes(newDate.getMinutes() + 10) // Speed up time
                return newDate
            })
        }, 100)
        
        return () => clearInterval(interval)
    }, [isAutoRotating])

    // Initialize WebGPU renderer
    useEffect(() => {
        const init = async () => {
            if (!canvasRef.current) return

            // Check WebGPU support
            if (!navigator.gpu) {
                setError('WebGPU is not supported in this browser. Please use Chrome 113+ or Edge 113+.')
                return
            }

            try {
                const adapter = await navigator.gpu.requestAdapter()
                if (!adapter) {
                    setError('Could not get WebGPU adapter')
                    return
                }

                // Import Three.js WebGPU
                const { WebGPURenderer } = await import('three/webgpu')

                // Create renderer
                const renderer = new WebGPURenderer({
                    canvas: canvasRef.current,
                    antialias: true,
                })
                await renderer.init()
                renderer.setSize(window.innerWidth, window.innerHeight)
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
                renderer.toneMapping = THREE.ACESFilmicToneMapping
                renderer.toneMappingExposure = 1.0
                rendererRef.current = renderer

                // Create scene
                const scene = new THREE.Scene()
                scene.background = new THREE.Color(0x000000)
                sceneRef.current = scene

                // Create camera - positioned to view Indonesia
                const camera = new THREE.PerspectiveCamera(
                    45,
                    window.innerWidth / window.innerHeight,
                    0.1,
                    1000
                )
                camera.position.set(EARTH_RADIUS * 2.5, EARTH_RADIUS * 0.5, EARTH_RADIUS * 1.5)
                camera.lookAt(0, 0, 0)
                cameraRef.current = camera

                // Create Earth
                const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 128, 128)
                const textureLoader = new THREE.TextureLoader()
                
                const earthTexture = textureLoader.load(
                    'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg'
                )
                earthTexture.colorSpace = THREE.SRGBColorSpace
                
                // Earth material - clean look, let lighting do the work
                const earthMaterial = new THREE.MeshPhongMaterial({
                    map: earthTexture,
                    shininess: 5,
                })
                
                const earth = new THREE.Mesh(earthGeometry, earthMaterial)
                earth.rotation.set(-0.1, -2.5, 0) // Rotate to show Indonesia
                scene.add(earth)
                earthRef.current = earth // Store ref for Leva updates

                // Add subtle atmosphere glow at the limb only (no haze overlay)
                const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.015, 64, 64)
                const atmosphereMaterial = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(0.4, 0.6, 1.0), // Blue atmosphere
                    transparent: true,
                    opacity: 0.12,
                    side: THREE.BackSide,
                    depthWrite: false,
                })
                const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
                scene.add(atmosphere)
                atmosphereMaterialRef.current = atmosphereMaterial

                // Add AtmosphereLight-style sun light
                // Based on Takram's AtmosphereLight: DirectionalLight that follows sun direction
                const sunLight = new THREE.DirectionalLight(0xfff8e7, 3)
                sunLight.position.set(50, 20, 30)
                sunLight.target.position.set(0, 0, 0) // Target Earth center
                scene.add(sunLight)
                scene.add(sunLight.target) // Must add target to scene
                sunLightRef.current = sunLight // Store ref

                // Add indirect sky light (simulates atmospheric scattering bounce light)
                // This provides fill light from the sky dome
                const skyLight = new THREE.HemisphereLight(
                    0x87ceeb, // Sky color (light blue)
                    0x362d1e, // Ground color (dark brown)
                    0.3       // Intensity
                )
                scene.add(skyLight)

                // Add subtle ambient for shadow fill
                const ambientLight = new THREE.AmbientLight(0x4466aa, 0.15)
                scene.add(ambientLight)

                // Add subtle sun glow with 8-direction streaks
                const sunGroup = new THREE.Group()
                sunGroup.position.set(50, 20, 30)
                
                // Core sun glow
                const glowCanvas = document.createElement('canvas')
                glowCanvas.width = 256
                glowCanvas.height = 256
                const glowCtx = glowCanvas.getContext('2d')!
                const gradient = glowCtx.createRadialGradient(128, 128, 0, 128, 128, 128)
                gradient.addColorStop(0, 'rgba(255, 255, 250, 0.9)')
                gradient.addColorStop(0.1, 'rgba(255, 250, 240, 0.5)')
                gradient.addColorStop(0.3, 'rgba(255, 245, 220, 0.2)')
                gradient.addColorStop(0.6, 'rgba(255, 240, 200, 0.05)')
                gradient.addColorStop(1, 'rgba(255, 230, 180, 0)')
                glowCtx.fillStyle = gradient
                glowCtx.fillRect(0, 0, 256, 256)
                
                const glowTexture = new THREE.CanvasTexture(glowCanvas)
                const sunSprite = new THREE.Sprite(
                    new THREE.SpriteMaterial({
                        map: glowTexture,
                        transparent: true,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                    })
                )
                sunSprite.scale.set(20, 20, 1)
                sunGroup.add(sunSprite)
                
                // Subtle streak texture
                const streakCanvas = document.createElement('canvas')
                streakCanvas.width = 256
                streakCanvas.height = 16
                const streakCtx = streakCanvas.getContext('2d')!
                const streakGradient = streakCtx.createLinearGradient(0, 8, 256, 8)
                streakGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
                streakGradient.addColorStop(0.4, 'rgba(255, 252, 245, 0.03)')
                streakGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)')
                streakGradient.addColorStop(0.6, 'rgba(255, 252, 245, 0.03)')
                streakGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
                streakCtx.fillStyle = streakGradient
                streakCtx.fillRect(0, 0, 256, 16)
                
                const streakTexture = new THREE.CanvasTexture(streakCanvas)
                
                // Add 8 directional streaks (every 45 degrees)
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI) / 4 // 0, 45, 90, 135, 180, 225, 270, 315 degrees
                    const streakSprite = new THREE.Sprite(
                        new THREE.SpriteMaterial({
                            map: streakTexture,
                            transparent: true,
                            blending: THREE.AdditiveBlending,
                            depthWrite: false,
                            rotation: angle
                        })
                    )
                    // Alternate longer/shorter streaks for variety
                    const length = i % 2 === 0 ? 50 : 35
                    streakSprite.scale.set(length, 1.5, 1)
                    sunGroup.add(streakSprite)
                }
                
                scene.add(sunGroup)

                // Add block points
                const blockCenters = blockData.features.slice(0, 20).map((feature: any) => {
                    const [lng, lat] = getPolygonCenter(feature.geometry.coordinates)
                    if (isNaN(lat) || isNaN(lng)) return null
                    return latLngToVector3(lat, lng, EARTH_RADIUS * 1.005)
                }).filter(Boolean)

                blockCenters.forEach((pos: THREE.Vector3 | null) => {
                    if (!pos) return
                    const pointGeom = new THREE.SphereGeometry(0.03, 8, 8)
                    const pointMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
                    const point = new THREE.Mesh(pointGeom, pointMat)
                    point.position.copy(pos)
                    // Apply same rotation as earth
                    const rotatedPos = pos.clone().applyEuler(new THREE.Euler(-0.1, -2.5, 0))
                    point.position.copy(rotatedPos)
                    scene.add(point)
                })

                // Add flow lines connecting ALL blocks (spider web)
                const flowLines: { curve: THREE.QuadraticBezierCurve3, particles: THREE.Mesh[], offset: number }[] = []
                const earthRotation = new THREE.Euler(-0.1, -2.5, 0)
                
                // Connect ALL blocks to each other (full web)
                for (let i = 0; i < blockCenters.length; i++) {
                    for (let j = i + 1; j < blockCenters.length; j++) {
                        const startPos = blockCenters[i] as THREE.Vector3
                        const endPos = blockCenters[j] as THREE.Vector3
                        if (!startPos || !endPos) continue
                        
                        // Apply earth rotation
                        const start = startPos.clone().applyEuler(earthRotation)
                        const end = endPos.clone().applyEuler(earthRotation)
                        
                        // Calculate arc midpoint - higher for longer distances
                        const distance = start.distanceTo(end)
                        const arcHeight = EARTH_RADIUS * (1.05 + distance * 0.015)
                        const mid = start.clone().add(end).multiplyScalar(0.5)
                        mid.normalize().multiplyScalar(arcHeight)
                        
                        // Create curve
                        const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
                        const points = curve.getPoints(32)
                        const geometry = new THREE.BufferGeometry().setFromPoints(points)
                        const material = new THREE.LineBasicMaterial({ 
                            color: 0xffffff, 
                            transparent: true, 
                            opacity: 0.15 // Subtle lines
                        })
                        const line = new THREE.Line(geometry, material)
                        scene.add(line)
                        lineMaterialsRef.current.push(material) // Store ref for Leva
                        
                        // Create single flow particle per line
                        const particleGeom = new THREE.SphereGeometry(0.012, 6, 6)
                        const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
                        const particle = new THREE.Mesh(particleGeom, particleMat)
                        scene.add(particle)
                        flowParticlesRef.current.push(particle) // Store ref for Leva
                        
                        // Random starting offset so particles don't all sync
                        flowLines.push({ curve, particles: [particle], offset: Math.random() })
                    }
                }

                // Load satellite model with blinking light
                const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
                const gltfLoader = new GLTFLoader()
                let satellite: THREE.Group | null = null
                let satelliteLight: THREE.PointLight | null = null
                let satelliteBeacon: THREE.Mesh | null = null
                
                gltfLoader.load('/models/ISS_stationary.glb', (gltf) => {
                    satellite = gltf.scene
                    satellite.scale.set(0.008, 0.008, 0.008)
                    satellite.position.set(EARTH_RADIUS * 1.3, 0, 0)
                    scene.add(satellite)
                    
                    // Add blinking beacon light
                    satelliteLight = new THREE.PointLight(0xff3333, 0, 8)
                    satelliteLight.position.set(0, 50, 0) // Relative to satellite
                    satellite.add(satelliteLight)
                    
                    // Add visible beacon sphere
                    const beaconGeom = new THREE.SphereGeometry(5, 8, 8)
                    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0 })
                    satelliteBeacon = new THREE.Mesh(beaconGeom, beaconMat)
                    satelliteBeacon.position.set(0, 50, 0)
                    satellite.add(satelliteBeacon)
                })

                // Add orbit controls
                const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
                const controls = new OrbitControls(camera, canvasRef.current)
                controls.enableDamping = true
                controls.dampingFactor = 0.05
                controls.minDistance = EARTH_RADIUS * 1.2
                controls.maxDistance = EARTH_RADIUS * 5
                controls.enablePan = false

                // Animation loop
                let sunAngle = 0
                let flowOffset = 0
                let blinkTime = 0
                
                const animate = () => {
                    animationRef.current = requestAnimationFrame(animate)
                    
                    // Rotate sun (speed controlled by Leva)
                    sunAngle += sunSpeedRef.current
                    const sunX = 80 * Math.sin(sunAngle)
                    const sunY = 20
                    const sunZ = 80 * Math.cos(sunAngle)
                    sunLight.position.set(sunX, sunY, sunZ)
                    sunGroup.position.set(sunX, sunY, sunZ)
                    
                    // Animate flow particles - one direction only
                    flowOffset += 0.003
                    flowLines.forEach(({ curve, particles, offset }) => {
                        particles.forEach((particle) => {
                            // Use offset for variation, flow only 0 to 1
                            const t = (flowOffset + offset) % 1
                            const pos = curve.getPoint(t)
                            particle.position.copy(pos)
                        })
                    })
                    
                    // Update satellite position to follow camera
                    if (satellite) {
                        const cameraDir = new THREE.Vector3()
                        camera.getWorldDirection(cameraDir)
                        const satPos = cameraDir.clone().multiplyScalar(-EARTH_RADIUS * 1.3)
                        satPos.add(new THREE.Vector3(-1.5, -0.8, 0))
                        satellite.position.lerp(satPos, 0.05)
                        satellite.lookAt(camera.position)
                    }
                    
                    // Blink satellite beacon every 1 second
                    blinkTime += 0.016
                    const blinkOn = Math.floor(blinkTime) % 2 === 0 && (blinkTime % 1) < 0.1
                    if (satelliteLight) {
                        satelliteLight.intensity = blinkOn ? 5 : 0
                    }
                    if (satelliteBeacon) {
                        (satelliteBeacon.material as THREE.MeshBasicMaterial).opacity = blinkOn ? 1 : 0
                    }
                    
                    controls.update()
                    renderer.render(scene, camera)
                }
                animate()

                // Handle resize
                const handleResize = () => {
                    if (!cameraRef.current || !rendererRef.current) return
                    cameraRef.current.aspect = window.innerWidth / window.innerHeight
                    cameraRef.current.updateProjectionMatrix()
                    rendererRef.current.setSize(window.innerWidth, window.innerHeight)
                }
                window.addEventListener('resize', handleResize)

                setIsReady(true)

                return () => {
                    window.removeEventListener('resize', handleResize)
                    cancelAnimationFrame(animationRef.current)
                    renderer.dispose()
                }
            } catch (e: any) {
                console.error('WebGPU initialization failed:', e)
                setError(e.message || 'Failed to initialize WebGPU')
            }
        }

        init()

        return () => {
            cancelAnimationFrame(animationRef.current)
            if (rendererRef.current) {
                rendererRef.current.dispose()
            }
        }
    }, [])

    if (error) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="text-red-500 bg-black/80 p-6 rounded-lg text-center max-w-md">
                    <p className="font-bold text-lg">WebGPU Error</p>
                    <p className="text-sm mt-2">{error}</p>
                    <p className="text-xs mt-4 text-gray-400">
                        Try using Chrome 113+ or Edge 113+ with WebGPU enabled.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full bg-black relative">
            
            <canvas ref={canvasRef} className="w-full h-full" />
            
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-lg">Initializing WebGPU...</div>
                </div>
            )}

            {/* Play/Pause Control */}
            <div className="absolute bottom-8 right-8 z-20">
                <button
                    onClick={() => setIsAutoRotating(!isAutoRotating)}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg border border-white/10 backdrop-blur-sm"
                    title={isAutoRotating ? "Pause" : "Play"}
                >
                    {isAutoRotating ? (
                        <Pause className="w-5 h-5 fill-current" />
                    ) : (
                        <Play className="w-5 h-5 fill-current" />
                    )}
                </button>
            </div>
        </div>
    )
}

export default GlobeTakramFull
