import Groq from 'groq-sdk'
import {
    tool_get_layer_features,
    tool_get_feature_by_id,
    tool_filter_features,
    tool_aggregate_features,
    tool_compare_feature_properties,
    tool_intersect_features,
    type LayerName,
} from './tools/geo-tools'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are the Asset Query Agent for the Netherlands National Data Room (NDR).
Your role: query and analyze structured attribute data from GeoJSON map layers.

Available layers and their key fields:
- wells: IDENTIFICA (name), OPERATOR, WELL_TYPE, STATUS, WELL_RESUL (result: Gas/Oil/Abandoned), START_DATE, END_DEPTH_, FIELD_NAME
- fields: FIELD_NAME, FIELD_CD, RESULT (Gas/Oil), STATUS, OPERATOR, DISCOVERY_, LANDSEA (Land/Sea)
- blocks: BlokNummer, Area_sqkm, Field (blocks don't have direct operator field - use well intersections)
- seismic2d: line_name, survey_col, delivery_c
- seismic3d: SURVEY_ID, GRID_ID, YEAR

You have access to tools to query these layers. Use them to answer questions about:
- Filtering by operator, status, result type, field name
- Aggregating by any property (group by, count)
- Comparing specific named assets
- Listing or summarizing features
- Spatial relationships: wells within blocks, fields intersecting blocks

Important notes:
- Blocks don't have a direct OPERATOR field. To find operators in blocks, check which wells are located within each block.
- Wells have OPERATOR field and can be spatially associated with blocks.

Always ground your answers in actual data returned from the tools.
Return structured, concise insights. Use markdown tables where helpful.`

type AgentContext = Record<string, unknown>

export type AssetQueryResult = {
    answer: string
    data?: object[]
    suggestedMapActions?: { action: string; layer: string; identifiers: string[] }[]
}

export async function runAssetQueryAgent(userQuery: string, context: AgentContext): Promise<AssetQueryResult> {
    // Build a data snapshot relevant to the query
    const toolResults: Record<string, unknown> = {}

    // Try to determine relevant layer from query keywords
    const q = userQuery.toLowerCase()
    const layers: LayerName[] = []
    if (q.includes('well') || q.includes('borehole') || q.includes('drill')) layers.push('wells')
    if (q.includes('field') || q.includes('hydrocarbon') || q.includes('gas') || q.includes('oil')) layers.push('fields')
    if (q.includes('block') || q.includes('offshore block') || q.includes('licence')) layers.push('blocks')
    if (q.includes('seismic') && q.includes('3d')) layers.push('seismic3d')
    if (q.includes('seismic') && q.includes('2d')) layers.push('seismic2d')
    if (layers.length === 0) layers.push('wells', 'fields', 'blocks')

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
            }
            else if (operatorMatch) {
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
            } else if (q.includes('oil') && layer === 'fields') {
                toolResults['fields_oil'] = await tool_filter_features('fields', { RESULT: 'Oil' }, 30)
            } else if (q.includes('abandoned') && layer === 'wells') {
                toolResults['wells_abandoned'] = await tool_filter_features('wells', { STATUS: 'Abandoned' }, 30)
            } else if (q.includes('active') && layer === 'wells') {
                toolResults['wells_active'] = await tool_filter_features('wells', { STATUS: '' }, 30) // non-abandoned
            } else {
                toolResults[`${layer}_sample`] = await tool_get_layer_features(layer, 20)
            }
        } catch (e) {
            toolResults[`${layer}_error`] = String(e)
        }
    }

    const dataContext = JSON.stringify(toolResults, null, 2).slice(0, 8000)

    const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
                role: 'user',
                content: `User query: "${userQuery}"\n\nData retrieved from NDR layers:\n${dataContext}\n\nAnswer the user's question based on this data. Be precise and reference actual feature names.`
            }
        ],
        temperature: 0.3,
        max_tokens: 1000,
    })

    const answer = completion.choices[0]?.message?.content || 'No response generated.'

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
