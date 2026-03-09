import { NextRequest, NextResponse } from 'next/server'
import { buildKnowledgeGraph, getKnowledgeGraph } from '@/lib/ndr-agents/tools/graph-index'
import { getLayerFeatures } from '@/lib/ndr-agents/tools/geo-tools'
import * as turf from '@turf/turf'

// API endpoint to preview knowledge graph data
export async function GET(req: NextRequest) {
  try {
    // Ensure graph is built
    await buildKnowledgeGraph()
    const graph = getKnowledgeGraph()
    
    const searchParams = req.nextUrl.searchParams
    const format = searchParams.get('format') || 'summary'
    const blockId = searchParams.get('block')
    const debugWells = searchParams.get('debugWells') === 'true' // Debug mode
    
    // DEBUG: Check all wells against a specific block
    if (debugWells && blockId) {
      const [blockFeatures, wellFeatures] = await Promise.all([
        getLayerFeatures('blocks'),
        getLayerFeatures('wells')
      ])
      
      const block = blockFeatures.find(b => b.properties.BlokNummer === blockId)
      if (!block) {
        return NextResponse.json({ error: `Block ${blockId} not found in GeoJSON` }, { status: 404 })
      }
      
      const blockPolygon = turf.feature(block.geometry as GeoJSON.Polygon)
      const results: any[] = []
      
      // Check all wells
      for (const well of wellFeatures) {
        if (!well.geometry) continue
        
        const wellPoint = turf.point(well.geometry.coordinates as [number, number])
        const wellId = well.properties.IDENTIFICA
        
        try {
          // Strict check
          const isInside = turf.booleanPointInPolygon(wellPoint, blockPolygon)
          
          // Buffer check
          let isNear = false
          if (!isInside) {
            const buffer = turf.buffer(blockPolygon, 0.1, { units: 'kilometers' })
            if (buffer && turf.booleanPointInPolygon(wellPoint, buffer)) {
              isNear = true
            }
          }
          
          // Distance to edge
          let distance: number | null = null
          try {
            const buffered = turf.buffer(blockPolygon, -0.001, { units: 'kilometers' })
            if (buffered && turf.booleanPointInPolygon(wellPoint, buffered)) {
              distance = 0.1
            } else if (isInside) {
              distance = 1.0
            }
          } catch {}
          
          if (isInside || isNear) {
            results.push({
              wellId,
              isInside,
              isNear,
              distance,
              coords: well.geometry.coordinates
            })
          }
        } catch (e) {
          // Skip invalid
        }
      }
      
      return NextResponse.json({
        block: blockId,
        blockCoords: block.geometry,
        matchedWells: results.length,
        wells: results.sort((a, b) => (b.isInside ? 1 : 0) - (a.isInside ? 1 : 0))
      })
    }
    
    if (format === 'block-network' && blockId) {
      // Get all entities connected to a specific block
      const blockNodeId = `BLOCK:${blockId}`
      const block = graph.getNode(blockNodeId)
      
      if (!block) {
        return NextResponse.json({ error: `Block ${blockId} not found` }, { status: 404 })
      }
      
      // Get all edges connected to this block
      const allEdges = graph.getAllEdges()
      const connectedEdges = allEdges.filter(e => e.from === blockNodeId || e.to === blockNodeId)
      
      // Collect connected nodes
      const connectedNodeIds = new Set<string>()
      connectedEdges.forEach(e => {
        connectedNodeIds.add(e.from)
        connectedNodeIds.add(e.to)
      })
      
      const nodes = Array.from(connectedNodeIds).map(id => {
        const node = graph.getNode(id)
        if (!node) return null
        return {
          id: node.id,
          type: node.type,
          name: node.canonical_id,
          properties: Object.fromEntries(
            Object.entries(node.properties).slice(0, 5) // Limit properties
          )
        }
      }).filter(Boolean)
      
      return NextResponse.json({
        block: blockId,
        nodes: nodes,
        edges: connectedEdges.map(e => ({
          type: e.type,
          from: e.from,
          to: e.to,
          confidence: e.properties.confidence?.score,
          provenance: e.properties.provenance,
          method: e.properties.method
        })),
        summary: {
          wells: nodes.filter(n => n?.type === 'WELL').length,
          fields: nodes.filter(n => n?.type === 'FIELD').length,
          operators: nodes.filter(n => n?.type === 'OPERATOR').length
        }
      })
    }
    
    if (format === 'nodes') {
      const allNodes = graph.getAllNodes()
      return NextResponse.json({
        count: allNodes.length,
        byType: allNodes.reduce((acc, node) => {
          acc[node.type] = (acc[node.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        nodes: allNodes.slice(0, 100).map(n => ({
          id: n.id,
          type: n.type,
          name: n.canonical_id
        }))
      })
    }
    
    if (format === 'edges') {
      const allEdges = graph.getAllEdges()
      return NextResponse.json({
        count: allEdges.length,
        byType: allEdges.reduce((acc, edge) => {
          acc[edge.type] = (acc[edge.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        edges: allEdges.slice(0, 100).map(e => ({
          type: e.type,
          from: e.from,
          to: e.to,
          confidence: e.properties.confidence?.score
        }))
      })
    }
    
    // Default: summary
    const stats = graph.getStats()
    return NextResponse.json({
      summary: stats,
      preview: {
        totalNodes: stats.nodes,
        totalEdges: stats.edges,
        byType: stats.byType,
        sampleQueries: [
          `/api/graph/preview?format=block-network&block=F03`,
          `/api/graph/preview?format=nodes`,
          `/api/graph/preview?format=edges`
        ]
      }
    })
    
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Graph Preview Error]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
