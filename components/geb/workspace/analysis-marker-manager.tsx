"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity,
  Asterisk,
  Bot,
  MessageSquare,
  X,
  Move,
  Trash2,
  Plus,
  Send
} from "lucide-react"
import type MapView from "@arcgis/core/views/MapView"
import type SceneView from "@arcgis/core/views/SceneView"
import Graphic from "@arcgis/core/Graphic"
import Point from "@arcgis/core/geometry/Point"
import Circle from "@arcgis/core/geometry/Circle"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol"
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol"
import TextSymbol from "@arcgis/core/symbols/TextSymbol"
import type {
  AnalysisMarker,
  MarkerPosition,
  SpatialContext,
  MarkerStats,
  AIPayload,
  AIResult,
  MarkerComment,
  AIChatMessage
} from "./analysis-marker-types"
import {
  calculateSpatialContext,
  calculateMarkerStats,
  calculateDistance
} from "./analysis-marker-utils"

interface AnalysisMarkerManagerProps {
  view: MapView | SceneView | null
  visible?: boolean
  onMarkerCreate?: (marker: AnalysisMarker) => void
  onMarkerDelete?: (markerId: string) => void
  onMarkerSelect?: (marker: AnalysisMarker | null) => void
}

const MARKER_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
]

// Helper to convert hex color to RGB array
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    // Return default gray if invalid hex
    return [128, 128, 128]
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ]
}

