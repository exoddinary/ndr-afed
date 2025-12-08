'use client'

import React, { useState, Suspense, useEffect, useMemo, useRef, type FC } from 'react'
import * as THREE from 'three'
import { Play, Pause } from 'lucide-react'

// We need to dynamically import WebGPU components
let WebGPURenderer: any = null
let WebGPUPostProcessing: any = null
let passNode: any = null
let toneMappingNode: any = null
let lensFlareNode: any = null
let ditheringNode: any = null

// Dynamic import for WebGPU and Takram post-processing
const loadWebGPU = async () => {
    try {
        const webgpu = await import('three/webgpu')
        WebGPURenderer = webgpu.WebGPURenderer
        WebGPUPostProcessing = webgpu.PostProcessing
        
        // Import TSL nodes
        const tsl = await import('three/tsl')
        passNode = tsl.pass
        toneMappingNode = tsl.toneMapping
        
        // Try to import Takram lens flare
        try {
            const takramWebgpu = await import('@takram/three-geospatial/webgpu')
            lensFlareNode = takramWebgpu.lensFlare
            ditheringNode = takramWebgpu.dithering
            console.log('Takram lens flare loaded successfully')
        } catch (e) {
            console.warn('Takram lens flare not available, using fallback:', e)
        }
        
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

import type { LicensingRound } from '@/data/licensing-rounds'

interface GlobeTakramFullProps {
    onBlockSelect?: (properties: any) => void
    selectedBlock?: any
    blockData?: any
    licensingRounds?: LicensingRound[]
    onOpenOpportunities?: () => void
    isZooming?: boolean
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
    blockData: propBlockData,
    licensingRounds = [],
    onOpenOpportunities,
    isZooming = false,
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
    const sunSpeedRef = useRef(0.005)
    
    // Default settings (from Leva adjustments)
    const dayOfYear = 172
    const timeOfDay = 12
    const exposure = 1.0
    const sunSpeed = 0.005
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

    // Zoom animation when entering workspace
    useEffect(() => {
        if (!isZooming || !cameraRef.current) return
        
        const camera = cameraRef.current
        const targetDistance = EARTH_RADIUS * 0.8 // Zoom in close to Earth
        const startPos = camera.position.clone()
        const direction = startPos.clone().normalize()
        const targetPos = direction.multiplyScalar(targetDistance)
        
        let progress = 0
        const zoomAnimation = () => {
            progress += 0.02
            if (progress >= 1) return
            
            // Ease-in-out interpolation
            const t = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2
            
            camera.position.lerpVectors(startPos, targetPos, t)
            camera.lookAt(0, 0, 0)
            
            requestAnimationFrame(zoomAnimation)
        }
        
        zoomAnimation()
    }, [isZooming])

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

                // Import Three.js WebGPU and TSL
                const { WebGPURenderer, PostProcessing } = await import('three/webgpu')
                const { pass, toneMapping, uniform } = await import('three/tsl')
                
                // Try to import Takram lens flare
                let lensFlare: any = null
                let dithering: any = null
                try {
                    const takram = await import('@takram/three-geospatial/webgpu')
                    lensFlare = takram.lensFlare
                    dithering = takram.dithering
                    console.log('Takram lens flare loaded!')
                } catch (e) {
                    console.warn('Takram lens flare not available:', e)
                }

                // Create renderer
                const renderer = new WebGPURenderer({
                    canvas: canvasRef.current,
                    antialias: true,
                })
                await renderer.init()
                renderer.setSize(window.innerWidth, window.innerHeight)
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
                renderer.toneMapping = THREE.ACESFilmicToneMapping
                renderer.toneMappingExposure = 1.4
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

                // Takram WebGPU atmosphere nodes - DISABLED for now (causes blue sky glow)
                // Keep scene background as pure black
                let takramContext: any = null
                let takramSkyNode: any = null
                // try {
                //     const atm = await import('@takram/three-atmosphere/webgpu')
                //     const AtmosphereContextNode = (atm as any).AtmosphereContextNode
                //     const skyBackground = (atm as any).skyBackground
                //     if (AtmosphereContextNode && skyBackground) {
                //         takramContext = new AtmosphereContextNode()
                //         takramContext.camera = camera
                //         takramSkyNode = skyBackground(takramContext)
                //         ;(scene as any).backgroundNode = takramSkyNode
                //     }
                // } catch {}

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
                    color: new THREE.Color(0.45, 0.65, 1.0), // Blue atmosphere
                    transparent: true,
                    opacity: 0.08,
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
                    0.05      // Intensity (very subtle)
                )
                scene.add(skyLight)

                // Add subtle ambient for shadow fill
                const ambientLight = new THREE.AmbientLight(0x4466aa, 0.05)
                scene.add(ambientLight)

                // Takram-style sun with lens flare (6 sharp streaks like the reference)
                const sunGroup = new THREE.Group()
                sunGroup.position.set(50, 20, 30)
                
                // Bright central core (smaller)
                const coreCanvas = document.createElement('canvas')
                coreCanvas.width = 128
                coreCanvas.height = 128
                const coreCtx = coreCanvas.getContext('2d')!
                const coreGradient = coreCtx.createRadialGradient(64, 64, 0, 64, 64, 64)
                coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
                coreGradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.75)')
                coreGradient.addColorStop(0.4, 'rgba(255, 255, 250, 0.2)')
                coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
                coreCtx.fillStyle = coreGradient
                coreCtx.fillRect(0, 0, 128, 128)
                
                const coreTexture = new THREE.CanvasTexture(coreCanvas)
                const coreSprite = new THREE.Sprite(
                    new THREE.SpriteMaterial({
                        map: coreTexture,
                        transparent: true,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                    })
                )
                coreSprite.scale.set(4, 4, 1)
                sunGroup.add(coreSprite)
                
                // Soft outer bloom (smaller, softer)
                const bloomCanvas = document.createElement('canvas')
                bloomCanvas.width = 256
                bloomCanvas.height = 256
                const bloomCtx = bloomCanvas.getContext('2d')!
                const bloomGradient = bloomCtx.createRadialGradient(128, 128, 0, 128, 128, 128)
                bloomGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)')
                bloomGradient.addColorStop(0.2, 'rgba(255, 252, 245, 0.10)')
                bloomGradient.addColorStop(0.5, 'rgba(255, 250, 240, 0.03)')
                bloomGradient.addColorStop(1, 'rgba(255, 248, 235, 0)')
                bloomCtx.fillStyle = bloomGradient
                bloomCtx.fillRect(0, 0, 256, 256)
                
                const bloomTexture = new THREE.CanvasTexture(bloomCanvas)
                const bloomSprite = new THREE.Sprite(
                    new THREE.SpriteMaterial({
                        map: bloomTexture,
                        transparent: true,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                    })
                )
                bloomSprite.scale.set(22, 22, 1)
                sunGroup.add(bloomSprite)
                
                // 6 sharp lens flare streaks (like Takram reference)
                const createStreakTexture = (length: number, width: number) => {
                    const canvas = document.createElement('canvas')
                    canvas.width = length
                    canvas.height = width
                    const ctx = canvas.getContext('2d')!
                    
                    // Sharp streak with bright center tapering to edges
                    const gradient = ctx.createLinearGradient(0, width/2, length, width/2)
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
                    gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.015)')
                    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.06)')
                    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.20)')
                    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.06)')
                    gradient.addColorStop(0.9, 'rgba(255, 255, 255, 0.015)')
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
                    
                    // Vertical gradient for thin streak
                    ctx.fillStyle = gradient
                    ctx.fillRect(0, 0, length, width)
                    
                    // Make it thinner in the middle vertically
                    const vGradient = ctx.createLinearGradient(0, 0, 0, width)
                    vGradient.addColorStop(0, 'rgba(0, 0, 0, 1)')
                    vGradient.addColorStop(0.45, 'rgba(0, 0, 0, 0)')
                    vGradient.addColorStop(0.55, 'rgba(0, 0, 0, 0)')
                    vGradient.addColorStop(1, 'rgba(0, 0, 0, 1)')
                    ctx.globalCompositeOperation = 'destination-out'
                    ctx.fillStyle = vGradient
                    ctx.fillRect(0, 0, length, width)
                    
                    return new THREE.CanvasTexture(canvas)
                }
                
                // 6 streaks at 60-degree intervals (like the reference image) - shorter and more subtle
                const streakLengths = [20, 16, 18, 14, 19, 13]
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3 // 0, 60, 120, 180, 240, 300 degrees
                    const streakTexture = createStreakTexture(256, 6)
                    const streakSprite = new THREE.Sprite(
                        new THREE.SpriteMaterial({
                            map: streakTexture,
                            transparent: true,
                            blending: THREE.AdditiveBlending,
                            depthWrite: false,
                            rotation: angle
                        })
                    )
                    streakSprite.scale.set(streakLengths[i], 0.6, 1)
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
                    // Use a light-affected material so points pick up sun highlights/shadows
                    const pointMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 40 })
                    const point = new THREE.Mesh(pointGeom, pointMat)
                    point.position.copy(pos)
                    // Apply same rotation as earth
                    const rotatedPos = pos.clone().applyEuler(new THREE.Euler(-0.1, -2.5, 0))
                    point.position.copy(rotatedPos)
                    scene.add(point)
                })

                // Add licensing round markers (bidding blocks) - light purple
                const licensingMarkerMeshes: THREE.Mesh[] = []
                if (licensingRounds && licensingRounds.length > 0) {
                    licensingRounds.forEach((r) => {
                        const [lon, lat] = r.coordinates
                        const pos = latLngToVector3(lat, lon, EARTH_RADIUS * 1.01)
                        const rotated = pos.clone().applyEuler(new THREE.Euler(-0.1, -2.5, 0))
                        const geom = new THREE.SphereGeometry(0.04, 12, 12)
                        // Light-affected material so licensing markers catch the sun
                        const mat = new THREE.MeshPhongMaterial({ color: 0xD8B4FE, shininess: 60 })
                        const m = new THREE.Mesh(geom, mat)
                        m.position.copy(rotated)
                        scene.add(m)
                        licensingMarkerMeshes.push(m)
                    })
                }

                // Add flow lines connecting ALL blocks (spider web)
                // For each connection we draw:
                //  - a dim base line
                //  - a bright short line segment that moves along the curve
                const flowLines: { curve: THREE.QuadraticBezierCurve3, bright: THREE.Line, offset: number }[] = []
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
                            color: 0x9ca3af, // soft gray
                            transparent: true, 
                            opacity: 0.035 // slightly dimmer base to let bloom pop
                        })
                        const line = new THREE.Line(geometry, material)
                        scene.add(line)
                        lineMaterialsRef.current.push(material) // Store ref for Leva

                        // Bright segment: separate line geometry we will update each frame
                        const brightPoints = curve.getPoints(16)
                        const brightGeom = new THREE.BufferGeometry().setFromPoints(brightPoints)
                        const brightMat = new THREE.LineBasicMaterial({
                            color: 0xffffff,
                            transparent: true,
                            opacity: 1.0,
                            depthWrite: false,
                            blending: THREE.AdditiveBlending,
                        })
                        const brightLine = new THREE.Line(brightGeom, brightMat)
                        scene.add(brightLine)

                        // Random starting offset so flows don't sync
                        flowLines.push({ curve, bright: brightLine, offset: Math.random() })
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

                // Click to open opportunities when clicking a licensing marker
                const raycaster = new THREE.Raycaster()
                const ndc = new THREE.Vector2()
                const onClick = (e: MouseEvent) => {
                    if (!cameraRef.current) return
                    ndc.x = (e.clientX / window.innerWidth) * 2 - 1
                    ndc.y = -(e.clientY / window.innerHeight) * 2 + 1
                    raycaster.setFromCamera(ndc, cameraRef.current)
                    const intersects = raycaster.intersectObjects(licensingMarkerMeshes, false)
                    if (intersects.length > 0) {
                        onOpenOpportunities?.()
                    }
                }
                window.addEventListener('pointerdown', onClick)

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
                    if (takramContext) {
                        const d = new THREE.Vector3(sunX, sunY, sunZ).normalize()
                        try {
                            ;(takramContext.sunDirectionECEF as any).value.set(d.x, d.y, d.z)
                            if (takramSkyNode) (takramSkyNode as any).needsUpdate = true
                        } catch {}
                    }
                    
                    // Animate bright short segments along each curve (slower)
                    flowOffset += 0.002
                    flowLines.forEach(({ curve, bright, offset }) => {
                        const geom = bright.geometry as THREE.BufferGeometry
                        const positions = geom.attributes.position as THREE.BufferAttribute
                        const segments = positions.count
                        // Center of the bright segment moves along the curve
                        const centerT = (flowOffset + offset) % 1
                        const span = 0.10 // shorter fraction of curve covered by bright segment
                        const startT = Math.max(0, centerT - span / 2)
                        const endT = Math.min(1, centerT + span / 2)

                        for (let i = 0; i < segments; i++) {
                            const t = startT + ((endT - startT) * i) / Math.max(segments - 1, 1)
                            const p = curve.getPoint(t)
                            positions.setXYZ(i, p.x, p.y, p.z)
                        }
                        positions.needsUpdate = true
                    })
                    
                    // Keep satellite at its initial orbit position (no camera-follow fly-in)
                    // Position is set once during creation; here we only handle visual effects (blink)
                    
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
                    window.removeEventListener('pointerdown', onClick)
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
