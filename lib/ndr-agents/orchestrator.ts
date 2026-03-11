/**
 * NDR AI Orchestrator - Refactored 3-Lane Architecture
 */

import { classifyQuery, shouldUseGraph, type ExecutionTier } from './query-classifier'
import { handleDirectQuery, type DirectQueryResult } from './direct-query-handler'
import { runSpatialReasoningAgent, type SpatialResult } from './spatial-agent'
import { runInsightAgent, type InsightResult } from './insight-agent'
import { ensureGraphLazy } from './graph-manager'
import { runGraphAgent, type GraphQueryResult } from './graph-agent'

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
        tier: ExecutionTier
        latencyMs: number
        graphUsed: boolean
    }
}

export async function runOrchestrator(
    userQuery: string,
    context: Record<string, unknown>
): Promise<OrchestratorResponse> {
    const startMs = Date.now()
    
    const hasSpatialContext = !!(context?.extent && typeof context.extent === 'object')
    
    // Step 1: Classify query (regex-based, no LLM)
    const classification = classifyQuery(userQuery, hasSpatialContext)
    console.log('[Orchestrator] Query classified as:', classification.type, 'Tier:', classification.tier)
    
    let directResult: DirectQueryResult | null = null
    let spatialResult: SpatialResult | null = null
    let graphResult: GraphQueryResult | null = null
    let insightResult: InsightResult | null = null
    const agents: string[] = []
    let graphWasUsed = false
    
    // LANE A: CHEAP TIER - Direct deterministic handling
    if (classification.tier === 'CHEAP') {
        console.log('[Orchestrator] Using CHEAP tier - deterministic handling')
        directResult = await handleDirectQuery(userQuery, classification.suggestedLayer || null)
        
        if (directResult) {
            agents.push('DIRECT')
            const latency = Date.now() - startMs
            console.log(`[QueryClassifier] Type: ${classification.type}`)
            console.log(`[ExecutionTier] CHEAP`)
            console.log(`[Graph] Skipped`)
            console.log(`[Agents] DIRECT`)
            console.log(`[Latency] ${latency}ms`)
            
            return {
                answer: directResult.answer,
                followUpQuestions: [
                    'Which operators are most active in this area?',
                    'What seismic coverage exists nearby?',
                    'Show me wells with gas discoveries in this region.'
                ],
                agents,
                mapActions: directResult.suggestedMapActions,
                metadata: {
                    routing: agents,
                    tier: 'CHEAP',
                    latencyMs: latency,
                    graphUsed: false
                }
            }
        }
        console.log('[Orchestrator] Direct handler failed, escalating')
    }
    
    // LANE B: MEDIUM TIER - Spatial queries
    if (classification.tier === 'MEDIUM' || classification.type === 'SPATIAL') {
        console.log('[Orchestrator] Using MEDIUM tier - spatial handling')
        agents.push('SPATIAL')
        
        try {
            spatialResult = await runSpatialReasoningAgent(userQuery, context)
            
            if (spatialResult?.answer && !shouldUseGraph(classification)) {
                const latency = Date.now() - startMs
                return {
                    answer: spatialResult.answer,
                    followUpQuestions: spatialResult.followUpQuestions || [],
                    agents,
                    mapActions: spatialResult.mapActions,
                    metadata: {
                        routing: agents,
                        tier: 'MEDIUM',
                        latencyMs: latency,
                        graphUsed: false
                    }
                }
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
                    graphResult = await runGraphAgent(userQuery, context)
                } catch (e) {
                    console.error('[Graph Agent Error]', e)
                }
            }
        }
        
        agents.push('INSIGHT')
        try {
            insightResult = await runInsightAgent(
                userQuery,
                directResult?.answer || '',
                spatialResult?.answer || '',
                graphResult?.answer || ''
            )
        } catch (e) {
            console.error('[Insight Agent Error]', e)
        }
    }
    
    // Synthesize final answer
    let finalAnswer = insightResult?.answer || 
                      graphResult?.answer || 
                      spatialResult?.answer || 
                      directResult?.answer || 
                      'I was unable to retrieve results for this query.'
    
    const latency = Date.now() - startMs
    console.log(`[QueryClassifier] Type: ${classification.type}`)
    console.log(`[ExecutionTier] ${classification.tier}`)
    console.log(`[Graph] ${graphWasUsed ? 'Used' : 'Skipped'}`)
    console.log(`[Agents] ${agents.join(', ')}`)
    console.log(`[Latency] ${latency}ms`)
    
    return {
        answer: finalAnswer,
        followUpQuestions: insightResult?.followUpQuestions || [
            'Which operators are most active in this area?',
            'What seismic coverage exists nearby?',
            'Show me wells with gas discoveries in this region.'
        ],
        agents,
        mapActions: [
            ...(directResult?.suggestedMapActions || []),
            ...(spatialResult?.mapActions || []),
        ],
        metadata: {
            routing: agents,
            tier: classification.tier,
            latencyMs: latency,
            graphUsed: graphWasUsed
        }
    }
}
