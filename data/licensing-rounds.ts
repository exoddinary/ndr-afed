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
    name: 'North Sumatra Basin Block A',
    status: 'running',
    region: 'Western Indonesia',
    coordinates: [98.0, 3.5],
    summary: 'High potential gas play in the prolific North Sumatra Basin.',
    deadline: '2025-12-31',
    qualification: 'Operator experience in deep water required.',
    fiscalTerms: 'Production Sharing Contract (PSC) - Cost Recovery',
    type: 'Offshore',
  },
  {
    id: 2,
    name: 'Central Java Onshore Block',
    status: 'pending',
    region: 'Central Indonesia',
    coordinates: [110.0, -7.0],
    summary: 'Onshore oil opportunity with existing infrastructure nearby.',
    deadline: '2025-10-15',
    qualification: 'Standard financial capability.',
    fiscalTerms: 'Gross Split PSC',
    type: 'Onshore',
  },
  {
    id: 3,
    name: 'East Kalimantan Deepwater',
    status: 'upcoming',
    region: 'Western Indonesia',
    coordinates: [118.0, 1.0],
    summary: 'Frontier deepwater exploration block.',
    deadline: 'TBA',
    qualification: 'Major international operator preferred.',
    fiscalTerms: 'Flexible Terms Available',
    type: 'Offshore',
  },
  {
    id: 4,
    name: 'Papua Frontier Block',
    status: 'open',
    region: 'Eastern Indonesia',
    coordinates: [135.0, -4.0],
    summary: 'Large frontier acreage with significant upside potential.',
    deadline: 'Open Application',
    qualification: 'Consortium bids encouraged.',
    fiscalTerms: 'Special Incentive Package',
    type: 'Onshore',
  },
  {
    id: 5,
    name: 'Natuna Sea Block B',
    status: 'conditional',
    region: 'Western Indonesia',
    coordinates: [108.0, 4.0],
    summary: 'Conditionally awarded pending final signature.',
    deadline: 'Closed',
    qualification: 'N/A',
    fiscalTerms: 'Cost Recovery PSC',
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
