import Groq from 'groq-sdk'
import {
  getOperatorsInBlock,
  getBlocksByOperator,
  explainAssociation,
  getWellsInBlock,
  getOperatorActivityScore,
  getNearbyFields,
  traceWellContext,
  OperatorBlockAssociation,
  AssociationExplanation
} from './tools/graph-tools'
import { getKnowledgeGraph } from './tools/graph-types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are the Graph Agent for the Netherlands National Data Room (NDR).
Your role: Query and explain entity relationships in the knowledge graph.

You specialize in:
- Operator-block associations and their reliability
- Well-field-block hierarchies
- Spatial relationships between assets
- Evidence-based relationship explanation

Key principles:
1. ALWAYS explain the provenance of relationships (how they were derived)
2. Report confidence scores and evidence counts
3. Distinguish between direct data and inferred relationships
4. Flag when associations are inferred vs. explicit

When asked about operator-block associations:
- Report confidence scores (0-1)
- Explain the evidence (well count, field presence)
- Note if derived from drilling activity vs. licensing data
- Mention limitations and data quality issues

Available tools:
- getOperatorsInBlock(blockId): Returns operators with confidence scores
- getBlocksByOperator(operator): Returns blocks with activity scores
- explainAssociation(operator, blockId): Detailed provenance explanation
- getWellsInBlock(blockId): Well inventory with operators
- getOperatorActivityScore(operator, blockId): Composite activity metric
- getNearbyFields(fieldId, radiusKm): Proximity search
- traceWellContext(wellId): Full well hierarchy

