/**
 * NDR GeoJSON Data Tools
 * Pure functions that query in-memory feature data loaded from /public/data/*.json
 * These are the "tools" available to the NDR agents.
 * NOTE: This file runs server-side only (API routes). Uses fs to read files directly.
 */

import fs from 'fs'
import path from 'path'
import Fuse from 'fuse.js'
import * as turf from '@turf/turf'

export type Feature = {
    type: 'Feature'
    geometry: {
        type: string
        coordinates: unknown
    }
    properties: Record<string, unknown>
}

export type FeatureCollection = {
    type: 'FeatureCollection'
    features: Feature[]
}

export type LayerName = 'wells' | 'fields' | 'blocks' | 'seismic2d' | 'seismic3d' | 'trajectories' | 'gng_projects' | 'licenses'

// Layer metadata — maps logical layer names to file paths and display info
export const LAYER_META: Record<LayerName, { file: string; label: string; idField: string; nameField: string; geometryType: string; timeField?: string }> = {
    wells: { file: 'Wells.json', label: 'Wells', idField: 'OBJECTID', nameField: 'IDENTIFICA', geometryType: 'Point' },
    fields: { file: 'HC_Fields.json', label: 'Hydrocarbon Fields', idField: 'OBJECTID', nameField: 'FIELD_NAME', geometryType: 'Polygon' },
    blocks: { file: 'Offshore_Blocks.json', label: 'Offshore Blocks', idField: 'OBJECTID', nameField: 'BlokNummer', geometryType: 'Polygon' },
    seismic2d: { file: 'Seismic_2D_Surveys.json', label: 'Seismic 2D Surveys', idField: 'OBJECTID', nameField: 'line_name', geometryType: 'LineString', timeField: 'YEAR' },
    seismic3d: { file: 'Seismic_3D_Surveys.json', label: 'Seismic 3D Surveys', idField: 'OBJECTID', nameField: 'SURVEY_ID', geometryType: 'Polygon', timeField: 'YEAR' },
    trajectories: { file: 'Wells_Trajectories.json', label: 'Well Trajectories', idField: 'OBJECTID', nameField: 'SHORT_NM', geometryType: 'LineString' },
    gng_projects: { file: 'GnG_Project_Data_Outlines.json', label: 'G&G Project Outlines', idField: 'OBJECTID', nameField: 'PROJECT_NAME', geometryType: 'Polygon', timeField: 'INTERPRETATION_YEAR' },
    licenses: { file: 'Licenses.json', label: 'Licenses', idField: 'OBJECTID', nameField: 'licence_nm', geometryType: 'Polygon', timeField: 'licence_st' },
}

// --- In-memory cache ---
const _cache: Partial<Record<LayerName, Feature[]>> = {}
const _fuseCache: Partial<Record<LayerName, Fuse<Feature>>> = {}

export async function getLayerFeatures(layer: LayerName): Promise<Feature[]> {
    if (_cache[layer]) return _cache[layer]!

    const filePath = path.join(process.cwd(), 'public', 'data', LAYER_META[layer].file)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const geojson: FeatureCollection = JSON.parse(raw)
    _cache[layer] = geojson.features
    return geojson.features
}

// --- Fuzzy search setup ---
export async function getFuzzySearcher(layer: LayerName): Promise<Fuse<Feature>> {
    if (_fuseCache[layer]) return _fuseCache[layer]!
    
    const features = await getLayerFeatures(layer)
    const meta = LAYER_META[layer]
    
    const fuse = new Fuse(features, {
        keys: [meta.nameField, meta.idField],
        threshold: 0.4,
        includeScore: true,
        minMatchCharLength: 2
    })
    
    _fuseCache[layer] = fuse
    return fuse
}

// --- Tool: fuzzy_find_feature ---
export async function tool_fuzzy_find_feature(layer: LayerName, query: string, limit = 5): Promise<object[]> {
    const fuse = await getFuzzySearcher(layer)
    const results = fuse.search(query, { limit })
    return results.map(r => ({
        ...r.item.properties,
        _matchScore: r.score,
        _matchedName: r.item.properties[LAYER_META[layer].nameField]
    }))
}

