/**
 * NDR GeoJSON Data Tools
 * Pure functions that query in-memory feature data loaded from /public/data/*.json
 * These are the "tools" available to the NDR agents.
 * NOTE: This file runs server-side only (API routes). Uses fs to read files directly.
 */

import fs from 'fs'
import path from 'path'

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

export type LayerName = 'wells' | 'fields' | 'blocks' | 'seismic2d' | 'seismic3d' | 'trajectories' | 'gng_projects'

// Layer metadata — maps logical layer names to file paths and display info
export const LAYER_META: Record<LayerName, { file: string; label: string; idField: string; nameField: string }> = {
    wells: { file: 'Wells.json', label: 'Wells', idField: 'OBJECTID', nameField: 'IDENTIFICA' },
    fields: { file: 'HC_Fields.json', label: 'Hydrocarbon Fields', idField: 'OBJECTID', nameField: 'FIELD_NAME' },
    blocks: { file: 'Offshore_Blocks.json', label: 'Offshore Blocks', idField: 'OBJECTID', nameField: 'BlokNummer' },
    seismic2d: { file: 'Seismic_2D_Surveys.json', label: 'Seismic 2D Surveys', idField: 'OBJECTID', nameField: 'line_name' },
    seismic3d: { file: 'Seismic_3D_Surveys.json', label: 'Seismic 3D Surveys', idField: 'OBJECTID', nameField: 'SURVEY_ID' },
    trajectories: { file: 'Wells_Trajectories.json', label: 'Well Trajectories', idField: 'OBJECTID', nameField: 'SHORT_NM' },
    gng_projects: { file: 'GnG_Project_Data_Outlines.json', label: 'G&G Project Outlines', idField: 'OBJECTID', nameField: 'PROJECT_NAME' },
}

// --- In-memory cache ---
const _cache: Partial<Record<LayerName, Feature[]>> = {}

export async function getLayerFeatures(layer: LayerName): Promise<Feature[]> {
    if (_cache[layer]) return _cache[layer]!

    const filePath = path.join(process.cwd(), 'public', 'data', LAYER_META[layer].file)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const geojson: FeatureCollection = JSON.parse(raw)
    _cache[layer] = geojson.features
    return geojson.features
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
    const nearby = targetFeatures
        .map(feat => {
            const centroid = getCentroid(feat.geometry)
            if (!centroid) return null
            const distKm = haversineKm(oLat, oLon, centroid[0], centroid[1])
            return { distKm, properties: feat.properties }
        })
        .filter((r): r is { distKm: number; properties: Record<string, unknown> } => r !== null && r.distKm <= radiusKm)
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, limit)
        .map(r => ({ ...r.properties, distance_km: r.distKm.toFixed(1) }))

    return nearby
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
