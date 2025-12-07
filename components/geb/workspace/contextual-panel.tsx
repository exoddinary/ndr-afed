"use client"

import { X, ChevronRight, FileDown } from "lucide-react"
import { useState, useEffect } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Define types for different panel contexts
export type PanelContext = "polygon" | "play" | "basin" | "well" | null

export type ContextualData = {
    type: PanelContext
    data: any
}

type ContextualPanelProps = {
    isOpen: boolean
    context: ContextualData | null
    onClose: () => void
    onNavigate: (type: PanelContext, data: any) => void
    onAddToCompare?: (blockId: string) => void
    onToggle3D?: () => void
    onViewSubsurface?: (blockId: string) => void
}

export function ContextualPanel({ isOpen, context, onClose, onNavigate, onAddToCompare, onToggle3D, onViewSubsurface }: ContextualPanelProps) {
    const [isAnimating, setIsAnimating] = useState(false)

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
                        {context.type === "well" && "Well Information"}
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
                        />
                    )}
                    {context.type === "play" && <PlayContent data={context.data} onNavigate={onNavigate} />}
                    {context.type === "basin" && <BasinContent data={context.data} onNavigate={onNavigate} />}
                    {context.type === "well" && <WellDetailsContent data={context.data} />}
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
import { Plus, Box, Phone, Mail, Building2, LayoutDashboard, Layers, DollarSign, Lock, ExternalLink } from "lucide-react"
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
    onViewSubsurface
}: {
    data: any,
    onAddToCompare?: (id: string) => void,
    onToggle3D?: () => void,
    onViewSubsurface?: (blockName: string) => void
}) {
    // Try to find mock data matching the clicked block name
    const blockName = data.name || "Mahakam Delta"
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
                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-sm border border-indigo-200 transition-colors"
                        title="View Platform in 3D"
                    >
                        <Box className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onAddToCompare?.(blockData.id)}
                        className="p-2 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-sm border border-teal-200 transition-colors"
                        title="Add to Compare"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onViewSubsurface?.(blockName)}
                        className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-sm border border-amber-200 transition-colors flex items-center gap-2"
                        title="View in Subsurface"
                    >
                        <Layers className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">View Subsurface</span>
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
                                ? "bg-white border-teal-600 text-teal-700 shadow-sm"
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
                                <Mail className="w-5 h-5 text-teal-400" />
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
                                                    tickLine={false}
                                                    tick={{ fontSize: 9, fill: '#64748b' }}
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
                                        <div className="text-lg font-bold text-teal-600">{blockData.fiscalTerms.royaltyRate}%</div>
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
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-sm" />
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
                        <dd className="font-mono font-bold text-teal-600">42%</dd>
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
function WellDetailsContent({ data }: { data: any }) {
    // Placeholder data mixed with real data
    const wellData = {
        name: data.name || "Unknown Well",
        field: data.field || "Unknown Field",
        operator: data.operator || "Unknown Operator",
        status: data.status || "Unknown",
        spudDate: "2023-05-15",
        completionDate: "2023-08-20",
        wellType: "Exploration",
        totalDepth: "3,450 m",
        waterDepth: "120 m",
        rigName: "Deepsea Challenger",
        result: "Oil & Gas Discovery",
        coordinates: "2° 15' 30\" N, 117° 45' 10\" E"
    }

    const handleExportPDF = () => {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.setTextColor(40, 40, 40)
        doc.text("Well Report", 14, 22)

        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30)

        // Well Details Table
        autoTable(doc, {
            startY: 40,
            head: [['Attribute', 'Value']],
            body: [
                ['Well Name', wellData.name],
                ['Field', wellData.field],
                ['Operator', wellData.operator],
                ['Status', wellData.status],
                ['Well Type', wellData.wellType],
                ['Spud Date', wellData.spudDate],
                ['Completion Date', wellData.completionDate],
                ['Total Depth', wellData.totalDepth],
                ['Water Depth', wellData.waterDepth],
                ['Rig Name', wellData.rigName],
                ['Result', wellData.result],
                ['Coordinates', wellData.coordinates],
            ],
            theme: 'grid',
            headStyles: { fillColor: [13, 148, 136] }, // Teal-600
            styles: { fontSize: 10, cellPadding: 4 },
        })

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages()
        doc.setFontSize(8)
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.text('Indonesia VDR - Confidential', 14, doc.internal.pageSize.height - 10)
        }

        doc.save(`${wellData.name.replace(/\s+/g, '_')}_Report.pdf`)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{wellData.name}</h3>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-wider rounded border border-teal-200 hover:bg-teal-100 transition-colors"
                    >
                        <FileDown className="w-3.5 h-3.5" />
                        Export Report
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm ${wellData.status === 'Active' ? 'bg-green-100 text-green-700' :
                            wellData.status === 'Suspended' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-600'
                        }`}>
                        {wellData.status}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{wellData.field} Field</span>
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Key Information Grid */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">General Information</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs">
                    <div>
                        <span className="block text-slate-500 mb-1">Operator</span>
                        <span className="font-medium text-slate-900">{wellData.operator}</span>
                    </div>
                    <div>
                        <span className="block text-slate-500 mb-1">Well Type</span>
                        <span className="font-medium text-slate-900">{wellData.wellType}</span>
                    </div>
                    <div>
                        <span className="block text-slate-500 mb-1">Spud Date</span>
                        <span className="font-medium text-slate-900">{wellData.spudDate}</span>
                    </div>
                    <div>
                        <span className="block text-slate-500 mb-1">Completion Date</span>
                        <span className="font-medium text-slate-900">{wellData.completionDate}</span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Technical Data */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Technical Data</h4>
                <div className="bg-slate-50 rounded border border-slate-100 p-3 space-y-3 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-600">Total Depth (MD)</span>
                        <span className="font-mono font-medium text-slate-900">{wellData.totalDepth}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Water Depth</span>
                        <span className="font-mono font-medium text-slate-900">{wellData.waterDepth}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Rig Name</span>
                        <span className="font-medium text-slate-900">{wellData.rigName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Result</span>
                        <span className="font-medium text-teal-700">{wellData.result}</span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Location */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Location</h4>
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span className="font-mono">{wellData.coordinates}</span>
                </div>
            </div>

            {/* Seismic Viewer Reuse */}
            <div className="pt-2">
                <SeismicViewer />
            </div>
        </div>
    )
}
