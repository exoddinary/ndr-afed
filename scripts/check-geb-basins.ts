#!/usr/bin/env ts-node
/*
  Compare basins listed in the table (tiered only) vs basins present in GeoJSON layers.
  Usage: npx ts-node scripts/check-geb-basins.ts
*/
import fs from 'fs'
import path from 'path'

// Paths relative to project root
const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'data')
const PUBLIC_DIR = path.join(ROOT, 'public')

const GEOJSON_FILES = [
  'Basin_GEB/Basin_shp_wgs84_part1.geojson',
  'Basin_GEB/Basin_shp_wgs84_part2.geojson',
  'Basin_GEB/Basin_shp_wgs84_part3.geojson',
  'Basin_GEB/Basin_shp_wgs84_part4.geojson',
]

// Table sources we use on GEB page
const TABLE_DATA_FILES = [
  'basin-ytf-scoring.json', // contains basinName, tier, etc.
  'basin-combined-scoring.json',
  'basin-ranking.json',
]

const nameFieldsCandidates = [
  'BASIN_NAME', 'Basin_Name', 'Basin', 'BASIN', 'BASINNAME', 'BasinName', 'NAME', 'Name', 'name'
]

function normalizeName(s: string) {
  return (s || '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[’']/g, "'")
    .replace(/\u00A0/g, ' ')
    .toLowerCase()
}

function readJSON(p: string) {
  const raw = fs.readFileSync(p, 'utf8')
  return JSON.parse(raw)
}

function collectTieredBasins(): {raw: Set<string>, norm: Set<string>} {
  const tiered = new Set<string>()

  // Prefer ytf-scoring (has tier) but also look at combined/ranking if available
  for (const f of TABLE_DATA_FILES) {
    const filePath = path.join(DATA_DIR, f)
    if (!fs.existsSync(filePath)) continue
    const json = readJSON(filePath)

    const basins: any[] = json.basins || json.data || []
    for (const b of basins) {
      const name = b.basinName || b.name || b.Basin || b.BASIN_NAME || b.BASIN || b.BasinName
      const tier = b.tier
      if (!name) continue
      // Only take tiered ones (exclude undefined or '-')
      if (tier && String(tier).toLowerCase() !== '-' && String(tier).trim() !== '') {
        tiered.add(String(name))
      }
    }
  }

  const norm = new Set(Array.from(tiered).map(normalizeName))
  return { raw: tiered, norm }
}

function collectGeojsonBasins(): {raw: Set<string>, norm: Set<string>, fieldHits: Record<string, number>} {
  const raw = new Set<string>()
  const fieldHits: Record<string, number> = {}

  for (const rel of GEOJSON_FILES) {
    const filePath = path.join(PUBLIC_DIR, rel)
    if (!fs.existsSync(filePath)) {
      console.warn(`[WARN] GeoJSON not found: ${rel}`)
      continue
    }
    const gj = readJSON(filePath)
    const feats: any[] = gj.features || []

    for (const f of feats) {
      const props = f?.properties || {}
      let name: string | undefined
      for (const cand of nameFieldsCandidates) {
        if (props[cand] != null && String(props[cand]).trim() !== '') { name = String(props[cand]); fieldHits[cand] = (fieldHits[cand]||0)+1; break }
      }
      if (!name) continue
      raw.add(name)
    }
  }

  const norm = new Set(Array.from(raw).map(normalizeName))
  return { raw, norm, fieldHits }
}

function diffSets(a: Set<string>, b: Set<string>) {
  const out: string[] = []
  for (const v of a) if (!b.has(v)) out.push(v)
  return out
}

function main() {
  const tiered = collectTieredBasins()
  const geo = collectGeojsonBasins()

  const missingOnMapNorm = diffSets(tiered.norm, geo.norm)
  const extraOnMapNorm = diffSets(geo.norm, tiered.norm)

  // Map normalized back to original where possible (best-effort)
  const revTiered = new Map(Array.from(tiered.raw).map(r => [normalizeName(r), r]))
  const revGeo = new Map(Array.from(geo.raw).map(r => [normalizeName(r), r]))

  const missingOnMap = missingOnMapNorm.map(n => revTiered.get(n) || n).sort()
  const extraOnMap = extraOnMapNorm.map(n => revGeo.get(n) || n).sort()

  console.log('=== GEB Basin Verification ===')
  console.log(`Tiered basins in table: ${tiered.raw.size}`)
  console.log(`Unique basin names in GeoJSON: ${geo.raw.size}`)
  console.log('Name field hits in GeoJSON props:', geo.fieldHits)
  console.log('')

  console.log(`Basins LISTED (tiered) but MISSING on MAP (${missingOnMap.length})`)
  console.log(missingOnMap.join('\n') || '(none)')
  console.log('')

  console.log(`Basins ON MAP but NOT LISTED (tiered) (${extraOnMap.length})`)
  console.log(extraOnMap.join('\n') || '(none)')
  console.log('')

  // Exit code to signal mismatches
  if (missingOnMap.length || extraOnMap.length) {
    console.log('Result: MISMATCHES FOUND')
    process.exitCode = 1
  } else {
    console.log('Result: OK (all tiered basins accounted for)')
  }
}

main()
