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
  isExpanded?: boolean
  onExpandChange?: (expanded: boolean) => void
  theme?: 'light' | 'dark'
}

const appLogos: Record<string, string> = {
  "petrel": "https://www.gopaysoft.com/wp-content/uploads/image-396.png",
  "openworks": "https://usoftly.ir/wp-content/uploads/2021/10/Openworks.png",
  "opendtect": "https://avatars.githubusercontent.com/u/11555490?s=280&v=4",
  "paleoscan": "https://usoftly.ir/wp-content/uploads/2021/10/PaleoScan_202010_r29391_x64_0.png"
}

export function GNGProjectFloatingPanel({ 
  onProjectClick, 
  isRightPanelOpen,
  isExpanded: controlledExpanded,
  onExpandChange,
  theme = 'light'
}: GNGProjectFloatingPanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = controlledExpanded ?? internalExpanded
  const setIsExpanded = (value: boolean) => {
    setInternalExpanded(value)
    onExpandChange?.(value)
  }
  const hasAutoCollapsed = useRef(false)

  const [projects, setProjects] = useState<GNGProject[]>([])
  const [loading, setLoading] = useState(true)

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

  // Collapsed state - render nothing, panel is controlled externally via View Other G&G Data button
  if (!isExpanded) {
    return null
  }

  // Expanded state - show full panel
  return (
    <div className={cn(
      "absolute top-4 right-4 z-30 w-80 rounded-lg shadow-xl border overflow-hidden backdrop-blur-md",
      theme === 'dark' ? "bg-slate-900/90 border-slate-700" : "bg-white border-slate-200"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b",
        theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
      )}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className={cn(
            "text-xs font-bold uppercase tracking-wider",
            theme === 'dark' ? "text-slate-400" : "text-slate-500"
          )}>G&G Project Data</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className={cn(
            "transition-colors",
            theme === 'dark' ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary */}
      <div className={cn(
        "px-4 py-3 border-b",
        theme === 'dark' ? "border-slate-800" : "border-slate-100"
      )}>
        <div className={cn(
          "text-sm font-semibold",
          theme === 'dark' ? "text-slate-200" : "text-slate-800"
        )}>
          Summary: No of Projects: {projects.length}
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Netherlands data with summary from attributes table
        </p>
      </div>

      {/* Project List */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        <div className={cn(
          "px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
          theme === 'dark' ? "bg-slate-800/30 text-slate-500" : "bg-slate-50 text-slate-500"
        )}>
          <Database className="w-3 h-3" />
          Project Summary ({projects.length} Projects)
        </div>
        
        {loading ? (
          <div className="p-4 text-center text-xs text-slate-400">Loading...</div>
        ) : (
          <div className={cn(
            "divide-y",
            theme === 'dark' ? "divide-slate-800" : "divide-slate-100"
          )}>
            {projects.map((project, index) => {
              const logoUrl = getLogoUrl(project.applicationName)
              return (
                <div
                  key={project.id}
                  onClick={() => onProjectClick?.(project.projectName)}
                  className={cn(
                    "px-3 py-3 cursor-pointer transition-colors group",
                    theme === 'dark' 
                      ? index % 2 === 0 ? "bg-slate-900/50 hover:bg-slate-800" : "bg-slate-800/30 hover:bg-slate-800"
                      : index % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* App Logo or Fallback */}
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded flex items-center justify-center overflow-hidden border",
                      theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-transparent"
                    )}>
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt={project.applicationName}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <FolderOpen className={cn(
                          "w-5 h-5",
                          theme === 'dark' ? "text-slate-500" : "text-slate-400"
                        )} />
                      )}
                    </div>
                    
                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-sm font-semibold truncate",
                          theme === 'dark' ? "text-slate-200 group-hover:text-blue-400" : "text-slate-800 group-hover:text-primary"
                        )}>
                          {project.projectName}
                        </span>
                        {project.interpretationYear !== '-' && (
                          <span className={cn(
                            "flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded border",
                            theme === 'dark' 
                              ? "bg-green-900/30 text-green-400 border-green-800/50" 
                              : "bg-green-100 text-green-700 border-green-200"
                          )}>
                            {project.interpretationYear}
                          </span>
                        )}
                      </div>
                      
                      <div className={cn(
                        "mt-1 flex items-center gap-3 text-[11px]",
                        theme === 'dark' ? "text-slate-400" : "text-slate-500"
                      )}>
                        <span>App: {project.applicationName}</span>
                        <span>Wells: {project.noOfWells}</span>
                      </div>
                      <div className={cn(
                        "text-[11px]",
                        theme === 'dark' ? "text-slate-400" : "text-slate-500"
                      )}>
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
      <div className={cn(
        "px-3 py-2 border-t text-[10px] text-center",
        theme === 'dark' ? "bg-slate-800/50 border-slate-700 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-500"
      )}>
        Powered by AFED Digital Sdn. Bhd.
      </div>
    </div>
  )
}
