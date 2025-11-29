"use client"

import { useState, useMemo, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterItem {
  id: string
  label: string
  parent?: string
  children?: FilterItem[]
}

// Hierarchical data structure: Region → Sub-region → Business Region → Country → Basin → Sub-basin
const hierarchyData = {
  regions: [
    { id: "asia", label: "Asia" },
    { id: "europe", label: "Europe" },
    { id: "americas", label: "Americas" },
    { id: "africa", label: "Africa" },
  ],
  subregions: [
    { id: "southeast-asia", label: "Southeast Asia", parent: "asia" },
    { id: "east-asia", label: "East Asia", parent: "asia" },
    { id: "south-asia", label: "South Asia", parent: "asia" },
    { id: "western-europe", label: "Western Europe", parent: "europe" },
    { id: "eastern-europe", label: "Eastern Europe", parent: "europe" },
  ],
  businessRegions: [
    { id: "my.sk", label: "MY.SK", parent: "southeast-asia" },
    { id: "my.sb", label: "MY.SB", parent: "southeast-asia" },
    { id: "my.pm", label: "MY.PM", parent: "southeast-asia" },
    { id: "vn.south", label: "VN.South", parent: "southeast-asia" },
    { id: "th.gulf", label: "TH.Gulf", parent: "southeast-asia" },
  ],
  countries: [
    { id: "malaysia", label: "Malaysia", parent: "southeast-asia" },
    { id: "vietnam", label: "Vietnam", parent: "southeast-asia" },
    { id: "thailand", label: "Thailand", parent: "southeast-asia" },
    { id: "indonesia", label: "Indonesia", parent: "southeast-asia" },
    { id: "brunei", label: "Brunei", parent: "southeast-asia" },
    { id: "singapore", label: "Singapore", parent: "southeast-asia" },
    { id: "china", label: "China", parent: "east-asia" },
    { id: "japan", label: "Japan", parent: "east-asia" },
    { id: "india", label: "India", parent: "south-asia" },
  ],
  basins: [
    { id: "sarawak", label: "Sarawak Basin", parent: "malaysia" },
    { id: "sabah", label: "Sabah Basin", parent: "malaysia" },
    { id: "malay", label: "Malay Basin", parent: "malaysia" },
    { id: "penyu", label: "Penyu Basin", parent: "malaysia" },
    { id: "cuu-long", label: "Cuu Long Basin", parent: "vietnam" },
    { id: "nam-con-son", label: "Nam Con Son Basin", parent: "vietnam" },
    { id: "pattani", label: "Pattani Basin", parent: "thailand" },
    { id: "sumatra", label: "Sumatra Basin", parent: "indonesia" },
    { id: "kutai", label: "Kutai Basin", parent: "indonesia" },
  ],
  subbasins: [
    { id: "balingian", label: "Balingian Province", parent: "sarawak" },
    { id: "baram", label: "Baram Delta Province", parent: "sarawak" },
    { id: "west-luconia", label: "West Luconia Province", parent: "sarawak" },
    { id: "tatau", label: "Tatau Province", parent: "sarawak" },
    { id: "sandakan", label: "Sandakan Sub-basin", parent: "sabah" },
    { id: "tarakan", label: "Tarakan Sub-basin", parent: "sabah" },
    { id: "pm1", label: "PM1 Block", parent: "malay" },
    { id: "pm3", label: "PM3 Block", parent: "malay" },
    { id: "ruby", label: "Ruby Field Area", parent: "cuu-long" },
    { id: "white-tiger", label: "White Tiger Field Area", parent: "cuu-long" },
  ],
}

const filterData: FilterItem[] = [
  {
    id: "region",
    label: "Region",
    children: [
      {
        id: "asia",
        label: "Asia",
        children: [
          { id: "east-asia", label: "East Asia" },
          { id: "southeast-asia", label: "Southeast Asia" },
          { id: "south-asia", label: "South Asia" },
        ],
      },
      {
        id: "europe",
        label: "Europe",
        children: [
          { id: "western-europe", label: "Western Europe" },
          { id: "eastern-europe", label: "Eastern Europe" },
          { id: "northern-europe", label: "Northern Europe" },
        ],
      },
      {
        id: "oceana",
        label: "Oceana",
        children: [
          { id: "australia", label: "Australia" },
          { id: "polynesia", label: "Polynesia" },
          { id: "melanesia", label: "Melanesia" },
        ],
      },
      {
        id: "america",
        label: "America",
        children: [
          { id: "north-america", label: "North America" },
          { id: "south-america", label: "South America" },
          { id: "central-america", label: "Central America" },
        ],
      },
      {
        id: "africa",
        label: "Africa",
        children: [
          { id: "north-africa", label: "North Africa" },
          { id: "west-africa", label: "West Africa" },
          { id: "east-africa", label: "East Africa" },
        ],
      },
    ],
  },
]

export function HierarchicalFilter() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({})
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSearchTerm, setTagSearchTerm] = useState("")
  const tagInputRef = useRef<HTMLInputElement>(null)

  // Available tags
  const availableTags = [
    "1996", "1997", "1998", "1999", "2000", "2001", "2007", "2020",
    "3d seismic", "afr", "africa", "structural map", "depth map",
    "contour map", "gravity anomaly", "magnetic anomaly", "seismic section",
    "well correlation", "basin outline", "isopach map", "facies distribution",
    "lithology map", "fault interpretation", "horizon surface",
    "petroleum system", "reservoir distribution", "source rock maturity",
    "thermal gradient", "geochemical data", "basin modeling",
    "tectonic framework", "depositional environment", "play fairway",
    "prospect map", "trap analysis", "migration pathway",
    "geobody extraction", "paleo-structure", "hydrocarbon kitchen",
    "regional cross-section", "exploration license block"
  ]

  const filteredTags = availableTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearchTerm.toLowerCase())
  )

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
    setTagSearchTerm("")
    tagInputRef.current?.focus()
  }

  const handleTagRemove = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && tagSearchTerm === "" && selectedTags.length > 0) {
      handleTagRemove(selectedTags[selectedTags.length - 1])
    }
  }

  const filteredItems = useMemo(() => {
    if (!searchQueries["region"]) return filterData

    const filterRecursive = (items: FilterItem[]): FilterItem[] => {
      return items.reduce((acc: FilterItem[], item) => {
        const matchesSearch = item.label.toLowerCase().includes(searchQueries["region"].toLowerCase())
        const filteredChildren = item.children ? filterRecursive(item.children) : []

        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...item,
            children: filteredChildren.length > 0 ? filteredChildren : item.children,
          })
        }

        return acc
      }, [])
    }

    return filterRecursive(filterData)
  }, [searchQueries])

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const removeItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    newSelected.delete(itemId)
    setSelectedItems(newSelected)
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
      const newQueries = { ...searchQueries }
      delete newQueries[sectionId]
      setSearchQueries(newQueries)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const clearAllFilters = () => {
    setSelectedItems(new Set())
    setSearchQueries({})
  }

  const clearLocationFilters = () => {
    const locationLevels = ["region", "subregion", "businessRegion", "country", "basin", "subbasin"]
    const newSelected = new Set(selectedItems)
    
    locationLevels.forEach(level => {
      getSelectedItemsForLevel(level).forEach(itemId => {
        newSelected.delete(itemId)
      })
    })
    
    setSelectedItems(newSelected)
  }

  const clearTagFilters = () => {
    setSelectedTags([])
    setTagSearchTerm("")
  }

  // Get filtered options based on parent selections
  const getFilteredOptions = (level: string) => {
    const levelMap: Record<string, { data: any[]; parentKey: string }> = {
      subregion: { data: hierarchyData.subregions, parentKey: "region" },
      businessRegion: { data: hierarchyData.businessRegions, parentKey: "subregion" },
      country: { data: hierarchyData.countries, parentKey: "subregion" },
      basin: { data: hierarchyData.basins, parentKey: "country" },
      subbasin: { data: hierarchyData.subbasins, parentKey: "basin" },
    }

    const config = levelMap[level]
    if (!config) return []

    // Get selected parent IDs
    const selectedParents = Array.from(selectedItems).filter((id) =>
      config.data.some((item) => item.parent === id)
    )

    // If no parents selected, return all options
    if (selectedParents.length === 0) {
      return config.data
    }

    // Filter by selected parents
    return config.data.filter((item) => selectedParents.includes(item.parent))
  }

  const getItemLabel = (itemId: string): string => {
    const findLabel = (items: FilterItem[]): string | null => {
      for (const item of items) {
        if (item.id === itemId) return item.label
        if (item.children) {
          const found = findLabel(item.children)
          if (found) return found
        }
      }
      return null
    }
    return findLabel(filterData) || itemId
  }

  // Get selected items for a specific filter level
  const getSelectedItemsForLevel = (level: string): string[] => {
    const levelDataMap: Record<string, any[]> = {
      region: filterData[0].children || [],
      subregion: hierarchyData.subregions,
      businessRegion: hierarchyData.businessRegions,
      country: hierarchyData.countries,
      basin: hierarchyData.basins,
      subbasin: hierarchyData.subbasins,
    }

    const levelData = levelDataMap[level] || []
    const levelIds = levelData.map((item) => item.id)
    
    return Array.from(selectedItems).filter((id) => levelIds.includes(id))
  }

  const filteredRegions = useMemo(() => {
    const query = searchQueries["region"] || ""
    if (!query) return filterData[0].children || []
    return (filterData[0].children || []).filter((region) => region.label.toLowerCase().includes(query.toLowerCase()))
  }, [searchQueries])

  return (
    <div className="space-y-4 w-full max-w-sm">
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-lg font-semibold text-foreground">Filter</h3>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 h-auto">
            Apply Filter
          </Button>
        </div>

        {/* Location Group Title */}
        <div className="px-4 mt-2 mb-2">
          <div className="flex items-center justify-between">
            <h4 className="text-foreground font-semibold text-base">Location</h4>
            <button onClick={clearLocationFilters} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Clear
            </button>
          </div>
        </div>

        <div className="mb-4">

        <div className="px-4">
          <button
            onClick={() => toggleSection("region")}
            className={cn(
              "flex items-center justify-between w-full px-4 py-2.5 bg-card hover:bg-accent transition-colors border border-border dark:bg-card/70",
              expandedSections.has("region") || (selectedItems.size > 0 && !expandedSections.has("region"))
                ? "rounded-t-lg"
                : "rounded-lg"
            )}
          >
            <span className="text-foreground font-medium text-sm">Region</span>
            {expandedSections.has("region") ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {!expandedSections.has("region") && getSelectedItemsForLevel("region").length > 0 && (
          <div className="px-4">
            <div className="border border-border rounded-b-lg overflow-hidden bg-background border-t-0 -mt-px">
              <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px] relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {getSelectedItemsForLevel("region").map((itemId) => (
                  <Badge
                    key={itemId}
                    variant="secondary"
                    className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                  >
                    {getItemLabel(itemId)}
                    <button onClick={() => removeItem(itemId)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {expandedSections.has("region") && (
          <div className="px-4">
            <div className="border border-border rounded-b-lg overflow-hidden bg-background border-t-0 -mt-px">
              <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px] relative border-b border-border">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {getSelectedItemsForLevel("region").map((itemId) => (
                  <Badge
                    key={itemId}
                    variant="secondary"
                    className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                  >
                    {getItemLabel(itemId)}
                    <button onClick={() => removeItem(itemId)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  placeholder="Search Region"
                  value={searchQueries["region"] || ""}
                  onChange={(e) => setSearchQueries({ ...searchQueries, region: e.target.value })}
                  className="flex-1 min-w-[120px] bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-6 px-0 py-0 text-sm"
                />
              </div>
              <div className="p-3 space-y-2">
                {filteredRegions.map((region) => {
                  const isSelected = selectedItems.has(region.id)
                  return (
                    <div key={region.id} className="flex items-center gap-3">
                      <Checkbox
                        id={region.id}
                        checked={isSelected}
                        onCheckedChange={() => toggleItem(region.id)}
                        className="border-border data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                      />
                      <label htmlFor={region.id} className="text-foreground cursor-pointer flex-1 select-none text-sm">
                        {region.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Subregion Filter */}
        <div className="px-4 mt-2">
          <button
            onClick={() => toggleSection("subregion")}
            className={cn(
              "flex items-center justify-between w-full px-4 py-2.5 bg-card hover:bg-accent transition-colors border border-border dark:bg-card/70",
              expandedSections.has("subregion") || (getSelectedItemsForLevel("subregion").length > 0 && !expandedSections.has("subregion"))
                ? "rounded-t-lg"
                : "rounded-lg"
            )}
          >
            <span className="text-foreground font-medium text-sm">Sub-region</span>
            {expandedSections.has("subregion") ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {!expandedSections.has("subregion") && getSelectedItemsForLevel("subregion").length > 0 && (
          <div className="px-4">
            <div className="border border-border rounded-b-lg overflow-hidden bg-background border-t-0 -mt-px">
              <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px] relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {getSelectedItemsForLevel("subregion").map((itemId) => (
                  <Badge
                    key={itemId}
                    variant="secondary"
                    className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                  >
                    {hierarchyData.subregions.find((sr) => sr.id === itemId)?.label || itemId}
                    <button onClick={() => removeItem(itemId)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {expandedSections.has("subregion") && (
          <div className="px-4">
            <div className="border border-border rounded-b-lg overflow-hidden bg-background border-t-0 -mt-px">
              <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px] relative border-b border-border">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {getSelectedItemsForLevel("subregion").map((itemId) => (
                  <Badge
                    key={itemId}
                    variant="secondary"
                    className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                  >
                    {hierarchyData.subregions.find((sr) => sr.id === itemId)?.label || itemId}
                    <button onClick={() => removeItem(itemId)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  placeholder="Search Sub-region"
                  value={searchQueries["subregion"] || ""}
                  onChange={(e) => setSearchQueries({ ...searchQueries, subregion: e.target.value })}
                  className="flex-1 min-w-[120px] bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-6 px-0 py-0 text-sm"
                />
              </div>
              <div className="p-3 space-y-2">
                {getFilteredOptions("subregion").length > 0 ? (
                  getFilteredOptions("subregion")
                    .filter((sr: any) => sr.label.toLowerCase().includes((searchQueries["subregion"] || "").toLowerCase()))
                    .map((subregion) => {
                      const isSelected = selectedItems.has(subregion.id)
                      return (
                        <div key={subregion.id} className="flex items-center gap-3">
                          <Checkbox
                            id={subregion.id}
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(subregion.id)}
                            className="border-border data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                          />
                          <label htmlFor={subregion.id} className="text-foreground cursor-pointer flex-1 select-none text-sm">
                            {subregion.label}
                          </label>
                        </div>
                      )
                    })
                ) : (
                  <p className="text-muted-foreground text-sm">Select a region to see sub-regions</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Business Region Filter */}
        <div className="px-4 mt-2">
          <button
            onClick={() => toggleSection("businessRegion")}
            className={cn(
              "flex items-center justify-between w-full px-4 py-2.5 bg-card hover:bg-accent transition-colors border border-border dark:bg-card/70",
              expandedSections.has("businessRegion") || (getSelectedItemsForLevel("businessRegion").length > 0 && !expandedSections.has("businessRegion"))
                ? "rounded-t-lg"
                : "rounded-lg"
            )}
          >
            <span className="text-foreground font-medium text-sm">Business Region</span>
            {expandedSections.has("businessRegion") ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {!expandedSections.has("businessRegion") && getSelectedItemsForLevel("businessRegion").length > 0 && (
          <div className="px-4">
            <div className="border border-border rounded-b-lg overflow-hidden bg-background border-t-0 -mt-px">
              <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px] relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {getSelectedItemsForLevel("businessRegion").map((itemId) => (
                  <Badge
                    key={itemId}
                    variant="secondary"
                    className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                  >
                    {hierarchyData.businessRegions.find((br) => br.id === itemId)?.label || itemId}
                    <button onClick={() => removeItem(itemId)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {expandedSections.has("businessRegion") && (
          <div className="px-4">
            <div className="border border-border rounded-b-lg overflow-hidden bg-background border-t-0 -mt-px">
              <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px] relative border-b border-border">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {getSelectedItemsForLevel("businessRegion").map((itemId) => (
                  <Badge
                    key={itemId}
                    variant="secondary"
                    className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                  >
                    {hierarchyData.businessRegions.find((br) => br.id === itemId)?.label || itemId}
                    <button onClick={() => removeItem(itemId)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  placeholder="Search Business Region"
                  value={searchQueries["businessRegion"] || ""}
                  onChange={(e) => setSearchQueries({ ...searchQueries, businessRegion: e.target.value })}
                  className="flex-1 min-w-[120px] bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-6 px-0 py-0 text-sm"
                />
              </div>
              <div className="p-3 space-y-2">
                {getFilteredOptions("businessRegion").length > 0 ? (
                  getFilteredOptions("businessRegion")
                    .filter((br: any) => br.label.toLowerCase().includes((searchQueries["businessRegion"] || "").toLowerCase()))
                    .map((businessRegion) => {
                      const isSelected = selectedItems.has(businessRegion.id)
                      return (
                        <div key={businessRegion.id} className="flex items-center gap-3">
                          <Checkbox
                            id={businessRegion.id}
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(businessRegion.id)}
                            className="border-border data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                          />
                          <label htmlFor={businessRegion.id} className="text-foreground cursor-pointer flex-1 select-none text-sm">
                            {businessRegion.label}
                          </label>
                        </div>
                      )
                    })
                ) : (
                  <p className="text-muted-foreground text-sm">Select a sub-region to see business regions</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Country Filter */}
        <div className="px-4 mt-2">
          <button
            onClick={() => toggleSection("country")}
            className={cn(
              "flex items-center justify-between w-full px-4 py-2.5 bg-card hover:bg-accent transition-colors border border-border dark:bg-card/70",
              expandedSections.has("country") || (getSelectedItemsForLevel("country").length > 0 && !expandedSections.has("country"))
                ? "rounded-t-lg"
                : "rounded-lg"
            )}
          >
            <span className="text-foreground font-medium text-sm">Country</span>
            {expandedSections.has("country") ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {!expandedSections.has("country") && getSelectedItemsForLevel("country").length > 0 && (
          <div className="px-4">
            <div className="border border-border rounded-b-lg overflow-hidden bg-background border-t-0 -mt-px">
              <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px] relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {getSelectedItemsForLevel("country").map((itemId) => (
                  <Badge
                    key={itemId}
                    variant="secondary"
                    className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                  >
                    {hierarchyData.countries.find((c) => c.id === itemId)?.label || itemId}
                    <button onClick={() => removeItem(itemId)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {expandedSections.has("country") && (
          <div className="px-4">
            <div className="border border-border rounded-b-lg overflow-hidden bg-background border-t-0 -mt-px">
              <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px] relative border-b border-border">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {getSelectedItemsForLevel("country").map((itemId) => (
                  <Badge
                    key={itemId}
                    variant="secondary"
                    className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                  >
                    {hierarchyData.countries.find((c) => c.id === itemId)?.label || itemId}
                    <button onClick={() => removeItem(itemId)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  placeholder="Search Country"
                  value={searchQueries["country"] || ""}
                  onChange={(e) => setSearchQueries({ ...searchQueries, country: e.target.value })}
                  className="flex-1 min-w-[120px] bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-6 px-0 py-0 text-sm"
                />
              </div>
              <div className="p-3 space-y-2">
                {getFilteredOptions("country").length > 0 ? (
                  getFilteredOptions("country")
                    .filter((c: any) => c.label.toLowerCase().includes((searchQueries["country"] || "").toLowerCase()))
                    .map((country) => {
                      const isSelected = selectedItems.has(country.id)
                      return (
                        <div key={country.id} className="flex items-center gap-3">
                          <Checkbox
                            id={country.id}
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(country.id)}
                            className="border-border data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                          />
                          <label htmlFor={country.id} className="text-foreground cursor-pointer flex-1 select-none text-sm">
                            {country.label}
                          </label>
                        </div>
                      )
                    })
                ) : (
                  <p className="text-muted-foreground text-sm">Select a sub-region to see countries</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Basin Filter */}
        <div className="px-4 mt-2">
          <button
            onClick={() => toggleSection("basin")}
            className={cn(
              "flex items-center justify-between w-full px-4 py-2.5 bg-card hover:bg-accent transition-colors border border-border dark:bg-card/70",
              expandedSections.has("basin") || (getSelectedItemsForLevel("basin").length > 0 && !expandedSections.has("basin"))
                ? "rounded-t-lg"
                : "rounded-lg"
            )}
          >
            <span className="text-foreground font-medium text-sm">Basin</span>
            {expandedSections.has("basin") ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {!expandedSections.has("basin") && getSelectedItemsForLevel("basin").length > 0 && (
          <div className="px-4">
            <div className="border border-border rounded-b-lg overflow-hidden bg-background border-t-0 -mt-px">
              <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px] relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {getSelectedItemsForLevel("basin").map((itemId) => (
                  <Badge
                    key={itemId}
                    variant="secondary"
                    className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                  >
                    {hierarchyData.basins.find((b) => b.id === itemId)?.label || itemId}
                    <button onClick={() => removeItem(itemId)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {expandedSections.has("basin") && (
          <div className="px-4">
            <div className="border border-border rounded-b-lg overflow-hidden bg-background border-t-0 -mt-px">
              <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px] relative border-b border-border">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {getSelectedItemsForLevel("basin").map((itemId) => (
                  <Badge
                    key={itemId}
                    variant="secondary"
                    className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                  >
                    {hierarchyData.basins.find((b) => b.id === itemId)?.label || itemId}
                    <button onClick={() => removeItem(itemId)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  placeholder="Search Basin"
                  value={searchQueries["basin"] || ""}
                  onChange={(e) => setSearchQueries({ ...searchQueries, basin: e.target.value })}
                  className="flex-1 min-w-[120px] bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-6 px-0 py-0 text-sm"
                />
              </div>
              <div className="p-3 space-y-2">
                {getFilteredOptions("basin").length > 0 ? (
                  getFilteredOptions("basin")
                    .filter((b: any) => b.label.toLowerCase().includes((searchQueries["basin"] || "").toLowerCase()))
                    .map((basin) => {
                      const isSelected = selectedItems.has(basin.id)
                      return (
                        <div key={basin.id} className="flex items-center gap-3">
                          <Checkbox
                            id={basin.id}
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(basin.id)}
                            className="border-border data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                          />
                          <label htmlFor={basin.id} className="text-foreground cursor-pointer flex-1 select-none text-sm">
                            {basin.label}
                          </label>
                        </div>
                      )
                    })
                ) : (
                  <p className="text-muted-foreground text-sm">Select a country to see basins</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sub-basin Filter */}
        <div className="px-4 mt-2">
          <button
            onClick={() => toggleSection("subbasin")}
            className={cn(
              "flex items-center justify-between w-full px-4 py-2.5 bg-card hover:bg-accent transition-colors border border-border dark:bg-card/70",
              expandedSections.has("subbasin") || (getSelectedItemsForLevel("subbasin").length > 0 && !expandedSections.has("subbasin"))
                ? "rounded-t-lg"
                : "rounded-lg"
            )}
          >
            <span className="text-foreground font-medium text-sm">Sub-basin</span>
            {expandedSections.has("subbasin") ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {!expandedSections.has("subbasin") && getSelectedItemsForLevel("subbasin").length > 0 && (
          <div className="px-4">
            <div className="border border-border rounded-b-lg overflow-hidden bg-background border-t-0 -mt-px">
              <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px] relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {getSelectedItemsForLevel("subbasin").map((itemId) => (
                  <Badge
                    key={itemId}
                    variant="secondary"
                    className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                  >
                    {hierarchyData.subbasins.find((sb) => sb.id === itemId)?.label || itemId}
                    <button onClick={() => removeItem(itemId)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {expandedSections.has("subbasin") && (
          <div className="px-4">
            <div className="border border-border rounded-b-lg overflow-hidden bg-background border-t-0 -mt-px">
              <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px] relative border-b border-border">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {getSelectedItemsForLevel("subbasin").map((itemId) => (
                  <Badge
                    key={itemId}
                    variant="secondary"
                    className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                  >
                    {hierarchyData.subbasins.find((sb) => sb.id === itemId)?.label || itemId}
                    <button onClick={() => removeItem(itemId)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  placeholder="Search Sub-basin"
                  value={searchQueries["subbasin"] || ""}
                  onChange={(e) => setSearchQueries({ ...searchQueries, subbasin: e.target.value })}
                  className="flex-1 min-w-[120px] bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-6 px-0 py-0 text-sm"
                />
              </div>
              <div className="p-3 space-y-2">
                {getFilteredOptions("subbasin").length > 0 ? (
                  getFilteredOptions("subbasin")
                    .filter((sb: any) => sb.label.toLowerCase().includes((searchQueries["subbasin"] || "").toLowerCase()))
                    .map((subbasin) => {
                      const isSelected = selectedItems.has(subbasin.id)
                      return (
                        <div key={subbasin.id} className="flex items-center gap-3">
                          <Checkbox
                            id={subbasin.id}
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(subbasin.id)}
                            className="border-border data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                          />
                          <label htmlFor={subbasin.id} className="text-foreground cursor-pointer flex-1 select-none text-sm">
                            {subbasin.label}
                          </label>
                        </div>
                      )
                    })
                ) : (
                  <p className="text-muted-foreground text-sm">Select a basin to see sub-basins</p>
                )}
              </div>
            </div>
          </div>
        )}

        </div>{/* end Location group */}

        {/* Tags Section - Always Expanded (16px gap from Location) */}
        <div className="px-4 pb-2 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-foreground font-semibold text-base">Tags</h4>
            <button onClick={clearTagFilters} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Clear
            </button>
          </div>

          {/* Combined search + badges + list (no gap, flush corners) */}
          {/* Badges + input container (top, no bottom radius) */}
          <div className="relative border border-border bg-background dark:bg-background/60 rounded-t-md rounded-b-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap items-center gap-2 pl-9 pr-3 py-2 min-h-[40px]">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-teal-600/20 text-teal-500 border border-teal-600/30 hover:bg-teal-600/30 px-2 py-0.5 text-xs"
                >
                  {tag}
                  <button onClick={() => handleTagRemove(tag)} className="ml-1 hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Input
                ref={tagInputRef}
                placeholder={selectedTags.length === 0 ? "Filter tags" : ""}
                value={tagSearchTerm}
                onChange={(e) => setTagSearchTerm(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="flex-1 min-w-[120px] bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-6 px-0 py-0 text-sm"
              />
            </div>
          </div>
          {/* Scrollable Tags List (bottom, no top radius, no top border) */}
          <div className="border-x border-b border-border rounded-b-md bg-background max-h-[300px] overflow-y-auto dark:bg-background/60">
            {filteredTags.length > 0 ? (
              <div className="space-y-3 p-3">
                {filteredTags.map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => handleTagToggle(tag)}
                      className="shrink-0 border-border data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                    />
                    <span className="flex-1 text-sm text-foreground">{tag}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground text-center">No tags found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
