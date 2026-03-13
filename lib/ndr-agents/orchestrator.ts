/**
 * NDR AI Orchestrator - Refactored 3-Lane Architecture
 * Now with predefined Q&A (zero-token), response caching, and optimized routing
 */

import { classifyQuery, shouldUseGraph, type ExecutionTier, isCountQuery } from './query-classifier'
import { handleDirectQuery } from './direct-query-handler'
import { runAssetQueryAgent } from './asset-query-agent'
import { runSpatialReasoningAgent, type SpatialResult } from './spatial-agent'
import { runInsightAgent, type InsightResult } from './insight-agent'
import { ensureGraphLazy } from './graph-manager'
import { runGraphAgent, type GraphQueryResult } from './graph-agent'
import { getCachedResponse, setCachedResponse, normalizeQuery } from './response-cache'

// Check for API key
if (!process.env.GROQ_API_KEY) {
  console.error('[Orchestrator] CRITICAL: GROQ_API_KEY environment variable is not set!')
}

export type OrchestratorResponse = {
    answer: string
    followUpQuestions: string[]
    agents: string[]
    mapActions?: {
        action: 'highlight' | 'zoom'
        layer: string
        identifiers: string[]
        radiusInfo?: { originLayer: string; originId: string; radiusKm: number }
    }[]
    metadata: {
        routing: string[]
        tier: ExecutionTier | 'PREDEFINED' | 'CACHED'
        latencyMs: number
        graphUsed: boolean
    }
}

