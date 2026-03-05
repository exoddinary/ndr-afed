"use client"

import React, { useEffect, useRef, useState } from "react"
import L, { Map as LeafletMap } from "leaflet"
import "leaflet/dist/leaflet.css"

/**
 * GEBMap - Leaflet map using ArcGIS tiles
 */
export function GEBMap({ center = [52.1326, 5.2913], zoom = 6 }: { center?: [number, number]; zoom?: number }) {
  const mapRef = useRef<LeafletMap | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(false)

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

    const map = L.map(containerRef.current, {
      center: [center[0], center[1]],
      zoom,
      zoomControl: true,
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

    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [mounted, center, zoom])

  if (!mounted) {
    return <div className="w-full h-full bg-muted animate-pulse" />
  }

  return <div ref={containerRef} className="w-full h-full" />
}
