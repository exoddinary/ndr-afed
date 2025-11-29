"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function BasinHeader() {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-white border-b border-gray-200 text-slate-900 select-none">
      {/* Top Bar - Always visible */}
      <div className="h-12 px-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg tracking-tight text-slate-900">North Sumatra Basin</span>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-4 text-slate-600">
            <span>25,000 km²</span>
            <span>Pertamina 60%</span>
            <span>120 kbopd</span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:text-white transition-colors"
        >
          <span className="text-xs uppercase tracking-wider text-slate-500">Basin Card</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Collapsible Details */}
      {isExpanded && (
        <div className="px-4 pb-3 grid grid-cols-4 gap-8 text-xs border-t border-gray-200 bg-gray-50 pt-3">
          <div>
            <div className="text-slate-500 mb-1 uppercase tracking-wider font-bold">Operator</div>
            <div className="text-slate-700">Pertamina (Op), Repsol, Petronas</div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 uppercase tracking-wider font-bold">Water Depth</div>
            <div className="text-slate-700">50m - 1,200m (Shallow to Deep)</div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 uppercase tracking-wider font-bold">Primary Play</div>
            <div className="text-slate-700">Miocene Carbonate Build-ups</div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 uppercase tracking-wider font-bold">Last Update</div>
            <div className="text-slate-700">24 Oct 2024 (Manual QC)</div>
          </div>
        </div>
      )}
    </div>
  )
}
