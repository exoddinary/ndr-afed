#!/usr/bin/env node

/**
 * Convert Basin YTF Scoring from XLSM to JSON
 * Extracts 2024 final scoring vs YTF data for scatter chart
 * Usage: node scripts/convert_basin_ytf_scoring.js
 * Output: public/data/basin-ytf-scoring.json
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'public', 'Datasheet_BPS Basin Filters MASTER - 2024 Update 3.xlsm');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'basin-ytf-scoring.json');

console.log(`Reading: ${INPUT_FILE}`);

// Read the workbook
const workbook = XLSX.readFile(INPUT_FILE);

// Use the "2024 final scoring v YTF" sheet
const sheetName = '2024 final scoring v YTF';
if (!workbook.SheetNames.includes(sheetName)) {
  console.error(`Sheet "${sheetName}" not found!`);
  process.exit(1);
}

console.log(`\nUsing sheet: ${sheetName}`);
const sheet = workbook.Sheets[sheetName];

// Get raw data
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null, header: 1 });

// Find the header row (row with "Basin Name", "TOTAL SCORE", etc.)
let headerRowIndex = -1;
for (let i = 0; i < Math.min(20, rawData.length); i++) {
  const row = rawData[i];
  if (row && row.includes && (row.includes('Basin Name') || row.includes('TOTAL'))) {
    headerRowIndex = i;
    break;
  }
}

if (headerRowIndex === -1) {
  console.error('Could not find header row');
  process.exit(1);
}

const headers = rawData[headerRowIndex];
console.log(`Header row found at index ${headerRowIndex}`);

// Find column indices
const colIndices = {
  id: headers.indexOf('ID'),
  region: headers.indexOf('Region'),
  country: headers.indexOf('Country Name'),
  basin: headers.indexOf('Basin Name'),
  geoScore: headers.findIndex(h => h && h.includes('GEOLOGICAL') && h.includes('SCORE')),
  aboveGroundScore: headers.findIndex(h => h && h.includes('ABOVE GROUND SCORE')),
  totalScore: headers.findIndex(h => h && h.includes('TOTAL') && h.includes('SCORE')),
  tier: headers.indexOf('TIER'),
  ytf: headers.indexOf('YTF (MMboe)'),
  oil: headers.indexOf('Oil (MMboe)'),
  condensate: headers.indexOf('Condensate (MMboe)'),
  gas: headers.indexOf('Gas (BSCF)'),
  total: headers.indexOf('Total (MMboe)'),
  hcPhase: headers.indexOf('Dominant HC Phase'),
  petronasCountry: headers.indexOf('PETRONAS Country Presence'),
  petronasBasin: headers.indexOf('PETRONAS Basin Presence'),
};

console.log('Column indices:', colIndices);

// Extract data rows
const data = [];
for (let i = headerRowIndex + 1; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row || row.length === 0) continue;
  
  const basinName = row[colIndices.basin];
  const totalScore = row[colIndices.totalScore];
  const ytf = row[colIndices.ytf];
  
  // Only include rows with basin name, total score, and YTF
  if (!basinName || basinName === 'Basin Name' || totalScore == null || ytf == null) continue;
  
  const basin = {
    id: row[colIndices.id],
    region: row[colIndices.region],
    country: row[colIndices.country],
    basinName: basinName,
    geologicalScore: row[colIndices.geoScore] || 0,
    aboveGroundScore: row[colIndices.aboveGroundScore] || 0,
    totalScore: totalScore,
    tier: row[colIndices.tier],
    ytf: ytf,
    oil: row[colIndices.oil] || 0,
    condensate: row[colIndices.condensate] || 0,
    gas: row[colIndices.gas] || 0,
    totalResources: row[colIndices.total] || 0,
    hcPhase: row[colIndices.hcPhase],
    petronasCountryPresence: row[colIndices.petronasCountry],
    petronasBasinPresence: row[colIndices.petronasBasin],
  };
  
  data.push(basin);
}

console.log(`Found ${data.length} basin rows`);
console.log('Sample basin:', data[0]);

// Create output directory if needed
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Group by region and tier for analysis
const byRegion = {};
const byTier = {};
data.forEach(basin => {
  if (basin.region) {
    if (!byRegion[basin.region]) byRegion[basin.region] = [];
    byRegion[basin.region].push(basin);
  }
  if (basin.tier) {
    if (!byTier[basin.tier]) byTier[basin.tier] = [];
    byTier[basin.tier].push(basin);
  }
});

// Write output
const output = {
  basins: data,
  count: data.length,
  byRegion: Object.keys(byRegion).map(region => ({
    region,
    count: byRegion[region].length,
    avgScore: (byRegion[region].reduce((sum, b) => sum + b.totalScore, 0) / byRegion[region].length).toFixed(2),
    avgYTF: (byRegion[region].reduce((sum, b) => sum + b.ytf, 0) / byRegion[region].length).toFixed(2),
  })),
  byTier: Object.keys(byTier).sort().map(tier => ({
    tier,
    count: byTier[tier].length,
    avgScore: (byTier[tier].reduce((sum, b) => sum + b.totalScore, 0) / byTier[tier].length).toFixed(2),
    avgYTF: (byTier[tier].reduce((sum, b) => sum + b.ytf, 0) / byTier[tier].length).toFixed(2),
  })),
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log(`\n✅ Wrote: ${OUTPUT_FILE}`);
console.log(`\n✅ Extracted ${data.length} basins`);

console.log('\nBy Region:');
output.byRegion.forEach(r => console.log(`  ${r.region}: ${r.count} basins, avg score: ${r.avgScore}, avg YTF: ${r.avgYTF}`));

console.log('\nBy Tier:');
output.byTier.forEach(t => console.log(`  ${t.tier}: ${t.count} basins, avg score: ${t.avgScore}, avg YTF: ${t.avgYTF}`));

console.log('\nScore range:', Math.min(...data.map(b => b.totalScore)), '-', Math.max(...data.map(b => b.totalScore)));
console.log('YTF range:', Math.min(...data.map(b => b.ytf)), '-', Math.max(...data.map(b => b.ytf)));
