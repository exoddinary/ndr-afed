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
import FeatureLayer from "@arcgis/core/layers/FeatureLayer"
import Graphic from "@arcgis/core/Graphic"
import Point from "@arcgis/core/geometry/Point"
// @ts-ignore - shpjs doesn't have type declarations
import shp from "shpjs"
import "@arcgis/core/assets/esri/themes/light/main.css"

// Props to allow parent to listen to map clicks
type MapAreaProps = {
   onElementClick?: (type: "polygon" | "play" | "basin", data: any) => void
   activeLayers?: string[]
   is3D?: boolean
   onToggle3D?: () => void
   onViewReady?: (view: __esri.MapView | __esri.SceneView) => void
}

export function MapArea({ onElementClick, activeLayers = [], is3D = false, onToggle3D, onViewReady }: MapAreaProps = {}) {
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

      console.log('🗺️ MAP EFFECT RUNNING - mounted:', mounted, 'is3D:', is3D)

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
                  font: { size: 10, weight: "bold", family: "Arial" }
               }),
               minScale: 0, // Always show labels
               maxScale: 0,
               labelPlacement: "always-horizontal"
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

      // Wells layer - ArcGIS service (points)
      const wellsLayer = new FeatureLayer({
         url: "https://datamigas.esdm.go.id/arcgis/rest/services/MDR2/well/MapServer/0",
         title: "Wells",
         outFields: ["*"],
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-marker",
               style: "circle",
               color: [0, 255, 255, 0.9], // cyan
               size: 3, // smaller dots
               outline: {
                  color: [0, 128, 128, 1],
                  width: 0.5
               }
            }
         } as any,
         popupTemplate: {
            title: "Well: {WELLNAME}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "WELLNAME", label: "Name" },
                  { fieldName: "FIELD", label: "Field" },
                  { fieldName: "OPERATOR", label: "Operator" },
                  { fieldName: "STATUS", label: "Status" }
               ]
            }]
         },
         visible: activeLayers.includes('wells'),
         effect: "bloom(1.3, 1px, 0.1)",
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(wellsLayer)
      layersRef.current['wells'] = wellsLayer

      // Platform layer - load from shapefile using shpjs

      // Load shapefile and create FeatureLayer
      fetch('/data/platform/platforms_migas.zip')
         .then(response => response.arrayBuffer())
         .then(buffer => shp(buffer))
         .then((geojson: any) => {
            console.log('📍 Shapefile parsed via shpjs')

            // Handle both single and multiple layer results
            const features = Array.isArray(geojson) ? geojson[0].features : geojson.features
            console.log('📍 Features count:', features?.length)

            if (!features || features.length === 0) {
               console.error('No features found in shapefile')
               return
            }

            // Convert GeoJSON features to ArcGIS Graphics (filter out null geometries)
            const graphics = features
               .filter((feature: any) => feature.geometry && feature.geometry.coordinates)
               .map((feature: any, index: number) => {
                  const coords = feature.geometry.coordinates
                  return new Graphic({
                     geometry: new Point({
                        x: coords[0],
                        y: coords[1],
                        spatialReference: { wkid: 4326 }
                     }),
                     attributes: {
                        OBJECTID: index + 1,
                        ...feature.properties
                     }
                  })
               })

            console.log('📍 Valid graphics (after filtering null geometries):', graphics.length)

            // Create FeatureLayer from graphics with diamond symbols and bloom effect
            const platformLayer = new FeatureLayer({
               source: graphics,
               objectIdField: "OBJECTID",
               geometryType: "point",
               spatialReference: { wkid: 4326 },
               fields: [
                  { name: "OBJECTID", type: "oid" },
                  { name: "nama_platf", type: "string" },
                  { name: "kkks", type: "string" },
                  { name: "status", type: "string" },
                  { name: "lokasi", type: "string" },
                  { name: "jenis_plat", type: "string" }
               ],
               renderer: {
                  type: "unique-value",
                  field: "lokasi",
                  defaultSymbol: {
                     type: "simple-marker",
                     style: "diamond",
                     color: [255, 255, 255, 1],
                     size: 10,
                     outline: null
                  },
                  uniqueValueInfos: [
                     {
                        value: "OFFSHORE",
                        symbol: {
                           type: "picture-marker",
                           url: "/icons/offshore_icon.png",
                           width: "24px",
                           height: "24px"
                        }
                     },
                     {
                        value: "ONSHORE",
                        symbol: {
                           type: "picture-marker",
                           url: "/icons/onshore_icon.png",
                           width: "24px",
                           height: "24px"
                        }
                     }
                  ]
               } as any,
               effect: "bloom(1.5, 1.5px, 0.1)",
               popupTemplate: {
                  title: "Platform: {nama_platf}",
                  content: [{
                     type: "fields",
                     fieldInfos: [
                        { fieldName: "nama_platf", label: "Name" },
                        { fieldName: "kkks", label: "Operator" },
                        { fieldName: "status", label: "Status" },
                        { fieldName: "lokasi", label: "Location" },
                        { fieldName: "jenis_plat", label: "Platform Type" }
                     ]
                  }]
               },
               visible: activeLayers.includes('platform-migas')
            })

            // Debug: Check layer status after creation
            platformLayer.when(() => {
               console.log('✅ Platform FeatureLayer ready')
               console.log('📍 Renderer type:', platformLayer.renderer?.type)
               console.log('📍 Geometry type:', platformLayer.geometryType)
               console.log('📍 Visible:', platformLayer.visible)
               console.log('📍 Full extent:', platformLayer.fullExtent)

               // Query to verify features are accessible
               platformLayer.queryFeatureCount().then(count => {
                  console.log('📍 Queryable feature count:', count)
               })
            }).catch((err: any) => {
               console.error('❌ Platform layer error:', err)
            })

            map.add(platformLayer)
            layersRef.current['platform-migas'] = platformLayer
            console.log('✅ Platform layer added from shapefile with', graphics.length, 'features')
         })
         .catch(err => console.error('❌ Failed to load platform shapefile:', err))

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
      onViewReady?.(view)

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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                  Return to 2D
               </button>
            </div>
         )}

      </div>
   )
}
