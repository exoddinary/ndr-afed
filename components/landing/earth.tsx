'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'

const Earth = ({ radius = 6.371, rotationSpeed = 0.001 }) => {
    const earthRef = useRef<THREE.Mesh>(null)
    const cloudsRef = useRef<THREE.Mesh>(null)
    const { gl } = useThree()

    // Load high-resolution textures
    const [colorMap, normalMap, specularMap, cloudsMap] = useLoader(TextureLoader, [
        'https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74393/world.200412.3x5400x2700.jpg',
        '/textures/earth-topology.png',
        '/textures/earth-water.png',
        '/textures/earth-clouds.png'
    ])

    // Apply high-quality texture settings
    useMemo(() => {
        const maxAnisotropy = gl.capabilities.getMaxAnisotropy()
        ;[colorMap, normalMap, specularMap, cloudsMap].forEach(texture => {
            if (texture) {
                texture.anisotropy = maxAnisotropy
                texture.minFilter = THREE.LinearMipmapLinearFilter
                texture.magFilter = THREE.LinearFilter
                texture.generateMipmaps = true
                texture.needsUpdate = true
            }
        })
    }, [colorMap, normalMap, specularMap, cloudsMap, gl])

    useFrame(() => {
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += rotationSpeed * 0.1 // Clouds move slightly relative to Earth
        }
    })

    return (
        <group>
            {/* Realistic Earth Sphere - High resolution geometry */}
            <mesh ref={earthRef} castShadow receiveShadow>
                <sphereGeometry args={[radius, 256, 256]} />
                <meshPhongMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    specularMap={specularMap}
                    specular={new THREE.Color('grey')}
                    shininess={5}
                />
            </mesh>

            {/* Tech Wireframe Overlay - Hidden */}
            {/* <mesh scale={[1.001, 1.001, 1.001]}>
                <sphereGeometry args={[radius, 24, 24]} />
                <meshBasicMaterial
                    color="#00f3ff"
                    wireframe
                    transparent
                    opacity={0.12}
                />
            </mesh> */}

            {/* Cloud Layer */}
            <mesh ref={cloudsRef} scale={[1.01, 1.01, 1.01]}>
                <sphereGeometry args={[radius, 128, 128]} />
                <meshStandardMaterial
                    map={cloudsMap}
                    transparent
                    opacity={0.2}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Atmosphere Halo (Inner) */}
            <mesh scale={[1.02, 1.02, 1.02]}>
                <sphereGeometry args={[radius, 64, 64]} />
                <meshStandardMaterial
                    color="#4db2ff"
                    transparent
                    opacity={0.15}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Atmosphere Glow (Outer Soft) */}
            <mesh scale={[1.15, 1.15, 1.15]}>
                <sphereGeometry args={[radius, 64, 64]} />
                <meshStandardMaterial
                    color="#4db2ff"
                    transparent
                    opacity={0.08}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </group>
    )
}

export default Earth
