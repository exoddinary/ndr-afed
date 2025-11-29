"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { TokenInput } from "@/components/ui/token-input"
import { Search } from "lucide-react"

export type FilterTableCardProps = {
  className?: string
  compact?: boolean
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: React.ReactNode
  children: React.ReactNode // table content
}

export function FilterTableCard({
  className,
  compact = false,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters,
  children,
}: FilterTableCardProps) {
  // Tokenize the search for multiple keywords (e.g., name, email, role)
  const [tokens, setTokens] = useState<string[]>([])

  // Sync incoming string value to tokens (split by comma/space)
  useEffect(() => {
    if (typeof searchValue === "string") {
      const next = searchValue
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
      setTokens(next)
    }
  }, [searchValue])

  // Propagate tokens back up as a space-joined string for backward compatibility
  useEffect(() => {
    onSearchChange(tokens.join(" "))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens])

  return (
    <Card className={cn("bg-card border border-border", compact && "py-0", className)}>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <TokenInput
              placeholder={searchPlaceholder}
              value={tokens}
              onChange={setTokens}
              className="pl-10 bg-input border-border text-foreground placeholder-muted-foreground"
            />
          </div>
          {filters}
        </div>

        {children}
      </div>
    </Card>
  )
}
