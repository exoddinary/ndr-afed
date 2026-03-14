

"use client"

import ReactECharts from "echarts-for-react"
import { X, Database, GitCompare, ChevronRight, FileText, FileDown, Download, ExternalLink, Info, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

// Define types for different panel contexts
export type PanelContext = "polygon" | "play" | "basin" | "field" | "well" | "license" | "gng-project" | "seismic-2d" | "platform" | "pipeline" | null

export type ContextualData = {
    type: PanelContext
    data: Record<string, any>
}

type ContextualPanelProps = {
    isOpen: boolean
    context: ContextualData | null
    onClose: () => void
    onNavigate: (type: PanelContext, data: any) => void
    onAddToCompare?: (block: any) => void
    onToggle3D?: () => void
    onViewSubsurface?: (blockId: string) => void
    onViewGNGData?: () => void;
    theme?: 'light' | 'dark';
}

export function ContextualPanel({ isOpen, context, onClose, onNavigate, onAddToCompare, onToggle3D, onViewSubsurface, onViewGNGData, theme = 'light' }: ContextualPanelProps) {
    const [isAnimating, setIsAnimating] = useState(false)
    const [showSubsurfaceComingSoon, setShowSubsurfaceComingSoon] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true)
        }
    }, [isOpen])

    const handleClose = () => {
        setIsAnimating(false)
        setTimeout(onClose, 300) // Match animation duration
    }

    if (!context) return null

    return (
        <div
            className={cn(
                "relative h-full shadow-xl z-20 transition-all duration-300 ease-in-out border-l",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200",
                isOpen && isAnimating ? "w-[400px]" : "w-0"
            )}
        >
            <div className="w-[400px] h-full flex flex-col">
                {/* Header */}
                <div className={cn(
                    "h-8 flex-none flex items-center justify-between px-3 border-b",
                    theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200"
                )}>
                    <span className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        theme === 'dark' ? "text-slate-300" : "text-slate-500"
                    )}>
                        {context.type === "polygon" && "Block Investment Details"}
                        {context.type === "play" && "Play Analysis"}
                        {context.type === "basin" && "Basin Overview"}
                        {context.type === "field" && "Field Overview"}
                        {context.type === "well" && "Well Information"}
                        {context.type === "license" && "License Details"}
                        {context.type === "gng-project" && "G&G Project Information"}
                        {context.type === "seismic-2d" && "Seismic Line Information"}
                        {context.type === "platform" && "Platform Information"}
                        {context.type === "pipeline" && "Pipeline Information"}
                    </span>
                    <button
                        onClick={handleClose}
                        className={cn(
                            "p-1 rounded transition-colors",
                            theme === 'dark' ? "hover:bg-slate-700 text-slate-400" : "hover:bg-gray-200 text-slate-500"
                        )}
                        aria-label="Close panel"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className={cn(
                    "flex-1 overflow-y-auto p-3 space-y-6 min-h-0",
                    theme === 'dark' ? "bg-slate-900 text-slate-400" : "bg-white text-slate-600"
                )}>
                    {context.type === "polygon" && (
                        <BlockDetailsContent
                            data={context.data}
                            onAddToCompare={onAddToCompare}
                            onToggle3D={onToggle3D}
                            onViewSubsurface={onViewSubsurface}
                            onShowSubsurfaceComingSoon={() => setShowSubsurfaceComingSoon(true)}
                            theme={theme}
                        />
                    )}
                    {context.type === "play" && <PlayContent data={context.data} onNavigate={onNavigate} theme={theme} />}
                    {context.type === "basin" && <BasinContent data={context.data} onNavigate={onNavigate} theme={theme} />}
                    {context.type === "well" && <WellDetailsContent data={context.data} theme={theme} />}
                    {context.type === "field" && <FieldDetailsContent data={context.data} theme={theme} />}
                    {context.type === "license" && <LicenseDetailsContent data={context.data} theme={theme} />}
                    {context.type === "gng-project" && <GNGProjectContent data={context.data} onToggle3D={onToggle3D}                onViewGNGData={onViewGNGData}
 theme={theme} />}
                    {context.type === "seismic-2d" && <Seismic2DContent data={context.data} theme={theme} />}
                    {context.type === "platform" && <PlatformDetailsContent data={context.data} theme={theme} />}
                    {context.type === "pipeline" && <PipelineDetailsContent data={context.data} theme={theme} />}
                </div>

                {/* Panel footer - Powered by attribution */}
                <div className={cn(
                    "flex-none px-3 pb-3 pt-2 border-t",
                    theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
                )}>
                    <div className="w-full flex justify-end">
                        <div className={cn(
                            "text-[10px] px-2.5 py-1 rounded shadow-sm border",
                            theme === 'dark' 
                                ? "bg-slate-800 border-slate-700 text-slate-400" 
                                : "bg-white border-slate-200 text-slate-500"
                        )}>
                            <span className="font-normal">Powered by </span>
                            <span className={cn(
                                "font-semibold",
                                theme === 'dark' ? "text-slate-200" : "text-slate-800"
                            )}>AFED Digital Sdn. Bhd.</span>
                        </div>
                    </div>
                </div>
            </div>

            {showSubsurfaceComingSoon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-sm w-full mx-4 p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">VDR Paleoscan</div>
                                <h3 className="text-lg font-semibold text-slate-900">Upcoming Feature</h3>
                            </div>
                            <button
                                onClick={() => setShowSubsurfaceComingSoon(false)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            The VDR Paleoscan experience is currently under development and will be available in a future release.
                        </p>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setShowSubsurfaceComingSoon(false)}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Helper component for Seismic Viewer
function SeismicViewer() {
    return null;
}

import { MOCK_BLOCKS, type BlockCommercialData } from "@/data/investor-data"
import { Plus, Box, Phone, Mail, Building2, LayoutDashboard, Layers, DollarSign, Lock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, ReferenceLine } from "recharts"



// Locked Content component for non-premium users
function LockedContentPrompt({ tabName, theme = 'light' }: { tabName: string, theme?: 'light' | 'dark' }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                theme === 'dark' ? "bg-slate-800" : "bg-slate-100"
            )}>
                <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className={cn(
                "text-lg font-bold mb-2",
                theme === 'dark' ? "text-slate-200" : "text-slate-800"
            )}>
                {tabName} Data Locked
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs leading-relaxed">
                Access to {tabName.toLowerCase()} analysis requires a premium subscription. Subscribe through the ESDM portal to unlock all features.
            </p>
            <a
                href="https://www.esdm.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-yellow-600 transition-all"
            >
                Subscribe on ESDM Portal
                <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-[10px] text-slate-400 mt-4">
                Already subscribed? Try logging out and back in.
            </p>
        </div>
    )
}

