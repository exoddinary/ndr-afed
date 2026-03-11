"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity,
  Asterisk,
  Bot,
  Zap,
  MessageSquare,
  X,
  Move,
  Trash2,
  Plus,
  Send,
  BarChart3
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
  onJumpToMainAI?: (question: string, spatialContext: SpatialContext) => void
  isPanelOpen?: boolean
  theme?: 'light' | 'dark'
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
  onMarkerSelect,
  onJumpToMainAI,
  isPanelOpen = false,
  theme = 'light'
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

  // Auto-enable creation mode when toolbar is activated (visible becomes true)
  useEffect(() => {
    if (visible) {
      setIsCreating(true)
    } else {
      setIsCreating(false)
    }
  }, [visible])

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
      // Stop propagation to prevent layer interactions during marker placement
      event.stopPropagation()
      
      const mapPoint = (event as { mapPoint?: { longitude: number; latitude: number } }).mapPoint
      if (!mapPoint) return
      
      const position: MarkerPosition = {
        longitude: mapPoint.longitude,
        latitude: mapPoint.latitude
      }
      createMarker(position)
      setIsCreating(false)
      // Exit creation mode after placing marker so user can interact with it
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

  // Cursor radius preview graphic - follows mouse during placement
  useEffect(() => {
    if (!view || !isCreating || !hoverPosition) return

    const defaultRadiusKm = 10 // Default 10km radius
    const radiusInMeters = defaultRadiusKm * 1000
    
    // Create a circle graphic at hover position
    const circle = new Circle({
      center: [hoverPosition.longitude, hoverPosition.latitude],
      radius: radiusInMeters,
      radiusUnit: "meters"
    })

    const circleGraphic = new Graphic({
      geometry: circle,
      symbol: {
        type: "simple-fill",
        color: [59, 130, 246, 0.1], // Light blue fill
        outline: {
          color: [59, 130, 246, 0.8], // Solid blue outline
          width: 2,
          style: "solid"
        }
      } as any
    })

    view.graphics.add(circleGraphic)

    return () => {
      view.graphics.remove(circleGraphic)
    }
  }, [view, isCreating, hoverPosition])

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

      // Outer masking polygon (inverted circle) to darken the rest of the map
      if (selectedMarkerId === marker.id) {
        // Create a massive polygon that covers the whole world
        const worldExtent = [
          [-180, -90],
          [180, -90],
          [180, 90],
          [-180, 90],
          [-180, -90]
        ]
        
        // Generate points for the circle hole (needs to be reversed winding order for a hole)
        const holePoints: number[][] = []
        // Circle.rings[0] contains the polygon points for the circle
        const circleRings = (circle as any).rings?.[0]
        if (circleRings) {
          // Add points in reverse order to create a hole
          for (let i = circleRings.length - 1; i >= 0; i--) {
            holePoints.push([circleRings[i][0], circleRings[i][1]])
          }
          
          const maskGraphic = new Graphic({
            geometry: {
              type: "polygon",
              rings: [worldExtent, holePoints],
              spatialReference: { wkid: 4326 }
            } as any,
            symbol: new SimpleFillSymbol({
              color: [0, 0, 0, 0.6], // Dark mask
              outline: {
                color: [0, 0, 0, 0], // No outline
                width: 0
              }
            }),
            attributes: { markerId: marker.id, type: "mask" }
          })
          graphics.push(maskGraphic)
        }
      }

      // Radius circle
      const circleGraphic = new Graphic({
        geometry: circle,
        symbol: new SimpleFillSymbol({
          color: [...hexToRgb(marker.color), 0.05], // Very subtle inside
          outline: {
            color: marker.color,
            width: selectedMarkerId === marker.id ? 3 : 2, // Thicker when selected
            style: "solid" // Solid line looks more premium
          }
        }),
        attributes: { markerId: marker.id, type: "radius" }
      })
      graphics.push(circleGraphic)

      // Label - REMOVED as per user request
      // if (selectedMarkerId === marker.id) {
      //   const labelGraphic = new Graphic({
      //     geometry: point,
      //     symbol: new TextSymbol({
      //       text: marker.label,
      //       color: "#1e293b",
      //       haloColor: "white",
      //       haloSize: 2,
      //       font: {
      //         size: 12,
      //         weight: "bold"
      //       },
      //       yoffset: -20
      //     }),
      //     attributes: { markerId: marker.id, type: "label" }
      //   })
      //   graphics.push(labelGraphic)
      // }

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
      {/* Analysis Markers - always visible once created, never hidden */}
      {(visible || markers.length > 0) && (
        <>
          {/* Canvas Highlight - 4px outline during marker placement mode */}
          {isCreating && (
            <div className="absolute inset-0 z-[100] pointer-events-none">
              <div className="absolute inset-0 border-4 border-blue-500/50 rounded-lg" />
            </div>
          )}

          {/* Instructional Text Overlay */}
          {isCreating && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[101] bg-slate-800/90 backdrop-blur text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
              Click anywhere on the map to place spatial analysis marker
            </div>
          )}
        </>
      )}

      {/* Selected Marker Panel - only show after placement (not during creation) */}
      {selectedMarkerId && !isCreating && (
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
          onJumpToMainAI={onJumpToMainAI}
          theme={theme}
        />
      )}
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
  onJumpToMainAI?: (question: string, spatialContext: SpatialContext) => void
  theme?: 'light' | 'dark'
}

