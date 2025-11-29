"use client"

import { ReadOnlyField } from "@/components/read-only-field"
import { formatChemicalLabel } from "@/lib/chem"

export interface XrfParametersProps {
  data: {
    SiO2: number
    Al2O3: number
    Fe2O3: number
    CaO: number
    MgO: number
    K2O: number
    Na2O: number
    TiO2: number
    MnO: number
    P2O5: number
    LOI: number
  }
}

export function XrfParameters({ data }: XrfParametersProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadOnlyField label={formatChemicalLabel("SiO2 (%)")} value={data.SiO2} variant="pill" />
        <ReadOnlyField label={formatChemicalLabel("Al2O3 (%)")} value={data.Al2O3} variant="pill" />
        <ReadOnlyField label={formatChemicalLabel("Fe2O3 (%)")} value={data.Fe2O3} variant="pill" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadOnlyField label={formatChemicalLabel("CaO (%)")} value={data.CaO} variant="pill" />
        <ReadOnlyField label={formatChemicalLabel("MgO (%)")} value={data.MgO} variant="pill" />
        <ReadOnlyField label={formatChemicalLabel("K2O (%)")} value={data.K2O} variant="pill" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadOnlyField label={formatChemicalLabel("Na2O (%)")} value={data.Na2O} variant="pill" />
        <ReadOnlyField label={formatChemicalLabel("TiO2 (%)")} value={data.TiO2} variant="pill" />
        <ReadOnlyField label={formatChemicalLabel("MnO (%)")} value={data.MnO} variant="pill" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadOnlyField label={formatChemicalLabel("P2O5 (%)")} value={data.P2O5} variant="pill" />
        <ReadOnlyField label={formatChemicalLabel("Loss on Ignition (LOI %)")} value={data.LOI} variant="pill" />
        <div></div>
      </div>
    </div>
  )
}
