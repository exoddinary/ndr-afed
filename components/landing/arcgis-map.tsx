'use client'

// Placeholder stub for ArcGIS Map component
import React from 'react'

interface ArcGISMapProps {
    onBlockHover: (data: any, event: any) => void
    onBlockLeave: () => void
    onBlockSelect: (blockProperties: any) => void
    filter: string
    theme: string
    selectedBlock: any
    resetViewTrigger: number
    activeLayers: Record<string, boolean>
}

export default function ArcGISMap(props: ArcGISMapProps) {
    return (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
            <div className="text-white text-center">
                <div className="text-xl font-bold mb-2">ArcGIS Map View</div>
                <div className="text-sm text-white/60">Map integration coming soon...</div>
            </div>
        </div>
    )
}
