#!/usr/bin/env node

/**
 * Convert Basin Ranking XLSX to JSON for GEB map integration
 * Usage: node scripts/convert_basin_ranking_xlsx.js
 * Output: public/data/basin-ranking.json
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'public', 'Basin Ranking - Above Ground Risks 2024 REV.xlsx');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'basin-ranking.json');

console.log(`Reading: ${INPUT_FILE}`);

// Read the workbook
const workbook = XLSX.readFile(INPUT_FILE);

console.log('\nAvailable sheets:');
workbook.SheetNames.forEach((name, idx) => console.log(`  ${idx + 1}. ${name}`));

// Try to find the combined scoring sheet
let sheetName = workbook.SheetNames.find(name => 
  name.toLowerCase().includes('combined') || 
  name.toLowerCase().includes('scoring') ||
  name.toLowerCase().includes('2023')
);

// If not found, use the first sheet
if (!sheetName) {
  console.log('\nNo combined scoring sheet found, using first sheet');
  sheetName = workbook.SheetNames[0];
} else {
  console.log(`\nUsing sheet: ${sheetName}`);
}

const sheet = workbook.Sheets[sheetName];

// Get raw data with header from the correct row
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null, header: 1 });

// Find the header row (the one with "ID", "Country Name", "Basin Name", etc.)
let headerRowIndex = -1;
for (let i = 0; i < Math.min(10, rawData.length); i++) {
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

// Convert to objects using the found headers, skip rows until we find data
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

// Create a lookup object keyed by basin name for easy access
const lookup = {};
data.forEach(basin => {
  const basinName = basin['Basin Name'];
  if (basinName) {
    lookup[basinName.trim()] = basin;
  }
});

// Write both array and lookup
const output = {
  basins: data,
  lookup: lookup,
  count: data.length,
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log(`✅ Wrote: ${OUTPUT_FILE}`);
console.log(`\n✅ Extracted ${data.length} basins`);
console.log('\nSample basin names:');
Object.keys(lookup).slice(0, 10).forEach(name => console.log(`  - ${name}`));

console.log('\nColumn names found:');
if (data[0]) {
  Object.keys(data[0]).forEach(key => console.log(`  - ${key}`));
}
