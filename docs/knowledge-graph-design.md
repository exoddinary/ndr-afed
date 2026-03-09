# NDR Knowledge Graph Design Document

## 1. Data Provenance Analysis

### Entity Types & Sources

| Entity | Primary Source | Fields Used | Data Quality |
|--------|---------------|-------------|--------------|
| **Well** | Wells.json | IDENTIFICA, OPERATOR, WELL_TYPE, STATUS, WELL_RESUL, geometry | Official NLOG data |
| **Field** | HC_Fields.json | FIELD_NAME, RESULT, STATUS, OPERATOR, geometry | Official NLOG data |
| **Block** | Offshore_Blocks.json | BlokNummer, Area_sqkm, Field, geometry | Official TNO data |
| **License** | Licenses.json | licence_nm, licence_st, geometry | Official TNO data |
| **Seismic2D** | Seismic_2D_Surveys.json | line_name, YEAR, geometry | Official NLOG data |
| **Seismic3D** | Seismic_3D_Surveys.json | SURVEY_ID, YEAR, geometry | Official NLOG data |
| **Operator** | Inferred from Wells & Fields | OPERATOR field aggregation | Derived - needs reconciliation |

### Relationship Provenance Matrix

| Relationship | Source Type | Derivation Method | Confidence | Staleness Risk |
|--------------|-------------|---------------------|------------|----------------|
| **WELL_LOCATED_IN_BLOCK** | Inferred (Spatial) | Point-in-polygon test | HIGH | Low - geometries stable |
| **WELL_DRILLED_BY_OPERATOR** | Direct | Wells.OPERATOR field | HIGH | Medium - acquisitions happen |
| **FIELD_CONTAINS_WELL** | Direct | Wells.FIELD_NAME reference | MEDIUM | High - field definitions change |
| **FIELD_INTERSECTS_BLOCK** | Inferred (Spatial) | Polygon intersection | HIGH | Low - boundaries stable |
| **BLOCK_LICENSED_BY_OPERATOR** | Inferred (Derived) | Wells in block → most common operator | MEDIUM | High - license transfers happen |
| **OPERATOR_OPERATES_FIELD** | Direct | Fields.OPERATOR field | MEDIUM | High - field operators change |
| **SEISMIC_COVERS_BLOCK** | Inferred (Spatial) | Line/polygon intersection | MEDIUM | Low - survey geometry fixed |
| **WELL_NEARBY_WELL** | Inferred (Spatial) | Distance < threshold | HIGH | Low - positions fixed |
| **WELL_TEMPORALLY_NEAR_SEISMIC** | Inferred (Temporal) | Abs(year_diff) < 2 years | MEDIUM | N/A |

### Provenance Labels (for UI transparency)

```typescript
type ProvenanceLabel = 
  | 'OFFICIAL_DIRECT'      // From official source, explicit field
  | 'OFFICIAL_SPATIAL'     // From official source, computed geometry
  | 'INFERRED_SPATIAL'     // Computed from spatial analysis
  | 'INFERRED_TEMPORAL'    // Computed from temporal analysis
  | 'INFERRED_AGGREGATE'   // Computed from aggregation
  | 'HEURISTIC'            // Rule-based inference with assumptions
  | 'STALE_WARNING'        // Known to be potentially outdated
```

## 2. Impact Analysis - New Query Capabilities

### Before Knowledge Graph (Current State)

**Limited to:**
- Single-layer filtering: "Show me wells with operator X"
- Simple spatial: "Wells near point Y"
- No relationship chaining
- No multi-hop reasoning

### After Knowledge Graph (Future State)

**Level 1: Direct Relationships**
```
"Which operator drilled the most wells in block K06?"
→ WELL_LOCATED_IN_BLOCK → group_by(OPERATOR) → count

"What fields overlap with block P05?"
→ FIELD_INTERSECTS_BLOCK → filter(BlokNummer=P05)

"Show me all seismic covering this field"
→ SEISMIC_COVERS_FIELD → intersect(field_geometry)
```