function AnalysisMarkerPanel({
  marker,
  geoData,
  onUpdate,
  onDelete,
  onClose,
  view,
  designConfig,
  onJumpToMainAI,
  theme = 'light'
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
                icon={BarChart3}
                label="Data"
                angle={-140}
                distance={designConfig.orbitalDistance}
                isActive={marker.activeMode === "data"}
                onClick={() => handleModeChange(marker.activeMode === "data" ? null : "data")}
                color="#9333EA"
                buttonSize={designConfig.orbitalButtonSize}
              />
              <OrbitalButton
                icon={Zap}
                label="Ask AI"
                angle={-90}
                distance={designConfig.orbitalDistance}
                isActive={marker.activeMode === "ai"}
                onClick={() => handleModeChange(marker.activeMode === "ai" ? null : "ai")}
                color="#9333EA"
                buttonSize={designConfig.orbitalButtonSize}
              />
              <OrbitalButton
                icon={MessageSquare}
                label="Chat"
                angle={-40}
                distance={designConfig.orbitalDistance}
                isActive={marker.activeMode === "comment"}
                onClick={() => handleModeChange(marker.activeMode === "comment" ? null : "comment")}
                color="#9333EA"
                buttonSize={designConfig.orbitalButtonSize}
              />
            </>
          )}
        </AnimatePresence>

        {/* Radius Slider - under the marker */}
        <AnimatePresence>
          {marker.isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="absolute top-full mt-[12px] left-1/2 -translate-x-1/2 z-[1003]"
            >
              <ArcSlider 
                value={marker.radiusKm} 
                min={1} 
                max={50} 
                onChange={(val) => {
                  handleRadiusChange(val)
                  if (marker.activeMode !== 'data') {
                    handleModeChange('data')
                  }
                }} 
                color={marker.color} 
              />
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
            animate={{ opacity: 0, y: 0 }} // Changed to always be opacity 0 to hide label
            className="hidden absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-md border border-slate-700/50 mt-1"
          >
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">{marker.label}</span>
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
              className={`absolute top-0 w-64 rounded-xl shadow-2xl overflow-hidden border z-[1000] pointer-events-auto ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}
              style={{ transform: "translateY(-50%)" }}
            >
              <div className={`p-3 border-b flex items-center justify-between ${theme === 'dark' ? 'border-slate-800' : 'border-slate-50'}`} style={{ backgroundColor: `${marker.color}15` }}>
                <span className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  {marker.activeMode}
                </span>
                <button onClick={() => handleModeChange(null)} className={`transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
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
                    onJumpToMainAI={onJumpToMainAI}
                    theme={theme}
                  />
                )}
                {marker.activeMode === "comment" && (
                  <CommentMiniView
                    comments={comments}
                    newComment={newComment}
                    onNewCommentChange={setNewComment}
                    onAddComment={handleAddComment}
                    theme={theme}
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

function OrbitalButton({ icon: Icon, label, angle, distance, isActive, onClick, color, className = "", buttonSize = 44 }: OrbitalButtonProps) {
  const x = Math.cos((angle * Math.PI) / 180) * distance
  const y = Math.sin((angle * Math.PI) / 180) * distance
  const halfSize = buttonSize / 2

  const isDelete = label === "Delete"
  
  // Clean, modern aesthetic
  const bgColor = isDelete ? "bg-red-500" : "bg-white"
  const textColor = isDelete ? "text-white" : (isActive ? "text-purple-600" : "text-slate-400")
  const borderColor = isDelete ? "border-red-600" : (isActive ? "border-purple-200" : "border-slate-100")
  const shadowClass = isDelete ? "shadow-md" : (isActive ? "shadow-md shadow-purple-500/30" : "shadow-sm")

  const isAI = label === "Ask AI"

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
      animate={{ scale: 1, opacity: 1, x: x - halfSize, y: y - halfSize }}
      exit={{ scale: 0, opacity: 0, x: 0, y: 0 }}
      whileHover={{ scale: 1.1, zIndex: 1002 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`absolute rounded-full flex items-center justify-center transition-all duration-200 border-[3px] ${bgColor} ${textColor} ${borderColor} ${shadowClass} ${className}`}
      style={{
        left: "50%",
        top: "50%",
        width: buttonSize,
        height: buttonSize,
        // Add subtle purple glow if active
        boxShadow: isActive ? "0 4px 12px rgba(147, 51, 234, 0.3), inset 0 2px 4px rgba(255,255,255,0.5)" : "0 2px 8px rgba(0, 0, 0, 0.08)"
      }}
      title={label}
    >
      {/* If this is the AI button, render a wrapper that spins the hue/glow continuously */}
      {isAI ? (
        <motion.div
          animate={{ 
            filter: [
              "hue-rotate(0deg) drop-shadow(0 0 2px rgba(147,51,234,0.5))", 
              "hue-rotate(90deg) drop-shadow(0 0 6px rgba(147,51,234,0.8))", 
              "hue-rotate(180deg) drop-shadow(0 0 2px rgba(147,51,234,0.5))", 
              "hue-rotate(270deg) drop-shadow(0 0 6px rgba(147,51,234,0.8))", 
              "hue-rotate(360deg) drop-shadow(0 0 2px rgba(147,51,234,0.5))"
            ] 
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="flex items-center justify-center"
        >
          <Icon 
            style={{ 
              width: buttonSize * 0.45, 
              height: buttonSize * 0.45,
              strokeWidth: isActive ? 2.5 : 2
            }} 
            fill={isActive ? "currentColor" : "none"}
          />
        </motion.div>
      ) : (
        <Icon 
          style={{ 
            width: buttonSize * 0.45, 
            height: buttonSize * 0.45,
            strokeWidth: isActive ? 2.5 : 2
          }} 
        />
      )}
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
  onJumpToMainAI?: (question: string, spatialContext: SpatialContext) => void
  theme?: 'light' | 'dark'
}

function AIMiniView({ chatMessages, spatialContext, isLoading, onAsk, newMessage, onNewMessageChange, onJumpToMainAI, theme = 'light' }: AIMiniViewProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newMessage.trim()) {
      if (onJumpToMainAI) {
        onJumpToMainAI(newMessage.trim(), spatialContext)
        onNewMessageChange('')
      } else {
        onAsk(newMessage.trim())
        onNewMessageChange('')
      }
    }
  }

  const handleSend = () => {
    if (newMessage.trim()) {
      if (onJumpToMainAI) {
        onJumpToMainAI(newMessage.trim(), spatialContext)
        onNewMessageChange('')
      } else {
        onAsk(newMessage.trim())
        onNewMessageChange('')
      }
    }
  }

  const handleQuickAnalysis = () => {
    if (onJumpToMainAI) {
      const contextDescription = `Analyze this ${spatialContext.radiusKm}km radius around ${spatialContext.center[1].toFixed(4)}, ${spatialContext.center[0].toFixed(4)} with ${spatialContext.statsSummary.wellsCount} wells, ${spatialContext.statsSummary.fieldsCount} fields, ${spatialContext.statsSummary.blocksCount} blocks`
      onJumpToMainAI(contextDescription, spatialContext)
    } else {
      onAsk()
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
      <div className={`rounded-lg p-2 border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
        <div className={`text-[10px] uppercase tracking-wide font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Current Context</div>
        <div className="flex flex-wrap gap-1">
          {contextItems.length > 0 ? (
            contextItems.map((item, i) => (
              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                {item}
              </span>
            ))
          ) : (
            <span className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No features in range</span>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
        {chatMessages.length === 0 ? (
          <div className="text-center py-4">
            <Zap className={`w-8 h-8 mx-auto mb-2 ${theme === 'dark' ? 'text-blue-500/30' : 'text-blue-200'}`} />
            <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Ask about the current analysis area</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div 
              key={msg.id} 
              className={`text-[11px] p-2 rounded-lg ${
                msg.role === 'user' 
                  ? `${theme === 'dark' ? 'bg-blue-900/30 text-blue-100 border-blue-800/50' : 'bg-blue-50 text-blue-900 border-blue-100'} ml-4 border` 
                  : `${theme === 'dark' ? 'bg-slate-800/80 text-slate-300 border-slate-700/50' : 'bg-slate-50 text-slate-700 border-slate-100'} mr-4 border`
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
          <div className={`text-[11px] italic animate-pulse p-2 rounded-lg mr-4 border ${theme === 'dark' ? 'text-slate-400 bg-slate-800/50 border-slate-700/50' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>
            AI is analyzing...
          </div>
        )}
      </div>

      {/* Quick Analysis Button (when no messages) */}
      {chatMessages.length === 0 && !isLoading && (
        <button 
          onClick={handleQuickAnalysis}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
        >
          Ask AI Analysis
        </button>
      )}

      {/* Chat Input */}
      <div className={`flex gap-1.5 pt-2 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'}`}>
        <input 
          value={newMessage}
          onChange={e => onNewMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about these features..."
          className={`flex-1 text-xs px-2 py-1.5 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
        />
        <button 
          onClick={handleSend}
          disabled={!newMessage.trim() || isLoading}
          className={`bg-blue-600 text-white p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'disabled:bg-slate-700' : 'disabled:bg-slate-300'}`}
        >
          <Send className="w-3 h-3"/>
        </button>
      </div>
    </div>
  )
}

function ArcSlider({ 
  value, 
  min = 1, 
  max = 50, 
  onChange, 
  color 
}: { 
  value: number; 
  min?: number; 
  max?: number; 
  onChange: (val: number) => void; 
  color: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const width = 280;
  const height = 180; // Increased height to fit the pill above the arc
  const cx = width / 2;
  const cy = 0; // Moved further down to leave space at the top
  const r = 90;
  
  const startAngle = 140;
  const endAngle = 40;
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, startAngle);
    const end = polarToCartesian(x, y, radius, endAngle);
    // For a downward arch from 150 to 30, the arc should be drawn counter-clockwise (sweep-flag = 0)
    const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const trackPath = describeArc(cx, cy, r, startAngle, endAngle);

  // Map value to angle
  const valueRatio = (value - min) / (max - min);
  const currentAngle = startAngle + valueRatio * (endAngle - startAngle);
  const thumbPos = polarToCartesian(cx, cy, r, currentAngle);
  
  // Create fill path, handle case where value is exactly min (no fill)
  const fillPath = value > min ? describeArc(cx, cy, r, startAngle, currentAngle) : "";

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateValueFromEvent(e);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      updateValueFromEvent(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  const updateValueFromEvent = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate angle from center
    let angle = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    
    let clampedAngle = angle;
    
    // For downward arc (140 to 40), valid range is 40..140
    if (angle < endAngle) clampedAngle = endAngle; // < 40
    if (angle > startAngle) { // > 140
        // If they drag way past the end, we don't want it to jump back to start
        if (angle < 270) clampedAngle = startAngle;
        else clampedAngle = endAngle;
    }

    // Ratio is based on how far we are from startAngle (140) towards endAngle (40)
    // We want 0km at left (140 deg) and 50km at right (40 deg)
    const ratio = (startAngle - clampedAngle) / (startAngle - endAngle);
    const newValue = Math.round(min + ratio * (max - min));
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  return (
    <div className="relative flex flex-col items-center select-none w-[280px]">
      <svg 
        ref={svgRef}
        width={width} 
        height={height} 
        className="touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Background track */}
        <path 
          d={trackPath} 
          fill="none" 
          stroke="rgba(30, 41, 59, 0.8)" 
          strokeWidth="10" 
          strokeLinecap="round" 
          className="cursor-pointer"
        />
        {/* Fill track */}
        {fillPath && (
          <path 
            d={fillPath} 
            fill="none" 
            stroke={color} 
            strokeWidth="10" 
            strokeLinecap="round" 
            className="cursor-pointer pointer-events-none"
          />
        )}
        {/* Thumb */}
        <circle 
          cx={thumbPos.x} 
          cy={thumbPos.y} 
          r={isDragging ? 12 : 10} 
          fill="white" 
          stroke={color}
          strokeWidth="4"
          className="cursor-grab hover:cursor-grabbing transition-all duration-150 ease-out pointer-events-none"
          style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.4))" }}
        />
      </svg>
      
      {/* Value Display in the center of the arch */}
      <div 
        className="absolute top-[0px] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center w-14 h-14 rounded-2xl shadow-lg backdrop-blur-md pointer-events-none"
        style={{ 
          background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))`,
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`,
          boxShadow: `0 4px 12px ${color}30, inset 0 1px 0 rgba(255,255,255,0.2)`
        }}
      >
        <span className="text-[20px] font-black leading-none" style={{ color: color, textShadow: `0 2px 4px rgba(0,0,0,0.5)` }}>
          {value}
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider mt-0.5 opacity-80" style={{ color: color }}>
          KM
        </span>
      </div>

      {/* Range Labels */}
      <div className="absolute top-[110px] left-8 text-[11px] font-bold text-slate-500 font-mono">0km</div>
      <div className="absolute top-[110px] right-8 text-[11px] font-bold text-slate-500 font-mono">50km</div>
    </div>
  );
}

// Mini Comment View
interface CommentMiniViewProps {
  comments: MarkerComment[]
  newComment: string
  onNewCommentChange: (text: string) => void
  onAddComment: () => void
  theme?: 'light' | 'dark'
}

function CommentMiniView({ comments, newComment, onNewCommentChange, onAddComment, theme = 'light' }: CommentMiniViewProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newComment.trim()) {
      onAddComment()
    }
  }

  return (
    <div className="space-y-3 p-1">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input 
            value={newComment}
            onChange={e => onNewCommentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note or comment..."
            className={`w-full text-xs px-3 py-2 pr-8 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100 focus:bg-slate-700 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400'}`}
          />
          <button 
            onClick={onAddComment} 
            disabled={!newComment.trim()}
            className={`absolute right-1 top-1 bottom-1 p-1.5 rounded-md disabled:hover:bg-transparent transition-colors ${theme === 'dark' ? 'text-blue-400 hover:bg-blue-900/30 disabled:text-slate-600' : 'text-blue-600 hover:bg-blue-50 disabled:text-slate-300'}`}
          >
            <Send className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>
      
      {comments.length > 0 && (
        <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
          {comments.map((c: any) => (
            <div key={c.id} className="flex gap-2 group">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold shadow-sm">
                {c.user.charAt(0).toUpperCase()}
              </div>
              <div className={`flex-1 rounded-xl rounded-tl-sm p-2.5 shadow-sm transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 group-hover:border-slate-600' : 'bg-slate-50 border-slate-100 group-hover:border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-[10px] ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{c.user}</span>
                  <span className={`text-[9px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Just now</span>
                </div>
                <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {comments.length === 0 && (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
            <MessageSquare className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-300'}`} />
          </div>
          <span className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No notes yet</span>
          <span className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Add a note to this area</span>
        </div>
      )}
    </div>
  )
}

function RadialDataVisualization({ stats, color, config, dynamicRadius }: { stats: MarkerStats; color: string; config: any; dynamicRadius: number }) {
  const radius = dynamicRadius;
  const size = (radius + config.vizMaxLineLength + 40) * 2;
  const cx = size / 2;
  const cy = size / 2;
  const thickness = config.vizLineThickness * 3 + 2; // Added 2px extra thickness

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
        
        {/* 1. Radiating Bars - with smooth spring animations */}
        {rawData.map((item, i) => {
          // Normalize height: (current value / max value) * max length from config
          // If value is 0, bar length is 0 (no minimum)
          const targetBarLength = item.value === 0 ? 0 : (item.value / maxDataValue) * config.vizMaxLineLength * 1.5 + 5;
          
          // Convert angle to radians for trigonometry
          const angleRad = (item.angle * Math.PI) / 180;
          
          // Calculate inner point (on arc edge)
          const innerX = cx + radius * Math.sin(angleRad);
          const innerY = cy - radius * Math.cos(angleRad);
          
          return (
            <g key={`bar-${item.label}`}>
              {/* The Bar - animated with spring physics */}
              <motion.line
                x1={innerX}
                y1={innerY}
                x2={innerX + (item.value === 0 ? 0 : targetBarLength) * Math.sin(angleRad)}
                y2={innerY - (item.value === 0 ? 0 : targetBarLength) * Math.cos(angleRad)}
                stroke={item.color}
                strokeWidth={thickness}
                strokeLinecap="butt"
                initial={{ 
                  x2: innerX, 
                  y2: innerY 
                }}
                animate={{ 
                  x2: innerX + (item.value === 0 ? 0 : targetBarLength) * Math.sin(angleRad),
                  y2: innerY - (item.value === 0 ? 0 : targetBarLength) * Math.cos(angleRad)
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 120, 
                  damping: 15,
                  mass: 0.5
                }}
              />
              
              {/* Value Label: always show, positioned closer to bar */}
              <motion.text
                x={innerX + (item.value === 0 ? 0 : targetBarLength) * Math.sin(angleRad)}
                y={innerY - (item.value === 0 ? 0 : targetBarLength) * Math.cos(angleRad) - 4}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#0f172a"
                stroke="white"
                strokeWidth="2"
                paintOrder="stroke"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 20,
                  delay: i * 0.05 
                }}
              >
                {item.value}
              </motion.text>
            </g>
          );
        })}

        {/* 2. Dynamic Arc: Split into Purple (Left) and Yellow (Right) - with subtle pulse */}
        <motion.path
          d={describeArc(cx, cy, radius, -60, 0)}
          fill="none"
          stroke="#9333EA"
          strokeWidth={Math.max(8, thickness * 1.5)}
          strokeLinecap="butt"
          opacity="0.9"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 20,
            duration: 0.6 
          }}
        />
        <motion.path
          d={describeArc(cx, cy, radius, 0, 60)}
          fill="none"
          stroke="#EAB308"
          strokeWidth={Math.max(8, thickness * 1.5)}
          strokeLinecap="butt"
          opacity="0.9"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 20,
            duration: 0.6,
            delay: 0.1 
          }}
        />

        {/* 3. Category Labels - with fade animation */}
        {rawData.map((item, i) => {
          const angleRad = (item.angle * Math.PI) / 180;
          const innerX = cx + radius * Math.sin(angleRad);
          const innerY = cy - radius * Math.cos(angleRad);

          return (
            <motion.g 
              key={`label-${item.label}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                delay: 0.3 + i * 0.05 
              }}
            >
              {/* Category Label background */}
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
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

