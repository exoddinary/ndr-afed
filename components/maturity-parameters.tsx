"use client"

import { ReadOnlyField } from "@/components/read-only-field"

export interface MaturityParametersProps {
  // Keep loose typing to allow either old or new shapes; we map to new labels below
  parameters: Record<string, any>
}

export function MaturityParameters({ parameters }: MaturityParametersProps) {
  const vrMean = parameters.vrMean ?? parameters.vitriniteReflectance ?? 0.85
  const vrSd = parameters.vrSd ?? 0.05
  const sampleType = parameters.sampleType ?? "DC"
  const omType = parameters.omType ?? "Type II/III"
  const vrMin = parameters.vrMin ?? 0.70
  const vrMax = parameters.vrMax ?? 1.00
  const analysisType = parameters.analysisType ?? "Vitrinite Reflectance"

  const items = [
    { label: "VR Mean (%)", value: vrMean },
    { label: "VR SD (%)", value: vrSd },
    { label: "Sample type (DC/SWC/C)", value: sampleType },
    { label: "OM Type", value: omType },
    { label: "VR Min (%)", value: vrMin },
    { label: "VR Max (%)", value: vrMax },
    { label: "Analysis Type", value: analysisType },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((it) => (
          <ReadOnlyField key={it.label} label={it.label} value={it.value} variant="pill" />
        ))}
      </div>
    </div>
  )
}
