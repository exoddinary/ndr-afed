// Spatial calculation utilities for analysis markers
// Uses Haversine formula for distance calculations

import type { MarkerPosition, SpatialContext, SpatialFeature, MarkerStats } from './analysis-marker-types'

// Earth's radius in km
const EARTH_RADIUS_KM = 6371

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  point1: MarkerPosition,
  point2: MarkerPosition
): number {
  const lat1 = point1.latitude * (Math.PI / 180)
  const lat2 = point2.latitude * (Math.PI / 180)
  const deltaLat = (point2.latitude - point1.latitude) * (Math.PI / 180)
  const deltaLon = (point2.longitude - point1.longitude) * (Math.PI / 180)

  const a = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_KM * c
}

/**
 * Check if a point is within a radius of a center point
 */
export function isWithinRadius(
  center: MarkerPosition,
  point: MarkerPosition,
  radiusKm: number
): boolean {
  return calculateDistance(center, point) <= radiusKm
}

/**
 * Calculate spatial context for a marker
 * Filters all GeoJSON features within the marker's radius
 */
export function calculateSpatialContext(
  center: MarkerPosition,
  radiusKm: number,
  geoData: {
    wells?: GeoJSON.FeatureCollection
    fields?: GeoJSON.FeatureCollection
    blocks?: GeoJSON.FeatureCollection
    seismic2d?: GeoJSON.FeatureCollection
    seismic3d?: GeoJSON.FeatureCollection
  }
): SpatialContext {
  const featuresInside: SpatialContext['featuresInside'] = {
    wells: [],
    fields: [],
    blocks: [],
    seismic2d: [],
    seismic3d: []
  }

  // Filter wells within radius
  if (geoData.wells?.features) {
    geoData.wells.features.forEach((feature) => {
      const coords = getCoordinates(feature)
      if (coords) {
        const distance = calculateDistance(center, coords)
        if (distance <= radiusKm) {
          featuresInside.wells.push({
            id: feature.properties?.['IDENTIFICA'] as string || `well-${Math.random()}`,
            type: 'well',
            properties: feature.properties || {},
            distanceKm: Math.round(distance * 10) / 10
          })
        }
      }
    })
  }

  // Filter fields within radius (centroid check)
  if (geoData.fields?.features) {
    geoData.fields.features.forEach((feature) => {
      const centroid = calculateCentroid(feature)
      if (centroid) {
        const distance = calculateDistance(center, centroid)
        // Fields use larger threshold since they're area features
        if (distance <= radiusKm * 1.5) {
          featuresInside.fields.push({
            id: feature.properties?.['FIELD_CD'] as string || `field-${Math.random()}`,
            type: 'field',
            properties: feature.properties || {},
            distanceKm: Math.round(distance * 10) / 10
          })
        }
      }
    })
  }

  // Filter blocks (centroid check)
  if (geoData.blocks?.features) {
    geoData.blocks.features.forEach((feature) => {
      const centroid = calculateCentroid(feature)
      if (centroid) {
        const distance = calculateDistance(center, centroid)
        if (distance <= radiusKm) {
          featuresInside.blocks.push({
            id: feature.properties?.['BlokNummer'] as string || `block-${Math.random()}`,
            type: 'block',
            properties: feature.properties || {},
            distanceKm: Math.round(distance * 10) / 10
          })
        }
      }
    })
  }

  // Filter seismic lines (any point within radius)
  if (geoData.seismic2d?.features) {
    geoData.seismic2d.features.forEach((feature) => {
      const minDistance = calculateMinDistanceToLineString(center, feature)
      if (minDistance !== null && minDistance <= radiusKm) {
        featuresInside.seismic2d.push({
          id: feature.properties?.['line_name'] as string || `seismic-${Math.random()}`,
          type: 'seismic2d',
          properties: feature.properties || {},
          distanceKm: Math.round(minDistance * 10) / 10
        })
      }
    })
  }

  // Filter 3D seismic surveys (centroid check)
  if (geoData.seismic3d?.features) {
    geoData.seismic3d.features.forEach((feature) => {
      const centroid = calculateCentroid(feature)
      if (centroid) {
        const distance = calculateDistance(center, centroid)
        if (distance <= radiusKm) {
          featuresInside.seismic3d.push({
            id: feature.properties?.['SURVEY_ID'] as string || `3d-${Math.random()}`,
            type: 'seismic3d',
            properties: feature.properties || {},
            distanceKm: Math.round(distance * 10) / 10
          })
        }
      }
    })
  }

  // Calculate stats summary
  const gasWells = featuresInside.wells.filter(w => 
    (w.properties['WELL_RESUL'] as string)?.toLowerCase().includes('gas')
  ).length
  const oilWells = featuresInside.wells.filter(w => 
    (w.properties['WELL_RESUL'] as string)?.toLowerCase().includes('oil')
  ).length
  const dryWells = featuresInside.wells.filter(w => 
    (w.properties['WELL_RESUL'] as string)?.toLowerCase().includes('dry') ||
    (w.properties['STATUS'] as string)?.toLowerCase().includes('abandoned')
  ).length

  const uniqueOperators = new Set(featuresInside.wells.map(w => w.properties['OPERATOR'] as string).filter(Boolean))
  const seismicCoverage = calculateSeismicCoverage(
    featuresInside.seismic2d.length,
    featuresInside.seismic3d.length,
    radiusKm
  )

  return {
    center: [center.longitude, center.latitude],
    radiusKm,
    featuresInside,
    statsSummary: {
      wellsCount: featuresInside.wells.length,
      gasDiscoveries: gasWells,
      oilDiscoveries: oilWells,
      dryWells,
      activeOperators: uniqueOperators.size,
      fieldsCount: featuresInside.fields.length,
      blocksCount: featuresInside.blocks.length,
      seismicCoverage
    }
  }
}

