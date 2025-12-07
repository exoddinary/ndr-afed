'use client'

import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface SatelliteProps {
    position: [number, number, number]
    scale: [number, number, number]
    rotation: [number, number, number]
    onClick?: () => void
}

const Satellite = ({ position, scale, rotation, onClick }: SatelliteProps) => {
    const groupRef = useRef<THREE.Group>(null)
    const [hovered, setHovered] = useState(false)

    // Load the ISS GLB model
    const { scene } = useGLTF('/models/ISS_stationary.glb')

    // Clone the scene to avoid issues with multiple instances
    const clonedScene = scene.clone()

    // Apply environment map intensity to all materials in the model
    clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            if (mesh.material) {
                const material = mesh.material as THREE.MeshStandardMaterial
                material.envMapIntensity = 1.5
                material.needsUpdate = true
            }
        }
    })

    useFrame(({ clock }) => {
        if (groupRef.current) {
            // Gentle floating animation
            const t = clock.getElapsedTime()
            groupRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.1
        }
    })

    return (
        <group
            ref={groupRef}
            position={position}
            scale={scale}
            rotation={rotation}
            onClick={onClick}
            onPointerOver={(e) => {
                e.stopPropagation()
                setHovered(true)
                document.body.style.cursor = 'pointer'
            }}
            onPointerOut={(e) => {
                e.stopPropagation()
                setHovered(false)
                document.body.style.cursor = 'auto'
            }}
        >
            <primitive object={clonedScene} />

            {/* Add subtle glow when hovered */}
            {hovered && (
                <pointLight
                    position={[0, 0, 0]}
                    intensity={2}
                    distance={5}
                    color="#3A6FF8"
                />
            )}
        </group>
    )
}

// Preload the model
useGLTF.preload('/models/ISS_stationary.glb')

export default Satellite