// --- Tool: get_layer_features ---
export async function tool_get_layer_features(layer: LayerName, limit = 50): Promise<object[]> {
    const features = await getLayerFeatures(layer)
    return features.slice(0, limit).map(f => f.properties)
}

// --- Tool: get_feature_by_id ---
export async function tool_get_feature_by_id(layer: LayerName, identifier: string | number): Promise<object | null> {
    const features = await getLayerFeatures(layer)
    const meta = LAYER_META[layer]
    const f = features.find(feat =>
        String(feat.properties[meta.idField]) === String(identifier) ||
        String(feat.properties[meta.nameField]).toLowerCase().includes(String(identifier).toLowerCase())
    )
    return f ? { properties: f.properties, geometry_type: f.geometry?.type } : null
}

// --- Tool: filter_features ---
export async function tool_filter_features(
    layer: LayerName,
    filters: Record<string, string>,
    limit = 100
): Promise<object[]> {
    const features = await getLayerFeatures(layer)
    const results = features.filter(feat =>
        Object.entries(filters).every(([key, value]) => {
            const prop = String(feat.properties[key] ?? '').toLowerCase()
            return prop.includes(value.toLowerCase())
        })
    )
    return results.slice(0, limit).map(f => f.properties)
}

// --- Tool: aggregate_features ---
export async function tool_aggregate_features(
    layer: LayerName,
    groupByField: string,
    countOnly = true
): Promise<object> {
    const features = await getLayerFeatures(layer)
    const groups: Record<string, number> = {}
    features.forEach(feat => {
        const key = String(feat.properties[groupByField] ?? 'Unknown')
        groups[key] = (groups[key] || 0) + 1
    })
    const sorted = Object.entries(groups)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([value, count]) => ({ [groupByField]: value, count }))

    return { total: features.length, grouped: sorted }
}

// --- Tool: compare_feature_properties ---
export async function tool_compare_feature_properties(
    layer: LayerName,
    identifiers: string[],
    fields: string[]
): Promise<object[]> {
    const features = await getLayerFeatures(layer)
    const meta = LAYER_META[layer]
    return identifiers.map(id => {
        const feat = features.find(f =>
            String(f.properties[meta.idField]) === id ||
            String(f.properties[meta.nameField]).toLowerCase().includes(id.toLowerCase())
        )
        if (!feat) return { id, error: 'Not found' }
        const result: Record<string, unknown> = { id }
        fields.forEach(field => { result[field] = feat.properties[field] ?? null })
        return result
    })
}

// --- Spatial helpers ---
function toRad(deg: number): number { return deg * Math.PI / 180 }

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = toRad(lon2 - lon1)
    const lat1Rad = toRad(lat1)
    const lat2Rad = toRad(lat2)
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon)
    
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
    return bearing
}

export function getDirectionLabel(bearing: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(bearing / 22.5) % 16
    return directions[index]
}

function getCentroid(geometry: Feature['geometry']): [number, number] | null {
    if (!geometry) return null
    if (geometry.type === 'Point') {
        const c = geometry.coordinates as [number, number]
        return [c[1], c[0]] // [lat, lon]
    }
    if (geometry.type === 'Polygon') {
        const coords = (geometry.coordinates as [number, number][][])[0]
        const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length
        const lon = coords.reduce((s, c) => s + c[0], 0) / coords.length
        return [lat, lon]
    }
    if (geometry.type === 'MultiPolygon') {
        const allCoords = (geometry.coordinates as [number, number][][][]).flat(2)
        const lat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length
        const lon = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length
        return [lat, lon]
    }
    if (geometry.type === 'LineString') {
        const coords = geometry.coordinates as [number, number][]
        const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length
        const lon = coords.reduce((s, c) => s + c[0], 0) / coords.length
        return [lat, lon]
    }
    if (geometry.type === 'MultiLineString') {
        const allCoords = (geometry.coordinates as [number, number][][]).flat()
        const lat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length
        const lon = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length
        return [lat, lon]
    }
    return null
}

