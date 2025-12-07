'use client'

import React from 'react'
import { Globe, Map } from 'lucide-react'

interface ViewModeToggleProps {
    viewMode: 'globe' | 'map'
    toggleViewMode: (mode: 'globe' | 'map') => void
}

export default function ViewModeToggle({ viewMode, toggleViewMode }: ViewModeToggleProps) {
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => toggleViewMode('globe')}
                className={`p-2 rounded-full transition-all ${viewMode === 'globe'
                        ? 'bg-white/20 text-white'
                        : 'hover:bg-white/10 text-white/60 hover:text-white'
                    }`}
                title="Globe View"
            >
                <Globe className="w-4 h-4" />
            </button>
            <button
                onClick={() => toggleViewMode('map')}
                className={`p-2 rounded-full transition-all ${viewMode === 'map'
                        ? 'bg-white/20 text-white'
                        : 'hover:bg-white/10 text-white/60 hover:text-white'
                    }`}
                title="Map View"
            >
                <Map className="w-4 h-4" />
            </button>
        </div>
    )
}
