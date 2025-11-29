"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import L, { Map as LeafletMap, GeoJSON as GeoJSONLayer } from "leaflet"
import "leaflet/dist/leaflet.css"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface MapLayer {
  id: string
  name: string
  geojsonFile: string
  layerType: "bathymetry" | "fields" | "blocks"
  visible: boolean
  color: string
}

export default function CatalogMap({
  layers: initialLayers = [],
  center = [4.5, 109.5], // Center on Malaysia
  zoom = 6,
  showLayerControl = true,
}: {
  layers?: Array<{ id: number; name: string; geojsonFile: string; layerType: string }>
  center?: [number, number]
  zoom?: number
  showLayerControl?: boolean
}) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [layerStates, setLayerStates] = useState<MapLayer[]>([])
  const [loading, setLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const geoJsonLayersRef = useRef<Record<string, GeoJSONLayer>>({})

  // Initialize layer states with colors
  useEffect(() => {
    console.log("[CatalogMap] Initializing layers:", initialLayers)
    const states = initialLayers.map(layer => ({
      id: String(layer.id),
      name: layer.name,
      geojsonFile: layer.geojsonFile,
      layerType: layer.layerType as "bathymetry" | "fields" | "blocks",
      visible: true,
      color: getLayerColor(layer.layerType)
    }))
    console.log("[CatalogMap] Layer states set:", states)
    setLayerStates(states)
  }, [initialLayers])

  useEffect(() => {
    console.log("[CatalogMap] Component MOUNTED")
    setMounted(true)
    return () => {
      console.log("[CatalogMap] Component UNMOUNTED")
    }
  }, [])

  // Get color scheme based on layer type
  function getLayerColor(type: string): string {
    switch (type) {
      case "bathymetry":
        return "#0D47A1" // Dark blue
      case "fields":
        return "#FF6B35" // Orange/red
      case "blocks":
        return "#7B68EE" // Purple
      default:
        return "#666666"
    }
  }

  // Get style for GeoJSON features
  function getFeatureStyle(layerType: string, isDark: boolean) {
    switch (layerType) {
      case "bathymetry":
        return {
          color: "#0D47A1",      // Dark blue border
          weight: 2,
          fillColor: "#42A5F5",   // Light blue fill
          fillOpacity: 0.3,
        }
      case "fields":
        return {
          color: "#B71C1C",      // Dark red border
          weight: 3,
          fillColor: "#FF5722",   // Bright orange fill
          fillOpacity: 0.6,       // More opaque
        }
      case "blocks":
        return {
          color: "#4A148C",      // Dark purple border
          weight: 3,
          fillColor: "#9C27B0",   // Bright purple fill
          fillOpacity: 0.4,
        }
      default:
        return {
          color: "#666666",
          weight: 1,
          fillColor: "#999999",
          fillOpacity: 0.3,
        }
    }
  }

  // Load and render GeoJSON layers
  useEffect(() => {
    if (!mounted || !containerRef.current || layerStates.length === 0) return

    const isDark = resolvedTheme === "dark"

    // Initialize map if not exists
    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      })

      // Add ArcGIS tile layer from Indonesian government geoportal
      // Using ESDM (Ministry of Energy and Mineral Resources) MapServer
      //const baseMapUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      const baseMapUrl = "https://geoportal.esdm.go.id/gis3/rest/services/DMEW/Wilayah_Kerja_Migas_Konvensional/MapServer/tile/{z}/{y}/{x}"
      const overlayUrl = "https://geoportal.esdm.go.id/gis3/rest/services/DMEW/Wilayah_Kerja_Migas_Konvensional/MapServer/tile/{z}/{y}/{x}"

      console.log("[CatalogMap] Loading ArcGIS tiles from ESDM geoportal:", { center, zoom })

      const tileLayer = L.tileLayer(baseMapUrl, {
        attribution:
          '© <a href="https://www.esri.com/">Esri</a>, ArcGIS',
        maxZoom: 20,
        tileSize: 256,
      })

      tileLayer.on('tileerror', (error: any) => {
        console.error("[CatalogMap] Tile loading error:", error)
        setMapError("Failed to load map tiles from ArcGIS.")
      })

      tileLayer.on('load', () => {
        console.log("[CatalogMap] ArcGIS base tiles loaded successfully")
      })

      tileLayer.addTo(map)

      // Add the oil and gas working areas overlay
      const overlayLayer = L.tileLayer(overlayUrl, {
        attribution: '© <a href="https://geoportal.esdm.go.id/">ESDM Indonesia</a>',
        maxZoom: 20,
        tileSize: 256,
        opacity: 0.7, // Make it semi-transparent to see the base map
      })

      overlayLayer.on('tileerror', (error: any) => {
        console.warn("[CatalogMap] Overlay tile loading error:", error)
      })

      overlayLayer.on('load', () => {
        console.log("[CatalogMap] ESDM overlay tiles loaded successfully")
      })

      overlayLayer.addTo(map)

      mapRef.current = map
      setTimeout(() => map.invalidateSize(), 100)
    }

    // Load GeoJSON layers
    async function loadLayers() {
      if (!mapRef.current) return
      setLoading(true)

      // IMPORTANT: Clear ALL existing layers first to prevent overlays
      console.log("[CatalogMap] Clearing all existing layers")
      Object.keys(geoJsonLayersRef.current).forEach(layerId => {
        if (geoJsonLayersRef.current[layerId]) {
          geoJsonLayersRef.current[layerId].remove()
          delete geoJsonLayersRef.current[layerId]
        }
      })

      for (const layer of layerStates) {
        if (!layer.visible) continue

        try {
          console.log(`[CatalogMap] Loading layer: ${layer.name} from ${layer.geojsonFile}`)
          const response = await fetch(layer.geojsonFile)
          if (!response.ok) {
            console.error(`[CatalogMap] Failed to load ${layer.name}: HTTP ${response.status}`)
            continue
          }

          const geojsonData = await response.json()
          console.log(`[CatalogMap] GeoJSON loaded for ${layer.name}:`, geojsonData.features?.length || 0, "features")
          const style = getFeatureStyle(layer.layerType, isDark)

          const geoJsonLayer = L.geoJSON(geojsonData, {
            style: () => style,
            onEachFeature: (feature, layer) => {
              // Add popup with feature properties
              const props = feature.properties || {}
              let popupContent = `<div class="text-sm"><strong>${props.NAME || props.FIELD_NAME || props.BLOCK_NAME || "Feature"}</strong><br/>`

              // Show a few key properties
              const displayProps = Object.keys(props)
                .filter(key => !key.startsWith("_") && key !== "geometry")
                .slice(0, 5)

              displayProps.forEach(key => {
                popupContent += `${key}: ${props[key]}<br/>`
              })
              popupContent += `</div>`

              layer.bindPopup(popupContent)

              // Add hover effect
              layer.on("mouseover", function (this: L.Path) {
                this.setStyle({
                  weight: style.weight + 1,
                  fillOpacity: (style.fillOpacity || 0.4) + 0.2,
                })
              })

              layer.on("mouseout", function (this: L.Path) {
                this.setStyle(style)
              })
            },
          })

          if (mapRef.current) {
            geoJsonLayer.addTo(mapRef.current)
            geoJsonLayersRef.current[layer.id] = geoJsonLayer
          }
        } catch (error) {
          console.error(`Error loading ${layer.name}:`, error)
        }
      }

      setLoading(false)
    }

    loadLayers()

    return () => {
      // Cleanup
      Object.values(geoJsonLayersRef.current).forEach(layer => layer?.remove())
      geoJsonLayersRef.current = {}
    }
  }, [mounted, resolvedTheme, layerStates, center, zoom])

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    setLayerStates(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    )
  }

  if (!mounted) {
    return <div className="w-full h-full bg-muted animate-pulse" />
  }

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Card className="p-6 max-w-md">
          <h3 className="text-lg font-semibold mb-2 text-foreground">Map Configuration Error</h3>
          <p className="text-sm text-muted-foreground mb-4">{mapError}</p>
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">Please check your ArcGIS map configuration.</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Layer control panel - only show if showLayerControl is true */}
      {showLayerControl && (
        <Card className="absolute top-4 right-4 z-[1000] p-4 bg-background/95 backdrop-blur shadow-lg">
          <h3 className="text-sm font-semibold mb-3 text-foreground">Map Layers</h3>
          {loading && (
            <p className="text-xs text-muted-foreground mb-2">Loading layers...</p>
          )}
          <div className="space-y-2">
            {layerStates.map(layer => (
              <div key={layer.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`layer-${layer.id}`}
                  checked={layer.visible}
                  onCheckedChange={() => toggleLayer(layer.id)}
                />
                <Label
                  htmlFor={`layer-${layer.id}`}
                  className="text-xs cursor-pointer flex items-center gap-2"
                >
                  <span
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: layer.color }}
                  />
                  {layer.name}
                </Label>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground">
              Click features for details
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
