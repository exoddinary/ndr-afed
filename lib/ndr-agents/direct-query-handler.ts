/**
 * NDR AI Direct Query Handler
 * Handles simple deterministic queries without LLM calls
 * Counts, filters, lookups - all done in code
 */

import { 
    getLayerFeatures, 
    tool_filter_features, 
    tool_get_layer_features,
    tool_fuzzy_find_feature,
    LayerName 
} from './tools/geo-tools'

export interface DirectQueryResult {
    answer: string
    data?: object[]
    count?: number
    suggestedMapActions?: { action: string; layer: string; identifiers: string[] }[]
    executionTimeMs: number
    tier: 'CHEAP'
}

/**
 * Handle direct count queries
 * Example: "How many offshore blocks are there?"
 */
export async function handleCountQuery(
    query: string, 
    layerHint?: string | null
): Promise<DirectQueryResult | null> {
    const startTime = Date.now()
    const q = query.toLowerCase()
    
    // Determine target layer
    let layer: LayerName = 'blocks'
    if (/\b(wells?|boreholes?)\b/i.test(q)) layer = 'wells'
    else if (/\b(fields?|hydrocarbon)\b/i.test(q)) layer = 'fields'
    else if (/\b(blocks?|offshore)\b/i.test(q)) layer = 'blocks'
    else if (/\b(licenses?)\b/i.test(q)) layer = 'licenses'
    else if (layerHint) {
        if (['wells', 'fields', 'blocks', 'licenses'].includes(layerHint)) {
            layer = layerHint as LayerName
        }
    }
    
    // Check for filters
    const filters: Record<string, string> = {}
    
    // Well-specific filters
    if (layer === 'wells') {
        if (/\bgas\b/i.test(q)) filters['WELL_RESUL'] = 'Gas'
        else if (/\boil\b/i.test(q)) filters['WELL_RESUL'] = 'Oil'
        else if (/\bdry\b/i.test(q)) filters['WELL_RESUL'] = 'Dry'
        
        if (/\bactive\b/i.test(q)) filters['STATUS'] = 'Active'
        if (/\babandoned\b/i.test(q)) filters['STATUS'] = 'Abandoned'
        
        // Operator filter
        const operatorMatch = q.match(/\b(shell|nam|total|petronas|exxon|bp|chevron)\b/i)
        if (operatorMatch) filters['OPERATOR'] = operatorMatch[1]
    }
    
    // Field-specific filters
    if (layer === 'fields') {
        if (/\bgas\b/i.test(q)) filters['RESULT'] = 'Gas'
        else if (/\boil\b/i.test(q)) filters['RESULT'] = 'Oil'
    }
    
    try {
        const features = await getLayerFeatures(layer)
        let filteredCount = features.length
        let filteredFeatures = features
        
        // Apply filters if any
        if (Object.keys(filters).length > 0) {
            filteredFeatures = features.filter(feat => 
                Object.entries(filters).every(([key, value]) => {
                    const propValue = String(feat.properties[key] || '').toLowerCase()
                    return propValue.includes(value.toLowerCase())
                })
            )
            filteredCount = filteredFeatures.length
        }
        
        // Build human-readable answer
        const layerName = layer.charAt(0).toUpperCase() + layer.slice(1)
        let filterDesc = ''
        if (filters.WELL_RESUL) filterDesc = ` with ${filters.WELL_RESUL.toLowerCase()} result`
        if (filters.STATUS) filterDesc += ` and ${filters.STATUS.toLowerCase()} status`
        if (filters.OPERATOR) filterDesc += ` operated by ${filters.OPERATOR}`
        if (filters.RESULT) filterDesc = ` with ${filters.RESULT.toLowerCase()} result`
        
        const answer = `There ${filteredCount === 1 ? 'is' : 'are'} ${filteredCount} ${layerName.toLowerCase()}${filterDesc} in the dataset.`
        
        return {
            answer,
            count: filteredCount,
            data: filteredFeatures.slice(0, 10).map(f => f.properties),
            executionTimeMs: Date.now() - startTime,
            tier: 'CHEAP',
            suggestedMapActions: filteredFeatures.slice(0, 5).map(f => ({
                action: 'highlight',
                layer,
                identifiers: [String(f.properties['OBJECTID'] || f.properties['IDENTIFICA'] || f.properties['FIELD_NAME'] || f.properties['BlokNummer'] || '')]
            })).filter(a => a.identifiers[0])
        }
    } catch (error) {
        console.error('[DirectHandler] Count query failed:', error)
        return null
    }
}

/**
 * Handle direct filter/list queries
 * Example: "Show all gas wells" or "List fields operated by Shell"
 */
