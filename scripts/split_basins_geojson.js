#!/usr/bin/env node

/**
 * Split the large basins GeoJSON into multiple smaller files.
 * Strategy: partition by basin_name first letter groups [A-F],[G-L],[M-R],[S-Z].
 * Output files: public/Basin_GEB/Basin_shp_wgs84_part{1-4}.geojson
 * Also writes a manifest JSON listing the parts.
 */

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'public', 'Basin_GEB', 'Basin_shp_wgs84.geojson');
const OUT_DIR = path.join(__dirname, '..', 'public', 'Basin_GEB');

function groupIndex(name) {
  const c = (name || '').trim().toUpperCase().charAt(0);
  if (c >= 'A' && c <= 'F') return 1;
  if (c >= 'G' && c <= 'L') return 2;
  if (c >= 'M' && c <= 'R') return 3;
  return 4; // S-Z and others
}

(function main() {
  if (!fs.existsSync(INPUT)) {
    console.error('Input GeoJSON not found:', INPUT);
    process.exit(1);
  }

  const gj = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  const parts = {
    1: [],
    2: [],
    3: [],
    4: []
  };

  for (const feat of gj.features || []) {
    const name = feat.properties?.basin_name || feat.properties?.BASIN_NAME || feat.properties?.NAME || '';
    const idx = groupIndex(name);
    parts[idx].push(feat);
  }

  const outputs = [];
  for (let i = 1; i <= 4; i++) {
    const outPath = path.join(OUT_DIR, `Basin_shp_wgs84_part${i}.geojson`);
    const outGj = { type: 'FeatureCollection', features: parts[i] };
    fs.writeFileSync(outPath, JSON.stringify(outGj));
    const bytes = fs.statSync(outPath).size;
    outputs.push({ file: path.basename(outPath), count: parts[i].length, sizeMB: +(bytes / (1024*1024)).toFixed(2) });
  }

  const manifest = {
    source: path.basename(INPUT),
    parts: outputs,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(OUT_DIR, 'Basin_shp_wgs84_manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('Wrote parts:', outputs);
})();
