"use client"

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import * as React from "react"

export type TimelineRuleItem = {
  id: string | number
  depth: string
  title?: string
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
  status?: "success" | "warning" | "failed" | string
  // Content to render inside each tab
  parameters: React.ReactNode
  interpretation?: React.ReactNode
}

export type TimelineCardRulesProps = {
  items: TimelineRuleItem[]
  defaultTab?: "parameters" | "interpretation"
  depthLabel?: string
  hideTitle?: boolean
  depthUnit?: string
  showDepthChip?: boolean
  parametersLabel?: string
  interpretationLabel?: string
  tabsHidden?: boolean
  headerRight?: React.ReactNode
  onTabChange?: (tab: "parameters" | "interpretation", item: TimelineRuleItem, index: number) => void
  className?: string
}

/**
 * TimelineCardRules
 * A reusable vertical timeline composed of cards, each with right-aligned tabs (Parameters / Interpretation).
 * Mirrors the visual design used in the Pyrolysis timeline component, but accepts arbitrary content.
 */
export function TimelineCardRules({
  items,
  defaultTab = "parameters",
  depthLabel = "Depth",
  hideTitle = true,
  depthUnit = "m",
  showDepthChip = true,
  parametersLabel = "Parameters",
  interpretationLabel = "Metadata",
  tabsHidden = false,
  headerRight,
  onTabChange,
  className,
}: TimelineCardRulesProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {items.map((item, index) => {
        const Icon = item.icon ?? Layers
        const isLast = index === items.length - 1

        return (
          <div key={item.id} className="relative">
            {!isLast && (
              <div className="absolute left-6 top-12 w-0.5 h-[calc(100%+1rem)] bg-border -translate-x-0.5" />
            )}

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-background bg-card flex items-center justify-center relative z-10">
                <Icon className={cn("w-6 h-6", item.iconColor ?? "text-slate-600")} />
              </div>

              <div className="flex-1 space-y-4">
                {showDepthChip && (
                  <div className="text-sm font-medium inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground w-fit">
                    {depthLabel}: {item.depth}{depthUnit ? depthUnit : ""}
                  </div>
                )}

                <Card className="w-full">
                  {tabsHidden ? (
                    <>
                      {(headerRight || !hideTitle) && (
                        <CardHeader>
                          <CardTitle className={cn(hideTitle && "sr-only")}>{item.title ?? "Details"}</CardTitle>
                          {headerRight && <CardAction>{headerRight}</CardAction>}
                        </CardHeader>
                      )}
                      <CardContent>{item.parameters}</CardContent>
                    </>
                  ) : (
                    <Tabs defaultValue={defaultTab} className="w-full" onValueChange={(v) => onTabChange?.(v as any, item, index)}>
                      <CardHeader>
                        <CardTitle className={cn(hideTitle && "sr-only")}>{item.title ?? "Details"}</CardTitle>
                        <CardAction>
                          <TabsList className="mb-4">
                            <TabsTrigger value="parameters">{parametersLabel}</TabsTrigger>
                            <TabsTrigger value="interpretation">{interpretationLabel}</TabsTrigger>
                          </TabsList>
                        </CardAction>
                      </CardHeader>
                      <CardContent>
                        <TabsContent value="parameters">
                          {item.parameters}
                        </TabsContent>
                        <TabsContent value="interpretation">
                          {item.interpretation ?? (
                            <div className="text-sm text-muted-foreground">Metadata content coming soon.</div>
                          )}
                        </TabsContent>
                      </CardContent>
                    </Tabs>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
