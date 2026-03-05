"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import L, { Map as LeafletMap } from "leaflet"
import "leaflet/dist/leaflet.css"

// Adaptive map that switches between light and dark tiles based on theme
// Renders a circle marker at the provided lat/lng
export default function DarkMap({
  lat = 52.3676,
  lng = 4.9041,
  zoom = 7,
  bluish = true,
}: {
  lat?: number
  lng?: number
  zoom?: number
  bluish?: boolean
}) {
  const { theme, resolvedTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const mapRef = useRef<LeafletMap | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Wait for component to mount to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current) return

    // Clean up existing map if it exists
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    // Add a small delay to ensure theme has fully resolved
    const timer = setTimeout(() => {
      if (!containerRef.current) return

      const isDark = resolvedTheme === 'dark'

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom,
        zoomControl: false,
        attributionControl: true,
      })

      // Use ArcGIS base layer
      const baseMapUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      const overlayUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

      L.tileLayer(baseMapUrl, {
        attribution: '© <a href="https://www.esri.com/">Esri</a>',
        maxZoom: 20,
        tileSize: 256,
      }).addTo(map)

      // Add oil and gas working areas overlay
      L.tileLayer(overlayUrl, {
        attribution: '© <a href="https://nlog.nl/">NLOG / GDN</a>',
        maxZoom: 20,
        tileSize: 256,
        opacity: 0.7,
      }).addTo(map)

      // Adaptive marker colors based on theme
      const markerColors = isDark
        ? { color: "#38bdf8", fillColor: "#0ea5e9" }
        : { color: "#2563eb", fillColor: "#3b82f6" }

      L.circleMarker([lat, lng], {
        radius: 8,
        color: markerColors.color,
        weight: 2,
        fillColor: markerColors.fillColor,
        fillOpacity: 0.8,
      }).addTo(map)

      mapRef.current = map
      // Ensure Leaflet paints correctly in flex layouts
      setTimeout(() => map.invalidateSize(), 0)
    }, 150)

    return () => {
      clearTimeout(timer)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [mounted, resolvedTheme, theme, lat, lng, zoom])

  // Apply a subtle blue tint when requested
  const filter = bluish ? "hue-rotate(185deg) saturate(1.15) brightness(0.95) contrast(1.05)" : undefined
  return (
    <div className="relative w-full h-full" style={filter ? { filter } : undefined}>
      {/* Back button overlay */}
      <div className="absolute left-4 top-4 z-[1000]">
        <Button variant="outline" className="bg-background/80 backdrop-blur" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
