"use client"

import { useEffect, useRef, useState } from "react"
import { X, Database, FolderOpen, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

interface GNGProject {
  id: string
  projectName: string
  applicationName: string
  interpretationYear: string
  noOfWells: string
  noOfReports: string
}

interface GNGProjectFloatingPanelProps {
  onProjectClick?: (projectName: string) => void
  isRightPanelOpen?: boolean
}

const appLogos: Record<string, string> = {
  "petrel": "https://www.gopaysoft.com/wp-content/uploads/image-396.png",
  "openworks": "https://usoftly.ir/wp-content/uploads/2021/10/Openworks.png",
  "opendtect": "https://avatars.githubusercontent.com/u/11555490?s=280&v=4",
  "paleoscan": "https://usoftly.ir/wp-content/uploads/2021/10/PaleoScan_202010_r29391_x64_0.png"
}

export function GNGProjectFloatingPanel({ onProjectClick, isRightPanelOpen }: GNGProjectFloatingPanelProps) {
  const [projects, setProjects] = useState<GNGProject[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const hasAutoCollapsed = useRef(false)

  // Collapse panel only on first right panel open
  useEffect(() => {
    if (isRightPanelOpen && isExpanded && !hasAutoCollapsed.current) {
      setIsExpanded(false)
      hasAutoCollapsed.current = true
    }
  }, [isRightPanelOpen, isExpanded])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/data/GnG_Project_Data_Outlines.json')
        const data = await response.json()
        
        const parsedProjects = data.features.map((f: any) => ({
          id: f.id?.toString() || f.properties?.OBJECTID?.toString() || Math.random().toString(),
          projectName: f.properties?.PROJECT_NAME?.trim() || 'Unknown',
          applicationName: f.properties?.APPLICATION_NAME?.trim() || '-',
          interpretationYear: f.properties?.INTERPRETATION_YEAR?.toString() || '-',
          noOfWells: f.properties?.NO_OF_WELLS?.toString() || '0',
          noOfReports: f.properties?.NO_OF_REPORTS?.toString() || '0',
        }))
        
        setProjects(parsedProjects)
      } catch (err) {
        console.error("Failed to load G&G projects", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const getLogoUrl = (appName: string) => {
    return appLogos[appName.toLowerCase()] || null
  }

  // Collapsed state - show circular button (no tooltip)
  if (!isExpanded) {
    return (
      <div className="absolute top-4 right-4 z-30">
        {/* Circular Toggle Button */}
        <button
          onClick={() => setIsExpanded(true)}
          className="group relative w-14 h-14 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full shadow-lg shadow-purple-500/40 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-200 flex items-center justify-center"
        >
          {/* Pulse Animation Ring */}
          <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20" />

          {/* Icon */}
          <Layers className="w-6 h-6 text-white relative z-10 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    )
  }

  // Expanded state - show full panel
  return (
    <div className="absolute top-4 right-4 z-30 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">G&G Project Data</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="text-sm font-semibold text-slate-800">
          Summary: No of Projects: {projects.length}
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Netherlands data with summary from attributes table
        </p>
      </div>

      {/* Project List */}
      <div className="max-h-[400px] overflow-y-auto">
        <div className="px-3 py-2 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
          <Database className="w-3 h-3" />
          Project Summary ({projects.length} Projects)
        </div>
        
        {loading ? (
          <div className="p-4 text-center text-xs text-slate-400">Loading...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.map((project, index) => {
              const logoUrl = getLogoUrl(project.applicationName)
              return (
                <div
                  key={project.id}
                  onClick={() => onProjectClick?.(project.projectName)}
                  className={cn(
                    "px-3 py-3 cursor-pointer hover:bg-slate-50 transition-colors group",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* App Logo or Fallback */}
                    <div className="flex-shrink-0 w-10 h-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt={project.applicationName}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <FolderOpen className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    
                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {project.projectName}
                        </span>
                        {project.interpretationYear !== '-' && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">
                            {project.interpretationYear}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                        <span>App: {project.applicationName}</span>
                        <span>Wells: {project.noOfWells}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Reports: {project.noOfReports}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 text-center">
        Powered by AFED Digital Sdn. Bhd.
      </div>
    </div>
  )
}
