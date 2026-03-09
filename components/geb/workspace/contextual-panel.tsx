"use client"

import { X, Database, GitCompare, ChevronRight, FileText, FileDown, Download, ExternalLink, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

// Define types for different panel contexts
export type PanelContext = "polygon" | "play" | "basin" | "field" | "well" | "license" | "gng-project" | "seismic-2d" | null

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
    onViewGNGData?: () => void
}

export function ContextualPanel({ isOpen, context, onClose, onNavigate, onAddToCompare, onToggle3D, onViewSubsurface, onViewGNGData }: ContextualPanelProps) {
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
            className={`relative h-full bg-white shadow-xl z-20 transition-all duration-300 ease-in-out border-l border-gray-200 ${isOpen && isAnimating ? "w-[400px]" : "w-0"
                }`}
        >
            <div className="w-[400px] h-full flex flex-col">
                {/* Header */}
                <div className="h-8 flex-none flex items-center justify-between px-3 border-b border-gray-200 bg-gray-50">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {context.type === "polygon" && "Block Investment Details"}
                        {context.type === "play" && "Play Analysis"}
                        {context.type === "basin" && "Basin Overview"}
                        {context.type === "field" && "Field Overview"}
                        {context.type === "well" && "Well Information"}
                        {context.type === "license" && "License Details"}
                        {context.type === "gng-project" && "G&G Project Information"}
                        {context.type === "seismic-2d" && "Seismic Line Information"}
                    </span>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Close panel"
                    >
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto bg-white p-3 space-y-6 min-h-0">
                    {context.type === "polygon" && (
                        <BlockDetailsContent
                            data={context.data}
                            onAddToCompare={onAddToCompare}
                            onToggle3D={onToggle3D}
                            onViewSubsurface={onViewSubsurface}
                            onShowSubsurfaceComingSoon={() => setShowSubsurfaceComingSoon(true)}
                        />
                    )}
                    {context.type === "play" && <PlayContent data={context.data} onNavigate={onNavigate} />}
                    {context.type === "basin" && <BasinContent data={context.data} onNavigate={onNavigate} />}
                    {context.type === "well" && <WellDetailsContent data={context.data} />}
                    {context.type === "field" && <FieldDetailsContent data={context.data} />}
                    {context.type === "license" && <LicenseDetailsContent data={context.data} />}
                    {context.type === "gng-project" && <GNGProjectContent data={context.data} onToggle3D={onToggle3D} onViewGNGData={onViewGNGData} />}
                    {context.type === "seismic-2d" && <Seismic2DContent data={context.data} />}
                </div>

                {/* Panel footer - Powered by attribution */}
                <div className="flex-none px-3 pb-3 pt-2 bg-white border-t border-gray-100">
                    <div className="w-full flex justify-end">
                        <div className="bg-white/90 text-[10px] text-slate-500 px-2.5 py-1 rounded shadow-sm border border-slate-200">
                            <span className="font-normal">Powered by </span>
                            <span className="font-semibold text-slate-800">AFED Digital Sdn. Bhd.</span>
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
    return (
        <div>
            <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-2">Seismic Viewer</h4>
            <div className="w-full h-[250px] border border-slate-200 rounded overflow-hidden bg-slate-100 relative">
                <iframe
                    src="http://167.172.87.156:5174/seismic_multiview?filepath=Seismic_F03.sgy"
                    className="w-full h-full"
                    title="Seismic Viewer"
                    allowFullScreen
                />
            </div>
        </div>
    )
}

import { MOCK_BLOCKS, type BlockCommercialData } from "@/data/investor-data"
import { Plus, Box, Phone, Mail, Building2, LayoutDashboard, Layers, DollarSign, Lock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, ReferenceLine } from "recharts"

