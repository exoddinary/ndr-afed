"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { HierarchicalFilter } from "@/components/hierarchical-filter"

interface FilterToggleButtonProps {
  className?: string
}

export function FilterToggleButton({ className }: FilterToggleButtonProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <div className="relative">
      {/* Toggle Button - Exact match to the DOM element */}
      <Button
        variant="outline"
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className={cn(
          "justify-center bg-card border-border hover:bg-accent/40 transition-colors dark:bg-card/70 dark:border-border",
          isFilterOpen && "bg-accent/40",
          className
        )}
        aria-label="Open filters"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
        </svg>
        <span className="text-sm font-medium">Filter</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isFilterOpen && "rotate-180")} aria-hidden="true" />
      </Button>

      {/* Filter Panel with Animation */}
      <div
        className={cn(
          "absolute left-0 top-full mt-2 z-50 transition-all duration-300 ease-in-out transform origin-top",
          isFilterOpen 
            ? "opacity-100 scale-y-100" 
            : "opacity-0 scale-y-0 pointer-events-none"
        )}
      >
        <HierarchicalFilter />
      </div>
    </div>
  )
}

// Side panel version that slides in from the left
export function SideFilterToggleButton({ className }: FilterToggleButtonProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <div className="relative h-full">
      {/* Toggle Button - Exact match to the DOM element */}
      <Button
        variant="outline"
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className={cn(
          "justify-center bg-card border-border hover:bg-accent/40 transition-colors dark:bg-card/70 dark:border-border",
          isFilterOpen && "bg-accent/40",
          className
        )}
        aria-label="Open filters"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
        </svg>
        <span className="text-sm font-medium">Filter</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isFilterOpen && "rotate-180")} aria-hidden="true" />
      </Button>

      {/* Side Filter Panel with Animation */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-background border-r border-border shadow-lg z-40 transition-transform duration-300 ease-in-out",
          isFilterOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 h-full overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Filters</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFilterOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <HierarchicalFilter />
        </div>
      </div>
      
      {/* Backdrop overlay */}
      {isFilterOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsFilterOpen(false)}
        />
      )}
    </div>
  )
}
