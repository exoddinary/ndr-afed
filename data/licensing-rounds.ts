export type LicensingRound = {
  id: number
  name: string
  status: 'upcoming' | 'running' | 'pending' | 'conditional' | 'open'
  region: string
  coordinates: [number, number] // [lon, lat]
  summary: string
  deadline: string
  qualification: string
  fiscalTerms: string
  type: 'Onshore' | 'Offshore'
}

export const licensingRounds: LicensingRound[] = [
  {
    id: 1,
    name: 'Southern North Sea Gas Block L16',
    status: 'running',
    region: 'Southern North Sea',
    coordinates: [4.5, 53.2],
    summary: 'High-potential Rotliegend sandstone gas play near existing Den Helder infrastructure.',
    deadline: '2025-12-31',
    qualification: 'Operator experience in North Sea gas required.',
    fiscalTerms: 'Standard Dutch License – EBN 40% Carry',
    type: 'Offshore',
  },
  {
    id: 2,
    name: 'Offshore Wind-to-Gas Combo K8',
    status: 'pending',
    region: 'Central North Sea',
    coordinates: [3.8, 54.1],
    summary: 'Hybrid license combining gas production tie-back with offshore wind development potential.',
    deadline: '2025-10-15',
    qualification: 'Standard financial capability and energy transition plan.',
    fiscalTerms: 'Dutch License – SDE++ subsidy eligible',
    type: 'Offshore',
  },
  {
    id: 3,
    name: 'Central North Sea Deep Play F8',
    status: 'upcoming',
    region: 'Central North Sea',
    coordinates: [4.7, 54.8],
    summary: 'Frontier Carboniferous deep gas play with high upside and limited competition.',
    deadline: 'TBA',
    qualification: 'Major international operator preferred.',
    fiscalTerms: 'Standard Dutch License – Flexible Cost Uplift',
    type: 'Offshore',
  },
  {
    id: 4,
    name: 'Groningen Periphery Onshore G18',
    status: 'open',
    region: 'Onshore Netherlands',
    coordinates: [6.8, 53.2],
    summary: 'Onshore gas opportunity at the Groningen field periphery with proven reservoir quality.',
    deadline: 'Open Application',
    qualification: 'Consortium bids with small-field expertise encouraged.',
    fiscalTerms: 'Special Small-Field Incentive Package',
    type: 'Onshore',
  },
  {
    id: 5,
    name: 'Wadden Sea CCS-Ready Block Q4',
    status: 'conditional',
    region: 'Shallow Coastal North Sea',
    coordinates: [5.1, 53.0],
    summary: 'Conditionally awarded block with CCS storage potential and depleted reservoir certification.',
    deadline: 'Closed',
    qualification: 'N/A',
    fiscalTerms: 'Standard Dutch License – CCS incentive applicable',
    type: 'Offshore',
  },
]

export const statusColors: Record<LicensingRound['status'], string> = {
  upcoming: '#D8B4FE',
  running: '#FDE047',
  pending: '#86EFAC',
  conditional: '#15803D',
  open: '#A97142',
}
