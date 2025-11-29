"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"

type MetricItem = {
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  clickable?: boolean
}

type DomainSection = {
  id: number
  title: string
  color: string
  metrics: MetricItem[]
}

export function FiveDomainCockpit() {
  const handleMetricClick = (domain: string, metric: MetricItem, event: React.MouseEvent) => {
    if (!metric.clickable) return
    
    // Dispatch custom event for explanation ribbon
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const explanationEvent = new CustomEvent('show-explanation', {
      detail: {
        value: `${metric.value}${metric.unit || ''}`,
        label: metric.label,
        source: `Rystad UCube (04-25) + Namibian PSA 2024`,
        date: `24 Oct 2024`,
        calculation: `(Sum of discoveries / Total wells) × 100\n= (43 / 71) × 100 = ${metric.value}${metric.unit || ''}`,
        position: { x: rect.left, y: rect.bottom }
      }
    })
    window.dispatchEvent(explanationEvent)
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-emerald-500" />
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-500" />
    if (trend === 'stable') return <Minus className="w-3 h-3 text-slate-400" />
    return null
  }

  const domains: DomainSection[] = [
    {
      id: 1,
      title: "ATTRIBUTES",
      color: "border-l-blue-500",
      metrics: [
        { label: "Tech Success", value: 61, unit: "%", trend: 'up', clickable: true },
        { label: "Comm Success", value: 38, unit: "%", trend: 'stable', clickable: true },
        { label: "Maturity", value: "Emerging", clickable: true },
      ]
    },
    {
      id: 2,
      title: "PETROL SYSTEM",
      color: "border-l-green-500",
      metrics: [
        { label: "Source VRo", value: "0.9-2.1", unit: "%", clickable: true },
        { label: "Charge Focus", value: "Proven", clickable: true },
        { label: "Play Diversity", value: 84, unit: "%", trend: 'up', clickable: true },
      ]
    },
    {
      id: 3,
      title: "OPERATION",
      color: "border-l-amber-500",
      metrics: [
        { label: "WD Range", value: "200-2400", unit: "m", clickable: true },
        { label: "HPHT Risk", value: "Low", clickable: true },
        { label: "Avg Campaign", value: 92, unit: " days", clickable: true },
      ]
    },
    {
      id: 4,
      title: "VOLUMETRICS",
      color: "border-l-purple-500",
      metrics: [
        { label: "Discovered", value: 8.2, unit: " Bboe", clickable: true },
        { label: "YTF Mean", value: 12.8, unit: " Bboe", trend: 'up', clickable: true },
        { label: "2C Remaining", value: 4.1, unit: " Bboe", clickable: true },
      ]
    },
    {
      id: 5,
      title: "ECONOMICS",
      color: "border-l-red-500",
      metrics: [
        { label: "Gov Take", value: 68, unit: "%", clickable: true },
        { label: "Breakeven", value: 43, unit: " $/bbl", trend: 'down', clickable: true },
        { label: "NPV10", value: "@60$", clickable: true },
        { label: "IRR", value: "+2.3", unit: " B$", trend: 'up', clickable: true },
      ]
    }
  ]

  return (
    <div className="w-[250px] flex flex-col bg-white border-l border-gray-200 h-full flex-shrink-0">
      {/* Header */}
      <div className="h-8 flex items-center px-3 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Live Cockpit
        </span>
        <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live updates active" />
      </div>

      {/* Scrollable Domains */}
      <div className="flex-1 overflow-y-auto">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className={`border-b border-gray-200 last:border-b-0 ${domain.color} border-l-4`}
          >
            {/* Domain Header */}
            <div className="px-3 py-2 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-600">
                  {domain.id} {domain.title}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="px-3 py-2 space-y-2.5">
              {domain.metrics.map((metric, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleMetricClick(domain.title, metric, e)}
                  className={`w-full text-left group ${metric.clickable ? 'cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1' : 'cursor-default'}`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                      {metric.label}
                    </span>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div className={`text-sm font-bold font-mono flex items-baseline gap-1 ${
                    metric.clickable ? 'text-slate-900 group-hover:text-teal-600' : 'text-slate-700'
                  }`}>
                    <span>{metric.value}</span>
                    {metric.unit && (
                      <span className="text-[10px] font-normal text-slate-500">{metric.unit}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer - Update Timestamp */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
        <div className="text-[9px] text-slate-500 flex items-center justify-between">
          <span>Last Update</span>
          <span className="font-mono text-slate-600">2.3s ago</span>
        </div>
        <div className="text-[8px] text-slate-400 mt-0.5">
          Auto-recalc on polygon edit
        </div>
      </div>
    </div>
  )
}
