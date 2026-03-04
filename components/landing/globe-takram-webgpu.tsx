'use client'

import React, { useState, Suspense, useEffect, useMemo, useRef, type FC } from 'react'
import { Canvas, extend, useThree, useFrame, type ThreeElement } from '@react-three/fiber'
import { OrbitControls, Html, Stars, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Play, Pause } from 'lucide-react'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// Import block data
// blockData fetched from NLOG WFS API (see lib/nlog-api.ts)

// Takram atmosphere imports
import {
    getECIToECEFRotationMatrix,
    getMoonDirectionECI,
    getSunDirectionECI
} from '@takram/three-atmosphere'

// Import Satellite
import Satellite from './satellite'

// Earth radius in the scene (using a reasonable scale)
const EARTH_RADIUS = 6.371 // Using smaller scale for better precision

// Custom hook for resource management
function useResource<T>(factory: (manage: (disposable: any) => any) => T, deps: any[]): T {
    const resourceRef = useRef<T | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)

    return useMemo(() => {
        if (cleanupRef.current) {
            cleanupRef.current()
        }

        const disposables: any[] = []
        const manage = (disposable: any) => {
            disposables.push(disposable)
            return disposable
        }

        const resource = factory(manage)
        resourceRef.current = resource

        cleanupRef.current = () => {
            disposables.forEach(d => {
                if (d && typeof d.dispose === 'function') {
                    d.dispose()
                }
            })
        }

        return resource
    }, deps)
}

// Blue Marble Earth Component with high-quality textures
const BlueMarbleEarth = () => {
    const meshRef = useRef<THREE.Mesh>(null)
    const cloudsRef = useRef<THREE.Mesh>(null)
    const { gl } = useThree()

    // Load textures - higher resolution from reliable sources
    const textures = useMemo(() => {
        const loader = new THREE.TextureLoader()
        
        // Higher resolution textures
        const colorMap = loader.load('https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg')
        const cloudsMap = loader.load('https://unpkg.com/three-globe@2.31.0/example/img/earth-clouds.png')
        const bumpMap = loader.load('https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png')
        const specularMap = loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg')
        
        // Apply anisotropic filtering for sharpness
        const maxAnisotropy = gl.capabilities.getMaxAnisotropy()
        ;[colorMap, cloudsMap, bumpMap, specularMap].forEach(tex => {
            tex.anisotropy = maxAnisotropy
        })
        
        colorMap.colorSpace = THREE.SRGBColorSpace
        
        return { colorMap, cloudsMap, bumpMap, specularMap }
    }, [gl])

    // Rotate clouds slowly
    useFrame((_, delta) => {
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += delta * 0.01
        }
    })

    return (
        <group>
            {/* Earth sphere - high resolution geometry */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[EARTH_RADIUS, 256, 256]} />
                <meshPhongMaterial
                    map={textures.colorMap}
                    bumpMap={textures.bumpMap}
                    bumpScale={0.05}
                    specularMap={textures.specularMap}
                    specular={new THREE.Color(0x333333)}
                    shininess={5}
                />
            </mesh>

            {/* Cloud layer */}
            <mesh ref={cloudsRef} scale={[1.005, 1.005, 1.005]}>
                <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
                <meshStandardMaterial
                    map={textures.cloudsMap}
                    transparent
                    opacity={0.35}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Subtle gradient atmosphere - thin rim */}
            <mesh scale={[1.008, 1.008, 1.008]}>
                <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
                <shaderMaterial
                    vertexShader={`
                        varying vec3 vNormal;
                        varying vec3 vViewDir;
                        void main() {
                            vNormal = normalize(normalMatrix * normal);
                            vec4 worldPos = modelMatrix * vec4(position, 1.0);
                            vViewDir = normalize(cameraPosition - worldPos.xyz);
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        varying vec3 vNormal;
                        varying vec3 vViewDir;
                        
                        void main() {
                            float fresnel = 1.0 - max(0.0, dot(vViewDir, vNormal));
                            float atmosphere = pow(fresnel, 5.0); // Sharp falloff
                            
                            // Gradient from light blue at edge to transparent
                            vec3 color = vec3(0.4, 0.6, 1.0);
                            float alpha = atmosphere * 0.4;
                            
                            gl_FragColor = vec4(color, alpha);
                        }
                    `}
                    side={THREE.BackSide}
                    transparent
                    depthWrite={false}
                />
            </mesh>
        </group>
    )
}

