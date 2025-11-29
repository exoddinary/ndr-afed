"use client"

import type { ReactNode } from "react"
import { Info } from "lucide-react"

interface ChartHeaderProps {
  title: string
  source?: string
  right?: ReactNode
}

export function ChartHeader({ title, source, right }: ChartHeaderProps) {
  return (
    <div className="px-4 py-[2px] border-b bg-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-medium truncate" title={title}>{title}</h3>
          {source ? (
            <>
              {/* Web (desktop): show full pill */}
              <span className="hidden lg:inline-flex items-center px-2 py-[2px] rounded-full bg-muted text-[10px] text-muted-foreground whitespace-nowrap">
                {source}
              </span>
              {/* Mobile / tablet: compact info icon */}
              <button
                type="button"
                className="inline-flex lg:hidden p-1 rounded-full border border-border bg-muted/60 hover:bg-accent items-center justify-center flex-shrink-0"
                title={source}
              >
                <Info className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
              </button>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">{right}</div>
      </div>
    </div>
  )
}
