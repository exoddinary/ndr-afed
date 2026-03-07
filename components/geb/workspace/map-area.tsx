"use client"

import { useEffect, useRef, useState } from "react"
import Map from "@arcgis/core/Map"
import MapView from "@arcgis/core/views/MapView"
import SceneView from "@arcgis/core/views/SceneView"
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer"
import LabelClass from "@arcgis/core/layers/support/LabelClass"
import TextSymbol from "@arcgis/core/symbols/TextSymbol"
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils"
import "@arcgis/core/assets/esri/themes/light/main.css"

// Props to allow parent to listen to map clicks
type MapAreaProps = {
   onElementClick?: (type: "polygon" | "play" | "basin" | "well", data: any) => void
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
   const [basemapStyle, setBasemapStyle] = useState<'oceans' | 'light-gray'>('oceans')


   useEffect(() => {
      setMounted(true)
   }, [])

   // Combined Effect: Handle View Switching and Layer Initialization
   useEffect(() => {
      if (!mounted || !mapDiv.current) return

      console.log('🗺️ MAP EFFECT RUNNING - mounted:', mounted, 'is3D:', is3D)

      // 1. Save current extent/center from previous view if available
      let currentCenter = [5.2, 52.2] // Netherlands
      let currentZoom = 6

      if (viewRef.current) {
         if (viewRef.current.center) {
            currentCenter = [viewRef.current.center.longitude ?? 5.2, viewRef.current.center.latitude ?? 52.2]
         }
         if (viewRef.current.zoom) {
            currentZoom = viewRef.current.zoom ?? 7
         }
         viewRef.current.destroy()
         viewRef.current = null
      }

      // 2. Create new Map instance
      const map = new Map({
         basemap: "oceans",
         ground: is3D ? "world-elevation" : undefined
      })
      mapRef.current = map

      // 3. Initialize Layers on the new Map
      // --- Offshore Blocks (Local GeoJSON) ---
      const blocksLayer = new GeoJSONLayer({
         url: '/data/Offshore_Blocks.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-fill",
               color: [245, 158, 11, 0.15],
               outline: { color: [251, 191, 36, 1], width: 1.5 }
            } as any
         },
         labelingInfo: [
            new LabelClass({
               labelExpressionInfo: { expression: "$feature.BlokNummer" },
               symbol: new TextSymbol({
                  color: "white",
                  haloColor: [50, 50, 50, 0.9],
                  haloSize: 2,
                  font: { size: 10, weight: "bold", family: "Arial" }
               }),
               minScale: 2000000,
               maxScale: 0,
               labelPlacement: "always-horizontal"
            })
         ],
         popupTemplate: {
            title: "Block {BlokNummer}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "BlokNummer", label: "Block Number" },
                  { fieldName: "Field", label: "Field" },
                  { fieldName: "Area_sqkm", label: "Area (km²)" }
               ]
            }]
         },
         visible: activeLayers.includes('offshore-blocks-detailed'),
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(blocksLayer)
      layersRef.current['offshore-blocks-detailed'] = blocksLayer

      // --- Well Trajectories (Local GeoJSON) ---
      const wellTrajLayer = new GeoJSONLayer({
         url: '/data/Wells_Trajectories.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-line",
               color: [56, 189, 248, 0.7], // sky blue
               width: 1
            } as any
         },
         popupTemplate: {
            title: "{SHORT_NM}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "SHORT_NM", label: "Borehole Name" },
                  { fieldName: "BOREHOLE_D", label: "Borehole ID" },
                  { fieldName: "Shape_Length", label: "Length" }
               ]
            }]
         },
         visible: activeLayers.includes('well-trajectories'),
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(wellTrajLayer)
      layersRef.current['well-trajectories'] = wellTrajLayer

      // --- Seismic 2D Lines (Local GeoJSON) ---
      const seismicLayer = new GeoJSONLayer({
         url: '/data/Seismic_2D_Surveys.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-line",
               color: [0, 191, 255, 0.85],
               width: 1
            } as any
         },
         popupTemplate: {
            title: "{line_name}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "line_name", label: "Line Name" },
                  { fieldName: "survey_col", label: "Survey Collection" },
                  { fieldName: "line_colle", label: "Line Collection" },
                  { fieldName: "delivery_c", label: "Delivery" }
               ]
            }]
         },
         visible: activeLayers.includes('seismic-2d'),
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(seismicLayer)
      layersRef.current['seismic-2d'] = seismicLayer

      // --- Seismic 3D Surveys (Local GeoJSON) ---
      const seismic3dLayer = new GeoJSONLayer({
         url: '/data/Seismic_3D_Surveys.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-fill",
               color: [0, 120, 255, 0.08],
               outline: { color: [0, 160, 255, 0.7], width: 1 }
            } as any
         },
         popupTemplate: {
            title: "Survey {SURVEY_ID}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "SURVEY_ID", label: "Survey ID" },
                  { fieldName: "GRID_ID", label: "Grid ID" },
                  { fieldName: "YEAR", label: "Year" },
                  { fieldName: "Shape_Area", label: "Area" }
               ]
            }]
         },
         visible: activeLayers.includes('seismic-3d'),
         effect: "bloom(1.0, 0.5px, 0)",
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(seismic3dLayer)
      layersRef.current['seismic-3d'] = seismic3dLayer

      // --- Hydrocarbon Fields (Local GeoJSON) ---
      const fieldsLayer = new GeoJSONLayer({
         url: '/data/HC_Fields.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-fill",
               color: [34, 197, 94, 0.15],
               outline: { color: [34, 197, 94, 0.8], width: 1.5 }
            } as any
         },
         labelingInfo: [
            new LabelClass({
               labelExpressionInfo: { expression: "$feature.FIELD_NAME" },
               symbol: new TextSymbol({
                  color: [34, 197, 94, 1],
                  haloColor: [0, 0, 0, 0.8],
                  haloSize: 1.5,
                  font: { size: 9, weight: "bold", family: "Arial" }
               }),
               minScale: 2000000,
               maxScale: 0
            })
         ],
         popupTemplate: {
            title: "{FIELD_NAME}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "FIELD_NAME", label: "Field" },
                  { fieldName: "OPERATOR", label: "Operator" },
                  { fieldName: "STATUS", label: "Status" },
                  { fieldName: "RESULT", label: "Result" },
                  { fieldName: "DISCOVERY_", label: "Discovery Year" },
                  { fieldName: "LANDSEA", label: "Land/Sea" }
               ]
            }]
         },
         visible: activeLayers.includes('pipeline-infrastructure'),
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(fieldsLayer)
      layersRef.current['pipeline-infrastructure'] = fieldsLayer

      // --- Well Locations (Local GeoJSON) ---
      const wellsLayer = new GeoJSONLayer({
         url: '/data/Wells.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-marker",
               style: "circle",
               color: [0, 255, 200, 0.9],
               size: 4,
               outline: { color: [0, 160, 130, 1], width: 0.5 }
            } as any
         },
         popupTemplate: {
            title: "{IDENTIFICA}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "IDENTIFICA", label: "Well Name" },
                  { fieldName: "OPERATOR", label: "Operator" },
                  { fieldName: "WELL_TYPE", label: "Type" },
                  { fieldName: "STATUS", label: "Status" },
                  { fieldName: "WELL_RESUL", label: "Result" },
                  { fieldName: "START_DATE", label: "Start Date" },
                  { fieldName: "END_DEPTH_", label: "Total Depth (m)" },
                  { fieldName: "FIELD_NAME", label: "Field" }
               ]
            }]
         },
         visible: activeLayers.includes('wells'),
         effect: "bloom(1.3, 1px, 0.1)",
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(wellsLayer)
      layersRef.current['wells'] = wellsLayer

      // (Mining Facilities layer removed per new GIS structure)

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

         // 1. Check for Wells first (points usually on top)
         const wellResults = response.results.filter((result: any) =>
            result.type === "graphic" &&
            result.graphic?.layer === layersRef.current['wells']
         )

         if (wellResults.length > 0) {
            const graphic = (wellResults[0] as any).graphic
            const attr = graphic.attributes

            console.log("🟢 Well Clicked (local):", attr)

            onElementClick?.("well", {
               name: attr.IDENTIFICA || attr.SHORT_NM || "Unknown Well",
               field: attr.FIELD_NAME || "",
               operator: attr.OPERATOR || "",
               status: attr.STATUS || "",
               type: attr.WELL_TYPE || "",
               totalDepth: attr.END_DEPTH_ || null,
               spudDate: attr.START_DATE || ""
            })
            return
         }

         // 2. Check for Offshore Blocks
         const detailedResults = response.results.filter((result: any) =>
            result.type === "graphic" &&
            result.graphic?.layer === layersRef.current['offshore-blocks-detailed']
         )

         if (detailedResults.length > 0) {
            const graphic = (detailedResults[0] as any).graphic
            const attr = graphic.attributes

            console.log("🟡 Offshore Block Clicked:", attr)

            onElementClick?.("polygon", {
               name: attr.BlokNummer || "Unknown Block",
               operator: attr.Field || "N/A",
               status: "Active",
               expiry: "N/A",
               area: attr.Area_sqkm
            })
            return
         }

         // 3. Check for Hydrocarbon Fields
         const fieldResults = response.results.filter((result: any) =>
            result.type === "graphic" &&
            result.graphic?.layer === layersRef.current['pipeline-infrastructure']
         )

         if (fieldResults.length > 0) {
            const graphic = (fieldResults[0] as any).graphic
            const attr = graphic.attributes

            if (graphic.geometry && graphic.geometry.type === "polygon") {
               const polygon = graphic.geometry as __esri.Polygon
               const extent = polygon.extent
               if (extent) {
                  view.goTo({ target: extent.expand(1.67), tilt: is3D ? 45 : 0 }, { duration: 400, easing: "ease-in-out" })
               }
            }

            console.log("🟢 HC Field Clicked:", attr)

            onElementClick?.("polygon", {
               name: attr.FIELD_NAME || "Unknown Field",
               operator: attr.OPERATOR || "",
               status: attr.STATUS || "",
               expiry: attr.DISCOVERY_ ? String(attr.DISCOVERY_) : "-"
            })
         }
      })


      // Expose globally
      if (typeof window !== 'undefined') {
         (window as any).mapView = view
      }

   }, [mounted, is3D]) // Re-run when view mode changes

   // Separate effect for reactive basemap switching (no view rebuild needed)
   useEffect(() => {
      if (!mapRef.current || !mounted) return
      // Use built-in named IDs: 'oceans' and 'gray-vector' (no API key required)
      const basemapId = basemapStyle === 'oceans' ? 'oceans' : 'gray-vector'
      mapRef.current.basemap = basemapId as any
   }, [basemapStyle, mounted])

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

         {/* Return to 2D Mode Overlay */}
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

         {/* Basemap Switcher - bottom left */}
         {!is3D && (
            <div className="absolute bottom-8 left-3 z-10 flex flex-col gap-1.5">
               <button
                  onClick={() => setBasemapStyle('oceans')}
                  title="World Ocean Base"
                  className={`w-12 h-12 rounded-md border-2 shadow-md overflow-hidden transition-all ${basemapStyle === 'oceans' ? 'border-blue-500 ring-2 ring-blue-400/50 scale-105' : 'border-white/80 hover:border-blue-300'}`}
               >
                  <div className="w-full h-full bg-[#c8daea] flex flex-col items-center justify-center gap-0.5">
                     <div className="w-6 h-1 rounded bg-[#7bafd4]" />
                     <div className="w-5 h-1 rounded bg-[#5a9bc2]" />
                     <div className="w-3 h-1 rounded bg-[#3b7da8]" />
                  </div>
               </button>
               <button
                  onClick={() => setBasemapStyle('light-gray')}
                  title="Light Gray Base"
                  className={`w-12 h-12 rounded-md border-2 shadow-md overflow-hidden transition-all ${basemapStyle === 'light-gray' ? 'border-blue-500 ring-2 ring-blue-400/50 scale-105' : 'border-white/80 hover:border-blue-300'}`}
               >
                  <div className="w-full h-full bg-[#e8e8e8] flex flex-col items-center justify-center gap-0.5">
                     <div className="w-6 h-1 rounded bg-[#c0c0c0]" />
                     <div className="w-5 h-1 rounded bg-[#a8a8a8]" />
                     <div className="w-3 h-1 rounded bg-[#909090]" />
                  </div>
               </button>
            </div>
         )}

      </div>
   )
}