// Sun with Takram-style lens flare - bright wash effect
const Sun = () => {
    // Create lens flare textures
    const textures = useMemo(() => {
        if (typeof document === 'undefined') return null
        
        // Main bright glow - large soft wash
        const glowCanvas = document.createElement('canvas')
        glowCanvas.width = 512
        glowCanvas.height = 512
        const glowCtx = glowCanvas.getContext('2d')
        if (!glowCtx) return null
        
        // Soft radial glow that washes out
        const glowGradient = glowCtx.createRadialGradient(256, 256, 0, 256, 256, 256)
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
        glowGradient.addColorStop(0.05, 'rgba(255, 255, 250, 0.95)')
        glowGradient.addColorStop(0.15, 'rgba(255, 250, 240, 0.7)')
        glowGradient.addColorStop(0.3, 'rgba(255, 245, 220, 0.4)')
        glowGradient.addColorStop(0.5, 'rgba(255, 240, 200, 0.15)')
        glowGradient.addColorStop(0.7, 'rgba(255, 230, 180, 0.05)')
        glowGradient.addColorStop(1, 'rgba(255, 220, 150, 0)')
        glowCtx.fillStyle = glowGradient
        glowCtx.fillRect(0, 0, 512, 512)
        
        const glowTex = new THREE.CanvasTexture(glowCanvas)
        glowTex.colorSpace = THREE.SRGBColorSpace
        
        // Streak/ray texture
        const streakCanvas = document.createElement('canvas')
        streakCanvas.width = 512
        streakCanvas.height = 64
        const streakCtx = streakCanvas.getContext('2d')
        if (streakCtx) {
            const streakGradient = streakCtx.createLinearGradient(0, 32, 512, 32)
            streakGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
            streakGradient.addColorStop(0.4, 'rgba(255, 250, 240, 0.3)')
            streakGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)')
            streakGradient.addColorStop(0.6, 'rgba(255, 250, 240, 0.3)')
            streakGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
            streakCtx.fillStyle = streakGradient
            streakCtx.fillRect(0, 0, 512, 64)
        }
        const streakTex = new THREE.CanvasTexture(streakCanvas)
        
        return { glowTex, streakTex }
    }, [])

    if (!textures) return null

    return (
        <group>
            {/* Bright core */}
            <sprite scale={[3, 3, 1]}>
                <spriteMaterial
                    color="#ffffff"
                    transparent
                    opacity={1}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                />
            </sprite>
            
            {/* Large soft glow - creates the wash effect */}
            <sprite scale={[80, 80, 1]}>
                <spriteMaterial
                    map={textures.glowTex}
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                    opacity={0.6}
                />
            </sprite>
            
            {/* Horizontal streak */}
            <sprite scale={[120, 8, 1]}>
                <spriteMaterial
                    map={textures.streakTex}
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                    opacity={0.4}
                />
            </sprite>
            
            {/* Vertical streak */}
            <sprite scale={[8, 80, 1]} rotation={[0, 0, Math.PI / 2]}>
                <spriteMaterial
                    map={textures.streakTex}
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                    opacity={0.3}
                />
            </sprite>
            
            {/* Diagonal streaks */}
            <sprite scale={[60, 4, 1]} rotation={[0, 0, Math.PI / 4]}>
                <spriteMaterial
                    map={textures.streakTex}
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                    opacity={0.2}
                />
            </sprite>
            <sprite scale={[60, 4, 1]} rotation={[0, 0, -Math.PI / 4]}>
                <spriteMaterial
                    map={textures.streakTex}
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                    opacity={0.2}
                />
            </sprite>
        </group>
    )
}

