"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import {
  Activity,
  BarChart3,
  Bot,
  MessageSquare,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Move,
  Settings,
  Trash2,
  MoreVertical
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
  MarkerComment
} from "./analysis-marker-types"
import {
  calculateSpatialContext,
  calculateMarkerStats,
  calculateDistance
} from "./analysis-marker-utils"

interface AnalysisMarkerManagerProps {
  view: MapView | SceneView | null
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

export function AnalysisMarkerManager({
  view,
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
      activeMode: "stats"
    }

    setMarkers(prev => [...prev, newMarker])
    setSelectedMarkerId(newMarker.id)
    onMarkerCreate?.(newMarker)

    return newMarker
  }, [markers.length, onMarkerCreate])

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
      // @ts-ignore - mapPoint may be undefined
      const mapPoint = event.mapPoint
      if (!mapPoint) return
      
      const position: MarkerPosition = {
        longitude: mapPoint.longitude,
        latitude: mapPoint.latitude
      }
      createMarker(position)
      setIsCreating(false)
    }

    const handleMouseMove = (event: __esri.ViewPointerMoveEvent) => {
      // @ts-ignore - mapPoint exists on the event
      const mapPoint = event.mapPoint
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

      // Radius circle
      const circle = new Circle({
        center: point,
        radius: marker.radiusKm * 1000, // Convert to meters
        radiusUnit: "meters"
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
      {/* Control Panel */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Analysis Markers</h3>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className={`p-2 rounded-lg transition-colors ${
              isCreating 
                ? "bg-blue-100 text-blue-600" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title={isCreating ? "Cancel creation" : "Create new marker"}
          >
            {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {isCreating && (
          <p className="text-xs text-slate-500 mb-3">
            Click on the map to place a marker
          </p>
        )}

        {/* Marker List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {markers.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No markers. Click + to create one.
            </p>
          ) : (
            markers.map(marker => (
              <div
                key={marker.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedMarkerId === marker.id
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
                onClick={() => setSelectedMarkerId(marker.id)}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: marker.color }}
                />
                <span className="text-xs font-medium text-slate-700 flex-1 truncate">
                  {marker.label}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteMarker(marker.id)
                  }}
                  className="p-1 rounded hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

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
}

function AnalysisMarkerPanel({
  marker,
  geoData,
  onUpdate,
  onDelete,
  onClose
}: AnalysisMarkerPanelProps) {
  const [spatialContext, setSpatialContext] = useState<SpatialContext | null>(null)
  const [stats, setStats] = useState<MarkerStats | null>(null)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
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

  // Handle AI query
  const handleAskAI = async () => {
    if (!spatialContext) return
    
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
          query: `Analyze this ${marker.radiusKm}km radius around ${marker.label}`,
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
    } catch (error) {
      console.error("AI query failed:", error)
      setAiResult({
        insights: "Failed to get AI insights. Please try again.",
        opportunities: [],
        dataGaps: ["AI service unavailable"],
        followUpQuestions: [],
        timestamp: Date.now()
      })
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

  return (
    <div className="absolute top-4 right-4 z-[1000] w-96 max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: marker.color + "20" }} // 20 = ~12% opacity
      >
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: marker.color }}
        />
        
        {isEditingLabel ? (
          <input
            type="text"
            value={editedLabel}
            onChange={(e) => setEditedLabel(e.target.value)}
            onBlur={() => {
              onUpdate(marker.id, { label: editedLabel })
              setIsEditingLabel(false)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdate(marker.id, { label: editedLabel })
                setIsEditingLabel(false)
              }
            }}
            className="flex-1 text-sm font-semibold bg-transparent border-b border-slate-400 outline-none"
            autoFocus
          />
        ) : (
          <span 
            className="flex-1 text-sm font-semibold cursor-pointer hover:underline"
            onClick={() => setIsEditingLabel(true)}
          >
            {marker.label}
          </span>
        )}
        
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Radius Control */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-600">Radius</span>
          <span className="text-xs font-semibold text-slate-800">{marker.radiusKm} km</span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          value={marker.radiusKm}
          onChange={(e) => handleRadiusChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>1km</span>
          <span>50km</span>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-slate-100">
        {[
          { mode: "stats" as const, icon: Activity, label: "Stats" },
          { mode: "graph" as const, icon: BarChart3, label: "Graph" },
          { mode: "ai" as const, icon: Bot, label: "Ask AI" },
          { mode: "comment" as const, icon: MessageSquare, label: "Comments" },
        ].map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`flex-1 py-2 px-2 flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
              marker.activeMode === mode
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Stats Mode */}
        {marker.activeMode === "stats" && stats && spatialContext && (
          <StatsView stats={stats} spatialContext={spatialContext} />
        )}

        {/* Graph Mode */}
        {marker.activeMode === "graph" && stats && (
          <GraphView stats={stats} color={marker.color} />
        )}

        {/* AI Mode */}
        {marker.activeMode === "ai" && (
          <AIMode
            aiResult={aiResult}
            isLoading={isLoadingAI}
            onAsk={handleAskAI}
            hasSpatialContext={!!spatialContext}
          />
        )}

        {/* Comment Mode */}
        {marker.activeMode === "comment" && (
          <CommentMode
            comments={comments}
            newComment={newComment}
            onNewCommentChange={setNewComment}
            onAddComment={handleAddComment}
          />
        )}
      </div>
    </div>
  )
}

// Stats View Component
function StatsView({
  stats,
  spatialContext
}: {
  stats: MarkerStats
  spatialContext: SpatialContext
}) {
  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Wells"
          value={stats.wells.total.toString()}
          subtext={`${stats.wells.gas} gas, ${stats.wells.oil} oil`}
          color="blue"
        />
        <StatCard
          label="Fields"
          value={stats.fields.total.toString()}
          subtext={`${stats.fields.gas} gas, ${stats.fields.oil} oil`}
          color="emerald"
        />
        <StatCard
          label="Operators"
          value={Object.keys(stats.wells.byOperator).length.toString()}
          subtext="active"
          color="amber"
        />
        <StatCard
          label="Blocks"
          value={stats.blocks.total.toString()}
          subtext="intersecting"
          color="violet"
        />
      </div>

      {/* Well Results Breakdown */}
      {stats.wells.total > 0 && (
        <div className="bg-slate-50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Well Results</h4>
          <div className="space-y-1">
            <ResultBar label="Gas" value={stats.wells.gas} total={stats.wells.total} color="bg-emerald-500" />
            <ResultBar label="Oil" value={stats.wells.oil} total={stats.wells.total} color="bg-amber-500" />
            <ResultBar label="Dry" value={stats.wells.dry} total={stats.wells.total} color="bg-red-400" />
            <ResultBar label="Unknown" value={stats.wells.unknown} total={stats.wells.total} color="bg-slate-300" />
          </div>
        </div>
      )}

      {/* Top Operators */}
      {Object.keys(stats.wells.byOperator).length > 0 && (
        <div className="bg-slate-50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Top Operators</h4>
          <div className="space-y-1">
            {Object.entries(stats.wells.byOperator)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([operator, count]) => (
                <div key={operator} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{operator}</span>
                  <span className="font-medium text-slate-800">{count} wells</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Seismic Coverage */}
      <div className="bg-slate-50 rounded-lg p-3">
        <h4 className="text-xs font-semibold text-slate-700 mb-2">Seismic Coverage</h4>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-600">2D Lines</span>
          <span className="font-medium text-slate-800">{spatialContext.featuresInside.seismic2d.length}</span>
        </div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-600">3D Surveys</span>
          <span className="font-medium text-slate-800">{spatialContext.featuresInside.seismic3d.length}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">Coverage</span>
          <span className={`font-medium ${
            spatialContext.statsSummary.seismicCoverage === 'high' ? 'text-emerald-600' :
            spatialContext.statsSummary.seismicCoverage === 'moderate' ? 'text-amber-600' :
            'text-red-500'
          }`}>
            {spatialContext.statsSummary.seismicCoverage}
          </span>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  subtext,
  color
}: {
  label: string
  value: string
  subtext: string
  color: string
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    violet: "bg-violet-50 border-violet-200 text-violet-700",
  }

  return (
    <div className={`rounded-lg p-3 border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] font-medium opacity-70">{label}</div>
      <div className="text-[10px] opacity-60">{subtext}</div>
    </div>
  )
}

function ResultBar({
  label,
  value,
  total,
  color
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-600 w-12">{label}</span>
      <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-slate-700 w-6">{value}</span>
    </div>
  )
}

// Graph View Component
function GraphView({
  stats,
  color
}: {
  stats: MarkerStats
  color: string
}) {
  const maxValue = Math.max(
    stats.wells.total,
    stats.fields.total,
    Object.keys(stats.wells.byOperator).length,
    stats.blocks.total,
    stats.seismic.surveys
  ) || 1

  const data = [
    { label: "Wells", value: stats.wells.total },
    { label: "Fields", value: stats.fields.total },
    { label: "Operators", value: Object.keys(stats.wells.byOperator).length },
    { label: "Blocks", value: stats.blocks.total },
    { label: "Seismic", value: stats.seismic.surveys },
  ]

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-slate-700">Activity Overview</h4>
      
      <div className="space-y-3">
        {data.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs text-slate-600 w-20">{label}</span>
            <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{
                  width: `${(value / maxValue) * 100}%`,
                  backgroundColor: color,
                  opacity: 0.8
                }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700 w-8">{value}</span>
          </div>
        ))}
      </div>

      {/* Operator Distribution */}
      {Object.keys(stats.wells.byOperator).length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Operator Distribution</h4>
          <div className="space-y-2">
            {Object.entries(stats.wells.byOperator)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([operator, count]) => {
                const opPercentage = (count / stats.wells.total) * 100
                return (
                  <div key={operator} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 w-16 truncate">{operator}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${opPercentage}%`,
                          backgroundColor: color,
                          opacity: 0.6
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 w-6">{count}</span>
                  </div>
                )
              })
            }
          </div>
        </div>
      )}
    </div>
  )
}

