# NDR AI Architecture Documentation

## Overview

The Netherlands Data Room (NDR) AI system is a multi-agent orchestration framework that processes natural language queries about oil & gas exploration data. It uses a routing-based architecture where an **Orchestrator** delegates tasks to specialized agents based on query type.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER QUERY                                │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          ORCHESTRATOR                                │
│  - Routes query to appropriate agents                               │
│  - Handles spatial context detection                                │
│  - Synthesizes final responses                                      │
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
│                      KNOWLEDGE GRAPH                                │
│  - Entity relationships & provenance                                │
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

---

## Spatial Analysis Architecture

### Overview

The **Analysis Marker Manager** (`analysis-marker-manager.tsx`) provides an interactive spatial analysis interface that allows users to drop markers on the map, define analysis radii, and query AI about specific geographic regions. This bridges the gap between visual map exploration and AI-powered data analysis.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ANALYSIS MARKER MANAGER                              │
│                                                                          │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐       │
│  │  Marker State   │    │  Spatial Engine  │    │   AI Integration │       │
│  │                 │    │                  │    │                  │       │
│  │ • position      │◄──►│ • Radius calc    │◄──►│ • AIMiniView     │       │
│  │ • radiusKm      │    │ • Feature query  │    │ • Jump to Main   │       │
│  │ • activeMode    │    │ • Intersections  │    │ • Context Pass   │       │
│  │ • isExpanded    │    │ • Stats compute  │    │                  │       │
│  └─────────────────┘    └──────────────────┘    └─────────────────┘       │
│           │                       │                      │              │
│           ▼                       ▼                      ▼              │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐       │
│  │ Orbital Buttons │    │ Radial Data Viz  │    │  Comment System │       │
│  │  (Data/AI/Chat) │    │  (6-bar layout)  │    │   (Annotations) │       │
│  └─────────────────┘    └──────────────────┘    └─────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Marker State Management

**AnalysisMarker Interface**:
```typescript
interface AnalysisMarker {
  id: string
  position: { latitude: number; longitude: number }
  radiusKm: number              // Analysis radius (1-50km)
  isExpanded: boolean          // Show/hide orbital menu
  activeMode: 'data' | 'ai' | 'comment' | 'stats' | 'graph' | null
  color: string                // Marker color (dynamic)
  label: string                // Generated label
}
```

### Spatial Engine Components

#### 1. Feature Intersection Detection

Uses point-in-polygon and distance calculations to find features within the marker radius:

```typescript
// Spatial detection flow
for (const layer of ['wells', 'fields', 'blocks']) {
  const features = await queryLayer(layer)
  const withinRadius = features.filter(f => {
    const distance = haversineDistance(marker.position, f.geometry)
    return distance <= marker.radiusKm
  })
  stats[layer] = aggregate(withinRadius)
}
```

**Computed Statistics**:
- Wells: total, gas count, oil count, dry count, byOperator
- Fields: total, byResult (Gas/Oil), byStatus
- Blocks: total count
- Seismic coverage: 2D lines, 3D surveys within area

#### 2. Radius Slider (ArcSlider)

Interactive arc-based slider for adjusting analysis radius:
- **Visual**: Semi-circular arc (140° to 40°) with draggable thumb
- **Range**: 1-50 km
- **Display**: Center pill showing current value with color-coded background
- **Interaction**: Click/touch anywhere on arc to jump; drag for fine control

#### 3. Radial Data Visualization

6-bar radial chart showing feature distribution around the marker:

```
       Wells (-55°)
          │
    Fields (-35°)
          │
    Blocks (-15°) ────●──── Gas (+15°)
          │                    │
         ...                  Oil (+35°)
                               │
                              Dry (+55°)
```

**Design**:
- 6 bars split evenly: 3 negative angles (-55°, -35°, -15°), 3 positive (15°, 35°, 55°)
- Bar thickness: 8px (2px padding between bars)
- Center arc: Thick arc aligned with radius bars
- No secondary center point (clean design)
- Spring animation for bar growth

### Orbital Menu System

**OrbitalButton Component**:
```typescript
interface OrbitalButtonProps {
  angle: number           // Position angle (-140 to -40 degrees)
  distance: number       // Orbit radius from center
  isActive: boolean
  color: string
  label: string          // "Data", "Ask AI", "Chat", "Delete"
  icon: LucideIcon
}
```

**Button Positions**:
- Data: -140° (top-left)
- Ask AI: -90° (top-center) - Special continuous hue-rotate animation
- Chat: -40° (top-right)
- Delete: 90° (bottom-center, follows radius)

