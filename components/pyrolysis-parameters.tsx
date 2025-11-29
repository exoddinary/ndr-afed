"use client"


export interface PyrolysisParametersProps {
  parameters: {
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
}

export function PyrolysisParameters({ parameters }: PyrolysisParametersProps) {
  const parameterRows = [
    [
      { label: "Sample type (DC/SWC/C)", value: parameters.sampleType ?? "N/A" },
      { label: "Samwt (g)", value: parameters.samwt ?? "N/A" },
      { label: "TOC (wt%)", value: parameters.toc },
    ],
    [
      { label: "S1 (mg HC/g rock)", value: parameters.s1 },
      { label: "S2 (mg HC/g rock)", value: parameters.s2 },
      { label: "S3 (mg CO₂/g rock)", value: parameters.s3 },
    ],
    [
      { label: "S4 (mg/g rock)", value: parameters.s4 ?? "N/A" },
      { label: "Tmax (°C)", value: parameters.tmax },
      { label: "HI (mg HC/g TOC)", value: parameters.hi },
    ],
    [
      { label: "OI (mg CO₂/g TOC)", value: parameters.oi },
      { label: "PI (S1/(S1+S2))", value: parameters.pi },
      { label: "PP (S1+S2) (mg/g)", value: parameters.geneticPotential },
    ],
    [
      { label: "S2/S3 (Euc)", value: parameters.s2s3 ?? "N/A" },
      { label: "OSI (mg/g)", value: parameters.osi ?? "N/A" },
      { label: "RC (wt%)", value: parameters.rc ?? "N/A" },
    ],
  ]

  return (
    <div className="space-y-4">
      {parameterRows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {row.map((param, paramIndex) => (
            <div key={paramIndex} className="flex items-center gap-2">
              <div className="bg-muted rounded-md px-3 py-1.5 min-w-[80px] text-center">
                <span className="text-sm font-medium">{param.value}</span>
              </div>
              <span className="text-sm text-muted-foreground font-medium">{param.label}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
