/**
 * NDR AI Response Cache
 * In-memory LRU cache for AI responses
 * Prevents redundant LLM calls for repeated/similar queries
 */

interface CacheEntry {
  response: CachedResponse
  timestamp: number
  hitCount: number
}

export interface CachedResponse {
  answer: string
  followUpQuestions: string[]
  agents: string[]
  mapActions?: { action: string; layer: string; identifiers: string[]; radiusInfo?: { originLayer: string; originId: string; radiusKm: number } }[]
  metadata: {
    routing: string[]
    tier: string
    latencyMs: number
    graphUsed: boolean
    cached?: boolean
  }
}

const MAX_ENTRIES = 50
const TTL_MS = 10 * 60 * 1000  // 10 minutes

// In-memory cache store
const cache = new Map<string, CacheEntry>()

/**
 * Normalize a query string into a cache key
 * Lowercases, trims, collapses whitespace, removes punctuation
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')     // Remove punctuation
    .replace(/\s+/g, ' ')        // Collapse whitespace
}

/**
 * Get a cached response for a query
 * Returns null if no valid cache entry exists
 */
export function getCachedResponse(query: string): CachedResponse | null {
  const key = normalizeQuery(query)
  const entry = cache.get(key)

  if (!entry) return null

  // Check TTL
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key)
    console.log('[Cache] EXPIRED:', key.substring(0, 50))
    return null
  }

  entry.hitCount++
  console.log(`[Cache] HIT (${entry.hitCount}x): "${key.substring(0, 50)}..."`)

  return {
    ...entry.response,
    metadata: {
      ...entry.response.metadata,
      cached: true,
      latencyMs: 0,
    },
  }
}

/**
 * Store a response in cache
 * Only caches CHEAP and MEDIUM tier responses
 */
export function setCachedResponse(
  query: string,
  response: CachedResponse,
): void {
  const tier = response.metadata?.tier
  if (tier === 'HEAVY') {
    // Don't cache HEAVY tier - these may be context-dependent
    return
  }

  const key = normalizeQuery(query)

  // Evict oldest entries if at capacity
  if (cache.size >= MAX_ENTRIES) {
    let oldestKey = ''
    let oldestTime = Infinity
    for (const [k, v] of cache.entries()) {
      if (v.timestamp < oldestTime) {
        oldestTime = v.timestamp
        oldestKey = k
      }
    }
    if (oldestKey) {
      cache.delete(oldestKey)
      console.log('[Cache] EVICTED:', oldestKey.substring(0, 50))
    }
  }

  cache.set(key, {
    response,
    timestamp: Date.now(),
    hitCount: 0,
  })

  console.log(`[Cache] SET: "${key.substring(0, 50)}..." (${cache.size}/${MAX_ENTRIES} entries)`)
}

/**
 * Clear all cached responses
 */
export function clearCache(): void {
  const size = cache.size
  cache.clear()
  console.log(`[Cache] CLEARED: ${size} entries removed`)
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  maxSize: number
  ttlMinutes: number
  entries: { key: string; hitCount: number; ageMs: number }[]
} {
  const now = Date.now()
  return {
    size: cache.size,
    maxSize: MAX_ENTRIES,
    ttlMinutes: TTL_MS / 60_000,
    entries: Array.from(cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 60),
      hitCount: entry.hitCount,
      ageMs: now - entry.timestamp,
    })),
  }
}
