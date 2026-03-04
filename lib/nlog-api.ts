/**
 * NLOG (Netherlands Oil & Gas Portal) - Free Public WFS API
 * Source: https://www.nlog.nl | Data by Rijkswaterstaat Noordzee & TNO
 * License: Open Data (nlog.nl/disclaimer)
 */

const NLOG_WFS_BASE = 'https://www.gdngeoservices.nl/geoserver/nlog/ows'

const buildWFSUrl = (typeName: string) =>
    `${NLOG_WFS_BASE}?service=WFS&version=1.0.0&request=GetFeature&typeName=${typeName}&outputFormat=application/json&srsName=EPSG:4326`

/** Available NLOG WFS layers */
export const NLOG_LAYERS = {
    /** All hydrocarbon licence blocks (polygon boundaries) */
    LICENCES: 'nlog:gdw_ng_licence_utm',
    /** Oil & gas fields */
    FIELDS: 'nlog:gdw_ng_field_utm',
    /** All boreholes / wells */
    BOREHOLES: 'nlog:gdw_ng_wll_all_utm',
    /** Production platforms / mining facilities */
    PLATFORMS: 'nlog:GDW_NG_FACILITY_UTM',
    /** 2D Seismic lines */
    SEISMIC_2D: 'nlog:gdw_ng_smc_ln_utm',
    /** 3D Seismic grids */
    SEISMIC_3D: 'nlog:gdw_ng_smc_grid_utm',
} as const

/** Direct GeoJSON URLs for each layer */
export const NLOG_URLS = {
    LICENCES: buildWFSUrl(NLOG_LAYERS.LICENCES),
    FIELDS: buildWFSUrl(NLOG_LAYERS.FIELDS),
    BOREHOLES: buildWFSUrl(NLOG_LAYERS.BOREHOLES),
    PLATFORMS: buildWFSUrl(NLOG_LAYERS.PLATFORMS),
    SEISMIC_2D: buildWFSUrl(NLOG_LAYERS.SEISMIC_2D),
    SEISMIC_3D: buildWFSUrl(NLOG_LAYERS.SEISMIC_3D),
}

export interface NLOGFeature {
    type: 'Feature'
    id: string
    geometry: {
        type: string
        coordinates: number[][][] | number[][][][] | number[]
    }
    properties: Record<string, string | number | boolean | null>
}

export interface NLOGFeatureCollection {
    type: 'FeatureCollection'
    features: NLOGFeature[]
}

let _licencesCache: NLOGFeatureCollection | null = null

/**
 * Fetch Netherlands hydrocarbon licence blocks from NLOG WFS.
 * Results are cached in memory for the session.
 */
export async function fetchNLOGLicences(): Promise<NLOGFeatureCollection> {
    if (_licencesCache) return _licencesCache
    const res = await fetch(NLOG_URLS.LICENCES)
    if (!res.ok) throw new Error(`NLOG API error: ${res.status}`)
    const data = await res.json()
    _licencesCache = data
    return data
}

/**
 * Fetch Netherlands oil & gas fields from NLOG WFS.
 */
export async function fetchNLOGFields(): Promise<NLOGFeatureCollection> {
    const res = await fetch(NLOG_URLS.FIELDS)
    if (!res.ok) throw new Error(`NLOG API error: ${res.status}`)
    return res.json()
}

/**
 * Fetch Netherlands boreholes / wells from NLOG WFS.
 */
export async function fetchNLOGBoreholes(): Promise<NLOGFeatureCollection> {
    const res = await fetch(NLOG_URLS.BOREHOLES)
    if (!res.ok) throw new Error(`NLOG API error: ${res.status}`)
    return res.json()
}
