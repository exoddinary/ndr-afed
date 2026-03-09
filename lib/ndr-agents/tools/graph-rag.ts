import { KnowledgeGraph, GraphNode, GraphEdge, EdgeType } from './graph-types'
import { getKnowledgeGraph } from './graph-types'

// Graph RAG context builder for LLM queries
export class GraphRagBuilder {
  private graph: KnowledgeGraph

  constructor(graph?: KnowledgeGraph) {
    this.graph = graph || getKnowledgeGraph()
  }

  // Build context for a natural language query
  buildContext(query: string, entities?: string[]): GraphRagContext {
    const extractedEntities = entities || this.extractEntities(query)
    
    // Find relevant subgraph
    const subgraph = this.extractRelevantSubgraph(query, extractedEntities)
    
    // Generate natural language summary
    const summary = this.generateSummary(subgraph, query)
    
    // Generate provenance report
    const provenanceReport = this.generateProvenanceReport(subgraph)
    
    // Check for low confidence
    const confidenceWarning = this.checkConfidence(subgraph)

    return {
      nodes: subgraph.nodes,
      edges: subgraph.edges,
      summary,
      provenanceReport,
      confidenceWarning,
    }
  }

  // Extract entities mentioned in query
  private extractEntities(query: string): string[] {
    const entities: string[] = []
    const allNodes = this.graph.getAllNodes()

    // Look for well IDs (pattern: K06-GT-02, P05-01, etc.)
    const wellMatches = query.match(/\b([A-Z]\d{1,2}[-][A-Z0-9-]+)\b/g)
    if (wellMatches) {
      for (const match of wellMatches) {
        const node = allNodes.find(n => n.type === 'WELL' && n.canonical_id === match)
        if (node) entities.push(node.id)
      }
    }

    // Look for field names
    const fieldMatches = query.match(/\b([A-Z]\d{1,2}[-][A-Z0-9]+)\s+field\b/gi)
    if (fieldMatches) {
      for (const match of fieldMatches) {
        const fieldName = match.replace(/\s+field/i, '')
        const node = allNodes.find(n => n.type === 'FIELD' && n.canonical_id === fieldName)
        if (node) entities.push(node.id)
      }
    }

    // Look for block names
    const blockMatches = query.match(/\b([A-Z]\d{1,2})\b/g)
    if (blockMatches) {
      for (const match of blockMatches) {
        const node = allNodes.find(n => n.type === 'BLOCK' && n.canonical_id === match)
        if (node) entities.push(node.id)
      }
    }

    // Look for operator names
    const allOperators = allNodes.filter(n => n.type === 'OPERATOR')
    for (const operator of allOperators) {
      const opName = operator.properties['name'] as string
      if (query.toLowerCase().includes(opName.toLowerCase())) {
        entities.push(operator.id)
      }
    }

    return [...new Set(entities)]
  }

