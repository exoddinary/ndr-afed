"use client"

import { useEffect, useRef, useState } from "react"
import { Circle, Ruler, Trash2, X } from "lucide-react"
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine"
import Graphic from "@arcgis/core/Graphic"
import Point from "@arcgis/core/geometry/Point"
import TextSymbol from "@arcgis/core/symbols/TextSymbol"

type MapToolsProps = {
    view: __esri.MapView | __esri.SceneView | null
}

type ActiveTool = "radius" | "line" | null

export function MapTools({ view }: MapToolsProps) {
    const [activeTool, setActiveTool] = useState<ActiveTool>(null)
    const [measurement, setMeasurement] = useState<string | null>(null)
    const sketchVMRef = useRef<SketchViewModel | null>(null)
    const graphicsLayerRef = useRef<GraphicsLayer | null>(null)
    const labelsLayerRef = useRef<GraphicsLayer | null>(null)

    // Initialize graphics layers and sketch view model
    useEffect(() => {
        if (!view || !view.map) return

        // Create graphics layer for drawings
        const graphicsLayer = new GraphicsLayer({
            title: "Measurement Graphics"
        })
        const labelsLayer = new GraphicsLayer({
            title: "Measurement Labels"
        })

        view.map.add(graphicsLayer)
        view.map.add(labelsLayer)
        graphicsLayerRef.current = graphicsLayer
        labelsLayerRef.current = labelsLayer

        // Create sketch view model
        const sketchVM = new SketchViewModel({
            view: view,
            layer: graphicsLayer,
            pointSymbol: {
                type: "simple-marker",
                style: "circle",
                color: [59, 130, 246, 0.8],
                size: 8,
                outline: {
                    color: [255, 255, 255],
                    width: 2
                }
            } as any,
            polylineSymbol: {
                type: "simple-line",
                color: [59, 130, 246, 1],
                width: 3,
                style: "solid"
            } as any,
            polygonSymbol: {
                type: "simple-fill",
                color: [59, 130, 246, 0.2],
                outline: {
                    color: [59, 130, 246, 1],
                    width: 2
                }
            } as any
        })

        sketchVMRef.current = sketchVM

        // Listen for create events
        sketchVM.on("create", (event) => {
            if (event.state === "complete") {
                const geometry = event.graphic.geometry
                if (!geometry) return

                if (geometry.type === "polygon") {
                    // For radius tool (circle drawn as polygon)
                    const polygon = geometry as __esri.Polygon
                    const centroid = polygon.centroid
                    const extent = polygon.extent
                    if (!extent) return

                    // Calculate approximate radius from extent
                    const radiusKm = (extent.width / 2) * 111 // Convert degrees to km (approximate)

                    if (radiusKm >= 1) {
                        setMeasurement(`Radius: ${radiusKm.toFixed(2)} km`)
                    } else {
                        setMeasurement(`Radius: ${(radiusKm * 1000).toFixed(0)} m`)
                    }

                    // Add label at center
                    if (centroid && labelsLayerRef.current) {
                        addMeasurementLabel(centroid, radiusKm >= 1 ? `${radiusKm.toFixed(2)} km` : `${(radiusKm * 1000).toFixed(0)} m`)
                    }
                } else if (geometry.type === "polyline") {
                    // For line tool
                    const polyline = geometry as __esri.Polyline
                    const lengthMeters = geometryEngine.geodesicLength(polyline, "meters")
                    const lengthKm = lengthMeters / 1000

                    if (lengthKm >= 1) {
                        setMeasurement(`Distance: ${lengthKm.toFixed(2)} km`)
                    } else {
                        setMeasurement(`Distance: ${lengthMeters.toFixed(0)} m`)
                    }

                    // Add label at midpoint
                    const midPath = polyline.paths[0]
                    if (midPath && midPath.length >= 2) {
                        const midIndex = Math.floor(midPath.length / 2)
                        const midPoint = new Point({
                            x: midPath[midIndex][0],
                            y: midPath[midIndex][1],
                            spatialReference: polyline.spatialReference
                        })
                        addMeasurementLabel(midPoint, lengthKm >= 1 ? `${lengthKm.toFixed(2)} km` : `${lengthMeters.toFixed(0)} m`)
                    }
                }

                setActiveTool(null)
            }
        })

        const addMeasurementLabel = (point: __esri.Point, text: string) => {
            const labelGraphic = new Graphic({
                geometry: point,
                symbol: new TextSymbol({
                    text: text,
                    color: "white",
                    haloColor: [59, 130, 246, 1],
                    haloSize: 2,
                    font: {
                        size: 12,
                        weight: "bold",
                        family: "Arial"
                    },
                    yoffset: 15
                })
            })
            labelsLayerRef.current?.add(labelGraphic)
        }

        const currentMap = view.map
        return () => {
            sketchVM.destroy()
            if (graphicsLayerRef.current && currentMap) {
                currentMap.remove(graphicsLayerRef.current)
            }
            if (labelsLayerRef.current && currentMap) {
                currentMap.remove(labelsLayerRef.current)
            }
        }
    }, [view])

    const handleRadiusTool = () => {
        if (!sketchVMRef.current) return

        if (activeTool === "radius") {
            sketchVMRef.current.cancel()
            setActiveTool(null)
        } else {
            setActiveTool("radius")
            setMeasurement(null)
            sketchVMRef.current.create("circle")
        }
    }

    const handleLineTool = () => {
        if (!sketchVMRef.current) return

        if (activeTool === "line") {
            sketchVMRef.current.cancel()
            setActiveTool(null)
        } else {
            setActiveTool("line")
            setMeasurement(null)
            sketchVMRef.current.create("polyline")
        }
    }

    const handleClear = () => {
        graphicsLayerRef.current?.removeAll()
        labelsLayerRef.current?.removeAll()
        setMeasurement(null)
        setActiveTool(null)
        sketchVMRef.current?.cancel()
    }

    if (!view) return null

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
            {/* Measurement Display */}
            {measurement && (
                <div className="bg-white/95 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-slate-200 text-sm font-mono font-bold text-slate-800 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-blue-500" />
                    {measurement}
                    <button
                        onClick={() => setMeasurement(null)}
                        className="ml-2 p-0.5 hover:bg-slate-100 rounded"
                    >
                        <X className="w-3 h-3 text-slate-400" />
                    </button>
                </div>
            )}

            {/* Tools Toolbar */}
            <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg border border-slate-200 flex items-center p-1 gap-1">
                <button
                    onClick={handleRadiusTool}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${activeTool === "radius"
                        ? "bg-blue-500 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                    title="Draw radius circle"
                >
                    <Circle className="w-4 h-4" />
                    Radius
                </button>

                <div className="w-px h-6 bg-slate-200" />

                <button
                    onClick={handleLineTool}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${activeTool === "line"
                        ? "bg-blue-500 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                    title="Draw measurement line"
                >
                    <Ruler className="w-4 h-4" />
                    Line
                </button>

                <div className="w-px h-6 bg-slate-200" />

                <button
                    onClick={handleClear}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
                    title="Clear all measurements"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear
                </button>
            </div>

            {/* Active Tool Hint */}
            {activeTool && (
                <div className="text-xs text-white bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg">
                    {activeTool === "radius" ? "Click and drag to draw a circle" : "Click to draw, double-click to finish"}
                </div>
            )}
        </div>
    )
}
