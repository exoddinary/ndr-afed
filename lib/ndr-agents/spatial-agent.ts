import Groq from 'groq-sdk'
import {
    tool_find_nearby_features,
    tool_get_features_within_area,
    tool_calculate_distance,
    tool_filter_features,
    type LayerName,
} from './tools/geo-tools'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are the Spatial Reasoning Agent for the Netherlands National Data Room (NDR).
Your role: analyze geospatial relationships between map features — proximity, containment, overlap, and spatial extent.

You work with these layers:
- wells (Point): well locations with name IDENTIFICA
- fields (Polygon): hydrocarbon fields with name FIELD_NAME
- blocks (Polygon): offshore blocks with name BlokNummer
- seismic2d (LineString): 2D seismic survey lines
- seismic3d (Polygon): 3D seismic survey grids

When answering spatial questions, reference feature names and distances precisely.
Summarize spatial relationships clearly: which assets are close, overlapping, or contained within an area.
Always mention approximate distances in km when available.`

type AgentContext = Record<string, unknown>

export type SpatialResult = {
    answer: string
    spatialData?: object[]
    mapActions?: {
        action: 'highlight' | 'zoom'
        layer: string
        identifiers: string[]
        geometry?: object
        radiusInfo?: {
            originLayer: string
            originId: string
            radiusKm: number
        }
    }[]
}

// Heuristic to detect the target feature name from the query
function extractFeatureName(query: string): string | null {
    const patterns = [
        /near\s+(?:the\s+)?([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)?)\s+(?:field|block|well)/i,
        /(?:field|block|well)\s+(?:named?\s+)?["']?([A-Za-z0-9\-]+)["']?/i,
        /\b([A-Z][0-9]{1,2}[-][A-Z0-9]+)\b/,
        /["']([A-Za-z0-9\-]+)["']/,
    ]
    for (const p of patterns) {
        const m = query.match(p)
        if (m) return m[1]
    }
    return null
}

function extractRadius(query: string): number {
    const m = query.match(/(\d+)\s*km/i)
    return m ? parseInt(m[1]) : 25
}

function detectLayerFromQuery(query: string, fallback: LayerName = 'fields'): LayerName {
    const q = query.toLowerCase()
    if (q.includes('well') || q.includes('borehole')) return 'wells'
    if (q.includes('field')) return 'fields'
    if (q.includes('block')) return 'blocks'
    if (q.includes('seismic 3d') || q.includes('3d survey')) return 'seismic3d'
    if (q.includes('seismic 2d') || q.includes('2d line')) return 'seismic2d'
    return fallback
}

export async function runSpatialReasoningAgent(userQuery: string, _context: AgentContext): Promise<SpatialResult> {
    const toolResults: Record<string, unknown> = {}
    const q = userQuery.toLowerCase()
    const mapActions: SpatialResult['mapActions'] = []

    const featureName = extractFeatureName(userQuery)
    const radiusKm = extractRadius(userQuery)

    // Better layer detection for nearby
    const pivotIdx = Math.max(
        q.indexOf('near'),
        q.indexOf('within'),
        q.indexOf('around'),
        q.indexOf('close to')
    )

    let originLayer: LayerName = 'fields'
    let targetLayer: LayerName = 'wells'

    if (pivotIdx !== -1) {
        targetLayer = detectLayerFromQuery(q.substring(0, pivotIdx), 'wells')
        originLayer = detectLayerFromQuery(q.substring(pivotIdx), 'fields')
    } else {
        targetLayer = detectLayerFromQuery(q, 'wells')
        originLayer = detectLayerFromQuery(q, 'fields')
    }

    try {
        if (featureName && (q.includes('near') || q.includes('within') || q.includes('around') || q.includes('close to'))) {
            // Nearby search
            const nearby = await tool_find_nearby_features(originLayer, featureName, targetLayer, radiusKm, 15)
            toolResults['nearby_features'] = nearby
            toolResults['search_params'] = { origin: featureName, radius_km: radiusKm, layer: targetLayer }

            if (Array.isArray(nearby) && nearby.length > 0) {
                const ids = nearby.slice(0, 5).map((f: unknown) => {
                    const r = f as Record<string, unknown>
                    return String(r.IDENTIFICA || r.FIELD_NAME || r.BlokNummer || r.SURVEY_ID || '')
                }).filter(Boolean)
                if (ids.length > 0) {
                    mapActions.push({
                        action: 'highlight',
                        layer: targetLayer,
                        identifiers: ids,
                        radiusInfo: {
                            originLayer,
                            originId: featureName,
                            radiusKm
                        }
                    })
                }
            }
        } else if (q.includes('within') && (q.includes('area') || q.includes('region') || q.includes('netherlands'))) {
            // Netherlands bounding box: ~50.7–55.1 N, 2.6–7.2 E
            const bbox = { minLat: 51.5, maxLat: 55.5, minLon: 2.5, maxLon: 7.5 }
            toolResults['area_features'] = await tool_get_features_within_area(targetLayer, bbox, 30)
        } else if (q.includes('distance') && featureName) {
            // Distance calculation between two featured
            const match2 = userQuery.match(/and\s+(?:the\s+)?([A-Za-z0-9\-]+)/i)
            const id2 = match2?.[1] || featureName
            toolResults['distance'] = await tool_calculate_distance(originLayer, featureName, targetLayer, id2)
        } else if (q.includes('intersect') || q.includes('overlap') || q.includes('inside')) {
            // Get features in Netherlands area
            const bbox = { minLat: 51.0, maxLat: 56.0, minLon: 2.0, maxLon: 8.0 }
            const [src, tgt] = await Promise.all([
                tool_get_features_within_area(originLayer, bbox, 20),
                tool_get_features_within_area(targetLayer, bbox, 20),
            ])
            toolResults['source_features'] = src
            toolResults['target_features'] = tgt
        } else if (featureName) {
            // Default: find nearby on any query mentioning a feature name
            const nearby = await tool_find_nearby_features('fields', featureName, 'wells', 50, 10)
            toolResults['nearby_wells'] = nearby
            toolResults['search_origin'] = featureName
        } else {
            // Fallback: list some fields in the area
            toolResults['fields_sample'] = await tool_filter_features('fields', { LANDSEA: 'Offshore' }, 20)
        }
    } catch (e) {
        toolResults['error'] = String(e)
    }

    const dataContext = JSON.stringify(toolResults, null, 2).slice(0, 8000)

    const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
                role: 'user',
                content: `User spatial query: "${userQuery}"\n\nSpatial analysis results:\n${dataContext}\n\nProvide a precise spatial interpretation based on this data. Reference feature names and distances where available.`
            }
        ],
        temperature: 0.2,
        max_tokens: 800,
    })

    const answer = completion.choices[0]?.message?.content || 'No spatial result generated.'

    return {
        answer,
        spatialData: (toolResults['nearby_features'] || toolResults['area_features'] || []) as object[],
        mapActions: mapActions.length > 0 ? mapActions : undefined,
    }
}
