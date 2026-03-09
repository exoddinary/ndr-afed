import { getKnowledgeGraph, GraphNode, GraphEdge, EdgeType, ProvenanceLabel } from './graph-types'
import * as turf from '@turf/turf'

// Graph-aware query tools for the Graph Agent
// These provide structured access to entity relationships with provenance

export interface OperatorBlockAssociation {
  operator: string
  blockId: string
  blockName: string
  confidence: number
  evidenceCount: number
  evidenceWells: string[]
  method: string
  provenance: ProvenanceLabel
  activityScore: number // Composite score based on well count, field presence, etc.
}

export interface AssociationExplanation {
  relationship: string
  confidence: number
  evidence: {
    type: 'well_activity' | 'field_operation' | 'seismic_involvement' | 'licensing'
    count: number
    details: string[]
  }[]
  provenance: ProvenanceLabel
  method: string
  limitations: string[]
}

/**
 * Get all operators associated with a specific block
 * Returns associations with confidence scores and evidence
 */
export function getOperatorsInBlock(blockId: string): OperatorBlockAssociation[] {
  const graph = getKnowledgeGraph()
  const block = graph.getNode(`BLOCK:${blockId}`)
  
  if (!block) {
    return []
  }

  // Get all wells in this block
  const wellEdges = graph.getNodeEdges(block.id, 'in', 'WELL_LOCATED_IN_BLOCK')
  const wells: GraphNode[] = []
  const operatorWellCounts: Record<string, { wells: GraphNode[], edges: GraphEdge[] }> = {}

  for (const edge of wellEdges) {
    const well = graph.getNode(edge.from)
    if (!well) continue
    
    wells.push(well)
    const operatorName = well.properties['OPERATOR'] as string
    if (operatorName && operatorName !== 'Unknown') {
      if (!operatorWellCounts[operatorName]) {
        operatorWellCounts[operatorName] = { wells: [], edges: [] }
      }
      operatorWellCounts[operatorName].wells.push(well)
      operatorWellCounts[operatorName].edges.push(edge)
    }
  }

  // Also check for explicit OPERATOR_ACTIVE_IN_BLOCK edges
  const directOperatorEdges = graph.getNodeEdges(block.id, 'in', 'OPERATOR_ACTIVE_IN_BLOCK')
  
  // Get fields in block for additional context
  const fieldEdges = graph.getNodeEdges(block.id, 'in', 'FIELD_INTERSECTS_BLOCK')
  const fieldsInBlock: GraphNode[] = []
  const operatorFieldCounts: Record<string, number> = {}
  
  for (const edge of fieldEdges) {
    const field = graph.getNode(edge.from)
    if (!field) continue
    fieldsInBlock.push(field)
    const fieldOperator = field.properties['OPERATOR'] as string
    if (fieldOperator && fieldOperator !== 'Unknown') {
      operatorFieldCounts[fieldOperator] = (operatorFieldCounts[fieldOperator] || 0) + 1
    }
  }

  // Build associations with evidence scoring
  const associations: OperatorBlockAssociation[] = []
  
  for (const [operatorName, data] of Object.entries(operatorWellCounts)) {
    const wellCount = data.wells.length
    const wellRatio = wellCount / wells.length
    
    // Calculate activity score based on multiple factors
    const fieldPresence = operatorFieldCounts[operatorName] || 0
    const fieldScore = fieldPresence > 0 ? 0.3 : 0
    
    const wellScore = Math.min(wellCount * 0.15, 0.5) // Cap at 0.5 for well count
    const dominanceScore = wellRatio * 0.2 // Bonus for being dominant operator
    
    const activityScore = wellScore + fieldScore + dominanceScore
    
    // Get confidence from edges (use average if multiple)
    const avgConfidence = data.edges.reduce((sum, e) => 
      sum + e.properties.confidence.score, 0
    ) / data.edges.length
    
    // Find the OPERATOR_ACTIVE_IN_BLOCK edge if it exists
    const directEdge = directOperatorEdges.find(e => {
      const operatorNode = graph.getNode(e.from)
      return operatorNode?.properties['name'] === operatorName
    })
    
    const finalConfidence = directEdge 
      ? Math.max(avgConfidence, directEdge.properties.confidence.score)
      : avgConfidence
    
    associations.push({
      operator: operatorName,
      blockId: blockId,
      blockName: block.properties['BlokNummer'] as string || blockId,
      confidence: finalConfidence,
      evidenceCount: wellCount,
      evidenceWells: data.wells.map(w => w.properties['IDENTIFICA'] as string).filter(Boolean),
      method: directEdge 
        ? directEdge.properties.method 
        : `inferred_from_${wellCount}_wells`,
      provenance: directEdge 
        ? directEdge.properties.provenance 
        : 'INFERRED_AGGREGATE',
      activityScore
    })
  }

  // Sort by activity score (descending)
  return associations.sort((a, b) => b.activityScore - a.activityScore)
}