  // Extract relevant subgraph around entities
  private extractRelevantSubgraph(query: string, entityIds: string[]): Subgraph {
    const nodes = new Map<string, GraphNode>()
    const edges = new Map<string, GraphEdge>()
    const visited = new Set<string>()

    const queryLower = query.toLowerCase()

    // Determine how many hops needed based on query type
    let maxHops = 1
    if (queryLower.includes('operator') && queryLower.includes('block')) maxHops = 2
    if (queryLower.includes('nearby') || queryLower.includes('close')) maxHops = 1
    if (queryLower.includes('which') && queryLower.includes('active')) maxHops = 2

    // BFS from each entity
    for (const startId of entityIds) {
      const queue: Array<{ id: string; hops: number }> = [{ id: startId, hops: 0 }]
      
      while (queue.length > 0) {
        const { id, hops } = queue.shift()!
        
        if (visited.has(id) || hops > maxHops) continue
        visited.add(id)

        const node = this.graph.getNode(id)
        if (!node) continue
        
        nodes.set(id, node)

        // Get connected edges
        const nodeEdges = this.graph.getNodeEdges(id)
        
        for (const edge of nodeEdges) {
          edges.set(edge.id, edge)
          
          // Add connected nodes to queue
          const otherId = edge.from === id ? edge.to : edge.from
          if (!visited.has(otherId)) {
            queue.push({ id: otherId, hops: hops + 1 })
          }
        }
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
    }
  }

  // Generate natural language summary of subgraph
  private generateSummary(subgraph: Subgraph, query: string): string {
    const queryLower = query.toLowerCase()
    const parts: string[] = []

    // Count by type
    const wells = subgraph.nodes.filter(n => n.type === 'WELL')
    const fields = subgraph.nodes.filter(n => n.type === 'FIELD')
    const blocks = subgraph.nodes.filter(n => n.type === 'BLOCK')
    const operators = subgraph.nodes.filter(n => n.type === 'OPERATOR')

    // Generate appropriate summary based on query type
    if (queryLower.includes('operator') && queryLower.includes('block')) {
      // Operator-block analysis
      for (const block of blocks) {
        const blockWells = this.findConnectedWells(block.id, subgraph)
        const blockOperators = this.aggregateOperators(blockWells)
        
        if (blockOperators.length > 0) {
          parts.push(
            `Block ${block.canonical_id} has ${blockWells.length} wells. ` +
            `Operators: ${blockOperators.map(o => `${o.name} (${o.count})`).join(', ')}.`
          )
        }
      }
    } else if (queryLower.includes('field')) {
      // Field analysis
      for (const field of fields) {
        const fieldWells = this.findConnectedWells(field.id, subgraph)
        parts.push(
          `Field ${field.canonical_id} (${field.properties['RESULT'] || 'unknown result'}) ` +
          `has ${fieldWells.length} associated wells.`
        )
      }
    } else if (queryLower.includes('nearby') || queryLower.includes('close')) {
      // Proximity analysis
      for (const well of wells) {
        const nearbyWells = this.findNearbyWells(well.id, subgraph)
        parts.push(
          `Well ${well.canonical_id} has ${nearbyWells.length} nearby wells within 10km.`
        )
      }
    } else {
      // General summary
      parts.push(
        `Knowledge graph contains: ` +
        `${wells.length} wells, ${fields.length} fields, ${blocks.length} blocks, ${operators.length} operators.`
      )
    }

    return parts.join('\n') || 'No relevant entities found in knowledge graph.'
  }

  // Find wells connected to a node
  private findConnectedWells(nodeId: string, subgraph: Subgraph): GraphNode[] {
    const wells: GraphNode[] = []
    const nodeIds = new Set(subgraph.nodes.map(n => n.id))
    
    for (const edge of subgraph.edges) {
      if (edge.from === nodeId || edge.to === nodeId) {
        const otherId = edge.from === nodeId ? edge.to : edge.from
        const otherNode = this.graph.getNode(otherId)
        if (otherNode?.type === 'WELL' && nodeIds.has(otherId)) {
          wells.push(otherNode)
        }
      }
    }
    
    return wells
  }

  // Find wells nearby a well
  private findNearbyWells(wellId: string, subgraph: Subgraph): GraphNode[] {
    return subgraph.edges
      .filter(e => e.type === 'WELL_NEARBY_WELL' && (e.from === wellId || e.to === wellId))
      .map(e => {
        const otherId = e.from === wellId ? e.to : e.from
        return this.graph.getNode(otherId)!
      })
      .filter(Boolean)
  }

  // Aggregate operators from wells
  private aggregateOperators(wells: GraphNode[]): Array<{ name: string; count: number }> {
    const counts: Record<string, number> = {}
    
    for (const well of wells) {
      const operator = well.properties['OPERATOR'] as string
      if (operator && operator !== 'Unknown') {
        counts[operator] = (counts[operator] || 0) + 1
      }
    }
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
  }

  // Generate provenance report
  private generateProvenanceReport(subgraph: Subgraph): string {
    const byProvenance: Record<string, number> = {}
    
    for (const edge of subgraph.edges) {
      const prov = edge.properties.provenance
      byProvenance[prov] = (byProvenance[prov] || 0) + 1
    }
    
    const parts: string[] = []
    parts.push('Data provenance in this analysis:')
    
    for (const [prov, count] of Object.entries(byProvenance)) {
      const label = prov.replace(/_/g, ' ').toLowerCase()
      parts.push(`- ${count} relationships are ${label}`)
    }
    
    // Add specific warnings
    const inferred = subgraph.edges.filter(e => 
      e.properties.provenance === 'INFERRED_AGGREGATE' || 
      e.properties.provenance === 'INFERRED_SPATIAL'
    )
    
    if (inferred.length > 0) {
      parts.push(`\nNote: ${inferred.length} relationships were inferred (not from direct data).`)
      parts.push('Inferred relationships may have uncertainty - check confidence scores.')
    }
    
    return parts.join('\n')
  }

  // Check for low confidence edges
  private checkConfidence(subgraph: Subgraph): string | undefined {
    const lowConfidence = subgraph.edges.filter(e => 
      e.properties.confidence.score < 0.7
    )
    
    if (lowConfidence.length === 0) return undefined
    
    const byType: Record<string, number> = {}
    for (const edge of lowConfidence) {
      byType[edge.type] = (byType[edge.type] || 0) + 1
    }
    
    const parts: string[] = []
    parts.push(`Warning: ${lowConfidence.length} relationships have low confidence (< 70%):`)
    
    for (const [type, count] of Object.entries(byType)) {
      parts.push(`- ${count} ${type.replace(/_/g, ' ').toLowerCase()} relationships`)
    }
    
    parts.push('\nThese relationships may be incomplete or outdated.')
    
    return parts.join('\n')
  }

  // Get context as formatted string for LLM
  getContextString(query: string, entities?: string[]): string {
    const context = this.buildContext(query, entities)
    
    const parts: string[] = []
    parts.push('=== KNOWLEDGE GRAPH CONTEXT ===')
    parts.push(context.summary)
    parts.push('')
    parts.push('=== DATA PROVENANCE ===')
    parts.push(context.provenanceReport)
    
    if (context.confidenceWarning) {
      parts.push('')
      parts.push('=== CONFIDENCE WARNING ===')
      parts.push(context.confidenceWarning)
    }
    
    parts.push('')
    parts.push(`Entities: ${context.nodes.length} | Relationships: ${context.edges.length}`)
    
    return parts.join('\n')
  }
}

// Types
interface Subgraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphRagContext {
  nodes: GraphNode[]
  edges: GraphEdge[]
  summary: string
  provenanceReport: string
  confidenceWarning?: string
}

// Convenience functions
export function buildGraphRagContext(query: string, entities?: string[]): GraphRagContext {
  const builder = new GraphRagBuilder()
  return builder.buildContext(query, entities)
}

export function getGraphRagContextString(query: string, entities?: string[]): string {
  const builder = new GraphRagBuilder()
  return builder.getContextString(query, entities)
}
