#!/usr/bin/env node

/**
 * Convert Basin Ranking XLSX 2023 Combined Scoring to JSON
 * Extracts combined scores (above-ground + geological/subsurface)
 * Usage: node scripts/convert_basin_combined_scoring.js
 * Output: public/data/basin-combined-scoring.json
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'public', 'Basin Ranking - Above Ground Risks 2024 REV.xlsx');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'basin-combined-scoring.json');

console.log(`Reading: ${INPUT_FILE}`);

// Read the workbook
const workbook = XLSX.readFile(INPUT_FILE);

console.log('\nAvailable sheets:');
workbook.SheetNames.forEach((name, idx) => console.log(`  ${idx + 1}. ${name}`));

// Use the "2023 combined scoring" sheet
const sheetName = '2023 combined scoring';
if (!workbook.SheetNames.includes(sheetName)) {
  console.error(`Sheet "${sheetName}" not found!`);
  process.exit(1);
}

console.log(`\nUsing sheet: ${sheetName}`);
const sheet = workbook.Sheets[sheetName];

// Get raw data with header from the correct row
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null, header: 1 });

// Find the header row
let headerRowIndex = -1;
for (let i = 0; i < Math.min(15, rawData.length); i++) {
  const row = rawData[i];
  if (row && row.includes && (row.includes('Basin Name') || row.includes('Country Name'))) {
    headerRowIndex = i;
    break;
  }
}

if (headerRowIndex === -1) {
  console.error('Could not find header row with "Basin Name"');
  process.exit(1);
}

const headers = rawData[headerRowIndex];
console.log(`Header row found at index ${headerRowIndex}`);
console.log('First 10 headers:', headers.slice(0, 10));

// Convert to objects using the found headers
const data = [];
for (let i = headerRowIndex + 1; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row || row.length === 0) continue;
  
  const obj = {};
  let hasData = false;
  for (let j = 0; j < headers.length && j < row.length; j++) {
    const header = headers[j];
    const value = row[j];
    if (header && value !== null && value !== undefined && value !== '') {
      obj[header] = value;
      hasData = true;
    }
  }
  
  // Only add rows that have basin name and skip header duplicates
  if (hasData && obj['Basin Name'] && obj['Basin Name'] !== 'Basin Name') {
    data.push(obj);
  }
}

console.log(`Found ${data.length} basin rows`);
console.log('Sample row:', data[0]);

// Create output directory if it doesn't exist
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create a lookup object keyed by basin name
const lookup = {};
data.forEach(basin => {
  const basinName = basin['Basin Name'];
  if (basinName) {
    lookup[basinName.trim()] = basin;
  }
});

// Sort by combined score (descending) to get top basins
const sortedBasins = [...data].sort((a, b) => {
  // Use the actual column name from the sheet
  const totalScoreCol = Object.keys(a).find(k => k.includes('TOTAL') && k.includes('SCORE'));
  const scoreA = totalScoreCol ? (a[totalScoreCol] || 0) : 0;
  const scoreB = totalScoreCol ? (b[totalScoreCol] || 0) : 0;
  return scoreB - scoreA;
});

// Write output
const output = {
  basins: data,
  lookup: lookup,
  top10: sortedBasins.slice(0, 10),
  count: data.length,
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log(`✅ Wrote: ${OUTPUT_FILE}`);
console.log(`\n✅ Extracted ${data.length} basins`);
console.log('\nTop 10 basins by combined score:');
const totalScoreCol = Object.keys(data[0] || {}).find(k => k.includes('TOTAL') && k.includes('SCORE'));
sortedBasins.slice(0, 10).forEach((basin, idx) => {
  const totalScore = totalScoreCol ? basin[totalScoreCol] : 'N/A';
  const geoCol = Object.keys(basin).find(k => k.includes('GEOLOGICAL') && k.includes('SCORE'));
  const aboveCol = Object.keys(basin).find(k => k.includes('ABOVE GROUND') && k.includes('SCORE'));
  const geoScore = geoCol ? basin[geoCol] : 'N/A';
  const aboveScore = aboveCol ? basin[aboveCol] : 'N/A';
  console.log(`  ${idx + 1}. ${basin['Basin Name']} - Total: ${totalScore} (Geo: ${geoScore}, Above: ${aboveScore})`);
});

console.log('\nColumn names found:');
if (data[0]) {
  Object.keys(data[0]).forEach(key => console.log(`  - ${key}`));
}
