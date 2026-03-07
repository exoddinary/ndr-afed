import { NextRequest, NextResponse } from 'next/server'
import { runOrchestrator } from '@/lib/ndr-agents/orchestrator'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { message, context } = body

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 })
        }

        const result = await runOrchestrator(message, context || {})
        return NextResponse.json(result)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        console.error('[NDR AI]', err)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
