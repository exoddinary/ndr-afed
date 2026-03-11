#!/usr/bin/env node
/**
 * GeoJSON to CSV Export with Spatial Relationships
 * 
 * This script:
 * 1. Loads wells, fields, and blocks from GeoJSON
 * 2. Performs spatial intersection to relate wells to fields and blocks
 * 3. Exports comprehensive CSV for AI analysis
 * 
 * Usage: node scripts/export-layers-to-csv.js
 */

const fs = require('fs');
const path = require('path');

// Simple point-in-polygon test (ray casting algorithm)
function pointInPolygon(point, polygon) {
  const x = point[0], y = point[1];
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Get polygon coordinates from feature
function getPolygonCoords(feature) {
  const geom = feature.geometry;
  if (!geom) return null;
  
  if (geom.type === 'Polygon') {
    return geom.coordinates[0]; // Outer ring
  } else if (geom.type === 'MultiPolygon') {
    return geom.coordinates[0][0]; // First polygon, outer ring
  }
  return null;
}

// Calculate bounding box for quick filtering
function getBBox(feature) {
  const coords = getPolygonCoords(feature);
  if (!coords) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of coords) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY };
}

// Quick bbox check before expensive point-in-polygon
function pointInBBox(point, bbox) {
  const [x, y] = point;
  return x >= bbox.minX && x <= bbox.maxX && y >= bbox.minY && y <= bbox.maxY;
}

// Load GeoJSON file
function loadGeoJSON(filePath) {
  console.log(`Loading ${path.basename(filePath)}...`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`  → ${data.features.length} features`);
  return data;
}

// Escape CSV value
function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Convert array to CSV row
function toCSVRow(values) {
  return values.map(csvEscape).join(',');
}

