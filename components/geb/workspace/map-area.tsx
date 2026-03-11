"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Map from "@arcgis/core/Map"
import MapView from "@arcgis/core/views/MapView"
import SceneView from "@arcgis/core/views/SceneView"
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import LabelClass from "@arcgis/core/layers/support/LabelClass"
import TextSymbol from "@arcgis/core/symbols/TextSymbol"
import Circle from "@arcgis/core/geometry/Circle"
import Graphic from "@arcgis/core/Graphic"
import Extent from "@arcgis/core/geometry/Extent"
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils"
import "@arcgis/core/assets/esri/themes/light/main.css"

import { PanelContext } from "./contextual-panel"
import { GNGProjectFloatingPanel } from "./gng-floating-panel"
import { AnalysisMarkerManager } from "./analysis-marker-manager"

// Props to allow parent to listen to map clicks
type MapAreaProps = {
   onElementClick?: (type: PanelContext, data: any) => void
   activeLayers?: string[]
   is3D?: boolean
   onToggle3D?: () => void
   onViewReady?: (view: __esri.MapView | __esri.SceneView) => void
   focusedFeatures?: {
      layer: string;
      identifiers: string[];
      radiusInfo?: { originLayer: string; originId: string; radiusKm: number }
   } | null
   onClearFocus?: () => void
   selectedElement?: { type: PanelContext; data: any } | null
   onResetSelection?: () => void
   aiActive?: boolean
   onJumpToMainAI?: (question: string, spatialContext: any) => void
   isGNGPanelExpanded?: boolean
   onGNGPanelExpandChange?: (expanded: boolean) => void
   isPanelOpen?: boolean
   isAnalysisMarkerActive?: boolean
}

// Map AI layer names → layersRef keys
const AI_TO_REF: Record<string, string> = {
   wells: 'wells',
   fields: 'hc-fields',
   blocks: 'offshore-blocks-detailed',
   seismic2d: 'seismic-2d',
   seismic3d: 'seismic-3d',
   trajectories: 'well-trajectories',
   gng_projects: 'gng-projects',
   licenses: 'licenses'
}

// Name field used in definitionExpression for each layersRef key
const REF_NAME_FIELD: Record<string, string> = {
   'wells': 'IDENTIFICA',
   'hc-fields': 'FIELD_NAME',
   'offshore-blocks-detailed': 'BlokNummer',
   'seismic-2d': 'line_name',
   'seismic-3d': 'SURVEY_ID',
   'well-trajectories': 'SHORT_NM',
   'gng-projects': 'PROJECT_NAME',
   'licenses': 'licence_nm'
}