**Level 2: Two-Hop Relationships**
```
"Which operators have wells in gas fields?"
→ OPERATOR → WELL_DRILLED_BY → WELL_LOCATED_IN_FIELD → FIELD.result=Gas

"What blocks have wells drilled by Shell?"
→ BLOCK → WELL_LOCATED_IN_BLOCK ← WELL_DRILLED_BY ← Operator=Shell

"Which fields were discovered using 3D seismic?"
→ FIELD → DISCOVERY_DATE near SEISMIC_COVERS_FIELD(YEAR)
```

**Level 3: Multi-Hop & Pattern Discovery**
```
"Find operators active in the same blocks as Shell"
→ Shell wells → blocks → other operators' wells in those blocks

"Which blocks have declining operator activity?"
→ Block → wells over time → operator count trend

"What fields have untapped potential?"
→ Field with gas result → few wells → no recent seismic

"Identify farm-in opportunities"
→ Block with one operator's wells → no production → other operators nearby
```

**Level 4: Graph Pattern Matching**
```
"Find clusters of operator competition"
→ Pattern: Block → multiple operators → multiple wells each

"Which operators follow each other?"
→ Pattern: Operator A drills → 2 years later Operator B drills nearby

"Find exploration sweet spots"
→ Pattern: 2D seismic → 3D seismic → well → discovery
```

### New UI Capabilities

1. **Relationship Explorer**: Click any entity, see connected entities
2. **Provenance Badges**: Show "INFERRED" vs "OFFICIAL" in tooltips
3. **Uncertainty Indicators**: Visual cues for low-confidence relationships
4. **Temporal Slider**: See how relationships change over time

## 3. Uncertainty & Limitation Analysis

### Operator ↔ Block Inference (Critical Path)

**Current Approach:**
```
Block.operator = mode(wells_in_block.operator)
```

**What Could Go Wrong:**

| Scenario | Problem | Impact | Mitigation |
|----------|---------|--------|------------|
| **Acquisition** | Company A bought Company B, old wells still show B | Wrong current operator | Add "as_of_date" to relationship |
| **Joint Venture** | Multiple operators in same block | Mode picks most common only | Store all operators with percentages |
| **Farm-in/Farm-out** | Operator changed mid-life | Historical operator inaccurate | Track operator history per well |
| **Service Company vs Operator** | Drilling contractor listed as operator | Completely wrong | Maintain operator canonicalization table |
| **Missing Wells** | Wells not digitized in our data | Undercount operator activity | Flag data completeness score |

**Assumptions Being Made:**
1. Wells.OPERATOR is current operator (not historical)
2. All relevant wells are in our Wells.json
3. Block boundaries haven't changed since well drilled
4. No unlicensed drilling occurred

**Confidence Scoring:**
```typescript
interface RelationshipConfidence {
  score: 0-1;                    // Overall confidence
  sample_size: number;           // How many wells used
  data_completeness: 0-1;        // % of expected wells present
  temporal_freshness: 0-1;       // How recent the data
  spatial_precision: 0-1;        // Geometry match quality
}

// Example: Block P05 operator inference
{
  score: 0.72,
  sample_size: 8,              // 8 wells in block
  data_completeness: 0.8,      // Expect 10 wells, have 8
  temporal_freshness: 0.9,       // Most wells from 2010-2020
  spatial_precision: 0.95        // Clear polygon boundaries
}
```

### Other Relationship Risks

**WELL_LOCATED_IN_FIELD**
- **Risk**: Wells.FIELD_NAME may be blank or outdated
- **Risk**: Field boundaries may have been redrawn
- **Risk**: Well might be on field edge, ambiguous containment

**FIELD_INTERSECTS_BLOCK**
- **Risk**: Field may span multiple blocks (expected, but need to show all)
- **Risk**: Offshore block vs onshore field mismatch

**SEISMIC_COVERS_X**
- **Risk**: 2D lines may pass through without truly "covering"
- **Risk**: 3D survey may be partial coverage

