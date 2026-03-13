# NDR Architecture & AI Enhancement Plan
**Migration to Golang, PostGIS, and ArcGIS React**

This document outlines the strategic plan for migrating the National Data Room (NDR) from a client/Node-heavy architecture computing JSON files with Turf.js, to an enterprise-grade stack using PostGIS, Golang, and the ArcGIS JS API. More importantly, it highlights how this migration fundamentally improves the AI workflow leveraging Groq.

---

## 1. The Core Problem with the Current AI Process
Currently, the NDR AI (`spatial-agent.ts`) operates under strict constraints:
- **Memory Bound:** The Next.js API has to load massive `.geojson` files into memory to answer spatial questions (e.g., "What wells are in this block?").
- **Compute Bound:** Node.js executes `Turf.js` mathematically intensive intersection operations on a single thread. This cannot scale for thousands of concurrent geologists or highly complex block polygons.
- **Payload Bound:** When the AI visualizes data, it sends large arrays of GeoJSON objects to the frontend, leading to potential lag or browser crashes.

## 2. The Future Architecture State
- **Database:** PostgreSQL + PostGIS (for spatial math) + pgvector (for AI semantic search).
- **Backend Services:** Golang (for high-concurrency, fast spatial queries, and tile serving).
- **Frontend Map:** ArcGIS Maps SDK for JavaScript (Enterprise mapping interface).
- **AI Orchestrator:** Next.js + Groq (Handles intent extraction, tool routing, and natural language generation, delegating heavy lifting to Go).

---

## 3. How the Groq AI Process Becomes Significantly Better

Once the spatial data lives securely in PostGIS and is served by Golang, the Groq AI process completely transforms.

### A. Delegation of "Heavy Math" to PostGIS
Instead of the Next.js AI Agent fetching geo-data and calculating coordinates via `Turf.js`, the AI agent simply extracts the parameters and calls a Go API endpoint.
**AI Process Change:** 
- Groq understands: `Target: Wells, Origin: Block F03, Relation: Inside`
- AI executes Tool: `fetch('https://api.ndr.com/spatial/intersect?target=wells&origin=blocks&originId=F03')`
- Golang runs: `SELECT * FROM wells WHERE ST_Intersects(geom, (SELECT geom FROM blocks WHERE name = 'F03'));`
**Benefit:** Response times drop from seconds to milliseconds. The AI agent never runs out of memory.

### B. Hybrid RAG (Semantic + Spatial Search)
With Postgres handling the data, we can install the **`pgvector`** extension. This allows the AI to perform complex queries that were previously impossible.
- **Example Query:** *"Find all producing gas wells within 50km of Block F03 that hit the chalk formation, according to daily drilling reports."*
- **AI Process Change:** Groq translates this into a hybrid query. Golang executes a single SQL statement that combines `ST_DWithin` (Spatial) with `vector_distance` (Semantic Search on reports).
**Benefit:** The AI becomes hyper-intelligent, reasoning across both physical geography and unstructured document semantic meaning.

### C. Map Actions Become "Filters" Not "Payloads"
Currently, the Groq Spatial Agent struggles to return mapping data seamlessly because it tries to pass heavy data objects back to the UI.
**AI Process Change:**
- With ArcGIS + PostGIS, the AI no longer sends geometry data.
- The AI simply replies with a definition query instruction for the client: `mapActions: [{ layer: "wells", filter: "block_id = 'F03'" }]`
- The ArcGIS frontend applies this definition query directly to the ArcGIS FeatureLayer (fed by the Golang API).
**Benefit:** The AI response is instantaneous, consumes minimal tokens, and the ArcGIS render engine natively handles displaying the 5,000 wells smoothly.

### D. Agentic "Text-to-Spatial-SQL"
For truly complex, out-of-the-box analytical queries that aren't pre-programmed as tools, Groq (acting as a Data Analyst Agent) can write read-only PostGIS SQL queries dynamically.
- **Example Query:** *"Show me the total area of all intersecting licenses held by NAM and Shell."*
- **AI Process Change:** Groq generates valid `ST_Area(ST_Intersection(a.geom, b.geom))` SQL. The Go API safely executes this sandboxed query and returns the aggregations.
**Benefit:** Infinite analytical flexibility without needing to write a new TypeScript tool function for every possible spatial combination.

---

## 4. Step-by-Step Implementation Plan

### Phase 1: Database Foundation
1. Stand up a PostgreSQL instance with the `PostGIS` and `pgvector` extensions.
2. Use tools like `ogr2ogr` or Python scripts to batch migrate the existing `fields.geojson`, `wells.geojson`, etc., into indexed PostGIS tables.

### Phase 2: Built for Speed (Golang API)
1. Initialize a Go project using a fast router (e.g., `Chi` or `Echo`).
2. Write endpoints that map directly to the NDR Agent tools:
   - `GET /api/v1/spatial/intersect`
   - `GET /api/v1/spatial/nearby`
   - `GET /api/v1/features/:id`
3. Make sure these Go endpoints return optimized Esri JSON or dynamic GeoJSON for ArcGIS.

### Phase 3: AI Refactoring (Next.js + Groq)
1. Rewrite `geo-tools.ts`. Remove all `Turf.js` file-loading logic.
2. Replace the tool functions with simple `fetch()` calls to your new internal Golang Microservice.
3. Update the `orchestrator.ts` to expect split-second responses from the Go API, allowing for deeper multi-step reasoning by the AI.

### Phase 4: Frontend Overhaul (ArcGIS)
1. Replace the existing Map rendering library with the ArcGIS Maps SDK for JavaScript (`@arcgis/core`).
2. Implement `FeatureLayer` or `GeoJSONLayer` pointing directly to the Go API URLs.
3. Update the `mapActions` payload from the AI to trigger ArcGIS client-side filters (`definitionExpression`) or queries, rather than updating local state arrays.

---
**Conclusion**
By moving the spatial truth and mathematical burden to PostGIS and Golang, the Groq AI is freed to do what it does best: **reasoning and orchestration**. It makes the VDR capable of handling national-scale datasets effortlessly.
