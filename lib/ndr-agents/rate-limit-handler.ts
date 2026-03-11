/**
 * NDR AI Rate Limit Handler
 * Provides graceful fallbacks when Groq API rate limits are hit
 */

import Groq from 'groq-sdk'

const SMALL_MODEL = process.env.GROQ_MODEL_SMALL || 'llama-3.1-8b-instant'
const LARGE_MODEL = process.env.GROQ_MODEL_LARGE || 'llama-3.3-70b-versatile'

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
    if (error instanceof Groq.APIError) {
        return error.status === 429 || 
               (error.message && error.message.includes('rate limit')) ||
               (error.message && error.message.includes('token'))
    }
    if (error instanceof Error) {
        return error.message.includes('429') ||
               error.message.includes('rate limit') ||
               error.message.includes('Too Many Requests')
    }
    return false
}

/**
 * Execute Groq API call with automatic fallback on rate limit
 */
export async function callGroqWithFallback<T>(
    primaryCall: () => Promise<T>,
    fallbackCall: () => Promise<T>,
    errorContext: string
): Promise<T> {
    try {
        return await primaryCall()
    } catch (error) {
        if (isRateLimitError(error)) {
            console.warn(`[RateLimitFallback] ${errorContext} - Primary model rate limited, trying fallback`)
            try {
                return await fallbackCall()
            } catch (fallbackError) {
                console.error(`[RateLimitFallback] ${errorContext} - Fallback also failed:`, fallbackError)
                throw fallbackError
            }
        }
        throw error
    }
}

/**
 * Create a Groq chat completion with automatic model fallback
 */
export async function createChatCompletionWithFallback(
    groq: Groq,
    params: {
        model: string
        messages: Array<{ role: string; content: string }>
        temperature?: number
        max_tokens?: number
    },
    context: string
) {
    const { model, ...otherParams } = params
    
    // If already using small model, no fallback needed
    if (model === SMALL_MODEL) {
        return groq.chat.completions.create(params)
    }
    
    return callGroqWithFallback(
        () => groq.chat.completions.create(params),
        () => {
            console.warn(`[RateLimitFallback] ${context} - Falling back to ${SMALL_MODEL}`)
            return groq.chat.completions.create({
                ...otherParams,
                model: SMALL_MODEL
            })
        },
        context
    )
}

/**
 * Wrap an agent function with rate limit handling
 */
export function withRateLimitFallback<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: string,
    fallbackResult?: ReturnType<T>
): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        try {
            return await fn(...args)
        } catch (error) {
            if (isRateLimitError(error)) {
                console.warn(`[RateLimitFallback] ${context} - Rate limited, returning fallback`)
                if (fallbackResult !== undefined) {
                    return fallbackResult as ReturnType<T>
                }
            }
            throw error
        }
    }) as T
}

/**
 * Retry with exponential backoff for transient errors
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: unknown
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error
            
            // Don't retry if it's a rate limit (we handle that differently)
            if (isRateLimitError(error)) {
                throw error
            }
            
            if (attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt)
                console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
    }
    
    throw lastError
}
