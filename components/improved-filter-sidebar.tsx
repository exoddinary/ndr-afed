"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Filter, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ImprovedFilterValues {
  wellName: string
  basin: string
  region: string
  businessRegion: string
  country: string
}

interface FilterSidebarProps {
  filters: ImprovedFilterValues
  onFiltersChange: (filters: ImprovedFilterValues) => void
  basinOptions?: { value: string; label: string }[]
  regionOptions?: { value: string; label: string }[]
  businessRegionOptions?: { value: string; label: string }[]
  countryOptions?: { value: string; label: string }[]
}

export function ImprovedFilterSidebar({
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
}: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

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

  return (
    <>
      {/* Filter Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border-slate-200 transition-colors w-[120px] justify-start"
        aria-label="Toggle filters"
      >
        <Filter className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm font-medium">Filter</span>
        <ChevronDown className="h-4 w-4 ml-auto" />
      </Button>

      {/* Left Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-96 bg-white border-r border-slate-200 shadow-xl z-50 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Filter Options</h2>
              <p className="text-sm text-muted-foreground mt-1">Refine your search criteria</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Well Name */}
            <div>
              <Label htmlFor="wellName" className="text-sm font-medium text-foreground mb-2 block">
                Well Name
              </Label>
              <Input
                id="wellName"
                placeholder="Search well name..."
                value={localFilters.wellName}
                onChange={(e) => setLocalFilters({ ...localFilters, wellName: e.target.value })}
                className="bg-white"
              />
            </div>

            {/* Basin */}
            <div>
              <Label htmlFor="basin" className="text-sm font-medium text-foreground mb-2 block">
                Basin
              </Label>
              <Select
                value={localFilters.basin}
                onValueChange={(value) => setLocalFilters({ ...localFilters, basin: value })}
              >
                <SelectTrigger id="basin" className="bg-white">
                  <SelectValue placeholder="Select a basin" />
                </SelectTrigger>
                <SelectContent>
                  {basinOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Region */}
            <div>
              <Label htmlFor="region" className="text-sm font-medium text-foreground mb-2 block">
                Region
              </Label>
              <Select
                value={localFilters.region}
                onValueChange={(value) => setLocalFilters({ ...localFilters, region: value })}
              >
                <SelectTrigger id="region" className="bg-white">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Business Region */}
            <div>
              <Label htmlFor="businessRegion" className="text-sm font-medium text-foreground mb-2 block">
                Business Region
              </Label>
              <Select
                value={localFilters.businessRegion}
                onValueChange={(value) => setLocalFilters({ ...localFilters, businessRegion: value })}
              >
                <SelectTrigger id="businessRegion" className="bg-white">
                  <SelectValue placeholder="Select business region" />
                </SelectTrigger>
                <SelectContent>
                  {businessRegionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-200 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handleClear}
              className="flex-1"
            >
              Clear all
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
            >
              Apply filters
            </Button>
          </div>
        </div>
      </div>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
