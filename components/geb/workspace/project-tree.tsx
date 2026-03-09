"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronRight, ChevronDown, Folder, Layers, FileText, Activity, Database, Map, Eye, EyeOff, X } from "lucide-react"
import { cn } from "@/lib/utils"

type TreeNode = {
  id: string
  label: string
  type: 'folder' | 'layer' | 'data'
  icon?: React.ReactNode
  children?: TreeNode[]
  isActive?: boolean // Initial default only
}

const INITIAL_TREE: TreeNode[] = [
  {
    id: 'wells-folder',
    label: 'Wells:',
    type: 'folder',
    children: [
      { id: 'wells', label: 'Well Locations', type: 'layer' },
      { id: 'well-trajectories', label: 'Well Trajectories', type: 'layer' },
    ]
  },
  {
    id: 'seismic',
    label: 'Seismic Data',
    type: 'folder',
    children: [
      { id: 'seismic-2d', label: 'Seismic 2D (Lines)', type: 'layer' },
      { id: 'seismic-3d', label: 'Seismic 3D (Polygon)', type: 'layer' },
    ]
  },
  { id: 'analysis-markers', label: 'Analysis Markers', type: 'layer', isActive: true },
  { id: 'hc-fields', label: 'Hydrocarbon Fields', type: 'layer' },
  { id: 'licenses', label: 'Awarded Blocks', type: 'layer' },
  { id: 'gng-projects', label: 'G&G Project Data Outlines', type: 'layer' },
  { id: 'offshore-blocks-detailed', label: 'Open Blocks (Offshore)', type: 'layer' },
]

interface ProjectTreeProps {
  activeLayers?: string[]
  onToggleLayer?: (layerId: string) => void
  activeTab?: 'map' | 'subsurface'
  filteredBlockName?: string | null
  onClearFilter?: () => void
}

type BlockData = {
  id: string
  name: string
  operator: string
}

