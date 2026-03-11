import Groq from 'groq-sdk'
import {
    tool_find_nearby_features,
    tool_get_features_within_area,
    tool_calculate_distance,
    tool_filter_features,
    tool_find_directional_features,
    tool_find_features_between,
    tool_find_temporal_spatial_features,
    tool_intersect_features,
    tool_analyze_trajectory,
    tool_spatial_aggregate,
    tool_fuzzy_find_feature,
    tool_get_feature_by_id,
    getDirectionLabel,
    type LayerName,
} from './tools/geo-tools'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are the Spatial Reasoning Agent for the Netherlands National Data Room (NDR).
Your role: analyze geospatial relationships between map features — proximity, containment, overlap, direction, and spatial extent.

You work with these layers:
- wells (Point): well locations with name IDENTIFICA
- fields (Polygon): hydrocarbon fields with name FIELD_NAME  
- blocks (Polygon): offshore blocks with name BlokNummer
- seismic2d (LineString): 2D seismic survey lines with YEAR
- seismic3d (Polygon): 3D seismic survey grids with YEAR
- trajectories (LineString): well trajectories with name SHORT_NM
- gng_projects (Polygon): G&G project outlines with INTERPRETATION_YEAR
- licenses (Polygon): license areas with licence_nm (types: STR=Storage, GEA=Geothermal, GFL=Gas Field)

Spatial capabilities:
- Proximity: find features within X km of a location
- Direction: find features north/south/east/west of a location
- Between: find features between two locations
- Intersection: true geometry overlap detection with area calculation
- Temporal-Spatial: filter by year range + spatial constraints
- Trajectory: analyze well path intersections with fields/blocks
- Aggregation: count and group features by area with statistics

