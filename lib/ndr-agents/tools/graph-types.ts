import type { LayerName } from './geo-tools'

// Provenance labels for transparency
export type ProvenanceLabel =
  | 'OFFICIAL_DIRECT'      // From official source, explicit field
  | 'OFFICIAL_SPATIAL'     // From official source, computed geometry
  | 'INFERRED_SPATIAL'     // Computed from spatial analysis
  | 'INFERRED_TEMPORAL'    // Computed from temporal analysis
  | 'INFERRED_AGGREGATE'   // Computed from aggregation
  | 'HEURISTIC'            // Rule-based inference with assumptions
  | 'STALE_WARNING'        // Known to be potentially outdated

// Graph node types
export type NodeType = 
  | 'WELL' 
  | 'FIELD' 
  | 'BLOCK' 
  | 'LICENSE' 
  | 'OPERATOR' 
  | 'SEISMIC_2D' 
  | 'SEISMIC_3D'

// Graph edge types
export type EdgeType =
  // Direct relationships
  | 'WELL_DRILLED_BY'
  | 'WELL_LOCATED_IN_FIELD'
  | 'FIELD_CONTAINS_WELL'
  | 'OPERATOR_OPERATES_FIELD'
  // Inferred spatial
  | 'WELL_LOCATED_IN_BLOCK'
  | 'FIELD_INTERSECTS_BLOCK'
  | 'SEISMIC_COVERS_BLOCK'
  | 'SEISMIC_COVERS_FIELD'
  | 'WELL_NEARBY_WELL'
  // Inferred temporal
  | 'WELL_DRILLED_AFTER_SEISMIC'
  | 'FIELD_DISCOVERED_AFTER_SEISMIC'
  // Aggregated
  | 'BLOCK_LICENSED_BY'
  | 'OPERATOR_ACTIVE_IN_BLOCK'

// Confidence metadata for edges
export interface EdgeConfidence {
  score: number                    // 0-1 overall confidence
  sample_size?: number            // How many samples used
  data_completeness?: number      // % of expected data present
  temporal_freshness?: number     // How recent the data
  spatial_precision?: number      // Geometry match quality
}

// Graph node
export interface GraphNode {
  id: string
  type: NodeType
  properties: Record<string, unknown>
  geometry?: GeoJSON.Geometry
  source_layer: LayerName
  canonical_id?: string
}

// Graph edge
export interface GraphEdge {
  id: string
  type: EdgeType
  from: string  // node id
  to: string    // node id
  properties: {
    provenance: ProvenanceLabel
    confidence: EdgeConfidence
    inferred_at: Date
    method: string
  }
}

// In-memory knowledge graph
export class KnowledgeGraph {
  private nodes: Map<string, GraphNode> = new Map()
  private edges: Map<string, GraphEdge> = new Map()
  private nodeEdges: Map<string, Set<string>> = new Map() // node id -> edge ids

  // Add node
  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node)
    if (!this.nodeEdges.has(node.id)) {
      this.nodeEdges.set(node.id, new Set())
    }
  }

  // Add edge
  addEdge(edge: GraphEdge): void {
    this.edges.set(edge.id, edge)
    
    // Track edges per node
    if (!this.nodeEdges.has(edge.from)) {
      this.nodeEdges.set(edge.from, new Set())
    }
    if (!this.nodeEdges.has(edge.to)) {
      this.nodeEdges.set(edge.to, new Set())
    }
    this.nodeEdges.get(edge.from)!.add(edge.id)
    this.nodeEdges.get(edge.to)!.add(edge.id)
  }

  // Get node by ID
  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id)
  }

  // Get all edges for a node
  getNodeEdges(nodeId: string, direction?: 'out' | 'in' | 'both', type?: EdgeType): GraphEdge[] {
    const edgeIds = this.nodeEdges.get(nodeId)
    if (!edgeIds) return []

    let edges = Array.from(edgeIds).map(id => this.edges.get(id)!)
    
    if (direction === 'out') {
      edges = edges.filter(e => e.from === nodeId)
    } else if (direction === 'in') {
      edges = edges.filter(e => e.to === nodeId)
    }
    
    if (type) {
      edges = edges.filter(e => e.type === type)
    }
    
    return edges
  }

  // Get neighbors of a node
  getNeighbors(nodeId: string, edgeType?: EdgeType): GraphNode[] {
    const edges = this.getNodeEdges(nodeId, 'out', edgeType)
    return edges.map(e => this.nodes.get(e.to)!).filter(Boolean)
  }

  // Find nodes by type
  findNodesByType(type: NodeType): GraphNode[] {
    return Array.from(this.nodes.values()).filter(n => n.type === type)
  }

  // Find node by property
  findNodeByProperty(type: NodeType, property: string, value: unknown): GraphNode | undefined {
    return Array.from(this.nodes.values()).find(
      n => n.type === type && n.properties[property] === value
    )
  }

  // Get all nodes
  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values())
  }

  // Get all edges
  getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values())
  }

  // Get stats
  getStats(): { nodes: number; edges: number; byType: Record<NodeType, number> } {
    const byType: Record<NodeType, number> = {} as Record<NodeType, number>
    for (const node of this.nodes.values()) {
      byType[node.type] = (byType[node.type] || 0) + 1
    }
    return {
      nodes: this.nodes.size,
      edges: this.edges.size,
      byType
    }
  }

  // Clear graph
  clear(): void {
    this.nodes.clear()
    this.edges.clear()
    this.nodeEdges.clear()
  }
}

// Singleton instance
let globalGraph: KnowledgeGraph | null = null

export function getKnowledgeGraph(): KnowledgeGraph {
  if (!globalGraph) {
    globalGraph = new KnowledgeGraph()
  }
  return globalGraph
}

export function resetKnowledgeGraph(): void {
  globalGraph = new KnowledgeGraph()
}
