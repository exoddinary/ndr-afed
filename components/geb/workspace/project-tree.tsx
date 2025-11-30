"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Folder, Layers, FileText, Activity, Database, Map, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    id: 'blocks',
    label: 'Exploration Blocks',
    type: 'folder',
    children: [
      { id: 'active-blocks', label: 'Active Blocks', type: 'layer', isActive: true },
      { id: 'open-blocks', label: 'Open Areas', type: 'layer' },
    ]
  },
  {
    id: 'basins',
    label: 'Basins',
    type: 'folder',
    children: [
      { id: 'sedimentary-basins', label: 'Sedimentary Basins', type: 'layer', isActive: true },
    ]
  },
  {
    id: 'seismic',
    label: 'Seismic Data',
    type: 'folder',
    children: [
      { id: 'seismic-2d', label: 'Seismic 2D Lines', type: 'layer' },
    ]
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    type: 'folder',
    children: [
      { id: 'pipeline-infrastructure', label: 'Pipeline Infrastructure', type: 'layer', isActive: true },
      { id: 'platform-migas', label: 'Platform Migas', type: 'layer', isActive: true },
      { id: 'wells', label: 'Wells', type: 'layer' },
      { id: 'facilities', label: 'Facilities', type: 'layer' },
    ]
  }
]

interface ProjectTreeProps {
  activeLayers?: string[]
  onToggleLayer?: (layerId: string) => void
}

export function ProjectTree({ activeLayers = [], onToggleLayer }: ProjectTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'blocks': true,
    'basins': true,
    'seismic': true,
    'infrastructure': true,
  })

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
          className={cn(
            "flex items-center h-7 hover:bg-gray-100 cursor-pointer select-none group",
            isActive && "bg-teal-50 text-teal-600 border-r-2 border-teal-500"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(node.id)
            } else {
              onToggleLayer?.(node.id)
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

            {/* Icon logic */}
            <span className="mr-2 text-slate-400">
              {node.icon ? node.icon : (
                node.type === 'folder' ? <Folder className="w-3 h-3" /> :
                  node.type === 'layer' ? <Layers className="w-3 h-3" /> :
                    <Database className="w-3 h-3" />
              )}
            </span>

            <span className={cn(
              "text-xs truncate font-medium",
              isActive ? "text-teal-600" : "text-slate-700 group-hover:text-slate-900"
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
              <Eye className="w-3 h-3 text-teal-500" />
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

  return (
    <div className="w-[240px] flex flex-col border-r border-gray-200 bg-white h-full">
      <div className="h-8 flex items-center px-3 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Tree</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-2">
          {INITIAL_TREE.map(node => renderNode(node))}
        </div>
      </ScrollArea>
    </div>
  )
}
