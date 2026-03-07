import { NextRequest, NextResponse } from 'next/server'
import { getLayerFeatures, LAYER_META, type LayerName } from '@/lib/ndr-agents/tools/geo-tools'

function getCentroid(geometry: { type: string; coordinates: unknown }): { lat: number; lon: number } | null {
    if (!geometry) return null
    if (geometry.type === 'Point') {
        const c = geometry.coordinates as [number, number]
        return { lon: c[0], lat: c[1] }
    }
    if (geometry.type === 'Polygon') {
        const coords = (geometry.coordinates as [number, number][][])[0]
        return {
            lat: coords.reduce((s, c) => s + c[1], 0) / coords.length,
            lon: coords.reduce((s, c) => s + c[0], 0) / coords.length,
        }
    }
    if (geometry.type === 'MultiPolygon') {
        const all = (geometry.coordinates as [number, number][][][]).flat(2)
        return {
            lat: all.reduce((s, c) => s + c[1], 0) / all.length,
            lon: all.reduce((s, c) => s + c[0], 0) / all.length,
        }
    }
    if (geometry.type === 'LineString') {
        const coords = geometry.coordinates as [number, number][]
        return {
            lat: coords.reduce((s, c) => s + c[1], 0) / coords.length,
            lon: coords.reduce((s, c) => s + c[0], 0) / coords.length,
        }
    }
    return null
}

// Map layer string from AI response to LayerName
function resolveLayer(raw: string): LayerName {
    const r = raw.toLowerCase()
    if (r.includes('well') || r === 'wells') return 'wells'
    if (r.includes('field')) return 'fields'
    if (r.includes('block')) return 'blocks'
    if (r.includes('seismic3d') || r.includes('3d')) return 'seismic3d'
    if (r.includes('seismic2d') || r.includes('2d')) return 'seismic2d'
    if (r.includes('trajector')) return 'trajectories'
    return 'fields'
}

export async function POST(req: NextRequest) {
    try {
        const { layer: layerRaw, identifiers } = await req.json() as {
            layer: string
            identifiers: string[]
        }

        const layer = resolveLayer(layerRaw)
        const features = await getLayerFeatures(layer)
        const meta = LAYER_META[layer]

        const points: { lat: number; lon: number; name: string }[] = []

        for (const id of identifiers) {
            const feat = features.find(f =>
                String(f.properties[meta.idField]) === id ||
                String(f.properties[meta.nameField]).toLowerCase().includes(id.toLowerCase())
            )
            if (!feat) continue
            const centroid = getCentroid(feat.geometry)
            if (!centroid) continue
            points.push({ ...centroid, name: String(feat.properties[meta.nameField]) })
        }

        return NextResponse.json({ points, layer })
    } catch (err) {
        console.error('[resolve-geometry]', err)
        return NextResponse.json({ error: 'Failed to resolve geometry', points: [] }, { status: 500 })
    }
}
