"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, X, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MOCK_BLOCKS, type BlockCommercialData } from "@/data/investor-data"

interface BlockComparatorStripProps {
    selectedBlockIds: string[]
    onRemoveBlock: (id: string) => void
}

export function BlockComparatorStrip({ selectedBlockIds, onRemoveBlock }: BlockComparatorStripProps) {
    const [isExpanded, setIsExpanded] = useState(true)

    if (selectedBlockIds.length === 0) return null

    const blocks = selectedBlockIds.map(id => Object.values(MOCK_BLOCKS).find(b => b.id === id)).filter(Boolean) as BlockCommercialData[]

    return (
        <div className="flex-none bg-white border-t border-gray-200 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300">
            {/* Header / Toggle */}
            <div
                className="h-8 flex items-center justify-between px-4 bg-slate-50 border-b border-gray-200 cursor-pointer hover:bg-slate-100"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Block Comparator ({blocks.length})
                    </span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </div>

            {/* Comparison Content */}
            {isExpanded && (
                <div className="h-[200px] overflow-x-auto p-4">
                    <div className="flex gap-4 min-w-max">
                        {/* Metrics Labels Column */}
                        <div className="w-32 flex flex-col gap-2 pt-8 text-xs font-medium text-slate-500 text-right">
                            <div className="h-6">Operator</div>
                            <div className="h-6">Status</div>
                            <div className="h-6">Fiscal (Govt/Tax)</div>
                            <div className="h-6">Reserves (2P)</div>
                            <div className="h-6">Risk (Tech/Comm)</div>
                            <div className="h-6">NPV (Est)</div>
                        </div>

                        {/* Block Columns */}
                        {blocks.map(block => (
                            <div key={block.id} className="w-48 flex flex-col gap-2 relative group">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveBlock(block.id); }}
                                    className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50 hover:text-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>

                                {/* Header */}
                                <div className="h-8 font-bold text-sm text-slate-900 truncate px-1" title={block.name}>
                                    {block.name}
                                </div>

                                {/* Metrics */}
                                <div className="h-6 text-xs text-slate-700 truncate px-1 bg-slate-50 rounded flex items-center">
                                    {block.operator}
                                </div>
                                <div className="h-6 text-xs px-1 flex items-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${block.status === 'Production' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {block.status}
                                    </span>
                                </div>
                                <div className="h-6 text-xs text-slate-700 px-1 flex items-center gap-1">
                                    <span className="font-mono">{block.fiscalTerms.royaltyRate}%</span>
                                    <span className="text-slate-400">/</span>
                                    <span className="font-mono">{block.fiscalTerms.taxRate}%</span>
                                </div>
                                <div className="h-6 text-xs text-slate-700 px-1 flex items-center">
                                    <span className="font-mono font-bold">{block.resources.oilReserves2P || 0}</span>
                                    <span className="text-[10px] text-slate-500 ml-1">MMbbl</span>
                                </div>
                                <div className="h-6 text-xs px-1 flex items-center gap-2">
                                    <RiskDot value={block.risks.technical} />
                                    <RiskDot value={block.risks.commercial} />
                                </div>
                                <div className="h-6 text-xs text-slate-900 px-1 flex items-center font-bold font-mono">
                                    $ {(Math.random() * 500 + 100).toFixed(0)}M
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function RiskDot({ value }: { value: number }) {
    const color = value <= 3 ? "bg-green-500" : value <= 6 ? "bg-amber-500" : "bg-red-500"
    return (
        <div className={`w-2 h-2 rounded-full ${color}`} title={`Risk Score: ${value}/10`} />
    )
}