Output format:
- Clear statement of relationships found
- Confidence scores with reasoning
- Evidence summary
- Data quality caveats
- Follow-up questions for investigation`

export interface GraphQueryResult {
  answer: string
  relationships: {
    type: string
    from: string
    to: string
    confidence: number
    evidence: string
  }[]
  provenanceNotes: string[]
  followUpQuestions: string[]
  toolCalls: string[]
}

export async function runGraphAgent(
  userQuery: string,
  context?: { extent?: { xmin: number; ymin: number; xmax: number; ymax: number } }
): Promise<GraphQueryResult> {
  const toolCalls: string[] = []
  const relationships: GraphQueryResult['relationships'] = []
  const provenanceNotes: string[] = []

  // Parse query to determine which tools to invoke
  const query = userQuery.toLowerCase()

  // Extract block IDs (e.g., "B13", "F03", "Q01")
  const blockIdMatch = query.match(/\b([A-Z]\d{1,2}(-[A-Z]+)?)\b/)
  const blockId = blockIdMatch ? blockIdMatch[1] : null

  // Extract operator names
  const operatorMatch = query.match(/\b(Shell|Total|E\s*&&\s*P|Wintershall|NAM|GDF|Neptune)\b/i)
  const operator = operatorMatch ? operatorMatch[1] : null

  // Extract well IDs
  const wellIdMatch = query.match(/\b([A-Z]\d{1,2}-\d{2,})\b/)
  const wellId = wellIdMatch ? wellIdMatch[1] : null

  // Extract field IDs
  const fieldIdMatch = query.match(/\bfield\s+([A-Z]\d{1,2}(-[A-Z]+)?)\b/i)
  const fieldId = fieldIdMatch ? fieldIdMatch[1] : null

  let toolResults: string[] = []

  // Route to appropriate tools based on query intent
  if (query.includes('operator') && query.includes('block') && blockId) {
    // "What operators are in block B13?"
    const ops = getOperatorsInBlock(blockId)
    toolCalls.push(`getOperatorsInBlock("${blockId}")`)
    
    if (ops.length > 0) {
      toolResults.push(`Found ${ops.length} operator(s) in block ${blockId}:`)
      ops.forEach(op => {
        toolResults.push(`- ${op.operator}: confidence ${(op.confidence * 100).toFixed(0)}%, ${op.evidenceCount} wells, activity score ${(op.activityScore * 100).toFixed(0)}`)
        relationships.push({
          type: 'OPERATOR_ACTIVE_IN_BLOCK',
          from: op.operator,
          to: op.blockId,
          confidence: op.confidence,
          evidence: `${op.evidenceCount} wells: ${op.evidenceWells.slice(0, 3).join(', ')}${op.evidenceWells.length > 3 ? '...' : ''}`
        })
        
        // Add provenance note
        if (op.provenance === 'INFERRED_AGGREGATE') {
          provenanceNotes.push(`${op.operator} association inferred from drilling activity (${op.evidenceCount} wells), not licensing records`)
        }
      })
    } else {
      toolResults.push(`No operator associations found for block ${blockId}`)
      provenanceNotes.push('No well activity recorded in this block')
    }
  }

  if (query.includes('block') && operator && !blockId) {
    // "What blocks does Shell operate in?"
    const blocks = getBlocksByOperator(operator)
    toolCalls.push(`getBlocksByOperator("${operator}")`)
    
    if (blocks.length > 0) {
      toolResults.push(`${operator} is associated with ${blocks.length} block(s):`)
      blocks.slice(0, 5).forEach(b => {
        toolResults.push(`- Block ${b.blockId}: ${b.evidenceCount} wells, confidence ${(b.confidence * 100).toFixed(0)}%`)
        relationships.push({
          type: 'OPERATOR_ACTIVE_IN_BLOCK',
          from: operator,
          to: b.blockId,
          confidence: b.confidence,
          evidence: `${b.evidenceCount} wells`
        })
      })
      if (blocks.length > 5) {
        toolResults.push(`... and ${blocks.length - 5} more blocks`)
      }
    } else {
      toolResults.push(`No block associations found for ${operator}`)
    }
  }

  if (query.includes('explain') && operator && blockId) {
    // "Explain Shell's association with block B13"
    const explanation = explainAssociation(operator, blockId)
    toolCalls.push(`explainAssociation("${operator}", "${blockId}")`)
    
    toolResults.push(`Association explanation for ${operator} → Block ${blockId}:`)
    toolResults.push(`Confidence: ${(explanation.confidence * 100).toFixed(0)}%`)
    toolResults.push(`Method: ${explanation.method}`)
    toolResults.push(`Provenance: ${explanation.provenance}`)
    
    explanation.evidence.forEach(e => {
      toolResults.push(`Evidence (${e.type}): ${e.count} items`)
      e.details.slice(0, 2).forEach(d => toolResults.push(`  - ${d}`))
    })
    
    explanation.limitations.forEach(l => {
      toolResults.push(`Limitation: ${l}`)
      provenanceNotes.push(l)
    })
  }

  if (wellId && (query.includes('context') || query.includes('trace'))) {
    // "Trace the context of well F03-01"
    const context = traceWellContext(wellId)
    toolCalls.push(`traceWellContext("${wellId}")`)
    
    if (context.well) {
      toolResults.push(`Well ${wellId} context:`)
      if (context.block) {
        toolResults.push(`- Located in block: ${context.block.properties['BlokNummer'] || 'Unknown'}`)
        toolResults.push(`  Block confidence: ${(context.associations.blockConfidence || 0 * 100).toFixed(0)}%`)
      }
      if (context.field) {
        toolResults.push(`- Part of field: ${context.field.properties['FIELD_NAME']}`)
        toolResults.push(`  Field result: ${context.field.properties['RESULT'] || 'Unknown'}`)
      }
      if (context.operator) {
        toolResults.push(`- Drilled by: ${context.operator.properties['name']}`)
      }
      if (context.nearbyWells.length > 0) {
        toolResults.push(`- Nearby wells (${context.nearbyWells.length} within 10km):`)
        context.nearbyWells.slice(0, 3).forEach(nw => {
          toolResults.push(`  ${nw.wellId} (${nw.distanceKm}km) - ${nw.operator}`)
        })
      }
    } else {
      toolResults.push(`Well ${wellId} not found in database`)
    }
  }

  if (fieldId && query.includes('nearby')) {
    // "What fields are near field F03?"
    const radius = 20 // Default 20km
    const nearby = getNearbyFields(fieldId, radius)
    toolCalls.push(`getNearbyFields("${fieldId}", ${radius})`)
    
    if (nearby.length > 0) {
      toolResults.push(`Fields within ${radius}km of ${fieldId}:`)
      nearby.slice(0, 5).forEach(f => {
        toolResults.push(`- ${f.fieldName} (${f.distanceKm}km): ${f.result}, operator: ${f.operator}`)
      })
    } else {
      toolResults.push(`No fields found within ${radius}km of ${fieldId}`)
    }
  }

  // If no specific tools matched, get general graph stats
  if (toolCalls.length === 0) {
    const graph = getKnowledgeGraph()
    const stats = graph.getStats()
    toolResults.push(`Knowledge graph overview:`)
    toolResults.push(`- Total nodes: ${stats.nodes}`)
    toolResults.push(`- Total edges: ${stats.edges}`)
    Object.entries(stats.byType).forEach(([type, count]) => {
      toolResults.push(`- ${type}: ${count}`)
    })
    provenanceNotes.push('Graph contains precomputed relationships with provenance metadata')
  }

  // Generate synthesized answer with LLM
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `User query: "${userQuery}"

Tool results:
${toolResults.join('\n')}

Provenance notes:
${provenanceNotes.join('\n')}

Synthesize this into a clear answer that:
1. States the relationships found
2. Reports confidence scores (as percentages)
3. Explains the evidence
4. Notes any data quality issues or limitations
5. Suggests 2-3 follow-up questions for further investigation

Format follow-up questions with "FOLLOWUP:" prefix for parsing.`
      }
    ],
    temperature: 0.3,
    max_tokens: 800,
  })

  const raw = completion.choices[0]?.message?.content || ''

  // Parse follow-up questions
  const followUpLines = raw.split('\n').filter(l => l.includes('FOLLOWUP:'))
  const followUpQuestions = followUpLines
    .map(l => l.replace(/FOLLOWUP:\s*/i, '').trim())
    .filter(l => l.length > 5)
    .slice(0, 3)

  // Clean answer
  const answer = raw.split('\n').filter(l => !l.includes('FOLLOWUP:')).join('\n').trim()

  return {
    answer,
    relationships,
    provenanceNotes: provenanceNotes.length > 0 ? provenanceNotes : ['All relationships have explicit provenance metadata'],
    followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : [
      'What is the reliability of these associations?',
      'Which operators have the strongest presence in this region?',
      'Are there any data gaps affecting these results?'
    ],
    toolCalls
  }
}
