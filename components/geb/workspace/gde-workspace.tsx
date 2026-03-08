"use client"

import { BasinHeader } from "./basin-header"
import { ProjectTree } from "./project-tree"
import dynamic from "next/dynamic"
import { ContextualPanel, type ContextualData, type PanelContext } from "./contextual-panel"
import { BlockComparatorStrip } from "./block-comparator-strip"
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
  const [activeLayers, setActiveLayers] = useState<string[]>(['offshore-blocks-detailed', 'hc-fields', 'wells'])
  const [is3DMode, setIs3DMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'map' | 'subsurface'>('map')
  const [filteredBlockName, setFilteredBlockName] = useState<string | null>(null)

  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [mapView, setMapView] = useState<__esri.MapView | __esri.SceneView | null>(null)
  const [focusedFeatures, setFocusedFeatures] = useState<{
    layer: string;
    identifiers: string[];
    radiusInfo?: { originLayer: string; originId: string; radiusKm: number }
  } | null>(null)

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

  const handleResetSelection = () => {
    handlePanelClose()
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

  // Handle AI map actions (zoom/highlight from AI responses)
  const handleMapAction = useCallback(async (
    action: {
      action: string;
      layer: string;
      identifiers: string[];
      radiusInfo?: { originLayer: string; originId: string; radiusKm: number }
    }
  ) => {
    // Apply highlight on map immediately
    setFocusedFeatures({ layer: action.layer, identifiers: action.identifiers, radiusInfo: action.radiusInfo })

    // Also zoom to the features
    if (!mapView) return
    try {
      const res = await fetch('/api/ndr-ai/resolve-geometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layer: action.layer, identifiers: action.identifiers })
      })
      if (!res.ok) return
      const { points } = await res.json() as { points: { lat: number; lon: number }[] }
      if (!points || points.length === 0) return

      if (points.length === 1 && !action.radiusInfo) {
        await (mapView as __esri.MapView).goTo(
          { center: [points[0].lon, points[0].lat], zoom: 10 },
          { animate: true, duration: 1500 }
        )
      } else {
        const minLon = Math.min(...points.map(p => p.lon))
        const maxLon = Math.max(...points.map(p => p.lon))
        const minLat = Math.min(...points.map(p => p.lat))
        const maxLat = Math.max(...points.map(p => p.lat))

        let marginX = 0.05
        let marginY = 0.05

        // Convert radiusKm roughly into degrees (1 deg ~ 111km)
        if (action.radiusInfo) {
          const radiusDeg = (action.radiusInfo.radiusKm / 111.0) * 1.5 // 1.5 multiplier for padding
          marginX = Math.max(marginX, radiusDeg)
          // For longitude, we adjust for latitude distortion
          const centerLat = (minLat + maxLat) / 2
          const radiusLonDeg = radiusDeg / Math.cos(centerLat * (Math.PI / 180))
          marginY = Math.max(marginY, radiusLonDeg)
        }

        await (mapView as __esri.MapView).goTo(
          { target: { type: 'extent', xmin: minLon - marginX, xmax: maxLon + marginX, ymin: minLat - marginY, ymax: maxLat + marginY, spatialReference: { wkid: 4326 } } },
          { animate: true, duration: 1500 }
        )
      }
    } catch (e) {
      console.warn('[MapAction] Failed to resolve geometry:', e)
    }
  }, [mapView])

  const handleClearFocus = useCallback(() => {
    setFocusedFeatures(null)
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
    <div className="flex flex-col h-full w-full bg-gray-50 text-slate-900 overflow-hidden font-sans selection:bg-primary/20 selection:text-primary/70">
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
                  focusedFeatures={focusedFeatures}
                  onClearFocus={handleClearFocus}
                  selectedElement={panelData}
                  onResetSelection={handleResetSelection}
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
            onMapAction={handleMapAction}
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