// --- Tool: find_nearby_features ---
export async function tool_find_nearby_features(
    originLayer: LayerName,
    originIdentifier: string,
    targetLayer: LayerName,
    radiusKm: number,
    limit = 20
): Promise<object[]> {
    console.log(`[find_nearby_features] Searching: ${originIdentifier} in ${originLayer}, looking for ${targetLayer} within ${radiusKm}km`)
    
    const originFeatures = await getLayerFeatures(originLayer)
    const targetFeatures = await getLayerFeatures(targetLayer)
    const meta = LAYER_META[originLayer]
    const targetMeta = LAYER_META[targetLayer]

    console.log(`[find_nearby_features] Origin layer has ${originFeatures.length} features, target has ${targetFeatures.length}`)

    const origin = originFeatures.find(f =>
        String(f.properties[meta.idField]) === originIdentifier ||
        String(f.properties[meta.nameField]).toLowerCase().includes(originIdentifier.toLowerCase())
    )
    
    if (!origin) {
        console.log(`[find_nearby_features] Origin feature '${originIdentifier}' not found in ${originLayer}`)
        console.log(`[find_nearby_features] Available names sample:`, originFeatures.slice(0, 5).map(f => f.properties[meta.nameField]))
        return [{ error: `Origin feature '${originIdentifier}' not found in ${originLayer}` }]
    }

    console.log(`[find_nearby_features] Found origin: ${origin.properties[meta.nameField]} at ${JSON.stringify(origin.geometry)}`)

    const originCentroid = getCentroid(origin.geometry)
    if (!originCentroid) {
        console.log(`[find_nearby_features] Could not compute centroid for origin feature`)
        return [{ error: 'Could not compute centroid for origin feature' }]
    }

    const [oLat, oLon] = originCentroid
    console.log(`[find_nearby_features] Origin centroid: [${oLat}, ${oLon}]`)

    const nearby = targetFeatures
        .map(feat => {
            const centroid = getCentroid(feat.geometry)
            if (!centroid) return null
            const distKm = haversineKm(oLat, oLon, centroid[0], centroid[1])
            return { 
                distKm, 
                properties: feat.properties,
                targetName: feat.properties[targetMeta.nameField]
            }
        })
        .filter((r): r is { distKm: number; properties: Record<string, unknown>; targetName: unknown } => r !== null && r.distKm <= radiusKm)
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, limit)
    
    console.log(`[find_nearby_features] Found ${nearby.length} features within ${radiusKm}km`)
    console.log(`[find_nearby_features] Nearest:`, nearby.slice(0, 3).map(n => ({ name: n.targetName, dist: n.distKm.toFixed(1) })))

    return nearby.map(r => ({ ...r.properties, distance_km: r.distKm.toFixed(1) }))
}

// --- Tool: calculate_distance ---
export async function tool_calculate_distance(
    layer1: LayerName, id1: string,
    layer2: LayerName, id2: string
): Promise<object> {
    const [f1, f2] = await Promise.all([
        tool_get_feature_by_id(layer1, id1),
        tool_get_feature_by_id(layer2, id2)
    ])
    if (!f1) return { error: `Feature ${id1} not found in ${layer1}` }
    if (!f2) return { error: `Feature ${id2} not found in ${layer2}` }

    const features1 = await getLayerFeatures(layer1)
    const features2 = await getLayerFeatures(layer2)
    const meta1 = LAYER_META[layer1]
    const meta2 = LAYER_META[layer2]

    const feat1 = features1.find(f => String(f.properties[meta1.nameField]).toLowerCase().includes(id1.toLowerCase()))
    const feat2 = features2.find(f => String(f.properties[meta2.nameField]).toLowerCase().includes(id2.toLowerCase()))

    if (!feat1 || !feat2) return { error: 'Feature geometry not found' }
    const c1 = getCentroid(feat1.geometry)
    const c2 = getCentroid(feat2.geometry)
    if (!c1 || !c2) return { error: 'Cannot compute centroids' }

    const dist = haversineKm(c1[0], c1[1], c2[0], c2[1])
    return { distance_km: dist.toFixed(2), from: id1, to: id2, layer1, layer2 }
}

