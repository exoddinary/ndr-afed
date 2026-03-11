/**
 * NDR AI Query Classifier
 * Lightweight regex/rules-based classification to determine execution path
 * Avoids using LLM for routing - saves tokens and reduces latency
 */

export type QueryType = 'DIRECT' | 'SPATIAL' | 'INSIGHT' | 'GRAPH_REQUIRED'
export type ExecutionTier = 'CHEAP' | 'MEDIUM' | 'HEAVY'

export interface ClassificationResult {
    type: QueryType
    tier: ExecutionTier
    confidence: number
    reasoning: string
    suggestedLayer?: string
    requiresContext?: boolean
}

// Direct query patterns - deterministic, no LLM needed
const DIRECT_PATTERNS = {
    // Count queries
    count: /\b(how many|count|total number of|how much)\b/i,
    // List/show queries
    list: /\b(list|show|display|give me|what are|all)\b/i,
    // Find/lookup queries
    find: /\b(find|lookup|where is|get me|show me)\b/i,
    // Simple filters
    filter: /\b(gas|oil|dry|producing|abandoned|active|wells?|fields?|blocks?)\b/i,
    // Operators
    operator: /\b(operator|company|shell|nam|total|petronas|exxon)\b/i,
    // Status queries
    status: /\b(status|result|type|category)\b/i,
}

// Spatial query patterns
const SPATIAL_PATTERNS = {
    // Proximity
    nearby: /\b(near|nearby|close to|close by|around|adjacent|neighboring)\b/i,
    // Distance
    distance: /\b(within|distance|radius|km|kilometer|how far|between)\b/i,
    // Spatial containment
    containment: /\b(within|inside|in|intersect|overlap|contain)\b/i,
    // Directional
    directional: /\b(north|south|east|west|northeast|northwest|southeast|southwest|direction)\b/i,
    // Map view
    mapView: /\b(this area|current view|visible area|on the map|this region|in this region|map extent)\b/i,
}

// Insight patterns - requires interpretation
const INSIGHT_PATTERNS = {
    // Analysis
    analysis: /\b(analyze|interpret|summarize|overview|assessment|evaluation)\b/i,
    // Comparison
    comparison: /\b(compare|comparison|versus|vs|difference between|similarities)\b/i,
    // Recommendation
    recommendation: /\b(recommend|suggest|opportunity|potential|best|most promising)\b/i,
    // Strategic
    strategic: /\b(strategy|strategic|exploration potential|investment|value)\b/i,
    // Explanation - NOTE: exclude "how many/much" which are count queries
    explanation: /\b(why|explain|reason|cause|what does this mean)\b/i,
    // Activity patterns
    activity: /\b(most active|trend|pattern|activity|history|timeline)\b/i,
}

// Graph patterns - requires relationship reasoning
const GRAPH_PATTERNS = {
    // Relationships
    relationship: /\b(related|associated|linked|connected|relationship|belongs to)\b/i,
    // Operator-block associations
    operatorBlock: /\b(operator.*block|block.*operator|who operates|responsible for)\b/i,
    // Provenance/reliability
    provenance: /\b(reliability|confidence|provenance|source|how reliable|trust)\b/i,
    // Indirect connections
    indirect: /\b(through|via|indirect|path|connection between)\b/i,
    // Multi-hop reasoning
    multihop: /\b(which.*through|find.*via|connected.*to)\b/i,
}

/**
 * Classify a query into execution type and tier
 * Uses regex patterns - no LLM call required
 */