export async function handleFilterQuery(
    query: string,
    layerHint?: string | null
): Promise<DirectQueryResult | null> {
    const startTime = Date.now()
    const q = query.toLowerCase()
    
    // Determine target layer
    let layer: LayerName = 'wells'
    if (/\b(fields?|hydrocarbon)\b/i.test(q)) layer = 'fields'
    else if (/\b(blocks?)\b/i.test(q)) layer = 'blocks'
    else if (layerHint && ['wells', 'fields', 'blocks', 'licenses'].includes(layerHint)) {
        layer = layerHint as LayerName
    }
    
    // Build filters from query
    const filters: Record<string, string> = {}
    
    // Result/Type filters
    if (/\bgas\b/i.test(q)) {
        if (layer === 'wells') filters['WELL_RESUL'] = 'Gas'
        if (layer === 'fields') filters['RESULT'] = 'Gas'
    } else if (/\boil\b/i.test(q)) {
        if (layer === 'wells') filters['WELL_RESUL'] = 'Oil'
        if (layer === 'fields') filters['RESULT'] = 'Oil'
    } else if (/\bdry\b/i.test(q)) {
        if (layer === 'wells') filters['WELL_RESUL'] = 'Dry'
    }
    
    // Status filters
    if (/\bactive\b/i.test(q)) filters['STATUS'] = 'Active'
    if (/\babandoned\b/i.test(q)) filters['STATUS'] = 'Abandoned'
    
    // Operator filters
    const operatorMatch = q.match(/\b(shell|nam|total|petronas|exxon|bp|chevron|petrochina|conocophillips)\b/i)
    if (operatorMatch) {
        filters['OPERATOR'] = operatorMatch[1]
    }
    
    try {
        const features = await getLayerFeatures(layer)
        
        // Apply filters
        let filtered = features
        if (Object.keys(filters).length > 0) {
            filtered = features.filter(feat =>
                Object.entries(filters).every(([key, value]) => {
                    const propValue = String(feat.properties[key] || '').toLowerCase()
                    return propValue.includes(value.toLowerCase())
                })
            )
        }
        
        // Limit results
        const limit = /\ball\b/i.test(q) ? 100 : 20
        const results = filtered.slice(0, limit)
        
        // Build answer
        const layerName = layer.charAt(0).toUpperCase() + layer.slice(1)
        const filterDesc = Object.entries(filters).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(', ')
        
        let answer: string
        if (results.length === 0) {
            answer = `No ${layerName.toLowerCase()} found matching your criteria.`
        } else if (results.length === 1) {
            const name = results[0].properties['IDENTIFICA'] || 
                        results[0].properties['FIELD_NAME'] || 
                        results[0].properties['BlokNummer'] || 
                        'Unknown'
            answer = `Found 1 ${layerName.toLowerCase().slice(0, -1)}: ${name}${filterDesc ? ` (${filterDesc})` : ''}`
        } else {
            answer = `Found ${filtered.length} ${layerName.toLowerCase()}${filterDesc ? ` with ${filterDesc}` : ''}. Showing ${results.length}:`
            
            // Add list of names
            const names = results.map(f => 
                f.properties['IDENTIFICA'] || 
                f.properties['FIELD_NAME'] || 
                f.properties['BlokNummer'] || 
                'Unknown'
            ).filter(n => n !== 'Unknown')
            
            if (names.length > 0) {
                answer += '\n\n' + names.slice(0, 10).join(', ')
                if (names.length > 10) {
                    answer += `, and ${names.length - 10} more...`
                }
            }
        }
        
        return {
            answer,
            count: results.length,
            data: results.map(f => ({
                id: f.properties['OBJECTID'],
                name: f.properties['IDENTIFICA'] || f.properties['FIELD_NAME'] || f.properties['BlokNummer'],
                ...f.properties
            })),
            executionTimeMs: Date.now() - startTime,
            tier: 'CHEAP',
            suggestedMapActions: results.slice(0, 5).map(f => ({
                action: 'highlight',
                layer,
                identifiers: [String(f.properties['OBJECTID'] || f.properties['IDENTIFICA'] || f.properties['FIELD_NAME'] || f.properties['BlokNummer'] || '')]
            })).filter(a => a.identifiers[0])
        }
    } catch (error) {
        console.error('[DirectHandler] Filter query failed:', error)
        return null
    }
}

/**
 * Handle lookup by name/ID
 * Example: "Find block B13" or "Show well D/11-A-1"
 */