export function AnalysisMarkerManager({
  view,
  visible = true,
  onMarkerCreate,
  onMarkerDelete,
  onMarkerSelect
}: AnalysisMarkerManagerProps) {
  const [markers, setMarkers] = useState<AnalysisMarker[]>([])
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [hoverPosition, setHoverPosition] = useState<MarkerPosition | null>(null)
  const [geoData, setGeoData] = useState<{
    wells?: GeoJSON.FeatureCollection
    fields?: GeoJSON.FeatureCollection
    blocks?: GeoJSON.FeatureCollection
    seismic2d?: GeoJSON.FeatureCollection
    seismic3d?: GeoJSON.FeatureCollection
  }>({})

  // Design configuration constants
  const designConfig = {
    // Orbital button settings
    orbitalDistance: 70,
    orbitalButtonSize: 40,
    orbitalButtonSpacing: 45, // degrees between buttons
    
    // Radius ring settings
    radiusRingDashSize: 6,
    radiusRingGapSize: 4,
    radiusRingThickness: 2,
    radiusRingOpacity: 0.08,
    
    // Drag handle settings
    dragHandleSize: 28,
    dragHandleOffset: 14, // pixels from ring edge
    
    // Delete button settings
    deleteButtonSize: 32,
    deleteButtonOffset: 16, // pixels from ring bottom
    
    // Close button settings
    closeButtonDistance: 100, // pixels above center
    
    // Radial visualization settings
    vizSize: 140,
    vizArcRadius: 50,
    vizArcDashSize: 4,
    vizArcGapSize: 2,
    vizLineThickness: 3,
    vizDotSize: 4,
    vizMaxLineLength: 40,
    vizLabelOffset: 8,
    
    // Label settings
    labelOffset: 24, // pixels below center point
    
    // Panel positioning
    miniViewOffset: 80, // horizontal offset from center
    miniViewWidth: 256,
  }

  const graphicsRef = useRef<Map<string, Graphic[]>>(new Map())

  // Load GeoJSON data on mount
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        const [wellsRes, fieldsRes, blocksRes, seismic2dRes, seismic3dRes] = await Promise.all([
          fetch('/data/Wells.json').then(r => r.json()).catch(() => undefined),
          fetch('/data/HC_Fields.json').then(r => r.json()).catch(() => undefined),
          fetch('/data/Offshore_Blocks.json').then(r => r.json()).catch(() => undefined),
          fetch('/data/Seismic_2D_Surveys.json').then(r => r.json()).catch(() => undefined),
          fetch('/data/Seismic_3D_Surveys.json').then(r => r.json()).catch(() => undefined),
        ])
        
        setGeoData({
          wells: wellsRes,
          fields: fieldsRes,
          blocks: blocksRes,
          seismic2d: seismic2dRes,
          seismic3d: seismic3dRes
        })
      } catch (error) {
        console.error('Failed to load GeoJSON data:', error)
      }
    }
    
    loadGeoData()
  }, [])

  // Create a new marker
  const createMarker = useCallback((position: MarkerPosition, snapToFeature?: boolean) => {
    const newMarker: AnalysisMarker = {
      id: uuidv4(),
      label: `Marker ${markers.length + 1}`,
      position,
      radiusKm: 10,
      color: MARKER_COLORS[markers.length % MARKER_COLORS.length],
      createdBy: "user",
      timestamp: Date.now(),
      isExpanded: true,
      activeMode: null
    }

    setMarkers(prev => [...prev, newMarker])
    setSelectedMarkerId(newMarker.id)
    onMarkerCreate?.(newMarker)

    return newMarker
  }, [markers, onMarkerCreate])

  // Delete a marker
  const deleteMarker = useCallback((markerId: string) => {
    setMarkers(prev => prev.filter(m => m.id !== markerId))
    setSelectedMarkerId(prev => prev === markerId ? null : prev)
    onMarkerDelete?.(markerId)
    
    // Remove graphics
    const graphics = graphicsRef.current.get(markerId)
    if (graphics && view) {
      graphics.forEach(g => view.graphics.remove(g))
      graphicsRef.current.delete(markerId)
    }
  }, [onMarkerDelete, view])

  // Update marker
  const updateMarker = useCallback((markerId: string, updates: Partial<AnalysisMarker>) => {
    setMarkers(prev => prev.map(m => 
      m.id === markerId ? { ...m, ...updates } : m
    ))
  }, [])

  // Handle map click for marker creation
  useEffect(() => {
    if (!view || !isCreating) return

    const handleClick = (event: __esri.ViewClickEvent) => {
      const mapPoint = (event as { mapPoint?: { longitude: number; latitude: number } }).mapPoint
      if (!mapPoint) return
      
      const position: MarkerPosition = {
        longitude: mapPoint.longitude,
        latitude: mapPoint.latitude
      }
      createMarker(position)
      setIsCreating(false)
    }

    const handleMouseMove = (event: __esri.ViewPointerMoveEvent) => {
      const mapPoint = (event as { mapPoint?: { longitude: number; latitude: number } }).mapPoint
      if (mapPoint) {
        setHoverPosition({
          longitude: mapPoint.longitude,
          latitude: mapPoint.latitude
        })
      }
    }

    const clickHandle = view.on("click", handleClick)
    const moveHandle = view.on("pointer-move", handleMouseMove)

    // Change cursor
    if (view.container) {
      view.container.style.cursor = "crosshair"
    }

    return () => {
      clickHandle.remove()
      moveHandle.remove()
      if (view.container) {
        view.container.style.cursor = "default"
      }
    }
  }, [view, isCreating, createMarker])

  // Update graphics when markers change
  useEffect(() => {
    if (!view) return

    // Clear existing marker graphics
    graphicsRef.current.forEach((graphics, markerId) => {
      if (!markers.find(m => m.id === markerId)) {
        graphics.forEach(g => view.graphics.remove(g))
        graphicsRef.current.delete(markerId)
      }
    })

    // Create/update graphics for each marker
    markers.forEach(marker => {
      const existingGraphics = graphicsRef.current.get(marker.id)
      if (existingGraphics) {
        existingGraphics.forEach(g => view.graphics.remove(g))
      }

      const graphics: Graphic[] = []

      // Marker point
      const point = new Point({
        longitude: marker.position.longitude,
        latitude: marker.position.latitude
      })

      const pointGraphic = new Graphic({
        geometry: point,
        symbol: new SimpleMarkerSymbol({
          style: "circle",
          color: marker.color,
          size: selectedMarkerId === marker.id ? 16 : 12,
          outline: {
            color: "white",
            width: 2
          }
        }),
        attributes: { markerId: marker.id, type: "marker" }
      })
      graphics.push(pointGraphic)

      // Radius circle - using geodesic for true circular shape on map
      const circle = new Circle({
        center: point,
        geodesic: true,
        radius: marker.radiusKm,
        radiusUnit: "kilometers"
      })

      const circleGraphic = new Graphic({
        geometry: circle,
        symbol: new SimpleFillSymbol({
          color: [...hexToRgb(marker.color), 0.1], // 10% opacity
          outline: {
            color: marker.color,
            width: 2,
            style: "dash"
          }
        }),
        attributes: { markerId: marker.id, type: "radius" }
      })
      graphics.push(circleGraphic)

      // Label
      if (selectedMarkerId === marker.id) {
        const labelGraphic = new Graphic({
          geometry: point,
          symbol: new TextSymbol({
            text: marker.label,
            color: "#1e293b",
            haloColor: "white",
            haloSize: 2,
            font: {
              size: 12,
              weight: "bold"
            },
            yoffset: -20
          }),
          attributes: { markerId: marker.id, type: "label" }
        })
        graphics.push(labelGraphic)
      }

      graphics.forEach(g => view.graphics.add(g))
      graphicsRef.current.set(marker.id, graphics)
    })
  }, [markers, view, selectedMarkerId])

  // Handle marker selection via graphic click
  useEffect(() => {
    if (!view) return

    const handleGraphicClick = (event: __esri.ViewClickEvent) => {
      view.hitTest(event).then((response) => {
        // Find marker graphic from hit results
        const results = response.results as Array<{ graphic?: __esri.Graphic }>
        const markerGraphic = results.find(
          (r) => r.graphic?.attributes?.markerId
        )
        
        if (markerGraphic) {
          const markerId = markerGraphic.graphic!.attributes.markerId
          setSelectedMarkerId(markerId)
          const marker = markers.find(m => m.id === markerId)
          if (marker) {
            onMarkerSelect?.(marker)
          }
        } else {
          // Clicked outside any marker
          if (!isCreating) {
            setSelectedMarkerId(null)
            onMarkerSelect?.(null)
          }
        }
      })
    }

    const clickHandle = view.on("click", handleGraphicClick)
    return () => clickHandle.remove()
  }, [view, markers, onMarkerSelect, isCreating])

  return (
    <>
      {visible && (
        <>
          {/* Create Marker Button - Floating above AI button */}
          <div className="fixed bottom-[104px] right-6 z-30 transition-all duration-300 ease-in-out">
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`group relative w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center border-2 ${
            isCreating 
              ? "bg-blue-600 text-white border-blue-400 shadow-blue-500/40" 
              : "bg-white text-blue-600 border-slate-100 hover:border-blue-300 shadow-slate-200/50 hover:scale-105"
          }`}
          title={isCreating ? "Cancel creation" : "Create analysis marker"}
        >
          {isCreating ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              {/* Pulse effect when inactive */}
              <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-10" />
              <Asterisk className="w-7 h-7 relative z-10 group-hover:rotate-90 transition-transform duration-500" />
            </>
          )}
        </button>
      </div>

      {/* Marker List - Bottom left panel */}
      {markers.length > 0 && (
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-3 w-64 border border-slate-200/50"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Active Analysis
            </h3>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200">
              {markers.length}
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {markers.map(marker => (
              <motion.div
                layout
                key={marker.id}
                className={`group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${
                  selectedMarkerId === marker.id
                    ? "bg-blue-600 border-blue-500 shadow-blue-200 shadow-lg translate-x-1"
                    : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-md"
                }`}
                onClick={() => setSelectedMarkerId(marker.id)}
              >
                <div 
                  className={`w-2 h-2 rounded-full ring-2 ring-offset-2 transition-all ${
                    selectedMarkerId === marker.id ? "ring-white bg-white" : "ring-transparent"
                  }`}
                  style={{ backgroundColor: selectedMarkerId === marker.id ? undefined : marker.color }}
                />
                <span className={`text-xs font-bold flex-1 truncate ${
                  selectedMarkerId === marker.id ? "text-white" : "text-slate-700"
                }`}>
                  {marker.label}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteMarker(marker.id)
                  }}
                  className={`p-1 rounded-md transition-all ${
                    selectedMarkerId === marker.id 
                      ? "text-blue-200 hover:text-white hover:bg-white/10" 
                      : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50"
                  }`}
                  title="Delete marker"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
          
          {isCreating && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3 pt-3 border-t border-slate-100"
            >
              <p className="text-[10px] text-blue-600 font-bold text-center flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Click on map to drop marker
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Selected Marker Panel */}
      {selectedMarkerId && (
        <AnalysisMarkerPanel
          marker={markers.find(m => m.id === selectedMarkerId)!}
          geoData={geoData}
          onUpdate={updateMarker}
          onDelete={deleteMarker}
          onClose={() => {
            setSelectedMarkerId(null)
            onMarkerSelect?.(null)
          }}
          view={view}
          designConfig={designConfig}
        />
      )}
    </> )}
    </>
  )
}

