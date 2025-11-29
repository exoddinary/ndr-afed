"use client"

import { cn } from "@/lib/utils"
import * as React from "react"

export type ReadOnlyFieldProps = {
  label?: React.ReactNode
  value: React.ReactNode
  variant?: "pill" | "input" | "textarea"
  className?: string
  valueClassName?: string
}

/**
 * ReadOnlyField
 * A small utility to render non-editable, tokenized values with variants:
 * - pill: compact chip used for short numeric/text values
 * - input: single-line field look with padding and rounded border feel
 * - textarea: multi-line field look for longer text
 */
export function ReadOnlyField({ label, value, variant = "pill", className, valueClassName }: ReadOnlyFieldProps) {
  return (
    <div className={cn(variant === "pill" ? "flex items-center justify-between gap-2 w-full" : "flex flex-col gap-1 w-full", className)}>
      {label && (
        <span className="text-sm text-muted-foreground font-medium select-none">{label}</span>
      )}
      {variant === "pill" ? (
        <div className={cn(
          "h-8 min-w-[4.5rem] max-w-fit px-2 inline-flex items-center rounded-md bg-muted/40 text-foreground text-sm font-medium",
          valueClassName,
        )}>
          {value}
        </div>
      ) : variant === "input" ? (
        <div className={cn(
          "h-9 w-full px-3 inline-flex items-center rounded-md bg-muted/40 text-foreground text-sm font-medium",
          valueClassName,
        )}>
          {value}
        </div>
      ) : (
        <div className={cn(
          "min-h-[72px] w-full px-3 py-2 rounded-md bg-muted/40 text-foreground text-sm font-medium whitespace-pre-wrap",
          valueClassName,
        )}>
          {value}
        </div>
      )}
    </div>
  )
}
