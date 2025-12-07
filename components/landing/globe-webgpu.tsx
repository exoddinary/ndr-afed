'use client'

import React, { useState, Suspense, useEffect, useRef, useMemo } from 'react'
import { Canvas, extend, useThree, useFrame, type ThreeElement } from '@react-three/fiber'
import { Html, Stars } from '@react-three/drei'
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

// Takram atmosphere imports for WebGPU
import {
    getECIToECEFRotationMatrix,
    getMoonDirectionECI,
    getSunDirectionECI
} from '@takram/three-atmosphere'
import {
    aerialPerspective,
    AtmosphereContextNode,
    AtmosphereLight,
    AtmosphereLightNode,
    skyEnvironment
} from '@takram/three-atmosphere/webgpu'
import {
    dithering,
    highpVelocity,
    lensFlare,
    temporalAntialias
} from '@takram/three-geospatial/webgpu'

import Satellite from './satellite'

// Extend R3F with AtmosphereLight
extend({ AtmosphereLight })

declare module '@react-three/fiber' {
    interface ThreeElements {
        atmosphereLight: ThreeElement<typeof AtmosphereLight>
    }
}

// Create DRACO loader instance (singleton)
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

// Constants for Earth
const EARTH_RADIUS = 6371000 // meters

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
            <TilesPlugin 
                plugin={GoogleCloudAuthPlugin} 
                args={{ 
                    apiToken: apiKey,
                    autoRefreshToken: true 
                } as any}
            />
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

// WebGPU Scene with Takram Atmosphere
interface WebGPUSceneProps {
    dayOfYear: number
    timeOfDay: number
}

