"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BasinData {
  'ID': number
  'Country Name': string
  'Basin Name': string
  'Region': string
  'Basin Maturity (needs review in G&G datasheet)': string
  'Net Government Take (%)': number
  'PETRONAS Existing Country Presence': string
  'PETRONAS Existing Basin Presence': string
  '2023 IGMP Basin?': string
  'Current Existing Production in-basin?': string
  'Rigs generally available in country or close by?': string
  'ESG INDEX 2023': number
  'ESG INDEX 2024        (Sustainalytics Q4 2024)': number
  'CRP (Petronas 2023)': number
  'CRP (Petronas 2024)': number
  'Bid Rounds  (within the past 3 years 2020-2023 and/or to happen in the next 1 year)': string
  'Mode of Entry DIRECT NEGO (open blocks in IHS and Host open to nego)': string
  'Mode of Entry FARM-IN (IHS current farm-out opps?)': string
  [key: string]: any
}

interface GEBBasinInfoPanelProps {
  basinData: BasinData | null
  onClose: () => void
}

export default function GEBBasinInfoPanel({ basinData, onClose }: GEBBasinInfoPanelProps) {
  if (!basinData) return null

  const getMaturityColor = (maturity: string) => {
    const m = maturity?.toLowerCase() || ''
    if (m.includes('frontier')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    if (m.includes('mature')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    if (m.includes('emerging')) return 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  const getESGColor = (score: number) => {
    if (score < 30) return 'text-green-400'
    if (score < 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getCRPColor = (score: number) => {
    if (score < 4) return 'text-green-400'
    if (score < 7) return 'text-yellow-400'
    return 'text-red-400'
  }

  const yesNoVariant = (val: string) => {
    const v = val?.toUpperCase() || ''
    if (v === 'YES') return 'default'
    if (v === 'NO') return 'secondary'
    return 'outline'
  }

  return (
    <Card className="h-full flex flex-col border-border bg-card">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold truncate">
              {basinData['Basin Name']}
            </CardTitle>
            <CardDescription className="text-sm">
              {basinData['Country Name']} • {basinData['Region']}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className={getMaturityColor(basinData['Basin Maturity (needs review in G&G datasheet)'])}>
            {basinData['Basin Maturity (needs review in G&G datasheet)']}
          </Badge>
          {basinData['PETRONAS Existing Basin Presence'] === 'YES' && (
            <Badge variant="default" className="bg-teal-500/20 text-teal-300 border-teal-500/30">
              PETRONAS Present
            </Badge>
          )}
          {basinData['2023 IGMP Basin?']?.toUpperCase().includes('YES') && (
            <Badge variant="default" className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              IGMP Basin
            </Badge>
          )}
        </div>
      </CardHeader>

      <Separator />

      <ScrollArea className="flex-1">
        <CardContent className="pt-4 space-y-4">
          {/* Risk Scores */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Risk Scores</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">ESG 2024</div>
                <div className={`text-2xl font-bold ${getESGColor(basinData['ESG INDEX 2024        (Sustainalytics Q4 2024)'])}`}>
                  {basinData['ESG INDEX 2024        (Sustainalytics Q4 2024)']?.toFixed(1) || 'N/A'}
                </div>
                {basinData['ESG INDEX 2023'] && (
                  <div className="text-xs text-muted-foreground">
                    2023: {basinData['ESG INDEX 2023'].toFixed(1)}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">CRP 2024</div>
                <div className={`text-2xl font-bold ${getCRPColor(basinData['CRP (Petronas 2024)'])}`}>
                  {basinData['CRP (Petronas 2024)']?.toFixed(2) || 'N/A'}
                </div>
                {basinData['CRP (Petronas 2023)'] && (
                  <div className="text-xs text-muted-foreground">
                    2023: {basinData['CRP (Petronas 2023)'].toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Economics */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Economics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Gov Take:</span>
                <span className="font-medium">
                  {((basinData['Net Government Take (%)'] || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Accessibility */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Accessibility</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bid Rounds (recent):</span>
                <Badge variant={yesNoVariant(basinData['Bid Rounds  (within the past 3 years 2020-2023 and/or to happen in the next 1 year)'])}>
                  {basinData['Bid Rounds  (within the past 3 years 2020-2023 and/or to happen in the next 1 year)']}
                </Badge>
              </div>
              {basinData['If Yes - Year of last bid-round?'] && basinData['If Yes - Year of last bid-round?'] !== 'N/A' && (
                <div className="text-xs text-muted-foreground pl-4">
                  Last bid: {basinData['If Yes - Year of last bid-round?']}
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Direct Negotiation:</span>
                <Badge variant={yesNoVariant(basinData['Mode of Entry DIRECT NEGO (open blocks in IHS and Host open to nego)'])}>
                  {basinData['Mode of Entry DIRECT NEGO (open blocks in IHS and Host open to nego)']}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Farm-In Opps:</span>
                <Badge variant={yesNoVariant(basinData['Mode of Entry FARM-IN (IHS current farm-out opps?)'])}>
                  {basinData['Mode of Entry FARM-IN (IHS current farm-out opps?)']}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Operational */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Operational</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Existing Production:</span>
                <Badge variant={yesNoVariant(basinData['Current Existing Production in-basin?'])}>
                  {basinData['Current Existing Production in-basin?']}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rigs Available:</span>
                <Badge variant={yesNoVariant(basinData['Rigs generally available in country or close by?'])}>
                  {basinData['Rigs generally available in country or close by?']}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">No Special Tech Required:</span>
                <Badge variant={yesNoVariant(basinData['ABSENCE OF Special technology requirement (CO2, HPHT, H2S, Frac Tight reservoir, etc)'])}>
                  {basinData['ABSENCE OF Special technology requirement (CO2, HPHT, H2S, Frac Tight reservoir, etc)']}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Favorable Conditions:</span>
                <Badge variant={yesNoVariant(basinData['LACK OF Metocean/ Topography Natural Conditions'])}>
                  {basinData['LACK OF Metocean/ Topography Natural Conditions']}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