// --- Tool: get_features_within_area ---
export async function tool_get_features_within_area(
    targetLayer: LayerName,
    boundingBox: { minLat: number; maxLat: number; minLon: number; maxLon: number },
    limit = 50
): Promise<object[]> {
    const features = await getLayerFeatures(targetLayer)
    const { minLat, maxLat, minLon, maxLon } = boundingBox
    return features
        .filter(feat => {
            const c = getCentroid(feat.geometry)
            if (!c) return false
            return c[0] >= minLat && c[0] <= maxLat && c[1] >= minLon && c[1] <= maxLon
        })
        .slice(0, limit)
        .map(f => f.properties)
}

// --- Tool: spatial_aggregate ---
export async function tool_spatial_aggregate(
    layer: LayerName,
    boundingBox: { minLat: number; maxLat: number; minLon: number; maxLon: number },
    groupByField?: string
): Promise<object> {
    const features = await getLayerFeatures(layer)
    const { minLat, maxLat, minLon, maxLon } = boundingBox
    
    const withinArea = features.filter(feat => {
        const c = getCentroid(feat.geometry)
        if (!c) return false
        return c[0] >= minLat && c[0] <= maxLat && c[1] >= minLon && c[1] <= maxLon
    })
    
    if (!groupByField) {
        return {
            total: features.length,
            withinArea: withinArea.length,
            percentage: ((withinArea.length / features.length) * 100).toFixed(1) + '%'
        }
    }
    
    const groups: Record<string, number> = {}
    withinArea.forEach(feat => {
        const key = String(feat.properties[groupByField] ?? 'Unknown')
        groups[key] = (groups[key] || 0) + 1
    })
    
    const sorted = Object.entries(groups)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([value, count]) => ({ [groupByField]: value, count }))
    
    return {
        total: features.length,
        withinArea: withinArea.length,
        percentage: ((withinArea.length / features.length) * 100).toFixed(1) + '%',
        grouped: sorted
    }
}

// --- Tool: find_directional_features ---
export async function tool_find_directional_features(
    originLayer: LayerName,
    originIdentifier: string,
    targetLayer: LayerName,
    direction: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest',
    maxDistanceKm: number,
    limit = 20
): Promise<object[]> {
    const originFeatures = await getLayerFeatures(originLayer)
    const targetFeatures = await getLayerFeatures(targetLayer)
    const meta = LAYER_META[originLayer]

    const origin = originFeatures.find(f =>
        String(f.properties[meta.idField]) === originIdentifier ||
        String(f.properties[meta.nameField]).toLowerCase().includes(originIdentifier.toLowerCase())
    )
    if (!origin) return [{ error: `Origin feature '${originIdentifier}' not found in ${originLayer}` }]

    const originCentroid = getCentroid(origin.geometry)
    if (!originCentroid) return [{ error: 'Could not compute centroid for origin feature' }]

    const [oLat, oLon] = originCentroid
    
    // Define bearing ranges for each direction
    const directionBearings: Record<string, [number, number]> = {
        'north': [315, 45],
        'northeast': [0, 90],
        'east': [45, 135],
        'southeast': [90, 180],
        'south': [135, 225],
        'southwest': [180, 270],
        'west': [225, 315],
        'northwest': [270, 360]
    }
    
    const [minBearing, maxBearing] = directionBearings[direction] || [0, 360]
    
    const directional = targetFeatures
        .map(feat => {
            const centroid = getCentroid(feat.geometry)
            if (!centroid) return null
            const distKm = haversineKm(oLat, oLon, centroid[0], centroid[1])
            if (distKm > maxDistanceKm) return null
            
            const bearing = getBearing(oLat, oLon, centroid[0], centroid[1])
            
            // Handle wrap-around for north (315-45)
            let inDirection = false
            if (minBearing > maxBearing) {
                inDirection = bearing >= minBearing || bearing <= maxBearing
            } else {
                inDirection = bearing >= minBearing && bearing <= maxBearing
            }
            
            if (!inDirection) return null
            
            return { 
                distKm, 
                bearing,
                direction: getDirectionLabel(bearing),
                properties: feat.properties 
            }
        })
        .filter((r): r is { distKm: number; bearing: number; direction: string; properties: Record<string, unknown> } => r !== null)
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, limit)
        .map(r => ({ 
            ...r.properties, 
            distance_km: r.distKm.toFixed(1),
            bearing: r.bearing.toFixed(0),
            direction: r.direction
        }))

    return directional
}

