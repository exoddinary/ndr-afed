"use client"

import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3 } from "lucide-react"

export default function AnalysisModal() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Detailed Well Analysis - Sinsing-1
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-3 overflow-y-auto pr-4 -mr-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-2.5 rounded-md">
            <h3 className="font-medium text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">RESERVOIR QUALITY</h3>
            <div className="text-lg font-semibold text-green-600">Excellent</div>
            <p className="text-xs text-muted-foreground mt-1">Jurassic sandstone with high porosity</p>
          </Card>
          <Card className="p-2.5 rounded-md">
            <h3 className="font-medium text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">EXPLORATION RISK</h3>
            <div className="text-lg font-semibold text-amber-600">Low-Medium</div>
            <p className="text-xs text-muted-foreground mt-1">Favorable structural position</p>
          </Card>
        </div>

        {/* Cluster Analysis Chart */}
        <Card className="p-3 rounded-md">
          <h3 className="font-semibold text-sm mb-2">Risk vs Potential Analysis</h3>
          <div className="relative h-56 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-md p-3">
            {/* Chart axes */}
            <div className="absolute bottom-4 left-4 right-4 h-px bg-slate-300 dark:bg-slate-700"></div>
            <div className="absolute bottom-4 left-4 top-4 w-px bg-slate-300 dark:bg-slate-700"></div>
            
            {/* Axis labels */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground">
              Exploration Risk →
            </div>
            <div className="absolute left-1 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-muted-foreground">
              ← Potential Value
            </div>

            {/* Quadrant labels */}
            <div className="absolute top-4 left-4 text-[10px] font-medium text-red-500">High Risk, Low Value</div>
            <div className="absolute top-4 right-4 text-[10px] font-medium text-amber-500">High Risk, High Value</div>
            <div className="absolute bottom-10 left-4 text-[10px] font-medium text-blue-500">Low Risk, Low Value</div>
            <div className="absolute bottom-10 right-4 text-[10px] font-medium text-green-500">Low Risk, High Value</div>

            {/* Data points */}
            <div className="absolute bottom-16 right-20 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg">
              <div className="absolute -top-6 -left-4 text-[10px] font-medium whitespace-nowrap">Sinsing-1</div>
            </div>
            
            {/* Other wells for comparison */}
            <div className="absolute bottom-24 left-16 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
            <div className="absolute top-20 right-32 w-2 h-2 bg-red-400 rounded-full opacity-60"></div>
            <div className="absolute top-32 left-24 w-2 h-2 bg-red-400 rounded-full opacity-60"></div>
            <div className="absolute bottom-32 right-16 w-2 h-2 bg-amber-400 rounded-full opacity-60"></div>
          </div>
        </Card>

        {/* Technical Details */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-2.5 rounded-md">
            <h3 className="font-semibold text-sm mb-2">Geological Parameters</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formation Age:</span>
                <span>Jurassic</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rock Type:</span>
                <span>Sandstone</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Porosity:</span>
                <span className="text-green-500">18-22%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Permeability:</span>
                <span className="text-green-500">150-300 mD</span>
              </div>
            </div>
          </Card>

          <Card className="p-2.5 rounded-md">
            <h3 className="font-semibold text-sm mb-2">Risk Factors</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Structural Risk:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Low</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seal Integrity:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Good</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source Rock:</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">Moderate</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Migration Path:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Favorable</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Recommendation */}
        <Card className="p-2.5 rounded-md bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700/50">
          <h3 className="font-semibold text-sm text-green-800 dark:text-green-300 mb-1.5">Recommendation</h3>
          <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
            <strong>Proceed with exploration.</strong> Sinsing-1 shows excellent reservoir characteristics 
            with low geological risk. The Jurassic sandstone formation demonstrates high porosity and 
            permeability, positioned favorably within the structural framework. Recommended next steps 
            include detailed seismic analysis and core sampling.
          </p>
        </Card>
      </div>
    </>
  )
}