// Individual Marker Panel Component
interface AnalysisMarkerPanelProps {
  marker: AnalysisMarker
  geoData: {
    wells?: GeoJSON.FeatureCollection
    fields?: GeoJSON.FeatureCollection
    blocks?: GeoJSON.FeatureCollection
    seismic2d?: GeoJSON.FeatureCollection
    seismic3d?: GeoJSON.FeatureCollection
  }
  onUpdate: (id: string, updates: Partial<AnalysisMarker>) => void
  onDelete: (id: string) => void
  onClose: () => void
  view: MapView | SceneView | null
  designConfig: {
    orbitalDistance: number
    orbitalButtonSize: number
    orbitalButtonSpacing: number
    radiusRingDashSize: number
    radiusRingGapSize: number
    radiusRingThickness: number
    radiusRingOpacity: number
    dragHandleSize: number
    dragHandleOffset: number
    deleteButtonSize: number
    deleteButtonOffset: number
    closeButtonDistance: number
    vizSize: number
    vizArcRadius: number
    vizArcDashSize: number
    vizArcGapSize: number
    vizLineThickness: number
    vizDotSize: number
    vizMaxLineLength: number
    vizLabelOffset: number
    labelOffset: number
    miniViewOffset: number
    miniViewWidth: number
  }
}

