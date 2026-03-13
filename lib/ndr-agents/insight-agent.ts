import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are the NDR Insight Agent. Synthesize asset and spatial data into concise exploration insights for Netherlands North Sea oil & gas.

Rules: Ground in data provided, rank assets when multiple, flag data gaps, use E&P language. Keep under 300 words. Use bullets and tables.`

export type InsightResult = {
    answer: string
    followUpQuestions: string[]
    opportunityScore?: { label: string; score: number; reason: string }[]
}

export async function runInsightAgent(
    userQuery: string,
    assetData: string,
    spatialData: string,
    graphContext?: string,
    history?: { role: string; content: string }[]
): Promise<InsightResult> {
    const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(history || []).filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            {
                role: 'user',
                content: `Original user question: "${userQuery}"

Asset analysis data:
${assetData || '(none)'}

Spatial analysis data:
${spatialData || '(none)'}

Knowledge Graph Context (entity relationships & provenance):
${graphContext || '(none)'}

Based on this data, provide:
1. An interpretation of what this means for exploration or analysis
2. Key insights about the assets or spatial context
3. Note any data provenance issues (e.g., "operator-block relationship is inferred from wells")
4. 3 concise follow-up questions the analyst should consider
5. If applicable, rank the top 3 assets by exploration interest with a brief reason

Format the follow-up questions as a plain list, each prefixed with "FOLLOWUP:" so they can be parsed.`
            }
        ],
        temperature: 0.4,
        max_tokens: 600,
    })

    const raw = completion.choices[0]?.message?.content || ''

    // Parse follow-up questions
    const followUpLines = raw.split('\n').filter(l => l.includes('FOLLOWUP:'))
    const followUpQuestions = followUpLines
        .map(l => l.replace(/FOLLOWUP:\s*/i, '').trim())
        .filter(l => l.length > 5)
        .slice(0, 3)

    // Clean answer: remove the FOLLOWUP: lines from display text
    const answer = raw.split('\n').filter(l => !l.includes('FOLLOWUP:')).join('\n').trim()

    return {
        answer,
        followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : [
            'Which wells near this area have reported gas discoveries?',
            'What seismic coverage exists in this block?',
            'Who are the active operators in this region?'
        ],
    }
}