// AI Mode Component
function AIMode({
  aiResult,
  isLoading,
  onAsk,
  hasSpatialContext
}: {
  aiResult: AIResult | null
  isLoading: boolean
  onAsk: () => void
  hasSpatialContext: boolean
}) {
  return (
    <div className="space-y-4">
      {!aiResult && !isLoading && (
        <div className="text-center py-8">
          <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600 mb-4">
            Ask AI to analyze this area for exploration opportunities
          </p>
          <button
            onClick={onAsk}
            disabled={!hasSpatialContext}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            Analyze Area
          </button>
          {!hasSpatialContext && (
            <p className="text-xs text-slate-400 mt-2">
              Move marker or adjust radius to get data
            </p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600">Analyzing area...</p>
        </div>
      )}

      {aiResult && !isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-700">AI Analysis</h4>
            <span className="text-[10px] text-slate-400">
              {new Date(aiResult.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="prose prose-sm max-w-none">
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap">
              {aiResult.insights}
            </div>
          </div>

          {aiResult.followUpQuestions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-2">Follow-up Questions</h4>
              <div className="space-y-1">
                {aiResult.followUpQuestions.map((q, i) => (
                  <div key={i} className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1.5">
                    • {q}
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiResult.dataGaps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-2">Data Gaps</h4>
              <div className="space-y-1">
                {aiResult.dataGaps.map((gap, i) => (
                  <div key={i} className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1.5">
                    ⚠ {gap}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onAsk}
            className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Refresh Analysis
          </button>
        </div>
      )}
    </div>
  )
}

// Comment Mode Component
function CommentMode({
  comments,
  newComment,
  onNewCommentChange,
  onAddComment
}: {
  comments: MarkerComment[]
  newComment: string
  onNewCommentChange: (text: string) => void
  onAddComment: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => onNewCommentChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAddComment()}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onAddComment}
          disabled={!newComment.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-white">
                    {comment.user[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-700">{comment.user}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(comment.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-slate-700">{comment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Utility: Convert hex color to RGB array
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [59, 130, 246] // default blue
}
