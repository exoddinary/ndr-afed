'use client'

import React, { useRef, useState, Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Environment } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Play, Pause } from 'lucide-react'
import { useControls, Leva } from 'leva'
import Earth from './earth'
import BlockMarkers from './block-markers'
import Satellite from './satellite'

// Import Takram atmosphere components for realistic lighting
import {
    Atmosphere,
    Sky,
    SunLight as TakramSunLight
} from '@takram/three-atmosphere/r3f'

// Calculate sun position based on date/time (like Takram's approach)
const getSunPosition = (dayOfYear: number, timeOfDay: number) => {
    // Sun declination angle based on day of year (approximation)
    const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180)

    // Hour angle based on time of day (0-24 hours)
    const hourAngle = (timeOfDay - 12) * 15 // degrees per hour

    // Convert to radians
    const decRad = declination * Math.PI / 180
    const haRad = hourAngle * Math.PI / 180

    // Calculate sun position on unit sphere and scale
    const distance = 50
    const x = distance * Math.cos(decRad) * Math.sin(haRad)
    const y = distance * Math.sin(decRad)
    const z = distance * Math.cos(decRad) * Math.cos(haRad)

    return new THREE.Vector3(x, y, z)
}

// Sun mesh component - realistic glow using Sprite
const Sun = ({ position }: { position: THREE.Vector3 }) => {
    const texture = useMemo(() => {
        if (typeof document === 'undefined') return null
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 128
        const context = canvas.getContext('2d')
        if (!context) return null

        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
        gradient.addColorStop(0.15, 'rgba(255, 255, 240, 0.8)')
        gradient.addColorStop(0.4, 'rgba(255, 220, 180, 0.3)')
        gradient.addColorStop(1, 'rgba(255, 150, 50, 0)')

        context.fillStyle = gradient
        context.fillRect(0, 0, 128, 128)
        const tex = new THREE.CanvasTexture(canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        return tex
    }, [])

    if (!texture) return null

    return (
        <group position={position}>
            {/* Bright Core */}
            <mesh>
                <sphereGeometry args={[1.2, 32, 32]} />
                <meshBasicMaterial
                    color="#ffffff"
                    toneMapped={false}
                />
            </mesh>
            {/* Smooth Glow Sprite */}
            <sprite scale={[18, 18, 1]}>
                <spriteMaterial
                    map={texture}
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                />
            </sprite>
        </group>
    )
}

// Enhanced Sun Light with date-based positioning
const SunLight = ({ dayOfYear, timeOfDay }: { dayOfYear: number, timeOfDay: number }) => {
    const lightRef = useRef<THREE.DirectionalLight>(null)

    const sunPosition = useMemo(() => getSunPosition(dayOfYear, timeOfDay), [dayOfYear, timeOfDay])

    useFrame(() => {
        if (lightRef.current) {
            lightRef.current.position.copy(sunPosition)
        }
    })

    return (
        <>
            <directionalLight
                ref={lightRef}
                position={sunPosition}
                intensity={4}
                color="#FFF8E7"
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={100}
                shadow-camera-left={-15}
                shadow-camera-right={15}
                shadow-camera-top={15}
                shadow-camera-bottom={-15}
            />
            <Sun position={sunPosition} />
        </>
    )
}

// Realistic Atmosphere Shader - Physically based scattering approximation
const RealisticAtmosphereShader = {
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        uniform vec3 sunPosition;
        
        void main() {
            vec3 viewDirection = normalize(vPosition);
            vec3 normal = normalize(vNormal);
            vec3 sunDir = normalize(sunPosition);
            
            // Calculate view angle relative to surface normal
            float viewAngle = dot(normal, vec3(0.0, 0.0, 1.0));
            
            // Horizon glow (Fresnel effect) - stronger at edges
            float horizon = pow(1.0 - abs(viewAngle), 4.0);
            
            // Day/Night mixing based on sun direction
            float dayFactor = max(dot(normal, sunDir), 0.0);
            
            // Atmospheric scattering colors
            vec3 dayColor = vec3(0.3, 0.6, 1.0); // Blue sky
            vec3 sunsetColor = vec3(1.0, 0.5, 0.2); // Orange sunset
            vec3 nightColor = vec3(0.05, 0.1, 0.2); // Dark blue night
            
            // Mix colors based on sun angle (sunset effect)
            float sunAngle = dot(normal, sunDir);
            vec3 atmosphereColor = mix(sunsetColor, dayColor, smoothstep(-0.2, 0.2, sunAngle));
            atmosphereColor = mix(nightColor, atmosphereColor, smoothstep(-0.5, 0.0, sunAngle));
            
            // Final alpha - fade out at center, strong at rim
            float alpha = horizon * 0.6;
            
            // Add sun glare in atmosphere
            float sunGlare = pow(max(dot(viewDirection, sunDir), 0.0), 8.0) * 0.2;
            
            gl_FragColor = vec4(atmosphereColor + sunGlare, alpha);
        }
    `
}

const RealisticAtmosphere = ({ radius = 6.371, dayOfYear, timeOfDay }: { radius?: number, dayOfYear: number, timeOfDay: number }) => {
    const sunPosition = useMemo(() => getSunPosition(dayOfYear, timeOfDay), [dayOfYear, timeOfDay])

    return (
        <mesh scale={[1.02, 1.02, 1.02]}>
            <sphereGeometry args={[radius, 128, 128]} />
            <shaderMaterial
                vertexShader={RealisticAtmosphereShader.vertexShader}
                fragmentShader={RealisticAtmosphereShader.fragmentShader}
                uniforms={{
                    sunPosition: { value: sunPosition }
                }}
                side={THREE.BackSide}
                blending={THREE.AdditiveBlending}
                transparent={true}
                depthWrite={false}
            />
        </mesh>
    )
}

interface GlobeSceneProps {
    onBlockSelect: (properties: any) => void
    selectedBlock: any
    isFocused: boolean
    isAutoRotating: boolean
    blockData: any
    dayOfYear: number
    timeOfDay: number
    useTakramAtmosphere: boolean
}

// Scene Content
const GlobeScene = ({ onBlockSelect, selectedBlock, isFocused, isAutoRotating, blockData, dayOfYear, timeOfDay, useTakramAtmosphere }: GlobeSceneProps) => {
    const earthRadius = 6.371
    const controlsRef = useRef<any>()
    const { camera } = useThree()
    const [satellitePosition, setSatellitePosition] = useState<[number, number, number]>([0, 0, 0])
    const groupRef = useRef<THREE.Group>(null)

    // Calculate date from dayOfYear and timeOfDay for Takram
    const date = useMemo(() => {
        const d = new Date(2024, 0, 1) // Start of 2024
        d.setDate(dayOfYear)
        d.setHours(Math.floor(timeOfDay), (timeOfDay % 1) * 60, 0, 0)
        return d
    }, [dayOfYear, timeOfDay])

    useFrame((state, delta) => {
        if (isFocused && controlsRef.current) {
            // Smoothly move camera to focus on Indonesia
            camera.position.lerp(new THREE.Vector3(10, 5, 10), 0.05)
            controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.05)
        }

        // Update satellite position to follow camera
        if (camera) {
            // Get camera direction
            const cameraDirection = new THREE.Vector3()
            camera.getWorldDirection(cameraDirection)

            // Position satellite closer and in front of camera
            const distance = 7.0 // Slightly further to avoid collision
            const offset = new THREE.Vector3(-0.5, -0.2, 0) // Offset to left and down

            // Calculate position based on camera direction
            const basePosition = cameraDirection.clone().multiplyScalar(-distance)
            const finalPosition = basePosition.add(offset)

            setSatellitePosition([finalPosition.x, finalPosition.y, finalPosition.z])
        }

        // Rotate the entire group (Earth + Blocks) together
        if (groupRef.current && isAutoRotating && !isFocused) {
            groupRef.current.rotation.y += 0.0002
        }
    })

    return (
        <>
            {/* Takram Atmosphere with precomputed LUT */}
            {useTakramAtmosphere ? (
                <Atmosphere date={date}>
                    {/* Takram Sky - renders the atmospheric sky dome */}
                    <Sky />

                    {/* Takram SunLight - physically correct sun lighting */}
                    <TakramSunLight intensity={5} />
                </Atmosphere>
            ) : (
                <>
                    {/* Fallback: Original lighting */}
                    <ambientLight intensity={2.5} color="#ffffff" />
                    <SunLight dayOfYear={dayOfYear} timeOfDay={timeOfDay} />
                    <pointLight position={[-15, -10, -15]} intensity={2.0} color="#ffffff" />
                    <pointLight position={[15, 10, 15]} intensity={2.0} color="#ffffff" />

                    {/* Original Atmosphere */}
                    <RealisticAtmosphere radius={earthRadius} dayOfYear={dayOfYear} timeOfDay={timeOfDay} />
                </>
            )}

            {/* Stars Background */}
            <Stars
                radius={300}
                depth={60}
                count={3000}
                factor={7}
                saturation={0}
                fade
                speed={1}
            />

            <group ref={groupRef} rotation={[0, -2.1, 0.41]}> {/* Initial rotation to show Indonesia + Earth Tilt */}
                <Earth />

                {/* Exploration Block Markers */}
                <Suspense fallback={null}>
                    <BlockMarkers
                        blocks={blockData}
                        earthRadius={earthRadius}
                        onBlockSelect={onBlockSelect}
                        selectedBlock={selectedBlock}
                    />
                </Suspense>
            </group>

            {/* Satellite positioned to follow camera */}
            <Satellite
                position={satellitePosition}
                scale={[0.005, 0.005, 0.005]} // Reduced scale significantly
                rotation={[0.5, 2, 0]}
            />

            {/* Environment Map for realistic reflections */}
            <Environment preset="sunset" />

            <OrbitControls
                ref={controlsRef}
                enableZoom={true}
                enablePan={false}
                enableRotate={true}
                zoomSpeed={0.6}
                rotateSpeed={0.5}
                minDistance={6.5} // Allow getting very close to surface (radius is 6.371)
                maxDistance={12}
                autoRotate={isAutoRotating}
                autoRotateSpeed={0.15}
            />

            {/* Bloom Effect for glowing markers */}
            <EffectComposer>
                <Bloom
                    intensity={0.8}
                    luminanceThreshold={0.8}
                    luminanceSmoothing={0.9}
                    radius={0.8}
                />
            </EffectComposer>
        </>
    )
}

interface Globe3DProps {
    onBlockSelect?: (properties: any) => void
    selectedBlock?: any
    blockData: any
}

const Globe3D = ({ onBlockSelect = () => { }, selectedBlock, blockData }: Globe3DProps) => {
    const [isFocused, setIsFocused] = useState(false)
    const [isAutoRotating, setIsAutoRotating] = useState(true)

    // Leva Controls
    const { dayOfYear, timeOfDay, exposure, useTakramAtmosphere } = useControls('Atmosphere', {
        dayOfYear: { value: 1, min: 1, max: 365, step: 1, label: 'Day of Year' },
        timeOfDay: { value: 12, min: 0, max: 24, step: 0.1, label: 'Time of Day' },
        exposure: { value: 1.0, min: 0.1, max: 4.0, step: 0.1, label: 'Exposure' },
        useTakramAtmosphere: { value: false, label: 'Takram Atmosphere (LUT)' }
    })

    return (
        <div className="w-full h-full bg-black relative">
            <Leva
                collapsed={false}
                theme={{
                    colors: {
                        accent1: '#3A6FF8',
                        elevation1: '#1a1a1a',
                        highlight1: '#ffffff',
                    }
                }}
            />
            <Canvas
                camera={{
                    position: [8, 2, 8],
                    fov: 45
                }}
                gl={{
                    antialias: true,
                    toneMapping: THREE.AgXToneMapping, // Better for realistic high dynamic range
                    toneMappingExposure: exposure,
                    outputColorSpace: THREE.SRGBColorSpace,
                    powerPreference: "high-performance",
                    alpha: false,
                    stencil: false,
                    depth: true
                }}
                shadows
                dpr={[1, 2]}
                performance={{ min: 0.5 }}
                onCreated={({ gl }) => {
                    gl.setClearColor('#000000', 1)
                }}
            >
                <Suspense fallback={
                    <Html center>
                        <div className="text-white text-lg">Loading Globe...</div>
                    </Html>
                }>
                    <GlobeScene
                        onBlockSelect={onBlockSelect}
                        selectedBlock={selectedBlock}
                        isFocused={isFocused}
                        isAutoRotating={isAutoRotating}
                        blockData={blockData}
                        dayOfYear={dayOfYear}
                        timeOfDay={timeOfDay}
                        useTakramAtmosphere={useTakramAtmosphere}
                    />
                </Suspense>
            </Canvas>

            {/* Play/Pause Control (Bottom Right) */}
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

export default Globe3D
