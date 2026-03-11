"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { LogOut, Crown, Moon, Sun } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface BasinHeaderProps {
  activeTab?: 'map' | 'subsurface'
  onTabChange?: (tab: 'map' | 'subsurface') => void
  theme?: 'light' | 'dark'
  onThemeChange?: (theme: 'light' | 'dark') => void
}

export function BasinHeader({ activeTab = 'map', onTabChange, theme = 'light', onThemeChange }: BasinHeaderProps) {
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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    onThemeChange?.(newTheme)
  }

  return (
    <div className={cn(
      "border-b select-none transition-colors duration-200",
      theme === 'dark' 
        ? "bg-slate-900 border-slate-800 text-slate-100" 
        : "bg-white border-gray-200 text-slate-900"
    )}>
      {/* Top Bar - Always visible */}
      <div className="h-12 px-4 flex items-center text-sm relative">
        {/* Left Section */}
        <div className="flex-1 flex items-center justify-start gap-6">
          {/* Logo Section */}
          <div className="flex items-center">
            <Image
              src={theme === 'dark' ? "/data/edafy-vdr-light.png?v=1" : "/data/edafy-vdr.png?v=3"}
              alt="Vibecodes VDR Logo"
              width={100}
              height={32}
              className={cn(
                "h-8 w-auto mr-2",
                theme === 'dark' && "brightness-90"
              )}
              priority
            />
          </div>
          <div className={cn(
            "h-6 w-px",
            theme === 'dark' ? "bg-slate-700" : "bg-gray-300"
          )} />
          <span className={cn(
            "font-bold text-lg tracking-tight uppercase",
            theme === 'dark' ? "text-slate-100" : "text-slate-900"
          )}>Data Platform Netherlands</span>

          {isPremium && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-200 to-yellow-400 rounded text-[10px] font-black text-amber-900 uppercase tracking-wider shadow-sm border border-yellow-500/50">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          )}
        </div>

        {/* Center Tabs */}
        <div className="flex-none flex items-center justify-center h-full">
          <div className={cn(
            "flex items-center p-1 rounded-lg border",
            theme === 'dark' 
              ? "bg-slate-800 border-slate-700" 
              : "bg-slate-100 border-slate-200"
          )}>
            <button
              onClick={() => onTabChange?.('map')}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
                activeTab === 'map'
                  ? theme === 'dark'
                    ? "bg-slate-700 text-white shadow-sm ring-1 ring-slate-600"
                    : "bg-white text-primary shadow-sm ring-1 ring-black/5"
                  : theme === 'dark'
                    ? "text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
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
                  ? theme === 'dark'
                    ? "bg-slate-700 text-white shadow-sm ring-1 ring-slate-600"
                    : "bg-white text-primary shadow-sm ring-1 ring-black/5"
                  : theme === 'dark'
                    ? "text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              )}
            >
              3D Viewer
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex-1 flex items-center justify-end gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
              theme === 'dark'
                ? "bg-slate-800 text-amber-400 hover:bg-slate-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-2 transition-colors",
              theme === 'dark'
                ? "text-slate-400 hover:text-red-400"
                : "text-slate-400 hover:text-red-600"
            )}
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
