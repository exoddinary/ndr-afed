'use client'

import React, { useState, useEffect, useRef, useMemo, type FC } from 'react'
import * as THREE from 'three'
import { Play, Pause } from 'lucide-react'
import { useFrame, useThree, Canvas } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import { useGLTF } from '@react-three/drei'

// Import Takram atmosphere components
import {
    getECIToECEFRotationMatrix,
    getMoonDirectionECI,
    getSunDirectionECI
} from '@takram/three-atmosphere'

import {
    Atmosphere,
    AtmosphereContext,
    SkyLight,
    SunLight
} from '@takram/three-atmosphere/r3f'


// Import block data
// blockData fetched from NLOG WFS API (see lib/nlog-api.ts)

// Earth constants
const EARTH_RADIUS = 6.371 // km scaled

interface GlobeTakramAtmosphericProps {
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

// Earth component with atmospheric materials
const Earth = () => {
    const textureLoader = new THREE.TextureLoader()
    
    const [earthMap, earthBumpMap, earthSpecularMap] = useMemo(() => {
        const loadTexture = (url: string) => {
            const tex = textureLoader.load(url)
            tex.colorSpace = THREE.SRGBColorSpace
            return tex
        }
        
        return [
            loadTexture('https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg'),
            loadTexture('https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png'),
            loadTexture('https://unpkg.com/three-globe@2.31.0/example/img/earth-water.png')
        ]
    }, [])

    return (
        <mesh scale={[EARTH_RADIUS, EARTH_RADIUS, EARTH_RADIUS]}>
            <sphereGeometry args={[1, 128, 128]} />
            <meshPhysicalMaterial
                map={earthMap}
                bumpMap={earthBumpMap}
                bumpScale={0.05}
                roughness={0.7}
                metalness={0.1}
            />
        </mesh>
    )
}

// Flow lines component
const FlowLines = () => {
    const blockCenters = useMemo(() => {
        return blockData.features.slice(0, 20).map((feature: any) => {
            const [lng, lat] = getPolygonCenter(feature.geometry.coordinates)
            if (isNaN(lat) || isNaN(lng)) return null
            return latLngToVector3(lat, lng, EARTH_RADIUS * 1.005)
        }).filter(Boolean) as THREE.Vector3[]
    }, [])

    const flowLines = useMemo(() => {
        const lines: { start: THREE.Vector3, end: THREE.Vector3, offset: number }[] = []
        const earthRotation = new THREE.Euler(-0.1, -2.5, 0)
        
        // Connect all blocks
        for (let i = 0; i < blockCenters.length; i++) {
            for (let j = i + 1; j < blockCenters.length; j++) {
                const start = blockCenters[i].clone().applyEuler(earthRotation)
                const end = blockCenters[j].clone().applyEuler(earthRotation)
                lines.push({ start, end, offset: Math.random() })
            }
        }
        return lines
    }, [blockCenters])

    return (
        <group>
            {flowLines.map((line, idx) => {
                const points = []
                const mid = line.start.clone().add(line.end).multiplyScalar(0.5)
                const distance = line.start.distanceTo(line.end)
                const arcHeight = EARTH_RADIUS * (1.05 + distance * 0.015)
                mid.normalize().multiplyScalar(arcHeight)
                
                const curve = new THREE.QuadraticBezierCurve3(line.start, mid, line.end)
                const curvePoints = curve.getPoints(32)
                
                return (
                    <Line
                        key={idx}
                        points={curvePoints}
                        color="white"
                        opacity={0.15}
                        transparent
                    />
                )
            })}
        </group>
    )
}

// Block points component
const BlockPoints = () => {
    const blockCenters = useMemo(() => {
        return blockData.features.slice(0, 20).map((feature: any) => {
            const [lng, lat] = getPolygonCenter(feature.geometry.coordinates)
            if (isNaN(lat) || isNaN(lng)) return null
            return latLngToVector3(lat, lng, EARTH_RADIUS * 1.005)
        }).filter(Boolean) as THREE.Vector3[]
    }, [])

    return (
        <group>
            {blockCenters.map((pos, idx) => {
                const earthRotation = new THREE.Euler(-0.1, -2.5, 0)
                const rotatedPos = pos.clone().applyEuler(earthRotation)
                return (
                    <mesh key={idx} position={rotatedPos}>
                        <sphereGeometry args={[0.03, 8, 8]} />
                        <meshBasicMaterial color="white" />
                    </mesh>
                )
            })}
        </group>
    )
}

// Scene component
const Scene: FC<{ isAutoRotating: boolean }> = ({ isAutoRotating }) => {
    const [satellitePosition, setSatellitePosition] = useState<[number, number, number]>([0, 0, 0])
    const { camera } = useThree()
    const groupRef = useRef<THREE.Group>(null)
    const sunRef = useRef<THREE.Group>(null)
    
    // Earth rotation to show Indonesia
    const earthRotation: [number, number, number] = [-0.1, -2.5, 0]

    // Animate sun rotation
    useFrame((_, delta) => {
        if (isAutoRotating && sunRef.current) {
            sunRef.current.rotation.y += delta * 0.01
        }
        
        // Update satellite position
        const cameraDir = new THREE.Vector3()
        camera.getWorldDirection(cameraDir)
        const satPos = cameraDir.clone().multiplyScalar(-EARTH_RADIUS * 1.3)
        satPos.add(new THREE.Vector3(-1.5, -0.8, 0))
        setSatellitePosition([satPos.x, satPos.y, satPos.z])
    })

    return (
        <group ref={groupRef} rotation={earthRotation}>
            <Atmosphere>
                <Earth />
                <BlockPoints />
                <FlowLines />
                
                {/* Sun */}
                <group ref={sunRef} position={[EARTH_RADIUS * 15, EARTH_RADIUS * 5, EARTH_RADIUS * 10]}>
                    <mesh>
                        <sphereGeometry args={[0.5, 16, 16]} />
                        <meshBasicMaterial color="white" toneMapped={false} />
                    </mesh>
                    <sprite scale={[20, 20, 1]}>
                        <spriteMaterial
                            color="#fff8e7"
                            transparent
                            opacity={0.3}
                            blending={THREE.AdditiveBlending}
                            depthWrite={false}
                            toneMapped={false}
                        />
                    </sprite>
                </group>
                
                {/* Satellite */}
                <Satellite position={satellitePosition} />
            </Atmosphere>
        </group>
    )
}


// Satellite component
const Satellite: FC<{ position: [number, number, number] }> = ({ position }) => {
    const gltf = useGLTF('/models/ISS_stationary.glb')
    const [blinkTime, setBlinkTime] = useState(0)
    
    useFrame((_, delta) => {
        setBlinkTime(prev => prev + delta)
    })
    
    const blinkOn = Math.floor(blinkTime) % 2 === 0 && (blinkTime % 1) < 0.1
    
    return (
        <primitive
            object={gltf.scene}
            scale={0.008}
            position={position}
        >
            <pointLight
                position={[0, 50, 0]}
                color="#ff3333"
                intensity={blinkOn ? 5 : 0}
                distance={8}
            />
            <mesh position={[0, 50, 0]}>
                <sphereGeometry args={[5, 8, 8]} />
                <meshBasicMaterial color="#ff3333" transparent opacity={blinkOn ? 1 : 0} />
            </mesh>
        </primitive>
    )
}

// Main component
const GlobeTakramAtmospheric: FC<GlobeTakramAtmosphericProps> = ({
    onBlockSelect = () => {},
    selectedBlock,
    blockData: propBlockData
}) => {
    const [isAutoRotating, setIsAutoRotating] = useState(true)
    
    return (
        <div className="w-full h-full bg-black relative">
            <Canvas
                camera={{
                    position: [EARTH_RADIUS * 2.5, EARTH_RADIUS * 0.5, EARTH_RADIUS * 1.5],
                    fov: 45,
                    near: 0.1,
                    far: 1000
                }}
                gl={{
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.0
                }}
            >
                <Scene isAutoRotating={isAutoRotating} />
                
                
                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={EARTH_RADIUS * 1.2}
                    maxDistance={EARTH_RADIUS * 5}
                    enablePan={false}
                />
            </Canvas>
            
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

export default GlobeTakramAtmospheric
