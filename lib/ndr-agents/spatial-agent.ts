import Groq from 'groq-sdk'
import {
    tool_find_nearby_features,
    tool_get_features_within_area,
    tool_filter_features,
    tool_find_directional_features,
    tool_find_features_between,
    tool_find_temporal_spatial_features,
    tool_intersect_features,
    tool_analyze_trajectory,
    tool_spatial_aggregate,
    tool_fuzzy_find_feature,
    tool_get_feature_by_id,
    type LayerName,
} from './tools/geo-tools'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const SMALL_MODEL = process.env.GROQ_MODEL_SMALL || 'llama-3.1-8b-instant'

type AgentContext = Record<string, unknown>

export type SpatialResult = {
    answer: string
    spatialData?: object[]
    mapActions?: {
        action: 'highlight' | 'zoom'
        layer: string
        identifiers: string[]
        radiusInfo?: { originLayer: string; originId: string; radiusKm: number }
    }[]
    isDeterministic?: boolean
}

// Helper: Normalize identifiers
function normalizeIdentifier(id: string): string {
    if (!id) return id
    let normalized = id.replace(/^(block|field|well)\s*/i, '')
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toUpperCase()
    return normalized
}

// Helper: Extract feature name
async function extractFeatureName(query: string, layer?: LayerName): Promise<string | null> {
    const patterns = [
        /(?:inside|within|in)\s+([A-Z]\d{1,2}(?:-[A-Z]?\d?)?)\s+(?:block|field|well)/i,
        /(?:block|field|well)\s+(?:named?\s+)?["']?([A-Z]\d{1,2}(?:-[A-Z]?\d?)?)["']?/i,
        /\b([A-Z]\d{1,2}(?:-[A-Z0-9]+)?)\b/i,
        /\b([A-Z]\/\d{1,2}(?:[-][A-Z0-9-]+)?)\b/i,
    ]
    for (const p of patterns) {
        const m = query.match(p)
        if (m) return normalizeIdentifier(m[1])
    }
    if (layer) {
        const fuzzy = await tool_fuzzy_find_feature(layer, query, 1)
        if (fuzzy.length > 0) {
            const firstResult = fuzzy[0] as Record<string, unknown>
            if (firstResult._matchedName) return String(firstResult._matchedName)
        }
    }
    return null
}

function detectLayerFromQuery(query: string, fallback: LayerName = 'fields'): LayerName {
    const q = query.toLowerCase()
    if (q.includes('well') || q.includes('borehole')) return 'wells'
    if (q.includes('field')) return 'fields'
    if (q.includes('block')) return 'blocks'
    if (q.includes('license') || q.includes('licence')) return 'licenses'
    return fallback
}

function detectSpatialRelation(query: string): 'near' | 'inside' | 'between' | 'direction' | 'intersect' | null {
    const q = query.toLowerCase()
    if (q.includes('inside') || q.includes('within') || /\\bin\\b/i.test(q)) return 'inside'
    if (q.includes('between')) return 'between'
    if (q.includes('north') || q.includes('south') || q.includes('east') || q.includes('west')) return 'direction'
    if (q.includes('near') || q.includes('close') || q.includes('around')) return 'near'
    if (q.includes('intersect') || q.includes('cross')) return 'intersect'
    return null
}

// DETERMINISTIC: Handle containment queries without LLM
async function handleDeterministicContainment(
    targetLayer: LayerName,
    originLayer: LayerName,
    featureName: string,
): Promise<SpatialResult | null> {
    console.log(`[Spatial Agent] DETERMINISTIC: ${targetLayer} inside ${originLayer} ${featureName}`)
    try {
        const intersections = await tool_intersect_features(originLayer, targetLayer, featureName, 50)
        
        if (!Array.isArray(intersections) || intersections.length === 0) {
            return {
                answer: `No ${targetLayer} found inside ${originLayer} ${featureName}.`,
                spatialData: [],
                isDeterministic: true,
                mapActions: [{ action: 'zoom', layer: originLayer, identifiers: [featureName] }]
            }
        }
        
        const ids = intersections.slice(0, 10).map((f: object) => {
            const record = f as Record<string, unknown>
            return String(record.IDENTIFICA || record.FIELD_NAME || record.BlokNummer || '')
        }).filter(Boolean)
        
        const count = intersections.length
        let answer = `I found ${count} ${targetLayer} inside ${originLayer.slice(0, -1)} ${featureName}.`
        
        if (count > 0) {
            answer += '\n\n'
            if (targetLayer === 'wells') {
                answer += '| Name | Operator | Result | Status |\n|---|---|---|---|\n'
                intersections.forEach((f: object) => {
                    const p = (f as { properties: Record<string, unknown> }).properties || {}
                    answer += `| ${p['IDENTIFICA'] || '-'} | ${p['OPERATOR'] || '-'} | ${p['WELL_RESUL'] || '-'} | ${p['STATUS'] || '-'} |\n`
                })
            } else if (targetLayer === 'fields') {
                answer += '| Field Name | Operator | Result |\n|---|---|---|\n'
                intersections.forEach((f: object) => {
                    const p = (f as { properties: Record<string, unknown> }).properties || {}
                    answer += `| ${p['FIELD_NAME'] || '-'} | ${p['OPERATOR'] || '-'} | ${p['RESULT'] || '-'} |\n`
                })
            } else if (targetLayer === 'blocks') {
                answer += '| Block Number | Area (sqkm) |\n|---|---|\n'
                intersections.forEach((f: object) => {
                    const p = (f as { properties: Record<string, unknown> }).properties || {}
                    answer += `| ${p['BlokNummer'] || '-'} | ${p['Area_sqkm'] ? Number(p['Area_sqkm']).toFixed(2) : '-'} |\n`
                })
            } else {
                answer += '| Identifier |\n|---|\n'
                intersections.forEach((f: object) => {
                    const p = (f as { properties: Record<string, unknown> }).properties || {}
                    const name = p['IDENTIFICA'] || p['FIELD_NAME'] || p['BlokNummer'] || p['licence_nm'] || p['SURVEY_ID'] || 'Unknown'
                    answer += `| ${name} |\n`
                })
            }
        }
        
        return {
            answer,
            spatialData: intersections,
            isDeterministic: true,
            mapActions: ids.length > 0 ? [
                { action: 'highlight', layer: targetLayer, identifiers: ids },
                { action: 'zoom', layer: originLayer, identifiers: [featureName] }
            ] : undefined
        }
    } catch (e) {
        console.error('[Spatial Agent] Deterministic containment failed:', e)
        return null
    }
}

// Main spatial agent
export async function runSpatialReasoningAgent(
    userQuery: string, 
    _context: AgentContext,
    history?: { role: string; content: string }[]
): Promise<SpatialResult> {
    const q = userQuery.toLowerCase()
    const mapActions: SpatialResult['mapActions'] = []

    let originLayer: LayerName = 'fields'
    let targetLayer: LayerName = 'wells'
    
    const spatialRelation = detectSpatialRelation(userQuery)
    
    // For containment: target=wells, origin=blocks
    if (spatialRelation === 'inside') {
        const queryParts = q.split(/\\b(?:inside|within|in)\\b/i)
        targetLayer = detectLayerFromQuery(queryParts[0], 'wells')
        originLayer = detectLayerFromQuery(queryParts[1] || q, 'blocks')
    } else {
        targetLayer = detectLayerFromQuery(q, 'wells')
        originLayer = detectLayerFromQuery(q, 'fields')
    }
    
    const featureName = await extractFeatureName(userQuery, originLayer)
    console.log(`[Spatial Agent] target: ${targetLayer}, origin: ${originLayer}, relation: ${spatialRelation}, feature: ${featureName}`)

    // DETERMINISTIC PATH for containment
    if (spatialRelation === 'inside' && featureName) {
        const deterministicResult = await handleDeterministicContainment(targetLayer, originLayer, featureName)
        if (deterministicResult) {
            console.log('[Spatial Agent] Returning DETERMINISTIC result, no LLM')
            return deterministicResult
        }
    }

    // Fallback: Use LLM to generate a natural response instead of a hardcoded string
    console.log('[Spatial Agent] Falling back to LLM for spatial understanding reasoning')
    const systemPrompt = `You are the NDR Spatial Agent. Summarize spatial relationships or actions taken based on the user's query and the extracted parameters. Be concise and natural, writing as a helpful assistant that understands geology and geography.`
    
    const completion = await groq.chat.completions.create({
        model: SMALL_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            ...(history || []).filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            {
                role: 'user',
                content: `Query: "${userQuery}"\nExtracted Parameters:\n- Target Layer: ${targetLayer}\n- Origin Layer: ${originLayer}\n- Feature Name: ${featureName || 'unspecified'}\n- Spatial Relation: ${spatialRelation || 'unspecified'}\n\nGenerate a concise, natural response acknowledging the spatial intent of this query. Do not say you are an AI. Explain what you are visualizing or processing.`
            }
        ],
        temperature: 0.2,
        max_tokens: 300,
    })

    const answer = completion.choices[0]?.message?.content || `Processed ${targetLayer} relative to ${originLayer}${featureName ? ` at ${featureName}` : ''}.`

    return {
        answer,
        spatialData: [],
        mapActions: mapActions.length > 0 ? mapActions : undefined,
    }
}
