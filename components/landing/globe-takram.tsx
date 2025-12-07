'use client'

import React, { useRef, Suspense } from 'react'
import { Canvas, extend, useThree, useFrame, type ThreeElement } from '@react-three/fiber'
import { OrbitControls, Sphere, Html } from '@react-three/drei'
import * as THREE from 'three'
import { mrt, output, pass, toneMapping, uniform } from 'three/tsl'
import { PostProcessing, type Renderer } from 'three/webgpu'

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

import { useControls } from 'leva'

// Extend R3F with custom elements
extend({ AtmosphereLight })

declare module '@react-three/fiber' {
    interface ThreeElements {
        atmosphereLight: ThreeElement<typeof AtmosphereLight>
    }
}

// Hook to manage resources (simplified version of user's hook)
function useResource<T>(factory: (manage: (disposable: any) => any) => T, deps: any[]) {
    const resourceRef = useRef<T | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)

    return React.useMemo(() => {
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

const Content = () => {
    const renderer = useThree<Renderer>(({ gl }) => gl as any)
    const scene = useThree(({ scene }) => scene)
    const camera = useThree(({ camera }) => camera)

    // Leva Controls
    const { dayOfYear, timeOfDay, exposure, longitude, latitude, height } = useControls('Atmosphere', {
        dayOfYear: { value: 0, min: 0, max: 365, step: 1 },
        timeOfDay: { value: 9, min: 0, max: 24, step: 0.1 },
        exposure: { value: 10, min: 0.1, max: 20, step: 0.1 },
        longitude: { value: 115, min: -180, max: 180 }, // Indonesia center approx
        latitude: { value: -2, min: -90, max: 90 },
        height: { value: 300, min: 100, max: 10000 }
    })

    const context = useResource(() => new AtmosphereContextNode(), [])
    context.camera = camera

    // Post-processing pipeline
    const [postProcessing, passNode, toneMappingNode] = useResource(
        manage => {
            const passNode = manage(
                pass(scene, camera, { samples: 0 }).setMRT(
                    mrt({
                        output,
                        velocity: highpVelocity
                    })
                )
            )
            const colorNode = passNode.getTextureNode('output')
            const depthNode = passNode.getTextureNode('depth')
            const velocityNode = passNode.getTextureNode('velocity')

            const aerialNode = manage(
                aerialPerspective(context, colorNode, depthNode)
            )
            const lensFlareNode = manage(lensFlare(aerialNode))
            const toneMappingNode = manage(
                toneMapping(THREE.AgXToneMapping, uniform(0), lensFlareNode)
            )
            const taaNode = manage(
                temporalAntialias(highpVelocity)(
                    toneMappingNode,
                    depthNode,
                    velocityNode,
                    camera
                )
            )
            const postProcessing = new PostProcessing(renderer)
            postProcessing.outputNode = taaNode.add(dithering)

            return [postProcessing, passNode, toneMappingNode]
        },
        [renderer, scene, camera, context]
    )

    useFrame(() => {
        if (postProcessing) {
            postProcessing.render()
        }
    })

    // Update Tone Mapping
    useFrame(() => {
        if (toneMappingNode) {
            toneMappingNode.exposure.value = exposure
        }
    })

    // Update Location
    useFrame(() => {
        // Simplified location update - assuming context has matrixWorldToECEF
        // In a real implementation, we'd need the full math utils from the library
        // For now, we'll trust the context handles basic updates or needs specific matrix calcs
    })

    // Update Date/Sun
    useFrame(() => {
        const { matrixECIToECEF, sunDirectionECEF, moonDirectionECEF } = context
        getECIToECEFRotationMatrix(dayOfYear, matrixECIToECEF.value)
        getSunDirectionECI(dayOfYear, sunDirectionECEF.value).applyMatrix4(
            matrixECIToECEF.value
        )
        getMoonDirectionECI(dayOfYear, moonDirectionECEF.value).applyMatrix4(
            matrixECIToECEF.value
        )
    })

    // Sky Environment
    const envNode = useResource(() => skyEnvironment(context), [context])
    const lightRef = useRef<AtmosphereLight>(null)

    useFrame(() => {
        if (lightRef.current) {
            lightRef.current.direct.value = true
            lightRef.current.indirect.value = true
        }
        scene.environmentNode = envNode
    })

    return (
        <>
            <atmosphereLight ref={lightRef} args={[context]} />
            <OrbitControls target={[0, 0, 0]} minDistance={1.1} maxDistance={10} />
            {/* Earth Sphere Placeholder */}
            <Sphere args={[1, 128, 128]}>
                <meshPhysicalMaterial color="blue" roughness={0.5} metalness={0.1} />
            </Sphere>
        </>
    )
}

const GlobeTakram = () => {
    const [error, setError] = React.useState<string | null>(null)

    if (error) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center text-white p-4 text-center">
                <div>
                    <h3 className="text-xl font-bold mb-2">WebGPU Error</h3>
                    <p>{error}</p>
                    <p className="text-sm text-gray-400 mt-2">Your browser may not support WebGPU.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full bg-black relative">
            <Canvas
                camera={{ position: [0, 0, 4], fov: 45 }}
                gl={async (canvas) => {
                    if (typeof navigator !== 'undefined' && !navigator.gpu) {
                        setError("WebGPU is not supported in this browser.")
                        return new THREE.WebGLRenderer({ canvas: canvas as unknown as HTMLCanvasElement })
                    }

                    try {
                        const { WebGPURenderer } = await import('three/webgpu')
                        const renderer = new WebGPURenderer({ canvas: canvas as unknown as HTMLCanvasElement, antialias: true })
                        await renderer.init()
                        renderer.library.addLight(AtmosphereLightNode, AtmosphereLight)
                        return renderer as unknown as THREE.WebGLRenderer
                    } catch (e: any) {
                        console.error("Error creating WebGPURenderer:", e)
                        setError(e.message || "Error creating WebGPURenderer")
                        return new THREE.WebGLRenderer({ canvas: canvas as unknown as HTMLCanvasElement })
                    }
                }}
            >
                <Suspense fallback={<Html center>Loading WebGPU Atmosphere...</Html>}>
                    <Content />
                </Suspense>
            </Canvas>
        </div>
    )
}

export default GlobeTakram