// Locked Content component for non-premium users
function LockedContentPrompt({ tabName }: { tabName: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
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
}: {
    data: any,
    onAddToCompare?: (block: any) => void,
    onToggle3D?: () => void,
    onViewSubsurface?: (blockName: string) => void,
    onShowSubsurfaceComingSoon?: () => void
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
                        className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-sm border border-slate-200 transition-colors"
                        title="View Platform in 3D"
                    >
                        <Box className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onAddToCompare?.(blockData)}
                        className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-sm border border-slate-200 transition-colors"
                        title="Add to Compare"
                    >
                        <GitCompare className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onViewSubsurface?.(blockName)}
                        className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-sm border border-slate-200 transition-colors flex items-center gap-2"
                        title="3D Viewer"
                    >
                        <Layers className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">3D Viewer</span>
                    </button>
                    <button
                        onClick={() => onShowSubsurfaceComingSoon?.()}
                        className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-sm border border-slate-200 transition-colors flex items-center gap-2"
                        title="VDR Paleoscan"
                    >
                        <Database className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">VDR Paleoscan</span>
                    </button>
                </div>

                <div className="mb-4">
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{blockData.name}</h3>
                    <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-sm ${blockData.status === 'Production' ? 'bg-green-100 text-green-700' :
                            blockData.status === 'Active Exploration' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-600'
                            }`}>
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
                            className={`flex-1 justify-center py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-2 transition-all border ${activeTab === tab.id
                                ? "bg-white border-primary text-primary/90 shadow-sm"
                                : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                }`}
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
                <div className="h-px bg-gray-100 w-full mt-2" />
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 pb-10 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                {/* --- OVERVIEW TAB --- */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-sm text-sm text-slate-600 italic border border-slate-100 leading-relaxed">
                            "{blockData.description}"
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-sm">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">2P Reserves</div>
                                <div className="text-2xl font-bold text-slate-900 mb-1">
                                    {blockData.resources.oilReserves2P || 0} <span className="text-sm font-medium text-slate-500">MMbbl</span>
                                </div>
                                <div className="text-xs text-slate-500 font-medium">
                                    {blockData.resources.gasReserves2P || 0} Bcf Gas
                                </div>
                            </div>
                            {blockData.economics && (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-sm shadow-sm">
                                    <div className="text-[10px] font-bold text-emerald-600 uppercase mb-2 tracking-wider">Valuation (NPV10)</div>
                                    <div className="text-2xl font-bold text-emerald-700 mb-1">${blockData.economics.npv10}M</div>
                                    <div className="text-xs text-emerald-600 font-medium">IRR: {blockData.economics.irr}%</div>
                                </div>
                            )}
                        </div>

                        {/* Risk Summary */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Risk Assessment</h4>
                                <div className="flex gap-3 text-[9px] text-slate-400">
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-green-500" /> Low</span>
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-amber-500" /> Med</span>
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-red-500" /> High</span>
                                </div>
                            </div>
                            <div className="space-y-3 bg-slate-50 p-4 rounded-sm border border-slate-100">
                                <RiskBar label="Technical" value={blockData.risks.technical} />
                                <RiskBar label="Commercial" value={blockData.risks.commercial} />
                                <RiskBar label="Political" value={blockData.risks.political} />
                                <RiskBar label="Regulatory" value={blockData.risks.regulatory} />
                            </div>
                        </div>

                        {/* Contact Card (Mini) */}
                        {blockData.contact && (
                            <div className="p-3 bg-slate-900 rounded text-white flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] uppercase text-slate-400 mb-1">Contact Point</div>
                                    <div className="text-sm font-bold">{blockData.contact.agency}</div>
                                    <div className="text-[10px] text-slate-300">{blockData.contact.email}</div>
                                </div>
                                <Mail className="w-5 h-5 text-accent" />
                            </div>
                        )}
                    </div>
                )}

                {/* --- TECHNICAL TAB --- */}
                {activeTab === "technical" && (
                    !isPremium ? (
                        <LockedContentPrompt tabName="Technical" />
                    ) : (
                        <div className="space-y-6">
                            {/* Resources Table */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Resources & Reserves</h4>
                                <div className="border border-slate-200 rounded overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Category</th>
                                                <th className="px-3 py-2 text-right">Oil (MMbbl)</th>
                                                <th className="px-3 py-2 text-right">Gas (Bcf)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {blockData.resources.oilReserves2P || blockData.resources.gasReserves2P ? (
                                                <tr>
                                                    <td className="px-3 py-2 font-medium text-slate-700">2P Reserves</td>
                                                    <td className="px-3 py-2 text-right font-mono text-slate-600">{blockData.resources.oilReserves2P || "-"}</td>
                                                    <td className="px-3 py-2 text-right font-mono text-slate-600">{blockData.resources.gasReserves2P || "-"}</td>
                                                </tr>
                                            ) : null}
                                            {blockData.resources.contingentOil || blockData.resources.contingentGas ? (
                                                <tr>
                                                    <td className="px-3 py-2 font-medium text-slate-700">2C Resources</td>
                                                    <td className="px-3 py-2 text-right font-mono text-slate-600">{blockData.resources.contingentOil || "-"}</td>
                                                    <td className="px-3 py-2 text-right font-mono text-slate-600">{blockData.resources.contingentGas || "-"}</td>
                                                </tr>
                                            ) : null}
                                            <tr>
                                                <td className="px-3 py-2 font-medium text-slate-700">Prospective (Mean)</td>
                                                <td className="px-3 py-2 text-right font-mono text-slate-600">{blockData.resources.prospectiveOilMean || "-"}</td>
                                                <td className="px-3 py-2 text-right font-mono text-slate-600">{blockData.resources.prospectiveGasMean || "-"}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Production Profile */}
                            {blockData.production && (
                                <div>
                                    <div className="h-px bg-gray-100 mb-6" />
                                    <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Production History</h4>
                                    <div className="h-[160px] w-full bg-white border border-slate-100 rounded p-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={blockData.production} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="year"
                                                    axisLine={false}
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
                                                    contentStyle={{ borderRadius: '4px', fontSize: '10px' }}
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
                                <div className="h-px bg-gray-100 mb-6" />
                                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Infrastructure</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                        <span className="block text-slate-400 text-[10px] uppercase">Pipeline</span>
                                        <span className="font-mono font-medium">{blockData.infrastructure.nearestPipelineKm} km</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                        <span className="block text-slate-400 text-[10px] uppercase">Supply Base</span>
                                        <span className="font-mono font-medium">{blockData.infrastructure.nearestPortKm} km</span>
                                    </div>
                                </div>
                            </div>

                            {/* Subsurface Data Uncertainty */}
                            {(() => {
                                // Derive uncertainty scores (0–100, higher = more confident/less uncertain)
                                // from existing block data so every block is consistent without new fields
                                const r = blockData.risks
                                const hasProduction = (blockData.production?.length ?? 0) > 0
                                const hasReserves = !!(blockData.resources.gasReserves2P || blockData.resources.oilReserves2P)
                                const hasProspective = !!(blockData.resources.prospectiveGasMean || blockData.resources.prospectiveOilMean)
                                const waterDepth = blockData.infrastructure.waterDepth ?? 0

                                // Seismic coverage — inversely scaled with tech risk; production blocks generally better covered
                                const seismicScore = Math.min(100, Math.max(10,
                                    (hasReserves ? 70 : hasProspective ? 45 : 30) +
                                    (10 - r.technical) * 3
                                ))
                                // Well control — production blocks have many wells; exploration has few/none
                                const wellScore = Math.min(100, Math.max(5,
                                    (hasProduction ? 80 : hasReserves ? 55 : 20) +
                                    (10 - r.technical) * 2
                                ))
                                // Reservoir characterisation — linked to wells drilled + seismic
                                const reservoirScore = Math.min(100, Math.max(10,
                                    (hasProduction ? 75 : hasReserves ? 50 : 25) +
                                    (10 - r.technical) * 3 - (waterDepth > 100 ? 10 : 0)
                                ))
                                // Fluid sampling — requires production test data
                                const fluidScore = Math.min(100, Math.max(5,
                                    hasProduction ? 82 : hasReserves ? 48 : 18
                                ))
                                // Structural confidence — inversely correlated with tech risk
                                const structuralScore = Math.min(100, Math.max(15,
                                    (hasReserves ? 72 : hasProspective ? 44 : 28) +
                                    (10 - r.technical) * 2
                                ))

                                const dims: { label: string; score: number; note: string }[] = [
                                    { label: "Seismic Coverage", score: seismicScore, note: seismicScore >= 70 ? "3D acquired" : seismicScore >= 45 ? "2D / partial 3D" : "Sparse 2D only" },
                                    { label: "Well Control", score: wellScore, note: wellScore >= 70 ? "Multiple wells" : wellScore >= 45 ? "1–2 wells" : "Undrilled" },
                                    { label: "Reservoir Characterisation", score: reservoirScore, note: reservoirScore >= 70 ? "High confidence" : reservoirScore >= 45 ? "Moderate" : "Conceptual" },
                                    { label: "Fluid Sampling", score: fluidScore, note: fluidScore >= 70 ? "MDT / PVT available" : fluidScore >= 45 ? "Limited samples" : "No samples" },
                                    { label: "Structural Confidence", score: structuralScore, note: structuralScore >= 70 ? "Seismically defined" : structuralScore >= 45 ? "Depth-converted" : "Analogue-based" },
                                ]

                                const overallScore = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length)
                                const overallLabel = overallScore >= 70 ? "HIGH CONFIDENCE" : overallScore >= 45 ? "MODERATE" : "LOW — HIGH RISK"
                                const overallColor = overallScore >= 70 ? "text-emerald-600" : overallScore >= 45 ? "text-amber-600" : "text-red-500"
                                const overallBg = overallScore >= 70 ? "bg-emerald-50 border-emerald-100" : overallScore >= 45 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"

                                // Primary data gap note
                                const lowestDim = dims.reduce((a, b) => a.score < b.score ? a : b)
                                const gapNote = `Primary uncertainty: ${lowestDim.label.toLowerCase()} (${lowestDim.note.toLowerCase()})`

                                const barColor = (s: number) =>
                                    s >= 70 ? "bg-emerald-500" : s >= 45 ? "bg-amber-400" : "bg-red-400"
                                const labelColor = (s: number) =>
                                    s >= 70 ? "text-emerald-600" : s >= 45 ? "text-amber-600" : "text-red-500"
                                const confidenceLabel = (s: number) =>
                                    s >= 70 ? "High" : s >= 45 ? "Med" : "Low"

                                return (
                                    <div>
                                        <div className="h-px bg-gray-100 mb-6" />
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Subsurface Data Uncertainty</h4>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${overallBg} ${overallColor} uppercase tracking-wide`}>
                                                {overallLabel}
                                            </span>
                                        </div>

                                        {/* Score bars */}
                                        <div className="space-y-3">
                                            {dims.map((d) => (
                                                <div key={d.label}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[11px] text-slate-600 font-medium">{d.label}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] text-slate-400 italic">{d.note}</span>
                                                            <span className={`text-[9px] font-bold ${labelColor(d.score)} w-6 text-right`}>{confidenceLabel(d.score)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${barColor(d.score)}`}
                                                            style={{ width: `${d.score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Divider lines legend */}
                                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-[9px] text-slate-500">High ≥70</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                <span className="text-[9px] text-slate-500">Med 45–69</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                                <span className="text-[9px] text-slate-500">Low &lt;45</span>
                                            </div>
                                        </div>

                                        {/* Data gap callout */}
                                        <div className="mt-3 p-2.5 rounded bg-slate-50 border border-slate-100 flex items-start gap-2">
                                            <svg className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-[10px] text-slate-500 leading-relaxed">{gapNote}. Full data packages available in the NDR subsurface library.</p>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Development Timeline */}
                            {blockData.developmentPlan && (
                                <div>
                                    <div className="h-px bg-gray-100 mb-6" />
                                    <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Timeline</h4>
                                    <div className="relative border-l border-slate-200 ml-1.5 py-1 space-y-4">
                                        {blockData.developmentPlan.milestones.map((m, i) => (
                                            <div key={i} className="relative pl-4">
                                                <div className={`absolute left-[-4px] top-1.5 w-2 h-2 rounded-full border border-white ring-2 ring-white ${m.status === 'completed' ? 'bg-green-500' :
                                                    m.status === 'planned' ? 'bg-blue-500' : 'bg-amber-500'
                                                    }`} />
                                                <div className="flex flex-col">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-800">{m.year}</span>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wide ${m.status === 'completed' ? 'bg-green-50 text-green-700' :
                                                            m.status === 'planned' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                                                            }`}>{m.status}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-600 mt-0.5">{m.event}</span>
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
                                    <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Economics & Valuation</h4>
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="p-2 bg-emerald-50 rounded border border-emerald-100 text-center">
                                            <div className="text-[10px] text-slate-500 uppercase">NPV (10%)</div>
                                            <div className="text-sm font-bold text-emerald-700">${blockData.economics.npv10}M</div>
                                        </div>
                                        <div className="p-2 bg-emerald-50 rounded border border-emerald-100 text-center">
                                            <div className="text-[10px] text-slate-500 uppercase">IRR</div>
                                            <div className="text-sm font-bold text-emerald-700">{blockData.economics.irr}%</div>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded border border-slate-100 text-center">
                                            <div className="text-[10px] text-slate-500 uppercase">Break Even</div>
                                            <div className="text-sm font-bold text-slate-700">${blockData.economics.breakEvenPrice}</div>
                                        </div>
                                    </div>
                                    {/* Price Sensitivity Chart */}
                                    <div className="h-[140px] w-full bg-white border border-slate-100 rounded p-2">
                                        <div className="text-[10px] text-slate-400 mb-1 text-center">NPV Sensitivity to Oil Price</div>
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

                            <div className="h-px bg-gray-100" />

                            {/* Fiscal Terms Extended */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Fiscal Terms ({blockData.fiscalTerms.pscType})</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-2 bg-slate-50 rounded border border-slate-100 text-center">
                                        <div className="text-[10px] text-slate-500 uppercase">Royalty Rate</div>
                                        <div className="text-lg font-bold text-primary">{blockData.fiscalTerms.royaltyRate}%</div>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-100 text-center">
                                        <div className="text-[10px] text-slate-500 uppercase">Tax Rate</div>
                                        <div className="text-lg font-bold text-slate-700">{blockData.fiscalTerms.taxRate}%</div>
                                    </div>
                                    {blockData.fiscalTerms.costRecoveryCap && (
                                        <div className="p-2 bg-slate-50 rounded border border-slate-100 text-center">
                                            <div className="text-[10px] text-slate-500 uppercase">Cost Rec. Cap</div>
                                            <div className="text-sm font-bold text-slate-700">{blockData.fiscalTerms.costRecoveryCap}%</div>
                                        </div>
                                    )}
                                    <div className="p-2 bg-slate-50 rounded border border-slate-100 text-center">
                                        <div className="text-[10px] text-slate-500 uppercase">DMO</div>
                                        <div className="text-sm font-bold text-slate-700">{blockData.fiscalTerms.domesticMarketObligation}%</div>
                                    </div>
                                    {blockData.fiscalTerms.signatureBonus && (
                                        <div className="col-span-2 p-2 bg-blue-50 rounded border border-blue-100 flex justify-between items-center px-3">
                                            <div className="text-[10px] text-slate-600 uppercase font-medium">Signature Bonus</div>
                                            <div className="text-sm font-bold text-blue-700">${blockData.fiscalTerms.signatureBonus}M</div>
                                        </div>
                                    )}
                                    {blockData.fiscalTerms.localContentObligation && (
                                        <div className="col-span-2 p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center px-3">
                                            <div className="text-[10px] text-slate-500 uppercase">Local Content (TKDN)</div>
                                            <div className="text-sm font-bold text-slate-700">Min {blockData.fiscalTerms.localContentObligation}%</div>
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

function RiskBar({ label, value }: { label: string, value: number }) {
    // value 1-10
    const color = value <= 3 ? "bg-green-500" : value <= 6 ? "bg-amber-500" : "bg-red-500"
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium w-24">{label}</span>
            <div className="flex gap-0.5 flex-1 max-w-[180px]">
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className={`h-2 flex-1 rounded-[1px] ${i < value ? color : "bg-slate-100"
                            }`}
                    />
                ))}
            </div>
            <span className="w-6 text-right font-mono text-slate-400">{value}</span>
        </div>
    )
}

// Play-specific content
function PlayContent({ data, onNavigate }: { data: any, onNavigate: (type: PanelContext, data: any) => void }) {
    const samplePolygon = {
        name: "Prospect Alpha-12",
        facies: "Turbidite Sandstone",
        sand: "72%",
        interpreter: "Dr. Sarah Chen",
        evidence: "3D Seismic + 2 Wells",
        qc: "Peer-reviewed ✓",
    }
    const attributes = [
        { label: "Reservoir Type", value: data.reservoir || "Turbidite Channel", icon: "🏔️" },
        { label: "Maturity", value: data.maturity || "Emerging Play", icon: "📈" },
        { label: "Depositional Model", value: data.depositional || "Deep-water Fan", icon: "🌊" },
        { label: "Trap Style", value: data.trap || "Stratigraphic", icon: "🎯" },
        { label: "Play Success %", value: data.success || "42%", icon: "✓" },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-sm font-bold text-slate-900">{data.name || "Miocene Turbidite Play"}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-500">Prospects: 18</span>
                    <span className="w-px h-3 bg-gray-300" />
                    <span className="text-[10px] font-mono text-slate-500">Status: Active</span>
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Play Attributes - Grid */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3">Play Elements</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div className="text-slate-500">Reservoir</div>
                    <div className="font-mono text-slate-700 text-right">{data.reservoir || "Turbidite Channel"}</div>

                    <div className="text-slate-500">Maturity</div>
                    <div className="font-mono text-slate-700 text-right">{data.maturity || "Emerging"}</div>

                    <div className="text-slate-500">Trap Style</div>
                    <div className="font-mono text-slate-700 text-right">{data.trap || "Stratigraphic"}</div>

                    <div className="text-slate-500">Success Rate</div>
                    <div className="font-mono text-slate-700 text-right">{data.success || "42%"}</div>
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Volumetrics - Compact */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3">Volumetrics</h4>
                <div className="space-y-2">
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-xs text-slate-600">P50 Resources</span>
                        <span className="font-mono font-bold text-slate-900">3.2 Bboe</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-xs text-slate-600">Mean EMV</span>
                        <span className="font-mono font-bold text-slate-900">$1.8B</span>
                    </div>
                </div>
            </div>

            {/* Risks - List */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-2">Key Risks</h4>
                <ul className="space-y-1">
                    {["Reservoir quality uncertainty", "Charge timing constraints", "Limited well control"].map((risk, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <div className="w-1 h-1 rounded-full bg-amber-500" />
                            {risk}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Top Prospects Navigation - List */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3">Top Prospects</h4>
                <div className="space-y-1">
                    <div
                        onClick={() => onNavigate("polygon", samplePolygon)}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors group border border-transparent hover:border-slate-200"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-sm" />
                            <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">Alpha-12</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-400">2.4 km³</span>
                            <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-2 opacity-50 cursor-not-allowed">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-sm" />
                            <span className="text-xs font-medium text-slate-700">Beta-04</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">LOCKED</span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Seismic Viewer */}
            <SeismicViewer />
        </div>
    )
}

// Basin-specific content
function BasinContent({ data, onNavigate }: { data: any, onNavigate: (type: PanelContext, data: any) => void }) {
    const samplePlay = {
        name: "Miocene Deep-Water Play",
        reservoir: "Turbidite Channel Complex",
        maturity: "Emerging Play",
        depositional: "Submarine Fan System",
        trap: "Stratigraphic + Structural",
        success: "45%",
    }
    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div>
                <h3 className="text-sm font-bold text-slate-900">{data.name || "Offshore Basin A"}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-500">Area: 125,000 km²</span>
                    <span className="w-px h-3 bg-gray-300" />
                    <span className="text-[10px] text-slate-500">Passive Margin</span>
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Basin Attributes (Merged from SummarySheet) */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Basin Attributes</h4>
                <dl className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                        <dt className="text-slate-600">Basin Type</dt>
                        <dd className="font-mono font-medium text-slate-900">Passive Margin</dd>
                    </div>
                    <div className="flex justify-between items-center">
                        <dt className="text-slate-600">Setting</dt>
                        <dd className="font-mono font-medium text-slate-900">Offshore (Deep)</dd>
                    </div>
                    <div className="flex justify-between items-center">
                        <dt className="text-slate-600">Tech Success Rate</dt>
                        <dd className="font-mono font-bold text-primary">42%</dd>
                    </div>
                    <div className="flex justify-between items-center">
                        <dt className="text-slate-600">Comm. Success Rate</dt>
                        <dd className="font-mono font-bold text-amber-600">18%</dd>
                    </div>
                </dl>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Basin Metrics - Technical List */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Basin Statistics</h4>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">Total Discovered</span>
                        <div className="text-right">
                            <div className="font-mono font-bold text-slate-900">18.4 Bboe</div>
                            <div className="text-[10px] text-green-600">+12% YoY</div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">Yet-to-Find (Mean)</span>
                        <div className="text-right">
                            <div className="font-mono font-bold text-slate-900">22.1 Bboe</div>
                            <div className="text-[10px] text-slate-400">High Potential</div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">Wells Drilled</span>
                        <div className="text-right">
                            <div className="font-mono font-bold text-slate-900">247</div>
                            <div className="text-[10px] text-slate-400">43 Exploratory</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Key Companies (Merged from SummarySheet) */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Key Players</h4>
                <div className="flex flex-wrap gap-2">
                    {["TotalEnergies", "Shell", "Eni", "Pertamina", "ExxonMobil"].map(company => (
                        <span key={company} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-medium text-slate-600">
                            {company}
                        </span>
                    ))}
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Risks - Table style */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Regional Risks</h4>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Water Depth</span>
                        <span className="font-mono text-amber-600">Medium</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Political Stability</span>
                        <span className="font-mono text-green-600">Low Risk</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Infrastructure</span>
                        <span className="font-mono text-red-600">High Risk</span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-gray-200" />
        </div>
    )
}

// Well-specific content
// Reusable Attribute Table Component
function AttributeTable({ items }: { items: { label: string; value: any }[] }) {
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {items.map((item, idx) => (
                <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center text-xs py-3 px-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors bg-white"
                >
                    <span className="w-full sm:w-1/3 flex-none text-[10px] text-slate-500 uppercase tracking-wider mb-1 sm:mb-0">{item.label}</span>
                    <span className="flex-1 text-slate-700 text-xs break-words whitespace-normal">{String(item.value || "-")}</span>
                </div>
            ))}
        </div>
    )
}

// Documents & Reports Section
function DocumentsSection() {
    const docs = [
        { name: "Completion & Workover Report", type: "PDF", size: "1.0 MB", url: "/pdf/DURI05720 COMPLETION & WORKOVER PROG REPORT.pdf" },
        { name: "Downhole Well Log Report", type: "PDF", size: "1.1 MB", url: "/pdf/PDD-M01-156-Downhole Well Log Report.pdf" },
    ]

    return (
        <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
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
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-primary hover:shadow-md transition-all group relative overflow-hidden"
                    >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 transform -translate-x-1 group-hover:translate-x-0 transition-transform" />
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-red-50 transition-colors">
                                <FileText className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors truncate max-w-[200px]">{doc.name}</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase">{doc.type} • {doc.size}</div>
                            </div>
                        </div>
                        <FileDown className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                    </a>
                ))}
            </div>
        </div>
    )
}

// Well-specific content with tabs for Well Info and G&G Project Data
function WellDetailsContent({ data }: { data: any }) {
    const [activeTab, setActiveTab] = useState<"well-info" | "gng-data">("well-info")
    const [gngProjects, setGngProjects] = useState<any[]>([])
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

    // Fetch G&G projects when tab is selected
    useEffect(() => {
        if (activeTab === "gng-data" && data) {
            fetchGngProjects()
        }
    }, [activeTab, data])

    const fetchGngProjects = async () => {
        setLoading(true)
        try {
            // Fetch G&G projects from the GeoJSON file
            const response = await fetch('/data/GnG_Project_Data_Outlines.json')
            const geojsonData = await response.json()
            
            // Get all projects (or filter by well location if needed)
            const projects = geojsonData.features?.map((f: any) => ({
                ...f.properties,
                id: f.id || f.properties?.OBJECTID
            })) || []
            
            setGngProjects(projects)
        } catch (error) {
            console.error("Failed to fetch G&G projects:", error)
            setGngProjects([])
        } finally {
            setLoading(false)
        }
    }

    const wellItems = [
        { label: "Well ID", value: getAttr("IDENTIFICA") },
        { label: "Operator", value: getAttr("OPERATOR") },
        { label: "Type", value: getAttr("WELL_TYPE") },
        { label: "Status", value: getAttr("STATUS") },
        { label: "Result", value: getAttr("WELL_RESUL") },
        { label: "Depth", value: getAttr("END_DEPTH_") !== "-" ? `${getAttr("END_DEPTH_")}m` : "-" },
        { label: "Field", value: getAttr("FIELD_NAME") },
    ]

    const wellName = getAttr("IDENTIFICA");
    const wellType = getAttr("WELL_TYPE");
    const wellStatus = getAttr("STATUS");

    return (
        <div className="space-y-4 pb-10">
            {/* Tabs */}
            <div className="flex items-center gap-1 pb-1">
                <button
                    onClick={() => setActiveTab("well-info")}
                    className={`flex-1 justify-center py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-2 transition-all border ${activeTab === "well-info"
                        ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                        : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                >
                    Well Info
                </button>
                <button
                    onClick={() => setActiveTab("gng-data")}
                    className={`flex-1 justify-center py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-2 transition-all border ${activeTab === "gng-data"
                        ? "bg-green-600 border-green-600 text-white shadow-sm"
                        : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                >
                    G&G Project Data
                </button>
            </div>
            <div className="h-px bg-gray-100 w-full" />

            {/* Well Info Tab */}
            {activeTab === "well-info" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Active Well Selection</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3 truncate">
                            {wellName !== "-" ? wellName : "Well Properties"}
                        </h3>
                        <div className="flex items-center gap-2">
                            {wellType !== "-" && (
                                <span className="px-2 py-1 bg-slate-900 text-white text-[10px] font-medium rounded">
                                    {wellType}
                                </span>
                            )}
                            {wellStatus !== "-" && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium rounded">
                                    {wellStatus}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5" />
                            Asset Attributes
                        </h4>
                        <AttributeTable items={wellItems} />
                    </div>

                    <div className="h-px bg-slate-100" />
                    <DocumentsSection />
                    <div className="h-px bg-slate-100" />
                    <SeismicViewer />
                </div>
            )}

            {/* G&G Project Data Tab */}
            {activeTab === "gng-data" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">G&G Project Data</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1 truncate">
                            {wellName !== "-" ? wellName : "Associated Projects"}
                        </h3>
                        <p className="text-xs text-slate-500">Netherlands data with summary from attributes table</p>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : gngProjects.length > 0 ? (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
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
                                        <div key={project.id || index} className="p-3 bg-slate-50 rounded border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {logoUrl && (
                                                        <img 
                                                            src={logoUrl} 
                                                            alt={project.APPLICATION_NAME || ""}
                                                            className="w-6 h-6 rounded object-contain"
                                                        />
                                                    )}
                                                    <span className="font-semibold text-sm text-slate-800">
                                                        {project.PROJECT_NAME || "Unnamed Project"}
                                                    </span>
                                                </div>
                                                {project.INTERPRETATION_YEAR && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                                        {project.INTERPRETATION_YEAR}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pl-8">
                                                {project.APPLICATION_NAME && (
                                                    <div>
                                                        <span className="text-slate-400">App: </span>
                                                        {project.APPLICATION_NAME}
                                                    </div>
                                                )}
                                                {project.NO_OF_WELLS !== undefined && (
                                                    <div>
                                                        <span className="text-slate-400">Wells: </span>
                                                        {project.NO_OF_WELLS}
                                                    </div>
                                                )}
                                                {project.NO_OF_REPORTS !== undefined && (
                                                    <div>
                                                        <span className="text-slate-400">Reports: </span>
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

                    <div className="h-px bg-slate-100" />
                    <DocumentsSection />
                </div>
            )}
        </div>
    )
}

// Field-specific content
function FieldDetailsContent({ data }: { data: any }) {
    // Case-insensitive attribute getter
    const getAttr = (key: string) => {
        if (!data) return "-";
        const actualKey = Object.keys(data).find(k => k.toLowerCase() === key.toLowerCase());
        if (actualKey && data[actualKey] !== undefined && data[actualKey] !== null && String(data[actualKey]).trim() !== "") {
            return String(data[actualKey]);
        }
        return "-";
    };

    const fieldItems = [
        { label: "Field Name", value: getAttr("FIELD_NAME") },
        { label: "Operator", value: getAttr("OPERATOR") },
        { label: "Status", value: getAttr("STATUS") },
        { label: "Result", value: getAttr("RESULT") },
        { label: "Discovery", value: getAttr("DISCOVERY_") },
        { label: "Type", value: getAttr("LANDSEA") },
    ]

    const fieldName = getAttr("FIELD_NAME");
    const resultStatus = getAttr("RESULT");
    const fieldStatus = getAttr("STATUS");

    return (
        <div className="space-y-6 pb-10">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Selected Field Overview</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3 truncate">
                    {fieldName !== "-" ? fieldName : "Field Properties"}
                </h3>
                <div className="flex items-center gap-2">
                    {resultStatus !== "-" && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-medium rounded">
                            {resultStatus}
                        </span>
                    )}
                    {fieldStatus !== "-" && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium rounded">
                            {fieldStatus}
                        </span>
                    )}
                </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    Field Attributes
                </h4>
                <AttributeTable items={fieldItems} />
            </div>

            <div className="h-px bg-slate-100" />
            <DocumentsSection />
            <div className="h-px bg-slate-100" />
            <SeismicViewer />
        </div>
    )
}



// License-specific content
function LicenseDetailsContent({ data }: { data: any }) {
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
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">License Information</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3 truncate">
                    {licenseName !== "-" ? licenseName : "License Properties"}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                    {licenseType !== "-" && (
                        <span className={`px-2 py-1 text-[10px] font-medium rounded border ${typeColors[licenseType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            {typeLabels[licenseType] || licenseType}
                        </span>
                    )}
                    {licenseStatus !== "-" && (
                        <span className={`px-2 py-1 text-[10px] font-medium rounded border ${statusColors[licenseStatus] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            {licenseStatus}
                        </span>
                    )}
                    {licenseResource !== "-" && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-medium rounded">
                            {licenseResource}
                        </span>
                    )}
                </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    License Attributes
                </h4>
                <AttributeTable items={licenseItems} />
            </div>

            <div className="h-px bg-slate-100" />
            <DocumentsSection />
            <div className="h-px bg-slate-100" />
            <SeismicViewer />
        </div>
    )
}

// G&G Project-specific content - no tabs, prominent app card
function GNGProjectContent({ data, onToggle3D, onViewGNGData }: { data: any, onToggle3D?: () => void, onViewGNGData?: () => void }) {
    // Handle both direct properties and nested properties (GeoJSON format)
    const props = data?.properties || data || {};

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
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                    {logoUrl ? (
                        <img src={logoUrl} alt={appName} className="w-12 h-12 rounded object-contain bg-white p-1 border border-slate-200" />
                    ) : (
                        <div className="w-12 h-12 rounded bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                            {projectName.charAt(0) || "G"}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-slate-900 truncate">{projectName !== "-" ? projectName : "Project"}</h3>
                            {year !== "-" && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 border border-green-200 text-xs font-medium rounded shrink-0">
                                    {year}
                                </span>
                            )}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                            {appName !== "-" && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400">App:</span>
                                    <span className="font-medium text-slate-700">{appName}</span>
                                </div>
                            )}
                            {wells !== "-" && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400">Wells:</span>
                                    <span className="font-medium text-slate-700">{wells}</span>
                                </div>
                            )}
                            {reports !== "-" && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400">Reports:</span>
                                    <span className="font-medium text-slate-700">{reports}</span>
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

            <div className="h-px bg-slate-100" />

            {/* Project Attributes Table */}
            <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    Project Attributes
                </h4>
                <AttributeTable items={projectItems} />
            </div>
        </div>
    );
}

// Seismic 2D Line-specific content
function Seismic2DContent({ data }: { data: any }) {
    const getAttr = (key: string) => {
        if (!data) return "-";
        const actualKey = Object.keys(data).find(k => k.toLowerCase() === key.toLowerCase());
        if (actualKey && data[actualKey] !== undefined && data[actualKey] !== null && String(data[actualKey]).trim() !== "") {
            return String(data[actualKey]);
        }
        return "-";
    };

    const lineItems = [
        { label: "Line Name", value: getAttr("line_name") },
        { label: "Survey Collection", value: getAttr("survey_col") },
        { label: "Line Collection", value: getAttr("line_colle") },
        { label: "Delivery", value: getAttr("delivery_c") },
    ];

    const lineName = getAttr("line_name");
    const survey = getAttr("survey_col");
    const delivery = getAttr("delivery_c");

    return (
        <div className="space-y-6 pb-10">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Seismic 2D Survey Line</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3 truncate">{lineName !== "-" ? lineName : "Line Properties"}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                    {survey !== "-" && <span className="px-2 py-1 bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-medium rounded">{survey}</span>}
                    {delivery !== "-" && <span className="px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium rounded">{delivery}</span>}
                </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5"><Database className="w-3.5 h-3.5" />Line Attributes</h4>
                <AttributeTable items={lineItems} />
            </div>
            <div className="h-px bg-slate-100" />
            <DocumentsSection />
            <div className="h-px bg-slate-100" />
            <SeismicViewer />
        </div>
    );
}