// Convert lat/lng to 3D position on sphere
const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    
    const x = -radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.cos(phi)
    const z = radius * Math.sin(phi) * Math.sin(theta)
    
    return new THREE.Vector3(x, y, z)
}

// Get center of a polygon
const getPolygonCenter = (coordinates: number[][][]): [number, number] => {
    const coords = coordinates[0]
    let sumLng = 0, sumLat = 0
    coords.forEach(([lng, lat]) => {
        sumLng += lng
        sumLat += lat
    })
    return [sumLng / coords.length, sumLat / coords.length]
}

// Block points on the globe
const BlockPoints = ({ earthRotation }: { earthRotation: [number, number, number] }) => {
    const pointsRef = useRef<THREE.Group>(null)
    
    // Get block centers
    const blockCenters = useMemo(() => {
        return blockData.features.slice(0, 20).map((feature: any) => {
            const [lng, lat] = getPolygonCenter(feature.geometry.coordinates)
            return {
                id: feature.id,
                name: feature.properties.namobj,
                position: latLngToVector3(lat, lng, EARTH_RADIUS * 1.005),
                lat,
                lng
            }
        })
    }, [])

    return (
        <group ref={pointsRef} rotation={earthRotation}>
            {blockCenters.map((block: any, index: number) => (
                <mesh key={block.id} position={block.position}>
                    <sphereGeometry args={[0.03, 16, 16]} />
                    <meshBasicMaterial color="#ffffff" toneMapped={false} />
                </mesh>
            ))}
        </group>
    )
}

// Single animated arc line with flowing gradient effect
const AnimatedArc = ({ start, end, flowOffset, index }: { 
    start: THREE.Vector3, 
    end: THREE.Vector3, 
    flowOffset: number,
    index: number
}) => {
    const lineRef = useRef<any>(null)
    
    // Calculate arc midpoint - higher bending
    const mid = useMemo(() => {
        const distance = start.distanceTo(end)
        // Much higher arc - more dramatic bending
        const arcHeight = EARTH_RADIUS * (1.08 + distance * 0.025)
        const midPoint = start.clone().add(end).multiplyScalar(0.5)
        midPoint.normalize().multiplyScalar(arcHeight)
        return midPoint
    }, [start, end])
    
    // Generate points along the curve
    const points = useMemo(() => {
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
        return curve.getPoints(32)
    }, [start, mid, end])
    
    // Validate points - check for NaN
    const validPoints = useMemo(() => {
        return points.every(p => !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z))
    }, [points])
    
    // Create animated vertex colors for flowing effect
    const vertexColors = useMemo(() => {
        const colors: [number, number, number][] = []
        const numPoints = points.length
        
        for (let i = 0; i < numPoints; i++) {
            const t = i / (numPoints - 1)
            // Create flowing wave effect with offset based on index for variation
            const phase = (flowOffset * 2 + index * 0.1) % 1
            const wave = Math.sin((t - phase) * Math.PI * 4) * 0.5 + 0.5
            const intensity = wave * 0.8 + 0.2 // Keep minimum brightness
            colors.push([intensity, intensity, intensity])
        }
        return colors
    }, [points.length, flowOffset, index])
    
    if (!validPoints || points.length < 2) return null
    
    return (
        <Line
            ref={lineRef}
            points={points}
            vertexColors={vertexColors}
            transparent
            opacity={0.3}
            lineWidth={0.8}
        />
    )
}

