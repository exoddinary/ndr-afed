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
import { cn } from "@/lib/utils"

interface BlockComparatorStripProps {
    selectedBlocks: BlockCommercialData[]
    onRemoveBlock: (id: string) => void
    onAddBlock: (id: string) => void
    theme?: 'light' | 'dark'
}

export function BlockComparatorStrip({ selectedBlocks, onRemoveBlock, onAddBlock, theme = 'light' }: BlockComparatorStripProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [showAddMenu, setShowAddMenu] = useState(false)

    if (selectedBlocks.length === 0) return null

    // Use passed blocks directly
    const blocks = selectedBlocks
    const availableBlocks = Object.values(MOCK_BLOCKS).filter(b => !selectedBlocks.some(sb => sb.id === b.id))

    // Define the grid columns: Label column + 1 column per block + Add button column
    const gridTemplateColumns = `140px repeat(${blocks.length}, minmax(200px, 1fr)) 180px`

    return (
        <div className={cn(
            "flex-none border-t z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300",
            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        )}>
            {/* Header / Toggle */}
            <div
                className={cn(
                    "h-8 flex items-center justify-between px-4 border-b cursor-pointer transition-colors",
                    theme === 'dark' 
                        ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-300" 
                        : "bg-slate-50 border-gray-200 hover:bg-slate-100 text-slate-700"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <BarChart3 className={cn(
                        "w-4 h-4",
                        theme === 'dark' ? "text-blue-400" : "text-primary"
                    )} />
                    <span className="text-xs font-bold uppercase tracking-wider">
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
                        <div className={cn(
                            "sticky left-0 z-10 p-3 border-b border-r",
                            theme === 'dark' ? "bg-slate-900 border-slate-800 border-r-slate-800" : "bg-white border-gray-200 border-r-gray-100"
                        )}></div>
                        {blocks.map(block => (
                            <div key={`header-${block.id}`} className={cn(
                                "p-3 border-b border-r relative group",
                                theme === 'dark' ? "bg-slate-900 border-slate-800 border-r-slate-800" : "bg-white border-gray-200 border-r-gray-100"
                            )}>
                                <div className={cn(
                                    "font-bold text-sm truncate pr-6",
                                    theme === 'dark' ? "text-slate-200" : "text-slate-700"
                                )} title={block.name}>
                                    {block.name}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveBlock(block.id); }}
                                    className={cn(
                                        "absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all",
                                        theme === 'dark' ? "text-slate-500 hover:text-red-400 hover:bg-red-950/30" : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    )}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <div className={cn(
                            "p-3 border-b",
                            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
                        )}></div>

                        {/* --- Data Rows --- */}

                        {/* Row 1: Operator */}
                        <div className={cn(
                            "sticky left-0 z-10 p-3 text-xs font-medium text-right border-b border-r",
                            theme === 'dark' 
                                ? "bg-slate-800/30 text-slate-500 border-slate-800" 
                                : "bg-slate-50 text-slate-500 border-gray-100"
                        )}>Operator</div>
                        {blocks.map(block => (
                            <div key={`op-${block.id}`} className={cn(
                                "p-3 text-xs border-b border-r flex items-center",
                                theme === 'dark' 
                                    ? "bg-slate-800/30 text-slate-400 border-slate-800" 
                                    : "bg-slate-50 text-slate-700 border-gray-100"
                            )}>
                                {block.operator}
                            </div>
                        ))}
                        {/* Add Block Button (Spans all data rows) */}
                        <div className={cn(
                            "row-span-6 p-4 border-l flex items-center justify-center",
                            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
                        )}>
                            <Popover open={showAddMenu} onOpenChange={setShowAddMenu}>
                                <PopoverTrigger asChild>
                                    <button
                                        className={cn(
                                            "w-full h-full min-h-[120px] border-2 border-dashed rounded-md transition-all flex flex-col items-center justify-center gap-2",
                                            theme === 'dark'
                                                ? "border-slate-700 text-slate-500 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-900/10"
                                                : "border-slate-300 text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5"
                                        )}
                                    >
                                        <Plus className="w-6 h-6" />
                                        <span className="text-xs font-medium">Add Block</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className={cn(
                                    "w-64 p-0 border shadow-xl",
                                    theme === 'dark' ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-gray-200 text-slate-900"
                                )} align="start" side="top">
                                    <Command className={theme === 'dark' ? "bg-slate-900 text-slate-200" : "bg-white text-slate-900"}>
                                        <CommandInput
                                            placeholder="Search blocks..."
                                            className={cn(
                                                "h-9 border-b text-xs",
                                                theme === 'dark' ? "border-slate-800" : "border-gray-100"
                                            )}
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
                                                        className={cn(
                                                            "flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors",
                                                            theme === 'dark'
                                                                ? "hover:bg-slate-800 aria-selected:bg-slate-800"
                                                                : "hover:bg-primary/10 aria-selected:bg-primary/10"
                                                        )}
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className={cn(
                                                                "font-bold",
                                                                theme === 'dark' ? "text-slate-200" : "text-slate-700"
                                                            )}>{block.name}</div>
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
                        <div className={cn(
                            "sticky left-0 z-10 p-3 text-xs font-medium text-right border-b border-r",
                            theme === 'dark' 
                                ? "bg-slate-900 text-slate-500 border-slate-800" 
                                : "bg-white text-slate-500 border-gray-100"
                        )}>Status</div>
                        {blocks.map(block => (
                            <div key={`status-${block.id}`} className={cn(
                                "p-3 text-xs border-b border-r flex items-center",
                                theme === 'dark' 
                                    ? "bg-slate-900 border-slate-800" 
                                    : "bg-white border-gray-100"
                            )}>
                                <span className={cn(
                                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                    block.status === 'Production' 
                                        ? theme === 'dark' ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" : "bg-emerald-100 text-emerald-700 border-emerald-200"
                                        : block.status === 'Development' 
                                            ? theme === 'dark' ? "bg-blue-950/30 text-blue-400 border-blue-900/50" : "bg-blue-100 text-blue-700 border-blue-200"
                                            : theme === 'dark' ? "bg-amber-950/30 text-amber-400 border-amber-900/50" : "bg-amber-100 text-amber-700 border-amber-200"
                                )}>
                                    {block.status}
                                </span>
                            </div>
                        ))}

                        {/* Row 3: Fiscal */}
                        <div className={cn(
                            "sticky left-0 z-10 p-3 text-xs font-medium text-right border-b border-r",
                            theme === 'dark' 
                                ? "bg-slate-800/30 text-slate-500 border-slate-800" 
                                : "bg-slate-50 text-slate-500 border-gray-100"
                        )}>Fiscal (Govt/Tax)</div>
                        {blocks.map(block => (
                            <div key={`fiscal-${block.id}`} className={cn(
                                "p-3 text-xs border-b border-r flex items-center gap-1",
                                theme === 'dark' 
                                    ? "bg-slate-800/30 text-slate-400 border-slate-800" 
                                    : "bg-slate-50 text-slate-700 border-gray-100"
                            )}>
                                <span className="font-mono font-medium">{block.fiscalTerms.royaltyRate}%</span>
                                <span className="text-slate-500">/</span>
                                <span className="font-mono font-medium">{block.fiscalTerms.taxRate}%</span>
                            </div>
                        ))}

                        {/* Row 4: Reserves */}
                        <div className={cn(
                            "sticky left-0 z-10 p-3 text-xs font-medium text-right border-b border-r",
                            theme === 'dark' 
                                ? "bg-slate-900 text-slate-500 border-slate-800" 
                                : "bg-white text-slate-500 border-gray-100"
                        )}>Reserves (2P)</div>
                        {blocks.map(block => (
                            <div key={`res-${block.id}`} className={cn(
                                "p-3 text-xs border-b border-r flex items-center",
                                theme === 'dark' 
                                    ? "bg-slate-900 text-slate-400 border-slate-800" 
                                    : "bg-white text-slate-700 border-gray-100"
                            )}>
                                <span className={cn(
                                    "font-mono font-bold text-sm",
                                    theme === 'dark' ? "text-slate-200" : "text-slate-700"
                                )}>{block.resources.oilReserves2P || block.resources.gasReserves2P || 0}</span>
                                <span className="text-[10px] text-slate-500 ml-1 uppercase">{block.resources.oilReserves2P ? 'MMbbl' : 'Bcf'}</span>
                            </div>
                        ))}

                        {/* Row 5: Risk */}
                        <div className={cn(
                            "sticky left-0 z-10 p-3 text-xs font-medium text-right border-b border-r",
                            theme === 'dark' 
                                ? "bg-slate-800/30 text-slate-500 border-slate-800" 
                                : "bg-slate-50 text-slate-500 border-gray-100"
                        )}>Risk (Tech/Comm)</div>
                        {blocks.map(block => (
                            <div key={`risk-${block.id}`} className={cn(
                                "p-3 text-xs border-b border-r flex items-center gap-3",
                                theme === 'dark' 
                                    ? "bg-slate-800/30 border-slate-800" 
                                    : "bg-slate-50 border-gray-100"
                            )}>
                                <div className="flex items-center gap-1.5" title="Technical Risk">
                                    <span className="text-[10px] text-slate-500">T:</span>
                                    <RiskDot value={block.risks.technical} />
                                </div>
                                <div className="flex items-center gap-1.5" title="Commercial Risk">
                                    <span className="text-[10px] text-slate-500">C:</span>
                                    <RiskDot value={block.risks.commercial} />
                                </div>
                            </div>
                        ))}

                        {/* Row 6: NPV */}
                        <div className={cn(
                            "sticky left-0 z-10 p-3 text-xs font-medium text-right border-r",
                            theme === 'dark' 
                                ? "bg-slate-900 text-slate-500 border-slate-800" 
                                : "bg-white text-slate-500 border-gray-100"
                        )}>NPV (Est)</div>
                        {blocks.map(block => (
                            <div key={`npv-${block.id}`} className={cn(
                                "p-3 text-xs border-r flex items-center",
                                theme === 'dark' 
                                    ? "bg-slate-900 border-slate-800" 
                                    : "bg-white border-gray-100"
                            )}>
                                <span className={cn(
                                    "font-mono font-bold",
                                    theme === 'dark' ? "text-blue-400" : "text-primary/90"
                                )}>${block.economics?.npv10 || 0}M</span>
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
