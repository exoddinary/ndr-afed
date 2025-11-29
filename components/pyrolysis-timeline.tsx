"use client"

import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReadOnlyField } from "@/components/read-only-field"
import { Layers } from "lucide-react"
import { PyrolysisParameters } from "@/components/pyrolysis-parameters"

export type DataSource = "IHS Markit" | "Schlumberger"

export interface PyroParams {
  sampleType?: string
  samwt?: number
  toc: number
  s1: number
  s2: number
  s3: number
  s4?: number
  tmax: number
  hi: number
  oi: number
  pi: number
  geneticPotential: number
  s2s3?: number
  osi?: number
  rc?: number
}

const ihsMarkitData: Array<{ id: number; depth: string; status: "success" | "warning" | "failed"; icon: any; iconColor: string; parameters: PyroParams }> = [
  {
    id: 1,
    depth: "2124",
    status: "success" as const,
    icon: Layers,
    iconColor: "text-slate-600",
    parameters: (() => {
      const p: PyroParams = {
        sampleType: "DC",
        samwt: 10.2,
        toc: 2.5,
        s1: 0.5,
        s2: 5.0,
        s3: 1.0,
        s4: 0.6,
        tmax: 445,
        hi: 200,
        oi: 40,
        pi: +(0.5 / (0.5 + 5.0)).toFixed(2),
        geneticPotential: +(0.5 + 5.0).toFixed(2),
      }
      p.s2s3 = +(p.s2 / p.s3).toFixed(2)
      p.osi = +(p.s1 / (p.toc || 1) * 100).toFixed(2)
      p.rc = +(p.toc * 0.1).toFixed(2)
      return p
    })(),
  },
  {
    id: 2,
    depth: "2506.5",
    status: "warning" as const,
    icon: Layers,
    iconColor: "text-slate-600",
    parameters: (() => {
      const p: PyroParams = {
        sampleType: "SWC",
        samwt: 9.7,
        toc: 1.8,
        s1: 0.3,
        s2: 3.2,
        s3: 1.5,
        s4: 0.5,
        tmax: 435,
        hi: 178,
        oi: 83,
        pi: +(0.3 / (0.3 + 3.2)).toFixed(2),
        geneticPotential: +(0.3 + 3.2).toFixed(2),
      }
      p.s2s3 = +(p.s2 / p.s3).toFixed(2)
      p.osi = +(p.s1 / (p.toc || 1) * 100).toFixed(2)
      p.rc = +(p.toc * 0.12).toFixed(2)
      return p
    })(),
  },
  {
    id: 3,
    depth: "3325.3",
    status: "failed" as const,
    icon: Layers,
    iconColor: "text-slate-600",
    parameters: (() => {
      const p: PyroParams = {
        sampleType: "C",
        samwt: 12.0,
        toc: 0.8,
        s1: 0.1,
        s2: 1.1,
        s3: 0.5,
        s4: 0.3,
        tmax: 420,
        hi: 138,
        oi: 63,
        pi: +(0.1 / (0.1 + 1.1)).toFixed(2),
        geneticPotential: +(0.1 + 1.1).toFixed(2),
      }
      p.s2s3 = +(p.s2 / p.s3).toFixed(2)
      p.osi = +(p.s1 / (p.toc || 1) * 100).toFixed(2)
      p.rc = +(p.toc * 0.15).toFixed(2)
      return p
    })(),
  },
]

