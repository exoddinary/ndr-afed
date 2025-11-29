"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import Map from "@arcgis/core/Map"
import MapView from "@arcgis/core/views/MapView"
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer"
import MapImageLayer from "@arcgis/core/layers/MapImageLayer"
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol"
import Extent from "@arcgis/core/geometry/Extent"
import "@arcgis/core/assets/esri/themes/light/main.css"

// Props to allow parent to listen to map clicks
type MapAreaProps = {
   onElementClick?: (type: "polygon" | "play" | "basin", data: any) => void
   activeLayers?: string[]
}

export function MapArea({ onElementClick, activeLayers = [] }: MapAreaProps = {}) {
   const mapDiv = useRef<HTMLDivElement>(null)
   const viewRef = useRef<MapView | null>(null)
   const layersRef = useRef<Record<string, __esri.Layer>>({})
   const [mounted, setMounted] = useState(false)

   useEffect(() => {
      setMounted(true)
   }, [])

   useEffect(() => {
      if (!mounted || !mapDiv.current) return

      // Initialize Map
      const map = new Map({
         basemap: "satellite"
      })

      const view = new MapView({
         container: mapDiv.current,
         map: map,
         center: [117.5, 2.5], // Longitude, Latitude
         zoom: 6,
         ui: {
            components: ["zoom", "attribution"] // Minimal UI
         }
      })

      viewRef.current = view

      // Expose view globally for debugging (only in development)
      if (typeof window !== 'undefined') {
         (window as any).mapView = view
      }

      // 1. Exploration Blocks Layer (GeoJSON)
      // Note: ArcGIS GeoJSONLayer fetches the data itself
      const blocksLayer = new GeoJSONLayer({
         url: "/data/exploration-blocks.json",
         copyright: "ESDM",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-fill",
               color: [245, 158, 11, 0.2], // Amber-500 with opacity
               outline: {
                  color: [251, 191, 36, 1], // Amber-400
                  width: 2
               }
            } as any
         },
         popupTemplate: {
            title: "{namobj}",
            content: [
               {
                  type: "fields",
                  fieldInfos: [
                     { fieldName: "oprblk", label: "Operator" },
                     { fieldName: "status", label: "Status" },
                     { fieldName: "expdat", label: "Expiry Date" }
                  ]
               }
            ]
         },
         visible: activeLayers.includes('active-blocks')
      })

      // Handle click manually to trigger our custom panel
      view.on("click", async (event) => {
         const response = await view.hitTest(event)

         // Filter for graphic hits on our blocks layer
         const results = response.results.filter((result): result is __esri.GraphicHit =>
            result.type === "graphic" && result.graphic.layer === blocksLayer
         )

         if (results.length > 0) {
            const graphic = results[0].graphic
            const attr = graphic.attributes

            onElementClick?.("polygon", {
               name: attr.namobj,
               operator: attr.oprblk,
               status: attr.status,
               expiry: new Date(attr.expdat).toLocaleDateString()
            })
         }
      })

      map.add(blocksLayer)
      layersRef.current['active-blocks'] = blocksLayer

      // 2. Seismic 2D Layer (MapImageLayer - Dynamic)
      const seismicLayer = new MapImageLayer({
         url: "https://datamigas.esdm.go.id/arcgis/rest/services/MDR2/Seismik_2D_LN/MapServer",
         opacity: 0.7,
         visible: activeLayers.includes('seismic-2d')
      })

      map.add(seismicLayer)
      layersRef.current['seismic-2d'] = seismicLayer

      // 3. Pipeline Infrastructure Layer (GeoJSON)
      // Note: This is a large file, so we use optimized settings
      const pipelineLayer = new GeoJSONLayer({
         url: "/data/pipeline/pipe_infrastructure.geojson",
         copyright: "ESDM",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-line",
               color: [255, 215, 0, 1], // Yellow (gold)
               width: 2
            } as any
         },
         popupTemplate: {
            title: "Pipeline: {namobj}",
            content: [
               {
                  type: "fields",
                  fieldInfos: [
                     { fieldName: "kategori", label: "Category" },
                     { fieldName: "dimmtr", label: "Diameter (m)" }
                  ]
               }
            ]
         },
         visible: activeLayers.includes('pipeline-infrastructure'),
         // Optimize for large datasets
         minScale: 5000000, // Only show when zoomed in enough
         effect: "bloom(1.5, 0.5px, 0.1)" // Add glow effect
      })

      // Handle loading errors
      pipelineLayer.load().catch(error => {
         console.warn("Pipeline layer failed to load:", error)
      })

      map.add(pipelineLayer)
      layersRef.current['pipeline-infrastructure'] = pipelineLayer

      // 4. Platform Migas Layer (GeoJSON) - Oil & Gas Platforms
      const platformLayer = new GeoJSONLayer({
         url: "/data/platform/platforms_migas.geojson",
         copyright: "ESDM",
         spatialReference: { wkid: 4326 }, // Explicitly set to WGS84
         renderer: new SimpleRenderer({
            symbol: new SimpleMarkerSymbol({
               style: "circle",
               color: "#ef4444", // Red-500
               size: "12px",  // Increased size
               outline: {
                  color: "#ffffff",
                  width: 1.5
               }
            })
         }),
         popupTemplate: {
            title: "{nama_platf}",
            content: [
               {
                  type: "fields",
                  fieldInfos: [
                     { fieldName: "kkks", label: "Operator (KKKS)" },
                     { fieldName: "status", label: "Status" },
                     { fieldName: "lokasi", label: "Location" },
                     { fieldName: "jenis_plat", label: "Platform Type" },
                     { fieldName: "maksud_pen", label: "Purpose" },
                     { fieldName: "tahun_dibu", label: "Year Built" },
                     { fieldName: "kedalaman", label: "Depth" }
                  ]
               }
            ]
         },
         visible: activeLayers.includes('platform-migas')
      })

      // Handle loading errors and log success
      platformLayer.load()
         .then(() => {
            console.log("✅ Platform layer loaded successfully", platformLayer)

            // Query ALL features to manually calculate extent since fullExtent is broken
            platformLayer.queryFeatures({ where: "1=1", returnGeometry: true })
               .then(result => {
                  console.log(`Platform layer contains ${result.features.length} features`)

                  if (result.features.length > 0) {
                     console.log("First feature geometry:", result.features[0].geometry)
                     console.log("First feature attributes:", result.features[0].attributes)

                     // Manually calculate extent from all features
                     let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity

                     result.features.forEach(feature => {
                        if (feature.geometry && feature.geometry.type === "point") {
                           const point = feature.geometry as __esri.Point
                           const lon = point.longitude ?? point.x
                           const lat = point.latitude ?? point.y
                           if (typeof lon === 'number' && typeof lat === 'number') {
                              xmin = Math.min(xmin, lon)
                              ymin = Math.min(ymin, lat)
                              xmax = Math.max(xmax, lon)
                              ymax = Math.max(ymax, lat)
                           }
                        }
                     })

                     const calculatedExtent = new Extent({
                        xmin,
                        ymin,
                        xmax,
                        ymax,
                        spatialReference: { wkid: 4326 }
                     })

                     console.log("Manually calculated extent:", calculatedExtent.toJSON())

                     // Zoom to the calculated extent
                     view.goTo(calculatedExtent.expand(1.2)).catch(err => {
                        console.error("Failed to zoom to layer:", err)
                     })
                  }
               })
               .catch(err => {
                  console.error("Failed to query features:", err)
               })

            console.log("Platform layer visible:", platformLayer.visible)
            console.log("Platform layer renderer:", platformLayer.renderer)
         })
         .catch(error => {
            console.error("❌ Platform layer failed to load:", error)
         })

      map.add(platformLayer)
      layersRef.current['platform-migas'] = platformLayer

      return () => {
         if (view) {
            view.destroy()
         }
      }
   }, [mounted])

   // Handle Active Layers changes
   useEffect(() => {
      // Toggle Blocks
      if (layersRef.current['active-blocks']) {
         layersRef.current['active-blocks'].visible = activeLayers.includes('active-blocks')
      }

      // Toggle Seismic
      if (layersRef.current['seismic-2d']) {
         layersRef.current['seismic-2d'].visible = activeLayers.includes('seismic-2d')
      }

      // Toggle Pipeline Infrastructure
      if (layersRef.current['pipeline-infrastructure']) {
         layersRef.current['pipeline-infrastructure'].visible = activeLayers.includes('pipeline-infrastructure')
      }

      // Toggle Platform Migas
      if (layersRef.current['platform-migas']) {
         layersRef.current['platform-migas'].visible = activeLayers.includes('platform-migas')
      }
   }, [activeLayers])

   if (!mounted) return <div className="w-full h-full bg-gray-100 animate-pulse" />

   return (
      <div className="w-full h-full relative group">
         <div ref={mapDiv} className="w-full h-full" />
      </div>
   )
}
