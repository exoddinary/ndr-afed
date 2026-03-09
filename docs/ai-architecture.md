# NDR AI Architecture Documentation

## Overview

The Netherlands Data Room (NDR) AI system is a multi-agent orchestration framework that processes natural language queries about oil & gas exploration data. It uses a routing-based architecture where an **Orchestrator** delegates tasks to specialized agents based on query type.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER QUERY                                 │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATOR                                 │
│  - Routes query to appropriate agents                                 │
│  - Handles spatial context detection                                  │
│  - Synthesizes final responses                                        │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ASSET AGENT  │ │ SPATIAL AGENT│ │ INSIGHT AGENT│
│              │ │              │ │              │
│ Query &      │ │ Proximity,   │ │ Synthesize   │
│ filter       │ │ distances,   │ │ insights     │
│ structured   │ │ areas,       │ │ & interpret  │
│ attributes   │ │ spatial      │ │ data         │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┴────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE GRAPH                                  │
│  - Entity relationships & provenance                                  │
│  - GraphRAG context for richer insights                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Model Configuration

| Component | Model | Provider | Purpose |
|-----------|-------|----------|---------|
| Orchestrator | `llama-3.3-70b-versatile` | Groq | Query routing & synthesis |
| Asset Agent | `llama-3.3-70b-versatile` | Groq | Structured data queries |
| Spatial Agent | `llama-3.3-70b-versatile` | Groq | Spatial reasoning |
| Insight Agent | `llama-3.3-70b-versatile` | Groq | Interpretation & synthesis |

**API Key**: `GROQ_API_KEY` environment variable

---

## Agents

### 1. Orchestrator (`orchestrator.ts`)

**Purpose**: Routes user queries to the appropriate specialist agents and synthesizes final responses.

**Input**:
```typescript
{
  userQuery: string,           // Natural language question
  context: Record<string, unknown>  // Map extent, filters, etc.
}
```

**Processing Flow**:
1. **Spatial Context Detection**: Checks if query mentions "this area", "current view", "visible area", "on the map"
2. **Routing Decision**: Uses LLM to determine which agents to invoke
3. **Parallel Execution**: Runs ASSET + SPATIAL agents in parallel
4. **Knowledge Graph Retrieval**: Fetches entity relationships via GraphRAG
5. **Insight Synthesis**: Runs INSIGHT agent with combined outputs
6. **Response Assembly**: Merges answers, map actions, and follow-up questions

**Output**:
```typescript
{
  answer: string,
  followUpQuestions: string[],
  agents: string[],
  mapActions?: {
    action: 'highlight' | 'zoom',
    layer: string,
    identifiers: string[],
    radiusInfo?: { originLayer, originId, radiusKm }
  }[],
  metadata: { routing: string[], latencyMs: number }
}
```

**Routing Rules**:
- `proximity`, `distance`, `nearby`, `within`, `around` → SPATIAL
- `filtering`, `listing`, `counting`, `operators` → ASSET (+ SPATIAL if area mentioned)
- `what is interesting`, `opportunities`, `summary`, `recommend` → INSIGHT
- Default: ASSET + INSIGHT

---

### 2. Asset Query Agent (`asset-query-agent.ts`)

**Purpose**: Query and filter structured feature attributes from GeoJSON map layers.

**Available Data Layers**:
| Layer | Key Fields |
|-------|------------|
| `wells` | IDENTIFICA, OPERATOR, WELL_TYPE, STATUS, WELL_RESUL, START_DATE, END_DEPTH_, FIELD_NAME |
| `fields` | FIELD_NAME, FIELD_CD, RESULT (Gas/Oil), STATUS, OPERATOR, DISCOVERY_, LANDSEA |
| `blocks` | BlokNummer, Area_sqkm, Field (no direct OPERATOR - inferred from wells) |
| `seismic2d` | line_name, survey_col, delivery_c |
| `seismic3d` | SURVEY_ID, GRID_ID, YEAR |

**Query Types Supported**:
- **Operator filtering**: "Show me wells by operator Shell"
- **Name lookup**: "Find well F03-01"
- **Aggregation**: "Count wells by operator", "Group fields by result"
- **Type filtering**: "Gas fields", "Abandoned wells", "Active wells"
- **Spatial intersection**: "Operators in blocks" (inferred from well-block relationships)

**Processing**:
1. Keyword-based layer detection (well, field, block, seismic)
2. Regex pattern matching for operators, names
3. Tool execution via `geo-tools.ts`
4. LLM synthesis of structured data context
5. Map action extraction (highlight identifiers like "F03", "B13")

**Output**:
```typescript
{
  answer: string,
  data?: object[],
  suggestedMapActions?: { action: string, layer: string, identifiers: string[] }[]
}
```

---

### 3. Spatial Agent (`spatial-agent.ts`)

**Purpose**: Handle spatial relationships, proximity, distances, areas, and filtering by map view.

**Capabilities**:
- Distance calculations between features
- Proximity queries ("nearby", "within X km")
- Area-based filtering using map extent
- Radius-based searches
- Coordinate transformations

**Input Context**:
```typescript
{
  extent: { xmin, ymin, xmax, ymax },  // Current map view
  center: [lon, lat],                  // Map center
  zoom: number                         // Current zoom level
}
```

**Spatial Operations**:
- `calculateDistance(pointA, pointB)` - Haversine formula
- `filterByExtent(features, extent)` - Bounding box intersection
- `findWithinRadius(origin, radiusKm, features)` - Circular search
- `getAreaFromPolygon(polygon)` - Polygon area calculation

