"use client"

import { Square } from "lucide-react"

export function PropertiesPanel() {
  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="h-8 flex items-center px-3 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Properties & Legend</span>
      </div>
      
      <div className="flex-1 p-3 space-y-6 overflow-auto">
        {/* Legend Section */}
        <div>
          <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-2">Facies Legend (Turonian)</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <div className="w-3 h-3 bg-yellow-200 border border-yellow-600" />
              <span>Clastic Shoreface</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <div className="w-3 h-3 bg-cyan-200 border border-cyan-600" />
              <span>Carbonate Platform</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <div className="w-3 h-3 bg-blue-900 border border-blue-700" />
              <span>Deep Marine Shale</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <div className="w-3 h-3 bg-gray-800 border border-gray-600 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-black"></div>
                </div>
              </div>
              <span>Source Rock (TOC &gt; 2%)</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Active Selection Properties */}
        <div>
          <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-2">Selected Polygon</h4>
          <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-xs">
            <div className="text-slate-500">ID</div>
            <div className="font-mono text-slate-700 text-right">POLY-294</div>
            
            <div className="text-slate-500">Environment</div>
            <div className="font-mono text-slate-700 text-right">Lower Delta Plain</div>
            
            <div className="text-slate-500">Sand %</div>
            <div className="font-mono text-slate-700 text-right">65%</div>
            
            <div className="text-slate-500">Confidence</div>
            <div className="font-mono text-slate-700 text-right">High (Well Ctrl)</div>
            
            <div className="text-slate-500">Interpreter</div>
            <div className="font-mono text-slate-700 text-right">J. Smith</div>
          </div>
        </div>
        
        <div className="mt-auto pt-4">
           <div className="bg-gray-50 border border-gray-200 p-2 rounded text-xs">
              <div className="text-slate-500 mb-1">Active Interval</div>
              <div className="text-teal-600 font-bold flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                 Turonian (93.9 - 89.8 Ma)
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