function AnalysisMarkerPanel({
  marker,
  geoData,
  onUpdate,
  onDelete,
  onClose,
  view,
  designConfig
}: AnalysisMarkerPanelProps) {
  const [spatialContext, setSpatialContext] = useState<SpatialContext | null>(null)
  const [stats, setStats] = useState<MarkerStats | null>(null)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([])
  const [newAIMessage, setNewAIMessage] = useState("")
  const [comments, setComments] = useState<MarkerComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [editedLabel, setEditedLabel] = useState(marker.label)

  // Calculate spatial context when marker changes
  useEffect(() => {
    const context = calculateSpatialContext(marker.position, marker.radiusKm, geoData)
    setSpatialContext(context)
    setStats(calculateMarkerStats(context))
    // Reset AI result when marker changes
    setAiResult(null)
  }, [marker.position, marker.radiusKm, geoData])

  // Handle radius change
  const handleRadiusChange = (radius: number) => {
    onUpdate(marker.id, { radiusKm: radius })
  }

  // Handle mode change
  const handleModeChange = (mode: AnalysisMarker["activeMode"]) => {
    onUpdate(marker.id, { activeMode: mode })
  }

  // Handle AI query with custom message
  const handleAskAI = async (customQuery?: string) => {
    if (!spatialContext) return
    
    const query = customQuery || `Analyze this ${marker.radiusKm}km radius around ${marker.label}`
    
    // Add user message to chat
    if (customQuery) {
      setChatMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'user',
        content: customQuery,
        timestamp: Date.now()
      }])
    }
    
    setIsLoadingAI(true)
    try {
      const payload: AIPayload = {
        center: spatialContext.center,
        radiusKm: spatialContext.radiusKm,
        featuresInside: spatialContext.featuresInside,
        statsSummary: spatialContext.statsSummary,
        markerLabel: marker.label
      }

      const response = await fetch("/api/ndr-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          context: {
            marker: payload,
            spatialContext: spatialContext
          }
        })
      })

      const data = await response.json()
      
      const result: AIResult = {
        insights: data.answer,
        opportunities: data.followUpQuestions || [],
        dataGaps: [],
        followUpQuestions: data.followUpQuestions || [],
        timestamp: Date.now()
      }
      
      setAiResult(result)
      
      // Add assistant response to chat
      setChatMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now()
      }])
    } catch (error) {
      console.error("AI query failed:", error)
      const errorMsg = "Failed to get AI insights. Please try again."
      setAiResult({
        insights: errorMsg,
        opportunities: [],
        dataGaps: ["AI service unavailable"],
        followUpQuestions: [],
        timestamp: Date.now()
      })
      setChatMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: errorMsg,
        timestamp: Date.now()
      }])
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Handle comment add
  const handleAddComment = () => {
    if (!newComment.trim()) return
    
    const comment: MarkerComment = {
      id: uuidv4(),
      markerId: marker.id,
      user: "user",
      timestamp: Date.now(),
      text: newComment.trim(),
      replies: []
    }
    
    setComments(prev => [...prev, comment])
    setNewComment("")
  }

  const [screenPos, setScreenPos] = useState<{ x: number; y: number } | null>(null)

  // Track marker screen position
  useEffect(() => {
    if (!view) return

    const updatePosition = () => {
      const point = new Point({
        longitude: marker.position.longitude,
        latitude: marker.position.latitude
      })
      const screen = view.toScreen(point)
      if (screen) {
        setScreenPos({ x: screen.x, y: screen.y })
      }
    }

    updatePosition()
    const handle = view.watch("extent", updatePosition)
    const resizeHandle = () => updatePosition()
    window.addEventListener("resize", resizeHandle)
    
    return () => {
      handle.remove()
      window.removeEventListener("resize", resizeHandle)
    }
  }, [view, marker.position])

  if (!screenPos) return null

  const radiusInPixels = view ? (marker.radiusKm * 1000) / view.resolution : 100

  return (
    <div 
      className="absolute pointer-events-none z-[1001]"
      style={{ 
        left: screenPos.x, 
        top: screenPos.y
      }}
    >
      <div className="relative w-0 h-0 pointer-events-auto">
        {/* Orbital Menu */}
        <AnimatePresence>
          {marker.isExpanded && (
            <>
              {/* Delete Button - following the bottom radius */}
              <OrbitalButton
                icon={Trash2}
                label="Delete"
                angle={90}
                distance={Math.max(designConfig.orbitalDistance + 40, radiusInPixels)}
                isActive={false}
                onClick={() => onDelete(marker.id)}
                color="#EF4444"
                buttonSize={24}
              />

              {/* Action Buttons Orbiting - using design config */}
              <OrbitalButton
                icon={Activity}
                label="Data"
                angle={-140}
                distance={designConfig.orbitalDistance}
                isActive={marker.activeMode === "data"}
                onClick={() => handleModeChange(marker.activeMode === "data" ? null : "data")}
                color={marker.color}
                buttonSize={designConfig.orbitalButtonSize}
              />
              <OrbitalButton
                icon={Bot}
                label="Ask AI"
                angle={-90}
                distance={designConfig.orbitalDistance}
                isActive={marker.activeMode === "ai"}
                onClick={() => handleModeChange(marker.activeMode === "ai" ? null : "ai")}
                color={marker.color}
                buttonSize={designConfig.orbitalButtonSize}
              />
              <OrbitalButton
                icon={MessageSquare}
                label="Chat"
                angle={-40}
                distance={designConfig.orbitalDistance}
                isActive={marker.activeMode === "comment"}
                onClick={() => handleModeChange(marker.activeMode === "comment" ? null : "comment")}
                color={marker.color}
                buttonSize={designConfig.orbitalButtonSize}
              />
            </>
          )}
        </AnimatePresence>

        {/* Radius Slider - under the marker */}
        <AnimatePresence>
          {marker.isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-[28px] left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-slate-200 p-2 flex items-center gap-2 z-[1003]"
            >
              <span className="text-[10px] font-bold text-slate-500">1km</span>
              <input
                type="range"
                min={1}
                max={50}
                value={marker.radiusKm}
                onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                onKeyDown={(e) => {
                  if (e.metaKey && e.key === 'Enter') {
                    e.preventDefault()
                    // Trigger data analysis or apply action
                    if (marker.activeMode !== 'data') {
                      handleModeChange('data')
                    }
                  }
                }}
                className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[10px] font-bold text-slate-500">50km</span>
              <span className="text-[10px] font-bold text-blue-600 ml-1">{marker.radiusKm}km</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Point - Pulsing with Label - Draggable */}
        <div className="absolute left-0 top-0">
          <motion.div 
            animate={{ 
              scale: marker.activeMode === "data" ? 0 : [1, 1.2, 1], 
              opacity: marker.activeMode === "data" ? 0 : [0.8, 1, 0.8] 
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-5 h-5 rounded-full shadow-lg border-2 border-white cursor-grab active:cursor-grabbing -translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: marker.color }}
            onClick={() => onUpdate(marker.id, { isExpanded: !marker.isExpanded })}
            onMouseDown={(e) => {
              if (!view || !view.container) return
              e.preventDefault()
              e.stopPropagation()
              
              const rect = view.container.getBoundingClientRect()
              const startX = e.clientX
              const startY = e.clientY
              
              // Get current screen position of marker
              const point = new Point({
                longitude: marker.position.longitude,
                latitude: marker.position.latitude
              })
              const initialScreenPos = view.toScreen(point)
              if (!initialScreenPos) return

              const handleMouseMove = (moveEvent: MouseEvent) => {
                // Calculate how far the mouse has moved from the start
                const dx = moveEvent.clientX - startX
                const dy = moveEvent.clientY - startY
                
                // Calculate the new screen position for the marker
                // relative to the map view container
                const targetX = initialScreenPos.x + dx
                const targetY = initialScreenPos.y + dy
                
                const mapPoint = view.toMap({ x: targetX, y: targetY })
                
                if (mapPoint && typeof mapPoint.longitude === 'number' && typeof mapPoint.latitude === 'number') {
                  onUpdate(marker.id, { 
                    position: { 
                      longitude: mapPoint.longitude, 
                      latitude: mapPoint.latitude 
                    } 
                  })
                }
              }
              
              const handleMouseUp = () => {
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
              }
              
              window.addEventListener("mousemove", handleMouseMove)
              window.addEventListener("mouseup", handleMouseUp)
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: marker.activeMode === "data" ? 0 : 1, y: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 px-2 py-0.5 rounded shadow-sm border border-slate-200"
          >
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">{marker.label}</span>
          </motion.div>
        </div>

        {/* Floating Radial Data Visualization */}
        <AnimatePresence>
          {marker.activeMode === "data" && stats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <RadialDataVisualization 
                stats={stats} 
                color={marker.color} 
                config={designConfig}
                dynamicRadius={Math.max(designConfig.orbitalDistance + 40, radiusInPixels)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini-View Wings (Data Display) - only for non-data modes */}
        <AnimatePresence>
          {marker.activeMode && marker.activeMode !== "data" && (
            <motion.div
              initial={{ x: 20, opacity: 0, scale: 0.95 }}
              animate={{ 
                x: 120, 
                opacity: 1, 
                scale: 1 
              }}
              exit={{ x: 20, opacity: 0, scale: 0.95 }}
              className="absolute top-0 w-64 bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100"
              style={{ transform: "translateY(-50%)" }}
            >
              <div className="p-3 border-b border-slate-50 flex items-center justify-between" style={{ backgroundColor: `${marker.color}15` }}>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {marker.activeMode}
                </span>
                <button onClick={() => handleModeChange(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 max-h-80 overflow-y-auto">
                {marker.activeMode === "stats" && stats && spatialContext && (
                  <StatsMiniView stats={stats} spatialContext={spatialContext} />
                )}
                {marker.activeMode === "graph" && stats && (
                  <GraphMiniView stats={stats} color={marker.color} />
                )}
                {marker.activeMode === "ai" && spatialContext && (
                  <AIMiniView
                    chatMessages={chatMessages}
                    spatialContext={spatialContext}
                    isLoading={isLoadingAI}
                    onAsk={handleAskAI}
                    newMessage={newAIMessage}
                    onNewMessageChange={setNewAIMessage}
                  />
                )}
                {marker.activeMode === "comment" && (
                  <CommentMiniView
                    comments={comments}
                    newComment={newComment}
                    onNewCommentChange={setNewComment}
                    onAddComment={handleAddComment}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface OrbitalButtonProps {
  icon: any
  label: string
  angle: number
  distance: number
  isActive: boolean
  onClick: () => void
  color: string
  className?: string
  buttonSize?: number
}

function OrbitalButton({ icon: Icon, label, angle, distance, isActive, onClick, color, className = "", buttonSize = 40 }: OrbitalButtonProps) {
  const x = Math.cos((angle * Math.PI) / 180) * distance
  const y = Math.sin((angle * Math.PI) / 180) * distance
  const halfSize = buttonSize / 2

  const isDelete = label === "Delete"
  const bgColor = isDelete ? "bg-red-500" : (isActive ? "bg-white" : "bg-white")
  const textColor = isDelete ? "text-white" : (isActive ? color : "text-slate-400")
  const borderColor = isDelete ? "border-red-600" : (isActive ? color : "transparent")

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
      animate={{ scale: 1, opacity: 1, x: x - halfSize, y: y - halfSize }}
      exit={{ scale: 0, opacity: 0, x: 0, y: 0 }}
      whileHover={{ scale: 1.15, zIndex: 1002 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`absolute rounded-full flex items-center justify-center shadow-lg transition-colors border-2 ${bgColor} ${textColor} ${borderColor} ${className}`}
      style={{
        left: "50%",
        top: "50%",
        width: buttonSize,
        height: buttonSize,
      }}
      title={label}
    >
      <Icon style={{ width: buttonSize * 0.5, height: buttonSize * 0.5 }} />
    </motion.button>
  )
}

// Mini Stats View
function StatsMiniView({ stats, spatialContext }: { stats: MarkerStats; spatialContext: SpatialContext }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
          <div className="text-lg font-bold text-blue-700">{stats.wells.total}</div>
          <div className="text-[10px] text-blue-600 font-medium">Wells</div>
        </div>
        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
          <div className="text-lg font-bold text-emerald-700">{stats.fields.total}</div>
          <div className="text-[10px] text-emerald-600 font-medium">Fields</div>
        </div>
      </div>
      
      {/* Mini Progress Bars for Well Results */}
      <div className="space-y-1.5 bg-slate-50 p-2 rounded-lg">
        <MiniResultBar label="Gas" value={stats.wells.gas} total={stats.wells.total} color="bg-emerald-500" />
        <MiniResultBar label="Oil" value={stats.wells.oil} total={stats.wells.total} color="bg-amber-500" />
        <MiniResultBar label="Dry" value={stats.wells.dry} total={stats.wells.total} color="bg-red-400" />
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
        <span>Seismic: <span className="font-bold text-slate-700 uppercase">{spatialContext.statsSummary.seismicCoverage}</span></span>
        <span>Ops: <span className="font-bold text-slate-700">{Object.keys(stats.wells.byOperator).length}</span></span>
      </div>
    </div>
  )
}

function MiniResultBar({ label, value, total, color }: any) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-[9px]">
      <span className="w-6 text-slate-500">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${color}`} 
        />
      </div>
      <span className="w-3 text-right font-bold text-slate-700">{value}</span>
    </div>
  )
}

// Mini Graph View
function GraphMiniView({ stats, color }: { stats: MarkerStats; color: string }) {
  const data = [
    { label: "Wells", val: stats.wells.total },
    { label: "Fields", val: stats.fields.total },
    { label: "Blocks", val: stats.blocks.total }
  ]
  const max = Math.max(...data.map(d => d.val)) || 1

  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.label}>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-slate-500">{d.label}</span>
            <span className="font-bold text-slate-700">{d.val}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.val / max) * 100}%` }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Mini AI View
interface AIMiniViewProps {
  chatMessages: AIChatMessage[]
  spatialContext: SpatialContext
  isLoading: boolean
  onAsk: (customQuery?: string) => void
  newMessage: string
  onNewMessageChange: (text: string) => void
}

function AIMiniView({ chatMessages, spatialContext, isLoading, onAsk, newMessage, onNewMessageChange }: AIMiniViewProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newMessage.trim()) {
      onAsk(newMessage.trim())
      onNewMessageChange('')
    }
  }

  const handleSend = () => {
    if (newMessage.trim()) {
      onAsk(newMessage.trim())
      onNewMessageChange('')
    }
  }

  // Build context summary
  const { featuresInside, statsSummary } = spatialContext
  const contextItems = [
    statsSummary.wellsCount > 0 && `${statsSummary.wellsCount} wells`,
    statsSummary.fieldsCount > 0 && `${statsSummary.fieldsCount} fields`,
    statsSummary.blocksCount > 0 && `${statsSummary.blocksCount} blocks`,
  ].filter(Boolean)

  return (
    <div className="space-y-3">
      {/* Context Summary */}
      <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
        <div className="text-[10px] text-slate-500 uppercase tracking-wide font-bold mb-1">Current Context</div>
        <div className="flex flex-wrap gap-1">
          {contextItems.length > 0 ? (
            contextItems.map((item, i) => (
              <span key={i} className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                {item}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-400">No features in range</span>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
        {chatMessages.length === 0 ? (
          <div className="text-center py-4">
            <Bot className="w-8 h-8 text-blue-200 mx-auto mb-2" />
            <p className="text-[10px] text-slate-400">Ask about the current analysis area</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div 
              key={msg.id} 
              className={`text-[11px] p-2 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-50 text-blue-900 ml-4 border border-blue-100' 
                  : 'bg-slate-50 text-slate-700 mr-4 border border-slate-100'
              }`}
            >
              <div className="font-bold text-[9px] uppercase tracking-wide mb-0.5 opacity-70">
                {msg.role === 'user' ? 'You' : 'AI'}
              </div>
              <div className="leading-relaxed">{msg.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="text-[11px] text-slate-500 italic animate-pulse bg-slate-50 p-2 rounded-lg mr-4 border border-slate-100">
            AI is analyzing...
          </div>
        )}
      </div>

      {/* Quick Analysis Button (when no messages) */}
      {chatMessages.length === 0 && !isLoading && (
        <button 
          onClick={() => onAsk()}
          className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Ask AI Analysis
        </button>
      )}

      {/* Chat Input */}
      <div className="flex gap-1.5 pt-2 border-t border-slate-100">
        <input 
          value={newMessage}
          onChange={e => onNewMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about these features..."
          className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <button 
          onClick={handleSend}
          disabled={!newMessage.trim() || isLoading}
          className="bg-blue-600 text-white p-1.5 rounded-md disabled:bg-slate-300"
        >
          <Send className="w-3 h-3"/>
        </button>
      </div>
    </div>
  )
}

// Mini Comment View
interface CommentMiniViewProps {
  comments: MarkerComment[]
  newComment: string
  onNewCommentChange: (text: string) => void
  onAddComment: () => void
}

function CommentMiniView({ comments, newComment, onNewCommentChange, onAddComment }: CommentMiniViewProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newComment.trim()) {
      onAddComment()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        <input 
          value={newComment}
          onChange={e => onNewCommentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add comment..."
          className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <button 
          onClick={onAddComment} 
          disabled={!newComment.trim()}
          className="bg-blue-600 text-white p-1.5 rounded-md disabled:bg-slate-300"
        >
          <Send className="w-3 h-3"/>
        </button>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
        {comments.length === 0 ? (
          <div className="text-[10px] text-slate-400 text-center py-2">No comments yet</div>
        ) : (
          comments.map((c: any) => (
            <div key={c.id} className="text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100">
              <span className="font-bold text-slate-700">{c.user}: </span>
              <span className="text-slate-600">{c.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function RadialDataVisualization({ stats, color, config, dynamicRadius }: { stats: MarkerStats; color: string; config: any; dynamicRadius: number }) {
  const radius = dynamicRadius;
  const size = (radius + config.vizMaxLineLength + 40) * 2;
  const cx = size / 2;
  const cy = size / 2;
  const thickness = config.vizLineThickness * 3;

  // 1. Corrected Polar helper: Align 0 degrees with TOP (12 o'clock)
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (r * Math.cos(angleInRadians)),
      y: centerY + (r * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  // 2. Data mapping with normalization logic
  const rawData = [
    { label: "Wells", value: stats.wells.total, color: "#9333EA", angle: -55 },
    { label: "Fields", value: stats.fields.total, color: "#9333EA", angle: -35 },
    { label: "Blocks", value: stats.blocks.total, color: "#9333EA", angle: -15 },
    { label: "Gas", value: stats.wells.gas, color: "#EAB308", angle: 15 },
    { label: "Oil", value: stats.wells.oil, color: "#EAB308", angle: 35 },
    { label: "Dry", value: stats.wells.dry, color: "#EAB308", angle: 55 },
  ];

  // Find the highest value to scale the bars correctly
  const maxDataValue = Math.max(...rawData.map(d => d.value), 1);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        
        {/* 1. Radiating Bars - draw first */}
        {rawData.map((item, i) => {
          // Normalize height: (current value / max value) * max length from config
          const barLength = (item.value / maxDataValue) * config.vizMaxLineLength + 5;
          
          // Convert angle to radians for trigonometry
          // Note: SVG Y axis is inverted, so we negate the angle calculation
          const angleRad = (item.angle * Math.PI) / 180;
          
          // Calculate inner point (on arc edge) using trigonometry
          // At angle 0 (top), sin(0)=0, cos(0)=1, so we get (cx, cy - radius)
          const innerX = cx + radius * Math.sin(angleRad);
          const innerY = cy - radius * Math.cos(angleRad);
          
          // Calculate outer point (extended by barLength along same angle)
          const outerX = cx + (radius + barLength) * Math.sin(angleRad);
          const outerY = cy - (radius + barLength) * Math.cos(angleRad);

          return (
            <g key={`bar-${item.label}`}>
              {/* The Bar - from arc edge outward along angle */}
              <line
                x1={innerX}
                y1={innerY}
                x2={outerX}
                y2={outerY}
                stroke={item.color}
                strokeWidth={thickness}
                strokeLinecap="butt"
              />
              
              {/* Value Label: at outer end of bar, with white stroke outline */}
              <text
                x={outerX}
                y={outerY - 8}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#0f172a"
                stroke="white"
                strokeWidth="2"
                paintOrder="stroke"
              >
                {item.value}
              </text>
            </g>
          );
        })}

        {/* 2. Dynamic Arc: Split into Purple (Left) and Yellow (Right) */}
        <path
          d={describeArc(cx, cy, radius, -60, 0)}
          fill="none"
          stroke="#9333EA"
          strokeWidth={Math.max(8, thickness * 1.5)}
          strokeLinecap="butt"
          opacity="0.9"
        />
        <path
          d={describeArc(cx, cy, radius, 0, 60)}
          fill="none"
          stroke="#EAB308"
          strokeWidth={Math.max(8, thickness * 1.5)}
          strokeLinecap="butt"
          opacity="0.9"
        />

        {/* 3. Category Labels - draw LAST so they appear on top */}
        {rawData.map((item, i) => {
          const angleRad = (item.angle * Math.PI) / 180;
          const innerX = cx + radius * Math.sin(angleRad);
          const innerY = cy - radius * Math.cos(angleRad);

          return (
            <g key={`label-${item.label}`}>
              {/* Category Label: at inner base of bar, with white bg on top of arc */}
              <rect
                x={innerX - 14}
                y={innerY + 6}
                width="28"
                height="12"
                rx="2"
                fill="white"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={innerX}
                y={innerY + 14}
                textAnchor="middle"
                fontSize="7"
                fill="#334155"
                fontWeight="bold"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