export function classifyQuery(query: string, hasSpatialContext: boolean = false): ClassificationResult {
    const q = query.toLowerCase()
    
    // PRIORITY 1: Check for simple count queries (fast path)
    if (/\b(how many|how much|count|total number of)\b/i.test(q)) {
        // Determine suggested layer
        let suggestedLayer: string | undefined
        if (/\b(wells?|boreholes?|drilling)\b/i.test(q)) suggestedLayer = 'wells'
        else if (/\b(fields?|hydrocarbon|gas|oil)\b/i.test(q)) suggestedLayer = 'fields'
        else if (/\b(blocks?|licences?|acreage)\b/i.test(q)) suggestedLayer = 'blocks'
        else if (/\b(seismic|survey|2d|3d)\b/i.test(q)) suggestedLayer = 'seismic'
        
        return {
            type: 'DIRECT',
            tier: 'CHEAP',
            confidence: 0.98,
            reasoning: 'Simple count query - deterministic handling',
            suggestedLayer,
            requiresContext: false
        }
    }
    
    // Check for graph patterns
    const hasGraphPattern = Object.values(GRAPH_PATTERNS).some(pattern => pattern.test(q))
    if (hasGraphPattern) {
        return {
            type: 'GRAPH_REQUIRED',
            tier: 'HEAVY',
            confidence: 0.85,
            reasoning: 'Query requires relationship/provenance reasoning',
            requiresContext: true
        }
    }
    
    // Check for insight patterns
    const hasInsightPattern = Object.values(INSIGHT_PATTERNS).some(pattern => pattern.test(q))
    if (hasInsightPattern) {
        return {
            type: 'INSIGHT',
            tier: 'HEAVY',
            confidence: 0.8,
            reasoning: 'Query requires interpretation or strategic analysis',
            requiresContext: true
        }
    }
    
    // Check for spatial patterns
    const hasSpatialPattern = Object.values(SPATIAL_PATTERNS).some(pattern => pattern.test(q))
    if (hasSpatialPattern || hasSpatialContext) {
        return {
            type: 'SPATIAL',
            tier: 'MEDIUM',
            confidence: 0.9,
            reasoning: hasSpatialContext ? 'Query includes spatial context' : 'Query involves spatial relationships',
            requiresContext: hasSpatialContext
        }
    }
    
    // Check for direct patterns
    const hasDirectPattern = Object.values(DIRECT_PATTERNS).some(pattern => pattern.test(q))
    if (hasDirectPattern) {
        // Determine suggested layer
        let suggestedLayer: string | undefined
        if (/\b(wells?|boreholes?|drilling)\b/i.test(q)) suggestedLayer = 'wells'
        else if (/\b(fields?|hydrocarbon|gas|oil)\b/i.test(q)) suggestedLayer = 'fields'
        else if (/\b(blocks?|licences?|acreage)\b/i.test(q)) suggestedLayer = 'blocks'
        else if (/\b(seismic|survey|2d|3d)\b/i.test(q)) suggestedLayer = 'seismic'
        
        return {
            type: 'DIRECT',
            tier: 'CHEAP',
            confidence: 0.95,
            reasoning: 'Simple factual query - deterministic handling possible',
            suggestedLayer,
            requiresContext: false
        }
    }
    
    // Default to medium tier with spatial if context available, cheap otherwise
    return {
        type: hasSpatialContext ? 'SPATIAL' : 'DIRECT',
        tier: hasSpatialContext ? 'MEDIUM' : 'CHEAP',
        confidence: 0.6,
        reasoning: 'No clear pattern match - defaulting based on context',
        requiresContext: hasSpatialContext
    }
}

/**
 * Determine if query needs graph based on classification
 */
export function shouldUseGraph(classification: ClassificationResult): boolean {
    return classification.type === 'GRAPH_REQUIRED' || 
           (classification.type === 'INSIGHT' && classification.confidence > 0.7)
}

/**
 * Determine if query can be handled deterministically
 */
export function isDeterministic(classification: ClassificationResult): boolean {
    return classification.tier === 'CHEAP' || 
           (classification.tier === 'MEDIUM' && classification.type === 'SPATIAL')
}

/**
 * Get model recommendation based on tier
 */
export function getModelForTier(tier: ExecutionTier, isRouter: boolean = false): string {
    const smallModel = process.env.GROQ_MODEL_SMALL || 'llama-3.1-8b-instant'
    const largeModel = process.env.GROQ_MODEL_LARGE || 'llama-3.3-70b-versatile'
    
    switch (tier) {
        case 'CHEAP':
            return smallModel
        case 'MEDIUM':
            return isRouter ? smallModel : smallModel
        case 'HEAVY':
            return largeModel
        default:
            return smallModel
    }
}

/**
 * Check if query is a simple count query
 */
export function isCountQuery(query: string): boolean {
    return /\b(how many|count|total number of)\b/i.test(query.toLowerCase())
}

/**
 * Check if query is a simple list/filter query
 */
export function isFilterQuery(query: string): boolean {
    const q = query.toLowerCase()
    return (/\b(list|show|all|find)\b/i.test(q) && 
            /\b(gas|oil|dry|wells?|fields?|blocks?)\b/i.test(q))
}

/**
 * Extract target layer from query
 */
export function extractTargetLayer(query: string): string | null {
    const q = query.toLowerCase()
    if (/\b(wells?|boreholes?)\b/i.test(q)) return 'wells'
    if (/\b(fields?|hydrocarbon)\b/i.test(q)) return 'fields'
    if (/\b(blocks?|licences?)\b/i.test(q)) return 'blocks'
    if (/\b(seismic|surveys?)\b/i.test(q)) return 'seismic'
    if (/\b(operators?|companies?)\b/i.test(q)) return 'wells'
    return null
}

/**
 * Extract filter criteria from query
 */
export function extractFilterCriteria(query: string): Record<string, string> | null {
    const q = query.toLowerCase()
    const filters: Record<string, string> = {}
    
    // Well results
    if (/\bgas\b/i.test(q)) filters['WELL_RESUL'] = 'Gas'
    else if (/\boil\b/i.test(q)) filters['WELL_RESUL'] = 'Oil'
    else if (/\bdry\b/i.test(q)) filters['WELL_RESUL'] = 'Dry'
    
    // Status
    if (/\bactive\b/i.test(q)) filters['STATUS'] = 'Active'
    if (/\babandoned\b/i.test(q)) filters['STATUS'] = 'Abandoned'
    
    // Operator
    const operatorMatch = q.match(/\b(shell|nam|total|petronas|exxon|bp|chevron)\b/i)
    if (operatorMatch) filters['OPERATOR'] = operatorMatch[1]
    
    return Object.keys(filters).length > 0 ? filters : null
}
