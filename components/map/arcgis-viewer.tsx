"use client"

import { useEffect, useRef, useState } from "react"
import { useRive } from '@rive-app/react-canvas'
import { useTheme } from 'next-themes'

// Lightweight ArcGIS JS API loader via CDN (no npm deps)
function ensureArcgisStyles(theme: 'dark' | 'light') {
  const id = 'arcgis-theme-link'
  const href = theme === 'dark'
    ? 'https://js.arcgis.com/4.29/esri/themes/dark/main.css'
    : 'https://js.arcgis.com/4.29/esri/themes/light/main.css'
  // If a theme link already exists with the same href, do nothing (keep cache)
  const existing = document.getElementById(id) as HTMLLinkElement | null
  if (existing) {
    if (existing.href === href) return
    existing.href = href
    return
  }
  // Create once
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

function loadArcGIS(theme: 'dark' | 'light'): Promise<typeof window & { require: any }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("window undefined"))
    // Already loaded
    if ((window as any).require && (window as any).esriConfig) {
      ensureArcgisStyles(theme)
      resolve(window as any)
      return
    }
    // Inject script once
    const existing = document.querySelector("script[data-arcgis]") as HTMLScriptElement | null
    if (existing) {
      ensureArcgisStyles(theme)
      // If AMD loader is already available, resolve immediately
      if ((window as any).require) {
        resolve(window as any)
        return
      }
      existing.addEventListener("load", () => resolve(window as any))
      existing.addEventListener("error", () => reject(new Error("ArcGIS script load error")))
      return
    }
    ensureArcgisStyles(theme)

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

export type ArcGISViewerProps = {
  className?: string
  style?: React.CSSProperties
  /** basemap id e.g. 'dark-gray', 'streets-navigation-vector', 'satellite' */
  basemap?: string
  /** Optional ArcGIS portal item ID to use as basemap (e.g., Oceans basemap: 5ae9e138a17842688b0b79283a4353f6) */
  basemapPortalItemId?: string
  center?: [number, number] // [lon, lat]
  zoom?: number
  /** Optional list of GeoJSON layer configs to add */
  geojsonLayers?: Array<{
    url: string
    title: string
    visible?: boolean
    type: 'bathymetry' | 'fields' | 'blocks' | 'wells'
    /** data format; default 'geojson'. If 'shapefile', url must point to a .zip with shp, shx, dbf, prj */
    format?: 'geojson' | 'shapefile'
    /** Enable clustering for point layers (wells) */
    enableClustering?: boolean
  }>
  /** ArcGIS UI theme: 'dark' | 'light' */
  uiTheme?: 'dark' | 'light'
  /** Auto-fit view to first layer's extent after load (default: true) */
  fitOnLoad?: boolean
  /** Callback when a feature is clicked, receives feature attributes */
  onFeatureClick?: (attributes: Record<string, any>) => void
  /** Basin name to highlight on the map */
  highlightBasinName?: string | null
  /** Whether to show the ArcGIS LayerList UI (default: false) */
  showLayerList?: boolean
  /** Callback when the view is ready, receives the MapView instance */
  onViewReady?: (view: any) => void
  /** Optional list of basin names to display (case-insensitive). When provided, other basins are hidden for 'blocks' layers. */
  allowedBasins?: string[]
  /** Optional mapping of basin name -> tier number (1..4) for coloring */
  tierByBasin?: Record<string, number>
  /** Optional custom basemap URL (e.g. MapServer or XYZ tiles) */
  customBasemapUrl?: string
}

