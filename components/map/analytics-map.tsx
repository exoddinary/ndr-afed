"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export default function AnalyticsMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !mapContainer.current) return

    const loadMap = () => {
      try {
        if (map.current) return

        // Initialize Leaflet map
        map.current = L.map(mapContainer.current!, {
          center: [2.5, 104.0], // Southeast Asia
          zoom: 5,
          zoomControl: true,
          attributionControl: true,
        })

        // Add ArcGIS base layer + ESDM overlay
        const baseMapUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        const overlayUrl = "https://geoportal.esdm.go.id/gis3/rest/services/DMEW/Wilayah_Kerja_Migas_Konvensional/MapServer/tile/{z}/{y}/{x}"

        L.tileLayer(baseMapUrl, {
          attribution: '© <a href="https://www.esri.com/">Esri</a>',
          maxZoom: 20,
          tileSize: 256,
        }).addTo(map.current)

        // Add oil and gas working areas overlay
        L.tileLayer(overlayUrl, {
          attribution: '© <a href="https://geoportal.esdm.go.id/">ESDM Indonesia</a>',
          maxZoom: 20,
          tileSize: 256,
          opacity: 0.7,
        }).addTo(map.current)

        // Add mock well data points
        const wellsData = [
          // Malay Basin wells (high prospectivity)
          { lat: 3.2, lng: 103.8, name: "Well Alpha-1", toc: 4.2, score: 95, category: "high" },
          { lat: 3.5, lng: 104.1, name: "Well Beta-3", toc: 3.8, score: 92, category: "high" },
          { lat: 3.0, lng: 103.5, name: "Well Gamma-7", toc: 3.5, score: 89, category: "high" },
          { lat: 3.8, lng: 104.3, name: "Well Delta-2", toc: 3.3, score: 87, category: "high" },
          { lat: 3.4, lng: 103.9, name: "Well Epsilon-4", toc: 3.1, score: 85, category: "high" },

          // Sumatra Basin wells (moderate)
          { lat: 0.5, lng: 101.5, name: "Well Zeta-5", toc: 2.8, score: 78, category: "moderate" },
          { lat: 0.8, lng: 101.8, name: "Well Eta-8", toc: 2.4, score: 70, category: "moderate" },
          { lat: 1.2, lng: 102.1, name: "Well Theta-3", toc: 1.9, score: 60, category: "moderate" },

          // Java Basin wells (low)
          { lat: -6.8, lng: 107.5, name: "Well Iota-6", toc: 1.5, score: 48, category: "low" },
          { lat: -7.2, lng: 108.2, name: "Well Kappa-9", toc: 1.2, score: 35, category: "low" },
          { lat: -7.0, lng: 107.8, name: "Well Lambda-4", toc: 0.8, score: 22, category: "low" },

          // Borneo Basin wells (moderate-high)
          { lat: 4.5, lng: 115.2, name: "Well Mu-2", toc: 4.5, score: 97, category: "high" },
          { lat: 4.8, lng: 115.8, name: "Well Nu-7", toc: 3.9, score: 91, category: "high" },
          { lat: 4.2, lng: 114.9, name: "Well Xi-1", toc: 3.2, score: 84, category: "high" },
        ]

        // Function to get marker color based on category
        const getMarkerColor = (category: string) => {
          switch (category) {
            case "high": return "#10b981"
            case "moderate": return "#eab308"
            case "low": return "#ef4444"
            default: return "#64748b"
          }
        }

        // Add markers for each well
        wellsData.forEach(well => {
          const color = getMarkerColor(well.category)

          const marker = L.circleMarker([well.lat, well.lng], {
            radius: 8,
            fillColor: color,
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          })

          marker.bindPopup(`
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="font-weight: 600; margin-bottom: 8px; color: #0f172a;">${well.name}</h3>
              <div style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">TOC:</span>
                  <span style="font-weight: 500;">${well.toc}%</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Score:</span>
                  <span style="font-weight: 500;">${well.score}</span>
                </div>
              </div>
            </div>
          `)

          marker.addTo(map.current!)
        })

        setTimeout(() => map.current?.invalidateSize(), 100)
      } catch (error) {
        console.error("Error loading map:", error)
      }
    }

    loadMap()

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [mounted])

  if (!mounted) {
    return <div className="w-full h-full bg-muted animate-pulse" />
  }

  return <div ref={mapContainer} className="w-full h-full" />
}