const WebGPUScene = ({ dayOfYear, timeOfDay }: WebGPUSceneProps) => {
    const { gl, scene, camera } = useThree()
    const renderer = gl as any
    const [satellitePosition, setSatellitePosition] = useState<[number, number, number]>([0, 0, 0])
    
    // Create atmosphere context
    const context = useResource(() => new AtmosphereContextNode(), [])
    context.camera = camera

    // Calculate date from dayOfYear and timeOfDay
    const date = useMemo(() => {
        const d = new Date(2024, 0, 1)
        d.setDate(dayOfYear)
        d.setHours(Math.floor(timeOfDay), (timeOfDay % 1) * 60, 0, 0)
        return d
    }, [dayOfYear, timeOfDay])

    // Update sun/moon positions based on date
    useFrame(() => {
        const { matrixECIToECEF, sunDirectionECEF, moonDirectionECEF } = context
        getECIToECEFRotationMatrix(date, matrixECIToECEF.value)
        getSunDirectionECI(date, sunDirectionECEF.value).applyMatrix4(matrixECIToECEF.value)
        getMoonDirectionECI(date, moonDirectionECEF.value).applyMatrix4(matrixECIToECEF.value)
    })

    // Update satellite position
    useFrame(() => {
        if (camera) {
            const cameraDirection = new THREE.Vector3()
            camera.getWorldDirection(cameraDirection)
            
            const distance = EARTH_RADIUS * 1.1
            const offset = new THREE.Vector3(-EARTH_RADIUS * 0.15, -EARTH_RADIUS * 0.08, 0)
            const basePosition = cameraDirection.clone().multiplyScalar(-distance)
            const finalPosition = basePosition.add(offset)
            
            setSatellitePosition([finalPosition.x, finalPosition.y, finalPosition.z])
        }
    })

    // Set up sky environment
    const envNode = useResource(() => skyEnvironment(context), [context])
    
    useFrame(() => {
        scene.environmentNode = envNode
    })

    return (
        <>
            {/* Takram Atmosphere Light */}
            <atmosphereLight args={[context]} />

            {/* Stars Background */}
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

// Fallback WebGL Scene (for browsers without WebGPU)
const WebGLFallbackScene = () => {
    const { camera } = useThree()
    const [satellitePosition, setSatellitePosition] = useState<[number, number, number]>([0, 0, 0])

    useFrame(() => {
        if (camera) {
            const cameraDirection = new THREE.Vector3()
            camera.getWorldDirection(cameraDirection)
            
            const distance = EARTH_RADIUS * 1.1
            const offset = new THREE.Vector3(-EARTH_RADIUS * 0.15, -EARTH_RADIUS * 0.08, 0)
            const basePosition = cameraDirection.clone().multiplyScalar(-distance)
            const finalPosition = basePosition.add(offset)
            
            setSatellitePosition([finalPosition.x, finalPosition.y, finalPosition.z])
        }
    })

    return (
        <>
            {/* Basic lighting for WebGL fallback */}
            <ambientLight intensity={0.3} color="#b0c4de" />
            <directionalLight
                position={[EARTH_RADIUS * 5, EARTH_RADIUS * 2, EARTH_RADIUS * 3]}
                intensity={3}
                color="#FFF8E7"
            />

            {/* Stars */}
            <Stars
                radius={EARTH_RADIUS * 100}
                depth={EARTH_RADIUS * 20}
                count={5000}
                factor={EARTH_RADIUS * 0.005}
                saturation={0}
                fade
                speed={0.3}
            />

            {/* 3D Tiles Globe */}
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

interface GlobeWebGPUProps {
    onBlockSelect?: (properties: any) => void
    selectedBlock?: any
    blockData?: any
}

const GlobeWebGPU = ({ onBlockSelect = () => {}, selectedBlock, blockData }: GlobeWebGPUProps) => {
    const [isAutoRotating, setIsAutoRotating] = useState(false)
    const [webGPUSupported, setWebGPUSupported] = useState<boolean | null>(null)
    const [error, setError] = useState<string | null>(null)
    
    // Atmosphere controls
    const [dayOfYear] = useState(172) // June 21 (summer solstice)
    const [timeOfDay] = useState(10) // 10 AM for good lighting

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    // Check WebGPU support
    useEffect(() => {
        const checkWebGPU = async () => {
            if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
                try {
                    const adapter = await (navigator as any).gpu.requestAdapter()
                    if (adapter) {
                        setWebGPUSupported(true)
                        return
                    }
                } catch (e) {
                    console.warn('WebGPU adapter request failed:', e)
                }
            }
            setWebGPUSupported(false)
        }
        checkWebGPU()
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

    if (webGPUSupported === null) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="text-white">Checking WebGPU support...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="text-red-500 bg-black/80 p-6 rounded-lg text-center max-w-md">
                    <p className="font-bold text-lg">Rendering Error</p>
                    <p className="text-sm mt-2">{error}</p>
                </div>
            </div>
        )
    }

    // WebGPU Canvas setup
    const createWebGPURenderer = async (defaultProps: any) => {
        const canvas = defaultProps.canvas as HTMLCanvasElement
        if (webGPUSupported) {
            try {
                const { WebGPURenderer } = await import('three/webgpu')
                const renderer = new WebGPURenderer({ 
                    canvas, 
                    antialias: true,
                    logarithmicDepthBuffer: true
                })
                await renderer.init()
                
                // Add atmosphere light support
                renderer.library.addLight(AtmosphereLightNode, AtmosphereLight)
                
                return renderer as unknown as THREE.WebGLRenderer
            } catch (e: any) {
                console.error('WebGPU renderer creation failed:', e)
                setError(e.message || 'Failed to create WebGPU renderer')
                // Fall back to WebGL
                return new THREE.WebGLRenderer({ 
                    canvas, 
                    antialias: true,
                    logarithmicDepthBuffer: true
                })
            }
        }
        
        // WebGL fallback
        return new THREE.WebGLRenderer({ 
            canvas, 
            antialias: true,
            logarithmicDepthBuffer: true
        })
    }

    return (
        <div className="w-full h-full bg-black relative">
            <Canvas
                camera={{
                    fov: 50,
                    near: 1000,
                    far: 1e9,
                    position: [-EARTH_RADIUS * 2.5, 0, 0],
                    up: [0, 0, 1]
                }}
                gl={createWebGPURenderer as any}
                dpr={[1, 2]}
            >
                <Suspense fallback={
                    <Html center>
                        <div className="text-white text-lg">Loading Globe...</div>
                    </Html>
                }>
                    {webGPUSupported ? (
                        <WebGPUScene dayOfYear={dayOfYear} timeOfDay={timeOfDay} />
                    ) : (
                        <WebGLFallbackScene />
                    )}
                </Suspense>
            </Canvas>

            {/* WebGPU indicator */}
            <div className="absolute top-4 left-4 z-10">
                <div className={`px-2 py-1 rounded text-xs ${webGPUSupported ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {webGPUSupported ? '✓ WebGPU' : '⚠ WebGL Fallback'}
                </div>
            </div>

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

export default GlobeWebGPU
