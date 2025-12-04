import json

# Read the GeoJSON file
with open('exploration-blocks.geojson', 'r') as f:
    data = json.load(f)

# Extract blocks
blocks = []
for feature in data['features']:
    props = feature['properties']
    block = {
        'id': str(feature['id']),
        'name': props.get('namobj', 'Unknown'),
        'operator': props.get('oprblk', 'Unknown'),
        'status': props.get('status', 'Unknown')
    }
    blocks.append(block)

# Sort by name
blocks.sort(key=lambda x: x['name'])

# Generate TypeScript code
print("export const EXPLORATION_BLOCKS = {")
for block in blocks:
    block_id = block['id']
    print(f"  '{block_id}': {{")
    print(f"    id: '{block_id}',")
    print(f"    name: '{block['name']}',")
    print(f"    operator: '{block['operator']}',")
    print(f"    status: '{block['status']}',")
    print(f"  }},")
print("} as const;")

print(f"\n// Total blocks: {len(blocks)}")