export function ProjectTree({ activeLayers = [], onToggleLayer, activeTab = 'map', filteredBlockName, onClearFilter }: ProjectTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'wells-folder': true,
    'seismic': true,
  })
  const [blocks, setBlocks] = useState<BlockData[]>([])
  const [showTooltip, setShowTooltip] = useState(false)
  const seismic2dRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Attempt to load from official NLOG WFS
    const NLOG_URL = 'https://www.gdngeoservices.nl/geoserver/nlog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=nlog:gdw_ng_licence_utm&outputFormat=application/json&srsName=EPSG:4326'

    // Also consider the local full blocks file
    const LOCAL_BLOCKS_URL = '/data/netherlands-offshore-blocks.json'

    const fetchBlocks = async () => {
      try {
        const response = await fetch(NLOG_URL)
        const data = await response.json()
        const parsedBlocks = data.features.map((f: any) => ({
          id: f.id || f.properties?.objectid?.toString() || Math.random().toString(),
          name: f.properties?.licence_name || f.properties?.namobj || f.id || 'Unknown',
          operator: f.properties?.operator_name || f.properties?.oprblk || 'N/A'
        })).sort((a: any, b: any) => a.name.localeCompare(b.name))
        setBlocks(parsedBlocks)
      } catch (err) {
        console.error("Failed to load NLOG blocks, trying local fallback...", err)
        try {
          const localRes = await fetch(LOCAL_BLOCKS_URL)
          const localData = await localRes.json()
          const parsed = localData.features.map((f: any) => ({
            id: f.id?.toString() || f.properties?.OBJECTID?.toString() || Math.random().toString(),
            name: f.properties?.BlokNummer || 'Unknown',
            operator: 'Available'
          })).sort((a: any, b: any) => a.name.localeCompare(b.name))
          setBlocks(parsed)
        } catch (localErr) {
          console.error("Failed to load local blocks too", localErr)
        }
      }
    }

    fetchBlocks()
  }, [])

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const renderNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expanded[node.id]
    const hasChildren = node.children && node.children.length > 0
    const paddingLeft = `${depth * 16 + 12}px`

    // Check if active based on props, falling back to node.isActive for initial render if props empty (optional)
    const isActive = activeLayers.includes(node.id)

    return (
      <div key={node.id}>
        <div
          ref={node.id === 'seismic-2d' ? seismic2dRef : undefined}
          className={cn(
            "flex items-center h-7 hover:bg-gray-100 cursor-pointer select-none group",
            isActive && "bg-primary/10 text-primary border-r-2 border-primary"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(node.id)
            } else {
              onToggleLayer?.(node.id)
              // Show tooltip for seismic-2d when activated and at wrong zoom
              if (node.id === 'seismic-2d' && isActive) {
                setShowTooltip(true)
                // Auto-hide after 5 seconds
                setTimeout(() => setShowTooltip(false), 5000)
              }
            }
          }}
        >
          <div className="flex items-center flex-1 min-w-0" style={{ paddingLeft }}>
            {hasChildren ? (
              <span className="mr-1 text-slate-400">
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
            ) : (
              <span className="w-4" /> // Spacer
            )}

            {/* Icon or Color indicator */}
            <span className="mr-2">
              {node.id === 'offshore-blocks-detailed' ? (
                <div className="w-3 h-3 rounded-sm bg-[#e5e5e5] border border-gray-300" />
              ) : node.id === 'wells' ? (
                <div className="w-3 h-3 rounded-full bg-black" />
              ) : node.id === 'hc-fields' ? (
                <div className="flex flex-col gap-0.5">
                  <div className="w-3 h-1.5 rounded-sm bg-[#55ff00]" />
                  <div className="w-3 h-1.5 rounded-sm bg-[#ff7f7f]" />
                </div>
              ) : node.icon ? (
                <span className="text-slate-400">{node.icon}</span>
              ) : (
                <span className="text-slate-400">
                  {node.type === 'folder' ? <Folder className="w-3 h-3" /> :
                    node.type === 'layer' ? <Layers className="w-3 h-3" /> :
                      <Database className="w-3 h-3" />}
                </span>
              )}
            </span>

            <span className={cn(
              "text-xs truncate font-medium",
              isActive ? "text-primary" : "text-slate-700 group-hover:text-slate-900"
            )}>
              {node.label}
            </span>
          </div>

          {/* Visibility toggle on hover or if active */}
          <div className={cn(
            "w-8 flex justify-center transition-opacity",
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            {isActive ? (
              <Eye className="w-3 h-3 text-primary" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-300 hover:text-slate-500" />
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (activeTab === 'subsurface') {
    const displayedBlocks = filteredBlockName
      ? blocks.filter(b => b.name === filteredBlockName)
      : blocks

    return (
      <div className="w-[240px] flex flex-col border-r border-gray-200 bg-white h-full overflow-hidden">
        <div className="h-8 flex items-center justify-between px-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {filteredBlockName ? 'Selected Block' : 'Blocks'}
          </span>
          {filteredBlockName && (
            <button
              onClick={onClearFilter}
              className="text-[10px] text-primary hover:text-primary/90 font-semibold hover:underline"
            >
              View All
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="py-2">
            {displayedBlocks.map(block => (
              <div
                key={block.id}
                className="flex items-center h-10 px-3 hover:bg-gray-50 cursor-pointer select-none group border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center flex-1 min-w-0 gap-3">
                  <div className="flex-none p-1.5 bg-slate-100 rounded text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-700 truncate group-hover:text-slate-900">{block.name}</span>
                    <span className="text-[10px] text-slate-500 truncate">{block.operator}</span>
                  </div>
                </div>

                {/* Arrow on hover */}
                <div className="flex-none w-6 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}

            {displayedBlocks.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                {blocks.length === 0 ? "Loading..." : "No blocks found"}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[240px] flex flex-col border-r border-gray-200 bg-white h-full relative">
      {/* Tooltip for Seismic 2D - positioned at layer */}
      {showTooltip && seismic2dRef.current && (
        <div 
          className="absolute left-full ml-1 z-50 flex items-center"
          style={{ 
            top: seismic2dRef.current.offsetTop + 2,
          }}
        >
          {/* Arrow pointing left */}
          <div className="w-0 h-0 border-y-4 border-y-transparent border-r-[6px] border-r-blue-500" />
          {/* Compact tooltip pill */}
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap shadow-md ml-0.5 flex items-center gap-1">
            <span>Zoom to 1:600k</span>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div className="h-8 flex items-center px-3 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Tree</span>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {INITIAL_TREE.map(node => renderNode(node))}
        </div>
      </div>
    </div>
  )
}
