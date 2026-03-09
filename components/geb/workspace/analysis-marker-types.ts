// Types for Interactive Analysis Marker feature

export interface MarkerPosition {
  longitude: number
  latitude: number
}

export interface AnalysisMarker {
  id: string
  label: string
  position: MarkerPosition
  radiusKm: number
  color: string
  createdBy: string
  timestamp: number
  isExpanded: boolean
  activeMode: 'stats' | 'graph' | 'ai' | 'comment' | 'data' | null
}

export interface SpatialFeature {
  id: string
  type: 'well' | 'field' | 'block' | 'seismic2d' | 'seismic3d'
  properties: Record<string, unknown>
  distanceKm: number
}

export interface SpatialContext {
  center: [number, number] // [lon, lat]
  radiusKm: number
  featuresInside: {
    wells: SpatialFeature[]
    fields: SpatialFeature[]
    blocks: SpatialFeature[]
    seismic2d: SpatialFeature[]
    seismic3d: SpatialFeature[]
  }
  statsSummary: {
    wellsCount: number
    gasDiscoveries: number
    oilDiscoveries: number
    dryWells: number
    activeOperators: number
    fieldsCount: number
    blocksCount: number
    seismicCoverage: 'low' | 'moderate' | 'high'
  }
}

export interface MarkerComment {
  id: string
  markerId: string
  user: string
  timestamp: number
  text: string
  replies: MarkerReply[]
}

export interface MarkerReply {
  id: string
  user: string
  timestamp: number
  text: string
}

export interface MarkerStats {
  wells: {
    total: number
    gas: number
    oil: number
    dry: number
    unknown: number
    byOperator: Record<string, number>
  }
  fields: {
    total: number
    gas: number
    oil: number
    byOperator: Record<string, number>
  }
  blocks: {
    total: number
    intersecting: number
    operators: string[]
  }
  seismic: {
    coverage2d: number // km
    coverage3d: number // km²
    surveys: number
  }
}

export interface AIPayload {
  center: [number, number]
  radiusKm: number
  featuresInside: SpatialContext['featuresInside']
  statsSummary: SpatialContext['statsSummary']
  markerLabel: string
}

export interface AIResult {
  insights: string
  opportunities: string[]
  dataGaps: string[]
  followUpQuestions: string[]
  timestamp: number
}
