'use client'

import React, { useRef, useState, Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Environment, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Play, Pause } from 'lucide-react'

// 3D Tiles Renderer R3F imports
import { 
    TilesRenderer,
    TilesPlugin,
    GlobeControls,
    TilesAttributionOverlay
} from '3d-tiles-renderer/r3f'
import { GoogleCloudAuthPlugin, GLTFExtensionsPlugin } from '3d-tiles-renderer/plugins'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import BlockMarkers from './block-markers'
import Satellite from './satellite'

// Create DRACO loader instance (singleton)
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

// Constants for Earth
const EARTH_RADIUS = 6371000 // meters

// Google Photorealistic 3D Tiles Globe Component
const PhotorealisticGlobe = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
        return (
            <Html center>
                <div className="text-red-500 bg-black/80 p-4 rounded-lg">
                    <p className="font-bold">Missing API Key</p>
                    <p className="text-sm">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
                </div>
            </Html>
        )
    }

    return (
        <TilesRenderer>
            {/* Google Cloud Auth Plugin */}
            <TilesPlugin 
                plugin={GoogleCloudAuthPlugin} 
                args={{ 
                    apiToken: apiKey,
                    autoRefreshToken: true 
                } as any}
            />
            {/* GLTF Extensions Plugin with DRACO decoder */}
            <TilesPlugin 
                plugin={GLTFExtensionsPlugin}
                args={{ 
                    dracoLoader: dracoLoader
                } as any}
            />
            <GlobeControls 
                enableDamping
                dampingFactor={0.1}
            />
            <TilesAttributionOverlay />
        </TilesRenderer>
    )
}

// Note: For true atmospheric scattering like Takram's Storybook example,
// you need WebGPU with AerialPerspectiveNode post-processing.
// Google 3D Tiles have pre-baked lighting, so we keep it simple here.

// Sun component with glow
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
                <sphereGeometry args={[EARTH_RADIUS * 0.1, 32, 32]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            {/* Smooth Glow Sprite */}
            <sprite scale={[EARTH_RADIUS * 2, EARTH_RADIUS * 2, 1]}>
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

// Scene with 3D Tiles Globe
interface GlobeSceneProps {
    onBlockSelect: (properties: any) => void
    selectedBlock: any
    isAutoRotating: boolean
    blockData: any
}

const GlobeScene = ({ onBlockSelect, selectedBlock, isAutoRotating, blockData }: GlobeSceneProps) => {
    const { camera } = useThree()
    const [satellitePosition, setSatellitePosition] = useState<[number, number, number]>([0, 0, 0])
    
    // Sun position (fixed, simulating daylight)
    const sunPosition = useMemo(() => new THREE.Vector3(
        EARTH_RADIUS * 5,
        EARTH_RADIUS * 2,
        EARTH_RADIUS * 3
    ), [])

    useFrame(() => {
        // Update satellite position to follow camera
        if (camera) {
            const cameraDirection = new THREE.Vector3()
            camera.getWorldDirection(cameraDirection)
            
            // Position satellite in view, offset from camera
            const distance = EARTH_RADIUS * 1.1
            const offset = new THREE.Vector3(-EARTH_RADIUS * 0.15, -EARTH_RADIUS * 0.08, 0)
            const basePosition = cameraDirection.clone().multiplyScalar(-distance)
            const finalPosition = basePosition.add(offset)
            
            setSatellitePosition([finalPosition.x, finalPosition.y, finalPosition.z])
        }
    })

    return (
        <>
            {/* Enhanced Lighting */}
            <ambientLight intensity={0.4} color="#b0c4de" />
            
            {/* Main Sun Light */}
            <directionalLight
                position={sunPosition}
                intensity={3}
                color="#FFF8E7"
                castShadow
            />
            
            {/* Fill lights */}
            <pointLight position={[-EARTH_RADIUS * 2, -EARTH_RADIUS, -EARTH_RADIUS * 2]} intensity={0.5} color="#6699ff" />
            <pointLight position={[EARTH_RADIUS * 2, EARTH_RADIUS, EARTH_RADIUS * 2]} intensity={0.3} color="#88aaff" />

            {/* Stars Background */}
            <Stars
                radius={EARTH_RADIUS * 50}
                depth={EARTH_RADIUS * 10}
                count={3000}
                factor={EARTH_RADIUS * 0.01}
                saturation={0}
                fade
                speed={0.5}
            />

            {/* Sun with glow */}
            <Sun position={sunPosition} />

            {/* Atmosphere is handled by the 3D tiles' own rendering */}

            {/* Google 3D Tiles Globe */}
            <Suspense fallback={
                <Html center>
                    <div className="text-white">Loading 3D Tiles...</div>
                </Html>
            }>
                <PhotorealisticGlobe />
            </Suspense>

            {/* Satellite */}
            <Satellite
                position={satellitePosition}
                scale={[EARTH_RADIUS * 0.00001, EARTH_RADIUS * 0.00001, EARTH_RADIUS * 0.00001]}
                rotation={[0.5, 2, 0]}
            />

            {/* Environment for reflections */}
            <Environment preset="night" />

            {/* Bloom for glowing effects */}
            <EffectComposer>
                <Bloom
                    intensity={0.6}
                    luminanceThreshold={0.7}
                    luminanceSmoothing={0.9}
                    radius={0.8}
                />
            </EffectComposer>
        </>
    )
}

interface Globe3DTilesProps {
    onBlockSelect?: (properties: any) => void
    selectedBlock?: any
    blockData: any
}

const Globe3DTiles = ({ onBlockSelect = () => {}, selectedBlock, blockData }: Globe3DTilesProps) => {
    const [isAutoRotating, setIsAutoRotating] = useState(false)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="text-red-500 bg-black/80 p-6 rounded-lg text-center">
                    <p className="font-bold text-lg">Missing API Key</p>
                    <p className="text-sm mt-2">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full bg-black relative">
            <Canvas
                camera={{
                    fov: 45,
                    near: 1000,
                    far: 1e9, // Very far for globe scale
                    // Position camera for nice globe view showing Indonesia
                    position: [EARTH_RADIUS * 2, EARTH_RADIUS * 0.5, EARTH_RADIUS * 1.5]
                }}
                gl={{
                    antialias: true,
                    logarithmicDepthBuffer: true, // Important for large scale scenes
                    powerPreference: "high-performance",
                }}
                shadows
                dpr={[1, 2]}
            >
                <Suspense fallback={
                    <Html center>
                        <div className="text-white text-lg">Loading 3D Tiles Globe...</div>
                    </Html>
                }>
                    <GlobeScene
                        onBlockSelect={onBlockSelect}
                        selectedBlock={selectedBlock}
                        isAutoRotating={isAutoRotating}
                        blockData={blockData}
                    />
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

export default Globe3DTiles
