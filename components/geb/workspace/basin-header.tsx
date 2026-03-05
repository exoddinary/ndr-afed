"use client"

import { useState, useEffect } from "react"
import { LogOut, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface BasinHeaderProps {
  activeTab?: 'map' | 'subsurface'
  onTabChange?: (tab: 'map' | 'subsurface') => void
}

export function BasinHeader({ activeTab = 'map', onTabChange }: BasinHeaderProps) {
  const [isPremium, setIsPremium] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem("afed_vdr_auth_token")
      setIsPremium(token === 'user1')
    }
  }, [])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem("afed_vdr_auth_token")
      window.localStorage.removeItem("afed_vdr_auth_email")
    }
    router.push("/auth/login")
  }

  return (
    <div className="bg-white border-b border-gray-200 text-slate-900 select-none">
      {/* Top Bar - Always visible */}
      <div className="h-12 px-4 flex items-center text-sm relative">
        {/* Left Section */}
        <div className="flex-1 flex items-center justify-start gap-6">
          {/* NDR Logo */}
          <div className="flex items-center">
            <div className="flex items-center justify-center bg-primary rounded-lg h-8 w-8 text-white font-black text-xs mr-2">
              NDR
            </div>
            <span className="text-[10px] leading-tight text-slate-500 uppercase font-bold">Offshore & Onshore<br />Netherlands</span>
          </div>
          <div className="h-6 w-px bg-gray-300" />
          <span className="font-bold text-lg tracking-tight text-slate-900 uppercase">National Data Room</span>

          {isPremium && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-200 to-yellow-400 rounded text-[10px] font-black text-amber-900 uppercase tracking-wider shadow-sm border border-yellow-500/50">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          )}
        </div>

        {/* Center Tabs */}
        <div className="flex-none flex items-center justify-center h-full">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => onTabChange?.('map')}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
                activeTab === 'map'
                  ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              )}
            >
              Map Data
            </button>
            <button
              onClick={() => onTabChange?.('subsurface')}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
                activeTab === 'subsurface'
                  ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              )}
            >
              3D Viewer
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex-1 flex items-center justify-end gap-4">
          {/* Basin Card Toggle Hidden
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <span className="text-xs uppercase tracking-wider">Basin Card</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="h-4 w-px bg-gray-300" />
          */}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-600 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Details Hidden
      {isExpanded && (
        <div className="px-4 pb-3 grid grid-cols-4 gap-8 text-xs border-t border-gray-200 bg-gray-50 pt-3">
          <div>
            <div className="text-slate-500 mb-1 uppercase tracking-wider font-bold">Operator</div>
            <div className="text-slate-700">Pertamina (Op), Repsol, Petronas</div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 uppercase tracking-wider font-bold">Water Depth</div>
            <div className="text-slate-700">50m - 1,200m (Shallow to Deep)</div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 uppercase tracking-wider font-bold">Primary Play</div>
            <div className="text-slate-700">Miocene Carbonate Build-ups</div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 uppercase tracking-wider font-bold">Last Update</div>
            <div className="text-slate-700">24 Oct 2024 (Manual QC)</div>
          </div>
        </div>
      )}
      */}
    </div>
  )
}