export function MapArea({
   onElementClick,
   activeLayers = [],
   is3D = false,
   onToggle3D,
   onViewReady,
   focusedFeatures,
   onClearFocus,
   selectedElement,
   onResetSelection,
   aiActive = false,
   onJumpToMainAI,
   isGNGPanelExpanded,
   onGNGPanelExpandChange,
   isPanelOpen = false,
   isAnalysisMarkerActive = false
}: MapAreaProps = {}) {
   const mapDiv = useRef<HTMLDivElement>(null)
   const viewRef = useRef<MapView | SceneView | null>(null)
   const mapRef = useRef<Map | null>(null)
   const layersRef = useRef<Record<string, __esri.Layer>>({})
   const f3HorizonGraphicsLayerRef = useRef<__esri.GraphicsLayer | null>(null)
   const [mounted, setMounted] = useState(false)
   const [basemapStyle, setBasemapStyle] = useState<'oceans' | 'light-gray'>('oceans')
   const [isFocused, setIsFocused] = useState(false)
   const [currentScale, setCurrentScale] = useState<number | null>(null)
   const [selectedProject, setSelectedProject] = useState<string | null>(null)
   const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
   const originalStateRef = useRef<{
      layerKey: string
      definitionExpression: string
      renderer: unknown
      visibilities: Record<string, boolean>
   } | null>(null)

   // Handle G&G project click from floating panel
   const handleGNGProjectClick = (projectName: string) => {
      setSelectedProject(projectName)
      
      // Find and highlight the project polygon
      const gngLayer = layersRef.current['gng-projects'] as __esri.GeoJSONLayer
      if (!gngLayer || !viewRef.current) return

      // Query the layer for the project
      gngLayer.queryFeatures({
         where: `PROJECT_NAME = '${projectName.replace(/'/g, "''")}'`,
         returnGeometry: true,
         outFields: ["*"]
      }).then((result: __esri.FeatureSet) => {
         if (result.features.length > 0) {
            const feature = result.features[0]
            const geometry = feature.geometry as __esri.Polygon
            
            if (!geometry || !geometry.extent) return
            
            // Flash/highlight the polygon with a yellow highlight
            const highlightGraphic = new Graphic({
               geometry: geometry,
               symbol: {
                  type: "simple-fill",
                  color: [255, 255, 0, 0.4], // Yellow fill
                  outline: {
                     color: [255, 200, 0, 1],
                     width: 4
                  }
               } as any
            })

            // Add highlight graphic
            viewRef.current!.graphics.add(highlightGraphic)

            // Zoom to the polygon
            viewRef.current!.goTo({
               target: geometry.extent.expand(1.2),
               tilt: is3D ? 45 : 0
            }, {
               duration: 500,
               easing: "ease-in-out"
            })

            // Remove highlight after 2 seconds
            setTimeout(() => {
               viewRef.current!.graphics.remove(highlightGraphic)
            }, 2000)

            // Also trigger the element click to show the panel
            onElementClick?.("gng-project", feature.attributes)
         }
      }).catch((err: Error) => {
         console.error("Failed to highlight G&G project:", err)
      })
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
         basemap: "oceans",
         ground: is3D ? "world-elevation" : undefined
      })
      mapRef.current = map

      // 3. Initialize Layers on the new Map
      // Layer order (bottom to top): blocks → seismic-3d → hc-fields → seismic-2d → well-trajectories → wells

      // --- Offshore Blocks (Local GeoJSON) --- [Bottom layer]
      const blocksLayer = new GeoJSONLayer({
         url: '/data/Offshore_Blocks.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-fill",
               color: [225, 225, 225, 0.7], // Light Grey with 30% transparency
               outline: { color: [255, 255, 255, 1], width: 2 } // White outline
            } as any
         },
         labelingInfo: [], // Empty - we'll create graphics-based labels that scale with map
         outFields: ["*"],
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
         popupEnabled: false,
         visible: activeLayers.includes('offshore-blocks-detailed'),
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(blocksLayer)
      layersRef.current['offshore-blocks-detailed'] = blocksLayer

      // --- Wells and Trajectories will be added at the end for top layer positioning ---

      // --- Seismic 2D Lines (Local GeoJSON) ---
      const seismicLayer = new GeoJSONLayer({
         url: '/data/Seismic_2D_Surveys.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-line",
               color: [0, 38, 115, 1], // Dark Blue
               width: 0.5
            } as any
         },
         outFields: ["*"], // Return all fields on hitTest
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
         elevationInfo: { mode: "on-the-ground" },
         minScale: 600000 // Hide when zoomed out beyond 1:600,000
      })
      map.add(seismicLayer)
      layersRef.current['seismic-2d'] = seismicLayer

      // --- Hydrocarbon Fields (Local GeoJSON) ---
      const fieldsLayer = new GeoJSONLayer({
         url: '/data/HC_Fields.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "unique-value",
            field: "RESULT",
            defaultSymbol: {
               type: "simple-fill",
               color: [130, 130, 130, 0.7], // 70% transparency
               outline: { color: [110, 110, 110, 1], width: 0.7 }
            } as any,
            uniqueValueInfos: [
               {
                  value: "Gas",
                  symbol: {
                     type: "simple-fill",
                     color: [255, 127, 127, 0.8], // 80% transparency
                     outline: { color: [255, 190, 190, 1], width: 1.5 }
                  } as any
               },
               {
                  value: "Olie",
                  symbol: {
                     type: "simple-fill",
                     color: [85, 255, 0, 0.8], // 80% transparency
                     outline: { color: [211, 255, 190, 1], width: 1.5 }
                  } as any
               },
               {
                  value: "Olie en Gas",
                  symbol: {
                     type: "simple-fill",
                     color: [255, 170, 0, 0.8], // 80% transparency
                     outline: { color: [255, 235, 175, 1], width: 1.5 }
                  } as any
               }
            ]
         } as any,
         labelingInfo: [
            new LabelClass({
               labelExpressionInfo: { expression: "$feature.FIELD_NAME" },
               symbol: new TextSymbol({
                  color: "blue",
                  haloColor: "white",
                  haloSize: 2,
                  font: { size: 9, weight: "bold", family: "Arial" }
               }),
               minScale: 600000,
               maxScale: 0 // Label visible when zoomed in closer than 1:600,000
            })
         ],
         outFields: ["*"],
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
         popupEnabled: false,
         visible: activeLayers.includes('hc-fields'),
         elevationInfo: { mode: "on-the-ground" },
         minScale: 600000 // Hide when zoomed out beyond 1:600,000
      })
      map.add(fieldsLayer)
      layersRef.current['hc-fields'] = fieldsLayer

      // --- Seismic 3D Surveys (Local GeoJSON) ---
      const seismic3dLayer = new GeoJSONLayer({
         url: '/data/Seismic_3D_Surveys.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "class-breaks",
            field: "YEAR",
            defaultSymbol: {
               type: "simple-fill",
               color: [130, 130, 130, 0.3], // 30% transparency
               outline: { color: [110, 110, 110, 0.3], width: 0.7 }
            } as any,
            classBreakInfos: [
               {
                  minValue: 0,
                  maxValue: 1993,
                  symbol: {
                     type: "simple-fill",
                     color: [230, 238, 207, 0.3], // 30% transparency
                     outline: { color: [110, 110, 110, 0.3], width: 0.7 }
                  } as any
               },
               {
                  minValue: 1993,
                  maxValue: 2007,
                  symbol: {
                     type: "simple-fill",
                     color: [105, 168, 183, 0.3], // 30% transparency
                     outline: { color: [110, 110, 110, 0.3], width: 0.7 }
                  } as any
               },
               {
                  minValue: 2007,
                  maxValue: 2030,
                  symbol: {
                     type: "simple-fill",
                     color: [46, 85, 122, 0.3], // 30% transparency
                     outline: { color: [110, 110, 110, 0.3], width: 0.7 }
                  } as any
               }
            ]
         } as any,
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
         elevationInfo: { mode: "on-the-ground" },
         minScale: 1500000 // Hide when zoomed out beyond 1:1,500,000
      })
      map.add(seismic3dLayer)
      layersRef.current['seismic-3d'] = seismic3dLayer

      // --- G&G Project Outlines (Local GeoJSON) ---
      const gngLayer = new GeoJSONLayer({
         url: '/data/GnG_Project_Data_Outlines.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-fill",
               color: [0, 0, 0, 0.3], // 30% transparency per requirements
               outline: { color: [169, 0, 230, 1], width: 3 } // Purple outline
            } as any
         },
         outFields: ["*"], // Return all fields on hitTest
         popupEnabled: false, // Disable default popup
         labelingInfo: [
            new LabelClass({
               labelExpressionInfo: { expression: "$feature.PROJECT_NAME" },
               symbol: new TextSymbol({
                  color: [169, 0, 230, 1],
                  haloColor: [255, 255, 255, 0.8],
                  haloSize: 2,
                  font: { size: 10, weight: "bold", family: "Arial" }
               }),
               minScale: 2000000,
               maxScale: 600000 // Label visible up to 1:600,000 per requirements
            })
         ],
         popupTemplate: {
            title: "{PROJECT_NAME}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "PROJECT_NAME", label: "Project Name" },
                  { fieldName: "APPLICATION_NAME", label: "Application" },
                  { fieldName: "INTERPRETATION_YEAR", label: "Year" },
                  { fieldName: "NO_OF_WELLS", label: "No. of Wells" },
                  { fieldName: "NO_OF_REPORTS", label: "No. of Reports" }
               ]
            }]
         },
         visible: activeLayers.includes('gng-projects'),
         elevationInfo: { mode: "on-the-ground" }
         // No maxScale - always display per requirements
      })
      map.add(gngLayer)
      layersRef.current['gng-projects'] = gngLayer

      // --- Licenses (Local GeoJSON) ---
      const licensesLayer = new GeoJSONLayer({
         url: '/data/Licenses.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "unique-value",
            field: "licence_ty",
            defaultSymbol: {
               type: "simple-fill",
               color: [128, 128, 128, 0.4],
               outline: { color: [100, 100, 100, 1], width: 1.5 }
            } as any,
            uniqueValueInfos: [
               {
                  value: "STR",
                  symbol: {
                     type: "simple-fill",
                     color: [255, 99, 71, 0.5], // Tomato red for Storage
                     outline: { color: [200, 50, 50, 1], width: 2 }
                  } as any
               },
               {
                  value: "GEA",
                  symbol: {
                     type: "simple-fill",
                     color: [50, 205, 50, 0.5], // Lime green for Geothermal
                     outline: { color: [34, 139, 34, 1], width: 2 }
                  } as any
               },
               {
                  value: "GFL",
                  symbol: {
                     type: "simple-fill",
                     color: [30, 144, 255, 0.5], // Dodger blue for Gas Field
                     outline: { color: [0, 100, 200, 1], width: 2 }
                  } as any
               }
            ]
         } as any,
         labelingInfo: [
            new LabelClass({
               labelExpressionInfo: { expression: "$feature.licence_nm" },
               symbol: new TextSymbol({
                  color: [50, 50, 50, 1],
                  haloColor: [255, 255, 255, 0.8],
                  haloSize: 2,
                  font: { size: 9, weight: "bold", family: "Arial" }
               }),
               minScale: 1000000,
               maxScale: 0
            })
         ],
         outFields: ["*"],
         popupTemplate: {
            title: "{licence_nm}",
            content: [{
               type: "fields",
               fieldInfos: [
                  { fieldName: "licence_cd", label: "License Code" },
                  { fieldName: "licence_nm", label: "License Name" },
                  { fieldName: "licence_ty", label: "License Type" },
                  { fieldName: "licence_st", label: "Status" },
                  { fieldName: "licence_re", label: "Resource" },
                  { fieldName: "licenced_a", label: "Licensed Area" }
               ]
            }]
         },
         popupEnabled: false,
         visible: activeLayers.includes('licenses'),
         elevationInfo: { mode: "on-the-ground" }
      })
      map.add(licensesLayer)
      layersRef.current['licenses'] = licensesLayer

      // --- F3 Shallow Horizon - Client-side GeoTIFF rendering ---
      const f3HorizonLayer = new GraphicsLayer({
         title: 'F3 Shallow Horizon',
         visible: false,
         opacity: 0.8
      })
      map.add(f3HorizonLayer)
      layersRef.current['f3-horizon'] = f3HorizonLayer
      
      // Store layer reference for later GeoTIFF rendering
      f3HorizonGraphicsLayerRef.current = f3HorizonLayer

      // --- Well Trajectories (Local GeoJSON) --- [Second from top]
      const wellTrajLayer = new GeoJSONLayer({
         url: '/data/Wells_Trajectories.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-line",
               color: [0, 0, 0, 1], // Black
               width: 2.5
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
         elevationInfo: { mode: "on-the-ground" },
         minScale: 600000,
         outFields: ["SHORT_NM", "BOREHOLE_D", "Shape_Length"],
         labelingInfo: [
            new LabelClass({
               labelExpressionInfo: { expression: "$feature.SHORT_NM" },
               symbol: new TextSymbol({
                  color: "white",
                  haloColor: "black",
                  haloSize: 1,
                  font: { size: 8, weight: "normal", family: "Arial" }
               }),
               minScale: 600000,
               maxScale: 0
            })
         ]
      })
      map.add(wellTrajLayer)
      layersRef.current['well-trajectories'] = wellTrajLayer

      // --- Wells Layer (Local GeoJSON) --- [Top layer]
      const wellsLayer = new GeoJSONLayer({
         url: '/data/Wells.json',
         copyright: "NDR / AFED Digital",
         renderer: {
            type: "simple",
            symbol: {
               type: "simple-marker",
               style: "circle",
               color: [0, 0, 0, 1], // Black
               size: 4
            } as any
         },
         labelingInfo: [
            new LabelClass({
               labelExpressionInfo: { expression: "$feature.IDENTIFICA" },
               symbol: new TextSymbol({
                  color: "white",
                  haloColor: "black",
                  haloSize: 1,
                  font: { size: 8, weight: "normal", family: "Arial" }
               }),
               minScale: 600000,
               maxScale: 0
            })
         ],
         outFields: ["*"],
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
         popupEnabled: false,
         visible: activeLayers.includes('wells'),
         elevationInfo: { mode: "on-the-ground" },
         minScale: 600000
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

      // Create a GraphicsLayer for block labels that scale with map
      const blockLabelsLayer = new GraphicsLayer({
         id: 'block-labels',
         title: 'Block Labels'
      })
      map.add(blockLabelsLayer)
      
      // Create block labels that scale with map (graphics-based, not labelingInfo)
      const blocksLayerForLabels = layersRef.current['offshore-blocks-detailed'] as __esri.GeoJSONLayer
      if (blocksLayerForLabels) {
         // Wait for layer to load then query features
         blocksLayerForLabels.when(() => {
            blocksLayerForLabels.queryFeatures().then((result: __esri.FeatureSet) => {
               const labelGraphics: __esri.Graphic[] = []
               
               result.features.forEach((feature: __esri.Graphic) => {
                  const blockName = feature.attributes.BlokNummer
                  if (!blockName || !feature.geometry) return
                  
                  // Get centroid of polygon
                  const polygon = feature.geometry as __esri.Polygon
                  const centroid = polygon.centroid || polygon.extent?.center
                  if (!centroid) return
                  
                  // Create text symbol - start with small font (5), will scale up on zoom
                  const labelGraphic = new Graphic({
                     geometry: centroid,
                     symbol: {
                        type: "text",
                        text: blockName,
                        color: [100, 100, 100, 1],
                        font: { size: 5, weight: "bold", family: "Arial" },
                        haloColor: [255, 255, 255, 0.8],
                        haloSize: 1
                     } as any,
                     attributes: { blockName }
                  })
                  
                  labelGraphics.push(labelGraphic)
               })
               
               // Add all label graphics to the labels layer
               blockLabelsLayer.addMany(labelGraphics)
               
               console.log(`🗺️ Added ${labelGraphics.length} block labels that scale with map`)
               
               // Function to update label sizes based on zoom
               // At 1:5,000,000 scale = size 10 (max), smaller when zoomed out
               const updateLabelSizes = (scale: number) => {
                  const MAX_SCALE = 5000000 // 1:5M
                  const MIN_SIZE = 5
                  const MAX_SIZE = 10
                  
                  let newSize: number
                  if (scale <= MAX_SCALE) {
                     newSize = MAX_SIZE // 10 at 1:5M or closer
                  } else {
                     // Scale down proportionally when zoomed out beyond 1:5M
                     const ratio = MAX_SCALE / scale
                     newSize = Math.max(MIN_SIZE, MIN_SIZE + (MAX_SIZE - MIN_SIZE) * ratio)
                  }
                  
                  labelGraphics.forEach((graphic: __esri.Graphic) => {
                     const symbol = graphic.symbol as __esri.TextSymbol
                     if (symbol && symbol.font) {
                        symbol.font = { ...symbol.font, size: Math.round(newSize) }
                     }
                  })
                  
                  // Refresh the layer to apply changes
                  blockLabelsLayer.visible = false
                  blockLabelsLayer.visible = true
               }
               
               // Watch scale changes and update label sizes
               view.watch('scale', (newScale: number) => {
                  updateLabelSizes(newScale)
               })
               
               // Initial size update
               updateLabelSizes(view.scale)
               
            }).catch((err: Error) => {
               console.warn('Could not create block labels:', err)
            })
         })
      }

      // Track scale changes
      view.watch('scale', (newScale) => {
         setCurrentScale(newScale)
      })
      setCurrentScale(view.scale)

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
            // Disable default popup behavior - we use custom right panel instead
            popup.autoOpenEnabled = false
         }

         // Disable popups on all layers to prevent ArcGIS default popups
         Object.values(layersRef.current).forEach((layer: any) => {
            if (layer) {
               layer.popupEnabled = false
            }
         })

      // Setup handlers (including safe hitTest)
      view.on("click", async (event: any) => {
         const response = await view.hitTest(event)

         // Clear previous highlight graphics
         view.graphics.removeAll()

         // 1. Check for Wells first (points usually on top)
         const wellResults = response.results.filter((result: any) =>
            result.type === "graphic" &&
            result.graphic?.layer === layersRef.current['wells']
         )

         if (wellResults.length > 0) {
            const graphic = (wellResults[0] as any).graphic
            const attr = graphic.attributes

            console.log("🟢 Well Clicked (local):", attr)

            // Add yellow highlight circle around the well
            if (graphic.geometry) {
               const highlightPoint = new Graphic({
                  geometry: graphic.geometry,
                  symbol: {
                     type: "simple-marker",
                     style: "circle",
                     color: [255, 255, 0, 0.6], // Yellow with transparency
                     size: 14,
                     outline: {
                        color: [255, 200, 0, 1],
                        width: 3
                     }
                  } as any
               })
               view.graphics.add(highlightPoint)
            }

            onElementClick?.("well", { ...attr, geometry: graphic.geometry?.toJSON() })
            setIsRightPanelOpen(true)
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

            // Add yellow highlight outline for the block
            if (graphic.geometry) {
               const highlightGraphic = new Graphic({
                  geometry: graphic.geometry,
                  symbol: {
                     type: "simple-fill",
                     color: [255, 255, 0, 0.3],
                     outline: {
                        color: [255, 200, 0, 1],
                        width: 4
                     }
                  } as any
               })
               view.graphics.add(highlightGraphic)
            }

            onElementClick?.("polygon", {
               name: attr.BlokNummer || "Unknown Block",
               operator: attr.Field || "N/A",
               status: "Active",
               expiry: "N/A",
               area: attr.Area_sqkm
            })
            setIsRightPanelOpen(true)
            return
         }

         // 3. Check for Hydrocarbon Fields
         const fieldResults = response.results.filter((result: any) =>
            result.type === "graphic" &&
            result.graphic?.layer === layersRef.current['hc-fields']
         )

         if (fieldResults.length > 0) {
            const graphic = (fieldResults[0] as any).graphic
            const attr = graphic.attributes

            // Add yellow highlight for field
            if (graphic.geometry) {
               const highlightGraphic = new Graphic({
                  geometry: graphic.geometry,
                  symbol: {
                     type: "simple-fill",
                     color: [255, 255, 0, 0.3],
                     outline: {
                        color: [255, 200, 0, 1],
                        width: 4
                     }
                  } as any
               })
               view.graphics.add(highlightGraphic)
            }

            if (graphic.geometry && graphic.geometry.type === "polygon") {
               const polygon = graphic.geometry as __esri.Polygon
               const extent = polygon.extent
               if (extent) {
                  view.goTo({ target: extent.expand(1.67), tilt: is3D ? 45 : 0 }, { duration: 400, easing: "ease-in-out" })
               }
            }

            console.log("🟢 HC Field Clicked:", attr)
            onElementClick?.("field", attr)
            setIsRightPanelOpen(true)
            return
         }

         // 4. Check for Licenses
         const licenseResults = response.results.filter((result: any) =>
            result.type === "graphic" &&
            result.graphic?.layer === layersRef.current['licenses']
         )

         if (licenseResults.length > 0) {
            const graphic = (licenseResults[0] as any).graphic
            const attr = graphic.attributes

            // Add yellow highlight for license
            if (graphic.geometry) {
               const highlightGraphic = new Graphic({
                  geometry: graphic.geometry,
                  symbol: {
                     type: "simple-fill",
                     color: [255, 255, 0, 0.3],
                     outline: {
                        color: [255, 200, 0, 1],
                        width: 4
                     }
                  } as any
               })
               view.graphics.add(highlightGraphic)
            }

            if (graphic.geometry && graphic.geometry.type === "polygon") {
               const polygon = graphic.geometry as __esri.Polygon
               const extent = polygon.extent
               if (extent) {
                  view.goTo({ target: extent.expand(1.67), tilt: is3D ? 45 : 0 }, { duration: 400, easing: "ease-in-out" })
               }
            }

            console.log("📜 License Clicked:", attr)
            onElementClick?.("license", attr)
            setIsRightPanelOpen(true)
            return
         }

         // 5. Check for G&G Projects
         const gngResults = response.results.filter((result: any) =>
            result.type === "graphic" &&
            result.graphic?.layer === layersRef.current['gng-projects']
         )

         if (gngResults.length > 0) {
            const graphic = (gngResults[0] as any).graphic
            const attr = graphic.attributes

            // Add yellow highlight for G&G project
            if (graphic.geometry) {
               const highlightGraphic = new Graphic({
                  geometry: graphic.geometry,
                  symbol: {
                     type: "simple-fill",
                     color: [255, 255, 0, 0.3],
                     outline: {
                        color: [255, 200, 0, 1],
                        width: 4
                     }
                  } as any
               })
               view.graphics.add(highlightGraphic)
            }

            console.log("📊 G&G Project Clicked:", attr)
            onElementClick?.("gng-project", attr)
            setIsRightPanelOpen(true)
            return
         }

         // 6. Check for Seismic 2D Lines
         const seismic2dResults = response.results.filter((result: any) =>
            result.type === "graphic" &&
            result.graphic?.layer === layersRef.current['seismic-2d']
         )

         if (seismic2dResults.length > 0) {
            const graphic = (seismic2dResults[0] as any).graphic
            const attr = graphic.attributes

            // Add yellow highlight for seismic line
            if (graphic.geometry) {
               const highlightGraphic = new Graphic({
                  geometry: graphic.geometry,
                  symbol: {
                     type: "simple-line",
                     color: [255, 255, 0, 1],
                     width: 6
                  } as any
               })
               view.graphics.add(highlightGraphic)
            }

            console.log("📈 Seismic 2D Clicked:", attr)
            onElementClick?.("seismic-2d", attr)
            setIsRightPanelOpen(true)
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

   // GeoTIFF rendering effect for F3 Horizon - simplified (file is JPEG without georeferencing)
   useEffect(() => {
      if (!mounted || !viewRef.current) return
      
      const isVisible = activeLayers.includes('f3-horizon')
      const graphicsLayer = f3HorizonGraphicsLayerRef.current
      
      if (!graphicsLayer) return
      
      // Clear existing graphics if turning off
      if (!isVisible) {
         graphicsLayer.removeAll()
         return
      }
      
      // If already has graphics, just make visible
      if (graphicsLayer.graphics.length > 0) {
         graphicsLayer.visible = true
         return
      }
      
      // Show a placeholder extent marker for F03 block area
      // Note: Actual horizon image is a JPEG without georeferencing
      const f03Extent = new Extent({
         xmin: 4.8,
         ymin: 53.0,
         xmax: 5.4,
         ymax: 53.4,
         spatialReference: { wkid: 4326 }
      })
      
      const graphic = new Graphic({
         geometry: f03Extent,
         symbol: {
            type: "simple-fill",
            color: [255, 200, 100, 0.2],
            outline: {
               color: [255, 160, 50, 0.8],
               width: 2,
               style: "dash"
            }
         } as any,
         attributes: {
            name: "F3 Shallow Horizon Area",
            note: "Horizon data available (unreferenced)"
         }
      })
      
      graphicsLayer.add(graphic)
      
      // Zoom to the extent
      viewRef.current?.goTo(f03Extent.expand(1.2))
      
      console.log('🗺️ F3 Shallow Horizon area marker shown (no georeferenced image available)')
      
   }, [activeLayers, mounted])

   // Focus mode: highlight AI-identified features, hide others
   useEffect(() => {
      if (!mounted) return

      if (!focusedFeatures) {
         // --- RESTORE ---
         if (originalStateRef.current) {
            const { layerKey, renderer, definitionExpression, visibilities } = originalStateRef.current
            const tgt = layersRef.current[layerKey] as unknown as { definitionExpression: string; renderer: unknown; visible: boolean }
            if (tgt) {
               tgt.definitionExpression = definitionExpression
               tgt.renderer = renderer as __esri.Renderer
               tgt.visible = true
            }
            Object.entries(visibilities).forEach(([key, vis]) => {
               const l = layersRef.current[key]
               if (l) l.visible = vis
            })
            originalStateRef.current = null
         }
         if (viewRef.current) {
            viewRef.current.graphics.removeAll()
         }
         setIsFocused(false)
         return
      }

      // Clear any previous graphics
      if (viewRef.current) {
         viewRef.current.graphics.removeAll()
      }

      // --- APPLY FOCUS ---
      const refKey = AI_TO_REF[focusedFeatures.layer] || focusedFeatures.layer
      const tgtLayer = layersRef.current[refKey] as unknown as {
         definitionExpression: string
         renderer: __esri.Renderer
         visible: boolean
      }
      if (!tgtLayer) return

      // Save original state
      originalStateRef.current = {
         layerKey: refKey,
         definitionExpression: (tgtLayer as unknown as { definitionExpression: string }).definitionExpression || '',
         renderer: (tgtLayer as unknown as { renderer: unknown }).renderer,
         visibilities: Object.fromEntries(
            Object.entries(layersRef.current).map(([k, l]) => [k, l ? l.visible : false])
         ),
      }

      // Keep other layers at their original visibility (don't force all visible)
      // Only ensure the target layer is visible
      Object.entries(layersRef.current).forEach(([key, l]) => {
         if (l && key !== refKey) {
            // Keep original visibility for non-target layers
            const originalVis = originalStateRef.current?.visibilities[key]
            if (originalVis !== undefined) {
               l.visible = originalVis
            }
         }
      })
      // Ensure target layer is visible
      tgtLayer.visible = true

      // Build definitionExpression: FIELD_NAME IN ('K06-T','F16-A')
      const nameField = REF_NAME_FIELD[refKey] || 'OBJECTID'
      const quotedIds = focusedFeatures.identifiers
         .filter(Boolean)
         .map(id => `'${id.replace(/'/g, "''")}'`)
         .join(', ')
      if (quotedIds) {
         ; (tgtLayer as unknown as { definitionExpression: string }).definitionExpression =
            `${nameField} IN (${quotedIds})`
      }

      // Apply amber-gold highlight renderer
      const isLine = refKey === 'seismic-2d'
      const isPoint = refKey === 'wells'
      const highlightRenderer = isPoint
         ? { type: 'simple', symbol: { type: 'simple-marker', color: [255, 185, 0, 1], outline: { color: [200, 100, 0, 1], width: 2 }, size: 12 } }
         : isLine
            ? { type: 'simple', symbol: { type: 'simple-line', color: [255, 185, 0, 1], width: 4 } }
            : {
               type: 'simple',
               symbol: {
                  type: 'simple-fill',
                  color: [255, 185, 0, 0.45],
                  outline: { color: [255, 120, 0, 1], width: 3 },
               },
            }
         ; (tgtLayer as unknown as { renderer: unknown }).renderer = highlightRenderer as unknown as __esri.Renderer

      // Draw Radius if requested
      if (focusedFeatures.radiusInfo) {
         const { originLayer, originId, radiusKm } = focusedFeatures.radiusInfo
         // Fetch the origin geometry to draw the circle
         fetch('/api/ndr-ai/resolve-geometry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layer: originLayer, identifiers: [originId] })
         })
            .then(res => res.json())
            .then((data: { points?: { lat: number; lon: number }[] }) => {
               if (data.points && data.points.length > 0 && viewRef.current) {
                  // Approximate centroid
                  const minLat = Math.min(...data.points.map(p => p.lat))
                  const maxLat = Math.max(...data.points.map(p => p.lat))
                  const minLon = Math.min(...data.points.map(p => p.lon))
                  const maxLon = Math.max(...data.points.map(p => p.lon))

                  const centerLat = (minLat + maxLat) / 2
                  const centerLon = (minLon + maxLon) / 2

                  const circle = new Circle({
                     center: [centerLon, centerLat],
                     radius: radiusKm,
                     radiusUnit: "kilometers"
                  })

                  const graphic = new Graphic({
                     geometry: circle,
                     symbol: {
                        type: "simple-fill",
                        color: [147, 51, 234, 0.15], // Purple with low opacity
                        outline: {
                           color: [147, 51, 234, 0.8],
                           width: 2,
                           style: "dash"
                        }
                     } as any
                  })

                  viewRef.current.graphics.add(graphic)

                  // Optional: zoom to the circle buffer rather than just the points
                  // viewRef.current.goTo(circle.extent.expand(1.2))
               }
            })
            .catch(err => console.error("Failed to draw radius circle:", err))
      }

      setIsFocused(true)
   }, [focusedFeatures, mounted])


   if (!mounted) return <div className="w-full h-full bg-gray-100 animate-pulse" />

   return (
      <div className="w-full h-full relative group">
         <div ref={mapDiv} className="w-full h-full" />

         {/* AI Active Canvas Highlight - pointer-events-none allows map clicks */}
         {aiActive && (
            <div className="absolute inset-0 z-[5] pointer-events-none animate-in fade-in duration-300">
               <div className="absolute inset-0 border-[3px] border-purple-500/40 rounded-lg" />
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                     AI Assistant Active
                  </div>
               </div>
               <div className="absolute inset-0 bg-purple-500/5" />
            </div>
         )}

         {/* Watermark Overlay - 5 AFED logos: corners + center */}
         <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
            {/* Top Left */}
            <div className="absolute top-[10%] left-[10%] opacity-[0.12]">
               <img src="/watermark-afed.png" alt="" className="w-52 h-auto" />
            </div>
            {/* Top Right */}
            <div className="absolute top-[10%] right-[10%] opacity-[0.12]">
               <img src="/watermark-afed.png" alt="" className="w-52 h-auto" />
            </div>
            {/* Center */}
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]">
               <img src="/watermark-afed.png" alt="" className="w-52 h-auto" />
            </div>
            {/* Bottom Left */}
            <div className="absolute bottom-[10%] left-[10%] opacity-[0.12]">
               <img src="/watermark-afed.png" alt="" className="w-52 h-auto" />
            </div>
            {/* Bottom Right */}
            <div className="absolute bottom-[10%] right-[10%] opacity-[0.12]">
               <img src="/watermark-afed.png" alt="" className="w-52 h-auto" />
            </div>
         </div>

         {/* G&G Project Floating Panel - hidden by default, shown via View Other G&G Data button */}
         <GNGProjectFloatingPanel
            onProjectClick={handleGNGProjectClick}
            isRightPanelOpen={isRightPanelOpen}
            isExpanded={isGNGPanelExpanded}
            onExpandChange={onGNGPanelExpandChange}
         />

         {/* Analysis Marker Manager - interactive spatial analysis tool */}
         <AnalysisMarkerManager
            view={viewRef.current}
            visible={isAnalysisMarkerActive}
            isPanelOpen={isPanelOpen}
         />

         {/* Return to Original View — shown when AI focus mode is active */}
         {isFocused && (
            <div className="absolute top-4 right-4 z-20 animate-in fade-in slide-in-from-top-1 duration-300">
               <button
                  onClick={() => {
                     onClearFocus?.()
                  }}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-lg shadow-lg text-xs font-bold tracking-wide transition-all active:scale-95"
               >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                     <path d="M3 3v5h5" />
                  </svg>
                  Return to full view
               </button>
            </div>
         )}



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

         {/* Scale Display - bottom right */}
         {!is3D && currentScale && (
            <div className="absolute bottom-4 right-4 z-10">
               <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded shadow-md text-xs font-mono text-slate-700">
                  1:{Math.round(currentScale).toLocaleString()}
               </div>
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
