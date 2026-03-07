import Groq from 'groq-sdk'
import { runAssetQueryAgent, type AssetQueryResult } from './asset-query-agent'
import { runSpatialReasoningAgent, type SpatialResult } from './spatial-agent'
import { runInsightAgent, type InsightResult } from './insight-agent'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

const ROUTING_PROMPT = `You are the NDR AI Orchestrator. Analyze the user query and decide which specialist agents to invoke.

Available agents:
- ASSET: Query and filter structured feature attributes (operators, statuses, results, counts)
- SPATIAL: Spatial relationships, proximity, distances, areas
- INSIGHT: Synthesize and interpret data, generate exploration insights

Respond with a JSON object like:
{
  "agents": ["ASSET", "SPATIAL", "INSIGHT"],
  "reasoning": "brief explanation",
  "primary": "ASSET"
}

Rules:
- If query mentions proximity, distance, nearby, within → include SPATIAL
- If query mentions filtering, listing, counting, operators → include ASSET
- If query asks "what is interesting", opportunities, summary, recommend → include INSIGHT
- Most queries need at least ASSET + INSIGHT
- Spatial queries usually go SPATIAL + ASSET + INSIGHT
- Simple factual lookups: ASSET only
Only return valid JSON, nothing else.`

export type OrchestratorResponse = {
    answer: string
    followUpQuestions: string[]
    agents: string[]
    mapActions?: {
        action: 'highlight' | 'zoom'
        layer: string
        identifiers: string[]
    }[]
    metadata: {
        routing: string[]
        latencyMs: number
    }
}

export async function runOrchestrator(
    userQuery: string,
    context: Record<string, unknown>
): Promise<OrchestratorResponse> {
    const startMs = Date.now()

    // Step 1: Route the query
    let routing: { agents: string[]; reasoning: string; primary: string } = {
        agents: ['ASSET', 'INSIGHT'],
        reasoning: 'default routing',
        primary: 'ASSET'
    }

    try {
        const routeCompletion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: ROUTING_PROMPT },
                { role: 'user', content: userQuery }
            ],
            temperature: 0,
            max_tokens: 200,
        })
        const raw = routeCompletion.choices[0]?.message?.content || ''
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            routing = JSON.parse(jsonMatch[0])
        }
    } catch {
        // fallback routing already set
    }

    const agents = routing.agents || ['ASSET', 'INSIGHT']

    // Step 2: Run specialist agents in parallel where possible
    const results: {
        asset?: AssetQueryResult
        spatial?: SpatialResult
        insight?: InsightResult
    } = {}

    const parallelTasks: Promise<void>[] = []

    if (agents.includes('ASSET')) {
        parallelTasks.push(
            runAssetQueryAgent(userQuery, context).then(r => { results.asset = r }).catch(e => {
                console.error('[Asset Agent Error]', e)
            })
        )
    }

    if (agents.includes('SPATIAL')) {
        parallelTasks.push(
            runSpatialReasoningAgent(userQuery, context).then(r => { results.spatial = r }).catch(e => {
                console.error('[Spatial Agent Error]', e)
            })
        )
    }

    await Promise.all(parallelTasks)

    // Step 3: Run Insight agent with combined outputs
    if (agents.includes('INSIGHT')) {
        try {
            results.insight = await runInsightAgent(
                userQuery,
                results.asset?.answer || '',
                results.spatial?.answer || ''
            )
        } catch (e) {
            console.error('[Insight Agent Error]', e)
        }
    }

    // Step 4: Merge map actions
    const allMapActions = [
        ...(results.asset?.suggestedMapActions || []),
        ...(results.spatial?.mapActions || []),
    ]

    // Step 5: Synthesize final answer
    let finalAnswer = ''

    if (results.insight?.answer) {
        finalAnswer = results.insight.answer
    } else if (results.asset?.answer && results.spatial?.answer) {
        finalAnswer = `**Asset Analysis:**\n${results.asset.answer}\n\n**Spatial Context:**\n${results.spatial.answer}`
    } else if (results.asset?.answer) {
        finalAnswer = results.asset.answer
    } else if (results.spatial?.answer) {
        finalAnswer = results.spatial.answer
    } else {
        finalAnswer = 'I was unable to retrieve results for this query. Please try rephrasing.'
    }

    const followUpQuestions = results.insight?.followUpQuestions || [
        'Which operators are most active in this area?',
        'What seismic coverage exists nearby?',
        'Show me wells with gas discoveries in this region.'
    ]

    return {
        answer: finalAnswer,
        followUpQuestions,
        agents,
        mapActions: allMapActions.length > 0 ? allMapActions as OrchestratorResponse['mapActions'] : undefined,
        metadata: {
            routing: agents,
            latencyMs: Date.now() - startMs,
        }
    }
}
