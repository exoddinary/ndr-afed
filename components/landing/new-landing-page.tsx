'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AnimatePresence } from 'framer-motion'
import blockData from '@/data/exploration-blocks.json'
import { licensingRounds } from '@/data/licensing-rounds'
import LicensingSummaryPanel from '@/components/landing/licensing-summary-panel'
import LicensingOpportunitiesPanel from '@/components/landing/licensing-opportunities-panel'
import OfficialLicensingAuthority from '@/components/landing/official-licensing-authority'
import SearchBar from '@/components/landing/search-bar'
import ViewModeToggle from '@/components/landing/view-mode-toggle'
import BlockInfoPanel from '@/components/landing/block-info-panel'
import eastNatunaData from '@/data/east-natuna.json'

// Dynamically import Takram WebGPU globe with full atmosphere
const Globe3D = dynamic(() => import('@/components/landing/globe-takram-full'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-black flex items-center justify-center">
            <div className="text-white text-xl">Loading WebGPU Globe...</div>
        </div>
    ),
})

// Simple inline placeholder for Map view
const MapViewPlaceholder = () => (
    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center p-8">
            <div className="text-2xl font-bold mb-3">Map View</div>
            <div className="text-sm text-white/60 mb-6">Full map integration coming soon...</div>
            <div className="text-xs text-white/40">Switch to Globe view to see the 3D visualization</div>
        </div>
    </div>
)

export default function NewLandingPage() {
    const router = useRouter()
    const [theme, setTheme] = useState('dark')
    const [viewMode, setViewMode] = useState<'globe' | 'map'>('globe')
    const [selectedBlock, setSelectedBlock] = useState<any>(null)
    const [activeFilter, setActiveFilter] = useState('all')
    const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({})
    const [resetViewTrigger, setResetViewTrigger] = useState(0)
    const [showOpportunities, setShowOpportunities] = useState(false)
    const [showAuthority, setShowAuthority] = useState(true)
    const [isTransitioning, setIsTransitioning] = useState(false)

    // Theme effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    const toggleViewMode = (mode: 'globe' | 'map') => {
        setViewMode(mode)
    }

    const handleBlockSelect = (blockProperties: any) => {
        if (blockProperties) {
            if (blockProperties.namobj === 'East Natuna' || blockProperties.namobj === 'EAST NATUNA') {
                setSelectedBlock(eastNatunaData)
            } else {
                setSelectedBlock({
                    blockName: blockProperties.namobj,
                    operator: blockProperties.operator || 'Unknown Operator',
                    developmentOperator: 'TBD',
                    status: blockProperties.status || 'Exploration',
                    expiryDate: 'TBD',
                    note: 'No detailed data available for this block in demo mode.',
                    metrics: { reserves_2p_mmbbl: 0, valuation_npv10: 'N/A' },
                    risk: { technical: 5, commercial: 5, political: 5, regulatory: 5 },
                    contact: { entity: 'SKK Migas', email: 'info@skkmigas.go.id' }
                })
            }
        }
    }

    const handleBlockHover = (data: any, event: any) => {
        // Handled by ArcGISMap internal state
    }

    const handleBlockLeave = () => {
        // Optional
    }

    const handleLayerToggle = (layerId: string, isActive: boolean) => {
        setActiveLayers(prev => ({ ...prev, [layerId]: isActive }))
    }

    const handleSatelliteClick = () => {
        setViewMode('map')
    }

    const handleSearch = (block: any) => {
        setViewMode('map')
        setSelectedBlock(block)
    }

    const handleEnterWorkspace = () => {
        setIsTransitioning(true)
        // Wait for zoom + white transition, then navigate
        setTimeout(() => {
            router.push('/workspace')
        }, 1500)
    }

    // Extract searchable data
    const searchableData = blockData.features.map(f => f.properties)

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black text-white transition-colors duration-300" data-theme={theme}>

            {/* 1. Header (Top-Left) */}
            <div className="absolute top-6 left-8 z-50 pointer-events-none flex items-center gap-4">
                <Image
                    src="/vdr-logo.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="opacity-90 drop-shadow-2xl"
                />
                <div className="flex flex-col items-start justify-center">
                    <h1 className="text-xl font-light tracking-[0.15em] drop-shadow-lg bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent leading-none mb-1">
                        VIRTUAL DATA ROOM
                    </h1>
                    <p className="text-[8px] text-white/60 font-medium tracking-[0.25em] uppercase drop-shadow-md pl-0.5">
                        Indonesia Exploration & Licensing Platform
                    </p>
                </div>
            </div>

            {/* Search Bar (Top Center) */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
                <SearchBar data={searchableData} onSearch={handleSearch} />
            </div>

            {/* 2. Main Content Area (Map/Globe Background) */}
            <div className="absolute inset-0 z-0">
                {viewMode === 'map' ? (
                    <MapViewPlaceholder />
                ) : (
                    <Globe3D
                        onBlockSelect={handleBlockSelect}
                        selectedBlock={selectedBlock}
                        blockData={blockData}
                        licensingRounds={licensingRounds}
                        onOpenOpportunities={() => setShowOpportunities(true)}
                        isZooming={isTransitioning}
                    />
                )}
            </div>

            {/* 3. Bottom Controls (Theme & View Mode) - Bottom Middle */}
            <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {/* Workspace Button - Only show after onboarding modal is closed */}
                {!showAuthority && (
                    <button
                        onClick={handleEnterWorkspace}
                        className="group relative px-10 py-5 bg-white/10 backdrop-blur-xl text-white rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 border border-white/30 hover:border-white/50 hover:bg-white/15"
                    >
                        <span className="relative z-10 tracking-wide">Workspace</span>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                )}

                {/* Toggles */}
                <div className="flex items-center gap-4 p-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/5 shadow-2xl">
                    <ViewModeToggle viewMode={viewMode} toggleViewMode={toggleViewMode} />
                    <div className="w-px h-4 bg-white/10" />
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all"
                    >
                        {theme === 'dark' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Powered By (Bottom) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 opacity-70 pointer-events-none">
                <span className="text-[9px] uppercase tracking-[0.25em] text-white/80 font-semibold">
                    Powered by
                </span>
                <Image
                    src="/vdr-tagline.png"
                    alt="Powered by"
                    width={80}
                    height={20}
                    className="grayscale brightness-125"
                />
            </div>

            {/* 4. Left Data Layers Panel (Only on Map) - Commented out for now */}
            {/* {viewMode === 'map' && (
                <LeftDataLayersPanel
                    onLayerToggle={handleLayerToggle}
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                />
            )} */}

            {/* 5. Right Block Info Panel */}
            <AnimatePresence>
                {selectedBlock && (
                    <BlockInfoPanel
                        block={selectedBlock}
                        onClose={() => setSelectedBlock(null)}
                    />
                )}
            </AnimatePresence>

            {/* Licensing summary (top-right), matches VDR landing */}
            <LicensingSummaryPanel rounds={licensingRounds} onOpen={() => setShowOpportunities(true)} />

            {/* Opportunities drawer */}
            {showOpportunities && (
                <LicensingOpportunitiesPanel rounds={licensingRounds} onClose={() => setShowOpportunities(false)} />
            )}

            {/* Official Licensing Authority (bottom-center) */}
            {showAuthority && (
                <OfficialLicensingAuthority onClose={() => setShowAuthority(false)} />
            )}

            {/* White Transition Overlay */}
            <div 
                className={`fixed inset-0 z-[100] bg-white pointer-events-none transition-opacity duration-1000 ease-in ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
            />

        </div>
    )
}
