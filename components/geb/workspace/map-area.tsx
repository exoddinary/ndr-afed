"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import Map from "@arcgis/core/Map"
import MapView from "@arcgis/core/views/MapView"
import SceneView from "@arcgis/core/views/SceneView"
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer"
import MapImageLayer from "@arcgis/core/layers/MapImageLayer"
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol"
import Extent from "@arcgis/core/geometry/Extent"
import LabelClass from "@arcgis/core/layers/support/LabelClass"
import TextSymbol from "@arcgis/core/symbols/TextSymbol"
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils"
import "@arcgis/core/assets/esri/themes/light/main.css"

// Props to allow parent to listen to map clicks
type MapAreaProps = {
   onElementClick?: (type: "polygon" | "play" | "basin", data: any) => void
   activeLayers?: string[]
   is3D?: boolean
   onToggle3D?: () => void
}

export function MapArea({ onElementClick, activeLayers = [], is3D = false, onToggle3D }: MapAreaProps = {}) {
   const mapDiv = useRef<HTMLDivElement>(null)
   const viewRef = useRef<MapView | SceneView | null>(null)
   const mapRef = useRef<Map | null>(null)
   const layersRef = useRef<Record<string, __esri.Layer>>({})
   const [mounted, setMounted] = useState(false)

   const formatExpiryDate = (value: any): string => {
      const d = new Date(value)
      if (isNaN(d.getTime())) return "-"

      const day = d.getDate()
      const monthIndex = d.getMonth()
      const year = d.getFullYear()

      const suffix = day % 10 === 1 && day !== 11
         ? "st"
         : day % 10 === 2 && day !== 12
         ? "nd"
         : day % 10 === 3 && day !== 13
         ? "rd"
         : "th"

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return `${day}${suffix} ${months[monthIndex]} ${year}`
   }

   useEffect(() => {
      setMounted(true)
   }, [])

   // Combined Effect: Handle View Switching and Layer Initialization
   useEffect(() => {
      if (!mounted || !mapDiv.current) return

      // 1. Save current extent/center from previous view if available
      let currentCenter = [117.5, 2.5]
      let currentZoom = 6
      
      if (viewRef.current) {
         if (viewRef.current.center) {
             currentCenter = [viewRef.current.center.longitude ?? 117.5, viewRef.current.center.latitude ?? 2.5]
         }
         if (viewRef.current.zoom) {
             currentZoom = viewRef.current.zoom ?? 6
         }
         viewRef.current.destroy()
         viewRef.current = null
      }

      // 2. Create new Map instance
      const map = new Map({
         basemap: "satellite",
         ground: is3D ? "world-elevation" : undefined
      })
      mapRef.current = map

      // 3. Initialize Layers on the new Map
      const blocksLayer = new GeoJSONLayer({
         url: "/data/exploration-blocks.json",
         copyright: "ESDM",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-fill",
               color: [245, 158, 11, 0.2],
               outline: { color: [251, 191, 36, 1], width: 2 }
            } as any
         },
         labelingInfo: [
            new LabelClass({
               labelExpressionInfo: { expression: "$feature.namobj" },
               symbol: new TextSymbol({
                  color: "white",
                  haloColor: [50, 50, 50, 0.9],
                  haloSize: 2,
                  font: { size: 11, weight: "bold", family: "Arial" }
               }),
               minScale: 3000000,
               maxScale: 0
            })
         ],
         popupTemplate: {
            title: "{namobj}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "oprblk", label: "Operator" },
                  { fieldName: "status", label: "Status" },
                  {
                    fieldName: "expdat",
                    label: "Expiry Date",
                    format: { dateFormat: "short-date" }
                  }
               ]
            }]
         },
         visible: activeLayers.includes('active-blocks'),
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(blocksLayer)
      layersRef.current['active-blocks'] = blocksLayer

      const seismicLayer = new MapImageLayer({
         url: "https://datamigas.esdm.go.id/arcgis/rest/services/MDR2/Seismik_2D_LN/MapServer",
         opacity: 0.7,
         visible: activeLayers.includes('seismic-2d')
      })
      map.add(seismicLayer)
      layersRef.current['seismic-2d'] = seismicLayer

      const pipelineLayer = new GeoJSONLayer({
         url: "/data/pipeline/pipe_infrastructure.geojson",
         copyright: "ESDM",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-line",
               color: [255, 215, 0, 1],
               width: 2
            } as any
         },
         visible: activeLayers.includes('pipeline-infrastructure'),
         minScale: 5000000,
         effect: "bloom(1.5, 0.5px, 0.1)",
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(pipelineLayer)
      layersRef.current['pipeline-infrastructure'] = pipelineLayer

      // Manually load and render platforms as graphics (bypasses GeoJSONLayer issues)
      if (activeLayers.includes('platform-migas')) {
         fetch('/data/platform/platforms_migas.geojson')
            .then(res => res.json())
            .then(data => {
               console.log('Loaded platform GeoJSON, feature count:', data.features.length)
               // Store in a ref for later
               (window as any).__platformData = data
               
               // If view is already ready, add them now
               if (viewRef.current) {
                  addPlatformGraphics(viewRef.current, data)
               }
            })
            .catch(err => console.error('Failed to load platform GeoJSON:', err))
      }

      // Helper function to add graphics
      const addPlatformGraphics = (view: MapView | SceneView, data: any) => {
         import("@arcgis/core/Graphic").then(({ default: Graphic }) => {
            import("@arcgis/core/geometry/Point").then(({ default: Point }) => {
               import("@arcgis/core/symbols/SimpleMarkerSymbol").then(({ default: SimpleMarkerSymbol }) => {
                  
                  const graphics = data.features.map((feature: any) => {
                     const [lon, lat] = feature.geometry.coordinates
                     return new Graphic({
                        geometry: new Point({
                           longitude: lon,
                           latitude: lat
                        }),
                        symbol: new SimpleMarkerSymbol({
                           style: "square",
                           color: [255, 255, 0, 1], // Bright Yellow
                           size: 20,
                           outline: {
                              color: [255, 0, 0, 1], // Red outline
                              width: 3
                           }
                        }),
                        attributes: feature.properties
                     })
                  })
                  
                  view.graphics.addMany(graphics)
                  console.log(`Added ${graphics.length} platform graphics to view`)
               })
            })
         })
      }

      // 4. Create View
      let view: MapView | SceneView

      if (is3D) {
         view = new SceneView({
            container: mapDiv.current,
            map: map,
            camera: {
                position: {
                    longitude: currentCenter[0],
                    latitude: currentCenter[1] - 0.5, // Offset slightly south to look at target
                    z: 150000 // Closer zoom (150km)
                },
                tilt: 60, // Steeper angle
                heading: 0
            },
            environment: {
                lighting: {
                    type: "virtual"
                },
                atmosphereEnabled: true
            },
            ui: {
               components: ["zoom", "attribution", "navigation-toggle", "compass"]
            },
            qualityProfile: "high"
         })

         // Keep standard UI in the top-left (default) so ArcGIS controls sit on the left side
         // No need to move them to top-right; this keeps them consistent between 2D and 3D

         // Cinematic Rotation
         reactiveUtils.when(
            () => !view.updating,
            () => {
               let heading = 0
               const rotate = () => {
                  if (!viewRef.current || viewRef.current.type !== "3d") return
                  
                  // Increment heading
                  heading = (heading + 0.05) % 360

                  // Rotate camera around the current center
                  const currentView = viewRef.current as SceneView
                  currentView.goTo({
                      target: currentCenter,
                      heading: heading,
                      tilt: 60
                  }, { 
                      animate: false 
                  })
                  
                  requestAnimationFrame(rotate)
               }
               requestAnimationFrame(rotate)
            },
            { once: true }
         )
      } else {
         view = new MapView({
            container: mapDiv.current,
            map: map,
            center: currentCenter as [number, number],
            zoom: currentZoom,
            ui: {
               components: ["zoom", "attribution"]
            }
         })
        
         // Keep 2D zoom in the default top-left position for consistency with 3D controls
      }

      viewRef.current = view

      // Dock popup so it doesn't sit on top of the block geometry
      // Applies to both 2D and 3D views
      if ((view as any).popup) {
         const popup: any = (view as any).popup
         popup.dockEnabled = true
         popup.collapseEnabled = true
         popup.dockOptions = {
            position: "top-right",
            breakpoint: false
         }
      }
      
      // Setup handlers (including safe hitTest)
      view.on("click", async (event: any) => {
            const response = await view.hitTest(event)
            const results = response.results.filter((result: any) =>
               result.type === "graphic" && 
               (result.graphic?.layer === blocksLayer) // Check against current layer instance
            )
   
            if (results.length > 0) {
               const graphic = (results[0] as any).graphic
               const attr = graphic.attributes
   
               if (graphic.geometry && graphic.geometry.type === "polygon") {
                  const polygon = graphic.geometry as __esri.Polygon
                  const extent = polygon.extent
   
                  if (extent) {
                     view.goTo({
                        target: extent.expand(1.67),
                        tilt: is3D ? 45 : 0
                     }, {
                        duration: 400,
                        easing: "ease-in-out"
                     })
                  }
               }
   
               onElementClick?.("polygon", {
                  name: attr.namobj,
                  operator: attr.oprblk,
                  status: attr.status,
                  expiry: formatExpiryDate(attr.expdat)
               })
            }
      })

      // Add platform graphics manually if data was loaded
      if ((window as any).__platformData && activeLayers.includes('platform-migas')) {
         addPlatformGraphics(view, (window as any).__platformData)
      }

      // Expose globally
      if (typeof window !== 'undefined') {
         (window as any).mapView = view
      }

   }, [mounted, is3D]) // Re-run when view mode changes

   // Separate effect just for toggling visibility (lightweight)
   useEffect(() => {
      Object.entries(layersRef.current).forEach(([key, layer]) => {
         if (layer) {
             if (activeLayers.includes(key)) layer.visible = true
             else layer.visible = false
         }
      })
   }, [activeLayers])

   if (!mounted) return <div className="w-full h-full bg-gray-100 animate-pulse" />

    return (
      <div className="w-full h-full relative group">
        <div ref={mapDiv} className="w-full h-full" />
         
         {/* Return to 2D Mode Overlay (top-left, offset to the right of ArcGIS controls) */}
         {is3D && (
            <div className="absolute top-4 left-20 z-10">
               <button
                  onClick={() => onToggle3D?.()}
                  className="bg-white/90 backdrop-blur text-slate-700 px-3 py-1.5 rounded shadow-md text-xs font-bold uppercase tracking-wider border border-slate-200 hover:bg-white transition-colors flex items-center gap-2"
               >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                  Return to 2D
               </button>
            </div>
         )}

         {/* Test button to zoom to a known platform location */}
         <div className="absolute bottom-4 right-4 z-10">
            <button
               onClick={() => {
                  if (viewRef.current) {
                     viewRef.current.goTo({
                        center: [133.21, -2.29],
                        zoom: 12
                     })
                     console.log('Zooming to platform location: 133.21, -2.29')
                  }
               }}
               className="bg-yellow-500 text-slate-900 px-3 py-2 rounded shadow-lg text-xs font-bold uppercase tracking-wider border-2 border-yellow-600 hover:bg-yellow-400 transition-colors"
            >
               🔍 Test: Zoom to Platform
            </button>
         </div>
      </div>
   )
}
