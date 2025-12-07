"use client"

import { BasinHeader } from "./basin-header"
import { ProjectTree } from "./project-tree"
import dynamic from "next/dynamic"
// import { SummarySheet } from "./summary-sheet"
import { ContextualPanel, type ContextualData, type PanelContext } from "./contextual-panel"
// import { TimelineScrubber } from "./timeline-scrubber"
// import { ComparatorStrip } from "./comparator-strip"
import { BlockComparatorStrip } from "./block-comparator-strip"
import { ExplanationRibbon } from "./explanation-ribbon"
import { useState, useCallback } from "react"
import { MapTools } from "./map-tools"
import { AIChatPanel } from "./ai-chat-panel"
import { AIChatTrigger } from "./ai-chat-trigger"

// Dynamically import MapArea to avoid SSR issues with ArcGIS SDK
const MapArea = dynamic(() => import("./map-area").then(mod => ({ default: mod.MapArea })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
})

import { SubsurfaceViewer } from "./subsurface-viewer"

import { MOCK_BLOCKS, type BlockCommercialData } from "@/data/investor-data"

export function GDEWorkspace() {
  const [panelData, setPanelData] = useState<ContextualData | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedBlocks, setSelectedBlocks] = useState<BlockCommercialData[]>([])
  const [activeLayers, setActiveLayers] = useState<string[]>(['active-blocks', 'sedimentary-basins', 'pipeline-infrastructure', 'platform-migas'])
  const [is3DMode, setIs3DMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'map' | 'subsurface'>('map')
  const [filteredBlockName, setFilteredBlockName] = useState<string | null>(null)

  // New state for AI Chat and Map View
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [mapView, setMapView] = useState<__esri.MapView | __esri.SceneView | null>(null)

  const handleElementClick = (type: PanelContext, data: any) => {
    setPanelData({ type, data })
    setIsPanelOpen(true)
    // Close AI chat when opening contextual panel
    setIsAIChatOpen(false)
  }

  const handlePanelClose = () => {
    setIsPanelOpen(false)
    // Clear data after animation completes
    setTimeout(() => setPanelData(null), 300)
  }

  const handleAddToCompare = (blockOrId: string | BlockCommercialData) => {
    let blockToAdd: BlockCommercialData | undefined

    if (typeof blockOrId === 'string') {
      // If it's a string ID, try to find it in MOCK_BLOCKS
      blockToAdd = Object.values(MOCK_BLOCKS).find(b => b.id === blockOrId)
    } else {
      // It's already a block object
      blockToAdd = blockOrId
    }

    if (blockToAdd && !selectedBlocks.some(b => b.id === blockToAdd!.id)) {
      setSelectedBlocks(prev => [...prev, blockToAdd!])
    }
  }

  const handleRemoveFromCompare = (blockId: string) => {
    setSelectedBlocks(prev => prev.filter(b => b.id !== blockId))
  }

  const handleToggleLayer = (layerId: string) => {
    setActiveLayers(prev =>
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    )
  }

  const handleToggle3D = () => {
    setIs3DMode(prev => !prev)
  }

  const handleViewSubsurface = (blockName: string) => {
    setActiveTab('subsurface')
    setFilteredBlockName(blockName)
    console.log("Viewing block in subsurface:", blockName)
  }

  const handleClearFilter = () => {
    setFilteredBlockName(null)
  }

  // Handle map view ready callback
  const handleViewReady = useCallback((view: __esri.MapView | __esri.SceneView) => {
    setMapView(view)
  }, [])

  // Handle AI Chat toggle
  const handleOpenAIChat = () => {
    setIsAIChatOpen(true)
    // Close contextual panel when opening AI chat
    setIsPanelOpen(false)
  }

  const handleCloseAIChat = () => {
    setIsAIChatOpen(false)
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 text-slate-900 overflow-hidden font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Top Fixed Bar */}
      <div className="flex-none z-50 relative">
        <BasinHeader activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left Panel - Project Tree */}
        <div className="flex-none z-30 relative self-stretch">
          <ProjectTree
            activeLayers={activeLayers}
            onToggleLayer={handleToggleLayer}
            activeTab={activeTab}
            filteredBlockName={filteredBlockName}
            onClearFilter={handleClearFilter}
          />
        </div>

        {/* Center Column - Map + Timeline + Comparator */}
        <div className="flex-1 flex flex-col min-w-0 relative bg-white">

          {/* Main Map Window with overlays */}
          <div className="flex-1 relative z-0 flex flex-col min-h-0">
            {activeTab === 'map' ? (
              <div className="absolute inset-0">
                <MapArea
                  onElementClick={handleElementClick}
                  activeLayers={activeLayers}
                  is3D={is3DMode}
                  onToggle3D={handleToggle3D}
                  onViewReady={handleViewReady}
                />
                {/* Map Tools Overlay */}
                <MapTools view={mapView} />
              </div>
            ) : (
              <div className="absolute inset-0">
                <SubsurfaceViewer />
              </div>
            )}

            {/* Summary Sheet Overlay - Removed and merged into ContextualPanel */}
          </div>

          {/* Block Comparator Strip - Only show on Map tab */}
          {activeTab === 'map' && (
            <BlockComparatorStrip
              selectedBlocks={selectedBlocks}
              onRemoveBlock={handleRemoveFromCompare}
              onAddBlock={handleAddToCompare}
            />
          )}

        </div>

        {/* Right Side - Contextual Panel or AI Chat */}
        {isAIChatOpen ? (
          <AIChatPanel
            isOpen={isAIChatOpen}
            onClose={handleCloseAIChat}
          />
        ) : (
          <ContextualPanel
            isOpen={isPanelOpen}
            context={panelData}
            onClose={handlePanelClose}
            onNavigate={handleElementClick}
            onAddToCompare={handleAddToCompare}
            onToggle3D={handleToggle3D}
            onViewSubsurface={handleViewSubsurface}
          />
        )}

      </div>

      {/* AI Chat Floating Trigger */}
      <AIChatTrigger onClick={handleOpenAIChat} isOpen={isAIChatOpen} isPanelOpen={isPanelOpen} />

      {/* Global Overlays */}
      {/* <ExplanationRibbon /> */}
    </div>
  )
}
