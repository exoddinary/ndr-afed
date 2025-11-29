#!/usr/bin/env bash
set -euo pipefail

# Convert Basin shapefile to WGS84 GeoJSON for GEB
# Usage:
#   scripts/convert_basin_to_geojson.sh [INPUT_DIR]
# Defaults:
#   INPUT_DIR = public/Basin_GEB
#   Input shapefile basename = Basin_shp (expects .shp/.shx/.dbf/.prj)
#   Output = public/Basin_GEB/Basin_shp_wgs84.geojson

INPUT_DIR=${1:-public/Basin_GEB}
BASENAME=${BASENAME:-Basin_shp}
IN_SHP="$INPUT_DIR/$BASENAME.shp"
OUT_GEOJSON="$INPUT_DIR/${BASENAME}_wgs84.geojson"

if [[ ! -f "$IN_SHP" ]]; then
  echo "Error: shapefile not found: $IN_SHP"
  echo "Make sure $IN_SHP, $INPUT_DIR/$BASENAME.shx, $INPUT_DIR/$BASENAME.dbf, and $INPUT_DIR/$BASENAME.prj exist."
  exit 1
fi

# Use mapshaper via npx (no global install required)
# -proj wgs84 ensures output in EPSG:4326
# -o format=geojson writes GeoJSON
# -clean fixes minor geometry issues
npx --yes mapshaper "$IN_SHP" -proj wgs84 -clean -o format=geojson "$OUT_GEOJSON"

# Basic sanity check: file exists and non-empty
if [[ ! -s "$OUT_GEOJSON" ]]; then
  echo "Conversion failed: $OUT_GEOJSON not created or empty"
  exit 2
fi

echo "Done: $OUT_GEOJSON"
