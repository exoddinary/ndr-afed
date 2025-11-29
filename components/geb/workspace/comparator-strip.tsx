"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Basin = {
  name: string
  region: string
}

type ComparisonMetric = {
  label: string
  current: number
  compared: number
  unit: string
}

export function ComparatorStrip() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [comparedBasins, setComparedBasins] = useState<Basin[]>([
    { name: "Orange Basin", region: "South Africa" },
    { name: "Santos Basin", region: "Brazil" },
  ])

  const basinLibrary: Basin[] = [
    { name: "Orange Basin", region: "South Africa" },
    { name: "Guyana Basin", region: "Suriname" },
    { name: "Santos Basin", region: "Brazil" },
    { name: "MSGBC", region: "West Africa" },
    { name: "Campos Basin", region: "Brazil" },
  ]

  const metrics: ComparisonMetric[] = [
    { label: "Tech Success", current: 61, compared: 45, unit: "%" },
    { label: "Comm Success", current: 38, compared: 28, unit: "%" },
    { label: "YTF Mean", current: 12.8, compared: 8.2, unit: "Bboe" },
    { label: "Gov Take", current: 68, compared: 45, unit: "%" },
    { label: "Breakeven", current: 43, compared: 38, unit: "$/bbl" },
  ]

  const removeBasin = (index: number) => {
    setComparedBasins(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div
      className={cn(
        "bg-white border-t border-gray-200 transition-all duration-300 relative z-10",
        isExpanded ? "h-[120px]" : "h-[32px]"
      )}
    >
      {/* Header Bar - Always Visible */}
      <div className="h-[32px] flex items-center justify-between px-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:text-teal-600 transition-colors"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Basin Comparator
            </span>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          
          {comparedBasins.length > 0 && !isExpanded && (
            <div className="flex items-center gap-1">
              {comparedBasins.map((basin, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-teal-50 border border-teal-200 rounded text-[10px] text-teal-700 font-medium"
                >
                  {basin.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {comparedBasins.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-gray-100 text-gray-600"
            title="Export to PowerPoint"
          >
            <Download className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="h-[88px] flex gap-3 px-4 py-2 overflow-x-auto">
          {/* Drag Basin Library */}
          <div className="flex-none w-[180px] border border-gray-200 rounded-lg p-2 bg-gray-50">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
              Global Basins
            </div>
            <div className="space-y-1">
              {basinLibrary.slice(0, 3).map((basin, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!comparedBasins.find(b => b.name === basin.name)) {
                      setComparedBasins(prev => [...prev, basin])
                    }
                  }}
                  className="w-full text-left px-2 py-1 text-[10px] rounded border border-gray-300 bg-white hover:bg-teal-50 hover:border-teal-300 transition-colors"
                >
                  <div className="font-medium text-slate-700">{basin.name}</div>
                  <div className="text-slate-500">{basin.region}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-2 text-[10px] font-bold uppercase text-slate-500">Metric</th>
                  <th className="text-right p-2 text-[10px] font-bold uppercase text-slate-500">
                    Current
                  </th>
                  {comparedBasins.map((basin, i) => (
                    <th key={i} className="text-right p-2 text-[10px] font-bold uppercase text-teal-600 relative group">
                      <div className="flex items-center justify-end gap-1">
                        <span className="truncate max-w-[80px]">{basin.name}</span>
                        <button
                          onClick={() => removeBasin(i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 hover:text-red-500" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="p-2 text-slate-600 font-medium">{metric.label}</td>
                    <td className="p-2 text-right font-mono text-slate-900 font-bold">
                      {metric.current}{metric.unit}
                    </td>
                    {comparedBasins.map((_, j) => (
                      <td key={j} className="p-2 text-right font-mono text-slate-600">
                        {metric.compared}{metric.unit}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