When answering spatial questions:
- Reference feature names, distances, and directions precisely
- Mention approximate distances in km and compass directions
- For intersections, report overlap areas in km² when available
- For temporal queries, include year ranges and data coverage
- Highlight spatial patterns: clustering, alignment, distribution`

type AgentContext = Record<string, unknown>

export type SpatialResult = {
    answer: string
    spatialData?: object[]
    mapActions?: {
        action: 'highlight' | 'zoom'
        layer: string
        identifiers: string[]
        geometry?: object
        radiusInfo?: {
            originLayer: string
            originId: string
            radiusKm: number
        }
    }[]
}

// Enhanced feature name extraction with fuzzy fallback
async function extractFeatureName(query: string, layer?: LayerName): Promise<string | null> {
    // Try regex patterns first - improved to catch offshore block patterns like K06-T
    const patterns = [
        // Pattern for "near the K06-T field" or "near K06-T field"
        /near\s+(?:the\s+)?([A-Z]\d{1,2}(?:-[A-Z]\d?)?)\s+(?:field|block|well|license)/i,
        // Pattern for "field K06-T" or "field named K06-T"
        /(?:field|block|well|license)\s+(?:named?\s+)?["']?([A-Z]\d{1,2}(?:-[A-Z]\d?)?)["']?/i,
        /\b([A-Z][0-9]{1,2}[-][A-Z0-9]+)\b/,
        /["']([A-Za-z0-9\-]+)["']/,
        /(?:of|for|from)\s+([A-Za-z0-9\-]+)(?:\s|$)/i,
    ]
    
    for (const p of patterns) {
        const m = query.match(p)
        if (m) return m[1]
    }
    
    // Fallback: fuzzy search if layer specified
    if (layer) {
        const fuzzy = await tool_fuzzy_find_feature(layer, query, 1)
        if (fuzzy.length > 0) {
            const firstResult = fuzzy[0] as Record<string, unknown>
            if (firstResult._matchedName) {
                return String(firstResult._matchedName)
            }
        }
    }
    
    return null
}

function extractRadius(query: string): number {
    const m = query.match(/(\d+)\s*km/i)
    return m ? parseInt(m[1]) : 25
}

function extractYearRange(query: string): { start: number; end: number } | null {
    // Match patterns like "2010-2020", "from 2010 to 2020", "between 2010 and 2020"
    const patterns = [
        /(\d{4})\s*[-–]\s*(\d{4})/,
        /from\s+(\d{4})\s+to\s+(\d{4})/i,
        /between\s+(\d{4})\s+and\s+(\d{4})/i,
    ]
    
    for (const p of patterns) {
        const m = query.match(p)
        if (m) {
            return { start: parseInt(m[1]), end: parseInt(m[2]) }
        }
    }
    
    // Single year with context
    const single = query.match(/(?:in|during|from)\s+(\d{4})/i)
    if (single) {
        const year = parseInt(single[1])
        return { start: year, end: year }
    }
    
    return null
}

function detectDirection(query: string): string | null {
    const directions = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest']
    const q = query.toLowerCase()
    
    for (const dir of directions) {
        if (q.includes(dir + ' of') || q.includes(dir + ' from') || q.includes('to the ' + dir)) {
            return dir
        }
    }
    return null
}

function detectBetween(query: string): [string, string] | null {
    // Match "between A and B" or "from A to B"
    const patterns = [
        /between\s+([A-Za-z0-9\-]+)\s+and\s+([A-Za-z0-9\-]+)/i,
        /from\s+([A-Za-z0-9\-]+)\s+to\s+([A-Za-z0-9\-]+)/i,
    ]
    
    for (const p of patterns) {
        const m = query.match(p)
        if (m) return [m[1], m[2]]
    }
    return null
}

function detectLayerFromQuery(query: string, fallback: LayerName = 'fields'): LayerName {
    const q = query.toLowerCase()
    if (q.includes('well') || q.includes('borehole')) return 'wells'
    if (q.includes('field')) return 'fields'
    if (q.includes('block')) return 'blocks'
    if (q.includes('seismic 3d') || q.includes('3d survey')) return 'seismic3d'
    if (q.includes('seismic 2d') || q.includes('2d line')) return 'seismic2d'
    if (q.includes('trajectory') || q.includes('well path')) return 'trajectories'
    if (q.includes('g&g') || q.includes('project') || q.includes('opendtect') || q.includes('petrel')) return 'gng_projects'
    if (q.includes('license') || q.includes('licence') || q.includes('str') || q.includes('gea') || q.includes('gfl')) return 'licenses'
    return fallback
}

export async function runSpatialReasoningAgent(userQuery: string, _context: AgentContext): Promise<SpatialResult> {
    const toolResults: Record<string, unknown> = {}
    const q = userQuery.toLowerCase()
    const mapActions: SpatialResult['mapActions'] = []

    // First detect what layers we're working with
    let originLayer: LayerName = 'fields'
    let targetLayer: LayerName = 'wells'
    
    // For "Find X near Y" queries, X is target, Y is origin
    if (q.includes('well') && q.includes('near') && (q.includes('field') || q.includes('block'))) {
        targetLayer = 'wells'
        originLayer = q.includes('field') ? 'fields' : 'blocks'
    } else if (q.includes('field') && q.includes('near') && q.includes('block')) {
        targetLayer = 'fields'
        originLayer = 'blocks'
    } else {
        // General layer detection
        const pivotIdx = Math.max(
            q.indexOf('near'),
            q.indexOf('within'),
            q.indexOf('around'),
            q.indexOf('close to')
        )
        if (pivotIdx !== -1) {
            targetLayer = detectLayerFromQuery(q.substring(0, pivotIdx), 'wells')
            originLayer = detectLayerFromQuery(q.substring(pivotIdx), 'fields')
        } else {
            targetLayer = detectLayerFromQuery(q, 'wells')
            originLayer = detectLayerFromQuery(q, 'fields')
        }
    }
    
    console.log('[Spatial Agent] Detected layers - target:', targetLayer, 'origin:', originLayer)

    // Now extract feature name with the detected origin layer for better fuzzy matching
    const featureName = await extractFeatureName(userQuery, originLayer)
    const radiusKm = extractRadius(userQuery)
    const direction = detectDirection(userQuery)
    const between = detectBetween(userQuery)
    const yearRange = extractYearRange(userQuery)
    
    console.log('[Spatial Agent] Extracted featureName:', featureName, 'radius:', radiusKm)

    // Check if we have map extent context for "this area" queries
    const hasExtentContext = _context?.extent && 
        typeof _context.extent === 'object' &&
        'xmin' in _context.extent &&
        'xmax' in _context.extent &&
        'ymin' in _context.extent &&
        'ymax' in _context.extent
    
    const mentionsThisArea = /\b(this area|current view|visible area|on the map)\b/i.test(userQuery)
    
    console.log('[Spatial Agent] Context check - hasExtent:', hasExtentContext, 'mentionsArea:', mentionsThisArea)

    try {
        // SPECIAL CASE: Query about features in current map view area
        if (hasExtentContext && mentionsThisArea) {
            console.log('[Spatial Agent] Processing "this area" query with map extent')
            
            // Convert extent to our bbox format (note: ArcGIS extent is [xmin, ymin, xmax, ymax] in lon/lat)
            const extent = _context.extent as { xmin: number; ymin: number; xmax: number; ymax: number; center?: { lat?: number; lon?: number } }
            const bbox = {
                minLon: extent.xmin,
                maxLon: extent.xmax,
                minLat: extent.ymin,
                maxLat: extent.ymax
            }
            
            console.log('[Spatial Agent] Using bbox:', bbox)
            
            // Get features within the current view
            const featuresInView = await tool_get_features_within_area(targetLayer, bbox, 50)
            toolResults['features_in_view'] = featuresInView
            toolResults['view_bbox'] = bbox
            toolResults['feature_count'] = featuresInView.length
            
            console.log(`[Spatial Agent] Found ${featuresInView.length} features in view`)
            
            // Create map action to highlight features and stay in current view
            if (featuresInView.length > 0) {
                const ids = featuresInView.slice(0, 10).map((f: object) => {
                    const record = f as Record<string, unknown>
                    return String(record.IDENTIFICA || record.FIELD_NAME || record.BlokNummer || record.SURVEY_ID || record.licence_nm || '')
                }).filter(Boolean)
                
                console.log('[Spatial Agent] IDs for highlighting in view:', ids)
                
                if (ids.length > 0) {
                    mapActions.push({
                        action: 'highlight',
                        layer: targetLayer,
                        identifiers: ids
                        // No radiusInfo - just highlight in current view
                    })
                }
            }
        }
        // 1. Temporal-Spatial Query
        else if (yearRange && (q.includes('seismic') || q.includes('project') || q.includes('survey'))) {
            const temporalLayer: LayerName = q.includes('3d') ? 'seismic3d' : 
                                             q.includes('2d') ? 'seismic2d' : 
                                             q.includes('project') ? 'gng_projects' : 'seismic3d'
            
            const spatialFilter = featureName ? {
                nearLayer: originLayer,
                nearFeature: featureName,
                radiusKm: radiusKm
            } : undefined
            
            const results = await tool_find_temporal_spatial_features(
                temporalLayer,
                yearRange,
                spatialFilter,
                30
            )
            
            toolResults['temporal_spatial'] = results
            toolResults['query_params'] = { 
                layer: temporalLayer, 
                years: `${yearRange.start}-${yearRange.end}`,
                near: featureName,
                radius: radiusKm
            }
            
            if (results.length > 0) {
                const ids = results.slice(0, 5).map((r: object) => {
                    const record = r as Record<string, unknown>
                    return String(record.SURVEY_ID || record.PROJECT_NAME || record.line_name || '')
                }).filter(Boolean)
                
                if (ids.length > 0) {
                    mapActions.push({
                        action: 'highlight',
                        layer: temporalLayer,
                        identifiers: ids
                    })
                }
            }
        }
        // 2. Directional Query
        else if (direction && featureName) {
            const directional = await tool_find_directional_features(
                originLayer,
                featureName,
                targetLayer,
                direction as any,
                radiusKm,
                20
            )
            toolResults['directional_features'] = directional
            toolResults['search_params'] = { 
                origin: featureName, 
                direction, 
                max_distance_km: radiusKm,
                layer: targetLayer 
            }
            
            const validResults = Array.isArray(directional) && directional.length > 0 && !('error' in (directional[0] || {}))
            if (validResults) {
                const ids = directional.slice(0, 5).map((f: object) => {
                    const record = f as Record<string, unknown>
                    return String(record.IDENTIFICA || record.FIELD_NAME || record.BlokNummer || '')
                }).filter(Boolean)
                
                if (ids.length > 0) {
                    mapActions.push({
                        action: 'highlight',
                        layer: targetLayer,
                        identifiers: ids,
                        radiusInfo: {
                            originLayer,
                            originId: featureName,
                            radiusKm
                        }
                    })
                }
            }
        }
        // 3. Between Two Points Query
        else if (between) {
            const [id1, id2] = between
            const betweenResults = await tool_find_features_between(
                originLayer, id1,
                originLayer, id2,
                targetLayer,
                Math.min(radiusKm, 20),
                20
            )
            toolResults['between_features'] = betweenResults
            toolResults['search_params'] = { from: id1, to: id2, layer: targetLayer }
            
            const validResults = Array.isArray(betweenResults) && betweenResults.length > 0 && !('error' in (betweenResults[0] || {}))
            if (validResults) {
                const ids = betweenResults.slice(0, 5).map((f: object) => {
                    const record = f as Record<string, unknown>
                    return String(record.IDENTIFICA || record.FIELD_NAME || record.BlokNummer || '')
                }).filter(Boolean)
                
                if (ids.length > 0) {
                    mapActions.push({
                        action: 'highlight',
                        layer: targetLayer,
                        identifiers: ids
                    })
                }
            }
        }
        // 4. Intersection Query
        else if (q.includes('intersect') || q.includes('overlap') || q.includes('inside') || q.includes('within')) {
            if (featureName) {
                const intersections = await tool_intersect_features(
                    originLayer,
                    targetLayer,
                    featureName,
                    20
                )
                toolResults['intersections'] = intersections
                toolResults['search_params'] = { 
                    feature: featureName, 
                    source_layer: originLayer,
                    target_layer: targetLayer 
                }
                
                const validResults = Array.isArray(intersections) && intersections.length > 0 && !('error' in (intersections[0] || {}))
                if (validResults) {
                    const ids = intersections.slice(0, 5).map((f: object) => {
                        const record = f as Record<string, unknown>
                        return String(record.IDENTIFICA || record.FIELD_NAME || record.BlokNummer || record.licence_nm || '')
                    }).filter(Boolean)
                    
                    if (ids.length > 0) {
                        mapActions.push({
                            action: 'highlight',
                            layer: targetLayer,
                            identifiers: ids
                        })
                    }
                }
            } else {
                // General area intersection
                const bbox = { minLat: 51.0, maxLat: 56.0, minLon: 2.0, maxLon: 8.0 }
                const [src, tgt] = await Promise.all([
                    tool_get_features_within_area(originLayer, bbox, 20),
                    tool_get_features_within_area(targetLayer, bbox, 20),
                ])
                toolResults['source_features'] = src
                toolResults['target_features'] = tgt
            }
        }
        // 5. Trajectory Analysis
        else if (q.includes('trajectory') || q.includes('well path') || q.includes('pass through')) {
            const wellMatch = userQuery.match(/well\s+([A-Za-z0-9\-]+)/i) || 
                             userQuery.match(/([A-Za-z0-9\-]+)\s+trajectory/i)
            
            if (wellMatch) {
                const wellName = wellMatch[1]
                const trajectory = await tool_analyze_trajectory(
                    wellName,
                    q.includes('field') ? 'fields' : q.includes('block') ? 'blocks' : 'fields'
                )
                toolResults['trajectory_analysis'] = trajectory
                toolResults['query_params'] = { well: wellName }
            }
        }
        // 6. Spatial Aggregation
        else if (q.includes('how many') || q.includes('count') || q.includes('statistics') || q.includes('summary')) {
            const region = q.includes('north') ? { minLat: 53, maxLat: 56, minLon: 2, maxLon: 8 } :
                            q.includes('south') ? { minLat: 51, maxLat: 53, minLon: 2, maxLon: 8 } :
                            { minLat: 51, maxLat: 56, minLon: 2, maxLon: 8 }
            
            const groupBy = q.includes('type') ? 'WELL_TYPE' :
                           q.includes('status') ? 'STATUS' :
                           q.includes('result') ? 'RESULT' : undefined
            
            const aggregate = await tool_spatial_aggregate(targetLayer, region, groupBy)
            toolResults['spatial_aggregation'] = aggregate
            toolResults['query_params'] = { region, group_by: groupBy, layer: targetLayer }
        }
        
        // DEFAULT: If we have a feature name and "near" keyword, always do nearby search
        if (featureName && (q.includes('near') || q.includes('within') || q.includes('around') || q.includes('close to'))) {
            console.log(`[Spatial Agent] Executing nearby search: ${featureName} in ${originLayer}, looking for ${targetLayer} within ${radiusKm}km`)
            
            // First verify the origin feature exists
            const originCheck = await tool_get_feature_by_id(originLayer, featureName)
            console.log('[Spatial Agent] Origin feature check:', originCheck ? 'found' : 'not found')
            
            if (!originCheck) {
                // Try fuzzy search to find the correct name
                console.log('[Spatial Agent] Trying fuzzy search for:', featureName)
                const fuzzyResults = await tool_fuzzy_find_feature(originLayer, featureName, 3)
                console.log('[Spatial Agent] Fuzzy results:', fuzzyResults.length)
                
                if (fuzzyResults.length > 0) {
                    const bestMatch = fuzzyResults[0] as Record<string, unknown>
                    const matchedName = String(bestMatch._matchedName || '')
                    console.log('[Spatial Agent] Using fuzzy match:', matchedName)
                    
                    if (matchedName) {
                        const nearby = await tool_find_nearby_features(originLayer, matchedName, targetLayer, radiusKm, 20)
                        toolResults['nearby_features'] = nearby
                        toolResults['search_params'] = { 
                            origin: matchedName, 
                            original_query: featureName,
                            radius_km: radiusKm, 
                            layer: targetLayer 
                        }
                        
                        const validResults = Array.isArray(nearby) && nearby.length > 0 && !('error' in (nearby[0] || {}))
                        if (validResults) {
                            const ids = nearby.slice(0, 5).map((f: object) => {
                                const record = f as Record<string, unknown>
                                const id = String(record.IDENTIFICA || record.FIELD_NAME || record.BlokNummer || record.SURVEY_ID || record.licence_nm || '')
                                console.log('[Spatial Agent] Fuzzy path - Extracted ID:', id)
                                return id
                            }).filter(Boolean)
                            
                            console.log('[Spatial Agent] Fuzzy path - Final IDs:', ids)
                            
                            if (ids.length > 0) {
                                mapActions.push({
                                    action: 'highlight',
                                    layer: targetLayer,
                                    identifiers: ids,
                                    radiusInfo: {
                                        originLayer,
                                        originId: matchedName,
                                        radiusKm
                                    }
                                })
                            }
                        }
                    }
                } else {
                    toolResults['error'] = `Could not find ${originLayer} named "${featureName}". Please check the name and try again.`
                }
            } else {
                // Origin feature found, proceed with nearby search
                const nearby = await tool_find_nearby_features(originLayer, featureName, targetLayer, radiusKm, 20)
                toolResults['nearby_features'] = nearby
                toolResults['search_params'] = { 
                    origin: featureName, 
                    radius_km: radiusKm, 
                    layer: targetLayer 
                }
                
                const validResults = Array.isArray(nearby) && nearby.length > 0 && !('error' in (nearby[0] || {}))
                if (validResults) {
                    const ids = nearby.slice(0, 5).map((f: object) => {
                        const record = f as Record<string, unknown>
                        const id = String(record.IDENTIFICA || record.FIELD_NAME || record.BlokNummer || record.SURVEY_ID || record.licence_nm || '')
                        console.log('[Spatial Agent] Extracted ID:', id, 'from record:', Object.keys(record).slice(0, 5))
                        return id
                    }).filter(Boolean)
                    
                    console.log('[Spatial Agent] Final IDs for highlighting:', ids)
                    
                    if (ids.length > 0) {
                        mapActions.push({
                            action: 'highlight',
                            layer: targetLayer,
                            identifiers: ids,
                            radiusInfo: {
                                originLayer,
                                originId: featureName,
                                radiusKm
                            }
                        })
                    }
                }
            }
        }
        
        // 9. Fallback: list sample features only if nothing else worked
        if (!featureName) {
            toolResults['fields_sample'] = await tool_filter_features('fields', { LANDSEA: 'Offshore' }, 20)
        }
    } catch (e) {
        toolResults['error'] = String(e)
        console.error('[Spatial Agent Error]', e)
    }

    const dataContext = JSON.stringify(toolResults, null, 2).slice(0, 8000)

    const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
                role: 'user',
                content: `User spatial query: "${userQuery}"\n\nSpatial analysis results:\n${dataContext}\n\nProvide a precise spatial interpretation based on this data. Reference feature names, distances, directions, and overlap areas where available. For temporal queries, include year ranges. For directional queries, mention compass bearings.`
            }
        ],
        temperature: 0.2,
        max_tokens: 800,
    })

    const answer = completion.choices[0]?.message?.content || 'No spatial result generated.'

    return {
        answer,
        spatialData: (toolResults['nearby_features'] || toolResults['area_features'] || toolResults['intersections'] || toolResults['directional_features'] || toolResults['between_features'] || toolResults['temporal_spatial'] || []) as object[],
        mapActions: mapActions.length > 0 ? mapActions : undefined,
    }
}