export default function ArcGISViewer({
  className,
  style,
  basemap = "dark-gray",
  basemapPortalItemId,
  customBasemapUrl,
  center = [109.5, 3.5],
  zoom = 6,
  geojsonLayers = [],
  uiTheme = 'dark',
  fitOnLoad = true,
  onFeatureClick,
  highlightBasinName,
  showLayerList,
  onViewReady,
  allowedBasins,
  tierByBasin,
}: ArcGISViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [minLoadTimePassed, setMinLoadTimePassed] = useState(false)
  const [viewReady, setViewReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [slowNote, setSlowNote] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const [riveAvailable, setRiveAvailable] = useState<boolean>(true)
  const riveSrc = `/SEEK_Loading.riv`

  // Rive animation for loading
  const { RiveComponent } = useRive({
    src: riveSrc,
    artboard: 'Loading_SEEK',
    stateMachines: 'Main',
    autoplay: true,
  })

  // Minimum loading time of 1.5s
  useEffect(() => {
    const timer = setTimeout(() => setMinLoadTimePassed(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Progress indicator: ramp to 90% while waiting, 100% when ready
  useEffect(() => {
    if (!isLoading) return
    let p = 0
    setProgress(0)
    const id = setInterval(() => {
      p = Math.min(p + Math.random() * 10, 90)
      setProgress(prev => (prev < 90 ? Math.max(prev, Math.floor(p)) : prev))
    }, 200)
    return () => clearInterval(id)
  }, [isLoading])

  // Probe Rive file availability to fall back gracefully
  useEffect(() => {
    let cancelled = false
    fetch(riveSrc, { method: 'GET', cache: 'no-store' })
      .then((res) => {
        if (cancelled) return
        setRiveAvailable(res.ok)
      })
      .catch(() => {
        if (cancelled) return
        setRiveAvailable(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let canceled = false
    setIsLoading(true)
    setMinLoadTimePassed(false)
    setViewReady(false)
    setSlowNote(null)
    loadArcGIS(uiTheme)
      .then(async () => {
        if (canceled) return
          ; (window as any).require([
            "esri/Map",
            "esri/views/MapView",
            "esri/widgets/LayerList",
            "esri/layers/GeoJSONLayer",
            "esri/Basemap",
            "esri/layers/WebTileLayer",
            "esri/layers/MapImageLayer",
            "esri/layers/TileLayer"
          ], (ArcGISMap: any, MapView: any, LayerList: any, GeoJSONLayer: any, Basemap: any, WebTileLayer: any, MapImageLayer: any, TileLayer: any) => {
            if (!containerRef.current) return

            // Determine basemap
            let basemapOption = basemap

            if (customBasemapUrl) {
              // Create custom basemap from URL
              // If it ends in /MapServer, use MapImageLayer or TileLayer
              // If it has {z}/{y}/{x}, use WebTileLayer
              let baseLayer
              if (customBasemapUrl.includes("{z}") || customBasemapUrl.includes("{x}")) {
                baseLayer = new WebTileLayer({
                  urlTemplate: customBasemapUrl
                })
              } else if (customBasemapUrl.endsWith("/MapServer")) {
                // Try TileLayer first as it's more performant for cached services
                baseLayer = new TileLayer({
                  url: customBasemapUrl
                })
              } else {
                baseLayer = new MapImageLayer({
                  url: customBasemapUrl
                })
              }

              // Add a dark base underneath if needed, or just use this layer
              basemapOption = new Basemap({
                baseLayers: [
                  // Add a dark gray base first so transparency works well
                  new WebTileLayer({
                    urlTemplate: "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  }),
                  baseLayer
                ]
              })
            } else if (basemapPortalItemId) {
              basemapOption = new Basemap({ portalItem: { id: basemapPortalItemId } })
            }

            const map = new ArcGISMap({ basemap: basemapOption })
            const view = new MapView({
              container: containerRef.current,
              map,
              center,
              zoom,
              constraints: { minZoom: 2, maxZoom: 15 },
              ui: { components: ["attribution", "zoom", "compass"] },
            })

            // Move zoom and compass to top-right to avoid chatbot overlap
            view.when(() => {
              view.ui.move("zoom", "top-right")
              const compass = view.ui.find("compass")
              if (compass) view.ui.move(compass, "top-right")
            })

            // Optionally add LayerList UI if requested
            if (showLayerList) {
              const layerList = new LayerList({ view })
              view.ui.add(layerList, "top-right")
            }

            // Helper: renderer by type
            const makeRenderer = (type: string) => {
              if (type === 'bathymetry') {
                return {
                  type: 'simple',
                  symbol: {
                    type: 'simple-line',
                    color: '#0D47A1',
                    width: 1.5
                  }
                }
              }
              if (type === 'fields') {
                return {
                  type: 'simple',
                  symbol: {
                    type: 'simple-fill',
                    color: [255, 87, 34, 0.5],
                    outline: { color: '#B71C1C', width: 1.5 }
                  }
                }
              }
              if (type === 'wells') {
                return {
                  type: 'simple',
                  symbol: {
                    type: 'simple-marker',
                    color: [13, 148, 136],
                    size: 6,
                    outline: { color: [255, 255, 255], width: 1 }
                  }
                }
              }
              // blocks (basins) – start with simple-fill so unique-value renderer can fully override
              return {
                type: 'simple',
                symbol: {
                  type: 'simple-fill',
                  color: [130, 129, 130, 0.06],
                  outline: { color: '#828182', width: 1.5 }
                }
              }
            }

            // Add provided GeoJSON layers (if any)
            try {
              // Keep polygons on top for better hit-testing
              const order = (t: string) => (t === 'bathymetry' ? 0 : t === 'wells' ? 1 : t === 'fields' ? 2 : 3)
              let didFit = false

              geojsonLayers
                ?.slice()
                .sort((a, b) => order(a.type) - order(b.type))
                .forEach((cfg: { url: string; title: string; visible?: boolean; type: 'bathymetry' | 'fields' | 'blocks' | 'wells'; format?: 'geojson' | 'shapefile'; enableClustering?: boolean }) => {
                  const popupTemplate = {
                    title: `{NAME || FIELD_NAME || BLOCK_ID || ${JSON.stringify(cfg.title)}}`,
                    content: [
                      {
                        type: 'fields',
                        fieldInfos: [
                          { fieldName: 'FIELD_NAME', label: 'Field' },
                          { fieldName: 'BLOCK_ID', label: 'Block' },
                          { fieldName: 'BASIN_NAME', label: 'Basin' },
                          { fieldName: 'REGION_NAM', label: 'Region' },
                          { fieldName: 'COUNTRY_NA', label: 'Country' },
                        ],
                      },
                    ],
                  } as any

                  const isShp = (cfg.format ?? 'geojson') === 'shapefile' || /\.zip($|\?)/i.test(cfg.url)
                  if (!isShp) {
                    (async () => {
                      // Probe the URL to avoid creating layers with zero features (ArcGIS errors on layerview)
                      try {
                        const res = await fetch(cfg.url, { cache: 'no-store' })
                        if (!res.ok) throw new Error(`HTTP ${res.status}`)
                        const gj = await res.json()
                        const count = Array.isArray(gj?.features) ? gj.features.length : 0
                        if (count === 0) {
                          console.warn('Skipping empty GeoJSON layer:', cfg.title)
                          return
                        }
                      } catch (e) {
                        console.warn('Skipping GeoJSON layer due to fetch/parse error:', cfg.title, e)
                        return
                      }

                      const layerConfig: any = {
                        url: cfg.url,
                        title: cfg.title,
                        visible: cfg.visible ?? true,
                        renderer: makeRenderer(cfg.type),
                        popupEnabled: true,
                        outFields: ['*'],
                        popupTemplate,
                      }

                      // Add clustering for wells
                      if (cfg.enableClustering && cfg.type === 'wells') {
                        layerConfig.featureReduction = {
                          type: 'cluster',
                          clusterRadius: '60px',
                          clusterMinSize: '24px',
                          clusterMaxSize: '60px',
                          labelingInfo: [{
                            deconflictionStrategy: 'none',
                            labelExpressionInfo: {
                              expression: "Text($feature.cluster_count, '#,###')"
                            },
                            symbol: {
                              type: 'text',
                              color: '#ffffff',
                              font: { weight: 'bold', size: '12px' },
                              haloColor: 'rgba(0,0,0,0.3)',
                              haloSize: '1px'
                            },
                            labelPlacement: 'center-center'
                          }],
                          popupTemplate: {
                            title: 'Cluster of {cluster_count} wells',
                            content: 'Zoom in to see individual wells.'
                          }
                        }
                      }

                      const layer = new GeoJSONLayer(layerConfig)
                      map.add(layer, order(cfg.type))
                      layersRef.current.push(layer)
                      layer.when().then(() => {
                        // Add centroid labels for basins (blocks)
                        if (cfg.type === 'blocks') {
                          try {
                            const labelColor = uiTheme === 'dark' ? '#ffffff' : '#111111'
                            const haloColor = uiTheme === 'dark' ? '#000000' : '#ffffff'
                              // Temporarily disable basin labels to reduce console spam and ensure stability
                              ; (layer as any).labelingInfo = []
                          } catch { }

                          // Scale-dependent filtering for small basins when zoomed out
                          try {
                            // Helper to merge definition expressions safely
                            const applyCombinedDef = (ly: any) => {
                              const nameExpr = (ly as any).__nameFilterExpr as string | undefined
                              const areaExpr = (ly as any).__areaFilterExpr as string | undefined
                              const expr = [nameExpr, areaExpr].filter(Boolean).join(' AND ')
                                ; (ly as any).definitionExpression = expr || undefined
                            }

                            view.whenLayerView(layer).then((lv: any) => {
                              // Find an area-like field if present
                              const fields: Array<{ name: string }> = (layer as any).fields || []
                              const areaField = (fields.find(f => /^(shape_)?area$/i.test(f.name))
                                || fields.find(f => /(area|sqkm|km2)/i.test(f.name)))?.name

                              if (!areaField) return // if no area field, skip filtering

                              const applyFilterForScale = (scale: number) => {
                                // Disable area-based filtering so basins never disappear when zooming
                                ; (layer as any).__areaFilterExpr = undefined
                                applyCombinedDef(layer)
                                try { (layer as any).refresh?.() } catch { }
                              }

                              applyFilterForScale(view.scale)
                              view.watch('scale', (s: number) => applyFilterForScale(s))
                            })
                          } catch { }
                        }
                        if (fitOnLoad && !didFit && (layer as any).fullExtent) {
                          didFit = true
                          view.goTo({ target: (layer as any).fullExtent, padding: 20 }).catch(() => { })
                          // crude check for non-WGS84 projected coords
                          const width = Math.abs((layer as any).fullExtent.xmax - (layer as any).fullExtent.xmin)
                          if (width > 1000) console.warn('Basin extent width seems large; ensure shapefile is in WGS84 (EPSG:4326).')
                        }
                      }).catch(() => { })
                    })()
                    return
                  }

                  // Use shpjs to parse shapefile zip directly (ShapefileLayer not available in ArcGIS 4.29)
                  (async () => {
                    console.log('Loading shapefile via shpjs:', cfg.url)
                    try {
                      // Load shpjs from CDN and convert zip -> GeoJSON
                      await new Promise<void>((resolve2, reject2) => {
                        const id = 'shpjs-cdn'
                        const existing = document.getElementById(id)
                        if (existing) {
                          // Wait a bit to ensure it's fully loaded
                          if ((window as any).shp) return resolve2()
                          setTimeout(() => {
                            if ((window as any).shp) resolve2()
                            else reject2(new Error('shpjs loaded but not available'))
                          }, 500)
                          return
                        }
                        const s = document.createElement('script')
                        s.id = id
                        s.src = 'https://unpkg.com/shpjs@latest/dist/shp.min.js'
                        s.async = false // Load synchronously to ensure availability
                        s.onload = () => {
                          console.log('shpjs loaded, checking availability...')
                          // Wait a tick for the global to be available
                          setTimeout(() => {
                            if ((window as any).shp) {
                              console.log('shp function available')
                              resolve2()
                            } else {
                              console.error('shp function not available after load')
                              reject2(new Error('shp not available'))
                            }
                          }, 100)
                        }
                        s.onerror = () => reject2(new Error('Failed to load shpjs'))
                        document.head.appendChild(s)
                      })

                      const shp = (window as any).shp
                      if (!shp || typeof shp !== 'function') {
                        throw new Error('shp is not a function')
                      }

                      console.log('Fetching shapefile:', cfg.url)
                      const arrayBuf = await fetch(cfg.url).then(r => {
                        if (!r.ok) throw new Error(`Failed to fetch: ${r.status}`)
                        return r.arrayBuffer()
                      })
                      console.log('Parsing shapefile with shpjs...')
                      let geojson = await shp(arrayBuf)
                      // shpjs may return an object of named layers; pick the first FeatureCollection
                      if (!geojson?.type) {
                        const first = Object.values(geojson ?? {}).find((v: any) => v && v.type === 'FeatureCollection') as any
                        if (first) geojson = first
                      }
                      console.log('GeoJSON parsed successfully, features:', geojson?.features?.length || 0)
                      const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json' })
                      const blobUrl = URL.createObjectURL(blob)
                      console.log('Creating GeoJSONLayer from blob URL')
                      const layer = new GeoJSONLayer({
                        url: blobUrl,
                        title: cfg.title,
                        visible: cfg.visible ?? true,
                        renderer: makeRenderer(cfg.type),
                        popupEnabled: true,
                        outFields: ['*'],
                        popupTemplate,
                      })
                      map.add(layer, order(cfg.type))
                      layersRef.current.push(layer)
                      console.log('Layer added to map, waiting for load...')
                      layer.when().then(() => {
                        console.log('Layer loaded successfully:', cfg.title)
                        const ext = (layer as any).fullExtent
                        if (fitOnLoad && ext) {
                          view.goTo({ target: ext, padding: 20 }).catch(() => { })
                          // crude check for non-WGS84 projected coords
                          const width = Math.abs(ext.xmax - ext.xmin)
                          if (width > 1000) console.warn('Basin extent width seems large; ensure shapefile is in WGS84 (EPSG:4326).')
                        }
                      }).catch((err: any) => {
                        console.error('Layer load error:', err)
                      })
                    } catch (e) {
                      console.error('Failed to load shapefile via shpjs', e)
                    }
                  })()
                })
            } catch (e) {
              console.warn('Failed to add GeoJSON layers', e)
            }

            viewRef.current = view

            // Ensure the map renders after route transitions or container resizes
            try {
              const ro = new ResizeObserver(() => {
                try { view.resize(); view.requestRender(); } catch { }
              })
              if (containerRef.current) ro.observe(containerRef.current)
              // @ts-ignore store for cleanup
              view.__resizeObserver = ro
            } catch { }

            const onVis = () => {
              try { if (document.visibilityState === 'visible') { view.resize(); view.requestRender(); } } catch { }
            }
            document.addEventListener('visibilitychange', onVis)
            // @ts-ignore
            view.__onVis = onVis

            // Wait for the view to be fully ready
            view.when(() => {
              setViewReady(true)
            }).catch(() => {
              setViewReady(true)
            })

            // Call onViewReady callback if provided
            if (onViewReady) {
              onViewReady(view)
            }

            // Nothing else here; an effect below will close the loader when both conditions are met

            view.on('click', async (event: any) => {
              try {
                const response = await view.hitTest(event)
                if (response.results.length > 0) {
                  const r0 = response.results.find((r: any) => r?.graphic?.layer && r?.graphic?.attributes) || response.results[0]
                  const graphic = r0.graphic
                  const layer: any = graphic?.layer
                  const attrs = graphic?.attributes || {}
                  const fields: Array<{ name: string }> = (layer as any)?.fields || []
                  const nameField = (fields.find(f => /^(basin_)?name$/i.test(f.name))
                    || fields.find(f => /basin.*name/i.test(f.name))
                    || fields.find(f => /^BASIN_NAME$/i.test(f.name))
                    || fields.find(f => /^Basin_Name$/i.test(f.name))
                    || fields.find(f => /^basin_name$/i.test(f.name))
                    || fields.find(f => /^Basin$/i.test(f.name))
                    || fields.find(f => /^BASIN$/i.test(f.name))
                    || fields.find(f => /name/i.test(f.name)))?.name
                  const raw = nameField ? (attrs as any)[nameField] : undefined
                  // If this blocks layer doesn't have the tier renderer yet, apply it now (field-based, not expression)
                  try {
                    const titleStr = String(layer?.title || '')
                    const isBlocks = /Basins|Blocks|Basin/i.test(titleStr)
                    const existingR: any = (layer as any).renderer
                    const isAlreadyFieldBased = existingR && existingR.type === 'unique-value' && existingR.field === nameField
                    if (isBlocks && !isAlreadyFieldBased && tierByBasin) {
                      const normFn = (s: string) => (s || '')
                        .toLowerCase()
                        .normalize('NFKC')
                        .replace(/\([^)]*\)/g, '')
                        .replace(/[^a-z0-9\s&]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                      const baseFn = (s: string) => {
                        let n = s || ''
                        const idxs = [n.indexOf(','), n.indexOf('~'), n.indexOf('/')]
                        const cut = idxs.filter(i => i > -1).reduce((m, i) => (m === -1 ? i : Math.min(m, i)), -1)
                        if (cut > -1) n = n.substring(0, cut)
                        n = n.replace(/\b[Bb]asin\b/g, ' ')
                        n = n.replace(/[-_]/g, ' ')
                        return normFn(n)
                      }
                      const tierBaseMap: Record<string, number> = {}
                      Object.entries(tierByBasin).forEach(([k, v]) => {
                        const n = baseFn(k)
                        if (n) tierBaseMap[n] = Number(v)
                      })

                      // Alias helper for known mismatches (GeoJSON name -> Table name base)
                      const resolveAlias = (n: string) => {
                        if (n === 'penyu') return 'penyu west natuna'
                        if (n === 'south sumatra') return 's sumatra'
                        if (n === 'central sumatra') return 'c sumatra'
                        if (n === 'north sumatra') return 'n sumatra'
                        if (n === 'gulf of thailand') return 'gulf of thailand'
                        return n
                      }
                      const colorForTier = (t?: number): any => {
                        const a = 0.45
                        if (t === 1) return [126, 193, 41, a]    // #7ec129 (T1)
                        if (t === 2) return [74, 221, 202, a]    // #4ADDCA (T2)
                        if (t === 3) return [229, 216, 24, a]    // #e5d818 (T3)
                        if (t === 4) return [217, 92, 141, a]    // #d95c8d (T4)
                        return [130, 129, 130, 0.15]
                      }
                      const outlineColorForTier = (t?: number): any => {
                        if (t === 1) return [126, 193, 41, 1]
                        if (t === 2) return [74, 221, 202, 1]
                        if (t === 3) return [229, 216, 24, 1]
                        if (t === 4) return [217, 92, 141, 1]
                        return [130, 129, 130, 1]
                      }
                      const q = (layer as any).createQuery()
                      q.where = '1=1'
                      q.returnGeometry = false
                      q.outFields = [nameField]
                        ; (layer as any).queryFeatures(q).then((qres: any) => {
                          const uvis: Array<{ value: string; symbol: any }> = (qres.features || [])
                            .map((f: any) => String(f.attributes?.[nameField]))
                            .filter((v: string) => !!v)
                            .reduce((acc: Array<{ value: string; symbol: any }>, rawName: string) => {
                              const base = baseFn(rawName)
                              const resolved = resolveAlias(base)
                              const t = tierBaseMap[resolved] || tierBaseMap[base]
                              if (t > 0) acc.push({
                                value: rawName,
                                symbol: { type: 'simple-fill', color: colorForTier(Number(t)), outline: { color: outlineColorForTier(Number(t)), width: 1.5 } }
                              })
                              return acc
                            }, [])
                            ; (layer as any).renderer = {
                              type: 'unique-value',
                              field: nameField,
                              defaultSymbol: { type: 'simple-fill', color: [0, 0, 0, 0], outline: { color: '#828182', width: 1 } },
                              uniqueValueInfos: uvis
                            }
                            ; (layer as any).__tierValueSet = new Set<string>(uvis.map((u: { value: string }) => u.value))
                          try { (layer as any).refresh?.() } catch { }
                          console.log('[GEB] applied tier renderer on click (field-based)', { layer: layer?.title, uniqueValues: uvis.length })
                        }).catch(() => { })
                    }
                  } catch { }
                  const norm = (s: string) => (s || '')
                    .toLowerCase()
                    .normalize('NFKC')
                    .replace(/\([^)]*\)/g, '')
                    .replace(/[^a-z0-9\s&]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                  const baseNorm = (s: string) => {
                    let n = s || ''
                    const idxs = [n.indexOf(','), n.indexOf('~'), n.indexOf('/')]
                    const cut = idxs.filter(i => i > -1).reduce((m, i) => (m === -1 ? i : Math.min(m, i)), -1)
                    if (cut > -1) n = n.substring(0, cut)
                    n = n.replace(/\b[Bb]asin\b/g, ' ')
                    n = n.replace(/[-_]/g, ' ')
                    return norm(n)
                  }
                  const nn = typeof raw === 'string' ? norm(raw) : undefined
                  const bn = typeof raw === 'string' ? baseNorm(raw) : undefined
                  const tNorm = (tierByBasin && nn) ? (tierByBasin as any)[nn] || (tierByBasin as any)[raw as any] : undefined
                  const tBase = (tierByBasin && bn) ? (tierByBasin as any)[bn] : undefined
                  const hasTierValue = !!(layer as any).__tierValueSet && raw ? (layer as any).__tierValueSet.has(raw) : undefined
                  console.log('[GEB click]', {
                    layerTitle: layer?.title,
                    nameField,
                    rawName: raw,
                    normalized: nn,
                    baseNormalized: bn,
                    inRendererValues: hasTierValue,
                    tierFromNorm: tNorm,
                    tierFromBase: tBase
                  })
                  // Temporary solid-fill test: force a red simple-fill renderer briefly, then revert
                  // Red blinking debug code removed

                  // If not present in renderer values, try to inject it dynamically
                  try {
                    if (raw && (hasTierValue === false || hasTierValue === undefined) && tierByBasin) {
                      const resolveTier = (): number | undefined => {
                        for (const [k, v] of Object.entries(tierByBasin)) {
                          let n = (k || '') as string
                          const idxs = [n.indexOf(','), n.indexOf('~'), n.indexOf('/')]
                          const cut = idxs.filter(i => i > -1).reduce((m, i) => (m === -1 ? i : Math.min(m, i)), -1)
                          if (cut > -1) n = n.substring(0, cut)
                          n = n.replace(/\b[Bb]asin\b/g, ' ')
                          n = n.replace(/[-_]/g, ' ')
                          n = n.toLowerCase().normalize('NFKC').replace(/\([^)]*\)/g, '').replace(/[^a-z0-9\s&]/g, ' ').replace(/\s+/g, ' ').trim()
                          n = n.toLowerCase().normalize('NFKC').replace(/\([^)]*\)/g, '').replace(/[^a-z0-9\s&]/g, ' ').replace(/\s+/g, ' ').trim()

                          // Check aliases
                          const alias = (name: string) => {
                            if (name === 'penyu') return 'penyu west natuna'
                            if (name === 'south sumatra') return 's sumatra'
                            if (name === 'central sumatra') return 'c sumatra'
                            if (name === 'north sumatra') return 'n sumatra'
                            return name
                          }

                          if (bn && (n === bn || alias(bn) === n)) return Number(v)
                        }
                        return undefined
                      }
                      const tierVal = resolveTier()
                      if (tierVal && (layer as any).renderer && (layer as any).renderer.type === 'unique-value') {
                        const colorForTier = (t?: number): any => {
                          const a = 0.45
                          if (t === 1) return [126, 193, 41, a]
                          if (t === 2) return [74, 221, 202, a]
                          if (t === 3) return [229, 216, 24, a]
                          if (t === 4) return [217, 92, 141, a]
                          return [130, 129, 130, 0.15]
                        }
                        const outlineColorForTier = (t?: number): any => {
                          if (t === 1) return [126, 193, 41, 1]
                          if (t === 2) return [74, 221, 202, 1]
                          if (t === 3) return [229, 216, 24, 1]
                          if (t === 4) return [217, 92, 141, 1]
                          return [130, 129, 130, 1]
                        }
                        const r = (layer as any).renderer
                        r.uniqueValueInfos = (r.uniqueValueInfos || []).concat([
                          { value: String(raw), symbol: { type: 'simple-fill', color: colorForTier(tierVal), outline: { color: outlineColorForTier(tierVal), width: 1.5 } } }
                        ])
                          ; (layer as any).__tierValueSet = (layer as any).__tierValueSet || new Set<string>()
                          ; (layer as any).__tierValueSet.add(String(raw))
                          ; (layer as any).renderer = r
                        try { (layer as any).refresh?.() } catch { }
                        console.log('[GEB] injected tier color for raw value', { layer: layer?.title, value: raw, tier: tierVal })
                      }
                    }
                  } catch { }
                  if (onFeatureClick && attrs) onFeatureClick(attrs)
                }
              } catch (err) {
                console.warn('Click handler error:', err)
              }
            })
          })
      })
      .catch((e) => setError(e?.message ?? "Failed to load ArcGIS"))

    return () => {
      canceled = true
      try {
        // Cleanup observers and listeners, then destroy view
        const v: any = viewRef.current
        try { v?.__resizeObserver?.disconnect?.() } catch { }
        try { if (v?.__onVis) document.removeEventListener('visibilitychange', v.__onVis) } catch { }
        v?.destroy?.()
      } catch { }
      viewRef.current = null
    }
  }, [basemap, basemapPortalItemId, center?.[0], center?.[1], zoom, JSON.stringify(geojsonLayers), uiTheme])

  // Apply allowedBasins filtering to 'blocks' layers (GeoJSONLayer definitionExpression)
  useEffect(() => {
    if (!Array.isArray(allowedBasins)) return
    if (!viewRef.current || layersRef.current.length === 0) return

    const names = Array.from(new Set(allowedBasins.map(n => (n || '').toString().trim()).filter(Boolean)))
    const normalize = (s: string) => s
      .toLowerCase()
      .normalize('NFKC')
      .replace(/\([^)]*\)/g, '') // drop parenthetical qualifiers
      .replace(/[^a-z0-9\s&]/g, ' ') // drop punctuation but keep &
      .replace(/\s+/g, ' ')
      .trim()
    const baseNormalize = (s: string) => {
      let n = s || ''
      const idxs = [n.indexOf(','), n.indexOf('~'), n.indexOf('/')] // first delimiter
      const cut = idxs.filter(i => i > -1).reduce((m, i) => (m === -1 ? i : Math.min(m, i)), -1)
      if (cut > -1) n = n.substring(0, cut)
      n = n.replace(/\b[Bb]asin\b/g, ' ')
      n = n.replace(/[-_]/g, ' ')
      return normalize(n)
    }
    const aliasBase = (b: string) => {
      const m = (b || '').toLowerCase().trim()
      if (m === 'south sumatra') return 's sumatra'
      if (m === 'central sumatra') return 'c sumatra'
      if (m === 'north sumatra') return 'n sumatra'
      if (m === 'south caspian') return 's caspian'
      if (m === 'pre caspian') return 'precaspian'
      if (m === 'penyu') return 'penyu west natuna'
      if (m === 'malay basin') return 'malay' // safety; usually baseNormalize already strips
      if (m === 'gulf of thailand basin') return 'gulf of thailand'
      return m
    }
    const allowedNorm = new Set(names.map(normalize))
    const allowedBase = new Set(names.map(baseNormalize))
    // Chunk to avoid overly long expressions
    const chunkSize = 80

    // Prepare normalized tier map for renderer
    const tierNormMap: Record<string, number> = {}
    if (tierByBasin) {
      Object.entries(tierByBasin).forEach(([k, v]) => {
        const n = normalize(k)
        if (n) tierNormMap[n] = Number(v)
      })
    }
    const tierBaseMap: Record<string, number> = {}
    if (tierByBasin) {
      Object.entries(tierByBasin).forEach(([k, v]) => {
        const n = baseNormalize(k)
        if (n) tierBaseMap[n] = Number(v)
      })
    }

    layersRef.current.forEach((layer: any) => {
      try {
        const title: string = layer.title || ''
        const isBlocks = /Basins|Blocks|Basin/i.test(title) || (layer.renderer?.symbol?.type === 'picture-fill')
        if (!isBlocks) return

        // Determine actual name field present on this layer
        const fields: Array<{ name: string }> = (layer as any).fields || []
        const nameField = (fields.find(f => /^(basin_)?name$/i.test(f.name))
          || fields.find(f => /basin.*name/i.test(f.name))
          || fields.find(f => /^BASIN_NAME$/i.test(f.name))
          || fields.find(f => /^Basin_Name$/i.test(f.name))
          || fields.find(f => /^basin_name$/i.test(f.name))
          || fields.find(f => /^Basin$/i.test(f.name))
          || fields.find(f => /^BASIN$/i.test(f.name))
          || fields.find(f => /name/i.test(f.name)))?.name

        if (!nameField) {
          // If unknown, do nothing for this layer
          return
        }

        // Helper to merge definition expressions safely
        const applyCombinedDef = (ly: any) => {
          const nameExpr = (ly as any).__nameFilterExpr as string | undefined
          const areaExpr = (ly as any).__areaFilterExpr as string | undefined
          const expr = [nameExpr, areaExpr].filter(Boolean).join(' AND ')
            ; (ly as any).definitionExpression = expr || undefined
        }

        if (names.length === 0) {
          ; (layer as any).__nameFilterExpr = '1=0'
          applyCombinedDef(layer)
          try { (layer as any).refresh?.() } catch { }
          // do not return; still apply renderer below so coloring works for diagnostics
        }

        // Query existing names from this layer, then intersect by normalized form
        const query = (layer as any).createQuery()
        query.where = '1=1'
        query.returnGeometry = false
        query.outFields = [nameField]
          ; (layer as any).queryFeatures(query).then((res: any) => {
            const seen = new Set<string>()
            const matched: string[] = []
            res.features?.forEach((f: any) => {
              const rawName = f.attributes?.[nameField]
              if (!rawName || seen.has(rawName)) return
              seen.add(rawName)
              const n = normalize(String(rawName))
              const bn = baseNormalize(String(rawName))
              const ab = aliasBase(bn)
              if (allowedNorm.has(n) || allowedBase.has(bn) || allowedBase.has(ab)) matched.push(String(rawName))
            })

            if (matched.length === 0) {
              ; (layer as any).__nameFilterExpr = '1=0'
              applyCombinedDef(layer)
              // do not return; still apply renderer
            }

            const parts: string[] = []
            for (let i = 0; i < matched.length; i += chunkSize) {
              const batch = matched.slice(i, i + chunkSize)
              const list = batch.map(v => `'${v.replace(/'/g, "''")}'`).join(',')
              parts.push(`${nameField} IN (${list})`)
            }
            ; (layer as any).__nameFilterExpr = parts.join(' OR ')
            applyCombinedDef(layer)
            try { (layer as any).refresh?.() } catch { }

            // Apply tier-based coloring via unique-value renderer using the actual name field
            if (Object.keys(tierNormMap).length > 0) {
              const colorForTier = (t?: number): any => {
                const alpha = 0.45
                if (t === 1) return [126, 193, 41, alpha]   // #7ec129 (T1)
                if (t === 2) return [74, 221, 202, alpha]   // #4ADDCA (T2)
                if (t === 3) return [229, 216, 24, alpha]   // #e5d818 (T3)
                if (t === 4) return [217, 92, 141, alpha]   // #d95c8d (T4)
                return [130, 129, 130, 0.15]
              }
              const outlineColorForTier = (t?: number): any => {
                if (t === 1) return [126, 193, 41, 1]
                if (t === 2) return [74, 221, 202, 1]
                if (t === 3) return [229, 216, 24, 1]
                if (t === 4) return [217, 92, 141, 1]
                return [130, 129, 130, 1]
              }
              // Build unique values from this layer's actual feature names
              const uvis: Array<{ value: string; symbol: any }> = (res.features || [])
                .map((f: any) => String(f.attributes?.[nameField]))
                .filter((v: string) => !!v)
                .reduce((acc: Array<{ value: string; symbol: any }>, raw: string) => {
                  const base = baseNormalize(raw)
                  const ab = aliasBase(base)
                  const t = tierBaseMap[ab] ?? tierNormMap[normalize(raw)] ?? tierBaseMap[base]
                  if (t > 0) acc.push({
                    value: raw,
                    symbol: { type: 'simple-fill', color: colorForTier(Number(t)), outline: { color: outlineColorForTier(Number(t)), width: 1.5 } }
                  })
                  return acc
                }, [])

              // Build definition expression to only show basins with tier data
              const tierBasinNames = uvis.map(u => u.value)
              if (tierBasinNames.length > 0) {
                const tierParts: string[] = []
                const chunkSize = 100
                for (let i = 0; i < tierBasinNames.length; i += chunkSize) {
                  const batch = tierBasinNames.slice(i, i + chunkSize)
                  const list = batch.map(v => `'${v.replace(/'/g, "''")}'`).join(',')
                  tierParts.push(`${nameField} IN (${list})`)
                }
                ; (layer as any).__nameFilterExpr = tierParts.join(' OR ')
                applyCombinedDef(layer)
              }

              try {
                ; (layer as any).renderer = {
                  type: 'unique-value',
                  field: nameField,
                  defaultSymbol: {
                    type: 'simple-fill',
                    color: [0, 0, 0, 0],  // Fully transparent - hide unlinked basins
                    outline: { color: [0, 0, 0, 0], width: 0 }
                  },
                  uniqueValueInfos: uvis
                }
                  ; (layer as any).opacity = 1
                  ; (layer as any).blendMode = 'normal'
                  ; (layer as any).__tierValueSet = new Set(uvis.map(u => u.value))
                try { console.log('[GEB] applied tier renderer', { layer: layer.title, uniqueValues: uvis.length, tierBasins: tierBasinNames.length }) } catch { }
                try { (layer as any).refresh?.() } catch { }
              } catch { }
            }
          }).catch(() => {
            // Fallback: hide if we can't query
            ; (layer as any).__nameFilterExpr = '1=0'
            applyCombinedDef(layer)
            try { (layer as any).refresh?.() } catch { }
          })
      } catch { }
    })
  }, [allowedBasins, tierByBasin, viewReady])

  // Close loading overlay when BOTH conditions are met
  useEffect(() => {
    if (viewReady) setProgress(100)
    if (viewReady && minLoadTimePassed) setIsLoading(false)
  }, [viewReady, minLoadTimePassed])

  // Safety timeout: if view not ready after 12s, continue and show a note
  useEffect(() => {
    if (!isLoading) return
    const t = setTimeout(() => {
      if (!viewReady) {
        setSlowNote('Map is taking longer than usual to initialize...')
        // Allow the UI to proceed to avoid indefinite loader
        setIsLoading(false)
      }
    }, 12000)
    return () => clearTimeout(t)
  }, [isLoading, viewReady])

  // Handle basin highlighting
  useEffect(() => {
    if (!viewRef.current || !highlightBasinName || layersRef.current.length === 0) return

    const view = viewRef.current
    const normalizeBasinName = (name: string) => name.toLowerCase().trim().replace(/\s+/g, ' ')
    const targetName = normalizeBasinName(highlightBasinName)

    // Helper: derive tier for a basin name using the same normalization as elsewhere
    const getTierForName = (rawName: string | undefined): number | undefined => {
      if (!tierByBasin || !rawName) return undefined
      const norm = (s: string) => (s || '')
        .toLowerCase()
        .normalize('NFKC')
        .replace(/\([^)]*\)/g, '')
        .replace(/[^a-z0-9\s&]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      const baseNorm = (s: string) => {
        let n = s || ''
        const idxs = [n.indexOf(','), n.indexOf('~'), n.indexOf('/')]
        const cut = idxs.filter(i => i > -1).reduce((m, i) => (m === -1 ? i : Math.min(m, i)), -1)
        if (cut > -1) n = n.substring(0, cut)
        n = n.replace(/\b[Bb]asin\b/g, ' ')
        n = n.replace(/[-_]/g, ' ')
        return norm(n)
      }
      const alias = (n: string) => {
        if (n === 'penyu') return 'penyu west natuna'
        if (n === 'south sumatra') return 's sumatra'
        if (n === 'central sumatra') return 'c sumatra'
        if (n === 'north sumatra') return 'n sumatra'
        if (n === 'gulf of thailand') return 'gulf of thailand'
        return n
      }
      const nn = norm(rawName)
      const bn = baseNorm(rawName)
      const aliased = alias(bn)
      const direct = (tierByBasin as any)[nn] ?? (tierByBasin as any)[rawName]
      const fromBase = (tierByBasin as any)[bn] ?? (tierByBasin as any)[aliased]
      const t = direct ?? fromBase
      return typeof t === 'number' ? t : undefined
    }

    const colorForTier = (t?: number): any => {
      const a = 0.45
      if (t === 1) return [126, 193, 41, a]
      if (t === 2) return [74, 221, 202, a]
      if (t === 3) return [229, 216, 24, a]
      if (t === 4) return [217, 92, 141, a]
      return [130, 129, 130, 0.45]
    }

    const outlineColorForTier = (t?: number): any => {
      if (t === 1) return [126, 193, 41, 1]
      if (t === 2) return [74, 221, 202, 1]
      if (t === 3) return [229, 216, 24, 1]
      if (t === 4) return [217, 92, 141, 1]
      return [130, 129, 130, 1]
    }

    // Query all layers for matching basin
    layersRef.current.forEach(async (layer: any) => {
      try {
        if (!layer.queryFeatures) return

        const query = layer.createQuery()
        query.where = '1=1'
        query.outFields = ['*']
        query.returnGeometry = true

        const results = await layer.queryFeatures(query)

        // Find matching feature by basin_name
        const matchingFeature = results.features.find((feature: any) => {
          const basinName = feature.attributes?.basin_name || feature.attributes?.BASIN_NAME || feature.attributes?.Basin_Name
          if (!basinName) return false
          return normalizeBasinName(basinName).includes(targetName) || targetName.includes(normalizeBasinName(basinName))
        })

        if (matchingFeature) {
          console.log('Found matching basin feature:', matchingFeature.attributes)

          // Zoom to the feature with padding (basin takes ~70% of viewport)
          if (matchingFeature.geometry) {
            // Calculate 15% padding on each side
            const viewWidth = view.width || 800
            const viewHeight = view.height || 600
            const paddingPx = {
              left: viewWidth * 0.15,
              right: viewWidth * 0.15,
              top: viewHeight * 0.15,
              bottom: viewHeight * 0.15
            }

            view.goTo({
              target: matchingFeature.geometry
            }, {
              duration: 1000,
              easing: 'ease-in-out',
              padding: paddingPx
            }).catch((err: any) => console.warn('GoTo error:', err))
          }

          // Add highlight using tier fill color (with a soft shadow) instead of flat gray
          ; (window as any).require(['esri/Graphic', 'esri/geometry/Polygon'], (Graphic: any, Polygon: any) => {
            try {
              view.graphics.removeAll()
              const geom: any = matchingFeature.geometry
              const basinName = matchingFeature.attributes?.basin_name || matchingFeature.attributes?.BASIN_NAME || matchingFeature.attributes?.Basin_Name
              const tier = getTierForName(typeof basinName === 'string' ? basinName : undefined)
              const fillColor = colorForTier(tier)
              const outlineColor = outlineColorForTier(tier)
              // Compute map-space delta for a 4x5 pixel screen offset at the geometry's center
              const center = geom.extent ? geom.extent.center : view.extent.center
              const screenPt = view.toScreen(center)
              const shiftedScreenPt = { x: screenPt.x + 4, y: screenPt.y + 5 }
              const shiftedMapPt = view.toMap(shiftedScreenPt)
              const dx = shiftedMapPt.x - center.x
              const dy = shiftedMapPt.y - center.y

              // Translate polygon rings by (dx, dy)
              let shiftedGeom = geom
              try {
                if (geom.type === 'polygon' && Array.isArray(geom.rings)) {
                  const newRings = geom.rings.map((ring: any[]) => ring.map((coord: any) => [coord[0] + dx, coord[1] + dy]))
                  shiftedGeom = new Polygon({ rings: newRings, spatialReference: geom.spatialReference })
                }
              } catch { }

              // Shadow graphic (drawn first) – same hue, slightly darker
              const shadowGraphic = new Graphic({
                geometry: shiftedGeom,
                symbol: {
                  type: 'simple-fill',
                  color: outlineColor,
                  outline: { color: outlineColor, width: 2 }
                }
              })

              // Main highlight graphic
              const highlightGraphic = new Graphic({
                geometry: geom,
                symbol: {
                  type: 'simple-fill',
                  color: fillColor,
                  outline: { color: outlineColor, width: 2.5 }
                }
              })
              view.graphics.addMany([shadowGraphic, highlightGraphic])
            } catch (e) {
              console.warn('Highlight/shadow rendering error:', e)
            }
          })
        }
      } catch (err) {
        console.warn('Error querying layer for basin:', err)
      }
    })
  }, [highlightBasinName])

  return (
    <div className={className} style={{ width: "100%", height: "100%", position: "relative", ...style }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Loading overlay with Rive animation */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
          <div className="flex flex-col items-center gap-4">
            {riveAvailable ? (
              <div style={{ width: 200, height: 200 }}>
                <RiveComponent />
              </div>
            ) : (
              <div className="flex items-center justify-center" style={{ width: 80, height: 80 }}>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary" />
              </div>
            )}
            <p className="text-sm text-muted-foreground">Loading map... {progress}%</p>
          </div>
        </div>
      )}

      {/* Slow init note */}
      {!isLoading && slowNote && (
        <div className="absolute top-3 right-3 z-40 bg-card/90 text-muted-foreground border border-border/50 rounded px-3 py-1 text-xs shadow">
          {slowNote}
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm z-50">
          ArcGIS error: {error}
        </div>
      ) : null}
    </div>
  )
}