// --- Tool: find_features_between ---
export async function tool_find_features_between(
    layer1: LayerName, id1: string,
    layer2: LayerName, id2: string,
    targetLayer: LayerName,
    bufferKm: number = 10,
    limit = 20
): Promise<object[]> {
    const features1 = await getLayerFeatures(layer1)
    const features2 = await getLayerFeatures(layer2)
    const targetFeatures = await getLayerFeatures(targetLayer)
    
    const meta1 = LAYER_META[layer1]
    const meta2 = LAYER_META[layer2]
    
    const feat1 = features1.find(f => 
        String(f.properties[meta1.nameField]).toLowerCase().includes(id1.toLowerCase())
    )
    const feat2 = features2.find(f => 
        String(f.properties[meta2.nameField]).toLowerCase().includes(id2.toLowerCase())
    )
    
    if (!feat1 || !feat2) return [{ error: 'One or both features not found' }]
    
    const c1 = getCentroid(feat1.geometry)
    const c2 = getCentroid(feat2.geometry)
    
    if (!c1 || !c2) return [{ error: 'Could not compute centroids' }]
    
    // Create a line between the two points and buffer it
    const line = turf.lineString([[c1[1], c1[0]], [c2[1], c2[0]]])
    const buffered = turf.buffer(line, bufferKm, { units: 'kilometers' })
    
    const between = targetFeatures
        .map(feat => {
            const centroid = getCentroid(feat.geometry)
            if (!centroid) return null
            
            const pt = turf.point([centroid[1], centroid[0]])
            const isInside = turf.booleanPointInPolygon(pt, buffered)
            if (!isInside) return null
            
            const distKm = haversineKm(c1[0], c1[1], centroid[0], centroid[1])
            return { distKm, properties: feat.properties }
        })
        .filter((r): r is { distKm: number; properties: Record<string, unknown> } => r !== null)
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, limit)
        .map(r => ({ ...r.properties, distance_km: r.distKm.toFixed(1) }))
    
    return between
}

// --- Tool: find_temporal_spatial_features ---
export async function tool_find_temporal_spatial_features(
    layer: LayerName,
    yearRange: { start: number; end: number },
    spatialFilter?: { 
        nearLayer?: LayerName;
        nearFeature?: string;
        radiusKm?: number;
        bbox?: { minLat: number; maxLat: number; minLon: number; maxLon: number }
    },
    limit = 30
): Promise<object[]> {
    const features = await getLayerFeatures(layer)
    const meta = LAYER_META[layer]
    const timeField = meta.timeField || 'YEAR'
    
    // Filter by time
    let filtered = features.filter(feat => {
        const year = Number(feat.properties[timeField])
        if (isNaN(year)) return false
        return year >= yearRange.start && year <= yearRange.end
    })
    
    // Apply spatial filter if provided
    if (spatialFilter) {
        if (spatialFilter.bbox) {
            const { minLat, maxLat, minLon, maxLon } = spatialFilter.bbox
            filtered = filtered.filter(feat => {
                const c = getCentroid(feat.geometry)
                if (!c) return false
                return c[0] >= minLat && c[0] <= maxLat && c[1] >= minLon && c[1] <= maxLon
            })
        } else if (spatialFilter.nearLayer && spatialFilter.nearFeature && spatialFilter.radiusKm) {
            const nearFeatures = await getLayerFeatures(spatialFilter.nearLayer)
            const nearMeta = LAYER_META[spatialFilter.nearLayer]
            
            const origin = nearFeatures.find(f =>
                String(f.properties[nearMeta.nameField]).toLowerCase().includes(spatialFilter.nearFeature!.toLowerCase())
            )
            
            if (origin) {
                const originCentroid = getCentroid(origin.geometry)
                if (originCentroid) {
                    const [oLat, oLon] = originCentroid
                    filtered = filtered.filter(feat => {
                        const c = getCentroid(feat.geometry)
                        if (!c) return false
                        const dist = haversineKm(oLat, oLon, c[0], c[1])
                        return dist <= spatialFilter.radiusKm!
                    })
                }
            }
        }
    }
    
    return filtered
        .slice(0, limit)
        .map(f => ({ 
            ...f.properties, 
            [timeField]: f.properties[timeField]
        }))
}

