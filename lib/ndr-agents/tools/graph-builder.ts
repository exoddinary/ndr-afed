import { getLayerFeatures, LAYER_META } from './geo-tools'
import type { LayerName } from './geo-tools'
import {
  KnowledgeGraph,
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  ProvenanceLabel,
  EdgeConfidence,
  getKnowledgeGraph,
} from './graph-types'
import * as turf from '@turf/turf'

// Graph builder - loads GeoJSON data and builds knowledge graph
export class GraphBuilder {
  private graph: KnowledgeGraph

  constructor(graph?: KnowledgeGraph) {
    this.graph = graph || getKnowledgeGraph()
  }

  // Build complete graph from all layers
  async buildGraph(): Promise<void> {
    console.log('[GraphBuilder] Starting graph construction...')
    this.graph.clear()

    // 1. Create nodes for all entities
    await this.buildNodes()
    
    // 2. Create direct relationships
    await this.buildDirectRelationships()
    
    // 3. Create inferred spatial relationships
    await this.buildSpatialRelationships()
    
    // 4. Create inferred temporal relationships
    await this.buildTemporalRelationships()
    
    // 5. Create aggregated relationships
    await this.buildAggregatedRelationships()

    const stats = this.graph.getStats()
    console.log('[GraphBuilder] Graph complete:', stats)
  }

  // Build nodes from all layers
  private async buildNodes(): Promise<void> {
    const layerConfigs: Array<{ layer: LayerName; type: NodeType; idField: string }> = [
      { layer: 'wells', type: 'WELL', idField: 'IDENTIFICA' },
      { layer: 'fields', type: 'FIELD', idField: 'FIELD_NAME' },
      { layer: 'blocks', type: 'BLOCK', idField: 'BlokNummer' },
      { layer: 'licenses', type: 'LICENSE', idField: 'licence_nm' },
      { layer: 'seismic2d', type: 'SEISMIC_2D', idField: 'line_name' },
      { layer: 'seismic3d', type: 'SEISMIC_3D', idField: 'SURVEY_ID' },
    ]

    for (const config of layerConfigs) {
      const features = await getLayerFeatures(config.layer)
      console.log(`[GraphBuilder] Loading ${features.length} ${config.layer}...`)
      
      for (const feature of features) {
        const id = String(feature.properties[config.idField] || '')
        if (!id) continue

        const node: GraphNode = {
          id: `${config.type}:${id}`,
          type: config.type,
          properties: feature.properties,
          geometry: feature.geometry,
          source_layer: config.layer,
          canonical_id: id,
        }
        
        this.graph.addNode(node)

        // Create operator nodes for unique operators
        if (config.type === 'WELL' || config.type === 'FIELD') {
          const operator = feature.properties['OPERATOR'] as string
          if (operator && operator !== 'Unknown') {
            this.ensureOperatorNode(operator)
          }
        }
      }
    }
  }

  // Ensure operator node exists
  private ensureOperatorNode(operatorName: string): GraphNode {
    const operatorId = `OPERATOR:${operatorName}`
    let node = this.graph.getNode(operatorId)
    
    if (!node) {
      node = {
        id: operatorId,
        type: 'OPERATOR',
        properties: { name: operatorName },
        source_layer: 'wells', // Derived from wells/fields
        canonical_id: operatorName,
      }
      this.graph.addNode(node)
    }
    
    return node
  }

