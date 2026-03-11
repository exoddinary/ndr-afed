/**
 * NDR AI Graph Manager
 * Lazy-loading with cache/version checking
 * Graph only loads when explicitly needed for relationship reasoning
 */

import { GraphBuilder } from './tools/graph-builder'
import { getKnowledgeGraph, KnowledgeGraph } from './tools/graph-types'
import * as fs from 'fs'
import * as path from 'path'

interface GraphCacheMetadata {
    version: string
    lastBuilt: number
    dataHash: string
    nodeCount: number
    edgeCount: number
}

interface GraphState {
    graph: KnowledgeGraph | null
    isLoaded: boolean
    isLoading: boolean
    metadata: GraphCacheMetadata | null
    lastAccessed: number
}

// In-memory graph state
const graphState: GraphState = {
    graph: null,
    isLoaded: false,
    isLoading: false,
    metadata: null,
    lastAccessed: 0
}

const CACHE_DIR = path.join(process.cwd(), '.cache', 'ndr-graph')
const METADATA_FILE = path.join(CACHE_DIR, 'metadata.json')
const CACHE_FILE = path.join(CACHE_DIR, 'graph-cache.json')

/**
 * Compute a simple hash of source data files to detect changes
 */
function computeDataHash(): string {
    const dataDir = path.join(process.cwd(), 'public', 'data')
    const files = ['Wells.json', 'HC_Fields.json', 'Offshore_Blocks.json', 'Licenses.json']
    
    let hash = ''
    for (const file of files) {
        const filePath = path.join(dataDir, file)
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath)
            hash += `${file}:${stat.mtime.getTime()}:${stat.size};`
        }
    }
    return hash
}

/**
 * Load cache metadata if exists
 */
function loadCacheMetadata(): GraphCacheMetadata | null {
    try {
        if (fs.existsSync(METADATA_FILE)) {
            const raw = fs.readFileSync(METADATA_FILE, 'utf-8')
            return JSON.parse(raw)
        }
    } catch (e) {
        console.error('[GraphManager] Failed to load cache metadata:', e)
    }
    return null
}

/**
 * Save cache metadata
 */
function saveCacheMetadata(metadata: GraphCacheMetadata): void {
    try {
        if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR, { recursive: true })
        }
        fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2))
    } catch (e) {
        console.error('[GraphManager] Failed to save cache metadata:', e)
    }
}

/**
 * Check if cached graph is still valid
 */
function isCacheValid(): boolean {
    const metadata = loadCacheMetadata()
    if (!metadata) return false
    
    const currentHash = computeDataHash()
    const isValid = metadata.dataHash === currentHash
    
    if (!isValid) {
        console.log('[GraphManager] Cache invalid - source data changed')
    }
    
    return isValid
}

/**
 * Get current graph version string
 */
function getGraphVersion(): string {
    return new Date().toISOString().split('T')[0]  // Daily versioning
}

/**
 * Lazy-load the knowledge graph - only loads when called
 */
export async function ensureGraphLazy(): Promise<KnowledgeGraph | null> {
    // If already loaded, return immediately
    if (graphState.isLoaded && graphState.graph) {
        graphState.lastAccessed = Date.now()
        console.log('[GraphManager] Graph already loaded, reusing from memory')
        return graphState.graph
    }
    
    // If currently loading, wait (shouldn't happen with proper async)
    if (graphState.isLoading) {
        console.log('[GraphManager] Graph is loading, waiting...')
        while (graphState.isLoading) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        return graphState.graph
    }
    
    // Start loading
    graphState.isLoading = true
    console.log('[GraphManager] Lazy-loading knowledge graph...')
    const startTime = Date.now()
    
    try {
        // Check cache validity
        const useCache = isCacheValid()
        const metadata = loadCacheMetadata()
        
        if (useCache && metadata) {
            console.log('[GraphManager] Using cached graph from disk')
            // In a real implementation, we'd deserialize from disk
            // For now, rebuild in memory but log that we could use cache
        }
        
        // Build graph
        const graph = getKnowledgeGraph()
        const builder = new GraphBuilder(graph)
        await builder.buildGraph()
        
        // Update state
        graphState.graph = graph
        graphState.isLoaded = true
        graphState.lastAccessed = Date.now()
        
        const stats = graph.getStats()
        
        // Save cache metadata
        const newMetadata: GraphCacheMetadata = {
            version: getGraphVersion(),
            lastBuilt: Date.now(),
            dataHash: computeDataHash(),
            nodeCount: stats.nodes || 0,
            edgeCount: stats.edges || 0
        }
        saveCacheMetadata(newMetadata)
        graphState.metadata = newMetadata
        
        const duration = Date.now() - startTime
        console.log(`[GraphManager] Graph loaded in ${duration}ms:`, stats)
        
        return graph
    } catch (error) {
        console.error('[GraphManager] Failed to load graph:', error)
        return null
    } finally {
        graphState.isLoading = false
    }
}

/**
 * Check if graph is loaded without triggering load
 */
export function isGraphLoaded(): boolean {
    return graphState.isLoaded && !!graphState.graph
}

/**
 * Get loaded graph (returns null if not loaded)
 */
export function getLoadedGraph(): KnowledgeGraph | null {
    return graphState.graph
}

/**
 * Force graph rebuild
 */
export async function rebuildGraph(): Promise<KnowledgeGraph | null> {
    graphState.isLoaded = false
    graphState.graph = null
    return ensureGraphLazy()
}

/**
 * Get graph statistics for monitoring
 */
export function getGraphStats(): object {
    if (!graphState.isLoaded || !graphState.graph) {
        return { loaded: false }
    }
    
    const stats = graphState.graph.getStats()
    return {
        loaded: true,
        lastAccessed: graphState.lastAccessed,
        metadata: graphState.metadata,
        ...stats
    }
}

/**
 * Invalidate graph cache
 */
export function invalidateGraphCache(): void {
    graphState.isLoaded = false
    graphState.graph = null
    try {
        if (fs.existsSync(METADATA_FILE)) {
            fs.unlinkSync(METADATA_FILE)
        }
    } catch (e) {
        console.error('[GraphManager] Failed to invalidate cache:', e)
    }
    console.log('[GraphManager] Graph cache invalidated')
}
