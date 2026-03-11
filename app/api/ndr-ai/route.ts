import { NextRequest, NextResponse } from 'next/server'
import { runOrchestrator } from '@/lib/ndr-agents/orchestrator'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { message, context } = body
        
        console.log('[NDR AI] Message:', message?.substring(0, 100))

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 })
        }

        console.log('[NDR AI] Calling orchestrator...')
        const result = await runOrchestrator(message, context || {})
        console.log('[NDR AI] Result:', { answer: result.answer?.substring(0, 100), agents: result.agents, tier: result.metadata.tier })
        return NextResponse.json(result)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        const stack = err instanceof Error ? err.stack : ''
        console.error('[NDR AI] CRITICAL ERROR:', message)
        console.error('[NDR AI] Stack:', stack)
        return NextResponse.json({ error: message, stack: process.env.NODE_ENV === 'development' ? stack : undefined }, { status: 500 })
    }
}