**TEMPORAL_RELATIONSHIPS**
- **Risk**: Drilling year vs discovery year confusion
- **Risk**: Seismic acquisition year vs processing year

### Handling Strategies

1. **Never hide uncertainty** - Always show confidence score
2. **Multiple inference methods** - Cross-validate spatial vs temporal vs direct
3. **Graceful degradation** - If confidence < 0.5, say "insufficient data"
4. **User override** - Allow users to flag incorrect inferences
5. **Version tracking** - Store "inferred_v1", "inferred_v2" as we improve

## 4. Implementation Schema

```typescript
// Core Graph Types
interface GraphNode {
  id: string;
  type: 'WELL' | 'FIELD' | 'BLOCK' | 'LICENSE' | 'OPERATOR' | 'SEISMIC_2D' | 'SEISMIC_3D';
  properties: Record<string, unknown>;
  geometry?: GeoJSON.Geometry;
  source_layer: LayerName;
  canonical_id?: string;  // For deduplication
}

interface GraphEdge {
  id: string;
  type: EdgeType;
  from: string;  // node id
  to: string;    // node id
  properties: {
    provenance: ProvenanceLabel;
    confidence: number;
    inferred_at: Date;
    method: string;
    sample_size?: number;
  };
}

type EdgeType =
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
  | 'BLOCK_LICENSED_BY'  // Inferred from wells
  | 'OPERATOR_ACTIVE_IN_BLOCK';  // Derived metric

// Graph RAG Context Builder
interface GraphRagContext {
  // For a given query, extract relevant subgraph
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: string;  // Natural language summary of subgraph
  provenance_report: string;  // Explanation of data sources
  confidence_warning?: string;  // If any low-confidence relationships used
}
```

## 5. Graph RAG Integration

### Context Building Strategy

```typescript
// When user asks: "Which operator is most active in K06?"
function buildGraphContext(query: string, entities: string[]): GraphRagContext {
  // 1. Find mentioned entities
  const blockNode = graph.findNode('BLOCK', 'K06');
  
  // 2. Extract 1-hop neighborhood
  const wells = graph.getNeighbors(blockNode, 'WELL_LOCATED_IN_BLOCK');
  const operators = wells.map(w => graph.getNeighbors(w, 'WELL_DRILLED_BY')).flat();
  
  // 3. Get 2-hop for context
  const operatorFields = operators.map(o => 
    graph.getNeighbors(o, 'OPERATOR_OPERATES_FIELD')
  ).flat();
  
  // 4. Build natural language summary
  const summary = `
    Block K06 contains ${wells.length} wells.
    Operators with wells in K06: ${operators.map(o => o.id).join(', ')}.
    ${operators[0]?.id} has the most wells (${countWells(operators[0])}).
    Note: Operator-block relationship is INFERRED from well locations.
  `;
  
  // 5. Check confidence
  const confidence = calculateAggregateConfidence(wells, 'WELL_LOCATED_IN_BLOCK');
  
  return { nodes: [...wells, ...operators], edges: extractEdges(), summary, confidence };
}
```

### LLM Prompt Template

```
You are analyzing Netherlands oil & gas data. 

USER QUERY: {{query}}

RELEVANT ENTITIES FROM KNOWLEDGE GRAPH:
{{graph_summary}}

RAW DATA:
{{structured_data}}

IMPORTANT NOTES ON DATA QUALITY:
{{provenance_report}}

ANSWER THE QUERY using the data provided. 
If any relationships are INFERRED (not official), note this in your answer.
If confidence is low (< 0.7), mention uncertainty.
```

## 6. Next Steps

1. **Build Graph Loader** - Parse all GeoJSON, create nodes
2. **Implement Inference Engine** - Compute spatial/temporal relationships
3. **Add Confidence Scoring** - Calculate metrics per relationship
4. **Create Graph RAG Module** - Build context for LLM queries
5. **Update Agents** - Have orchestrator use graph for complex queries
6. **UI Components** - Show provenance badges, relationship explorer
