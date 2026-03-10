"use client"

import { useState, useCallback } from "react"
import { Asterisk, X, Crosshair } from "lucide-react"

interface AnalysisMarkerToolbarProps {
    view: __esri.MapView | __esri.SceneView | null
    isActive: boolean
    onToggle: () => void
}

export function AnalysisMarkerToolbar({ view, isActive, onToggle }: AnalysisMarkerToolbarProps) {
    if (!view) return null

    return (
        <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${isActive
                ? "bg-blue-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
                }`}
            title="Analysis Marker"
        >
            <Crosshair className="w-4 h-4" />
            Marker
        </button>
    )
}

export function AnalysisMarkerTooltip({ isActive, message }: { isActive: boolean; message?: string }) {
    if (!isActive) return null
    
    return (
        <div className="text-xs text-white bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg">
            {message || "Click on map to place analysis marker"}
        </div>
    )
}
