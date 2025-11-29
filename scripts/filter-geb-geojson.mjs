#!/usr/bin/env node
/**
 * Filter the GEB basin GeoJSONs to ONLY include an allowlist of basin names.
 *
 * Sources:
 * - public/data/basin-ytf-scoring.json (default allowlist: tiered basins only)
 * - or pass a CSV file of names via --allow ./path/to/allow.csv
 *
 * Output:
 * - Writes filtered files to public/Basin_GEB_filtered/*.geojson
 * - Leaves originals untouched
 *
 * Usage:
 *   node scripts/filter-geb-geojson.mjs
 *   node scripts/filter-geb-geojson.mjs --allow ./my-allow.csv
 */
import fs from 'fs'
import path from 'path'
import url from 'url'

const ROOT = path.dirname(url.fileURLToPath(import.meta.url)).replace(/\/scripts$/, '')
const PUBLIC_DIR = path.join(ROOT, 'public')
const DATA_DIR = path.join(PUBLIC_DIR, 'data')
const SRC_FILES = [
  'Basin_GEB/Basin_shp_wgs84_part1.geojson',
  'Basin_GEB/Basin_shp_wgs84_part2.geojson',
  'Basin_GEB/Basin_shp_wgs84_part3.geojson',
  'Basin_GEB/Basin_shp_wgs84_part4.geojson',
]
const OUT_DIR = path.join(PUBLIC_DIR, 'Basin_GEB_filtered')
const NAME_FIELDS = ['basin_name','BASIN_NAME','Basin_Name','BasinName','BASIN','Basin','NAME','Name','name']

const args = process.argv.slice(2)
const allowCsvPath = (() => {
  const i = args.indexOf('--allow')
  return i >= 0 ? args[i+1] : null
})()

const normalize = (s) => (s || '')
  .toLowerCase()
  .normalize('NFKC')
  .replace(/\([^)]*\)/g, '')
  .replace(/[^a-z0-9\s&]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

function parseCSV(text) {
  const rows = []
  let cur = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i+1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else { field += c }
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { cur.push(field); field = '' }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = '' }
      else if (c === '\r') { /* ignore */ }
      else field += c
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur) }
  return rows
}

function loadAllowlist() {
  if (allowCsvPath) {
    const raw = fs.readFileSync(allowCsvPath, 'utf8')
    if (/\.csv$/i.test(allowCsvPath)) {
      const rows = parseCSV(raw).filter(r => r.length && r.some(x => (x||'').trim() !== ''))
      if (!rows.length) return new Set()
      const header = rows[0].map(h => (h||'').trim().toLowerCase())
      let colIdx = header.indexOf('best_geojson')
      if (colIdx < 0) colIdx = header.indexOf('geojson_name')
      const body = rows.slice(header.some(h => h) ? 1 : 0)
      const list = []
      for (const r of body) {
        if (colIdx >= 0 && r[colIdx]) list.push(String(r[colIdx]).trim())
        else if (r.length) list.push(String(r.find(v => (v||'').trim() !== '') || '').trim())
      }
      return new Set(list.filter(Boolean).map(normalize))
    } else {
      const names = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      return new Set(names.map(normalize))
    }
  }
  const ytfPath = path.join(DATA_DIR, 'basin-ytf-scoring.json')
  if (!fs.existsSync(ytfPath)) throw new Error('Missing public/data/basin-ytf-scoring.json')
  const json = readJSON(ytfPath)
  const basins = json.basins || []
  const names = basins.filter(b => b?.tier && String(b.tier) !== '-')
    .map(b => b.basinName || b.name)
    .filter(Boolean)
  return new Set(names.map(normalize))
}

function pickName(props) {
  for (const f of NAME_FIELDS) {
    if (props?.[f] != null && String(props[f]).trim() !== '') return String(props[f])
  }
  return null
}

function main() {
  const allow = loadAllowlist()
  fs.mkdirSync(OUT_DIR, { recursive: true })
  let keptTotal = 0, inputTotal = 0

  for (const rel of SRC_FILES) {
    const inPath = path.join(PUBLIC_DIR, rel)
    if (!fs.existsSync(inPath)) {
      console.warn('[WARN] Missing', rel)
      continue
    }
    const gj = readJSON(inPath)
    const feats = Array.isArray(gj.features) ? gj.features : []
    inputTotal += feats.length

    const kept = feats.filter(f => {
      const n = pickName(f?.properties || {})
      if (!n) return false
      const norm = normalize(n)
      return allow.has(norm)
    })
    keptTotal += kept.length

    const out = { ...gj, features: kept }
    const outPath = path.join(OUT_DIR, path.basename(rel))
    fs.writeFileSync(outPath, JSON.stringify(out))
    console.log(`Wrote ${out.features.length}/${feats.length} → ${path.relative(ROOT, outPath)}`)
  }

  console.log(`Done. Kept ${keptTotal}/${inputTotal} features across all files.`)
  console.log('Update your map layers to load from /Basin_GEB_filtered/*.geojson to see the pruned set.')
}

main()
