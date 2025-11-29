"use client"

import { useState, useEffect } from "react"
import { X, Edit3, Database, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

type ExplanationData = {
  value: string
  label: string
  source: string
  date: string
  calculation: string
  position: { x: number; y: number }
}

export function ExplanationRibbon() {
  const [explanation, setExplanation] = useState<ExplanationData | null>(null)
  const [isOverrideMode, setIsOverrideMode] = useState(false)
  const [overrideValue, setOverrideValue] = useState("")

  // Example: This would be triggered by clicking any metric in the cockpit
  // For now, we'll expose a function that can be called from parent
  useEffect(() => {
    // Listen for custom events from cockpit clicks
    const handleExplainClick = (e: CustomEvent<ExplanationData>) => {
      setExplanation(e.detail)
      setIsOverrideMode(false)
      setOverrideValue(e.detail.value)
    }

    window.addEventListener('show-explanation' as any, handleExplainClick as any)
    return () => {
      window.removeEventListener('show-explanation' as any, handleExplainClick as any)
    }
  }, [])

  if (!explanation) return null

  return (
    <div
      className="fixed bg-white/95 backdrop-blur-md border border-gray-300 rounded-lg shadow-2xl z-50 p-3 min-w-[380px] max-w-[420px]"
      style={{
        left: `${explanation.position.x}px`,
        top: `${explanation.position.y}px`,
        transform: 'translate(-50%, 10px)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-700 mb-0.5">{explanation.label}</div>
          <div className="text-lg font-mono font-bold text-teal-600">{explanation.value}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-gray-100 text-gray-500 -mt-1 -mr-1"
          onClick={() => setExplanation(null)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Data Provenance */}
      <div className="space-y-2 text-xs mb-3">
        <div className="flex items-start gap-2">
          <Database className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Source</div>
            <div className="text-slate-700">{explanation.source}</div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Calendar className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Date</div>
            <div className="text-slate-700">{explanation.date}</div>
          </div>
        </div>

        <div className="pt-1 border-t border-gray-200">
          <div className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">
            Calculation
          </div>
          <div className="text-slate-700 font-mono text-[11px] bg-gray-50 p-2 rounded border border-gray-200">
            {explanation.calculation}
          </div>
        </div>
      </div>

      {/* Override Section */}
      {!isOverrideMode ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
          onClick={() => setIsOverrideMode(true)}
        >
          <Edit3 className="w-3 h-3 mr-1.5" />
          Override Value
        </Button>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={overrideValue}
            onChange={(e) => setOverrideValue(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-teal-500 font-mono"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1 h-7 text-xs bg-teal-600 hover:bg-teal-700"
              onClick={() => {
                // Handle override save
                console.log('Override saved:', overrideValue)
                setExplanation(null)
              }}
            >
              Save Override
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => {
                setIsOverrideMode(false)
                setOverrideValue(explanation.value)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Arrow pointer */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-300 rotate-45" />
    </div>
  )
}