export async function handleLookupQuery(
    query: string,
    layerHint?: string | null
): Promise<DirectQueryResult | null> {
    const startTime = Date.now()
    const q = query.toLowerCase()
    
    // Try to extract identifier
    const identifierMatch = q.match(/\b([A-Z]\d{1,2}[-\w]*|[A-Z]\/\d{1,2}[-\w-]*)\b/i)
    if (!identifierMatch) return null
    
    const identifier = identifierMatch[1]
    
    // Determine likely layer from identifier pattern
    let layer: LayerName = 'blocks'
    if (/\//.test(identifier)) layer = 'wells'  // Wells have / in names like D/11-A-1
    else if (/^[A-Z]\d+$/.test(identifier)) layer = 'blocks'  // Blocks like B13
    else layer = layerHint as LayerName || 'wells'
    
    try {
        const features = await getLayerFeatures(layer)
        
        // Search for matching feature
        const match = features.find(f => {
            const nameFields = ['IDENTIFICA', 'FIELD_NAME', 'BlokNummer', 'licence_nm', 'SURVEY_ID']
            return nameFields.some(field => {
                const value = String(f.properties[field] || '').toLowerCase()
                return value.includes(identifier.toLowerCase())
            })
        })
        
        if (!match) {
            return {
                answer: `Could not find ${layer.slice(0, -1)} matching "${identifier}".`,
                executionTimeMs: Date.now() - startTime,
                tier: 'CHEAP'
            }
        }
        
        const name = match.properties['IDENTIFICA'] || 
                    match.properties['FIELD_NAME'] || 
                    match.properties['BlokNummer'] ||
                    identifier
        
        return {
            answer: `Found ${layer.slice(0, -1)}: ${name}`,
            data: [match.properties],
            executionTimeMs: Date.now() - startTime,
            tier: 'CHEAP',
            suggestedMapActions: [{
                action: 'zoom',
                layer,
                identifiers: [String(match.properties['OBJECTID'] || identifier)]
            }]
        }
    } catch (error) {
        console.error('[DirectHandler] Lookup query failed:', error)
        return null
    }
}

/**
 * Main entry point - route to appropriate handler
 */
export async function handleDirectQuery(
    query: string,
    layerHint?: string | null
): Promise<DirectQueryResult | null> {
    const q = query.toLowerCase()
    
    // Count queries
    if (/\b(how many|count|total number of|how much)\b/i.test(q)) {
        return handleCountQuery(query, layerHint)
    }
    
    // Lookup by identifier
    if (/\b(find|show|get|lookup|where is)\b/i.test(q) && /\b([A-Z]\d{1,2}[-\w]*|[A-Z]\/\d{1,2}[-\w-]*)\b/i.test(q)) {
        return handleLookupQuery(query, layerHint)
    }
    
    // List/filter queries
    if (/\b(list|show|all|display|give me)\b/i.test(q) || 
        /\b(gas|oil|dry|active|abandoned)\b/i.test(q)) {
        return handleFilterQuery(query, layerHint)
    }
    
    // Aggregation queries
    if (/\b(group by|aggregate|by operator|by status)\b/i.test(q)) {
        return handleAggregationQuery(query, layerHint)
    }
    
    return null
}

/**
 * Handle aggregation queries
 * Example: "How many wells by operator?" or "Group fields by result"
 */
async function handleAggregationQuery(
    query: string,
    layerHint?: string | null
): Promise<DirectQueryResult | null> {
    const startTime = Date.now()
    const q = query.toLowerCase()
    
    // Determine layer
    let layer: LayerName = 'wells'
    if (/\b(fields?)\b/i.test(q)) layer = 'fields'
    else if (layerHint && ['wells', 'fields', 'blocks'].includes(layerHint)) {
        layer = layerHint as LayerName
    }
    
    // Determine group field
    let groupField = 'OPERATOR'
    if (/\b(by|group).*result/i.test(q)) {
        groupField = layer === 'wells' ? 'WELL_RESUL' : 'RESULT'
    } else if (/\b(by|group).*status/i.test(q)) {
        groupField = 'STATUS'
    } else if (/\b(by|group).*type/i.test(q)) {
        groupField = 'TYPE'
    }
    
    try {
        const features = await getLayerFeatures(layer)
        
        // Group and count
        const groups: Record<string, number> = {}
        features.forEach(f => {
            const key = String(f.properties[groupField] || 'Unknown')
            groups[key] = (groups[key] || 0) + 1
        })
        
        // Sort by count
        const sorted = Object.entries(groups)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
        
        const layerName = layer.charAt(0).toUpperCase() + layer.slice(1)
        
        let answer = `${layerName} by ${groupField}:\n\n`
        sorted.forEach(([key, count]) => {
            answer += `- ${key}: ${count}\n`
        })
        
        return {
            answer,
            data: sorted.map(([key, count]) => ({ [groupField]: key, count })),
            executionTimeMs: Date.now() - startTime,
            tier: 'CHEAP'
        }
    } catch (error) {
        console.error('[DirectHandler] Aggregation query failed:', error)
        return null
    }
}
