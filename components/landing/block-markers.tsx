'use client'

import React, { useMemo, useState } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

// Convert lat/lon to 3D position on sphere
const latLonToVector3 = (lat: number, lon: number, radius: number, height = 0) => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)

    const x = -(radius + height) * Math.sin(phi) * Math.cos(theta)
    const z = (radius + height) * Math.sin(phi) * Math.sin(theta)
    const y = (radius + height) * Math.cos(phi)

    return new THREE.Vector3(x, y, z)
}

// Get centroid of polygon coordinates
const getPolygonCenter = (coordinates: any): [number, number] => {
    if (!coordinates || coordinates.length === 0) return [0, 0]

    const coords = Array.isArray(coordinates[0][0][0])
        ? coordinates[0][0]  // MultiPolygon
        : coordinates[0]     // Polygon

    let sumLon = 0, sumLat = 0
    coords.forEach(([lon, lat]: [number, number]) => {
        sumLon += lon
        sumLat += lat
    })

    return [sumLat / coords.length, sumLon / coords.length]
}

// Removed status colors - now using white for all markers

interface BlockMarkerProps {
    position: THREE.Vector3
    block: any
    onClick: (block: any) => void
    isSelected: boolean
}

const BlockMarker = ({ position, block, onClick, isSelected }: BlockMarkerProps) => {
    const [hovered, setHovered] = useState(false)

    return (
        <group position={position}>
            {/* White glowing dot for bloom effect */}
            <mesh
                onClick={() => onClick(block)}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
                onPointerOut={(e) => { setHovered(false); document.body.style.cursor = 'auto' }}
            >
                <sphereGeometry args={[0.025, 16, 16]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={isSelected || hovered ? 4 : 2}
                    toneMapped={false}
                />
            </mesh>

            {/* Outer glow ring when hovered/selected */}
            {(isSelected || hovered) && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.03, 0.045, 32]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.6}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}

            {/* Hover Tooltip */}
            {hovered && (
                <Html position={[0, 0.08, 0]} center distanceFactor={8} zIndexRange={[100, 0]}>
                    <div className="px-3 py-2 bg-black/80 backdrop-blur-md text-white rounded-lg border border-white/20 shadow-xl pointer-events-none min-w-[100px]">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 mb-0.5">
                            Exploration Block
                        </div>
                        <div className="text-[11px] font-bold whitespace-nowrap">
                            {block.properties?.namobj}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    )
}

interface BlockMarkersProps {
    blocks: any
    earthRadius: number
    onBlockSelect: (properties: any) => void
    selectedBlock: any
}

const BlockMarkers = ({ blocks, earthRadius, onBlockSelect, selectedBlock }: BlockMarkersProps) => {
    const markers = useMemo(() => {
        return blocks.features.map((feature: any, index: number) => {
            const [lat, lon] = getPolygonCenter(feature.geometry.coordinates)
            const position = latLonToVector3(lat, lon, earthRadius, 0.1)
            const isSelected = selectedBlock?.namobj === feature.properties?.namobj

            return (
                <BlockMarker
                    key={feature.id || index}
                    position={position}
                    block={feature}
                    onClick={(block) => onBlockSelect(block.properties)}
                    isSelected={isSelected}
                />
            )
        })
    }, [blocks, earthRadius, selectedBlock, onBlockSelect])

    return <group>{markers}</group>
}

export default BlockMarkers