/**
 * Calculate statistics from spatial context
 */
export function calculateMarkerStats(context: SpatialContext): MarkerStats {
  const wellOperators: Record<string, number> = {}
  const fieldOperators: Record<string, number> = {}

  // Count wells by operator
  context.featuresInside.wells.forEach(well => {
    const operator = well.properties['OPERATOR'] as string
    if (operator) {
      wellOperators[operator] = (wellOperators[operator] || 0) + 1
    }
  })

  // Count fields by operator
  context.featuresInside.fields.forEach(field => {
    const operator = field.properties['OPERATOR'] as string
    if (operator) {
      fieldOperators[operator] = (fieldOperators[operator] || 0) + 1
    }
  })

  return {
    wells: {
      total: context.statsSummary.wellsCount,
      gas: context.statsSummary.gasDiscoveries,
      oil: context.statsSummary.oilDiscoveries,
      dry: context.statsSummary.dryWells,
      unknown: context.statsSummary.wellsCount - 
        context.statsSummary.gasDiscoveries - 
        context.statsSummary.oilDiscoveries - 
        context.statsSummary.dryWells,
      byOperator: wellOperators
    },
    fields: {
      total: context.statsSummary.fieldsCount,
      gas: context.featuresInside.fields.filter(f => 
        (f.properties['RESULT'] as string)?.toLowerCase().includes('gas')
      ).length,
      oil: context.featuresInside.fields.filter(f => 
        (f.properties['RESULT'] as string)?.toLowerCase().includes('oil')
      ).length,
      byOperator: fieldOperators
    },
    blocks: {
      total: context.statsSummary.blocksCount,
      intersecting: context.statsSummary.blocksCount, // Simplified
      operators: Object.keys(wellOperators)
    },
    seismic: {
      coverage2d: context.featuresInside.seismic2d.length * 10, // Approximate km per line
      coverage3d: context.featuresInside.seismic3d.length * 50, // Approximate km² per survey
      surveys: context.featuresInside.seismic2d.length + context.featuresInside.seismic3d.length
    }
  }
}

// Helper functions

function getCoordinates(feature: GeoJSON.Feature): MarkerPosition | null {
  const geom = feature.geometry
  if (geom.type === 'Point') {
    return { longitude: geom.coordinates[0], latitude: geom.coordinates[1] }
  }
  return null
}

function calculateCentroid(feature: GeoJSON.Feature): MarkerPosition | null {
  const geom = feature.geometry
  if (geom.type === 'Point') {
    return { longitude: geom.coordinates[0], latitude: geom.coordinates[1] }
  }
  if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
    // Simple centroid calculation (average of all coordinates)
    const coords = geom.type === 'Polygon' 
      ? geom.coordinates[0] 
      : geom.coordinates[0][0]
    
    let sumLon = 0, sumLat = 0
    coords.forEach(c => {
      sumLon += c[0]
      sumLat += c[1]
    })
    
    return {
      longitude: sumLon / coords.length,
      latitude: sumLat / coords.length
    }
  }
  return null
}

function calculateMinDistanceToLineString(
  center: MarkerPosition,
  feature: GeoJSON.Feature
): number | null {
  const geom = feature.geometry
  if (geom.type !== 'LineString' && geom.type !== 'MultiLineString') {
    return null
  }
  
  const coords = geom.type === 'LineString' 
    ? [geom.coordinates] 
    : geom.coordinates
  
  let minDistance = Infinity
  
  coords.forEach(line => {
    for (let i = 0; i < line.length - 1; i++) {
      const segmentStart = { longitude: line[i][0], latitude: line[i][1] }
      const segmentEnd = { longitude: line[i + 1][0], latitude: line[i + 1][1] }
      const distance = pointToLineDistance(center, segmentStart, segmentEnd)
      minDistance = Math.min(minDistance, distance)
    }
  })
  
  return minDistance === Infinity ? null : minDistance
}

function pointToLineDistance(
  point: MarkerPosition,
  lineStart: MarkerPosition,
  lineEnd: MarkerPosition
): number {
  // Calculate perpendicular distance from point to line segment
  const A = point.latitude - lineStart.latitude
  const B = point.longitude - lineStart.longitude
  const C = lineEnd.latitude - lineStart.latitude
  const D = lineEnd.longitude - lineStart.longitude

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx, yy

  if (param < 0) {
    xx = lineStart.longitude
    yy = lineStart.latitude
  } else if (param > 1) {
    xx = lineEnd.longitude
    yy = lineEnd.latitude
  } else {
    xx = lineStart.longitude + param * D
    yy = lineStart.latitude + param * C
  }

  const dx = point.longitude - xx
  const dy = point.latitude - yy

  // Convert to km (approximate)
  return Math.sqrt(dx * dx + dy * dy) * 111
}

function calculateSeismicCoverage(
  seismic2dCount: number,
  seismic3dCount: number,
  radiusKm: number
): 'low' | 'moderate' | 'high' {
  const totalCoverage = seismic2dCount * 10 + seismic3dCount * 50
  const areaKm2 = Math.PI * radiusKm * radiusKm
  const coverageRatio = totalCoverage / areaKm2
  
  if (coverageRatio > 0.5) return 'high'
  if (coverageRatio > 0.2) return 'moderate'
  return 'low'
}