export async function runOrchestrator(
    userQuery: string,
    context: Record<string, unknown>,
    history: { role: string; content: string }[] = []
): Promise<OrchestratorResponse> {
    const startMs = Date.now()
    
    // Normalize query for cache
    const normalizedQuery = normalizeQuery(userQuery)
    
    // LANE 0.5: CACHE CHECK - Zero tokens for repeated queries
    const cached = getCachedResponse(normalizedQuery)
    if (cached) {
        console.log('[Orchestrator] CACHE HIT - returning cached response')
        return {
            answer: cached.answer,
            followUpQuestions: cached.followUpQuestions,
            agents: cached.agents,
            mapActions: cached.mapActions as OrchestratorResponse['mapActions'],
            metadata: {
                routing: cached.metadata.routing,
                tier: 'CACHED' as OrchestratorResponse['metadata']['tier'],
                latencyMs: Date.now() - startMs,
                graphUsed: false,
            }
        }
    }
    
    const hasSpatialContext = !!(context?.extent && typeof context.extent === 'object')
    
    // Step 1: Classify query (regex-based, no LLM)
    const classification = classifyQuery(userQuery, hasSpatialContext)
    console.log('[Orchestrator] Query classified as:', classification.type, 'Tier:', classification.tier)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let directResult: any = null
    let spatialResult: SpatialResult | null = null
    let graphResult: GraphQueryResult | null = null
    let insightResult: InsightResult | null = null
    const agents: string[] = []
    let graphWasUsed = false
    
    // LANE A: CHEAP TIER - Direct deterministic or simple LLM handling
    if (classification.tier === 'CHEAP') {
        console.log('[Orchestrator] Using CHEAP tier')
        
        // Use deterministic handler strictly for count/lookup
        if (isCountQuery(userQuery) || (!userQuery.toLowerCase().includes('f03') && !userQuery.toLowerCase().includes('horizon'))) {
            directResult = await handleDirectQuery(userQuery, classification.suggestedLayer || null)
        }
        
        // If deterministic failed OR it's a project/synthesis query, use Asset Agent
        if (!directResult) {
            console.log('[Orchestrator] Using Asset Agent for CHEAP tier synthesis')
            directResult = await runAssetQueryAgent(userQuery, context, history)
        }
        
        if (directResult) {
            agents.push('DIRECT')
            const latency = Date.now() - startMs
            console.log(`[QueryClassifier] Type: ${classification.type}`)
            console.log(`[ExecutionTier] CHEAP`)
            console.log(`[Graph] Skipped`)
            console.log(`[Agents] DIRECT`)
            console.log(`[Latency] ${latency}ms`)
            
            const response: OrchestratorResponse = {
                answer: directResult.answer,
                followUpQuestions: [
                    'Which operators are most active in this area?',
                    'What seismic coverage exists nearby?',
                    'Show me wells with gas discoveries in this region.'
                ],
                agents,
                mapActions: directResult.suggestedMapActions as OrchestratorResponse['mapActions'],
                metadata: {
                    routing: agents,
                    tier: 'CHEAP',
                    latencyMs: latency,
                    graphUsed: false
                }
            }
            
            // Cache CHEAP responses
            setCachedResponse(userQuery, {
                ...response,
                metadata: { ...response.metadata, tier: 'CHEAP' },
            })
            return response
        }
        console.log('[Orchestrator] Direct handler failed, escalating')
    }
    
    // LANE B: MEDIUM TIER - Spatial queries
    if (classification.tier === 'MEDIUM' || classification.type === 'SPATIAL') {
        console.log('[Orchestrator] Using MEDIUM tier - spatial handling')
        agents.push('SPATIAL')
        
        try {
            spatialResult = await runSpatialReasoningAgent(userQuery, context, history)
            
            if (spatialResult?.answer && !shouldUseGraph(classification)) {
                const latency = Date.now() - startMs
                const response: OrchestratorResponse = {
                    answer: spatialResult.answer,
                    followUpQuestions: [],
                    agents,
                    mapActions: spatialResult.mapActions,
                    metadata: {
                        routing: agents,
                        tier: 'MEDIUM',
                        latencyMs: latency,
                        graphUsed: false
                    }
                }
                
                // Cache MEDIUM responses
                setCachedResponse(userQuery, {
                    ...response,
                    metadata: { ...response.metadata, tier: 'MEDIUM' },
                })
                return response
            }
        } catch (e) {
            console.error('[Spatial Agent Error]', e)
        }
    }
    
    // LANE C: HEAVY TIER - Graph + Insight with large model
    if (classification.tier === 'HEAVY' || shouldUseGraph(classification)) {
        console.log('[Orchestrator] Using HEAVY tier - graph and insight')
        
        if (shouldUseGraph(classification)) {
            console.log('[Orchestrator] Lazy-loading graph for relationship query')
            const graph = await ensureGraphLazy()
            graphWasUsed = !!graph
            
            if (graph) {
                agents.push('GRAPH')
                try {
                    graphResult = await runGraphAgent(userQuery, context, history) as GraphQueryResult
                } catch (e) {
                    console.error('[Graph Agent Error]', e)
                }
            }
        }
        
        agents.push('INSIGHT')
        try {
            const directAnswer = directResult ? directResult.answer : ''
            const spatialAnswer = spatialResult ? spatialResult.answer : ''
            const graphAnswer = graphResult ? graphResult.answer : ''
            insightResult = await runInsightAgent(
                userQuery,
                directAnswer,
                spatialAnswer,
                graphAnswer,
                history
            )
        } catch (e) {
            console.error('[Insight Agent Error]', e)
        }
    }
    
    // Synthesize final answer
    const directAnswer = directResult ? directResult.answer : null
    const spatialAnswer = spatialResult ? spatialResult.answer : null
    const graphAnswer = graphResult ? graphResult.answer : null
    const finalAnswer = insightResult?.answer || 
                      graphAnswer || 
                      spatialAnswer || 
                      directAnswer || 
                      'I was unable to retrieve results for this query.'
    
    const latency = Date.now() - startMs
    console.log(`[QueryClassifier] Type: ${classification.type}`)
    console.log(`[ExecutionTier] ${classification.tier}`)
    console.log(`[Graph] ${graphWasUsed ? 'Used' : 'Skipped'}`)
    console.log(`[Agents] ${agents.join(', ')}`)
    console.log(`[Latency] ${latency}ms`)
    
    const directMapActions = directResult ? (directResult.suggestedMapActions || []) : []
    const spatialMapActions = spatialResult ? (spatialResult.mapActions || []) : []
    
    return {
        answer: finalAnswer,
        followUpQuestions: insightResult?.followUpQuestions || [
            'Which operators are most active in this area?',
            'What seismic coverage exists nearby?',
            'Show me wells with gas discoveries in this region.'
        ],
        agents,
        mapActions: [
            ...directMapActions,
            ...spatialMapActions,
        ] as OrchestratorResponse['mapActions'],
        metadata: {
            routing: agents,
            tier: classification.tier,
            latencyMs: latency,
            graphUsed: graphWasUsed
        }
    }
}
