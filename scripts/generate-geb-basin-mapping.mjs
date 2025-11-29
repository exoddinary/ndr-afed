#!/usr/bin/env node
/**
 * Generate a fuzzy mapping CSV from table basin names → GeoJSON basin names.
 *
 * Reads:
 *  - public/data/basin-ytf-scoring.json (basins list; falls back to other files if needed)
 *  - public/Basin_GEB/*.geojson (collects unique basin names)
 *
 * Outputs:
 *  - scripts/output/geb-basin-mapping.csv
 *    Columns:
 *      table_name, best_geojson, score, alt1, alt1_score, alt2, alt2_score
 *
 * Usage:
 *  node scripts/generate-geb-basin-mapping.mjs
 */
import fs from 'fs'
import path from 'path'
import url from 'url'

const ROOT = path.dirname(url.fileURLToPath(import.meta.url)).replace(/\/scripts$/, '')
const PUBLIC_DIR = path.join(ROOT, 'public')
const DATA_DIR = path.join(PUBLIC_DIR, 'data')
const GEO_DIR = path.join(PUBLIC_DIR, 'Basin_GEB')
const OUT_DIR = path.join(ROOT, 'scripts', 'output')

const TABLE_FILES = [
  'basin-ytf-scoring.json',
  'basin-combined-scoring.json',
  'basin-ranking.json',
]

const GEO_FILES = [
  'Basin_shp_wgs84_part1.geojson',
  'Basin_shp_wgs84_part2.geojson',
  'Basin_shp_wgs84_part3.geojson',
  'Basin_shp_wgs84_part4.geojson',
]

const NAME_FIELDS = ['basin_name','BASIN_NAME','Basin_Name','BasinName','BASIN','Basin','NAME','Name','name']

const normalize = (s) => (s || '')
  .toLowerCase()
  .normalize('NFKC')
  .replace(/\([^)]*\)/g, '')
  .replace(/[^a-z0-9\s&]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

function collectTableNames() {
  const names = new Set()
  for (const f of TABLE_FILES) {
    const p = path.join(DATA_DIR, f)
    if (!fs.existsSync(p)) continue
    const j = readJSON(p)
    const arr = j.basins || j.data || []
    for (const b of arr) {
      const n = b.basinName || b.name || b.Basin || b.BASIN_NAME || b.BASIN || b.BasinName
      if (!n) continue
      names.add(String(n).trim())
    }
  }
  return [...names]
}

function pickName(props) {
  for (const f of NAME_FIELDS) {
    if (props?.[f] != null && String(props[f]).trim() !== '') return String(props[f])
  }
  return null
}

function collectGeojsonNames() {
  const names = new Set()
  for (const f of GEO_FILES) {
    const p = path.join(GEO_DIR, f)
    if (!fs.existsSync(p)) continue
    const j = readJSON(p)
    const feats = j.features || []
    for (const feat of feats) {
      const n = pickName(feat?.properties || {})
      if (n) names.add(String(n).trim())
    }
  }
  return [...names]
}

// Levenshtein distance
function lev(a, b) {
  if (a === b) return 0
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array(n + 1).fill(0)
  for (let j = 0; j <= n; j++) dp[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      if (a[i - 1] === b[j - 1]) dp[j] = prev
      else dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1)
      prev = tmp
    }
  }
  return dp[n]
}

function similarity(a, b) {
  const na = normalize(a), nb = normalize(b)
  if (!na || !nb) return 0
  const d = lev(na, nb)
  const maxLen = Math.max(na.length, nb.length) || 1
  return 1 - d / maxLen
}

function bestMatchesFor(tableName, geoNames, k = 3) {
  const scored = geoNames.map(gn => ({ name: gn, score: similarity(tableName, gn) }))
  scored.sort((x, y) => y.score - x.score)
  return scored.slice(0, k)
}

function toCSVRow(fields) {
  return fields.map(v => {
    const s = String(v ?? '')
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }).join(',')
}

function main() {
  const tableNames = collectTableNames()
  const geoNames = collectGeojsonNames()
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outPath = path.join(OUT_DIR, 'geb-basin-mapping.csv')

  const header = ['table_name','best_geojson','score','alt1','alt1_score','alt2','alt2_score']
  const rows = [toCSVRow(header)]

  for (const tn of tableNames) {
    const cand = bestMatchesFor(tn, geoNames, 3)
    const best = cand[0] || { name: '', score: 0 }
    const alt1 = cand[1] || { name: '', score: 0 }
    const alt2 = cand[2] || { name: '', score: 0 }
    rows.push(toCSVRow([
      tn,
      best.name,
      best.score.toFixed(3),
      alt1.name,
      alt1.score.toFixed(3),
      alt2.name,
      alt2.score.toFixed(3),
    ]))
  }

  fs.writeFileSync(outPath, rows.join('\n'))
  console.log('Mapping suggestions written to', path.relative(ROOT, outPath))
  console.log('Tip: edit best_geojson to the correct name; then run filter-geb-geojson with --allow that edited column or I can extend it to accept a two-column mapping.')
}

main()