  // Build direct relationships from explicit fields
  private async buildDirectRelationships(): Promise<void> {
    console.log('[GraphBuilder] Building direct relationships...')

    // WELL_DRILLED_BY - from Wells.OPERATOR
    const wells = this.graph.findNodesByType('WELL')
    for (const well of wells) {
      const operatorName = well.properties['OPERATOR'] as string
      if (operatorName && operatorName !== 'Unknown') {
        const operator = this.ensureOperatorNode(operatorName)
        this.addEdge(well.id, operator.id, 'WELL_DRILLED_BY', 'OFFICIAL_DIRECT', {
          score: 0.9,
          temporal_freshness: 0.8, // May be outdated due to acquisitions
        })
      }

      // WELL_LOCATED_IN_FIELD - from Wells.FIELD_NAME
      const fieldName = well.properties['FIELD_NAME'] as string
      if (fieldName && fieldName !== ' ' && fieldName !== '') {
        const fieldId = `FIELD:${fieldName}`
        const field = this.graph.getNode(fieldId)
        if (field) {
          this.addEdge(well.id, field.id, 'WELL_LOCATED_IN_FIELD', 'OFFICIAL_DIRECT', {
            score: 0.85,
            data_completeness: 0.9, // Some wells may not have field assigned
          })
          this.addEdge(field.id, well.id, 'FIELD_CONTAINS_WELL', 'OFFICIAL_DIRECT', {
            score: 0.85,
          })
        }
      }
    }

    // OPERATOR_OPERATES_FIELD - from Fields.OPERATOR
    const fields = this.graph.findNodesByType('FIELD')
    for (const field of fields) {
      const operatorName = field.properties['OPERATOR'] as string
      if (operatorName && operatorName !== 'Unknown') {
        const operator = this.ensureOperatorNode(operatorName)
        this.addEdge(operator.id, field.id, 'OPERATOR_OPERATES_FIELD', 'OFFICIAL_DIRECT', {
          score: 0.8,
          temporal_freshness: 0.7, // Field operators change over time
          stale_warning: true,
        })
      }
    }
  }

  // Build spatial relationships using turf.js
  private async buildSpatialRelationships(): Promise<void> {
    console.log('[GraphBuilder] Building spatial relationships...')

    const wells = this.graph.findNodesByType('WELL')
    const blocks = this.graph.findNodesByType('BLOCK')
    const fields = this.graph.findNodesByType('FIELD')
    const seismic2d = this.graph.findNodesByType('SEISMIC_2D')
    const seismic3d = this.graph.findNodesByType('SEISMIC_3D')

    // WELL_LOCATED_IN_BLOCK - point in polygon with buffer for edge cases
    console.log(`[GraphBuilder] Checking ${wells.length} wells in ${blocks.length} blocks...`)
    for (const well of wells) { // Check ALL wells, not just first 500
      if (!well.geometry) continue
      
      const wellPoint = turf.point(well.geometry.coordinates as [number, number])
      
      let foundBlock = false
      for (const block of blocks) {
        if (!block.geometry) continue
        
        try {
          const blockPolygon = turf.feature(block.geometry as GeoJSON.Polygon)
          
          // Primary check: strict point-in-polygon
          let isInside = turf.booleanPointInPolygon(wellPoint, blockPolygon)
          
          // Secondary check: if not inside, check if within 100m of polygon edge
          // This helps with wells that are just barely outside due to coordinate precision
          if (!isInside) {
            try {
              const buffer = turf.buffer(blockPolygon, 0.1, { units: 'kilometers' }) // 100m buffer
              if (buffer && turf.booleanPointInPolygon(wellPoint, buffer)) {
                // Well is close to block boundary - likely belongs to this block
                isInside = true
                console.log(`[GraphBuilder] Well ${well.canonical_id} assigned to ${block.canonical_id} via 100m buffer`)
              }
            } catch (e) {
              // Buffer failed, skip
            }
          }
          
          if (isInside) {
            // Calculate spatial precision based on distance to edge
            const distance = this.distanceToPolygonEdge(wellPoint, blockPolygon)
            const spatialPrecision = distance < 0.01 ? 0.95 : 0.8
            
            this.addEdge(well.id, block.id, 'WELL_LOCATED_IN_BLOCK', 'OFFICIAL_SPATIAL', {
              score: spatialPrecision,
              spatial_precision: spatialPrecision,
              method: distance < 0.01 ? 'point-in-polygon' : 'point-near-polygon-edge',
            })
            foundBlock = true
            break // Well can only be in one block
          }
        } catch (e) {
          // Skip invalid geometries
        }
      }
      
      if (!foundBlock && wells.length < 1000) {
        // Log wells that weren't matched for debugging (only if not too many)
        console.log(`[GraphBuilder] Well ${well.canonical_id} not matched to any block`)
      }
    }

    // FIELD_INTERSECTS_BLOCK - polygon intersection
    console.log(`[GraphBuilder] Checking ${fields.length} fields in ${blocks.length} blocks...`)
    for (const field of fields) { // Check ALL fields, not just first 100
      if (!field.geometry) continue
      
      const fieldPolygon = turf.feature(field.geometry as GeoJSON.Polygon)
      const fieldArea = turf.area(fieldPolygon)
      
      let foundBlock = false
      for (const block of blocks) {
        if (!block.geometry) continue
        
        try {
          const blockPolygon = turf.feature(block.geometry as GeoJSON.Polygon)
          
          if (turf.booleanIntersects(fieldPolygon, blockPolygon)) {
            // Calculate overlap ratio for confidence
            const intersection = turf.intersect(fieldPolygon, blockPolygon)
            if (intersection) {
              const overlapArea = turf.area(intersection)
              const overlapRatio = overlapArea / fieldArea
              const confidence = 0.6 + (overlapRatio * 0.35) // 0.6-0.95 based on overlap
              
              this.addEdge(field.id, block.id, 'FIELD_INTERSECTS_BLOCK', 'OFFICIAL_SPATIAL', {
                score: confidence,
                spatial_precision: confidence,
                method: 'polygon-intersection',
              })
              foundBlock = true
            }
          }
        } catch (e) {
          // Skip invalid geometries
        }
      }
      
      if (!foundBlock && fields.length < 500) {
        console.log(`[GraphBuilder] Field ${field.canonical_id} not matched to any block`)
      }
    }

    // WELL_NEARBY_WELL - spatial proximity (within 10km)
    console.log(`[GraphBuilder] Finding nearby well pairs...`)
    for (let i = 0; i < Math.min(wells.length, 200); i++) {
      const well1 = wells[i]
      if (!well1.geometry) continue
      
      const well1Point = turf.point(well1.geometry.coordinates as [number, number])
      
      for (let j = i + 1; j < Math.min(wells.length, 200); j++) {
        const well2 = wells[j]
        if (!well2.geometry) continue
        
        const well2Point = turf.point(well2.geometry.coordinates as [number, number])
        const distance = turf.distance(well1Point, well2Point, { units: 'kilometers' })
        
        if (distance < 10) { // Within 10km
          this.addEdge(well1.id, well2.id, 'WELL_NEARBY_WELL', 'INFERRED_SPATIAL', {
            score: 0.9,
            spatial_precision: 0.95,
            method: `distance: ${distance.toFixed(1)}km`,
          })
        }
      }
    }
  }

