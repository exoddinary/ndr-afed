"use client"

import { X, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"

// Define types for different panel contexts
export type PanelContext = "polygon" | "play" | "basin" | null

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
}

export function ContextualPanel({ isOpen, context, onClose, onNavigate, onAddToCompare }: ContextualPanelProps) {
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
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${isOpen && isAnimating ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={handleClose}
            />

            {/* Sliding Panel */}
            <div
                className={`fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen && isAnimating ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="h-8 flex items-center justify-between px-3 border-b border-gray-200 bg-gray-50">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {context.type === "polygon" && "Block Investment Details"}
                        {context.type === "play" && "Play Analysis"}
                        {context.type === "basin" && "Basin Overview"}
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
                <div className="h-[calc(100%-2rem)] overflow-y-auto bg-white p-3 space-y-6">
                    {context.type === "polygon" && <BlockDetailsContent data={context.data} onAddToCompare={onAddToCompare} />}
                    {context.type === "play" && <PlayContent data={context.data} onNavigate={onNavigate} />}
                    {context.type === "basin" && <BasinContent data={context.data} onNavigate={onNavigate} />}
                </div>
            </div>
        </>
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
import { Plus, Box } from "lucide-react"

// Block-specific content (formerly PolygonContent)
function BlockDetailsContent({ data, onAddToCompare }: { data: any, onAddToCompare?: (id: string) => void }) {
    // Try to find mock data matching the clicked block name, or default to one for demo
    const blockName = data.name || "Mahakam Delta"
    // Simple fuzzy match or default
    const blockData = Object.values(MOCK_BLOCKS).find(b => b.name === blockName) || MOCK_BLOCKS["Mahakam Delta"]

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{blockData.name}</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => console.log("Switch to 3D View")}
                            className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded border border-indigo-200 hover:bg-indigo-100 transition-colors"
                            title="View Platform in 3D"
                        >
                            <Box className="w-3 h-3" />
                            3D View
                        </button>
                        <button
                            onClick={() => onAddToCompare?.(blockData.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 text-[10px] font-bold uppercase rounded border border-teal-200 hover:bg-teal-100 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            Compare
                        </button>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${blockData.status === 'Production' ? 'bg-green-100 text-green-700' :
                            blockData.status === 'Active Exploration' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-600'
                            }`}>
                            {blockData.status}
                        </span>
                    </div>
                </div>
                <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Operator</span>
                        <span className="font-medium text-slate-900">{blockData.operator}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Expiry</span>
                        <span className="font-mono text-slate-700">{blockData.expiryDate}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Acreage</span>
                        <span className="font-mono text-slate-700">{blockData.acreageSqKm.toLocaleString()} km²</span>
                    </div>
                </div>
                <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600 italic border border-slate-100">
                    "{blockData.description}"
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Resources Table */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3">Resources & Reserves</h4>
                <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-2 py-1 text-left">Category</th>
                                <th className="px-2 py-1 text-right">Oil (MMbbl)</th>
                                <th className="px-2 py-1 text-right">Gas (Bcf)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {blockData.resources.oilReserves2P || blockData.resources.gasReserves2P ? (
                                <tr>
                                    <td className="px-2 py-1.5 font-medium text-slate-700">2P Reserves</td>
                                    <td className="px-2 py-1.5 text-right font-mono">{blockData.resources.oilReserves2P || "-"}</td>
                                    <td className="px-2 py-1.5 text-right font-mono">{blockData.resources.gasReserves2P || "-"}</td>
                                </tr>
                            ) : null}
                            {blockData.resources.contingentOil || blockData.resources.contingentGas ? (
                                <tr>
                                    <td className="px-2 py-1.5 font-medium text-slate-700">2C Resources</td>
                                    <td className="px-2 py-1.5 text-right font-mono">{blockData.resources.contingentOil || "-"}</td>
                                    <td className="px-2 py-1.5 text-right font-mono">{blockData.resources.contingentGas || "-"}</td>
                                </tr>
                            ) : null}
                            <tr>
                                <td className="px-2 py-1.5 font-medium text-slate-700">Prospective (Mean)</td>
                                <td className="px-2 py-1.5 text-right font-mono">{blockData.resources.prospectiveOilMean || "-"}</td>
                                <td className="px-2 py-1.5 text-right font-mono">{blockData.resources.prospectiveGasMean || "-"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Fiscal Terms */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3">Fiscal Terms ({blockData.fiscalTerms.pscType})</h4>
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
                        <div className="p-2 bg-slate-50 rounded border border-slate-100 text-center col-span-2">
                            <div className="text-[10px] text-slate-500 uppercase">Cost Recovery Cap</div>
                            <div className="text-sm font-bold text-slate-700">{blockData.fiscalTerms.costRecoveryCap}%</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Infrastructure */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3">Infrastructure & Logistics</h4>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Nearest Pipeline</span>
                        <span className="font-mono font-medium">{blockData.infrastructure.nearestPipelineKm} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Nearest Rig Availability</span>
                        <span className="font-mono font-medium">{blockData.infrastructure.nearestRigKm} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Water Depth</span>
                        <span className="font-mono font-medium">{blockData.infrastructure.waterDepth} m</span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Risk Profile */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3">Risk Assessment</h4>
                <div className="space-y-2">
                    <RiskBar label="Technical" value={blockData.risks.technical} />
                    <RiskBar label="Commercial" value={blockData.risks.commercial} />
                    <RiskBar label="Political" value={blockData.risks.political} />
                    <RiskBar label="Regulatory" value={blockData.risks.regulatory} />
                </div>
            </div>
        </div>
    )
}

function RiskBar({ label, value }: { label: string, value: number }) {
    // value 1-10
    const color = value <= 3 ? "bg-green-500" : value <= 6 ? "bg-amber-500" : "bg-red-500"
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-20 text-slate-600">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${value * 10}%` }} />
            </div>
            <span className="w-4 text-right font-mono text-slate-400">{value}</span>
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
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-sm font-bold text-slate-900">{data.name || "Offshore Basin A"}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-500">Area: 125,000 km²</span>
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Basin Metrics - Technical List */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3">Basin Statistics</h4>
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

            {/* Risks - Table style */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3">Regional Risks</h4>
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

            {/* Active Plays - Chips */}
            <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3">Active Plays</h4>
                <div className="flex flex-wrap gap-2">
                    {["Turbidite", "Carbonate", "Reef", "Deltaic", "Channel"].map((play) => (
                        <button
                            key={play}
                            onClick={() => onNavigate("play", samplePlay)}
                            className="px-2 py-1 bg-white text-slate-600 text-[10px] font-medium uppercase tracking-wide border border-slate-200 hover:border-teal-500 hover:text-teal-700 transition-colors"
                        >
                            {play}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Seismic Viewer */}
            <SeismicViewer />
        </div>
    )
}

// Helper components - Removed unused MetricCard, RiskItem, VolumeBar