// Animated flow lines connecting ALL blocks in a web structure
const FlowLines = ({ earthRotation }: { earthRotation: [number, number, number] }) => {
    const [flowOffset, setFlowOffset] = useState(0)
    
    // Animate flow
    useFrame((_, delta) => {
        setFlowOffset(prev => (prev + delta * 0.2) % 1)
    })
    
    // Get block centers and create FULL web connections
    const connections = useMemo(() => {
        const centers = blockData.features.slice(0, 20).map((feature: any) => {
            const [lng, lat] = getPolygonCenter(feature.geometry.coordinates)
            // Validate coordinates
            if (isNaN(lat) || isNaN(lng)) return null
            return { lat, lng, name: feature.properties.namobj }
        }).filter(Boolean)
        
        // Create web structure - connect ALL blocks to each other
        const lines: { start: THREE.Vector3, end: THREE.Vector3, id: string }[] = []
        
        for (let i = 0; i < centers.length; i++) {
            for (let j = i + 1; j < centers.length; j++) {
                const startPos = latLngToVector3(centers[i]!.lat, centers[i]!.lng, EARTH_RADIUS * 1.003)
                const endPos = latLngToVector3(centers[j]!.lat, centers[j]!.lng, EARTH_RADIUS * 1.003)
                
                // Validate positions
                if (isNaN(startPos.x) || isNaN(endPos.x)) continue
                
                lines.push({ 
                    start: startPos, 
                    end: endPos,
                    id: `${i}-${j}`
                })
            }
        }
        
        return lines
    }, [])

    return (
        <group rotation={earthRotation}>
            {connections.map((conn, idx) => (
                <AnimatedArc 
                    key={conn.id}
                    start={conn.start}
                    end={conn.end}
                    flowOffset={flowOffset}
                    index={idx}
                />
            ))}
        </group>
    )
}

// Scene content
interface SceneProps {
    dayOfYear: number
    timeOfDay: number
    isAutoRotating: boolean
}

const Scene: FC<SceneProps> = ({ dayOfYear, timeOfDay, isAutoRotating }) => {
    const [satellitePosition, setSatellitePosition] = useState<[number, number, number]>([0, 0, 0])
    const { camera } = useThree()
    const groupRef = useRef<THREE.Group>(null)
    const sunRef = useRef<THREE.Group>(null)
    
    // Earth rotation to show Indonesia (centered on ~115°E, ~2°S)
    // Rotate Y axis more to bring Indonesia to center
    const earthRotation: [number, number, number] = [-0.1, -2.5, 0]

    // Sun animation using refs for smooth updates
    const sunAngleRef = useRef(0)
    const directionalLightRef = useRef<THREE.DirectionalLight>(null)
    const pointLightRef = useRef<THREE.PointLight>(null)
    
    // Animate sun rotation smoothly - always rotate for day/night cycle
    useFrame((_, delta) => {
        // Always rotate sun slowly for day/night effect
        sunAngleRef.current += delta * 0.03
        
        const baseHourAngle = (timeOfDay - 12) * 15 * Math.PI / 180
        const hourAngle = baseHourAngle + sunAngleRef.current
        const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180) * Math.PI / 180
        
        const distance = 80
        const x = distance * Math.cos(declination) * Math.sin(hourAngle)
        const y = distance * Math.sin(declination) + 15
        const z = distance * Math.cos(declination) * Math.cos(hourAngle)
        
        // Update sun visual position
        if (sunRef.current) {
            sunRef.current.position.set(x, y, z)
        }
        
        // Update directional light to follow sun
        if (directionalLightRef.current) {
            directionalLightRef.current.position.set(x, y, z)
        }
        
        // Update point light (opposite side for fill)
        if (pointLightRef.current) {
            pointLightRef.current.position.set(-x * 0.5, -y * 0.5, -z * 0.5)
        }
    })

    // Update satellite position
    useFrame(() => {
        if (camera) {
            const cameraDirection = new THREE.Vector3()
            camera.getWorldDirection(cameraDirection)
            
            const distance = EARTH_RADIUS * 1.3
            const offset = new THREE.Vector3(-1.5, -0.8, 0)
            const basePosition = cameraDirection.clone().multiplyScalar(-distance)
            const finalPosition = basePosition.add(offset)
            
            setSatellitePosition([finalPosition.x, finalPosition.y, finalPosition.z])
        }
    })

    return (
        <>
            {/* Lighting - position updated via refs in useFrame */}
            <ambientLight intensity={0.15} color="#4466aa" />
            <directionalLight
                ref={directionalLightRef}
                position={[50, 20, 30]}
                intensity={3}
                color="#FFF8E7"
                castShadow
            />
            <pointLight 
                ref={pointLightRef}
                position={[-25, -10, -15]} 
                intensity={0.3} 
                color="#6699ff" 
            />

            {/* Stars background */}
            <mesh>
                <sphereGeometry args={[500, 32, 32]} />
                <meshBasicMaterial
                    color="#000000"
                    side={THREE.BackSide}
                />
            </mesh>

            {/* Animated Sun - position controlled by ref in useFrame */}
            <group ref={sunRef} position={[50, 20, 30]}>
                <Sun />
            </group>

            {/* Earth with atmosphere - rotated to show Indonesia */}
            <group ref={groupRef} rotation={earthRotation}>
                <BlueMarbleEarth />
            </group>
            
            {/* Block points */}
            <BlockPoints earthRotation={earthRotation} />
            
            {/* Animated flow lines */}
            <FlowLines earthRotation={earthRotation} />

            {/* Satellite */}
            <Satellite
                position={satellitePosition}
                scale={[0.008, 0.008, 0.008]}
                rotation={[0.5, 2, 0]}
            />

            {/* Controls */}
            <OrbitControls
                enableDamping
                dampingFactor={0.05}
                minDistance={EARTH_RADIUS * 1.2}
                maxDistance={EARTH_RADIUS * 5}
                enablePan={false}
            />
            
            {/* Bloom for glow effects */}
            <EffectComposer>
                <Bloom
                    intensity={0.8}
                    luminanceThreshold={0.6}
                    luminanceSmoothing={0.9}
                    radius={0.8}
                />
            </EffectComposer>
        </>
    )
}