/**
 * Get all blocks associated with a specific operator
 */
export function getBlocksByOperator(operatorName: string): OperatorBlockAssociation[] {
  const graph = getKnowledgeGraph()
  const operator = graph.getNode(`OPERATOR:${operatorName}`)
  
  if (!operator) {
    return []
  }

  // Get direct OPERATOR_ACTIVE_IN_BLOCK edges
  const directEdges = graph.getNodeEdges(operator.id, 'out', 'OPERATOR_ACTIVE_IN_BLOCK')
  
  // Get wells drilled by this operator
  const wellEdges = graph.getNodeEdges(operator.id, 'in', 'WELL_DRILLED_BY')
  const blockAssociations: Record<string, OperatorBlockAssociation> = {}

  // Process wells to find associated blocks
  for (const edge of wellEdges) {
    const well = graph.getNode(edge.from)
    if (!well) continue

    // Find which block this well is in
    const blockEdges = graph.getNodeEdges(well.id, 'out', 'WELL_LOCATED_IN_BLOCK')
    
    for (const blockEdge of blockEdges) {
      const block = graph.getNode(blockEdge.to)
      if (!block) continue

      const blockId = block.canonical_id || block.id.replace('BLOCK:', '')
      
      if (!blockAssociations[blockId]) {
        blockAssociations[blockId] = {
          operator: operatorName,
          blockId: blockId,
          blockName: block.properties['BlokNummer'] as string || blockId,
          confidence: blockEdge.properties.confidence.score,
          evidenceCount: 0,
          evidenceWells: [],
          method: 'inferred_from_well_locations',
          provenance: 'INFERRED_SPATIAL',
          activityScore: 0
        }
      }

      blockAssociations[blockId].evidenceCount++
      const wellId = well.properties['IDENTIFICA'] as string
      if (wellId && !blockAssociations[blockId].evidenceWells.includes(wellId)) {
        blockAssociations[blockId].evidenceWells.push(wellId)
      }
      
      // Update confidence (take max)
      blockAssociations[blockId].confidence = Math.max(
        blockAssociations[blockId].confidence,
        blockEdge.properties.confidence.score
      )
    }
  }

  // Enhance with direct edges and recalculate activity scores
  for (const directEdge of directEdges) {
    const block = graph.getNode(directEdge.to)
    if (!block) continue
    
    const blockId = block.canonical_id || block.id.replace('BLOCK:', '')
    
    if (blockAssociations[blockId]) {
      // Enhance existing association
      blockAssociations[blockId].confidence = Math.max(
        blockAssociations[blockId].confidence,
        directEdge.properties.confidence.score
      )
      blockAssociations[blockId].method = directEdge.properties.method
      blockAssociations[blockId].provenance = directEdge.properties.provenance
    }
  }

  // Calculate activity scores
  for (const assoc of Object.values(blockAssociations)) {
    const wellScore = Math.min(assoc.evidenceCount * 0.15, 0.5)
    const fieldPresence = getFieldsByOperatorInBlock(operatorName, assoc.blockId).length
    const fieldScore = fieldPresence > 0 ? 0.3 : 0
    assoc.activityScore = wellScore + fieldScore
  }

  return Object.values(blockAssociations).sort((a, b) => b.activityScore - a.activityScore)
}

/**
 * Get fields operated by a specific operator within a block
 */
function getFieldsByOperatorInBlock(operatorName: string, blockId: string): GraphNode[] {
  const graph = getKnowledgeGraph()
  const block = graph.getNode(`BLOCK:${blockId}`)
  
  if (!block) return []

  const fieldEdges = graph.getNodeEdges(block.id, 'in', 'FIELD_INTERSECTS_BLOCK')
  const matchingFields: GraphNode[] = []

  for (const edge of fieldEdges) {
    const field = graph.getNode(edge.from)
    if (!field) continue
    
    const fieldOperator = field.properties['OPERATOR'] as string
    if (fieldOperator === operatorName) {
      matchingFields.push(field)
    }
  }

  return matchingFields
}

/**
 * Explain how an operator-block association was derived
 * Provides transparency on the reasoning process
 */
