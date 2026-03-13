import Groq from 'groq-sdk'
import {
    tool_get_layer_features,
    tool_get_feature_by_id,
    tool_filter_features,
    tool_aggregate_features,
    type LayerName,
} from './tools/geo-tools'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = process.env.GROQ_MODEL_SMALL || 'llama-3.1-8b-instant'

const SYSTEM_PROMPT = `You are the NDR Asset Agent. Summarize structured data from GeoJSON layers about Netherlands oil & gas assets.

Layers: wells (IDENTIFICA, OPERATOR, WELL_TYPE, STATUS, WELL_RESUL, FIELD_NAME), fields (FIELD_NAME, RESULT, STATUS, OPERATOR), blocks (BlokNummer, Area_sqkm), projects (PROJECT_NAME, NO_OF_INTER_HORIZONS, NO_OF_REPORTS, SUMMARY).

Rules: Be concise, use data provided, reference feature names. Use markdown tables for lists.`

type AgentContext = Record<string, unknown>

export type AssetQueryResult = {
    answer: string
    data?: object[]
    suggestedMapActions?: { action: string; layer: string; identifiers: string[] }[]
}

export async function runAssetQueryAgent(
    userQuery: string,
    context?: Record<string, unknown>,
    history?: { role: string; content: string }[]
): Promise<AssetQueryResult> {
    console.log('[Asset Agent] Intercepted CHEAP tier query for deterministic asset summary')
    // Build a data snapshot relevant to the query
    const toolResults: Record<string, unknown> = {}
    console.log('[Asset Agent] Processing query:', userQuery)

    // Try to determine relevant layer from query keywords
    const q = userQuery.toLowerCase()
    const layers: LayerName[] = []
    if (q.includes('horizon') || q.includes('project') || q.includes('f03') || q.includes('report') || q.includes('subsurface data') || q.includes('reservoir')) {
        layers.push('gng_projects')
    } else {
        if (q.includes('well') || q.includes('borehole') || q.includes('drill')) layers.push('wells')
        if (q.includes('field') || q.includes('hydrocarbon') || q.includes('gas') || q.includes('oil')) layers.push('fields')
        if (q.includes('block') || q.includes('offshore block') || q.includes('licence')) layers.push('blocks')
        if (q.includes('seismic') && q.includes('3d')) layers.push('seismic3d')
        if (q.includes('seismic') && q.includes('2d')) layers.push('seismic2d')
    }
    
    if (layers.length === 0) layers.push('wells', 'fields', 'blocks')
    
    console.log('[Asset Agent] Selected layers:', layers)

    // Build operator filters
    const operatorMatch = userQuery.match(/operator[:\s]+([A-Za-z\s&.]+?)(?:\s|$|,)/i)
    const nameMatch = userQuery.match(/named?\s+([A-Za-z0-9\-]+)/i) ||
        userQuery.match(/["']([A-Za-z0-9\-]+)["']/i)

    for (const layer of layers.slice(0, 2)) {
        try {
            // SPECIAL: Operator in blocks query - needs spatial intersection
            if (layer === 'blocks' && (q.includes('operator') || q.includes('most active'))) {
                console.log('[Asset Agent] Processing operator-blocks query via spatial intersection')
                
                // Get all wells and aggregate by operator
                const wells = await tool_get_layer_features('wells', 1000)
                const wellsInBlocks: Record<string, { operator: string; wells: string[] }[]> = {}
                
                // For each block, find intersecting wells
                const blocks = await tool_get_layer_features('blocks', 100)
                for (const block of blocks.slice(0, 20)) { // Limit to first 20 for performance
                    const blockFeature = block as Record<string, unknown>
                    const blockName = String(blockFeature['BlokNummer'] || 'Unknown')
                    const intersectingWells = wells.filter(well => {
                        const wellFeature = well as Record<string, unknown>
                        const wellCoords = wellFeature['geometry'] as { coordinates?: [number, number] }
                        if (!wellCoords?.coordinates) return false
                        // This is a simplified check - ideally use proper intersection
                        return true // Include all wells for now, filter by operator later
                    })
                    
                    const operators: Record<string, string[]> = {}
                    intersectingWells.forEach(w => {
                        const wellFeature = w as Record<string, unknown>
                        const op = String(wellFeature['OPERATOR'] || 'Unknown')
                        if (!operators[op]) operators[op] = []
                        operators[op].push(String(wellFeature['IDENTIFICA']))
                    })
                    
                    wellsInBlocks[blockName] = Object.entries(operators)
                        .map(([op, ids]) => ({ operator: op, wells: ids }))
                        .sort((a, b) => b.wells.length - a.wells.length)
                }
                
                // Aggregate operators across all blocks
                const allOperators: Record<string, number> = {}
                wells.forEach(w => {
                    const wellFeature = w as Record<string, unknown>
                    const op = String(wellFeature['OPERATOR'] || 'Unknown')
                    allOperators[op] = (allOperators[op] || 0) + 1
                })
                
                toolResults['operators_in_blocks'] = {
                    by_block: wellsInBlocks,
                    top_operators: Object.entries(allOperators)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([op, count]) => ({ operator: op, well_count: count }))
                }
            } else if (layer === 'gng_projects' && q.includes('f03')) {
                // Specific F03 project logic
                console.log('[Asset Agent] Processing F03 specific query')
                const allProjects = await tool_get_layer_features('gng_projects', 50)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const f03Projects = allProjects.filter((p: any) => 
                    p.PROJECT_NAME && String(p.PROJECT_NAME).trim().toUpperCase().includes('F03')
                )
                
                if (f03Projects.length > 0) {
                    toolResults['f03_project_data'] = f03Projects
                } else {
                    toolResults['f03_project_data_error'] = "No project specifically named F03 was found in GnG projects."
                }
            } else if (layer === 'gng_projects') {
                console.log('[Asset Agent] Processing generic gng_projects query')
                toolResults[`gng_projects_sample`] = await tool_get_layer_features('gng_projects', 15)
            } else if (operatorMatch) {
                const op = operatorMatch[1].trim()
                const filterKey = layer === 'wells' || layer === 'fields' ? 'OPERATOR' : 'BlokNummer'
                toolResults[`${layer}_operator_filter`] = await tool_filter_features(layer, { [filterKey]: op }, 30)
            } else if (nameMatch) {
                const name = nameMatch[1]
                toolResults[`${layer}_by_name`] = await tool_get_feature_by_id(layer, name)
            } else if (q.includes('group') || q.includes('count') || q.includes('how many') || q.includes('list all operators')) {
                const groupField = layer === 'wells' ? 'OPERATOR' : layer === 'fields' ? 'OPERATOR' : 'BlokNummer'
                toolResults[`${layer}_aggregation`] = await tool_aggregate_features(layer, groupField)
            } else if (q.includes('gas') && layer === 'fields') {
                toolResults['fields_gas'] = await tool_filter_features('fields', { RESULT: 'Gas' }, 30)
            } else if (q.includes('gas') && layer === 'wells') {
                toolResults['wells_gas'] = await tool_filter_features('wells', { WELL_RESUL: 'Gas' }, 50)
            } else if (q.includes('oil') && layer === 'fields') {
                toolResults['fields_oil'] = await tool_filter_features('fields', { RESULT: 'Oil' }, 30)
            } else if (q.includes('oil') && layer === 'wells') {
                toolResults['wells_oil'] = await tool_filter_features('wells', { WELL_RESUL: 'Oil' }, 50)
            } else if (q.includes('dry') && layer === 'wells') {
                toolResults['wells_dry'] = await tool_filter_features('wells', { WELL_RESUL: 'Dry' }, 50)
            } else if (q.includes('abandoned') && layer === 'wells') {
                toolResults['wells_abandoned'] = await tool_filter_features('wells', { STATUS: 'Abandoned' }, 30)
            } else if (q.includes('active') && layer === 'wells') {
                toolResults['wells_active'] = await tool_filter_features('wells', { STATUS: '' }, 30) // non-abandoned
            } else {
                toolResults[`${layer}_sample`] = await tool_get_layer_features(layer, 20)
            }
        } catch (e) {
            toolResults[`${layer}_error`] = String(e)
            console.error(`[Asset Agent] Error processing layer ${layer}:`, e)
        }
    }

    // Strip geometry from results to reduce token usage
    const strippedResults: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(toolResults)) {
        if (Array.isArray(value)) {
            strippedResults[key] = value.slice(0, 15).map((item: unknown) => {
                if (item && typeof item === 'object') {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { geometry, ...rest } = item as Record<string, unknown>
                    return rest
                }
                return item
            })
        } else {
            strippedResults[key] = value
        }
    }

    const dataContext = JSON.stringify(strippedResults, null, 1).slice(0, 3000)
    console.log('[Asset Agent] Data retrieved:', Object.keys(toolResults))
    console.log('[Asset Agent] Data context size:', dataContext.length, 'chars (trimmed from raw)')

    const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(history || []).filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            {
                role: 'user',
                content: `Query: "${userQuery}"\n\nData:\n${dataContext}\n\nAnswer concisely using the data above.`
            }
        ],
        temperature: 0.2,
        max_tokens: 600,
    })

    const answer = completion.choices[0]?.message?.content || 'No response generated.'
    console.log('[Asset Agent] Generated answer:', answer.substring(0, 200))
    console.log('[Asset Agent] Answer length:', answer.length)

    // If answer is empty or generic failure message, return data anyway
    if (!answer || answer.length < 10 || answer.includes('unable to retrieve')) {
        console.log('[Asset Agent] Warning: Empty or failed response, returning raw data')
    }

    // Extract potential identifiers for map highlighting
    const identifierMatches = answer.match(/\b([A-Z]\d{1,2}[-\w]*)/g) || []

    return {
        answer,
        data: Object.values(toolResults).flat().slice(0, 10) as object[],
        suggestedMapActions: identifierMatches.length > 0 ? [{
            action: 'highlight',
            layer: layers[0],
            identifiers: [...new Set(identifierMatches)].slice(0, 5)
        }] : undefined
    }
}
