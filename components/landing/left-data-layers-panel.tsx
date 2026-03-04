'use client'

import React from 'react'
import { Layers } from 'lucide-react'

interface LeftDataLayersPanelProps {
    onLayerToggle: (layerId: string, isActive: boolean) => void
    activeFilter: string
    setActiveFilter: (filter: string) => void
}

export default function LeftDataLayersPanel({ onLayerToggle, activeFilter, setActiveFilter }: LeftDataLayersPanelProps) {
    const filters = [
        { id: 'all', label: 'All Blocks' },
        { id: 'exploration', label: 'Exploration' },
        { id: 'production', label: 'Production' },
        { id: 'development', label: 'Development' },
    ]

    return (
        <div className="absolute top-24 left-8 z-40 w-64 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-white mb-3">
                    <Layers className="w-5 h-5" />
                    <h3 className="font-semibold">Data Layers</h3>
                </div>
                <div className="space-y-2">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeFilter === filter.id
                                    ? 'bg-primary text-white'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