// Block-specific content (formerly PolygonContent)
function BlockDetailsContent({
    data,
    onAddToCompare,
    onToggle3D,
    onViewSubsurface,
    onShowSubsurfaceComingSoon,
    theme = 'light'
}: {
    data: any,
    onAddToCompare?: (block: any) => void,
    onToggle3D?: () => void,
    onViewSubsurface?: (blockName: string) => void,
    onShowSubsurfaceComingSoon?: () => void,
    theme?: 'light' | 'dark'
}) {
    // Try to find mock data matching the clicked block name
    const blockName = data.name || "Q1"
    let blockData = Object.values(MOCK_BLOCKS).find(b => b.name === blockName)

    // If no direct match, pick one deterministically based on the name hash
    // This ensures "different" blocks show different (but consistent) mock data
    if (!blockData) {
        const mockValues = Object.values(MOCK_BLOCKS)
        let hash = 0
        for (let i = 0; i < blockName.length; i++) {
            hash = blockName.charCodeAt(i) + ((hash << 5) - hash)
        }
        const index = Math.abs(hash) % mockValues.length
        blockData = {
            ...mockValues[index],
            name: blockName, // Keep the real name from the map
            id: `mock-${Math.abs(hash)}` // unique-ish ID
        }
    }

    const [activeTab, setActiveTab] = useState<"overview" | "technical" | "commercial">("overview")
    const [isPremium, setIsPremium] = useState(true) // default to true, will check on mount

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = window.localStorage.getItem("afed_vdr_auth_token")
            setIsPremium(token === 'user1')
        }
    }, [])

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutDashboard, locked: false },
        { id: "technical", label: "Technical", icon: Layers, locked: !isPremium },
        { id: "commercial", label: "Commercial", icon: DollarSign, locked: !isPremium },
    ]

    return (
        <div className="flex flex-col h-full">
            {/* Fixed Header Section inside Content */}
            <div className="mb-6">
                {/* Action Buttons - Moved to Top */}
                <div className="flex justify-end gap-2 mb-3">
                    <button
                        onClick={() => onToggle3D?.()}
                        className={cn(
                            "p-2 rounded-sm border transition-colors",
                            theme === 'dark' 
                                ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" 
                                : "text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200"
                        )}
                        title="View Platform in 3D"
                    >
                        <Box className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onAddToCompare?.(blockData)}
                        className={cn(
                            "p-2 rounded-sm border transition-colors",
                            theme === 'dark' 
                                ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" 
                                : "text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200"
                        )}
                        title="Add to Compare"
                    >
                        <GitCompare className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onViewSubsurface?.(blockName)}
                        className={cn(
                            "p-2 rounded-sm border transition-colors flex items-center gap-2",
                            theme === 'dark' 
                                ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" 
                                : "text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200"
                        )}
                        title="3D Viewer"
                    >
                        <Layers className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">3D Viewer</span>
                    </button>
                    <button
                        onClick={() => onShowSubsurfaceComingSoon?.()}
                        className={cn(
                            "p-2 rounded-sm border transition-colors flex items-center gap-2",
                            theme === 'dark' 
                                ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" 
                                : "text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200"
                        )}
                        title="VDR Paleoscan"
                    >
                        <Database className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">VDR Paleoscan</span>
                    </button>
                </div>

                <div className="mb-4">
                    <h3 className={cn(
                        "text-xl font-bold leading-tight mb-2",
                        theme === 'dark' ? "text-slate-100" : "text-slate-700"
                    )}>{blockData.name}</h3>
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-sm",
                            blockData.status === 'Production' 
                                ? (theme === 'dark' ? "bg-green-950/30 text-green-400 border border-green-900/50" : "bg-green-100 text-green-700") 
                                : blockData.status === 'Active Exploration' 
                                    ? (theme === 'dark' ? "bg-amber-950/30 text-amber-400 border border-amber-900/50" : "bg-amber-100 text-amber-700") 
                                    : (theme === 'dark' ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-slate-100 text-slate-600")
                        )}>
                            {blockData.status}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Op: {blockData.operator}</span>
                    </div>
                </div>

                {/* Minimal Tabs - Custom Style */}
                <div className="flex items-center gap-1 pb-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex-1 justify-center py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-2 transition-all border",
                                activeTab === tab.id
                                    ? theme === 'dark'
                                        ? "bg-slate-700 border-blue-500 text-white shadow-sm"
                                        : "bg-white border-primary text-primary/90 shadow-sm"
                                    : theme === 'dark'
                                        ? "bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                                        : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            )}
                        >
                            {tab.locked ? (
                                <Lock className="w-3 h-3 text-slate-400" />
                            ) : (
                                <tab.icon className="w-3.5 h-3.5" />
                            )}
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className={cn("h-px w-full mt-2", theme === 'dark' ? "bg-slate-800" : "bg-gray-100")} />
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 pb-10 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                {/* --- OVERVIEW TAB --- */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        <div className={cn(
                            "p-4 rounded-sm text-sm italic border leading-relaxed",
                            theme === 'dark' 
                                ? "bg-slate-800/50 text-slate-300 border-slate-700" 
                                : "bg-slate-50 text-slate-600 border-slate-100"
                        )}>
                            "{blockData.description}"
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={cn(
                                "p-4 border rounded-sm shadow-sm",
                                theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                            )}>
                                <div className={cn(
                                    "text-[10px] font-bold uppercase mb-2 tracking-wider",
                                    theme === 'dark' ? "text-slate-500" : "text-slate-400"
                                )}>2P Reserves</div>
                                <div className={cn(
                                    "text-xl font-bold mb-1",
                                    theme === 'dark' ? "text-slate-200" : "text-slate-700"
                                )}>
                                    {blockData.resources.oilReserves2P || 0} <span className="text-sm font-medium text-slate-500">MMbbl</span>
                                </div>
                                <div className="text-xs text-slate-500 font-medium">
                                    {blockData.resources.gasReserves2P || 0} Bcf Gas
                                </div>
                            </div>
                            {blockData.economics && (
                                <div className={cn(
                                    "p-4 border rounded-sm shadow-sm",
                                    theme === 'dark' ? "bg-emerald-950/30 border-emerald-900/50" : "bg-emerald-50 border-emerald-100"
                                )}>
                                    <div className={cn(
                                        "text-[10px] font-bold uppercase mb-2 tracking-wider",
                                        theme === 'dark' ? "text-emerald-400" : "text-emerald-600"
                                    )}>Valuation (NPV10)</div>
                                    <div className={cn(
                                        "text-xl font-bold mb-1",
                                        theme === 'dark' ? "text-emerald-400" : "text-emerald-600"
                                    )}>${blockData.economics.npv10}M</div>
                                    <div className={cn(
                                        "text-xs font-medium",
                                        theme === 'dark' ? "text-emerald-500" : "text-emerald-600"
                                    )}>IRR: {blockData.economics.irr}%</div>
                                </div>
                            )}
                        </div>

                        {/* Risk Summary */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider",
                                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                )}>Risk Assessment</h4>
                                <div className="flex gap-3 text-[9px] text-slate-400">
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-green-500" /> Low</span>
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-amber-500" /> Med</span>
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-red-500" /> High</span>
                                </div>
                            </div>
                            <div className={cn(
                                "space-y-3 p-4 rounded-sm border",
                                theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
                            )}>
                                <RiskBar label="Technical" value={blockData.risks.technical} theme={theme} />
                                <RiskBar label="Commercial" value={blockData.risks.commercial} theme={theme} />
                                <RiskBar label="Political" value={blockData.risks.political} theme={theme} />
                                <RiskBar label="Regulatory" value={blockData.risks.regulatory} theme={theme} />
                            </div>
                        </div>

                        {/* Contact Card (Mini) */}
                        {blockData.contact && (
                            <div className={cn(
                                "p-3 rounded flex items-center justify-between border",
                                theme === 'dark' 
                                    ? "bg-slate-800 border-slate-700 text-slate-200" 
                                    : "bg-slate-100 border-slate-200 text-slate-800"
                            )}>
                                <div>
                                    <div className={cn(
                                        "text-[10px] uppercase mb-1",
                                        theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                    )}>Contact Point</div>
                                    <div className={cn(
                                        "text-sm font-bold",
                                        theme === 'dark' ? "text-slate-200" : "text-slate-800"
                                    )}>{blockData.contact.agency}</div>
                                    <div className={cn(
                                        "text-[10px]",
                                        theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                    )}>ndr@afed.com.my</div>
                                </div>
                                <Mail className={cn(
                                    "w-5 h-5",
                                    theme === 'dark' ? "text-blue-400" : "text-primary"
                                )} />
                            </div>
                        )}
                    </div>
                )}

                {/* --- TECHNICAL TAB --- */}
                {activeTab === "technical" && (
                    !isPremium ? (
                        <LockedContentPrompt tabName="Technical" theme={theme} />
                    ) : (
                        <div className="space-y-6">
                            {/* Resources Table */}
                            <div>
                                <h4 className={cn(
                                    "text-[10px] font-bold uppercase mb-3 tracking-wider",
                                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                )}>Resources & Reserves</h4>
                                <div className={cn(
                                    "border rounded overflow-hidden",
                                    theme === 'dark' ? "border-slate-700" : "border-slate-200"
                                )}>
                                    <table className="w-full text-xs">
                                        <thead className={cn(
                                            theme === 'dark' ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"
                                        )}>
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium">Category</th>
                                                <th className="px-3 py-2 text-right font-medium">Oil (MMbbl)</th>
                                                <th className="px-3 py-2 text-right font-medium">Gas (Bcf)</th>
                                            </tr>
                                        </thead>
                                        <tbody className={cn(
                                            "divide-y",
                                            theme === 'dark' ? "divide-slate-700 text-slate-300" : "divide-slate-100 text-slate-700"
                                        )}>
                                            {blockData.resources.oilReserves2P || blockData.resources.gasReserves2P ? (
                                                <tr>
                                                    <td className="px-3 py-2 font-medium">2P Reserves</td>
                                                    <td className="px-3 py-2 text-right font-mono">{blockData.resources.oilReserves2P || "-"}</td>
                                                    <td className="px-3 py-2 text-right font-mono">{blockData.resources.gasReserves2P || "-"}</td>
                                                </tr>
                                            ) : null}
                                            {blockData.resources.contingentOil || blockData.resources.contingentGas ? (
                                                <tr>
                                                    <td className="px-3 py-2 font-medium">2C Resources</td>
                                                    <td className="px-3 py-2 text-right font-mono">{blockData.resources.contingentOil || "-"}</td>
                                                    <td className="px-3 py-2 text-right font-mono">{blockData.resources.contingentGas || "-"}</td>
                                                </tr>
                                            ) : null}
                                            <tr>
                                                <td className="px-3 py-2 font-medium">Prospective (Mean)</td>
                                                <td className="px-3 py-2 text-right font-mono">{blockData.resources.prospectiveOilMean || "-"}</td>
                                                <td className="px-3 py-2 text-right font-mono">{blockData.resources.prospectiveGasMean || "-"}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Production Profile */}
                            {blockData.production && (
                                <div>
                                    <div className={cn("h-px mb-6", theme === 'dark' ? "bg-slate-800" : "bg-gray-100")} />
                                    <h4 className={cn(
                                        "text-[10px] font-bold uppercase mb-3 tracking-wider",
                                        theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                    )}>Production History</h4>
                                    <div className={cn(
                                        "h-[160px] w-full border rounded p-2",
                                        theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"
                                    )}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={blockData.production} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "#334155" : "#f1f5f9"} />
                                                <XAxis
                                                    dataKey="year"
                                                    axisLine={false}
                                                    tick={{ fontSize: 9, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                                                />
                                                <YAxis
                                                    yAxisId="left"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 9, fill: '#10b981' }}
                                                />
                                                <YAxis
                                                    yAxisId="right"
                                                    orientation="right"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 9, fill: '#f59e0b' }}
                                                />
                                                <Tooltip
                                                    contentStyle={{ 
                                                        borderRadius: '4px', 
                                                        fontSize: '10px',
                                                        backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                                                        border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                                                        color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                                                    }}
                                                    labelStyle={{ fontWeight: 'bold' }}
                                                />
                                                <Line yAxisId="left" type="monotone" dataKey="oilRate" stroke="#10b981" strokeWidth={2} dot={false} name="Oil (bopd)" />
                                                <Line yAxisId="right" type="monotone" dataKey="gasRate" stroke="#f59e0b" strokeWidth={2} dot={false} name="Gas (mmscfd)" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Infrastructure */}
                            <div>
                                <div className={cn("h-px mb-6", theme === 'dark' ? "bg-slate-800" : "bg-gray-100")} />
                                <h4 className={cn(
                                    "text-[10px] font-bold uppercase mb-3 tracking-wider",
                                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                )}>Infrastructure</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className={cn(
                                        "p-2 rounded border",
                                        theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
                                    )}>
                                        <span className="block text-slate-400 text-[10px] uppercase">Pipeline</span>
                                        <span className={cn(
                                            "font-mono font-medium",
                                            theme === 'dark' ? "text-slate-200" : "text-slate-700"
                                        )}>{blockData.infrastructure.nearestPipelineKm} km</span>
                                    </div>
                                    <div className={cn(
                                        "p-2 rounded border",
                                        theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
                                    )}>
                                        <span className="block text-slate-400 text-[10px] uppercase">Supply Base</span>
                                        <span className={cn(
                                            "font-mono font-medium",
                                            theme === 'dark' ? "text-slate-200" : "text-slate-700"
                                        )}>{blockData.infrastructure.nearestPortKm} km</span>
                                    </div>
                                </div>
                            </div>

                            {/* Subsurface Data Uncertainty - ECharts Tornado Chart */}
                            {(() => {
                                // Base Case P50 = 220.8 (Baseline: 191,831,485.26 but scaled/shifted for the chart center which is around 220)
                                const baseCase = 220
                                
                                // Proper tornado data ordered from bottom to top (ECharts y-axis order)
                                const tornadoData = [
                                    { variable: "1/Bo", low: 200, high: 235 },
                                    { variable: "NTG", low: 185, high: 245 },
                                    { variable: "So", low: 175, high: 250 },
                                    { variable: "POROSITY ( Φ )", low: 162, high: 265 },
                                    { variable: "GRV (bbl)", low: 145, high: 280 },
                                ]

                                const tornadoOptions = {
                                    backgroundColor: 'transparent',
                                    tooltip: {
                                        trigger: 'axis',
                                        axisPointer: { type: 'shadow' },
                                        formatter: function (params: any) {
                                            const low = params[0];
                                            const high = params[1];
                                            return `
                                                <div class="font-bold mb-1">${low.name}</div>
                                                <div>Input Low: <span class="font-mono text-[#a51130]">${(low.value + baseCase).toFixed(0)} Millions</span></div>
                                                <div>Input High: <span class="font-mono text-[#cb425e]">${(high.value + baseCase).toFixed(0)} Millions</span></div>
                                            `;
                                        }
                                    },
                                    grid: {
                                        left: '25%', // Space for labels
                                        right: '25%', // Space for legend
                                        bottom: '15%',
                                        top: '10%',
                                        containLabel: false
                                    },
                                    xAxis: {
                                        type: 'value',
                                        min: 120 - baseCase,
                                        max: 280 - baseCase,
                                        interval: 20,
                                        splitLine: {
                                            show: false // Hide vertical grid lines
                                        },
                                        axisLabel: {
                                            formatter: function(value: number) {
                                                return value + baseCase;
                                            },
                                            color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
                                            fontSize: 10,
                                            margin: 10,
                                            rotate: 0
                                        },
                                        axisLine: { 
                                            show: true,
                                            lineStyle: {
                                                color: '#1e3a8a', // dark blue axis line
                                                width: 2
                                            }
                                        },
                                        axisTick: { 
                                            show: true,
                                            length: 8,
                                            lineStyle: {
                                                color: '#1e3a8a',
                                                width: 2
                                            }
                                        }
                                    },
                                    yAxis: {
                                        type: 'category',
                                        data: tornadoData.map(d => d.variable),
                                        axisLine: { 
                                            show: true,
                                            lineStyle: {
                                                color: '#1e3a8a', // dark blue axis line
                                                width: 2
                                            }
                                        },
                                        axisTick: { show: false },
                                        axisLabel: {
                                            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                                            fontSize: 11,
                                            fontWeight: 'bold',
                                            margin: 15
                                        }
                                    },
                                    series: [
                                        {
                                            name: 'Input Low',
                                            type: 'bar',
                                            stack: 'Total',
                                            itemStyle: { 
                                                color: '#a51130', // dark red
                                                borderColor: '#0f172a',
                                                borderWidth: 1.5
                                            },
                                            barWidth: 24,
                                            data: tornadoData.map(d => d.low - baseCase)
                                        },
                                        {
                                            name: 'Input High',
                                            type: 'bar',
                                            stack: 'Total',
                                            itemStyle: { 
                                                color: '#cb425e', // lighter red/pink
                                                borderColor: '#0f172a',
                                                borderWidth: 1.5
                                            },
                                            barWidth: 24,
                                            data: tornadoData.map(d => d.high - baseCase)
                                        }
                                    ]
                                };

                                return (
                                    <div>
                                        <div className={cn("h-px mb-6", theme === 'dark' ? "bg-slate-800" : "bg-gray-100")} />
                                        
                                        {/* Title Header */}
                                        <div className="mb-4 text-center">
                                            <h4 className={cn(
                                                "text-[16px] font-bold mb-1",
                                                theme === 'dark' ? "text-slate-100" : "text-slate-900"
                                            )}>Static Tornado Uncertainties</h4>
                                            <div className={cn(
                                                "text-[14px] font-medium mb-1",
                                                theme === 'dark' ? "text-slate-200" : "text-slate-800"
                                            )}>STOIIP (bbl)</div>
                                            <p className={cn(
                                                "text-[11px] italic",
                                                theme === 'dark' ? "text-slate-400" : "text-slate-600"
                                            )}>Input Ranked by Effect on Output 50% Percentile</p>
                                        </div>

                                        {/* Tornado Chart Container */}
                                        <div className={cn(
                                            "pt-10 pb-0 relative",
                                        )}>
                                            {/* Base case center line */}
                                            <div className="absolute top-[35px] bottom-[50px] w-0 border-l-[1.5px] border-[#dc2626] z-20" 
                                                 style={{ 
                                                     left: `calc(25% + ${((baseCase - 120) / 160) * 50}%)`,
                                                 }} />
                                            
                                            {/* Baseline Label on Top */}
                                            <div className="absolute top-[5px] z-30 bg-slate-900 text-white px-2 py-1 text-[10px] font-bold rounded shadow-md border border-slate-700 whitespace-nowrap"
                                                 style={{ 
                                                     left: `calc(25% + ${((baseCase - 120) / 160) * 50}%)`,
                                                     transform: 'translateX(-50%)'
                                                 }}>
                                                Baseline: 191,831,485.26
                                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
                                            </div>

                                            {/* Custom Legend */}
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 mr-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-sm bg-[#a51130] border border-slate-900/50" />
                                                    <span className={cn("text-[10px] font-medium", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>Input Low</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-sm bg-[#cb425e] border border-slate-900/50" />
                                                    <span className={cn("text-[10px] font-medium", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>Input High</span>
                                                </div>
                                            </div>
                                                 
                                            <ReactECharts
                                                option={tornadoOptions}
                                                style={{ height: '350px', width: '100%' }}
                                                opts={{ renderer: 'svg' }}
                                            />
                                            
                                            <div className="text-center mt-[-15px] pb-6 border-t border-slate-100/50 pt-4">
                                                <div className={cn(
                                                    "text-[12px] font-bold tracking-tight",
                                                    theme === 'dark' ? "text-slate-200" : "text-slate-800"
                                                )}>
                                                    STOIIP (bbl)
                                                </div>
                                                <div className={cn(
                                                    "text-[10px] opacity-70",
                                                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                                )}>
                                                    Values in Millions
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Development Timeline */}
                            {blockData.developmentPlan && (
                                <div>
                                    <div className={cn("h-px mb-6", theme === 'dark' ? "bg-slate-800" : "bg-gray-100")} />
                                    <h4 className={cn(
                                        "text-[10px] font-bold uppercase mb-3 tracking-wider",
                                        theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                    )}>Timeline</h4>
                                    <div className={cn(
                                        "relative border-l ml-1.5 py-1 space-y-4",
                                        theme === 'dark' ? "border-slate-700" : "border-slate-200"
                                    )}>
                                        {blockData.developmentPlan.milestones.map((m, i) => (
                                            <div key={i} className="relative pl-4">
                                                <div className={cn(
                                                    "absolute left-[-4px] top-1.5 w-2 h-2 rounded-full border ring-2",
                                                    theme === 'dark' ? "border-slate-900 ring-slate-900" : "border-white ring-white",
                                                    m.status === 'completed' ? 'bg-green-500' :
                                                    m.status === 'planned' ? 'bg-blue-500' : 'bg-amber-500'
                                                )} />
                                                <div className="flex flex-col">
                                                    <div className="flex items-center justify-between">
                                                        <span className={cn(
                                                            "text-xs font-bold",
                                                            theme === 'dark' ? "text-slate-200" : "text-slate-800"
                                                        )}>{m.year}</span>
                                                        <span className={cn(
                                                            "text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wide",
                                                            m.status === 'completed' 
                                                                ? (theme === 'dark' ? "bg-green-950/30 text-green-400 border border-green-900/50" : "bg-green-50 text-green-700") 
                                                                : m.status === 'planned' 
                                                                    ? (theme === 'dark' ? "bg-blue-950/30 text-blue-400 border border-blue-900/50" : "bg-blue-50 text-blue-700") 
                                                                    : (theme === 'dark' ? "bg-amber-950/30 text-amber-400 border border-amber-900/50" : "bg-amber-50 text-amber-700")
                                                        )}>{m.status}</span>
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs mt-0.5",
                                                        theme === 'dark' ? "text-slate-400" : "text-slate-600"
                                                    )}>{m.event}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                )}


                {/* --- COMMERCIAL TAB --- */}
                {activeTab === "commercial" && (
                    !isPremium ? (
                        <LockedContentPrompt tabName="Commercial" />
                    ) : (
                        <div className="space-y-6">
                            {blockData.economics && (
                                <div>
                                    <h4 className={cn(
                                        "text-[10px] font-bold uppercase mb-3 tracking-wider",
                                        theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                    )}>Economics & Valuation</h4>
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className={cn(
                                            "p-2 rounded border text-center",
                                            theme === 'dark' 
                                                ? "bg-emerald-900/20 border-emerald-800/30" 
                                                : "bg-emerald-50 border-emerald-100"
                                        )}>
                                            <div className={cn(
                                                "text-[10px] uppercase",
                                                theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                            )}>NPV (10%)</div>
                                            <div className={cn(
                                                "text-sm font-bold",
                                                theme === 'dark' ? "text-emerald-400" : "text-emerald-700"
                                            )}>${blockData.economics.npv10}M</div>
                                        </div>
                                        <div className={cn(
                                            "p-2 rounded border text-center",
                                            theme === 'dark' 
                                                ? "bg-emerald-900/20 border-emerald-800/30" 
                                                : "bg-emerald-50 border-emerald-100"
                                        )}>
                                            <div className={cn(
                                                "text-[10px] uppercase",
                                                theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                            )}>IRR</div>
                                            <div className={cn(
                                                "text-sm font-bold",
                                                theme === 'dark' ? "text-emerald-400" : "text-emerald-700"
                                            )}>{blockData.economics.irr}%</div>
                                        </div>
                                        <div className={cn(
                                            "p-2 rounded border text-center",
                                            theme === 'dark' 
                                                ? "bg-slate-800 border-slate-700" 
                                                : "bg-slate-50 border-slate-100"
                                        )}>
                                            <div className={cn(
                                                "text-[10px] uppercase",
                                                theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                            )}>Break Even</div>
                                            <div className={cn(
                                                "text-sm font-bold",
                                                theme === 'dark' ? "text-slate-300" : "text-slate-700"
                                            )}>${blockData.economics.breakEvenPrice}</div>
                                        </div>
                                    </div>
                                    {/* Price Sensitivity Chart */}
                                    <div className={cn(
                                        "h-[140px] w-full border rounded p-2",
                                        theme === 'dark' 
                                            ? "bg-slate-900 border-slate-700" 
                                            : "bg-white border-slate-100"
                                    )}>
                                        <div className={cn(
                                            "text-[10px] mb-1 text-center",
                                            theme === 'dark' ? "text-slate-500" : "text-slate-400"
                                        )}>NPV Sensitivity to Oil Price</div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={blockData.economics.priceScenarios}
                                                margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                                                barCategoryGap="20%"
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="price"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 9, fill: "#64748b" }}
                                                    tickFormatter={(val) => `$${val}`}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 9, fill: "#64748b" }}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: "#f8fafc" }}
                                                    contentStyle={{
                                                        borderRadius: "4px",
                                                        fontSize: "10px",
                                                        border: "none",
                                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                                    }}
                                                />
                                                <Bar dataKey="npv" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            <div className={cn(
                                "h-px", 
                                theme === 'dark' ? "bg-slate-800" : "bg-gray-100"
                            )} />

                            {/* Fiscal Terms Extended */}
                            <div>
                                <h4 className={cn(
                                    "text-[10px] font-bold uppercase mb-3 tracking-wider",
                                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                )}>Fiscal Terms ({blockData.fiscalTerms.pscType})</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={cn(
                                        "p-2 rounded border text-center",
                                        theme === 'dark' 
                                            ? "bg-slate-800 border-slate-700" 
                                            : "bg-slate-50 border-slate-100"
                                    )}>
                                        <div className={cn(
                                            "text-[10px] uppercase",
                                            theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                        )}>Royalty Rate</div>
                                        <div className={cn(
                                            "text-lg font-bold",
                                            theme === 'dark' ? "text-blue-400" : "text-primary"
                                        )}>{blockData.fiscalTerms.royaltyRate}%</div>
                                    </div>
                                    <div className={cn(
                                        "p-2 rounded border text-center",
                                        theme === 'dark' 
                                            ? "bg-slate-800 border-slate-700" 
                                            : "bg-slate-50 border-slate-100"
                                    )}>
                                        <div className={cn(
                                            "text-[10px] uppercase",
                                            theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                        )}>Tax Rate</div>
                                        <div className={cn(
                                            "text-lg font-bold",
                                            theme === 'dark' ? "text-slate-300" : "text-slate-700"
                                        )}>{blockData.fiscalTerms.taxRate}%</div>
                                    </div>
                                    {blockData.fiscalTerms.costRecoveryCap && (
                                        <div className={cn(
                                            "p-2 rounded border text-center",
                                            theme === 'dark' 
                                                ? "bg-slate-800 border-slate-700" 
                                                : "bg-slate-50 border-slate-100"
                                        )}>
                                            <div className={cn(
                                                "text-[10px] uppercase",
                                                theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                            )}>Cost Rec. Cap</div>
                                            <div className={cn(
                                                "text-sm font-bold",
                                                theme === 'dark' ? "text-slate-300" : "text-slate-700"
                                            )}>{blockData.fiscalTerms.costRecoveryCap}%</div>
                                        </div>
                                    )}
                                    <div className={cn(
                                        "p-2 rounded border text-center",
                                        theme === 'dark' 
                                            ? "bg-slate-800 border-slate-700" 
                                            : "bg-slate-50 border-slate-100"
                                    )}>
                                        <div className={cn(
                                            "text-[10px] uppercase",
                                            theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                        )}>DMO</div>
                                        <div className={cn(
                                            "text-sm font-bold",
                                            theme === 'dark' ? "text-slate-300" : "text-slate-700"
                                        )}>{blockData.fiscalTerms.domesticMarketObligation}%</div>
                                    </div>
                                    {blockData.fiscalTerms.signatureBonus && (
                                        <div className={cn(
                                            "col-span-2 p-2 rounded border flex justify-between items-center px-3",
                                            theme === 'dark' 
                                                ? "bg-blue-900/20 border-blue-800/30" 
                                                : "bg-blue-50 border-blue-100"
                                        )}>
                                            <div className={cn(
                                                "text-[10px] uppercase font-medium",
                                                theme === 'dark' ? "text-slate-400" : "text-slate-600"
                                            )}>Signature Bonus</div>
                                            <div className={cn(
                                                "text-sm font-bold",
                                                theme === 'dark' ? "text-blue-400" : "text-blue-700"
                                            )}>${blockData.fiscalTerms.signatureBonus}M</div>
                                        </div>
                                    )}
                                    {blockData.fiscalTerms.localContentObligation && (
                                        <div className={cn(
                                            "col-span-2 p-2 rounded border flex justify-between items-center px-3",
                                            theme === 'dark' 
                                                ? "bg-slate-800 border-slate-700" 
                                                : "bg-slate-50 border-slate-100"
                                        )}>
                                            <div className={cn(
                                                "text-[10px] uppercase",
                                                theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                            )}>Local Content (TKDN)</div>
                                            <div className={cn(
                                                "text-sm font-bold",
                                                theme === 'dark' ? "text-slate-300" : "text-slate-700"
                                            )}>Min {blockData.fiscalTerms.localContentObligation}%</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

function RiskBar({ label, value, theme = 'light' }: { label: string, value: number, theme?: 'light' | 'dark' }) {
    // value 1-10
    const color = value <= 3 ? "bg-green-500" : value <= 6 ? "bg-amber-500" : "bg-red-500"
    return (
        <div className="flex items-center justify-between text-xs">
            <span className={cn(
                "font-medium w-24",
                theme === 'dark' ? "text-slate-400" : "text-slate-600"
            )}>{label}</span>
            <div className="flex gap-0.5 flex-1 max-w-[180px]">
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-2 flex-1 rounded-[1px]",
                            i < value ? color : (theme === 'dark' ? "bg-slate-700" : "bg-slate-100")
                        )}
                    />
                ))}
            </div>
            <span className="w-6 text-right font-mono text-slate-400">{value}</span>
        </div>
    )
}

// Play-specific content
function PlayContent({ data, onNavigate, theme = 'light' }: { data: any, onNavigate: (type: PanelContext, data: any) => void, theme?: 'light' | 'dark' }) {
    const samplePolygon = {
        name: "Prospect Alpha-12",
        facies: "Turbidite Sandstone",
        sand: "72%",
        interpreter: "Dr. Sarah Chen",
        evidence: "3D Seismic + 2 Wells",
        qc: "Peer-reviewed ",
    }
    const attributes = [
        { label: "Reservoir Type", value: data.reservoir || "Turbidite Channel", icon: "" },
        { label: "Maturity", value: data.maturity || "Emerging Play", icon: "" },
        { label: "Depositional Model", value: data.depositional || "Deep-water Fan", icon: "" },
        { label: "Trap Style", value: data.trap || "Stratigraphic", icon: "" },
        { label: "Play Success %", value: data.success || "42%", icon: "" },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className={cn(
                    "text-sm font-bold",
                    theme === 'dark' ? "text-slate-100" : "text-slate-900"
                )}>{data.name || "Miocene Turbidite Play"}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-500">Prospects: 18</span>
                    <span className={cn("w-px h-3", theme === 'dark' ? "bg-slate-700" : "bg-gray-300")} />
                    <span className="text-[10px] font-mono text-slate-500">Status: Active</span>
                </div>
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-gray-200")} />

            {/* Play Attributes - Grid */}
            <div>
                <h4 className={cn(
                    "text-[10px] font-bold uppercase mb-3",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>Play Elements</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div className="text-slate-500">Reservoir</div>
                    <div className={cn(
                        "font-mono text-right",
                        theme === 'dark' ? "text-slate-300" : "text-slate-700"
                    )}>{data.reservoir || "Turbidite Channel"}</div>

                    <div className="text-slate-500">Maturity</div>
                    <div className={cn(
                        "font-mono text-right",
                        theme === 'dark' ? "text-slate-300" : "text-slate-700"
                    )}>{data.maturity || "Emerging"}</div>

                    <div className="text-slate-500">Trap Style</div>
                    <div className={cn(
                        "font-mono text-right",
                        theme === 'dark' ? "text-slate-300" : "text-slate-700"
                    )}>{data.trap || "Stratigraphic"}</div>

                    <div className="text-slate-500">Success Rate</div>
                    <div className={cn(
                        "font-mono text-right",
                        theme === 'dark' ? "text-slate-300" : "text-slate-700"
                    )}>{data.success || "42%"}</div>
                </div>
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-gray-200")} />

            {/* Volumetrics - Compact */}
            <div>
                <h4 className={cn(
                    "text-[10px] font-bold uppercase mb-3",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>Volumetrics</h4>
                <div className="space-y-2">
                    <div className={cn(
                        "flex justify-between items-center p-2 rounded border",
                        theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
                    )}>
                        <span className="text-xs text-slate-500">P50 Resources</span>
                        <span className={cn(
                            "font-mono font-bold",
                            theme === 'dark' ? "text-slate-200" : "text-slate-900"
                        )}>3.2 Bboe</span>
                    </div>
                    <div className={cn(
                        "flex justify-between items-center p-2 rounded border",
                        theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
                    )}>
                        <span className="text-xs text-slate-500">Mean EMV</span>
                        <span className={cn(
                            "font-mono font-bold",
                            theme === 'dark' ? "text-slate-200" : "text-slate-900"
                        )}>$1.8B</span>
                    </div>
                </div>
            </div>

            {/* Risks - List */}
            <div>
                <h4 className={cn(
                    "text-[10px] font-bold uppercase mb-2",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>Key Risks</h4>
                <ul className="space-y-1">
                    {["Reservoir quality uncertainty", "Charge timing constraints", "Limited well control"].map((risk, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="w-1 h-1 rounded-full bg-amber-500" />
                            {risk}
                        </li>
                    ))}
                </ul>
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-gray-200")} />

            {/* Top Prospects Navigation - List */}
            <div>
                <h4 className={cn(
                    "text-[10px] font-bold uppercase mb-3",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>Top Prospects</h4>
                <div className="space-y-1">
                    <div
                        onClick={() => onNavigate("polygon", samplePolygon)}
                        className={cn(
                            "flex items-center justify-between p-2 rounded cursor-pointer transition-colors group border",
                            theme === 'dark' 
                                ? "bg-slate-800/30 border-transparent hover:bg-slate-800 hover:border-slate-700" 
                                : "hover:bg-slate-50 border-transparent hover:border-slate-200"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-sm" />
                            <span className={cn(
                                "text-xs font-medium transition-colors",
                                theme === 'dark' ? "text-slate-300 group-hover:text-slate-100" : "text-slate-700 group-hover:text-slate-900"
                            )}>Alpha-12</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-500">2.4 km³</span>
                            <ChevronRight className={cn(
                                "w-3 h-3 transition-colors",
                                theme === 'dark' ? "text-slate-600 group-hover:text-slate-400" : "text-slate-300 group-hover:text-slate-500"
                            )} />
                        </div>
                    </div>
                </div>
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-gray-200")} />

            {/* Seismic Viewer */}
            <SeismicViewer />
        </div>
    )
}

// Basin-specific content
function BasinContent({ data, onNavigate, theme = 'light' }: { data: any, onNavigate: (type: PanelContext, data: any) => void, theme?: 'light' | 'dark' }) {
    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div>
                <h3 className={cn(
                    "text-sm font-bold",
                    theme === 'dark' ? "text-slate-100" : "text-slate-900"
                )}>{data.name || "Offshore Basin A"}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-500">Area: 125,000 km²</span>
                    <span className={cn("w-px h-3", theme === 'dark' ? "bg-slate-700" : "bg-gray-300")} />
                    <span className="text-[10px] text-slate-500">Passive Margin</span>
                </div>
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-gray-200")} />

            {/* Basin Attributes */}
            <div>
                <h4 className={cn(
                    "text-[10px] font-bold uppercase mb-3 tracking-wider",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>Basin Attributes</h4>
                <dl className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                        <dt className="text-slate-500">Basin Type</dt>
                        <dd className={cn(
                            "font-mono font-medium",
                            theme === 'dark' ? "text-slate-200" : "text-slate-900"
                        )}>Passive Margin</dd>
                    </div>
                    <div className="flex justify-between items-center">
                        <dt className="text-slate-500">Setting</dt>
                        <dd className={cn(
                            "font-mono font-medium",
                            theme === 'dark' ? "text-slate-200" : "text-slate-900"
                        )}>Offshore (Deep)</dd>
                    </div>
                    <div className="flex justify-between items-center">
                        <dt className="text-slate-500">Tech Success Rate</dt>
                        <dd className="font-mono font-bold text-primary">42%</dd>
                    </div>
                    <div className="flex justify-between items-center">
                        <dt className="text-slate-500">Comm. Success Rate</dt>
                        <dd className="font-mono font-bold text-amber-600">18%</dd>
                    </div>
                </dl>
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-gray-200")} />

            {/* Basin Metrics - Technical List */}
            <div>
                <h4 className={cn(
                    "text-[10px] font-bold uppercase mb-3 tracking-wider",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>Basin Statistics</h4>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Total Discovered</span>
                        <div className="text-right">
                            <div className={cn(
                                "font-mono font-bold",
                                theme === 'dark' ? "text-slate-200" : "text-slate-900"
                            )}>18.4 Bboe</div>
                            <div className="text-[10px] text-green-600">+12% YoY</div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Yet-to-Find (Mean)</span>
                        <div className="text-right">
                            <div className={cn(
                                "font-mono font-bold",
                                theme === 'dark' ? "text-slate-200" : "text-slate-900"
                            )}>22.1 Bboe</div>
                            <div className="text-[10px] text-slate-500">High Potential</div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Wells Drilled</span>
                        <div className="text-right">
                            <div className={cn(
                                "font-mono font-bold",
                                theme === 'dark' ? "text-slate-200" : "text-slate-900"
                            )}>247</div>
                            <div className="text-[10px] text-slate-500">43 Exploratory</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-gray-200")} />

            {/* Key Companies */}
            <div>
                <h4 className={cn(
                    "text-[10px] font-bold uppercase mb-3 tracking-wider",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>Key Players</h4>
                <div className="flex flex-wrap gap-2">
                    {["TotalEnergies", "Shell", "Eni", "Pertamina", "ExxonMobil"].map(company => (
                        <span key={company} className={cn(
                            "px-2 py-1 border rounded text-[10px] font-medium transition-colors",
                            theme === 'dark' 
                                ? "bg-slate-800 border-slate-700 text-slate-300" 
                                : "bg-slate-50 border-slate-200 text-slate-600"
                        )}>
                            {company}
                        </span>
                    ))}
                </div>
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-gray-200")} />

            {/* Risks - Table style */}
            <div>
                <h4 className={cn(
                    "text-[10px] font-bold uppercase mb-3 tracking-wider",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>Regional Risks</h4>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Water Depth</span>
                        <span className="font-mono text-amber-600">Medium</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Political Stability</span>
                        <span className="font-mono text-green-600">Low Risk</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Infrastructure</span>
                        <span className="font-mono text-red-600">High Risk</span>
                    </div>
                </div>
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-gray-200")} />
        </div>
    )
}

// Well-specific content
// Reusable Attribute Table Component
function AttributeTable({ items, theme = 'light' }: { items: { label: string; value: any }[], theme?: 'light' | 'dark' }) {
    return (
        <div className={cn(
            "border rounded-lg overflow-hidden shadow-sm transition-colors",
            theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        )}>
            {items.map((item, idx) => (
                <div
                    key={idx}
                    className={cn(
                        "flex flex-col sm:flex-row sm:items-center text-xs py-3 px-4 border-b last:border-0 transition-colors",
                        theme === 'dark' 
                            ? "border-slate-700 hover:bg-slate-700/50" 
                            : "border-slate-100 hover:bg-slate-50 bg-white"
                    )}
                >
                    <span className={cn(
                        "w-full sm:w-1/3 flex-none text-[10px] uppercase tracking-wider mb-1 sm:mb-0",
                        theme === 'dark' ? "text-slate-400" : "text-slate-500"
                    )}>{item.label}</span>
                    <span className={cn(
                        "flex-1 text-xs break-words whitespace-normal font-medium",
                        theme === 'dark' ? "text-slate-200" : "text-slate-700"
                    )}>
                        {String(item.value || "-").startsWith('http') ? (
                            <a 
                                href={String(item.value)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={cn(
                                    "underline underline-offset-4 decoration-dotted transition-colors hover:opacity-80",
                                    theme === 'dark' ? "text-blue-400 decoration-blue-400/40" : "text-blue-600 decoration-blue-600/40"
                                )}
                            >
                                {String(item.value)}
                            </a>
                        ) : (
                            String(item.value || "-")
                        )}
                    </span>
                </div>
            ))}
        </div>
    )
}

// Expandable Attribute Table for F03 Project - makes NO OF WELLS, REPORTS, HORIZONS expandable
function ExpandableAttributeTable({ 
    items, 
    theme = 'light', 
    expandedSections,
    onToggleSection 
}: { 
    items: { label: string; value: any }[], 
    theme?: 'light' | 'dark',
    expandedSections: Record<string, boolean>,
    onToggleSection: (section: string) => void
}) {
    // Define which labels are expandable
    const expandableLabels = ['No. of Wells', 'No. of Reports', 'NO_OF_WELLS', 'NO_OF_REPORTS']
    
    // Links data for each section
    const sectionData: Record<string, {name: string, url: string}[]> = {
        'wells': [
            { name: "F03 Well Completion Report.pdf", url: "https://www.nlog.nl/brh-web/rest/brh/document/276073141" },
            { name: "F06 Composite Log.pdf", url: "https://www.nlog.nl/brh-web/rest/brh/document/673402306" },
            { name: "F03 Deviation report.pdf", url: "https://www.nlog.nl/brh-web/rest/brh/document/650523475" },
            { name: "F03 Geological Well report.pdf", url: "https://www.nlog.nl/brh-web/rest/brh/document/643842200" }
        ],
        'reports': [
            { name: "F03 Interpretation Report.pdf", url: "https://www.nlog.nl/field-web/rest/field/document/266908169" },
            { name: "F03 Stratigraphy Report.pdf", url: "https://www.nlog.nl/field-web/rest/field/document/2176423597" },
            { name: "F03 Summary.pdf", url: "https://dgbes.com/images/PDF/stratigrahic_surfaces_london2007.pdf" }
        ]
    }
    
    // Map label to section key
    const getSectionKey = (label: string): string | null => {
        const lowerLabel = label.toLowerCase()
        if (lowerLabel.includes('well')) return 'wells'
        if (lowerLabel.includes('report')) return 'reports'
        return null
    }
    
    // Get icon color for section
    const getSectionColor = (section: string) => {
        switch(section) {
            case 'wells': return theme === 'dark' ? "text-blue-400" : "text-blue-600"
            case 'reports': return theme === 'dark' ? "text-green-400" : "text-green-600"
            default: return theme === 'dark' ? "text-slate-400" : "text-slate-500"
        }
    }
    
    return (
        <div className={cn(
            "border rounded-lg overflow-hidden shadow-sm transition-colors",
            theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        )}>
            {items.map((item, idx) => {
                const sectionKey = getSectionKey(item.label)
                const isExpandable = sectionKey !== null
                
                return (
                    <div key={idx} className={cn(
                        "border-b last:border-0 transition-colors",
                        theme === 'dark' ? "border-slate-700" : "border-slate-100"
                    )}>
                        {/* Main Row */}
                        <div
                            className={cn(
                                "flex flex-col sm:flex-row sm:items-center text-xs py-3 px-4 transition-colors",
                                isExpandable 
                                    ? theme === 'dark' 
                                        ? "hover:bg-slate-700/50 cursor-pointer" 
                                        : "hover:bg-slate-50 cursor-pointer bg-white"
                                    : theme === 'dark' 
                                        ? "hover:bg-slate-700/50" 
                                        : "hover:bg-slate-50 bg-white"
                            )}
                            onClick={() => isExpandable && onToggleSection(sectionKey)}
                        >
                            <span className={cn(
                                "w-full sm:w-1/3 flex-none text-[10px] uppercase tracking-wider mb-1 sm:mb-0 flex items-center gap-2",
                                theme === 'dark' ? "text-slate-400" : "text-slate-500"
                            )}>
                                {isExpandable && (
                                    <ChevronDown className={cn(
                                        "w-3 h-3 transition-transform",
                                        expandedSections[sectionKey] ? "rotate-180" : "",
                                        getSectionColor(sectionKey)
                                    )} />
                                )}
                                {item.label}
                            </span>
                            <div className="flex-1 flex items-center justify-between">
                                <span className={cn(
                                    "text-xs break-words whitespace-normal font-medium",
                                    theme === 'dark' ? "text-slate-200" : "text-slate-700"
                                )}>
                                    {String(item.value || "-").startsWith('http') ? (
                                        <a 
                                            href={String(item.value)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className={cn(
                                                "underline underline-offset-4 decoration-dotted transition-colors hover:opacity-80",
                                                theme === 'dark' ? "text-blue-400 decoration-blue-400/40" : "text-blue-600 decoration-blue-600/40"
                                            )}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {String(item.value)}
                                        </a>
                                    ) : (
                                        String(item.value || "-")
                                    )}
                                </span>
                                {isExpandable && (
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded ml-2",
                                        sectionKey === 'wells' 
                                            ? theme === 'dark' ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"
                                            : sectionKey === 'reports'
                                                ? theme === 'dark' ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                                                : theme === 'dark' ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {sectionData[sectionKey]?.length || 0} links
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Expandable Content */}
                        {isExpandable && expandedSections[sectionKey] && (
                            <div className={cn(
                                "px-4 pb-3 space-y-1 border-t",
                                theme === 'dark' ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"
                            )}>
                                {sectionData[sectionKey]?.map((link, linkIdx) => (
                                    <a 
                                        key={linkIdx}
                                        href={link.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className={cn(
                                            "flex items-center justify-between p-2 rounded transition-colors group",
                                            theme === 'dark' ? "hover:bg-slate-700/50" : "hover:bg-white"
                                        )}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span className={cn(
                                            "text-xs underline underline-offset-2 decoration-dotted",
                                            theme === 'dark' ? "text-slate-300" : "text-slate-700"
                                        )}>{link.name}</span>
                                        <ExternalLink className={cn(
                                            "w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity",
                                            getSectionColor(sectionKey)
                                        )} />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// Documents & Reports Section
function DocumentsSection({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
    const docs = [
        { name: "Completion & Workover Report", type: "PDF", size: "1.0 MB", url: "/pdf/DURI05720 COMPLETION & WORKOVER PROG REPORT.pdf" },
        { name: "Downhole Well Log Report", type: "PDF", size: "1.1 MB", url: "/pdf/PDD-M01-156-Downhole Well Log Report.pdf" },
    ]

    return (
        <div className="space-y-4">
            <h4 className={cn(
                "text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                theme === 'dark' ? "text-slate-400" : "text-slate-500"
            )}>
                <FileText className="w-3 h-3" />
                Documents & Reports
            </h4>
            <div className="space-y-2">
                {docs.map((doc, idx) => (
                    <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            "flex items-center justify-between p-3 border rounded-lg transition-all group relative overflow-hidden",
                            theme === 'dark' 
                                ? "bg-slate-800 border-slate-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10" 
                                : "bg-white border-slate-200 hover:border-primary hover:shadow-md"
                        )}
                    >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 transform -translate-x-1 group-hover:translate-x-0 transition-transform" />
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2 rounded-lg transition-colors",
                                theme === 'dark' ? "bg-slate-700 group-hover:bg-red-500/20" : "bg-slate-50 group-hover:bg-red-50"
                            )}>
                                <FileText className={cn(
                                    "w-5 h-5",
                                    theme === 'dark' ? "text-red-400" : "text-red-500"
                                )} />
                            </div>
                            <div>
                                <div className={cn(
                                    "text-sm font-bold transition-colors truncate max-w-[200px]",
                                    theme === 'dark' ? "text-slate-200 group-hover:text-blue-400" : "text-slate-800 group-hover:text-primary"
                                )}>{doc.name}</div>
                                <div className={cn(
                                    "text-[10px] font-bold uppercase",
                                    theme === 'dark' ? "text-slate-500" : "text-slate-500"
                                )}>{doc.type} • {doc.size}</div>
                            </div>
                        </div>
                        <FileDown className={cn(
                            "w-4 h-4 transition-colors",
                            theme === 'dark' ? "text-slate-600 group-hover:text-blue-400" : "text-slate-300 group-hover:text-primary"
                        )} />
                    </a>
                ))}
            </div>
        </div>
    )
}

// Well-specific content with tabs for Well Info and G&G Project Data
function WellDetailsContent({ data, theme = 'light' }: { data: any, theme?: 'light' | 'dark' }) {
    const [activeTab, setActiveTab] = useState<"well-info" | "gng-data">("well-info")
    const [gngProjects, setGngProjects] = useState<any[]>([])
    const [intersectingProjects, setIntersectingProjects] = useState<any[]>([])
    const [hasGngIntersection, setHasGngIntersection] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)

    // Case-insensitive attribute getter
    const getAttr = (key: string) => {
        if (!data) return "-";
        const actualKey = Object.keys(data).find(k => k.toLowerCase() === key.toLowerCase());
        if (actualKey && data[actualKey] !== undefined && data[actualKey] !== null && String(data[actualKey]).trim() !== "") {
            return String(data[actualKey]);
        }
        return "-";
    };

    // Reset state immediately when well data changes, then check intersection
    useEffect(() => {
        if (data) {
            // Reset state immediately for new well
            setActiveTab("well-info")
            setGngProjects([])
            setIntersectingProjects([])
            setHasGngIntersection(false)
        }
    }, [data?.IDENTIFICA])

    // Check intersection asynchronously after reset
    useEffect(() => {
        if (data) {
            checkGngIntersection()
        }
    }, [data])

    // Fetch G&G projects when tab is selected
    useEffect(() => {
        if (activeTab === "gng-data" && data && hasGngIntersection) {
            fetchGngProjects()
        }
    }, [activeTab, data, hasGngIntersection])

    // Simple point-in-polygon check using ray casting algorithm
    // ring format: [[x1,y1], [x2,y2], ...]
    const pointInRing = (point: [number, number], ring: number[][]): boolean => {
        const [x, y] = point;
        let inside = false;
        
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];
            
            if (((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    const checkGngIntersection = async () => {
        try {
            // Get well coordinates - check properties first, then geometry
            let wellLon = parseFloat(getAttr("LONGITUDE") || getAttr("X") || "0")
            let wellLat = parseFloat(getAttr("LATITUDE") || getAttr("Y") || "0")
            
            let needsProjection = false
            let sourceSpatialRef: any = null
            
            // If no coordinates from properties, check geometry
            if ((!wellLon || !wellLat)) {
                if (data?.x !== undefined && data?.y !== undefined) {
                    wellLon = parseFloat(data.x)
                    wellLat = parseFloat(data.y)
                    sourceSpatialRef = data.spatialReference
                    needsProjection = true
                } else if (data?.geometry?.x !== undefined && data?.geometry?.y !== undefined) {
                    wellLon = parseFloat(data.geometry.x)
                    wellLat = parseFloat(data.geometry.y)
                    sourceSpatialRef = data.geometry.spatialReference
                    needsProjection = true
                } else if (data?.geometry?.coordinates) {
                    const coords = data.geometry.coordinates
                    if (Array.isArray(coords) && coords.length >= 2) {
                        wellLon = parseFloat(coords[0])
                        wellLat = parseFloat(coords[1])
                    }
                }
            }
            
            // Check if coordinates need projection (UTM to WGS84)
            if (needsProjection && sourceSpatialRef) {
                const wkid = sourceSpatialRef?.wkid || sourceSpatialRef?.latestWkid
                // If WKID is not 4326 (WGS84), we need to project
                if (wkid && wkid !== 4326) {
                    try {
                        // Dynamically import ArcGIS modules
                        const projection = await import('@arcgis/core/geometry/projection')
                        const PointModule = await import('@arcgis/core/geometry/Point')
                        const SpatialRefModule = await import('@arcgis/core/geometry/SpatialReference')
                        
                        const Point = PointModule.default
                        const SpatialReference = SpatialRefModule.default
                        
                        const point = new Point({
                            x: wellLon,
                            y: wellLat,
                            spatialReference: new SpatialReference({ wkid })
                        })
                        
                        const projected = projection.project(point, new SpatialReference({ wkid: 4326 }))
                        if (projected && 'x' in projected && 'y' in projected) {
                            wellLon = (projected as any).x
                            wellLat = (projected as any).y
                            console.log('[G&G Check] Projected coordinates:', { wellLon, wellLat, fromWkid: wkid })
                        }
                    } catch (projError) {
                        console.error('[G&G Check] Projection failed:', projError)
                        // Continue with unprojected coordinates - might give wrong results
                    }
                }
            }
            
            if (!wellLon || !wellLat) {
                console.log('[G&G Check] No valid coordinates, skipping')
                setHasGngIntersection(false)
                return
            }

            // Fetch G&G projects
            const response = await fetch('/data/GnG_Project_Data_Outlines.json')
            const geojsonData = await response.json()
            
            // Find projects that contain this well
            const intersecting = geojsonData.features?.filter((f: any) => {
                const geometry = f.geometry
                if (!geometry || !geometry.coordinates) return false
                
                const coords = geometry.coordinates
                const geomType = geometry.type
                
                if (geomType === "Polygon") {
                    // coords is [outerRing, hole1, hole2, ...], check outer ring only
                    const outerRing = coords[0];
                    return pointInRing([wellLon, wellLat], outerRing)
                } else if (geomType === "MultiPolygon") {
                    // coords is array of polygons, each polygon is [outerRing, holes...]
                    return coords.some((polygon: number[][][]) => {
                        const outerRing = polygon[0];
                        return pointInRing([wellLon, wellLat], outerRing)
                    })
                }
                return false
            }) || []

            const projects = intersecting.map((f: any) => ({
                ...f.properties,
                id: f.id || f.properties?.OBJECTID
            }))
            
            console.log('[G&G Check] Intersecting projects found:', projects.length, projects.map((p: any) => p.PROJECT_NAME))
            console.log('[G&G Check] Intersection result:', projects.length > 0 ? 'Intersection found' : 'No intersection found')
            console.log('[G&G Check] Project count:', projects.length)
            
            setIntersectingProjects(projects)
            setHasGngIntersection(projects.length > 0)
        } catch (error) {
            console.error("Failed to check G&G intersection:", error)
            setHasGngIntersection(false)
        }
    }

    const fetchGngProjects = async () => {
        setLoading(true)
        try {
            // Use already filtered intersecting projects
            setGngProjects(intersectingProjects)
        } catch (error) {
            console.error("Failed to fetch G&G projects:", error)
            setGngProjects([])
        } finally {
            setLoading(false)
        }
    }

    const wellName = getAttr("IDENTIFICA");
    const wellType = getAttr("WELL_TYPE");
    const wellStatus = getAttr("STATUS");

    const wellItems = [
        { label: "Well ID", value: wellName },
        { label: "Operator", value: getAttr("OPERATOR") },
        { label: "Type", value: wellType },
        { label: "Status", value: wellStatus },
        { label: "Result", value: getAttr("WELL_RESUL") },
        { label: "Depth", value: getAttr("END_DEPTH_") !== "-" ? `${getAttr("END_DEPTH_")}m` : "-" },
        { label: "Field", value: getAttr("FIELD_NAME") },
    ]

    return (
        <div className="space-y-4 pb-10">
            {/* Tabs - Only show G&G tab if well intersects with G&G projects */}
            <div className="flex items-center gap-1 pb-1">
                <button
                    onClick={() => setActiveTab("well-info")}
                    className={cn(
                        "justify-center py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-2 transition-all border",
                        hasGngIntersection ? 'flex-1' : 'w-full',
                        activeTab === "well-info"
                            ? theme === 'dark' 
                                ? "bg-slate-700 border-blue-500 text-white shadow-sm" 
                                : "bg-slate-800 border-slate-800 text-white shadow-sm"
                            : theme === 'dark'
                                ? "bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                                : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    )}
                >
                    Well Info
                </button>
                {hasGngIntersection && (
                    <button
                        onClick={() => setActiveTab("gng-data")}
                        className={cn(
                            "flex-1 justify-center py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-2 transition-all border",
                            activeTab === "gng-data"
                                ? "bg-green-600 border-green-600 text-white shadow-sm"
                                : theme === 'dark'
                                    ? "bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                                    : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        G&G Project Data
                    </button>
                )}
            </div>
            <div className={cn("h-px w-full", theme === 'dark' ? "bg-slate-800" : "bg-gray-100")} />

            {/* Well Info Tab */}
            {activeTab === "well-info" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                theme === 'dark' ? "text-slate-500" : "text-slate-500"
                            )}>Active Well Selection</span>
                        </div>
                        <h3 className={cn(
                            "text-lg font-semibold mb-3 truncate",
                            theme === 'dark' ? "text-slate-100" : "text-slate-900"
                        )}>
                            {wellName !== "-" ? wellName : "Well Properties"}
                        </h3>
                        <div className="flex items-center gap-2">
                            {wellType !== "-" && (
                                <span className={cn(
                                    "px-2 py-1 text-[10px] font-medium rounded",
                                    theme === 'dark' ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-slate-900 text-white"
                                )}>
                                    {wellType}
                                </span>
                            )}
                            {wellStatus !== "-" && (
                                <span className={cn(
                                    "px-2 py-1 text-[10px] font-medium rounded border",
                                    theme === 'dark' 
                                        ? "bg-slate-800/50 text-slate-400 border-slate-700" 
                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                )}>
                                    {wellStatus}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />

                    <div className="space-y-3">
                        <h4 className={cn(
                            "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                            theme === 'dark' ? "text-slate-400" : "text-slate-500"
                        )}>
                            <Database className="w-3.5 h-3.5" />
                            Asset Attributes
                        </h4>
                        <AttributeTable items={wellItems} theme={theme} />
                    </div>

                    <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />
                    <DocumentsSection theme={theme} />
                </div>
            )}

            {/* G&G Project Data Tab */}
            {activeTab === "gng-data" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                theme === 'dark' ? "text-slate-500" : "text-slate-500"
                            )}>G&G Project Data</span>
                        </div>
                        <h3 className={cn(
                            "text-lg font-semibold mb-1 truncate",
                            theme === 'dark' ? "text-slate-100" : "text-slate-900"
                        )}>
                            {wellName !== "-" ? wellName : "Associated Projects"}
                        </h3>
                        <p className="text-xs text-slate-500">Netherlands data with summary from attributes table</p>
                    </div>

                    <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : gngProjects.length > 0 ? (
                        <div className="space-y-3">
                            <h4 className={cn(
                                "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                                theme === 'dark' ? "text-slate-400" : "text-slate-500"
                            )}>
                                <Database className="w-3.5 h-3.5" />
                                Project Summary ({gngProjects.length} projects)
                            </h4>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {gngProjects.slice(0, 10).map((project, index) => {
                                    const appName = (project.APPLICATION_NAME || "").toLowerCase()
                                    const appLogos: Record<string, string> = {
                                        "petrel": "https://www.gopaysoft.com/wp-content/uploads/image-396.png",
                                        "openworks": "https://usoftly.ir/wp-content/uploads/2021/10/Openworks.png",
                                        "opendtect": "https://avatars.githubusercontent.com/u/11555490?s=280&v=4",
                                        "paleoscan": "https://usoftly.ir/wp-content/uploads/2021/10/PaleoScan_202010_r29391_x64_0.png"
                                    }
                                    const logoUrl = appLogos[appName]
                                    
                                    return (
                                        <div key={project.id || index} className={cn(
                                            "p-3 rounded border transition-colors",
                                            theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
                                        )}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {logoUrl && (
                                                        <img 
                                                            src={logoUrl} 
                                                            alt={project.APPLICATION_NAME || ""}
                                                            className={cn(
                                                                "w-6 h-6 rounded object-contain",
                                                                theme === 'dark' ? "bg-slate-700" : "bg-white"
                                                            )}
                                                        />
                                                    )}
                                                    <span className={cn(
                                                        "font-semibold text-sm",
                                                        theme === 'dark' ? "text-slate-200" : "text-slate-800"
                                                    )}>
                                                        {project.PROJECT_NAME || "Unnamed Project"}
                                                    </span>
                                                </div>
                                                {project.INTERPRETATION_YEAR && (
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded",
                                                        theme === 'dark' ? "bg-green-950/30 text-green-400 border border-green-900/50" : "bg-green-100 text-green-700"
                                                    )}>
                                                        {project.INTERPRETATION_YEAR}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[10px] pl-8">
                                                {project.APPLICATION_NAME && (
                                                    <div className={theme === 'dark' ? "text-slate-400" : "text-slate-600"}>
                                                        <span className="text-slate-500">App: </span>
                                                        {project.APPLICATION_NAME}
                                                    </div>
                                                )}
                                                {project.NO_OF_WELLS !== undefined && (
                                                    <div className={theme === 'dark' ? "text-slate-400" : "text-slate-600"}>
                                                        <span className="text-slate-500">Wells: </span>
                                                        {project.NO_OF_WELLS}
                                                    </div>
                                                )}
                                                {project.NO_OF_REPORTS !== undefined && (
                                                    <div className={theme === 'dark' ? "text-slate-400" : "text-slate-600"}>
                                                        <span className="text-slate-500">Reports: </span>
                                                        {project.NO_OF_REPORTS}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                                {gngProjects.length > 10 && (
                                    <p className="text-[10px] text-slate-400 text-center py-2">
                                        ... and {gngProjects.length - 10} more projects
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No G&G projects found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function FieldDetailsContent({ data, theme = 'light' }: { data: any, theme?: 'light' | 'dark' }) {
    // Case-insensitive attribute getter
    const getAttr = (key: string) => {
        if (!data) return "-";
        const actualKey = Object.keys(data).find(k => k.toLowerCase() === key.toLowerCase());
        if (actualKey && data[actualKey] !== undefined && data[actualKey] !== null && String(data[actualKey]).trim() !== "") {
            return String(data[actualKey]);
        }
        return "-";
    };

    const fieldName = getAttr("FIELD_NAME");
    const resultStatus = getAttr("RESULT");
    const fieldStatus = getAttr("STATUS");

    const fieldItems = [
        { label: "Field Name", value: fieldName },
        { label: "Operator", value: getAttr("OPERATOR") },
        { label: "Status", value: fieldStatus },
        { label: "Result", value: resultStatus },
        { label: "Discovery", value: getAttr("DISCOVERY_") },
        { label: "Type", value: getAttr("LANDSEA") },
    ]

    return (
        <div className="space-y-6 pb-10">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        theme === 'dark' ? "text-slate-500" : "text-slate-500"
                    )}>Selected Field Overview</span>
                </div>
                <h3 className={cn(
                    "text-lg font-semibold mb-3 truncate",
                    theme === 'dark' ? "text-slate-100" : "text-slate-900"
                )}>
                    {fieldName !== "-" ? fieldName : "Field Properties"}
                </h3>
                <div className="flex items-center gap-2">
                    {resultStatus !== "-" && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-medium rounded">
                            {resultStatus}
                        </span>
                    )}
                    {fieldStatus !== "-" && (
                        <span className={cn(
                            "px-2 py-1 text-[10px] font-medium rounded border",
                            theme === 'dark' 
                                ? "bg-slate-800/50 text-slate-400 border-slate-700" 
                                : "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                            {fieldStatus}
                        </span>
                    )}
                </div>
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />

            <div className="space-y-3">
                <h4 className={cn(
                    "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>
                    <Database className="w-3.5 h-3.5" />
                    Field Attributes
                </h4>
                <AttributeTable items={fieldItems} theme={theme} />
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />
            <DocumentsSection theme={theme} />
            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />
            <SeismicViewer />
        </div>
    )
}



// License-specific content
function LicenseDetailsContent({ data, theme = 'light' }: { data: any, theme?: 'light' | 'dark' }) {
    // Case-insensitive attribute getter
    const getAttr = (key: string) => {
        if (!data) return "-";
        const actualKey = Object.keys(data).find(k => k.toLowerCase() === key.toLowerCase());
        if (actualKey && data[actualKey] !== undefined && data[actualKey] !== null && String(data[actualKey]).trim() !== "") {
            return String(data[actualKey]);
        }
        return "-";
    };

    const licenseItems = [
        { label: "License Code", value: getAttr("licence_cd") },
        { label: "License Name", value: getAttr("licence_nm") },
        { label: "License Type", value: getAttr("licence_ty") },
        { label: "Status", value: getAttr("licence_st") },
        { label: "Resource", value: getAttr("licence_re") },
        { label: "Licensed Area", value: getAttr("licenced_a") },
    ]

    const licenseName = getAttr("licence_nm");
    const licenseCode = getAttr("licence_cd");
    const licenseType = getAttr("licence_ty");
    const licenseStatus = getAttr("licence_st");
    const licenseResource = getAttr("licence_re");

    // Type color mapping
    const typeColors: Record<string, string> = {
        "STR": "bg-red-100 text-red-700 border-red-200",  // Storage
        "GEA": "bg-green-100 text-green-700 border-green-200",  // Geothermal
        "GFL": "bg-blue-100 text-blue-700 border-blue-200",  // Gas Field
    };
    const typeLabels: Record<string, string> = {
        "STR": "Storage",
        "GEA": "Geothermal",
        "GFL": "Gas Field",
    };

    // Status color mapping
    const statusColors: Record<string, string> = {
        "EFFECTIVE": "bg-emerald-100 text-emerald-700 border-emerald-200",
    };

    return (
        <div className="space-y-6 pb-10">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        theme === 'dark' ? "text-slate-500" : "text-slate-500"
                    )}>License Information</span>
                </div>
                <h3 className={cn(
                    "text-lg font-semibold mb-3 truncate",
                    theme === 'dark' ? "text-slate-100" : "text-slate-900"
                )}>
                    {licenseName !== "-" ? licenseName : "License Properties"}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                    {licenseType !== "-" && (
                        <span className={cn(
                            "px-2 py-1 text-[10px] font-medium rounded border",
                            theme === 'dark'
                                ? typeColors[licenseType] ? typeColors[licenseType].replace('100', '900/30').replace('700', '400').replace('200', '800/50') : "bg-slate-800 text-slate-400 border-slate-700"
                                : typeColors[licenseType] || "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                            {typeLabels[licenseType] || licenseType}
                        </span>
                    )}
                    {licenseStatus !== "-" && (
                        <span className={cn(
                            "px-2 py-1 text-[10px] font-medium rounded border",
                            theme === 'dark'
                                ? statusColors[licenseStatus] ? statusColors[licenseStatus].replace('100', '900/30').replace('700', '400').replace('200', '800/50') : "bg-slate-800 text-slate-400 border-slate-700"
                                : statusColors[licenseStatus] || "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                            {licenseStatus}
                        </span>
                    )}
                    {licenseResource !== "-" && (
                        <span className={cn(
                            "px-2 py-1 text-[10px] font-medium rounded border",
                            theme === 'dark'
                                ? "bg-purple-900/30 text-purple-400 border-purple-800/50"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                        )}>
                            {licenseResource}
                        </span>
                    )}
                </div>
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />

            <div className="space-y-3">
                <h4 className={cn(
                    "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>
                    <Database className="w-3.5 h-3.5" />
                    License Attributes
                </h4>
                <AttributeTable items={licenseItems} theme={theme} />
            </div>

            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />
            <DocumentsSection theme={theme} />
            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />
            <SeismicViewer />
        </div>
    )
}

// G&G Project-specific content - no tabs, prominent app card
function GNGProjectContent({ data, onToggle3D, onViewGNGData, theme = 'light' }: { data: any, onToggle3D?: () => void, onViewGNGData?: () => void, theme?: 'light' | 'dark' }) {
    // Handle both direct properties and nested properties (GeoJSON format)
    const props = data?.properties || data || {};
    
    // State for expandable sections
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        wells: false,
        reports: false
    });
    
    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const getAttr = (key: string) => {
        if (!props) return "-";
        // Try exact match first
        if (props[key] !== undefined && props[key] !== null && String(props[key]).trim() !== "") {
            return String(props[key]);
        }
        // Try case-insensitive match
        const actualKey = Object.keys(props).find(k => k.toLowerCase() === key.toLowerCase());
        if (actualKey && props[actualKey] !== undefined && props[actualKey] !== null && String(props[actualKey]).trim() !== "") {
            return String(props[actualKey]);
        }
        // Try snake_case to UPPER_CASE conversion
        const upperKey = key.toUpperCase();
        const upperMatch = Object.keys(props).find(k => k.toUpperCase() === upperKey);
        if (upperMatch && props[upperMatch] !== undefined && props[upperMatch] !== null && String(props[upperMatch]).trim() !== "") {
            return String(props[upperMatch]);
        }
        return "-";
    };

    // Debug logging - remove after testing
    useEffect(() => {
        console.log("G&G Project Data:", data);
        console.log("G&G Props:", props);
        console.log("Available keys:", Object.keys(props));
    }, [data, props]);

    const projectName = getAttr("PROJECT_NAME");
    const appName = getAttr("APPLICATION_NAME");
    const year = getAttr("INTERPRETATION_YEAR");
    const wells = getAttr("NO_OF_WELLS");
    const reports = getAttr("NO_OF_REPORTS");

    // Check if this is an F03/F3 block project
    const isF03Project = projectName.toLowerCase().includes('f03') || 
                         projectName.toLowerCase().includes('f3') ||
                         projectName.toLowerCase().includes('f-03') ||
                         projectName.toLowerCase().includes('f-3');

    const projectItems = [
        { label: "Project Name", value: projectName },
        { label: "Application", value: appName },
        { label: "Application Version", value: getAttr("APPLICATION_VERSION") },
        { label: "Interpretation Year", value: year },
        { label: "No. of Wells", value: wells },
        { label: "No. of Reports", value: reports },
        { label: "No. of Horizons", value: getAttr("NO_OF_INTER_HORIZONS") },
        { label: "No. of Seismic 2D", value: getAttr("NO_OF_SEISMIC_2D") },
        { label: "No. of Seismic 3D", value: getAttr("NO_OF_SEISMIC_3D") },
        { label: "Project Data Path", value: getAttr("PROJECT_DATA_PATH") },
        { label: "Summary", value: getAttr("SUMMARY") },
        { label: "Shape Length", value: getAttr("Shape_Length") },
        { label: "Shape Area", value: getAttr("Shape_Area") },
        { label: "Object ID", value: getAttr("OBJECTID") },
    ];

    const appLogos: Record<string, string> = {
        "petrel": "https://www.gopaysoft.com/wp-content/uploads/image-396.png",
        "openworks": "https://usoftly.ir/wp-content/uploads/2021/10/Openworks.png",
        "opendtect": "https://avatars.githubusercontent.com/u/11555490?s=280&v=4",
        "paleoscan": "https://usoftly.ir/wp-content/uploads/2021/10/PaleoScan_202010_r29391_x64_0.png"
    };
    const logoUrl = appLogos[(appName || "").toLowerCase()];

    return (
        <div className="space-y-4 pb-10">
            {/* Prominent Application Card - At the top */}
            <div className={cn(
                "rounded-lg border p-4",
                theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
            )}>
                <div className="flex items-start gap-3">
                    {logoUrl ? (
                        <img 
                            src={logoUrl} 
                            alt={appName} 
                            className={cn(
                                "w-12 h-12 rounded object-contain p-1 border",
                                theme === 'dark' ? "bg-slate-700 border-slate-600" : "bg-white border-slate-200"
                            )} 
                        />
                    ) : (
                        <div className={cn(
                            "w-12 h-12 rounded flex items-center justify-center font-bold text-lg",
                            theme === 'dark' ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-600"
                        )}>
                            {projectName.charAt(0) || "G"}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className={cn(
                                "text-lg font-bold truncate",
                                theme === 'dark' ? "text-slate-200" : "text-slate-700"
                            )}>{projectName !== "-" ? projectName : "Project"}</h3>
                            {year !== "-" && (
                                <span className={cn(
                                    "px-2 py-1 text-xs font-medium rounded shrink-0 border",
                                    theme === 'dark' ? "bg-green-900/30 text-green-400 border-green-800/50" : "bg-green-100 text-green-700 border-green-200"
                                )}>
                                    {year}
                                </span>
                            )}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs">
                            {appName !== "-" && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500">App:</span>
                                    <span className={theme === 'dark' ? "font-medium text-slate-300" : "font-medium text-slate-700"}>{appName}</span>
                                </div>
                            )}
                            {wells !== "-" && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500">Wells:</span>
                                    <span className={theme === 'dark' ? "font-medium text-slate-300" : "font-medium text-slate-700"}>{wells}</span>
                                </div>
                            )}
                            {reports !== "-" && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500">Reports:</span>
                                    <span className={theme === 'dark' ? "font-medium text-slate-300" : "font-medium text-slate-700"}>{reports}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Launch 3D Viewer Button */}
            <button
                onClick={() => onToggle3D?.()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
                <Box className="w-4 h-4" />
                Launch 3D Viewer
            </button>

            {/* View Other G&G Data Button */}
            {onViewGNGData && (
                <button
                    onClick={onViewGNGData}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                >
                    <Layers className="w-4 h-4" />
                    View Other G&G Data
                </button>
            )}


            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />

            {/* Project Attributes Table */}
            <div className="space-y-3">
                <h4 className={cn(
                    "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>
                    <Database className="w-3.5 h-3.5" />
                    Project Attributes
                </h4>
                {isF03Project ? (
                    <ExpandableAttributeTable 
                        items={projectItems} 
                        theme={theme} 
                        expandedSections={expandedSections}
                        onToggleSection={toggleSection}
                    />
                ) : (
                    <AttributeTable items={projectItems} theme={theme} />
                )}
            </div>
        </div>
    );
}

// Seismic 2D Line-specific content
function Seismic2DContent({ data, theme = 'light' }: { data: any, theme?: 'light' | 'dark' }) {
    const getAttr = (key: string) => {
        if (!data) return "-";
        const actualKey = Object.keys(data).find(k => k.toLowerCase() === key.toLowerCase());
        if (actualKey && data[actualKey] !== undefined && data[actualKey] !== null && String(data[actualKey]).trim() !== "") {
            return String(data[actualKey]);
        }
        return "-";
    };

    const lineName = getAttr("line_name");
    const survey = getAttr("survey_col");
    const delivery = getAttr("delivery_c");

    const lineItems = [
        { label: "Line Name", value: lineName },
        { label: "Survey Collection", value: survey },
        { label: "Line Collection", value: getAttr("line_colle") },
        { label: "Delivery", value: delivery },
    ];

    return (
        <div className="space-y-6 pb-10">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        theme === 'dark' ? "text-slate-500" : "text-slate-500"
                    )}>Seismic 2D Survey Line</span>
                </div>
                <h3 className={cn(
                    "text-lg font-semibold mb-3 truncate",
                    theme === 'dark' ? "text-slate-100" : "text-slate-900"
                )}>{lineName !== "-" ? lineName : "Line Properties"}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                    {survey !== "-" && (
                        <span className={cn(
                            "px-2 py-1 text-[10px] font-medium rounded border",
                            theme === 'dark' ? "bg-blue-900/30 text-blue-400 border-blue-800/50" : "bg-blue-100 text-blue-700 border-blue-200"
                        )}>{survey}</span>
                    )}
                    {delivery !== "-" && (
                        <span className={cn(
                            "px-2 py-1 text-[10px] font-medium rounded border",
                            theme === 'dark' ? "bg-slate-800/50 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-200"
                        )}>{delivery}</span>
                    )}
                </div>
            </div>
            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />
            <div className="space-y-3">
                <h4 className={cn(
                    "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>
                    <Database className="w-3.5 h-3.5" />
                    Line Attributes
                </h4>
                <AttributeTable items={lineItems} theme={theme} />
            </div>
            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />
            <DocumentsSection theme={theme} />
            <div className={cn("h-px", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />
            <SeismicViewer />
        </div>
    );
}

// Platform-specific content
function PlatformDetailsContent({ data, theme = 'light' }: { data: any, theme?: 'light' | 'dark' }) {
    return (
        <div className="space-y-6">
            <div className="mb-4">
                <h3 className={cn(
                    "text-xl font-bold leading-tight mb-2",
                    theme === 'dark' ? "text-slate-100" : "text-slate-700"
                )}>{data.name}</h3>
                <div className="flex items-center gap-3">
                    <span className={cn(
                        "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-sm",
                        theme === 'dark' ? "bg-red-950/30 text-red-400 border border-red-900/50" : "bg-red-100 text-red-700"
                    )}>
                        Platform
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{data.operator}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className={cn(
                    "p-3 border rounded-sm",
                    theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}>
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Status</div>
                    <div className={cn(
                        "text-sm font-semibold",
                        theme === 'dark' ? "text-slate-200" : "text-slate-700"
                    )}>{data.status}</div>
                </div>
                <div className={cn(
                    "p-3 border rounded-sm",
                    theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}>
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Location</div>
                    <div className={cn(
                        "text-sm font-semibold",
                        theme === 'dark' ? "text-slate-200" : "text-slate-700"
                    )}>{data.location}</div>
                </div>
            </div>

            <div className={cn(
                "p-4 border rounded-sm space-y-3",
                theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
            )}>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Water Depth</span>
                    <span className={cn("font-medium", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>75m</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Commission Date</span>
                    <span className={cn("font-medium", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>2014-05-12</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Facilities</span>
                    <span className={cn("font-medium", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>GOP, Living Quarters</span>
                </div>
            </div>
        </div>
    )
}

// Pipeline-specific content
function PipelineDetailsContent({ data, theme = 'light' }: { data: any, theme?: 'light' | 'dark' }) {
    return (
        <div className="space-y-6">
            <div className="mb-4">
                <h3 className={cn(
                    "text-xl font-bold leading-tight mb-2",
                    theme === 'dark' ? "text-slate-100" : "text-slate-700"
                )}>{data.name}</h3>
                <div className="flex items-center gap-3">
                    <span className={cn(
                        "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-sm",
                        theme === 'dark' ? "bg-orange-950/30 text-orange-400 border border-orange-900/50" : "bg-orange-100 text-orange-700"
                    )}>
                        Pipeline
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{data.category}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className={cn(
                    "p-3 border rounded-sm",
                    theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}>
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Diameter</div>
                    <div className={cn(
                        "text-sm font-semibold",
                        theme === 'dark' ? "text-slate-200" : "text-slate-700"
                    )}>{data.diameter}"</div>
                </div>
                <div className={cn(
                    "p-3 border rounded-sm",
                    theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}>
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Length</div>
                    <div className={cn(
                        "text-sm font-semibold",
                        theme === 'dark' ? "text-slate-200" : "text-slate-700"
                    )}>{parseFloat(data.length).toFixed(2)} km</div>
                </div>
            </div>

            <div className={cn(
                "p-4 border rounded-sm space-y-3",
                theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
            )}>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Fluid Type</span>
                    <span className={cn("font-medium", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>Natural Gas</span>
                </div>
                <div className={cn("h-px", theme === 'dark' ? "bg-slate-700" : "bg-slate-200")} />
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Max Pressure</span>
                    <span className={cn("font-medium", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>1440 psi</span>
                </div>
            </div>
        </div>
    )
}
