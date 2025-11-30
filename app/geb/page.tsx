"use client"

import type React from "react"
import { useRef, useState, useEffect, useMemo, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, Maximize2, Minimize2, ChevronUp, ChevronDown, Download, Info, Search, X } from "lucide-react"
import { useTheme } from "next-themes"

// Use ArcGIS JS API viewer just for GEB
import dynamic from "next/dynamic"
const ArcGISViewer = dynamic(() => import("@/components/map/arcgis-viewer"), { ssr: false })
// TODO: Re-enable these components when dashboard-echarts is created
// import { TernaryChart } from "../dashboard-echarts/components/ternary-chart"
// import { ScatterChart } from "../dashboard-echarts/components/scatter-chart"
// import { FilterSidebar } from "../dashboard-echarts/components/filter-sidebar"

export function GEBPageInner() {
  const [leftWidth, setLeftWidth] = useState(35)
  const [isDragging, setIsDragging] = useState(false)
  // Layout: fixed pixel table height with draggable divider
  const [tableHeight, setTableHeight] = useState(248) // px
  const [isDraggingVertical, setIsDraggingVertical] = useState(false)
  const [basinRankingData, setBasinRankingData] = useState<any>(null)
  const [combinedScoringData, setCombinedScoringData] = useState<any>(null)
  const [ytfData, setYtfData] = useState<any>(null)
  const [selectedBasinName, setSelectedBasinName] = useState<string | null>(null)
  const [tableSearch, setTableSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [activeTab, setActiveTab] = useState<'combined' | 'scoreYtf'>('combined')
  const [sortBy, setSortBy] = useState<'basin' | 'country' | 'region' | 'tier' | 'geo' | 'agr' | 'ytf'>('basin')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const { resolvedTheme } = useTheme()
  const basemap = resolvedTheme === "dark" ? "dark-gray" : "oceans"
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true)
  const [isTableFullscreen, setIsTableFullscreen] = useState(false)
  useEffect(() => { setIsFilterCollapsed(true) }, [])
  const tableSectionRef = useRef<HTMLDivElement>(null)
  const tableContentRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [topPanelMode, setTopPanelMode] = useState<'chart' | 'map'>('chart')
  const [isTabletTableExpanded, setIsTabletTableExpanded] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  const toggleTableFullscreen = () => {
    setIsTableFullscreen(prev => !prev)
  }

  useEffect(() => {
    const t = (searchParams?.get('top') || '').toLowerCase()
    if (t === 'map' || t === 'chart') setTopPanelMode(t as 'chart' | 'map')
  }, [searchParams])

  useEffect(() => {
    if (typeof window !== 'undefined') requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
  }, [topPanelMode, isTabletTableExpanded])

  const filteredBasins = useMemo(() => {
    const items = (combinedScoringData?.basins || []) as any[]
    if (!tableSearch) return items
    const q = tableSearch.toLowerCase().trim()
    return items.filter((b: any) => (b['Basin Name'] || '').toLowerCase().includes(q))
  }, [combinedScoringData, tableSearch])

  const allowedBasins = useMemo(() => {
    try {
      return filteredBasins.map((b: any) => (b['Basin Name'] || '').toString()).filter(Boolean)
    } catch {
      return [] as string[]
    }
  }, [filteredBasins])

  const tierByBasin = useMemo(() => {
    const map: Record<string, number> = {}
    try {
      const all = (combinedScoringData?.basins || combinedScoringData?.data || []) as any[]
      for (const b of all) {
        const name = (b['Basin Name'] || b.basinName || '').toString().trim()
        let t = b['TIER'] ?? b['Tier'] ?? b['tier'] ?? b.tier ?? ''
        if (typeof t === 'string') {
          const m = t.match(/(\d+)/)
          if (m) t = Number(m[1])
        }
        const tn = Number(t)
        if (name && tn > 0) map[name] = tn
      }
    } catch { }
    return map
  }, [combinedScoringData])

  const ytfLookup = useMemo(() => {
    const map = new Map<string, number>()
    if (!ytfData?.basins) return map
    const normalize = (s: string) => s?.toLowerCase().trim()
    for (const b of ytfData.basins) {
      map.set(normalize(b.basinName), Number(b.ytf) || 0)
    }
    return map
  }, [ytfData])

  const sortedBasins = useMemo(() => {
    const arr = [...filteredBasins]
    const norm = (s: any) => (s ?? '').toString().toLowerCase()
    const num = (v: any) => {
      const n = Number(v)
      return isNaN(n) ? -Infinity : n
    }
    arr.sort((a: any, b: any) => {
      let cmp = 0
      if (sortBy === 'basin') cmp = norm(a['Basin Name']).localeCompare(norm(b['Basin Name']))
      else if (sortBy === 'country') cmp = norm(a['Country Name']).localeCompare(norm(b['Country Name']))
      else if (sortBy === 'region') cmp = norm(a['Region']).localeCompare(norm(b['Region']))
      else if (sortBy === 'tier') cmp = num(a['TIER']) - num(b['TIER'])
      else if (sortBy === 'geo') cmp = num(a['GEOLOGICAL             SCORE                                 (out of 20)']) - num(b['GEOLOGICAL             SCORE                                 (out of 20)'])
      else if (sortBy === 'agr') cmp = num(a['ABOVE GROUND SCORE              (out of 20)']) - num(b['ABOVE GROUND SCORE              (out of 20)'])
      else if (sortBy === 'ytf') {
        const na = ytfLookup.get(norm(a['Basin Name'])) || 0
        const nb = ytfLookup.get(norm(b['Basin Name'])) || 0
        cmp = na - nb
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filteredBasins, sortBy, sortDir, ytfLookup])

  useEffect(() => { setCurrentPage(1) }, [tableSearch])

  const totalEntries = filteredBasins.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize))
  const pageStart = (currentPage - 1) * pageSize
  const pageEnd = Math.min(pageStart + pageSize, totalEntries)
  const paginatedBasins = useMemo(() => sortedBasins.slice(pageStart, pageEnd), [sortedBasins, pageStart, pageEnd])

  const SortButton = ({ label, column }: { label: string; column: typeof sortBy }) => {
    const active = sortBy === column
    const upClass = `w-2.5 h-2.5 ${active && sortDir === 'asc' ? 'text-primary' : 'text-muted-foreground/60'}`
    const downClass = `w-2.5 h-2.5 ${active && sortDir === 'desc' ? 'text-primary' : 'text-muted-foreground/60'}`
    return (
      <button
        className="flex items-center gap-1 hover:underline"
        onClick={() => {
          setCurrentPage(1)
          setSortBy((prev) => (prev === column ? prev : column))
          setSortDir((prev) => (sortBy === column ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'))
        }}
        title={`Sort by ${label}`}
      >
        <span className="font-medium">{label}</span>
        <span className="flex flex-col leading-none -ml-0.5">
          <ChevronUp className={upClass} />
          <ChevronDown className={downClass + ' -mt-0.5'} />
        </span>
      </button>
    )
  }

  // Load basin ranking data
  useEffect(() => {
    fetch('/data/basin-ranking.json')
      .then(res => res.json())
      .then(data => setBasinRankingData(data))
      .catch(err => console.error('Failed to load basin ranking data:', err))

    fetch('/data/basin-combined-scoring.json')
      .then(res => res.json())
      .then(data => setCombinedScoringData(data))
      .catch(err => console.error('Failed to load combined scoring data:', err))

    fetch('/data/basin-ytf-scoring.json')
      .then(res => res.json())
      .then(data => setYtfData(data))
      .catch(err => console.error('Failed to load YTF data:', err))
  }, [])

  // Fuzzy match basin names (shapefile vs XLSX)
  const findBasinData = (shapefileName: string) => {
    if (!basinRankingData || !shapefileName) return null

    const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ')
    const normalized = normalize(shapefileName)

    // Exact match first
    if (basinRankingData.lookup[shapefileName]) {
      return basinRankingData.lookup[shapefileName]
    }

    const alias = (s: string) => {
      if (s === 'penyu') return 'penyu-west natuna'
      if (s === 'south sumatra') return 's sumatra'
      if (s === 'central sumatra') return 'c sumatra'
      if (s === 'north sumatra') return 'n sumatra'
      if (s === 'south caspian') return 's caspian'
      if (s === 'pre caspian') return 'precaspian'
      if (s === 'gulf of thailand') return 'gulf of thailand'
      return s
    }
    const aliased = alias(normalized)

    // Check aliased name against lookup keys
    for (const [xlsxName, data] of Object.entries(basinRankingData.lookup)) {
      const xlsxNorm = normalize(xlsxName as string)
      if (aliased === xlsxNorm) return data
    }

    // Fuzzy match: check if shapefile name contains or is contained in XLSX name
    for (const [xlsxName, data] of Object.entries(basinRankingData.lookup)) {
      const xlsxNorm = normalize(xlsxName as string)
      if (normalized === xlsxNorm) return data
      if (normalized.includes(xlsxNorm) || xlsxNorm.includes(normalized)) {
        return data
      }
    }

    return null
  }

  const handleFeatureClick = (attributes: Record<string, any>) => {
    console.log('Clicked basin:', attributes)
    const basinName = attributes.basin_name || attributes.BASIN_NAME || attributes.NAME
    if (basinName) {
      const basinData = findBasinData(basinName)
      if (basinData) {
        console.log('Matched basin data:', basinData)
        const resolvedName = basinData['Basin Name'] || basinName
        setSelectedBasinName(resolvedName)
        setTableSearch(resolvedName) // Update table search to reflect the basin
      } else {
        console.warn('No ranking data found for basin:', basinName)
        setSelectedBasinName(null)
      }
    }
  }

  const handleBasinSelectFromChart = (basinName: string) => {
    console.log('Basin selected from chart:', basinName)
    setSelectedBasinName(basinName)
  }

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0
    if (!viewportWidth) return
    const newWidth = (e.clientX / viewportWidth) * 100
    // Keep left panel between 25% and 50%
    if (newWidth > 25 && newWidth < 50) setLeftWidth(newWidth)
  }
  const handleMouseUp = () => setIsDragging(false)

  // Vertical drag handlers for charts/table split (drag handle above the table)
  useEffect(() => {
    const handleVerticalMouseMove = (e: MouseEvent) => {
      if (!isDraggingVertical) return
      const rightPanel = document.getElementById('right-panel-content')
      if (!rightPanel) return
      const rect = rightPanel.getBoundingClientRect()
      // distance from cursor to bottom of right panel becomes table height
      const rawTable = rect.bottom - e.clientY
      // clamp: min 180px, max (right panel height - 120px for chart min)
      const clamped = Math.max(180, Math.min(rect.height - 120, rawTable))
      setTableHeight(clamped)
      if (typeof window !== 'undefined') requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
    }
    const handleVerticalMouseUp = () => setIsDraggingVertical(false)
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingVertical) return
      const rightPanel = document.getElementById('right-panel-content')
      if (!rightPanel) return
      const rect = rightPanel.getBoundingClientRect()
      const y = e.touches[0]?.clientY ?? 0
      const rawTable = rect.bottom - y
      const clamped = Math.max(180, Math.min(rect.height - 120, rawTable))
      setTableHeight(clamped)
    }
    const handleTouchEnd = () => setIsDraggingVertical(false)
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingVertical) return
      const rightPanel = document.getElementById('right-panel-content')
      if (!rightPanel) return
      const rect = rightPanel.getBoundingClientRect()
      const rawTable = rect.bottom - e.clientY
      const clamped = Math.max(180, Math.min(rect.height - 120, rawTable))
      setTableHeight(clamped)
    }
    const handlePointerUp = () => setIsDraggingVertical(false)
    if (isDraggingVertical) {
      window.addEventListener('mousemove', handleVerticalMouseMove)
      window.addEventListener('mouseup', handleVerticalMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: true })
      window.addEventListener('touchend', handleTouchEnd)
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      document.body.classList.add('cursor-row-resize')
      document.body.style.userSelect = 'none'
    }
    return () => {
      window.removeEventListener('mousemove', handleVerticalMouseMove)
      window.removeEventListener('mouseup', handleVerticalMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      document.body.classList.remove('cursor-row-resize')
      document.body.style.userSelect = ''
    }
  }, [isDraggingVertical])

  const startVerticalDragMouse = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIsDraggingVertical(true)
  }
  const startVerticalDragTouch = (e: React.TouchEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIsDraggingVertical(true)
  }
  const startVerticalDragPointer = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation()
      ; (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
    setIsDraggingVertical(true)
  }

  // Keep table height fixed; content fills the container via flex-1 scroll area and sticky footer

  const renderTable = () => (
    <div ref={tableSectionRef} className="min-w-0 bg-card h-full">
      <div ref={tableContentRef} className="flex flex-col h-full min-h-0">
        <div className="px-4 py-1 border-b border-border">
          {/* Mobile / tablet header: icon + expanding search */}
          <div className="flex lg:hidden flex-col">
            {isSearchExpanded ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  autoFocus
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  onBlur={() => setIsSearchExpanded(false)}
                  placeholder="Search"
                  className="flex-1 h-7 px-3 border border-input rounded-[4px] bg-background text-[12px]"
                />
                <button
                  type="button"
                  className="p-1.5 hover:bg-accent rounded"
                  onClick={() => { setIsSearchExpanded(false); setTableSearch("") }}
                  title="Clear search"
                >
                  <X className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-sm font-medium whitespace-nowrap truncate" title="Combined Ranking">Combined Ranking</h3>
                  <button
                    type="button"
                    className="p-1 rounded-full border border-border bg-muted/60 hover:bg-accent flex items-center justify-center"
                    title="Source: S&P 2024"
                  >
                    <Info className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 ml-3">
                  <button
                    type="button"
                    className="p-1.5 hover:bg-accent rounded"
                    onClick={() => setIsSearchExpanded(true)}
                    title="Search"
                  >
                    <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                  </button>
                  <button className="p-1.5 hover:bg-accent rounded" title="Download">
                    <Download className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                  </button>
                  <button className="inline-flex p-1.5 hover:bg-accent rounded" title={isTabletTableExpanded ? "Minimize" : "Maximize"} onClick={() => setIsTabletTableExpanded(v => !v)}>
                    {isTabletTableExpanded ? (
                      <Minimize2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                    ) : (
                      <Maximize2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop header: pill source + always-visible search field */}
          <div className="hidden lg:flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-medium whitespace-nowrap truncate" title="Combined Ranking">Combined Ranking</h3>
              <span className="inline-flex items-center px-2 py-[2px] rounded-full bg-muted text-[10px] text-muted-foreground whitespace-nowrap">
                Source: S&P 2024
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search"
                className="h-7 w-48 px-3 border border-input rounded-[4px] bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="p-1.5 hover:bg-accent rounded" title="Download">
                <Download className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
              </button>
              <button className="p-1.5 hover:bg-accent rounded" title={isTableFullscreen ? "Exit Fullscreen" : "Fullscreen"} onClick={toggleTableFullscreen}>
                {isTableFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                ) : (
                  <Maximize2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-scroll bg-card min-h-0">
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 z-30 bg-card">
              <tr className="border-b border-border">
                <th className="text-left p-2 font-medium text-foreground"><SortButton label="Basin" column="basin" /></th>
                <th className="text-left p-2 font-medium text-foreground"><SortButton label="Country" column="country" /></th>
                <th className="text-left p-2 font-medium text-foreground"><SortButton label="Region" column="region" /></th>
                <th className="text-left p-2 font-medium text-foreground">Classification</th>
                <th className="text-left p-2 font-medium text-foreground"><SortButton label="Tier" column="tier" /></th>
                <th className="text-left p-2 font-medium text-foreground"><SortButton label="Geological Score" column="geo" /></th>
                <th className="text-left p-2 font-medium text-foreground"><SortButton label="Above Ground Score" column="agr" /></th>
                <th className="text-left p-2 font-medium text-foreground"><SortButton label="Total YTF (MMboe)" column="ytf" /></th>
              </tr>
            </thead>
            <tbody>
              {paginatedBasins.map((basin: any, idx: number) => (
                <tr
                  key={`${basin.ID}-${pageStart + idx}`}
                  className={`${(pageStart + idx) % 2 === 0 ? "bg-table-stripe" : "bg-card"} hover:bg-accent/50 cursor-pointer`}
                  onClick={() => setSelectedBasinName(basin['Basin Name'])}
                >
                  <td className="p-2 text-primary font-medium whitespace-nowrap max-w-[180px] truncate">{basin['Basin Name']}</td>
                  <td className="p-2 text-primary whitespace-nowrap max-w-[140px] truncate">{basin['Country Name']}</td>
                  <td className="p-2 text-primary whitespace-nowrap max-w-[140px] truncate">{basin.Region}</td>
                  <td className="p-2 text-foreground">-</td>
                  <td className="p-2 text-foreground">{basin['TIER'] || '-'}</td>
                  <td className="p-2 text-foreground">{basin['GEOLOGICAL             SCORE                                 (out of 20)'] || '-'}</td>
                  <td className="p-2 text-foreground">{basin['ABOVE GROUND SCORE              (out of 20)'] || '-'}</td>
                  <td className="p-2 text-foreground font-medium">{
                    (() => {
                      if (!ytfData?.basins) return '-'
                      const normalize = (s: string) => s?.toLowerCase().trim()
                      const name = normalize(basin['Basin Name'])
                      const match = ytfData.basins.find((b: any) => normalize(b.basinName) === name)
                      return match ? match.ytf?.toLocaleString() : '-'
                    })()
                  }</td>
                </tr>
              )) || (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-muted-foreground">Loading basin data...</td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-[10px] select-none sticky bottom-0 bg-card">
          <div className="text-muted-foreground">
            {totalEntries > 0 ? (
              <>Showing {pageStart + 1} to {pageEnd} of {totalEntries} entries</>
            ) : (
              <>Showing 0 entries</>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              className="h-6 px-2 rounded hover:bg-accent disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              First
            </button>
            <button
              className="h-6 px-2 rounded hover:bg-accent disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((_, i) => {
              const pageNum = Math.max(1, currentPage - 3) + i
              if (pageNum > totalPages) return null
              const active = pageNum === currentPage
              return (
                <button
                  key={pageNum}
                  className={`h-6 w-6 rounded text-center ${active ? 'bg-accent' : 'hover:bg-accent'}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              className="h-6 px-2 rounded hover:bg-accent disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
            <button
              className="h-6 px-2 rounded hover:bg-accent disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const setTopParam = (mode: 'chart' | 'map') => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('top', mode)
      router.replace(url.pathname + '?' + url.searchParams.toString())
    } catch { }
  }

  const handleTabSelect = (value: 'combined' | 'scoreYtf') => {
    setActiveTab(value)
  }

  const handleResetSelection = () => {
    setSelectedBasinName(null)
    setTableSearch("")
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div
        className="hidden lg:flex flex-1 min-h-0 bg-background overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Left: Map (ArcGIS JS API) + Tier legend */}
        <div style={{ width: `${leftWidth}%` }} className="h-full min-w-0 border-r border-border flex flex-col">
          <div className="flex-1 min-h-0">
            <ArcGISViewer
              basemap={basemap}
              uiTheme={resolvedTheme === "dark" ? "dark" : "light"}
              center={[103.5, 4.5]}
              zoom={6.5}
              fitOnLoad={false}
              allowedBasins={allowedBasins}
              tierByBasin={tierByBasin}
              geojsonLayers={[
                { url: "/Basin_GEB_filtered/Basin_shp_wgs84_part1.geojson", title: "GEB Basins A–F (filtered)", type: "blocks", visible: true },
                { url: "/Basin_GEB_filtered/Basin_shp_wgs84_part2.geojson", title: "GEB Basins G–L (filtered)", type: "blocks", visible: true },
                { url: "/Basin_GEB_filtered/Basin_shp_wgs84_part3.geojson", title: "GEB Basins M–R (filtered)", type: "blocks", visible: true },
                { url: "/Basin_GEB_filtered/Basin_shp_wgs84_part4.geojson", title: "GEB Basins S–Z (filtered)", type: "blocks", visible: true },
              ]}
              onFeatureClick={handleFeatureClick}
              highlightBasinName={selectedBasinName}
            />
          </div>
          <div className="px-3 py-2 text-[10px] flex items-center justify-center gap-3 text-muted-foreground border-t border-border">
            <span className="mr-1">Combined Ranking Tiers:</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#7ec129' }} /> T1</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#4ADDCA' }} /> T2</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#e5d818' }} /> T3</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#d95c8d' }} /> T4</span>
          </div>
        </div>

        {/* Drag handle (3-dot pill style, matches Geological page) */}
        <div
          className="w-2 bg-border hover:bg-primary cursor-col-resize transition-colors relative flex-shrink-0 group select-none"
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center justify-center gap-1 px-[3px] py-1 rounded-full bg-muted/60 group-hover:bg-primary-foreground/60">
              <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/70 group-hover:bg-background" />
              <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/70 group-hover:bg-background" />
              <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/70 group-hover:bg-background" />
            </div>
          </div>
        </div>

        {/* Right: Charts grid + Table (with horizontal divider) + Filter sidebar */}
        <div className="flex flex-1 min-w-0 overflow-hidden">
          {/* Left side: Charts and Table with divider */}
          <div id="right-panel-content" className="flex flex-1 min-w-0 overflow-hidden flex-col">
            {/* Top: Chart area - fills remaining height above divider and table (hidden when table is expanded) */}
            <div
              className="min-w-0 overflow-hidden"
              style={{ height: isTableFullscreen ? 0 : `calc(100% - ${tableHeight}px - 8px)` }}
            >
              <div className="h-full">
                {/* TODO: Re-enable charts when dashboard-echarts components are created */}
                <div className="flex items-center justify-center h-full bg-card text-muted-foreground">
                  <p>Chart components pending implementation</p>
                </div>
              </div>
            </div>

            {/* Horizontal drag handle (hidden when table is expanded) */}
            {!isTableFullscreen && (
              <div
                className="bg-border hover:bg-primary cursor-row-resize transition-colors relative flex-shrink-0 group z-50 select-none"
                style={{ height: 8 }}
                onMouseDown={startVerticalDragMouse}
                onTouchStart={startVerticalDragTouch}
                onPointerDown={startVerticalDragPointer}
                title="Drag to resize"
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center justify-center gap-1 px-1 py-[1px] rounded-full bg-muted/60 group-hover:bg-primary-foreground/60">
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/70 group-hover:bg-background" />
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/70 group-hover:bg-background" />
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/70 group-hover:bg-background" />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom: Table Section (expands to full height when isTableFullscreen is true) */}
            <div
              ref={tableSectionRef}
              className="min-w-0 bg-card"
              style={{ height: isTableFullscreen ? '100%' : `${tableHeight}px` }}
            >
              <div ref={tableContentRef} className="flex flex-col h-full min-h-0">
                <div className="px-4 py-1 border-b border-border">
                  {/* Mobile / tablet header: icon + expanding search */}
                  <div className="flex lg:hidden flex-col">
                    {isSearchExpanded ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          autoFocus
                          type="text"
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          onBlur={() => setIsSearchExpanded(false)}
                          placeholder="Search"
                          className="flex-1 h-7 px-3 border border-input rounded-[4px] bg-background text-[12px]"
                        />
                        <button
                          type="button"
                          className="p-1.5 hover:bg-accent rounded"
                          onClick={() => { setIsSearchExpanded(false); setTableSearch("") }}
                          title="Clear search"
                        >
                          <X className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="text-sm font-medium whitespace-nowrap truncate" title="Combined Ranking">Combined Ranking</h3>
                          <button
                            type="button"
                            className="p-1 rounded-full border border-border bg-muted/60 hover:bg-accent flex items-center justify-center"
                            title="Source: S&P 2024"
                          >
                            <Info className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3">
                          <button
                            type="button"
                            className="p-1.5 hover:bg-accent rounded"
                            onClick={() => setIsSearchExpanded(true)}
                            title="Search"
                          >
                            <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                          </button>
                          <button className="p-1.5 hover:bg-accent rounded" title="Download">
                            <Download className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                          </button>
                          <button className="p-1.5 hover:bg-accent rounded" title={isTableFullscreen ? "Exit Fullscreen" : "Fullscreen"} onClick={toggleTableFullscreen}>
                            {isTableFullscreen ? (
                              <Minimize2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                            ) : (
                              <Maximize2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desktop header: pill source + always-visible search field + fullscreen icon */}
                  <div className="hidden lg:flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-sm font-medium whitespace-nowrap truncate" title="Combined Ranking">Combined Ranking</h3>
                      <span className="inline-flex items-center px-2 py-[2px] rounded-full bg-muted text-[10px] text-muted-foreground whitespace-nowrap">
                        Source: S&P 2024
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        placeholder="Search"
                        className="h-7 w-48 px-3 border border-input rounded-[4px] bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button className="p-1.5 hover:bg-accent rounded" title="Download">
                        <Download className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                      </button>
                      <button
                        className="p-1.5 hover:bg-accent rounded"
                        title={isTableFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        onClick={toggleTableFullscreen}
                      >
                        {isTableFullscreen ? (
                          <Minimize2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                        ) : (
                          <Maximize2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-scroll bg-card min-h-0">
                  <table className="w-full text-[10px]">
                    <thead className="sticky top-0 z-30" style={{ backgroundColor: resolvedTheme === 'dark' ? '#1A2740' : '#E5EDDD' }}>
                      <tr className="border-b border-border">
                        <th className="text-left p-2 font-medium text-foreground"><SortButton label="Basin" column="basin" /></th>
                        <th className="text-left p-2 font-medium text-foreground"><SortButton label="Country" column="country" /></th>
                        <th className="text-left p-2 font-medium text-foreground"><SortButton label="Region" column="region" /></th>
                        <th className="text-left p-2 font-medium text-foreground">Classification</th>
                        <th className="text-left p-2 font-medium text-foreground"><SortButton label="Tier" column="tier" /></th>
                        <th className="text-left p-2 font-medium text-foreground"><SortButton label="Geological Score" column="geo" /></th>
                        <th className="text-left p-2 font-medium text-foreground"><SortButton label="Above Ground Score" column="agr" /></th>
                        <th className="text-left p-2 font-medium text-foreground"><SortButton label="Total YTF (MMboe)" column="ytf" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBasins.map((basin: any, idx: number) => (
                        <tr
                          key={`${basin.ID}-${pageStart + idx}`}
                          className="hover:bg-accent/50 cursor-pointer"
                          style={{ backgroundColor: (pageStart + idx) % 2 === 0 ? (resolvedTheme === 'dark' ? '#121C2F' : '#F8F9F4') : (resolvedTheme === 'dark' ? '#0F172B' : '#fff') }}
                          onClick={() => setSelectedBasinName(basin['Basin Name'])}
                        >
                          <td className="p-2 text-primary font-medium">{basin['Basin Name']}</td>
                          <td className="p-2 text-primary">{basin['Country Name']}</td>
                          <td className="p-2 text-primary">{basin.Region}</td>
                          <td className="p-2 text-foreground">-</td>
                          <td className="p-2 text-foreground">{basin['TIER'] || '-'}</td>
                          <td className="p-2 text-foreground">{basin['GEOLOGICAL             SCORE                                 (out of 20)'] || '-'}</td>
                          <td className="p-2 text-foreground">{basin['ABOVE GROUND SCORE              (out of 20)'] || '-'}</td>
                          <td className="p-2 text-foreground font-medium">{
                            (() => {
                              if (!ytfData?.basins) return '-'
                              const normalize = (s: string) => s?.toLowerCase().trim()
                              const name = normalize(basin['Basin Name'])
                              const match = ytfData.basins.find((b: any) => normalize(b.basinName) === name)
                              return match ? match.ytf?.toLocaleString() : '-'
                            })()
                          }</td>
                        </tr>
                      )) || (
                          <tr>
                            <td colSpan={8} className="p-4 text-center text-muted-foreground">Loading basin data...</td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-border text-[10px] select-none sticky bottom-0 bg-card">
                  <div className="text-muted-foreground">
                    {totalEntries > 0 ? (
                      <>Showing {pageStart + 1} to {pageEnd} of {totalEntries} entries</>
                    ) : (
                      <>Showing 0 entries</>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="h-6 px-2 rounded hover:bg-accent disabled:opacity-50"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                    >
                      First
                    </button>
                    <button
                      className="h-6 px-2 rounded hover:bg-accent disabled:opacity-50"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((_, i) => {
                      const pageNum = Math.max(1, currentPage - 3) + i
                      if (pageNum > totalPages) return null
                      const active = pageNum === currentPage
                      return (
                        <button
                          key={pageNum}
                          className={`h-6 w-6 rounded text-center ${active ? 'bg-accent' : 'hover:bg-accent'}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      className="h-6 px-2 rounded hover:bg-accent disabled:opacity-50"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                    <button
                      className="h-6 px-2 rounded hover:bg-accent disabled:opacity-50"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Filter sidebar (full height) */}
          <div
            className="border-l border-border shrink-0 bg-card/80 backdrop-blur-sm relative overflow-hidden"
            style={{ width: isFilterCollapsed ? 48 : 300 }}
          >
            {isFilterCollapsed ? (
              <div className="h-full w-full pt-2 flex flex-col items-center">
                <button
                  className="h-10 w-10 rounded-md bg-card/80 border border-border/50 flex items-center justify-center shadow-sm hover:bg-muted/50"
                  onClick={() => setIsFilterCollapsed(false)}
                  title="Open filters"
                >
                  <Filter className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                {/* TODO: Re-enable FilterSidebar when component is created */}
                <div className="p-4 text-muted-foreground">Filter sidebar pending implementation</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile / tablet layout with SEEK-GEB + dropdown in top header */}
      <div className="flex lg:hidden flex-1 min-h-0">
        <div className="flex flex-col w-full">
          {/* Mobile GEB top header replacing sidebar */}
          <div className="border-b border-border bg-card">
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">SEEK-GEB</div>
                <select
                  className="h-8 border border-border rounded px-2 text-xs bg-background"
                  value={activeTab}
                  onChange={(e) => handleTabSelect(e.target.value as 'combined' | 'scoreYtf')}
                >
                  <option value="combined">Combined Ranking Methodology</option>
                  <option value="scoreYtf">Total Overall Score vs. YTF</option>
                </select>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-md border border-border text-sm flex items-center justify-center"
                onClick={() => setMobileNavOpen((v) => !v)}
                aria-label="Toggle GEB navigation"
              >
                <i className="bi bi-list text-base" />
              </button>
            </div>
          </div>

          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="text-sm font-semibold">SEEK-GEB</div>
                <button
                  type="button"
                  className="p-1.5 rounded-md border border-border text-sm flex items-center justify-center"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close navigation"
                >
                  <i className="bi bi-x text-base" />
                </button>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center gap-4 px-6 text-sm">
                <Link
                  href="/"
                  className="w-full max-w-xs px-4 py-3 text-center rounded-md border border-border bg-card hover:bg-accent/40"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/geb/ranking/combined"
                  className="w-full max-w-xs px-4 py-3 text-center rounded-md border border-border bg-card hover:bg-accent/40"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Ranking
                </Link>
                <Link
                  href="/geb/basin"
                  className="w-full max-w-xs px-4 py-3 text-center rounded-md border border-border bg-card hover:bg-accent/40"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Basin
                </Link>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <div className="text-sm font-medium">View</div>
            <div className="inline-flex rounded border border-border overflow-hidden">
              <button
                className={`px-3 py-1 text-sm ${topPanelMode === 'chart' ? 'bg-accent' : 'hover:bg-accent/50'}`}
                onClick={() => { setTopPanelMode('chart'); setTopParam('chart') }}
              >Chart</button>
              <button
                className={`px-3 py-1 text-sm ${topPanelMode === 'map' ? 'bg-accent' : 'hover:bg-accent/50'}`}
                onClick={() => { setTopPanelMode('map'); setTopParam('map') }}
              >Map</button>
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <div style={{ flexBasis: isTabletTableExpanded ? '35%' : '50%' }} className="min-h-0">
              <div className="h-full">
                {topPanelMode === 'chart' ? (
                  <div className="flex items-center justify-center h-full bg-card text-muted-foreground">
                    <p>Chart components pending implementation</p>
                  </div>
                ) : (
                  <ArcGISViewer
                    basemap={basemap}
                    uiTheme={resolvedTheme === "dark" ? "dark" : "light"}
                    center={[103.5, 4.5]}
                    zoom={6.5}
                    fitOnLoad={false}
                    allowedBasins={allowedBasins}
                    tierByBasin={tierByBasin}
                    geojsonLayers={[
                      { url: "/Basin_GEB_filtered/Basin_shp_wgs84_part1.geojson", title: "GEB Basins A–F (filtered)", type: "blocks", visible: true },
                      { url: "/Basin_GEB_filtered/Basin_shp_wgs84_part2.geojson", title: "GEB Basins G–L (filtered)", type: "blocks", visible: true },
                      { url: "/Basin_GEB_filtered/Basin_shp_wgs84_part3.geojson", title: "GEB Basins M–R (filtered)", type: "blocks", visible: true },
                      { url: "/Basin_GEB_filtered/Basin_shp_wgs84_part4.geojson", title: "GEB Basins S–Z (filtered)", type: "blocks", visible: true },
                    ]}
                    onFeatureClick={handleFeatureClick}
                    highlightBasinName={selectedBasinName}
                  />
                )}
              </div>
            </div>
            <div style={{ flexBasis: isTabletTableExpanded ? '65%' : '50%' }} className="min-h-0">
              {renderTable()}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop-only bottom tabs for switching between combined and score/YTF views */}
      <div className="hidden lg:block border-t border-border px-3">
        <div className="flex items-center py-2">
          <div className="flex">
            <button
              className={`px-3 py-1.5 text-sm border ${activeTab === 'combined'
                ? 'border-primary text-primary border-b-transparent -mb-px bg-white dark:bg-white'
                : 'border-border text-muted-foreground hover:bg-accent/50'
                }`}
              onClick={() => setActiveTab('combined')}
            >
              Combined Ranking Methodology
            </button>
            <button
              className={`px-3 py-1.5 text-sm border -ml-px ${activeTab === 'scoreYtf'
                ? 'border-primary text-primary border-b-transparent -mb-px bg-white dark:bg-white'
                : 'border-border text-muted-foreground hover:bg-accent/50'
                }`}
              onClick={() => setActiveTab('scoreYtf')}
            >
              Total Overall Score vs. YTF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GEBPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
      <GEBPageInner />
    </Suspense>
  )
}
