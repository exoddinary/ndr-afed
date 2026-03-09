// Knowledge Graph module exports

export {
  KnowledgeGraph,
  getKnowledgeGraph,
  resetKnowledgeGraph,
} from './graph-types'

export type {
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  ProvenanceLabel,
  EdgeConfidence,
} from './graph-types'

export {
  GraphBuilder,
  buildKnowledgeGraph,
} from './graph-builder'

export {
  GraphRagBuilder,
  buildGraphRagContext,
  getGraphRagContextString,
} from './graph-rag'

export type {
  GraphRagContext,
} from './graph-rag'
