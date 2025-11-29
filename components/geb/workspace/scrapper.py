import json
import math
import requests

service_url = "https://datamigas.esdm.go.id/arcgis/rest/services/MDR2/well/MapServer/0/query"

# Step 1 – get all Object IDs
params_ids = {
    "f": "json",
    "where": "1=1",
    "returnIdsOnly": "true",
}
resp = requests.get(service_url, params=params_ids)
resp.raise_for_status()
object_ids = resp.json()["objectIds"]

# Step 2 – fetch features in batches
batch_size = 250
all_features = []
for i in range(0, len(object_ids), batch_size):
    batch_ids = object_ids[i:i+batch_size]
    params = {
        "f": "json",
        "objectIds": ",".join(map(str, batch_ids)),
        "returnGeometry": "true",
        "outFields": "*",
        "spatialRel": "esriSpatialRelIntersects",
    }
    r = requests.get(service_url, params=params)
    r.raise_for_status()
    data = r.json()
    all_features.extend(data["features"])
    print(f"Fetched {len(all_features)} of {len(object_ids)} features...")

# Step 3 – convert to GeoJSON format
geojson = {
    "type": "FeatureCollection",
    "features": []
}
for feat in all_features:
    attributes = feat["attributes"]
    geometry = feat["geometry"]
    # ArcGIS geometry uses x,y; convert to GeoJSON Point
    if geometry:
        coords = [geometry["x"], geometry["y"]]
    else:
        coords = None
    geojson["features"].append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": coords},
        "properties": attributes
    })

# Step 4 – write to file
with open("wells.geojson", "w", encoding="utf-8") as f:
    json.dump(geojson, f)

print("Saved wells.geojson with", len(geojson["features"]), "features.")
