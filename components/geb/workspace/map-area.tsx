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
         basemap: "satellite",
         ground: is3D ? "world-elevation" : undefined
      })
      mapRef.current = map

      // 3. Initialize Layers on the new Map
      const NLOG_LICENCES_URL = 'https://www.gdngeoservices.nl/geoserver/nlog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=nlog:gdw_ng_licence_utm&outputFormat=application/json&srsName=EPSG:4326'
      const blocksLayer = new GeoJSONLayer({
         url: NLOG_LICENCES_URL,
         copyright: "NLOG / Rijkswaterstaat Noordzee & TNO",
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
               labelExpressionInfo: { expression: "$feature.licence_name" },
               symbol: new TextSymbol({
                  color: "white",
                  haloColor: [50, 50, 50, 0.9],
                  haloSize: 2,
                  font: { size: 10, weight: "bold", family: "Arial" }
               }),
               minScale: 0,
               maxScale: 0,
               labelPlacement: "always-horizontal"
            })
         ],
         popupTemplate: {
            title: "{licence_name}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "licence_name", label: "Licence Name" },
                  { fieldName: "operator_name", label: "Operator" },
                  { fieldName: "licence_status", label: "Status" },
                  { fieldName: "expiry_date", label: "Expiry Date" }
               ]
            }]
         },
         visible: activeLayers.includes('active-blocks'),
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(blocksLayer)
      layersRef.current['active-blocks'] = blocksLayer

      // --- Local Netherlands Offshore Blocks (Detailed) ---
      const offshoreDetailedLayer = new GeoJSONLayer({
         url: '/data/netherlands-offshore-blocks.json',
         copyright: "Historical Data Collection",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-fill",
               color: [147, 51, 234, 0.15], // purple
               outline: { color: [168, 85, 247, 1], width: 1.5 }
            } as any
         },
         labelingInfo: [
            new LabelClass({
               labelExpressionInfo: { expression: "$feature.BlokNummer" },
               symbol: new TextSymbol({
                  color: [168, 85, 247, 1],
                  haloColor: [0, 0, 0, 0.8],
                  haloSize: 1,
                  font: { size: 9, weight: "bold", family: "Arial" }
               }),
               minScale: 1000000,
               maxScale: 0
            })
         ],
         popupTemplate: {
            title: "Block {BlokNummer}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "BlokNummer", label: "Block Number" },
                  { fieldName: "Area_sqkm", label: "Area (km²)" },
                  { fieldName: "OBJECTID", label: "ID" }
               ]
            }]
         },
         visible: activeLayers.includes('offshore-blocks-detailed'),
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(offshoreDetailedLayer)
      layersRef.current['offshore-blocks-detailed'] = offshoreDetailedLayer

      // --- NLOG: 2D Seismic lines ---
      const NLOG_2D_SEISMIC_URL = 'https://www.gdngeoservices.nl/geoserver/nlog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=nlog:gdw_ng_smc_ln_utm&outputFormat=application/json&srsName=EPSG:4326'
      const seismicLayer = new GeoJSONLayer({
         url: NLOG_2D_SEISMIC_URL,
         copyright: "NLOG / TNO",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-line",
               color: [0, 191, 255, 0.85], // deep sky blue
               width: 1
            } as any
         },
         popupTemplate: {
            title: "{survey_name}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "survey_name", label: "Survey" },
                  { fieldName: "survey_type", label: "Type" },
                  { fieldName: "operator_name", label: "Operator" },
                  { fieldName: "survey_year", label: "Year" }
               ]
            }]
         },
         visible: activeLayers.includes('seismic-2d'),
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(seismicLayer)
      layersRef.current['seismic-2d'] = seismicLayer

      // --- NLOG: 3D Seismic grids ---
      const NLOG_3D_SEISMIC_URL = 'https://www.gdngeoservices.nl/geoserver/nlog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=nlog:gdw_ng_smc_grid_utm&outputFormat=application/json&srsName=EPSG:4326'
      const seismic3dLayer = new GeoJSONLayer({
         url: NLOG_3D_SEISMIC_URL,
         copyright: "NLOG / TNO",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-fill",
               color: [0, 120, 255, 0.08],
               outline: { color: [0, 160, 255, 0.7], width: 1 }
            } as any
         },
         popupTemplate: {
            title: "{survey_name}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "survey_name", label: "Survey" },
                  { fieldName: "operator_name", label: "Operator" },
                  { fieldName: "survey_year", label: "Year" },
                  { fieldName: "area_sqkm", label: "Area (km²)" }
               ]
            }]
         },
         visible: activeLayers.includes('seismic-3d'),
         effect: "bloom(1.0, 0.5px, 0)",
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(seismic3dLayer)
      layersRef.current['seismic-3d'] = seismic3dLayer

      // --- NLOG: Oil & Gas Fields (replaces pipeline layer) ---
      const NLOG_FIELDS_URL = 'https://www.gdngeoservices.nl/geoserver/nlog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=nlog:v_nlog_velden&outputFormat=application/json&srsName=EPSG:4326'
      const fieldsLayer = new GeoJSONLayer({
         url: NLOG_FIELDS_URL,
         copyright: "NLOG / TNO",
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
               labelExpressionInfo: { expression: "$feature.field_name" },
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
            title: "{field_name}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "field_name", label: "Field" },
                  { fieldName: "operator_name", label: "Operator" },
                  { fieldName: "field_status", label: "Status" },
                  { fieldName: "primary_product", label: "Product" }
               ]
            }]
         },
         visible: activeLayers.includes('pipeline-infrastructure'),
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(fieldsLayer)
      layersRef.current['pipeline-infrastructure'] = fieldsLayer

      // --- NLOG: All Boreholes / Wells ---
      const NLOG_WELLS_URL = 'https://www.gdngeoservices.nl/geoserver/nlog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=nlog:gdw_ng_wll_all_utm&outputFormat=application/json&srsName=EPSG:4326'
      const wellsLayer = new GeoJSONLayer({
         url: NLOG_WELLS_URL,
         copyright: "NLOG / TNO",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-marker",
               style: "circle",
               color: [0, 255, 200, 0.9], // teal-cyan
               size: 4,
               outline: { color: [0, 160, 130, 1], width: 0.5 }
            } as any
         },
         popupTemplate: {
            title: "{well_name}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "well_name", label: "Well Name" },
                  { fieldName: "operator_name", label: "Operator" },
                  { fieldName: "well_type", label: "Type" },
                  { fieldName: "well_status", label: "Status" },
                  { fieldName: "spud_date", label: "Spud Date" },
                  { fieldName: "total_depth", label: "Total Depth (m)" }
               ]
            }]
         },
         visible: activeLayers.includes('wells'),
         effect: "bloom(1.3, 1px, 0.1)",
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(wellsLayer)
      layersRef.current['wells'] = wellsLayer

      // Platform layer - load from NLOG WFS (production facilities)
      const NLOG_FACILITIES_URL = 'https://www.gdngeoservices.nl/geoserver/nlog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=nlog:GDW_NG_FACILITY_UTM&outputFormat=application/json&srsName=EPSG:4326'
      const platformGeoJSONLayer = new GeoJSONLayer({
         url: NLOG_FACILITIES_URL,
         copyright: "NLOG / Rijkswaterstaat Noordzee & TNO",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-marker",
               style: "diamond",
               color: [255, 255, 255, 1],
               size: 8,
               outline: { color: [180, 140, 0, 1], width: 1 }
            } as any
         },
         effect: "bloom(1.5, 1.5px, 0.1)",
         popupTemplate: {
            title: "{facility_name}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "facility_name", label: "Name" },
                  { fieldName: "operator_name", label: "Operator" },
                  { fieldName: "facility_type", label: "Type" },
                  { fieldName: "facility_status", label: "Status" }
               ]
            }]
         },
         visible: activeLayers.includes('platform-migas')
      })
      map.add(platformGeoJSONLayer)
      layersRef.current['platform-migas'] = platformGeoJSONLayer

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

            console.log("🟢 Well Clicked (NLOG):", attr)

            // NLOG WFS uses: well_name, operator_name, well_type, well_status, spud_date, total_depth
            onElementClick?.("well", {
               name: attr.well_name || attr.wellbore_name || attr.WELL_NAME || attr.name || "Unknown Well",
               field: attr.field_name || attr.FIELD || "",
               operator: attr.operator_name || attr.OPERATOR || "",
               status: attr.well_status || attr.wellbore_status || attr.STATUS || "",
               type: attr.well_type || attr.wellbore_type || "",
               totalDepth: attr.total_depth || attr.TD_M || null,
               spudDate: attr.spud_date || attr.SPUD_DATE || ""
            })
            return // Stop propagation so we don't click the block underneath
         }

         // 2. Check for Detailed Blocks
         const detailedResults = response.results.filter((result: any) =>
            result.type === "graphic" &&
            result.graphic?.layer === layersRef.current['offshore-blocks-detailed']
         )

         if (detailedResults.length > 0) {
            const graphic = (detailedResults[0] as any).graphic
            const attr = graphic.attributes

            console.log("🟣 Detailed Block Clicked:", attr)

            onElementClick?.("polygon", {
               name: attr.BlokNummer || "Unknown Block",
               operator: "Available",
               status: "Static",
               expiry: "N/A",
               area: attr.Area_sqkm
            })
            return
         }

         // 3. Check for Blocks (NLOG)
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

            // NLOG WFS layer uses 'licence_name', 'operator_name', 'licence_status', 'expiry_date'
            // Fall back through multiple possible field names for robustness
            const blockName =
               attr.licence_name ||
               attr.LNAAM ||
               attr.namobj ||
               attr.NAME ||
               attr.name ||
               "Unknown Block"

            const operator =
               attr.operator_name ||
               attr.OPRBLK ||
               attr.oprblk ||
               attr.OPERATOR ||
               ""

            const status =
               attr.licence_status ||
               attr.STATUS ||
               attr.status ||
               ""

            const expiry =
               attr.expiry_date
                  ? formatExpiryDate(attr.expiry_date)
                  : attr.expdat
                     ? formatExpiryDate(attr.expdat)
                     : "-"

            console.log("🟡 Block Clicked:", blockName, "| Raw attrs:", attr)

            onElementClick?.("polygon", {
               name: blockName,
               operator,
               status,
               expiry
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
