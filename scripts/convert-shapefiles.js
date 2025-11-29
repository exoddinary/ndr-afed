const shapefile = require("shapefile");
const fs = require("fs").promises;
const path = require("path");

const INPUT_DIR = path.join(__dirname, "../data/sample-map-data");
const OUTPUT_DIR = path.join(__dirname, "../public/geojson");

const SHAPEFILES = [
  "IHS Bathymetry MY",
  "IHS Fields MY",
  "IHS Valid Blocks MY"
];

async function convertShapefileToGeoJSON(shapeName) {
  try {
    const shpPath = path.join(INPUT_DIR, `${shapeName}.shp`);
    const dbfPath = path.join(INPUT_DIR, `${shapeName}.dbf`);
    
    console.log(`Converting ${shapeName}...`);
    
    const source = await shapefile.open(shpPath, dbfPath);
    const features = [];
    
    let result = await source.read();
    while (!result.done) {
      if (result.value) {
        features.push(result.value);
      }
      result = await source.read();
    }
    
    const geojson = {
      type: "FeatureCollection",
      features: features
    };
    
    // Create safe filename
    const outputFileName = shapeName.replace(/\s+/g, "-").toLowerCase() + ".geojson";
    const outputPath = path.join(OUTPUT_DIR, outputFileName);
    
    await fs.writeFile(outputPath, JSON.stringify(geojson, null, 2));
    
    console.log(`✓ Converted ${shapeName} → ${outputFileName}`);
    console.log(`  Features: ${features.length}`);
    
    return {
      name: shapeName,
      fileName: outputFileName,
      featureCount: features.length
    };
  } catch (error) {
    console.error(`✗ Error converting ${shapeName}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    console.log("Starting shapefile conversion...\n");
    
    const results = [];
    for (const shapeName of SHAPEFILES) {
      const result = await convertShapefileToGeoJSON(shapeName);
      results.push(result);
    }
    
    console.log("\n✓ All conversions complete!");
    console.log("\nSummary:");
    results.forEach(r => {
      console.log(`  - ${r.name}: ${r.featureCount} features → /public/geojson/${r.fileName}`);
    });
    
  } catch (error) {
    console.error("Conversion failed:", error);
    process.exit(1);
  }
}

main();