  // Build temporal relationships
  private async buildTemporalRelationships(): Promise<void> {
    console.log('[GraphBuilder] Building temporal relationships...')

    const wells = this.graph.findNodesByType('WELL')
    const seismic3d = this.graph.findNodesByType('SEISMIC_3D')
    const fields = this.graph.findNodesByType('FIELD')

    // WELL_DRILLED_AFTER_SEISMIC - well year after seismic year
    for (const well of wells) {
      const wellYear = this.extractYear(well.properties['START_DATE'])
      if (!wellYear) continue

      const wellBlockEdges = this.graph.getNodeEdges(well.id, 'out', 'WELL_LOCATED_IN_BLOCK')
      
      for (const wellBlockEdge of wellBlockEdges) {
        const blockId = wellBlockEdge.to
        
        // Find seismic that covers this block and is before the well
        for (const seismic of seismic3d) {
          const seismicYear = Number(seismic.properties['YEAR'])
          if (!seismicYear) continue
          
          // Check if seismic covers the same block (would need spatial check)
          // For now, use temporal proximity as heuristic
          const yearDiff = wellYear - seismicYear
          
          if (yearDiff > 0 && yearDiff < 5) { // Well drilled within 5 years after seismic
            this.addEdge(well.id, seismic.id, 'WELL_DRILLED_AFTER_SEISMIC', 'INFERRED_TEMPORAL', {
              score: 0.6 + (0.4 * (1 - yearDiff / 5)), // Higher confidence if closer in time
              temporal_freshness: 0.8,
              method: `${yearDiff} years after seismic`,
            })
          }
        }
      }
    }
  }