const schlumbergerData: Array<{ id: number; depth: string; status: "success" | "warning" | "failed"; icon: any; iconColor: string; parameters: PyroParams }> = [
  {
    id: 1,
    depth: "1850",
    status: "success" as const,
    icon: Layers,
    iconColor: "text-slate-600",
    parameters: (() => {
      const p: PyroParams = {
        sampleType: "DC",
        samwt: 10.8,
        toc: 3.2,
        s1: 0.8,
        s2: 6.5,
        s3: 0.8,
        s4: 0.7,
        tmax: 450,
        hi: 203,
        oi: 25,
        pi: +(0.8 / (0.8 + 6.5)).toFixed(2),
        geneticPotential: +(0.8 + 6.5).toFixed(2),
      }
      p.s2s3 = +(p.s2 / p.s3).toFixed(2)
      p.osi = +(p.s1 / (p.toc || 1) * 100).toFixed(2)
      p.rc = +(p.toc * 0.1).toFixed(2)
      return p
    })(),
  },
  {
    id: 2,
    depth: "2275.8",
    status: "warning" as const,
    icon: Layers,
    iconColor: "text-slate-600",
    parameters: (() => {
      const p: PyroParams = {
        sampleType: "SWC",
        samwt: 9.9,
        toc: 2.1,
        s1: 0.4,
        s2: 4.1,
        s3: 1.2,
        s4: 0.5,
        tmax: 440,
        hi: 195,
        oi: 57,
        pi: +(0.4 / (0.4 + 4.1)).toFixed(2),
        geneticPotential: +(0.4 + 4.1).toFixed(2),
      }
      p.s2s3 = +(p.s2 / p.s3).toFixed(2)
      p.osi = +(p.s1 / (p.toc || 1) * 100).toFixed(2)
      p.rc = +(p.toc * 0.12).toFixed(2)
      return p
    })(),
  },
  {
    id: 3,
    depth: "2890.2",
    status: "failed" as const,
    icon: Layers,
    iconColor: "text-slate-600",
    parameters: (() => {
      const p: PyroParams = {
        sampleType: "C",
        samwt: 11.4,
        toc: 1.2,
        s1: 0.2,
        s2: 1.8,
        s3: 0.7,
        s4: 0.4,
        tmax: 425,
        hi: 150,
        oi: 58,
        pi: +(0.2 / (0.2 + 1.8)).toFixed(2),
        geneticPotential: +(0.2 + 1.8).toFixed(2),
      }
      p.s2s3 = +(p.s2 / p.s3).toFixed(2)
      p.osi = +(p.s1 / (p.toc || 1) * 100).toFixed(2)
      p.rc = +(p.toc * 0.14).toFixed(2)
      return p
    })(),
  },
  {
    id: 4,
    depth: "3456.7",
    status: "failed" as const,
    icon: Layers,
    iconColor: "text-slate-600",
    parameters: (() => {
      const p: PyroParams = {
        sampleType: "DC",
        samwt: 8.9,
        toc: 0.6,
        s1: 0.05,
        s2: 0.8,
        s3: 0.3,
        s4: 0.2,
        tmax: 410,
        hi: 133,
        oi: 50,
        pi: +(0.05 / (0.05 + 0.8)).toFixed(2),
        geneticPotential: +(0.05 + 0.8).toFixed(2),
      }
      p.s2s3 = +(p.s2 / p.s3).toFixed(2)
      p.osi = +(p.s1 / (p.toc || 1) * 100).toFixed(2)
      p.rc = +(p.toc * 0.16).toFixed(2)
      return p
    })(),
  },
]

interface PyrolysisTimelineProps {
  dataSource: DataSource
}

// Helper: Export depths so other parts (drawer) can use the same options
export function getPyrolysisDepthsBySource(source: DataSource): string[] {
  const list = source === "IHS Markit" ? ihsMarkitData : schlumbergerData
  return list.map((d) => d.depth)
}

export function getPyrolysisParametersBySourceAndDepth(source: DataSource, depth: string): PyroParams | null {
  const list = source === "IHS Markit" ? ihsMarkitData : schlumbergerData
  const match = list.find((d) => d.depth === depth)
  return match?.parameters || null
}

export function PyrolysisTimeline({ dataSource }: PyrolysisTimelineProps) {
  const timelineData = dataSource === "IHS Markit" ? ihsMarkitData : schlumbergerData

  return (
    <div className="space-y-8">
      {timelineData.map((item, index) => {
        const Icon = item.icon
        const isLast = index === timelineData.length - 1

        return (
          <div key={item.id} className="relative">
            {!isLast && <div className="absolute left-6 top-12 w-0.5 h-[calc(100%+1rem)] bg-border -translate-x-0.5" />}

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-background bg-card flex items-center justify-center relative z-10">
                <Icon className={`w-6 h-6 ${item.iconColor}`} />
              </div>

              <div className="flex-1 space-y-4">
                <div className="text-sm font-medium inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground w-fit">
                  Depth: {item.depth}m
                </div>

                <Card className="w-full">
                  <Tabs defaultValue="parameters" className="w-full">
                    <CardHeader>
                      <CardTitle className="sr-only">Pyrolysis</CardTitle>
                      <CardAction>
                        <TabsList className="mb-4">
                          <TabsTrigger value="parameters">Parameters</TabsTrigger>
                          <TabsTrigger value="interpretation">Metadata</TabsTrigger>
                        </TabsList>
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      <TabsContent value="parameters">
                        <PyrolysisParameters parameters={item.parameters} />
                      </TabsContent>
                      <TabsContent value="interpretation">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ReadOnlyField label="Analysis Type" value="Pyrolysis / Rock-Eval" variant="input" />
                            <ReadOnlyField label="Data Generation Date" value="15 Aug 2024" variant="input" />
                            <ReadOnlyField label="Data Source" value="Lab report" variant="input" />
                            <ReadOnlyField label="Owner" value="Geochemistry Team" variant="input" />
                            <ReadOnlyField label="Ownership" value="SEEK AI Internal" variant="input" />
                            <ReadOnlyField label="Assurance" value={item.status === 'success' ? 'High' : item.status === 'warning' ? 'Medium' : 'Low'} variant="input" />
                            <ReadOnlyField label="Data Generator" value="SEEK Lab" variant="input" />
                            <ReadOnlyField label="Data Entry Date" value="20 Aug 2024" variant="input" />
                            <ReadOnlyField label="Data Entry Mode" value="Import" variant="input" />
                            <ReadOnlyField label="Data Entry Focal" value="A. Khalik" variant="input" />
                          </div>
                          <ReadOnlyField label="Remarks" value="Automated ingestion from standardized Rock-Eval report." variant="textarea" />
                        </div>
                      </TabsContent>
                    </CardContent>
                  </Tabs>
                </Card>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