**Animation**:
- Entry: Scale from 0, fade in
- Active: Purple theme (#9333EA), glowing border
- AI Button: Continuous 4-second hue-rotate + glow pulse
- Hover: Scale 1.1, z-index boost

### AI Integration (AIMiniView)

**Purpose**: Provide quick AI interaction without leaving the map context.

**Features**:
- Chat interface within marker panel
- Spatial context auto-passed to AI
- "Jump to Main AI" - transfers query + context to full sidebar
- Pre-computed statistics as context

**Context Passed to AI**:
```typescript
interface SpatialContext {
  center: [lon, lat]
  radiusKm: number
  featuresInside: { wells: [], fields: [], blocks: [] }
  statsSummary: {
    wellsCount, fieldsCount, blocksCount,
    seismicCoverage, operatorsCount
  }
}
```

**Example Query Flow**:
1. User drops marker on map
2. Radius auto-set to 10km
3. User clicks "Ask AI" orbital button
4. Mini-view opens with spatial context
5. User types: "What operators work here?"
6. Context + query sent to AI
7. Response shown in mini-view
8. User can "Jump to Main AI" for deeper analysis

### Comment System (CommentMiniView)

**Purpose**: Annotate specific geographic locations with notes.

**Features**:
- Add text comments tied to marker location
- User avatars with initials
- "Just now" timestamp
- Empty state with prompt

### Data Flow: Marker → AI

```
User drops marker
       │
       ▼
┌──────────────┐
│ Compute      │◄─── Query ArcGIS layers
│ Spatial Stats│      (wells, fields, blocks)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Build        │◄─── Aggregate counts
│ Context      │      (by operator, result, status)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ User Query   │◄─── "What operators work here?"
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ AI Request   │◄─── Context + Query sent to
│ (to Main AI) │      orchestrator via onJumpToMainAI
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Full AI      │◄─── Sidebar opens with
│ Response     │      inherited context
└──────────────┘
```

### Theming Support

All components support light/dark mode via `theme` prop:
- Mini-view panel: Conditional bg-slate-900 (dark) / bg-white (light)
- Input fields: Conditional border/text colors
- Chat bubbles: Color-coded by role (user=blue, AI=slate)
- Orbital buttons: Inherit theme from parent

### Performance Optimizations

1. **Spatial Indexing**: Pre-computed bounding boxes for quick filtering
2. **Lazy Loading**: Stats computed only when mode activated
3. **Debounced Radius**: Updates only after slider release
4. **Memoization**: Feature counts cached per marker session

---

## CSV Export for AI Training

### Purpose

Enable bulk export of layer data with pre-computed spatial relationships for:
- AI training datasets
- External analysis tools
- Data quality verification

### Generated Files

| File | Rows | Content |
|------|------|---------|
| `wells_with_relationships.csv` | 3,000 | All wells with field/block associations |
| `well_field_block_relationships.csv` | 3,200+ | Normalized relationship rows |
| `export_statistics.json` | - | Summary stats |

### Spatial Relationship Computation

```typescript
// For each well:
1. Get well coordinates (Point)
2. Check against all field polygons (point-in-polygon)
3. Check against all block polygons (point-in-polygon)
4. Record containing field names, codes, operators
5. Record containing block names, areas
```

### Key Columns

**Wells Export**:
- `well_id`, `well_name`, `latitude`, `longitude`
- `well_type`, `status`, `result`
- `operator`, `drilling_contractor`, `platform`
- `field_name`, `field_code`, `field_operator`
- `block_name`, `block_area_sqkm`
- `in_field` (Yes/No), `in_block` (Yes/No)

### Usage for AI

The CSV can be loaded as a knowledge base for semantic search:

```
User: "Find gas wells in K06-T field deeper than 3000m"
AI: [Queries CSV] → Returns matching wells with all metadata
```

---

## Model Configuration Update

**Current Setup** (all agents):
```typescript
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
```

**Environment Variable**:
```bash
# Optional: Override default 70B model
# GROQ_MODEL=llama-3.1-8b-instant  # Use 8B instead (not recommended)
# Unset or omit to use 70B (default, recommended)
```

**Why 70B is Recommended**:
- Reliable JSON output for routing decisions
- Better tool-use adherence
- Consistent structured responses
- 8B may fail on complex multi-agent orchestration

---

## Complete Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                   │
│                                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────┐    │
│  │ Map View   │  │ AI Sidebar │  │  Markers   │  │ CSV Export Script  │    │
│  │            │  │            │  │            │  │                    │    │
│  │ ArcGIS     │◄─┤  Chat      │  │ Analysis   │  │ GeoJSON → CSV      │    │
│  │ Components │  │  Panel     │  │ Points     │  │ + Relationships    │    │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └────────────────────┘    │
│        │               │               │                                    │
└────────┼───────────────┼───────────────┼────────────────────────────────────┘
         │               │               │
         ▼               ▼               ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          AI ORCHESTRATION LAYER                             │
│                                                                              │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐       │
│  │   Orchestrator  │───►   Asset Agent     │    │   Insight Agent  │       │
│  │                 │◄────  • Layer query    │◄───│  • Synthesis     │       │
│  │ • Routing       │    │  • Filtering     │    │  • Follow-ups    │       │
│  │ • Synthesis     │◄───┤  • Aggregation   │    │                  │       │
│  │                 │    │                  │    │                  │       │
│  │                 │───►   Spatial Agent   │    └─────────────────┘       │
│  │                 │◄────  • Proximity     │                               │
│  │                 │    │  • Distance      │                               │
│  │                 │    │  • Intersection  │                               │
│  │                 │    │                  │                               │
│  │                 │◄───┤                  │                               │
│  └────────┬────────┘    └──────────────────┘                               │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      KNOWLEDGE GRAPH / DATA                         │   │
│  │                                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │   │
│  │  │  Wells   │  │  Fields  │  │  Blocks  │  │ Seismic  │  │ Graph  │  │   │
│  │  │  (3K)    │  │  (560)   │  │  (176)   │  │  (2D/3D) │  │ RAG   │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘  │   │
│  │                                                                      │   │
│  │  Data Sources: GeoJSON files, real-time spatial calcs, CSV exports   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

*Last Updated: March 11, 2026*
*Components: Orchestrator, Asset Agent, Spatial Agent, Insight Agent, GraphRAG, Analysis Marker Manager, CSV Export*