// --- Tool: intersect_features (true geometry intersection) ---
export async function tool_intersect_features(
    layer1: LayerName,
    layer2: LayerName,
    featureName1: string,
    limit = 20
): Promise<object[]> {
    const features1 = await getLayerFeatures(layer1)
    const features2 = await getLayerFeatures(layer2)
    const meta1 = LAYER_META[layer1]
    
    const feat1 = features1.find(f =>
        String(f.properties[meta1.nameField]).toLowerCase().includes(featureName1.toLowerCase())
    )
    
    if (!feat1) return [{ error: `Feature '${featureName1}' not found in ${layer1}` }]
    
    // Convert to turf format
    const turfFeature1 = turf.feature(feat1.geometry as any, feat1.properties)
    
    const intersections = features2
        .map(feat2 => {
            const turfFeature2 = turf.feature(feat2.geometry as any, feat2.properties)
            
            try {
                // Check for intersection
                const intersects = turf.booleanIntersects(turfFeature1, turfFeature2)
                if (!intersects) return null
                
                // Calculate overlap area if both are polygons
                let overlapArea: number | undefined
                if (feat1.geometry.type === 'Polygon' && feat2.geometry.type === 'Polygon') {
                    try {
                        const intersection = turf.intersect(turfFeature1, turfFeature2)
                        if (intersection) {
                            overlapArea = turf.area(intersection) / 1000000 // Convert to km²
                        }
                    } catch (e) {
                        // Intersection calculation failed, but they still intersect
                    }
                }
                
                // Calculate centroid distance
                const c1 = getCentroid(feat1.geometry)
                const c2 = getCentroid(feat2.geometry)
                const distKm = c1 && c2 ? haversineKm(c1[0], c1[1], c2[0], c2[1]) : null
                
                return {
                    properties: feat2.properties,
                    overlap_area_km2: overlapArea?.toFixed(2),
                    distance_km: distKm?.toFixed(1)
                }
            } catch (e) {
                return null
            }
        })
        .filter((r): r is { properties: Record<string, unknown>; overlap_area_km2?: string; distance_km?: string } => r !== null)
        .slice(0, limit)
    
    return intersections
}

// --- Tool: analyze_trajectory ---
export async function tool_analyze_trajectory(
    wellName: string,
    intersectLayer?: LayerName,
    minDepth?: number,
    maxDepth?: number
): Promise<object> {
    const trajectoryFeatures = await getLayerFeatures('trajectories')
    
    // Find trajectory for this well
    const trajectory = trajectoryFeatures.find(f =>
        String(f.properties['SHORT_NM']).toLowerCase().includes(wellName.toLowerCase()) ||
        String(f.properties['BOREHOLE_D']).toLowerCase().includes(wellName.toLowerCase())
    )
    
    if (!trajectory) return { error: `Trajectory not found for well '${wellName}'` }
    
    const result: Record<string, unknown> = {
        well_name: wellName,
        trajectory_length: trajectory.properties['Shape_Length'],
        has_trajectory: true
    }
    
    // Check intersection with other layers
    if (intersectLayer) {
        const otherFeatures = await getLayerFeatures(intersectLayer)
        const turfTrajectory = turf.feature(trajectory.geometry as any, trajectory.properties)
        
        const intersecting = otherFeatures
            .map(feat => {
                const turfFeat = turf.feature(feat.geometry as any, feat.properties)
                try {
                    const intersects = turf.booleanIntersects(turfTrajectory, turfFeat)
                    if (!intersects) return null
                    
                    const meta = LAYER_META[intersectLayer]
                    return {
                        name: feat.properties[meta.nameField],
                        properties: feat.properties
                    }
                } catch (e) {
                    return null
                }
            })
            .filter((r): r is { name: unknown; properties: Record<string, unknown> } => r !== null)
            .slice(0, 10)
        
        result.intersecting_features = intersecting
        result.intersect_count = intersecting.length
    }
    
    return result
}
