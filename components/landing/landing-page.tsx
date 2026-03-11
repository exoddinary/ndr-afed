'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
// blockData fetched from NLOG WFS API (see lib/nlog-api.ts)

// Dynamically import 3D Tiles Globe with atmospheric effects
const Globe3D = dynamic(() => import('@/components/landing/globe-3d-tiles'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-black flex items-center justify-center">
            <div className="text-white text-xl">Loading 3D Globe...</div>
        </div>
    ),
})

export default function LandingPage() {
    const router = useRouter()
    const [selectedBlock, setSelectedBlock] = useState<any>(null)
    const [isTransitioning, setIsTransitioning] = useState(false)

    const handleBlockSelect = (blockProperties: any) => {
        setSelectedBlock(blockProperties)
    }

    const handleEnterWorkspace = () => {
        // Start transition animation
        setIsTransitioning(true)

        // Navigate after animation completes
        setTimeout(() => {
            router.push('/workspace')
        }, 1200) // Match animation duration
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Globe Background with zoom effect on transition */}
            <div
                className={`absolute inset-0 z-0 transition-transform duration-[1200ms] ease-in-out ${isTransitioning ? 'scale-[3]' : 'scale-100'
                    }`}
            >
                <Globe3D
                    onBlockSelect={handleBlockSelect}
                    selectedBlock={selectedBlock}
                    blockData={blockData}
                />
            </div>

            {/* White-out transition overlay */}
            <div
                className={`absolute inset-0 z-[100] bg-white pointer-events-none transition-opacity duration-[1000ms] ease-in ${isTransitioning ? 'opacity-100' : 'opacity-0'
                    }`}
                style={{ transitionDelay: isTransitioning ? '400ms' : '0ms' }}
            />

            {/* Header (Top-Left) - fade out on transition */}
            <div className={`absolute top-6 left-8 z-50 pointer-events-none flex items-center gap-4 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}>
                {/* Logo */}
                <Image
                    src="/data/edafy-vdr.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="opacity-90 drop-shadow-2xl"
                />

                {/* Text Block */}
                <div className="flex flex-col items-start justify-center">
                    <h1 className="text-xl font-light tracking-[0.15em] drop-shadow-lg bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent leading-none mb-1">
                        VIRTUAL DATA ROOM
                    </h1>
                    <p className="text-[8px] text-white/60 font-medium tracking-[0.25em] uppercase drop-shadow-md pl-0.5">
                        Indonesia Exploration & Licensing Platform
                    </p>
                </div>
            </div>

            {/* Enter Workspace Button (Center) - Semi-transparent with blur */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-150' : 'opacity-100 scale-100'
                }`}>
                <button
                    onClick={handleEnterWorkspace}
                    disabled={isTransitioning}
                    className="group relative px-10 py-5 bg-white/10 backdrop-blur-xl text-white rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 border border-white/30 hover:border-white/50 hover:bg-white/15"
                >
                    <span className="relative z-10 tracking-wide">Workspace</span>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
            </div>

            {/* Powered By (Bottom) - fade out on transition */}
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pointer-events-none transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-70'
                }`}>
                <span className="text-[9px] uppercase tracking-[0.25em] text-white/80 font-semibold">
                    Powered by
                </span>
                <Image
                    src="/landing-tagline.png"
                    alt="Powered by"
                    width={80}
                    height={20}
                    className="grayscale brightness-125"
                />
            </div>

            {/* Block Info Panel (if block selected) - hide during transition */}
            {selectedBlock && !isTransitioning && (
                <div className="absolute top-24 right-8 z-50 w-80 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl">
                    <button
                        onClick={() => setSelectedBlock(null)}
                        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                    <h3 className="text-lg font-bold text-white mb-2">{selectedBlock.namobj}</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-white/60">Status:</span>
                            <span className="text-white font-medium">{selectedBlock.status || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/60">Operator:</span>
                            <span className="text-white font-medium">{selectedBlock.operator || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