// Main component
interface GlobeTakramWebGPUProps {
    onBlockSelect?: (properties: any) => void
    selectedBlock?: any
    blockData?: any
}

const GlobeTakramWebGPU: FC<GlobeTakramWebGPUProps> = ({ 
    onBlockSelect = () => {}, 
    selectedBlock, 
    blockData 
}) => {
    const [isAutoRotating, setIsAutoRotating] = useState(true)
    
    // Atmosphere settings - position sun to illuminate Indonesia (noon)
    const [dayOfYear] = useState(172) // June 21
    const [timeOfDay] = useState(12) // Noon - sun directly over Indonesia

    return (
        <div className="w-full h-full bg-black relative">
            <Canvas
                camera={{
                    fov: 45,
                    near: 0.1,
                    far: 1000,
                    // Position camera to view Indonesia from slightly above
                    position: [EARTH_RADIUS * 2.5, EARTH_RADIUS * 0.3, EARTH_RADIUS * 0.8]
                }}
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.2,
                    outputColorSpace: THREE.SRGBColorSpace,
                    powerPreference: "high-performance",
                }}
                shadows
                dpr={[1, 2]}
                onCreated={({ gl }) => {
                    gl.setClearColor('#000000', 1)
                }}
            >
                <Suspense fallback={
                    <Html center>
                        <div className="text-white text-lg">Loading Globe...</div>
                    </Html>
                }>
                    <Scene dayOfYear={dayOfYear} timeOfDay={timeOfDay} isAutoRotating={isAutoRotating} />
                </Suspense>
            </Canvas>

            {/* Play/Pause Control */}
            <div className="absolute bottom-8 right-8 z-20">
                <button
                    onClick={() => setIsAutoRotating(!isAutoRotating)}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg border border-white/10 backdrop-blur-sm"
                    title={isAutoRotating ? "Pause Rotation" : "Resume Rotation"}
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

export default GlobeTakramWebGPU
