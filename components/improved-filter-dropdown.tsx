"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export interface ImprovedFilterValues {
  wellName: string
  basin: string
  region: string
  businessRegion: string
  country: string
}

interface FilterDropdownProps {
  filters: ImprovedFilterValues
  onFiltersChange: (filters: ImprovedFilterValues) => void
  basinOptions?: { value: string; label: string }[]
  regionOptions?: { value: string; label: string }[]
  businessRegionOptions?: { value: string; label: string }[]
  countryOptions?: { value: string; label: string }[]
}

export function ImprovedFilterDropdown({
  filters,
  onFiltersChange,
  basinOptions = [
    { value: "sarawak", label: "Sarawak" },
    { value: "sabah", label: "Sabah" },
    { value: "peninsular", label: "Peninsular Malaysia" },
  ],
  regionOptions = [
    { value: "asia", label: "Asia" },
    { value: "sea", label: "South-eastern Asia" },
  ],
  businessRegionOptions = [
    { value: "my.sk", label: "MY.SK" },
    { value: "my.sb", label: "MY.SB" },
    { value: "my.pm", label: "MY.PM" },
  ],
  countryOptions = [
    { value: "malaysia", label: "Malaysia" },
  ],
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)
  const [basinSearch, setBasinSearch] = useState("")
  const [isBasinOpen, setIsBasinOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const basinRef = useRef<HTMLDivElement>(null)

  const filteredBasinOptions = basinOptions.filter((option) =>
    option.label.toLowerCase().includes(basinSearch.toLowerCase()),
  )

  const selectedBasinLabel = basinOptions.find((option) => option.value === localFilters.basin)?.label || ""

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
      if (basinRef.current && !basinRef.current.contains(event.target as Node)) {
        setIsBasinOpen(false)
        setBasinSearch("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // reflect incoming filter changes (from parent) into local state
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const activeFiltersCount = Object.values(filters).filter((value) => value.trim() !== "").length

  const handleApply = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleClear = () => {
    const clearedFilters: ImprovedFilterValues = {
      wellName: "",
      basin: "",
      region: "",
      businessRegion: "",
      country: "",
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const handleInputChange = (field: keyof ImprovedFilterValues, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleBasinSelect = (value: string) => {
    handleInputChange("basin", value)
    setIsBasinOpen(false)
    setBasinSearch("")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Filter Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-9 px-3 bg-card border-border hover:bg-accent/40 transition-colors dark:bg-card/70 dark:border-border"
        aria-label="Open filters"
      >
        {/* Filter Icon */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
          />
        </svg>
        <span className="text-sm font-medium">Filter</span>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {activeFiltersCount}
          </Badge>
        )}
        {/* Chevron */}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="p-3 border-b border-border bg-muted/30">
            <h3 className="font-medium text-popover-foreground">Filter Options</h3>
            <p className="text-xs text-muted-foreground mt-1">Refine your search criteria</p>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6 max-h-96 overflow-y-auto">
            {/* Well Name */}
            <div className="space-y-2">
              <Label htmlFor="wellName" className="text-sm font-medium text-popover-foreground">
                Well Name
              </Label>
              <Input
                id="wellName"
                placeholder="Search well name..."
                value={localFilters.wellName}
                onChange={(e) => handleInputChange("wellName", e.target.value)}
                className="h-9 bg-card border-border focus:ring-2 focus:ring-ring/50 dark:bg-card/60"
              />
            </div>

            <Separator />

            {/* Basin with search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-popover-foreground">Basin</Label>
              <div className="relative" ref={basinRef}>
                <button
                  onClick={() => setIsBasinOpen(!isBasinOpen)}
                  className="w-full h-9 px-3 bg-background border border-input rounded-md text-left text-sm hover:bg-accent transition-colors flex items-center justify-between"
                >
                  <span className={selectedBasinLabel ? "text-foreground" : "text-muted-foreground"}>
                    {selectedBasinLabel || "Select a basin"}
                  </span>
                  <svg
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isBasinOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isBasinOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 overflow-hidden animate-in fade-in-0 zoom-in-95">
                    <div className="p-3 border-b border-border">
                      <div className="relative">
                        <Input
                          placeholder="Type a basin"
                          value={basinSearch}
                          onChange={(e) => setBasinSearch(e.target.value)}
                          className="h-8 pr-8 text-sm bg-card border-border dark:bg-card/60"
                          autoFocus
                        />
                        <svg
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredBasinOptions.length > 0 ? (
                        <>
                          <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">Please select:</div>
                          {filteredBasinOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleBasinSelect(option.value)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              {option.label}
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No basins found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Region */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-popover-foreground">Region</Label>
              <Select value={localFilters.region} onValueChange={(value) => handleInputChange("region", value)}>
                <SelectTrigger className="h-9 bg-card border-border dark:bg-card/60">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Business Region */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-popover-foreground">Business Region</Label>
              <Select value={localFilters.businessRegion} onValueChange={(value) => handleInputChange("businessRegion", value)}>
                <SelectTrigger className="h-9 bg-card border-border dark:bg-card/60">
                  <SelectValue placeholder="Select business region" />
                </SelectTrigger>
                <SelectContent>
                  {businessRegionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-popover-foreground">Country</Label>
              <Select value={localFilters.country} onValueChange={(value) => handleInputChange("country", value)}>
                <SelectTrigger className="h-9 bg-card border-border dark:bg-card/60">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30">
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
              Clear all
            </Button>
            <Button size="sm" onClick={handleApply} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Apply filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
