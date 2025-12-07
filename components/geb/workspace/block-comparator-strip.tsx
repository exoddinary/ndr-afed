"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, X, BarChart3, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MOCK_BLOCKS, type BlockCommercialData } from "@/data/investor-data"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

interface BlockComparatorStripProps {
    selectedBlocks: BlockCommercialData[]
    onRemoveBlock: (id: string) => void
    onAddBlock: (id: string) => void
}

export function BlockComparatorStrip({ selectedBlocks, onRemoveBlock, onAddBlock }: BlockComparatorStripProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [showAddMenu, setShowAddMenu] = useState(false)

    if (selectedBlocks.length === 0) return null

    // Use passed blocks directly
    const blocks = selectedBlocks
    const availableBlocks = Object.values(MOCK_BLOCKS).filter(b => !selectedBlocks.some(sb => sb.id === b.id))

    // Define the grid columns: Label column + 1 column per block + Add button column
    const gridTemplateColumns = `140px repeat(${blocks.length}, minmax(200px, 1fr)) 180px`

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
                <div className="overflow-x-auto custom-scrollbar">
                    <div className="grid min-w-max" style={{ gridTemplateColumns }}>

                        {/* --- Header Row --- */}
                        <div className="sticky left-0 z-10 bg-white p-3 border-b border-gray-200 border-r border-gray-100"></div>
                        {blocks.map(block => (
                            <div key={`header-${block.id}`} className="p-3 border-b border-gray-200 border-r border-gray-100 bg-white relative group">
                                <div className="font-bold text-sm text-slate-900 truncate pr-6" title={block.name}>
                                    {block.name}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveBlock(block.id); }}
                                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <div className="p-3 border-b border-gray-200 bg-white"></div>

                        {/* --- Data Rows --- */}

                        {/* Row 1: Operator */}
                        <div className="sticky left-0 z-10 p-3 text-xs font-medium text-slate-500 text-right bg-slate-50 border-b border-gray-100 border-r">Operator</div>
                        {blocks.map(block => (
                            <div key={`op-${block.id}`} className="p-3 text-xs text-slate-700 bg-slate-50 border-b border-gray-100 border-r border-gray-200/50 flex items-center">
                                {block.operator}
                            </div>
                        ))}
                        {/* Add Block Button (Spans all data rows) */}
                        <div className="row-span-6 p-4 bg-white border-l border-gray-200 flex items-center justify-center">
                            <Popover open={showAddMenu} onOpenChange={setShowAddMenu}>
                                <PopoverTrigger asChild>
                                    <button
                                        className="w-full h-full min-h-[120px] border-2 border-dashed border-slate-300 rounded-md hover:border-teal-500 hover:bg-teal-50/30 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-teal-600"
                                    >
                                        <Plus className="w-6 h-6" />
                                        <span className="text-xs font-medium">Add Block</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0 bg-white border border-gray-200 text-slate-900 shadow-xl" align="start" side="top">
                                    <Command className="bg-white text-slate-900 rounded-lg">
                                        <CommandInput
                                            placeholder="Search blocks..."
                                            className="h-9 border-b border-gray-100 text-xs"
                                        />
                                        <CommandList className="max-h-[200px] overflow-y-auto py-1">
                                            <CommandEmpty className="py-3 text-center text-xs text-slate-500">
                                                No blocks found.
                                            </CommandEmpty>
                                            <CommandGroup heading="Available Blocks" className="text-slate-500">
                                                {availableBlocks.map(block => (
                                                    <CommandItem
                                                        key={block.id}
                                                        onSelect={() => {
                                                            onAddBlock(block.id)
                                                            setShowAddMenu(false)
                                                        }}
                                                        className="flex items-center justify-between px-3 py-2 text-xs hover:bg-teal-50 hover:text-teal-900 cursor-pointer data-[selected=true]:bg-teal-50 data-[selected=true]:text-teal-900"
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="font-bold text-slate-900">{block.name}</div>
                                                            <div className="text-[10px] text-slate-500">{block.operator}</div>
                                                        </div>
                                                        <Plus className="w-3 h-3 text-slate-400" />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Row 2: Status */}
                        <div className="sticky left-0 z-10 p-3 text-xs font-medium text-slate-500 text-right bg-white border-b border-gray-100 border-r">Status</div>
                        {blocks.map(block => (
                            <div key={`status-${block.id}`} className="p-3 text-xs bg-white border-b border-gray-100 border-r border-gray-200/50 flex items-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${block.status === 'Production' ? 'bg-emerald-100 text-emerald-700' :
                                    block.status === 'Development' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                    {block.status}
                                </span>
                            </div>
                        ))}

                        {/* Row 3: Fiscal */}
                        <div className="sticky left-0 z-10 p-3 text-xs font-medium text-slate-500 text-right bg-slate-50 border-b border-gray-100 border-r">Fiscal (Govt/Tax)</div>
                        {blocks.map(block => (
                            <div key={`fiscal-${block.id}`} className="p-3 text-xs text-slate-700 bg-slate-50 border-b border-gray-100 border-r border-gray-200/50 flex items-center gap-1">
                                <span className="font-mono font-medium">{block.fiscalTerms.royaltyRate}%</span>
                                <span className="text-slate-400">/</span>
                                <span className="font-mono font-medium">{block.fiscalTerms.taxRate}%</span>
                            </div>
                        ))}

                        {/* Row 4: Reserves */}
                        <div className="sticky left-0 z-10 p-3 text-xs font-medium text-slate-500 text-right bg-white border-b border-gray-100 border-r">Reserves (2P)</div>
                        {blocks.map(block => (
                            <div key={`res-${block.id}`} className="p-3 text-xs text-slate-700 bg-white border-b border-gray-100 border-r border-gray-200/50 flex items-center">
                                <span className="font-mono font-bold text-sm">{block.resources.oilReserves2P || block.resources.gasReserves2P || 0}</span>
                                <span className="text-[10px] text-slate-500 ml-1 uppercase">{block.resources.oilReserves2P ? 'MMbbl' : 'Bcf'}</span>
                            </div>
                        ))}

                        {/* Row 5: Risk */}
                        <div className="sticky left-0 z-10 p-3 text-xs font-medium text-slate-500 text-right bg-slate-50 border-b border-gray-100 border-r">Risk (Tech/Comm)</div>
                        {blocks.map(block => (
                            <div key={`risk-${block.id}`} className="p-3 text-xs bg-slate-50 border-b border-gray-100 border-r border-gray-200/50 flex items-center gap-3">
                                <div className="flex items-center gap-1.5" title="Technical Risk">
                                    <span className="text-[10px] text-slate-400">T:</span>
                                    <RiskDot value={block.risks.technical} />
                                </div>
                                <div className="flex items-center gap-1.5" title="Commercial Risk">
                                    <span className="text-[10px] text-slate-400">C:</span>
                                    <RiskDot value={block.risks.commercial} />
                                </div>
                            </div>
                        ))}

                        {/* Row 6: NPV */}
                        <div className="sticky left-0 z-10 p-3 text-xs font-medium text-slate-500 text-right bg-white border-r border-gray-100">NPV (Est)</div>
                        {blocks.map(block => (
                            <div key={`npv-${block.id}`} className="p-3 text-xs text-slate-900 bg-white border-r border-gray-200/50 flex items-center">
                                <span className="font-mono font-bold text-teal-700">${block.economics?.npv10 || 0}M</span>
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