  // Build aggregated relationships (derived from multiple sources)
  private async buildAggregatedRelationships(): Promise<void> {
    console.log('[GraphBuilder] Building aggregated relationships...')

    const blocks = this.graph.findNodesByType('BLOCK')

    for (const block of blocks) {
      // Get all wells in this block
      const wellEdges = this.graph.getNodeEdges(block.id, 'in', 'WELL_LOCATED_IN_BLOCK')
      
      if (wellEdges.length === 0) continue

      // Count operators in block
      const operatorCounts: Record<string, number> = {}
      
      for (const edge of wellEdges) {
        const wellId = edge.from
        const well = this.graph.getNode(wellId)
        if (!well) continue

        const operatorName = well.properties['OPERATOR'] as string
        if (operatorName && operatorName !== 'Unknown') {
          operatorCounts[operatorName] = (operatorCounts[operatorName] || 0) + 1
        }
      }

      // Sort by count
      const sortedOperators = Object.entries(operatorCounts)
        .sort((a, b) => b[1] - a[1])
      
      if (sortedOperators.length > 0) {
        // Primary operator (most wells)
        const [primaryOperator, primaryCount] = sortedOperators[0]
        const totalWells = wellEdges.length
        const operatorRatio = primaryCount / totalWells
        
        const operatorNode = this.ensureOperatorNode(primaryOperator)
        
        // Confidence based on:
        // - Sample size (more wells = higher confidence)
        // - Operator dominance (higher ratio = higher confidence)
        const sampleConfidence = Math.min(0.5 + (totalWells * 0.05), 0.9)
        const dominanceConfidence = operatorRatio
        const overallConfidence = (sampleConfidence + dominanceConfidence) / 2

        this.addEdge(block.id, operatorNode.id, 'BLOCK_LICENSED_BY', 'INFERRED_AGGREGATE', {
          score: overallConfidence,
          sample_size: totalWells,
          data_completeness: sortedOperators.length > 1 ? 0.8 : 0.6, // Multiple operators suggests incomplete data
          method: `mode operator from ${totalWells} wells (${Math.round(operatorRatio * 100)}%)`,
        })
      }
    }
  }

  // Helper: Add edge with confidence
  private addEdge(
    from: string,
    to: string,
    type: EdgeType,
    provenance: ProvenanceLabel,
    confidence: Partial<EdgeConfidence> & { score: number; method?: string }
  ): void {
    const edgeId = `${from}-${type}-${to}`
    
    // Check if edge already exists
    if (this.graph.getAllEdges().find(e => e.id === edgeId)) {
      return
    }

    const fullConfidence: EdgeConfidence = {
      score: confidence.score,
      sample_size: confidence.sample_size,
      data_completeness: confidence.data_completeness,
      temporal_freshness: confidence.temporal_freshness,
      spatial_precision: confidence.spatial_precision,
    }

    const edge: GraphEdge = {
      id: edgeId,
      type,
      from,
      to,
      properties: {
        provenance,
        confidence: fullConfidence,
        inferred_at: new Date(),
        method: confidence.method || 'unspecified',
      },
    }

    this.graph.addEdge(edge)
  }

  // Helper: Extract year from date (handle various formats)
  private extractYear(dateValue: unknown): number | null {
    if (!dateValue) return null
    
    if (typeof dateValue === 'number') {
      // Timestamp in ms
      if (dateValue > 1000000000000) { // Milliseconds
        return new Date(dateValue).getFullYear()
      }
      // Year as number
      if (dateValue > 1900 && dateValue < 2100) {
        return dateValue
      }
    }
    
    if (typeof dateValue === 'string') {
      // Try parsing as year
      const yearNum = parseInt(dateValue)
      if (yearNum > 1900 && yearNum < 2100) {
        return yearNum
      }
      // Try parsing as date string
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return date.getFullYear()
      }
    }
    
    return null
  }

  // Helper: Calculate distance from point to polygon edge
  private distanceToPolygonEdge(point: turf.Feature<turf.Point>, polygon: turf.Feature<turf.Polygon>): number {
    try {
      const buffered = turf.buffer(polygon, -0.001, { units: 'kilometers' }) // Shrink slightly
      if (!buffered) return 0
      
      const isInsideShrunk = turf.booleanPointInPolygon(point, buffered)
      return isInsideShrunk ? 0.1 : 0 // 0.1 if near edge, 0 if clearly inside
    } catch {
      return 0
    }
  }
}

// Convenience function
export async function buildKnowledgeGraph(): Promise<KnowledgeGraph> {
  const builder = new GraphBuilder()
  await builder.buildGraph()
  return getKnowledgeGraph()
}