**Output**:
```typescript
{
  answer: string,
  mapActions?: {
    action: 'highlight' | 'zoom',
    layer: string,
    identifiers: string[],
    radiusInfo?: { originLayer, originId, radiusKm }
  }[],
  nearbyFeatures?: { layer: string, features: object[] }[]
}
```

---

### 4. Insight Agent (`insight-agent.ts`)

**Purpose**: Synthesize and interpret data from Asset and Spatial agents. Generate exploration insights for analysts and investors.

**Domain Expertise**:
- Netherlands North Sea geology (Rotliegend, Carboniferous, Zechstein plays)
- Netherlands exploration history and licensing
- Hydrocarbon field assessment and ranking
- Spatial exploration opportunity identification

**Input**:
```typescript
{
  userQuery: string,
  assetData: string,      // Output from Asset Agent
  spatialData: string,   // Output from Spatial Agent
  graphContext?: string  // Knowledge Graph RAG context
}
```

**Output Requirements**:
1. Grounded in provided data — no invented facts
2. Rank/prioritize assets when multiple options
3. Suggest concrete follow-up actions
4. Flag exploration potential or data gaps
5. Use professional E&P language

**Output Format**:
```typescript
{
  answer: string,                    // Insight text (under 400 words)
  followUpQuestions: string[],       // 3 suggested questions
  opportunityScore?: {               // Optional ranking
    label: string,
    score: number,
    reason: string
  }[]
}
```

**Follow-up Questions Parsing**:
- Generated by LLM with "FOLLOWUP:" prefix
- Parsed and cleaned for UI display
- Fallback questions provided if parsing fails

---

## Knowledge Graph (GraphRAG)

**Purpose**: Provide entity relationships and data provenance for richer insights.

**Components**:
- `graph-builder.ts` - Constructs graph from GeoJSON features
- `graph-rag.ts` - Retrieval-Augmented Generation queries
- `graph-index.ts` - Index management and context retrieval
- `graph-types.ts` - Type definitions

**Usage**: Called by Orchestrator before Insight Agent to provide relationship context.

---

## Question Types & Agent Mapping

| Question Type | Example | Agents Invoked |
|--------------|---------|----------------|
| **Factual lookup** | "What is the status of well F03-01?" | ASSET |
| **Filtering** | "Show me all gas fields" | ASSET |
| **Aggregation** | "How many wells does Shell operate?" | ASSET |
| **Spatial proximity** | "What fields are near this well?" | SPATIAL + ASSET |
| **Area-based** | "List blocks in the current view" | SPATIAL + ASSET |
| **Interpretation** | "What are the exploration opportunities here?" | ASSET + SPATIAL + INSIGHT |
| **Summary** | "Summarize activity in this region" | ASSET + INSIGHT |

---

## Memory & State

### Session State
- **No persistent memory** between sessions
- **Context per query**: Map extent, active layers, filters
- **Map actions**: Highlight/zoom suggestions returned with each response

### Data Sources
- GeoJSON files (wells, fields, blocks, seismic data)
- Real-time spatial calculations
- Knowledge Graph (entity relationships built from data)

### Caching
- Knowledge Graph: Built on-demand, not persisted
- GeoJSON: Loaded from static files
- LLM responses: Not cached (fresh inference per query)

---

## I/O Format

### Input (API Endpoint: `/api/ndr-ai`)
```json
{
  "query": "What operators are most active in block B13?",
  "context": {
    "extent": {
      "xmin": 4.5,
      "ymin": 52.0,
      "xmax": 5.0,
      "ymax": 53.0
    }
  }
}
```

### Output
```json
{
  "answer": "**Asset Analysis:**\nShell operates 12 wells in block B13...\n\n**Spatial Context:**\nBlock B13 covers 245 km²...",
  "followUpQuestions": [
    "Which wells near B13 have reported gas discoveries?",
    "What seismic coverage exists in this block?",
    "Who are the other operators in this region?"
  ],
  "agents": ["ASSET", "SPATIAL", "INSIGHT"],
  "mapActions": [
    {
      "action": "highlight",
      "layer": "wells",
      "identifiers": ["F03-01", "F03-02", "B13-01"]
    }
  ],
  "metadata": {
    "routing": ["ASSET", "SPATIAL", "INSIGHT"],
    "latencyMs": 2450
  }
}
```

---

## Error Handling

| Agent | Error Behavior |
|-------|----------------|
| Orchestrator | Fallback routing if LLM fails |
| Asset Agent | Graceful skip, log error, continue with other layers |
| Spatial Agent | Return empty results, log error |
| Insight Agent | Return fallback questions if synthesis fails |

---

## Performance Characteristics

| Metric | Typical Value |
|--------|---------------|
| End-to-end latency | 2-4 seconds |
| Asset query (simple) | 200-500ms |
| Spatial calculation | 100-300ms |
| Insight synthesis | 1-2 seconds |
| Max tokens per agent | 1000 (Asset), 900 (Insight) |
| Temperature | 0 (Orchestrator), 0.3 (Asset), 0.5 (Insight) |

---

## Future Enhancements

1. **Persistent Memory**: User preferences, query history
2. **Streaming Responses**: Token-by-token output
3. **Multi-modal**: Support for seismic image analysis
4. **Advanced Spatial**: WKT geometry queries, shapefile upload
5. **Caching**: LLM response caching for common queries
6. **Feedback Loop**: User feedback to improve agent routing
