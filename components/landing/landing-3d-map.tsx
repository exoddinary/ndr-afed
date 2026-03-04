"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

// Lightweight ArcGIS JS API loader
function ensureArcgisStyles() {
    const id = 'arcgis-theme-link'
    const href = 'https://js.arcgis.com/4.29/esri/themes/dark/main.css'
    const existing = document.getElementById(id) as HTMLLinkElement | null
    if (existing) {
        if (existing.href === href) return
        existing.href = href
        return
    }
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
}

function loadArcGIS(): Promise<typeof window & { require: any }> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") return reject(new Error("window undefined"))
        if ((window as any).require && (window as any).esriConfig) {
            ensureArcgisStyles()
            resolve(window as any)
            return
        }
        const existing = document.querySelector("script[data-arcgis]") as HTMLScriptElement | null
        if (existing) {
            ensureArcgisStyles()
            if ((window as any).require) {
                resolve(window as any)
                return
            }
            existing.addEventListener("load", () => resolve(window as any))
            return
        }
        ensureArcgisStyles()
        const script = document.createElement("script")
        script.src = "https://js.arcgis.com/4.29/"
        script.async = true
        script.defer = true
        script.setAttribute("data-arcgis", "true")
        script.onload = () => resolve(window as any)
        script.onerror = () => reject(new Error("ArcGIS script load error"))
        document.body.appendChild(script)
    })
}

export function Landing3DMap() {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<any>(null)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const router = useRouter()

    useEffect(() => {
        let canceled = false

        loadArcGIS().then(() => {
            if (canceled) return
                ; (window as any).require([
                    "esri/Map",
                    "esri/views/SceneView",
                    "esri/Graphic",
                    "esri/layers/GraphicsLayer",
                    "esri/symbols/PointSymbol3D",
                    "esri/symbols/ObjectSymbol3DLayer"
                ], (ArcGISMap: any, SceneView: any, Graphic: any, GraphicsLayer: any, PointSymbol3D: any, ObjectSymbol3DLayer: any) => {
                    if (!containerRef.current) return

                    const map = new ArcGISMap({
                        basemap: "satellite",
                        ground: "world-elevation"
                    })

                    const view = new SceneView({
                        container: containerRef.current,
                        map: map,
                        camera: {
                            position: {
                                x: 118, // Longitude
                                y: -20, // Latitude (start further south for a tilted view)
                                z: 15000000 // Altitude
                            },
                            tilt: 0
                        },
                        environment: {
                            background: {
                                type: "color",
                                color: [0, 0, 0, 1]
                            },
                            starsEnabled: true,
                            atmosphereEnabled: true
                        },
                        ui: {
                            components: [] // Hide all UI controls
                        },
                        qualityProfile: "high"
                    })

                    viewRef.current = view

                    // Add a marker for Indonesia
                    const graphicsLayer = new GraphicsLayer()
                    map.add(graphicsLayer)

                    // Create a 3D marker symbol
                    const markerSymbol = {
                        type: "point-3d", // autocasts as new PointSymbol3D()
                        symbolLayers: [{
                            type: "object",  // autocasts as new ObjectSymbol3DLayer()
                            width: 500000,   // diameter of the object in meters
                            height: 500000,  // height of the object in meters
                            resource: { primitive: "sphere" },
                            material: { color: [76, 29, 149] } // Purple color
                        }],
                        verticalOffset: {
                            screenLength: 40,
                            maxWorldLength: 200000,
                            minWorldLength: 20000
                        },
                        callout: {
                            type: "line", // autocasts as new LineCallout3D()
                            size: 1.5,
                            color: [255, 255, 255],
                            border: {
                                color: [255, 255, 255]
                            }
                        }
                    }

                    const point = {
                        type: "point",
                        x: 118,
                        y: -2,
                        z: 0
                    }

                    const pointGraphic = new Graphic({
                        geometry: point,
                        symbol: markerSymbol,
                        attributes: {
                            name: "Indonesia GDE"
                        }
                    })

                    graphicsLayer.add(pointGraphic)

                    // Handle click
                    view.on("click", (event: any) => {
                        view.hitTest(event).then((response: any) => {
                            if (response.results.length > 0) {
                                const graphic = response.results[0].graphic
                                if (graphic === pointGraphic) {
                                    startTransition()
                                }
                            }
                        })
                    })
                })
        })

        return () => {
            canceled = true
            if (viewRef.current) {
                viewRef.current.destroy()
            }
        }
    }, [])

    const startTransition = () => {
        if (!viewRef.current) return

        // 1. Animate camera
        viewRef.current.goTo({
            target: [118, -2],
            zoom: 8,
            tilt: 45
        }, {
            duration: 2000,
            easing: "in-out-expo"
        }).then(() => {
            // 2. Trigger whiteout
            setIsTransitioning(true)

            // 3. Navigate after whiteout fills screen
            setTimeout(() => {
                router.push("/workspace")
            }, 1000)
        })
    }

    return (
        <div className="relative w-full h-full">
            <div ref={containerRef} className="w-full h-full" />

            {/* Overlay Text/Button */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                <div className={`text-center space-y-6 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                    <h1 className="text-6xl font-bold text-white tracking-tight drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        Indonesia VDR
                    </h1>
                    <p className="text-xl text-slate-200 max-w-2xl mx-auto drop-shadow-md animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                        Virtual Data Room for Geological Exploration
                    </p>

                    <button
                        onClick={startTransition}
                        className="pointer-events-auto bg-primary/90 hover:bg-primary text-white px-8 py-4 text-lg rounded-full shadow-[0_0_30px_rgba(76,29,149,0.5)] hover:shadow-[0_0_50px_rgba(76,29,149,0.8)] transition-all backdrop-blur-sm border border-primary/30 animate-in fade-in zoom-in duration-1000 delay-300"
                    >
                        Enter Workspace
                    </button>
                </div>
            </div>

            {/* White Transition Overlay */}
            <div
                className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-1000 ease-in ${isTransitioning ? "opacity-100" : "opacity-0"
                    }`}
            />
        </div>
    )
}
