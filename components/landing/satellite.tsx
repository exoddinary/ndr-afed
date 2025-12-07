'use client'

import React, { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface SatelliteProps {
    position: [number, number, number]
    scale: [number, number, number]
    rotation: [number, number, number]
    sunPosition?: THREE.Vector3
    onClick?: () => void
}

const Satellite = ({ position, scale, rotation, sunPosition, onClick }: SatelliteProps) => {
    const groupRef = useRef<THREE.Group>(null)
    const [hovered, setHovered] = useState(false)
    const [blinkOn, setBlinkOn] = useState(false)
    const lastBlinkTime = useRef(0)
    const solarPanelRefs = useRef<THREE.Object3D[]>([])

    // Load the ISS GLB model
    const { scene } = useGLTF('/models/ISS_stationary.glb')

    // Clone the scene and find solar panels
    const clonedScene = useMemo(() => {
        const clone = scene.clone()
        solarPanelRefs.current = []
        
        // Apply environment map intensity and find solar panels
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                if (mesh.material) {
                    const material = mesh.material as THREE.MeshStandardMaterial
                    material.envMapIntensity = 1.5
                    material.needsUpdate = true
                }
                
                // Identify solar panels by name or size (common naming conventions)
                const name = child.name.toLowerCase()
                if (name.includes('solar') || name.includes('panel') || name.includes('wing') || name.includes('array')) {
                    solarPanelRefs.current.push(child)
                }
            }
        })
        
        return clone
    }, [scene])

    useFrame(({ clock }) => {
        if (groupRef.current) {
            const t = clock.getElapsedTime()
            
            // Gentle floating animation
            groupRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.1
            
            // Blink every 1 second
            if (t - lastBlinkTime.current >= 1) {
                setBlinkOn(prev => !prev)
                lastBlinkTime.current = t
            }
            
            // Rotate solar panels toward sun
            if (sunPosition && solarPanelRefs.current.length > 0) {
                const satelliteWorldPos = new THREE.Vector3(...position)
                const sunDir = sunPosition.clone().sub(satelliteWorldPos).normalize()
                
                // Calculate rotation angle for panels
                const panelAngle = Math.atan2(sunDir.y, sunDir.x) * 0.3 // Subtle rotation
                
                solarPanelRefs.current.forEach((panel) => {
                    // Smoothly rotate panels
                    panel.rotation.z = THREE.MathUtils.lerp(
                        panel.rotation.z,
                        panelAngle,
                        0.02
                    )
                })
            }
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

            {/* Blinking beacon light - blinks every 1 second */}
            <pointLight
                position={[0, 0.5, 0]}
                intensity={blinkOn ? 3 : 0}
                distance={8}
                color="#ff3333"
            />
            
            {/* Secondary blink indicator */}
            {blinkOn && (
                <mesh position={[0, 0.5, 0]}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshBasicMaterial color="#ff3333" toneMapped={false} />
                </mesh>
            )}

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