export function explainAssociation(operatorName: string, blockId: string): AssociationExplanation {
  const graph = getKnowledgeGraph()
  const associations = getOperatorsInBlock(blockId)
  const association = associations.find(a => a.operator === operatorName)
  
  if (!association) {
    return {
      relationship: `No association found between ${operatorName} and block ${blockId}`,
      confidence: 0,
      evidence: [],
      provenance: 'HEURISTIC',
      method: 'no_data',
      limitations: ['No well activity recorded', 'No field operations detected']
    }
  }

  const evidence: AssociationExplanation['evidence'] = []
  const limitations: string[] = []

  // Well activity evidence
  if (association.evidenceCount > 0) {
    evidence.push({
      type: 'well_activity',
      count: association.evidenceCount,
      details: [
        `${association.evidenceCount} wells drilled by ${operatorName}`,
        `Well IDs: ${association.evidenceWells.slice(0, 5).join(', ')}${association.evidenceWells.length > 5 ? '...' : ''}`
      ]
    })
  }

  // Field operation evidence
  const fields = getFieldsByOperatorInBlock(operatorName, blockId)
  if (fields.length > 0) {
    evidence.push({
      type: 'field_operation',
      count: fields.length,
      details: fields.map(f => `${f.properties['FIELD_NAME']} (${f.properties['RESULT'] || 'unknown result'})`)
    })
  }

  // Determine limitations based on provenance
  if (association.provenance === 'INFERRED_AGGREGATE') {
    limitations.push('Association inferred from drilling activity, not licensing records')
    limitations.push('Operator may have changed due to acquisitions or farm-outs')
  }
  
  if (association.provenance === 'INFERRED_SPATIAL') {
    limitations.push('Based on spatial containment (wells inside block polygon)')
    limitations.push('Coordinate precision may affect accuracy')
  }

  if (association.evidenceCount < 3) {
    limitations.push('Limited well sample size reduces confidence')
  }

  return {
    relationship: `${operatorName} is associated with block ${blockId}`,
    confidence: association.confidence,
    evidence,
    provenance: association.provenance,
    method: association.method,
    limitations: limitations.length > 0 ? limitations : ['Data completeness appears good']
  }
}

/**
 * Get wells in a specific block with context
 */
export function getWellsInBlock(blockId: string): Array<{
  wellId: string
  operator: string
  status: string
  result: string
  fieldName?: string
}> {
  const graph = getKnowledgeGraph()
  const block = graph.getNode(`BLOCK:${blockId}`)
  
  if (!block) return []

  const wellEdges = graph.getNodeEdges(block.id, 'in', 'WELL_LOCATED_IN_BLOCK')
  const wells: Array<{
    wellId: string
    operator: string
    status: string
    result: string
    fieldName?: string
  }> = []

  for (const edge of wellEdges) {
    const well = graph.getNode(edge.from)
    if (!well) continue

    wells.push({
      wellId: well.properties['IDENTIFICA'] as string || 'Unknown',
      operator: well.properties['OPERATOR'] as string || 'Unknown',
      status: well.properties['STATUS'] as string || 'Unknown',
      result: well.properties['WELL_RESUL'] as string || 'Unknown',
      fieldName: well.properties['FIELD_NAME'] as string || undefined
    })
  }

  return wells
}

/**
 * Calculate operator activity score within a block
 * Composite score based on multiple factors
 */
export function getOperatorActivityScore(operatorName: string, blockId: string): {
  score: number
  breakdown: {
    wellActivity: number
    fieldPresence: number
    seismicInvolvement: number
    wellQuality: number
  }
  details: {
    wellCount: number
    producingWells: number
    dryWells: number
    fieldCount: number
    gasFields: number
    oilFields: number
  }
} {
  const graph = getKnowledgeGraph()
  const wells = getWellsInBlock(blockId).filter(w => w.operator === operatorName)
  const fields = getFieldsByOperatorInBlock(operatorName, blockId)
  
  const wellCount = wells.length
  const producingWells = wells.filter(w => 
    w.result?.toLowerCase().includes('gas') || w.result?.toLowerCase().includes('oil')
  ).length
  const dryWells = wells.filter(w => 
    w.result?.toLowerCase().includes('dry') || w.result?.toLowerCase().includes('abandoned')
  ).length
  
  const gasFields = fields.filter(f => 
    (f.properties['RESULT'] as string)?.toLowerCase().includes('gas')
  ).length
  const oilFields = fields.filter(f => 
    (f.properties['RESULT'] as string)?.toLowerCase().includes('oil')
  ).length
  
  // Calculate component scores
  const wellActivity = Math.min(wellCount * 0.2, 0.4) // Cap at 0.4
  const fieldPresence = fields.length > 0 ? 0.3 : 0
  const seismicInvolvement = 0 // Placeholder for future seismic tracking
  const wellQuality = wellCount > 0 ? (producingWells / wellCount) * 0.3 : 0
  
  const totalScore = wellActivity + fieldPresence + seismicInvolvement + wellQuality
  
  return {
    score: Math.min(totalScore, 1.0),
    breakdown: {
      wellActivity,
      fieldPresence,
      seismicInvolvement,
      wellQuality
    },
    details: {
      wellCount,
      producingWells,
      dryWells,
      fieldCount: fields.length,
      gasFields,
      oilFields
    }
  }
}

