"use client"

import { ChevronLeft, ChevronRight, FileText, TrendingUp, PieChart, DollarSign, Activity } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function SummarySheet() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('attributes')

  const tabs = [
    { id: 'attributes', label: 'Attributes', icon: FileText },
    { id: 'system', label: 'Petroleum Sys', icon: Activity },
    { id: 'ops', label: 'Operations', icon: TrendingUp },
    { id: 'vols', label: 'Volumetrics', icon: PieChart },
    { id: 'econ', label: 'Economics', icon: DollarSign },
  ]

  return (
    <div 
      className={cn(
        "fixed top-12 bottom-[350px] right-0 bg-white border-l border-gray-200 transition-all duration-300 flex shadow-2xl z-40",
        isOpen ? "w-[400px]" : "w-0"
      )}
    >
      {/* Toggle Button (Always visible attached to the side) */}
      <div className="absolute -left-8 top-4">
        <Button 
          variant="secondary" 
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="h-24 w-8 rounded-l-md rounded-r-none bg-white border-y border-l border-gray-200 hover:bg-gray-100 text-slate-600 flex flex-col gap-4 shadow-lg"
        >
           <span className="writing-vertical-lr text-[10px] font-bold uppercase tracking-widest rotate-180">Summary</span>
           {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <div className="h-10 border-b border-gray-200 flex items-center px-2 gap-1 overflow-x-auto scrollbar-hide bg-gray-50">
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1.5 whitespace-nowrap transition-colors",
                 activeTab === tab.id 
                   ? "bg-teal-50 text-teal-600 border border-teal-200" 
                   : "text-slate-500 hover:text-slate-700"
               )}
             >
               <tab.icon className="w-3 h-3" />
               {tab.label}
             </button>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
           {activeTab === 'attributes' && (
             <div className="space-y-6">
               <section>
                 <h3 className="text-sm font-bold text-slate-900 mb-3 pb-1 border-b border-gray-200">Basin Attributes</h3>
                 <dl className="space-y-3 text-xs">
                   <div className="grid grid-cols-2 gap-4">
                     <dt className="text-slate-500">Basin Type</dt>
                     <dd className="font-mono text-slate-700 text-right">Passive Margin</dd>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <dt className="text-slate-500">Onshore/Offshore</dt>
                     <dd className="font-mono text-slate-700 text-right">Offshore (Deep)</dd>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <dt className="text-slate-500">Tech Success Rate</dt>
                     <dd className="font-mono text-teal-400 text-right">42%</dd>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <dt className="text-slate-500">Comm. Success Rate</dt>
                     <dd className="font-mono text-amber-400 text-right">18%</dd>
                   </div>
                 </dl>
               </section>
               
               <section>
                 <h3 className="text-sm font-bold text-slate-900 mb-3 pb-1 border-b border-gray-200">Key Companies</h3>
                 <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-slate-600">TotalEnergies</span>
                    <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-slate-600">Shell</span>
                    <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-slate-600">Eni</span>
                 </div>
               </section>
             </div>
           )}
           
           {activeTab === 'econ' && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                 <DollarSign className="w-8 h-8 opacity-20" />
                 <span className="text-xs uppercase tracking-wider">Economics Module Locked</span>
              </div>
           )}
        </div>
      </div>
    </div>
  )
}
