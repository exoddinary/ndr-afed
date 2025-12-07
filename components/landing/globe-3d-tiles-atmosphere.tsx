'use client'

import React, { useState, Suspense, useEffect } from 'react'
import { extend, useThree, useFrame, type ThreeElement } from '@react-three/fiber'
import { OrbitControls, Html, Stars } from '@react-three/drei'
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

// Takram atmosphere imports
import {
    getECIToECEFRotationMatrix,
    getMoonDirectionECI,
    getSunDirectionECI
} from '@takram/three-atmosphere'
import {
    Atmosphere,
    Sky,
    SunLight
} from '@takram/three-atmosphere/r3f'

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

// Scene with 3D Tiles Globe and Takram Atmosphere
interface GlobeSceneProps {
    isAutoRotating: boolean
}

const GlobeScene = ({ isAutoRotating }: GlobeSceneProps) => {
    const { camera } = useThree()
    const [satellitePosition, setSatellitePosition] = useState<[number, number, number]>([0, 0, 0])
    
    // Calculate date for atmosphere (current time or fixed)
    const [date] = useState(() => {
        const d = new Date()
        d.setMonth(5) // June for good lighting
        d.setHours(10) // Morning light
        return d
    })

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
            {/* Takram Atmosphere - provides realistic atmospheric scattering and lighting */}
            <Atmosphere date={date}>
                {/* Sky dome with atmospheric scattering */}
                <Sky />
                
                {/* Physically accurate sun lighting */}
                <SunLight intensity={5} />
            </Atmosphere>

            {/* Stars Background (visible in dark areas) */}
            <Stars
                radius={EARTH_RADIUS * 100}
                depth={EARTH_RADIUS * 20}
                count={5000}
                factor={EARTH_RADIUS * 0.005}
                saturation={0}
                fade
                speed={0.3}
            />

            {/* Google 3D Tiles Globe */}
            <Suspense fallback={
                <Html center>
                    <div className="text-white bg-black/50 px-4 py-2 rounded">Loading 3D Tiles...</div>
                </Html>
            }>
                <PhotorealisticGlobe />
            </Suspense>

            {/* Satellite */}
            <Satellite
                position={satellitePosition}
                scale={[EARTH_RADIUS * 0.000008, EARTH_RADIUS * 0.000008, EARTH_RADIUS * 0.000008]}
                rotation={[0.5, 2, 0]}
            />
        </>
    )
}

interface Globe3DTilesAtmosphereProps {
    onBlockSelect?: (properties: any) => void
    selectedBlock?: any
    blockData?: any
}

// Dynamic import for Canvas to handle WebGL/WebGPU
const Globe3DTilesAtmosphere = ({ onBlockSelect = () => {}, selectedBlock, blockData }: Globe3DTilesAtmosphereProps) => {
    const [isAutoRotating, setIsAutoRotating] = useState(false)
    const [CanvasComponent, setCanvasComponent] = useState<any>(null)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    useEffect(() => {
        // Dynamically import Canvas
        import('@react-three/fiber').then(({ Canvas }) => {
            setCanvasComponent(() => Canvas)
        })
    }, [])

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

    if (!CanvasComponent) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="text-white">Initializing...</div>
            </div>
        )
    }

    return (
        <div className="w-full h-full bg-black relative">
            <CanvasComponent
                camera={{
                    fov: 50,
                    near: 100,
                    far: 1e9,
                    position: [0, 0, EARTH_RADIUS * 2.5]
                }}
                gl={{
                    antialias: true,
                    logarithmicDepthBuffer: true,
                    powerPreference: "high-performance",
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.5,
                }}
                shadows
                dpr={[1, 2]}
            >
                <Suspense fallback={
                    <Html center>
                        <div className="text-white text-lg">Loading Globe...</div>
                    </Html>
                }>
                    <GlobeScene isAutoRotating={isAutoRotating} />
                </Suspense>
            </CanvasComponent>

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

export default Globe3DTilesAtmosphere