/**
 * Get nearby fields within a radius of a target field
 */
export function getNearbyFields(
  fieldId: string, 
  radiusKm: number
): Array<{
  fieldId: string
  fieldName: string
  distanceKm: number
  result: string
  operator: string
}> {
  const graph = getKnowledgeGraph()
  const targetField = graph.getNode(`FIELD:${fieldId}`)
  
  if (!targetField || !targetField.geometry) return []

  const targetCenter = turf.centroid(turf.feature(targetField.geometry) as GeoJSON.Feature<GeoJSON.Polygon>)
  const allFields = graph.findNodesByType('FIELD')
  
  const nearby: Array<{
    fieldId: string
    fieldName: string
    distanceKm: number
    result: string
    operator: string
  }> = []

  for (const field of allFields) {
    if (field.id === targetField.id || !field.geometry) continue
    
    const fieldCenter = turf.centroid(turf.feature(field.geometry) as GeoJSON.Feature<GeoJSON.Polygon>)
    const distance = turf.distance(targetCenter, fieldCenter, { units: 'kilometers' })
    
    if (distance <= radiusKm) {
      nearby.push({
        fieldId: field.canonical_id || field.id.replace('FIELD:', ''),
        fieldName: field.properties['FIELD_NAME'] as string || 'Unknown',
        distanceKm: Math.round(distance * 10) / 10,
        result: field.properties['RESULT'] as string || 'Unknown',
        operator: field.properties['OPERATOR'] as string || 'Unknown'
      })
    }
  }

  return nearby.sort((a, b) => a.distanceKm - b.distanceKm)
}

/**
 * Trace the full context around a well (block, field, nearby wells, operator history)
 */
export function traceWellContext(wellId: string): {
  well: GraphNode | null
  block: GraphNode | null
  field: GraphNode | null
  operator: GraphNode | null
  nearbyWells: Array<{ wellId: string; distanceKm: number; operator: string }>
  associations: {
    blockConfidence?: number
    fieldConfidence?: number
    operatorConfidence?: number
  }
} {
  const graph = getKnowledgeGraph()
  const well = graph.getNode(`WELL:${wellId}`)
  
  if (!well) {
    return {
      well: null,
      block: null,
      field: null,
      operator: null,
      nearbyWells: [],
      associations: {}
    }
  }

  // Get block
  const blockEdge = graph.getNodeEdges(well.id, 'out', 'WELL_LOCATED_IN_BLOCK')[0]
  const block = blockEdge ? graph.getNode(blockEdge.to) : null

  // Get field
  const fieldEdge = graph.getNodeEdges(well.id, 'out', 'WELL_LOCATED_IN_FIELD')[0]
  const field = fieldEdge ? graph.getNode(fieldEdge.to) : null

  // Get operator
  const operatorEdge = graph.getNodeEdges(well.id, 'out', 'WELL_DRILLED_BY')[0]
  const operator = operatorEdge ? graph.getNode(operatorEdge.to) : null

  // Get nearby wells
  const nearbyWellEdges = graph.getNodeEdges(well.id, 'out', 'WELL_NEARBY_WELL')
  const nearbyWells = nearbyWellEdges.map(edge => {
    const nearbyWell = graph.getNode(edge.to)
    if (!nearbyWell) return null
    
    // Extract distance from method string
    const method = edge.properties.method
    const distanceMatch = method.match(/distance: ([\d.]+)km/)
    const distanceKm = distanceMatch ? parseFloat(distanceMatch[1]) : 0
    
    return {
      wellId: nearbyWell.properties['IDENTIFICA'] as string || 'Unknown',
      distanceKm,
      operator: nearbyWell.properties['OPERATOR'] as string || 'Unknown'
    }
  }).filter((w): w is NonNullable<typeof w> => w !== null)

  return {
    well: well || null,
    block: block || null,
    field: field || null,
    operator: operator || null,
    nearbyWells: nearbyWells.sort((a, b) => a.distanceKm - b.distanceKm),
    associations: {
      blockConfidence: blockEdge?.properties.confidence.score,
      fieldConfidence: fieldEdge?.properties.confidence.score,
      operatorConfidence: operatorEdge?.properties.confidence.score
    }
  }
}
