#!/usr/bin/env node
/**
 * Compare basins listed in the table (tiered only) vs basins present in GeoJSON layers.
 * Usage: node scripts/check-geb-basins.mjs
 */
import fs from 'fs'
import path from 'path'
import url from 'url'

const ROOT = path.dirname(url.fileURLToPath(import.meta.url))
  .replace(/\/scripts$/, '')
const PUBLIC_DIR = path.join(ROOT, 'public')
const DATA_DIR = path.join(PUBLIC_DIR, 'data')

const GEOJSON_FILES = [
  'Basin_GEB/Basin_shp_wgs84_part1.geojson',
  'Basin_GEB/Basin_shp_wgs84_part2.geojson',
  'Basin_GEB/Basin_shp_wgs84_part3.geojson',
  'Basin_GEB/Basin_shp_wgs84_part4.geojson',
]

const TABLE_DATA_FILES = [
  'basin-ytf-scoring.json',
  'basin-combined-scoring.json',
  'basin-ranking.json',
]

const NAME_FIELDS = [
  // common cases
  'BASIN_NAME', 'Basin_Name', 'BasinName', 'BASINNAME', 'BASIN', 'Basin', 'NAME', 'Name', 'name',
  // observed in current GeoJSON samples
  'basin_name', 'basinname', 'basin'
]

const normalizeName = (s) => (s || '')
  .normalize('NFKC')
  .trim()
  .replace(/\s+/g, ' ')
  .replace(/[’']/g, "'")
  .replace(/\u00A0/g, ' ')
  .toLowerCase()

const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

function collectTieredBasins() {
  const raw = new Set()
  for (const f of TABLE_DATA_FILES) {
    const filePath = path.join(DATA_DIR, f)
    if (!fs.existsSync(filePath)) {
      console.warn(`[WARN] Table data not found: public/data/${f}`)
      continue
    }
    const json = readJSON(filePath)
    const basins = json.basins || json.data || []
    for (const b of basins) {
      const name = b.basinName || b.name || b.Basin || b.BASIN_NAME || b.BASIN || b.BasinName
      const tier = b.tier
      if (!name) continue
      if (tier && String(tier).toLowerCase() !== '-' && String(tier).trim() !== '') raw.add(String(name))
    }
  }
  const norm = new Set([...raw].map(normalizeName))
  return { raw, norm }
}

function collectGeojsonBasins() {
  const raw = new Set()
  const fieldHits = {}
  let totalFeatures = 0
  const samples = []
  for (const rel of GEOJSON_FILES) {
    const filePath = path.join(PUBLIC_DIR, rel)
    if (!fs.existsSync(filePath)) {
      console.warn(`[WARN] GeoJSON not found: public/${rel}`)
      continue
    }
    const gj = readJSON(filePath)
    const feats = gj.features || []
    totalFeatures += feats.length
    if (feats.length > 0) {
      const props = feats[0]?.properties || {}
      samples.push({ file: rel, featureCount: feats.length, sampleKeys: Object.keys(props).slice(0, 12) })
    } else {
      samples.push({ file: rel, featureCount: 0, sampleKeys: [] })
    }
    for (const f of feats) {
      const props = f?.properties || {}
      let name
      for (const cand of NAME_FIELDS) {
        if (props[cand] != null && String(props[cand]).trim() !== '') { name = String(props[cand]); fieldHits[cand] = (fieldHits[cand]||0)+1; break }
      }
      if (!name) continue
      raw.add(name)
    }
  }
  const norm = new Set([...raw].map(normalizeName))
  return { raw, norm, fieldHits, totalFeatures, samples }
}

const diff = (a, b) => [...a].filter(v => !b.has(v))

function main() {
  const tiered = collectTieredBasins()
  const geo = collectGeojsonBasins()

  const missingOnMapNorm = diff(tiered.norm, geo.norm)
  const extraOnMapNorm = diff(geo.norm, tiered.norm)

  const revTiered = new Map([...tiered.raw].map(r => [normalizeName(r), r]))
  const revGeo = new Map([...geo.raw].map(r => [normalizeName(r), r]))

  const missingOnMap = missingOnMapNorm.map(n => revTiered.get(n) || n).sort()
  const extraOnMap = extraOnMapNorm.map(n => revGeo.get(n) || n).sort()
  const intersection = [...tiered.norm].filter(n => geo.norm.has(n)).map(n => revTiered.get(n) || n).sort()

  console.log('=== GEB Basin Verification ===')
  console.log(`Tiered basins in table: ${tiered.raw.size}`)
  console.log(`Unique basin names in GeoJSON: ${geo.raw.size}`)
  console.log(`Total features across GeoJSON: ${geo.totalFeatures}`)
  console.log('Name field hits in GeoJSON props:', geo.fieldHits)
  if (geo.samples && geo.samples.length) {
    console.log('Samples from GeoJSON (file, featureCount, sampleKeys):')
    for (const s of geo.samples) console.log(' -', s)
  }
  console.log('')
  console.log(`Present on both (intersection): ${intersection.length}`)
  console.log(`Missing on map (from listed tiered): ${missingOnMap.length}`)
  console.log(`On map but not in listed tiered: ${extraOnMap.length}`)
  console.log('')

  const outDir = path.join(ROOT, 'scripts', 'output')
  try { fs.mkdirSync(outDir, { recursive: true }) } catch {}
  const outPath = path.join(outDir, 'geb-basin-report.json')
  fs.writeFileSync(outPath, JSON.stringify({
    summary: {
      tieredCount: tiered.raw.size,
      geojsonUniqueCount: geo.raw.size,
      geojsonFeatureCount: geo.totalFeatures,
      intersectionCount: intersection.length,
      missingOnMapCount: missingOnMap.length,
      extraOnMapCount: extraOnMap.length,
      nameFieldHits: geo.fieldHits,
      samples: geo.samples,
    },
    missingOnMap,
    extraOnMap,
    intersection
  }, null, 2))
  console.log(`Report written: ${outPath}`)
  if (missingOnMap.length || extraOnMap.length) {
    console.log('Result: MISMATCHES FOUND')
    process.exitCode = 1
  } else {
    console.log('Result: OK (all tiered basins accounted for)')
  }
}

main()