// Main processing function
async function exportToCSV() {
  const startTime = Date.now();
  console.log('🚀 Starting GeoJSON to CSV export with spatial relationships\n');
  
  // Load data
  const wellsData = loadGeoJSON('./public/data/Wells.json');
  const fieldsData = loadGeoJSON('./public/data/HC_Fields.json');
  const blocksData = loadGeoJSON('./public/data/Offshore_Blocks.json');
  
  // Pre-compute field bounding boxes
  console.log('\n📦 Pre-computing spatial indices...');
  const fieldsWithBBox = fieldsData.features.map(f => ({
    feature: f,
    bbox: getBBox(f),
    name: f.properties.FIELD_NAME || f.properties.FIELD_CD || 'Unknown'
  })).filter(f => f.bbox);
  
  const blocksWithBBox = blocksData.features.map(f => ({
    feature: f,
    bbox: getBBox(f),
    name: f.properties.BlokNummer || 'Unknown'
  })).filter(f => f.bbox);
  
  console.log(`  → ${fieldsWithBBox.length} fields with valid geometry`);
  console.log(`  → ${blocksWithBBox.length} blocks with valid geometry`);
  
  // Process wells and find relationships
  console.log('\n🔍 Analyzing spatial relationships...');
  const results = [];
  const totalWells = wellsData.features.length;
  
  for (let i = 0; i < totalWells; i++) {
    const well = wellsData.features[i];
    const props = well.properties;
    const coords = well.geometry?.coordinates;
    
    if (!coords) continue;
    
    // Find containing fields
    const containingFields = [];
    for (const field of fieldsWithBBox) {
      if (pointInBBox(coords, field.bbox)) {
        const polyCoords = getPolygonCoords(field.feature);
        if (polyCoords && pointInPolygon(coords, polyCoords)) {
          containingFields.push({
            name: field.name,
            code: field.feature.properties.FIELD_CD,
            operator: field.feature.properties.OPERATOR,
            result: field.feature.properties.RESULT,
            status: field.feature.properties.STATUS
          });
        }
      }
    }
    
    // Find containing blocks
    const containingBlocks = [];
    for (const block of blocksWithBBox) {
      if (pointInBBox(coords, block.bbox)) {
        const polyCoords = getPolygonCoords(block.feature);
        if (polyCoords && pointInPolygon(coords, polyCoords)) {
          containingBlocks.push({
            name: block.name,
            area_sqkm: block.feature.properties.Area_sqkm
          });
        }
      }
    }
    
    // Build result row
    results.push({
      // Well identification
      well_id: props.IDENTIFICA || props.GmlID || props.OBJECTID,
      well_name: props.IDENTIFICA || '',
      
      // Location
      latitude: props.LATITUDE_W || coords[1],
      longitude: props.LONGITUDE_ || coords[0],
      coordinate_system: props.COORDINATE || '',
      
      // Well characteristics
      well_type: props.WELL_TYPE || '',
      status: props.STATUS || '',
      result: props.WELL_RESUL || '',
      trajectory: props.TRAJECTORY || '',
      
      // Drilling info
      operator: props.OPERATOR || '',
      drilling_contractor: props.DRILLING_C || '',
      platform: props.PLATFORM || '',
      start_date: props.START_DATE ? new Date(props.START_DATE).toISOString().split('T')[0] : '',
      end_date: props.END_DATE_D ? new Date(props.END_DATE_D).toISOString().split('T')[0] : '',
      
      // Depths
      end_depth_m: props.END_DEPTH_ || '',
      end_depth_unit: props.END_DEPTH1 || '',
      vertical_depth_m: props.V_DEPTH_RE || '',
      true_vertical_depth_m: props.V_DEPTH__1 || '',
      deviation_m: props.DEVIATION_ || '',
      max_deviation_m: props.DEVIATION1 || '',
      
      // Spatial relationships
      field_name: containingFields.map(f => f.name).join('; ') || props.FIELD_NAME?.trim() || '',
      field_code: containingFields.map(f => f.code).join('; ') || props.FIELD_CODE?.trim() || '',
      field_operator: containingFields.map(f => f.operator).join('; ') || '',
      field_result: containingFields.map(f => f.result).join('; ') || '',
      field_status: containingFields.map(f => f.status).join('; ') || '',
      
      block_name: containingBlocks.map(b => b.name).join('; ') || '',
      block_area_sqkm: containingBlocks.map(b => b.area_sqkm).join('; ') || '',
      
      // Relationship flags
      in_field: containingFields.length > 0 ? 'Yes' : 'No',
      in_block: containingBlocks.length > 0 ? 'Yes' : 'No',
      field_count: containingFields.length,
      block_count: containingBlocks.length,
      
      // Raw spatial data for advanced analysis
      containing_fields_json: JSON.stringify(containingFields),
      containing_blocks_json: JSON.stringify(containingBlocks)
    });
    
    // Progress update
    if ((i + 1) % 1000 === 0 || i === totalWells - 1) {
      const pct = ((i + 1) / totalWells * 100).toFixed(1);
      process.stdout.write(`\r  → Processed ${i + 1}/${totalWells} wells (${pct}%)`);
    }
  }
  
  console.log('\n\n✅ Spatial analysis complete');
  
  // Generate CSV
  console.log('\n📝 Generating CSV files...');
  
  // 1. Main wells CSV with relationships
  const wellsHeaders = [
    'well_id', 'well_name', 'latitude', 'longitude', 'coordinate_system',
    'well_type', 'status', 'result', 'trajectory',
    'operator', 'drilling_contractor', 'platform',
    'start_date', 'end_date',
    'end_depth_m', 'end_depth_unit', 'vertical_depth_m', 'true_vertical_depth_m',
    'deviation_m', 'max_deviation_m',
    'field_name', 'field_code', 'field_operator', 'field_result', 'field_status',
    'block_name', 'block_area_sqkm',
    'in_field', 'in_block', 'field_count', 'block_count'
  ];
  
  const wellsCsv = [
    toCSVRow(wellsHeaders),
    ...results.map(r => toCSVRow(wellsHeaders.map(h => r[h])))
  ].join('\n');
  
  fs.writeFileSync('./data/export/wells_with_relationships.csv', wellsCsv);
  console.log(`  → wells_with_relationships.csv (${results.length} rows)`);
  
  // 2. Detailed relationships CSV (one row per well-field-block combination)
  const detailedRows = [];
  for (const well of results) {
    const fields = JSON.parse(well.containing_fields_json);
    const blocks = JSON.parse(well.containing_blocks_json);
    
    // Create combinations
    if (fields.length === 0 && blocks.length === 0) {
      detailedRows.push({
        well_id: well.well_id,
        well_name: well.well_name,
        latitude: well.latitude,
        longitude: well.longitude,
        well_type: well.well_type,
        well_status: well.status,
        well_result: well.result,
        field_name: '',
        field_code: '',
        field_operator: '',
        field_result: '',
        block_name: '',
        block_area_sqkm: ''
      });
    } else {
      const maxLen = Math.max(fields.length || 1, blocks.length || 1);
      for (let i = 0; i < maxLen; i++) {
        detailedRows.push({
          well_id: well.well_id,
          well_name: well.well_name,
          latitude: well.latitude,
          longitude: well.longitude,
          well_type: well.well_type,
          well_status: well.status,
          well_result: well.result,
          field_name: fields[i]?.name || '',
          field_code: fields[i]?.code || '',
          field_operator: fields[i]?.operator || '',
          field_result: fields[i]?.result || '',
          block_name: blocks[i]?.name || '',
          block_area_sqkm: blocks[i]?.area_sqkm || ''
        });
      }
    }
  }
  
  const detailedHeaders = [
    'well_id', 'well_name', 'latitude', 'longitude',
    'well_type', 'well_status', 'well_result',
    'field_name', 'field_code', 'field_operator', 'field_result',
    'block_name', 'block_area_sqkm'
  ];
  
  const detailedCsv = [
    toCSVRow(detailedHeaders),
    ...detailedRows.map(r => toCSVRow(detailedHeaders.map(h => r[h])))
  ].join('\n');
  
  fs.writeFileSync('./data/export/well_field_block_relationships.csv', detailedCsv);
  console.log(`  → well_field_block_relationships.csv (${detailedRows.length} rows)`);
  
  // 3. Summary statistics
  const stats = {
    total_wells: results.length,
    wells_in_field: results.filter(r => r.in_field === 'Yes').length,
    wells_in_block: results.filter(r => r.in_block === 'Yes').length,
    wells_in_both: results.filter(r => r.in_field === 'Yes' && r.in_block === 'Yes').length,
    wells_with_no_field: results.filter(r => r.in_field === 'No').length,
    wells_by_type: {},
    wells_by_status: {},
    wells_by_result: {}
  };
  
  for (const r of results) {
    stats.wells_by_type[r.well_type] = (stats.wells_by_type[r.well_type] || 0) + 1;
    stats.wells_by_status[r.status] = (stats.wells_by_status[r.status] || 0) + 1;
    stats.wells_by_result[r.result] = (stats.wells_by_result[r.result] || 0) + 1;
  }
  
  fs.writeFileSync('./data/export/export_statistics.json', JSON.stringify(stats, null, 2));
  console.log(`  → export_statistics.json`);
  
  // 4. AI-friendly summary text
  const summaryText = `# NDR Data Export Summary

Generated: ${new Date().toISOString()}

## Overview
- Total Wells: ${stats.total_wells.toLocaleString()}
- Wells in Fields: ${stats.wells_in_field.toLocaleString()} (${(stats.wells_in_field/stats.total_wells*100).toFixed(1)}%)
- Wells in Blocks: ${stats.wells_in_block.toLocaleString()} (${(stats.wells_in_block/stats.total_wells*100).toFixed(1)}%)
- Wells in Both Field and Block: ${stats.wells_in_both.toLocaleString()}
- Wells Outside Fields: ${stats.wells_with_no_field.toLocaleString()}

## Wells by Type
${Object.entries(stats.wells_by_type).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## Wells by Status
${Object.entries(stats.wells_by_status).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## Wells by Result
${Object.entries(stats.wells_by_result).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## File Descriptions

### wells_with_relationships.csv
Main export file with one row per well. Contains:
- Well identification and location
- Drilling characteristics
- Spatial relationships (containing field/block names)
- Relationship flags and counts

### well_field_block_relationships.csv
Normalized relationship file where each row represents a well-field-block combination.
Useful for pivot tables and relational analysis.

## Usage for AI Analysis

Example questions the AI can answer with this data:
1. "Which wells in field X have gas results?"
2. "What is the average depth of abandoned wells?"
3. "List all exploration wells in block K10"
4. "Which operator has drilled the most wells?"
5. "Find wells with vertical depth > 3000m that discovered oil"
`;
  
  fs.writeFileSync('./data/export/README.md', summaryText);
  console.log(`  → README.md`);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✨ Export complete in ${duration}s`);
  console.log(`\n📁 Output directory: ./data/export/`);
  console.log('\n💡 Tip: For AI integration, load wells_with_relationships.csv as a');
  console.log('   knowledge base. Each row contains complete well context with');
  console.log('   spatial relationships pre-computed.');
}

// Create output directory
const exportDir = './data/export';
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

// Run
exportToCSV().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
