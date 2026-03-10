'use client';

import { useEffect, useRef, useState } from 'react';

import { blockPromotionData } from '@/data/blockPromotion';

interface ArcGISGlobeProps {
  scrollProgress: number;
  isInteractive: boolean;
  activeLayers: Set<string>;
  activeMode: 'surveillance' | 'exploration' | 'strategic';
  altitude: number;
  onMouseMove?: (coords: { lon: number; lat: number } | null) => void;
  selectedBlock: any;
  onBlockSelect: (block: any) => void;
  searchQuery?: string;
  onHoverFeature?: (feature: { x: number, y: number, attributes: any } | null) => void;
  basemap: string;
  showBasins: boolean;
  showBlocks: boolean;
  isRotating: boolean;
}

export default function ArcGISGlobe({ scrollProgress, isInteractive, activeLayers, activeMode, altitude, onMouseMove, selectedBlock, onBlockSelect, searchQuery, onHoverFeature, basemap, showBasins, showBlocks, isRotating }: ArcGISGlobeProps) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef(scrollProgress);
  const isInteractiveRef = useRef(isInteractive);
  const activeLayersRef = useRef(activeLayers);
  const selectedBlockRef = useRef(selectedBlock);
  const prevSelectedBlockRef = useRef(selectedBlock);
  const isRotatingRef = useRef(isRotating);

  useEffect(() => {
    // If selectedBlock changed from something to null, and we're interactive, return to Netherlands
    if (prevSelectedBlockRef.current && !selectedBlock && isInteractive && viewRef.current) {
      viewRef.current.goTo({
        target: { longitude: 5.2913, latitude: 52.1326, z: 1200000 },
        tilt: 45,
        heading: 0
      }, { duration: 1500, easing: "in-out-expo" });
    }
    prevSelectedBlockRef.current = selectedBlock;

    scrollRef.current = scrollProgress;
    isInteractiveRef.current = isInteractive;
    activeLayersRef.current = activeLayers;
    selectedBlockRef.current = selectedBlock;
    isRotatingRef.current = isRotating;

    // Update Selection Graphics when selectedBlock changes
    if (viewRef.current && loaded) {
      updateSelectionHighlight(selectedBlock);
    }
  }, [scrollProgress, isInteractive, activeLayers, selectedBlock, loaded, isRotating]);

  const updateSelectionHighlight = async (block: any) => {
    const layer = viewRef.current.map.findLayerById('selection_hud');
    if (!layer) return;
    layer.removeAll();

    if (block && block.details) {
      const Graphic = (await import('@arcgis/core/Graphic')).default;

      // Find the feature in the layers to get its geometry if not present
      let geometry = block.geometry;
      if (!geometry && viewRef.current) {
        const hit = await viewRef.current.hitTest({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const result = hit.results.find((r: any) => r.graphic?.attributes?.name === block.name || r.graphic?.attributes?.NAME === block.name);
        if (result) geometry = result.graphic.geometry;
      }

      if (geometry) {
        // Add a thick glowing outline graphic
        const highlightGraphic = new Graphic({
          geometry: geometry,
          symbol: {
            type: "simple-fill",
            color: [0, 255, 255, 0.1],
            outline: {
              color: [0, 255, 255, 1],
              width: 3,
              style: "solid"
            }
          } as any
        });
        layer.add(highlightGraphic);

        // Add a pulse ring if it's a point, or just the glow for polygon
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let view: any;
    let isDestroyed = false;

    const initMap = async () => {
      try {
        const Map = (await import('@arcgis/core/Map')).default;
        const SceneView = (await import('@arcgis/core/views/SceneView')).default;
        const GeoJSONLayer = (await import('@arcgis/core/layers/GeoJSONLayer')).default;
        const GraphicsLayer = (await import('@arcgis/core/layers/GraphicsLayer')).default;
        const Graphic = (await import('@arcgis/core/Graphic')).default;
        const Point = (await import('@arcgis/core/geometry/Point')).default;
        const Polyline = (await import('@arcgis/core/geometry/Polyline')).default;
        const Polygon = (await import('@arcgis/core/geometry/Polygon')).default;

        if (isDestroyed || !mapDiv.current) return;

        const map = new Map({
          basemap: basemap || 'satellite',
          ground: 'world-elevation',
        });

        view = new SceneView({
          container: mapDiv.current,
          map: map,
          alphaCompositingEnabled: true,
          qualityProfile: 'high',
          environment: {
            background: { type: 'color', color: [0, 0, 0, 0] },
            starsEnabled: true,
            atmosphereEnabled: true,
            atmosphere: { quality: "high" },
            lighting: {
              type: "sun",
              date: new Date("March 15, 2024 10:00:00 UTC"), // Earlier time for brighter morning light
              directShadowsEnabled: true,
              ambientOcclusionEnabled: true
            }
          } as any,
          camera: {
            position: { longitude: 10, latitude: 20, z: 25000000 },
            heading: 0,
            tilt: 0
          },
          ui: { components: [] }
        });

        // 1. Basins Layer
        const basinsLayer = new GeoJSONLayer({
          id: 'basins',
          url: '/Netherlands_Basins_global_evenick_2021.geojson',
          title: 'Petroleum Basins',
          visible: true,
          outFields: ["*"],
          elevationInfo: { mode: "on-the-ground" },
          renderer: {
            type: "unique-value",
            valueExpression: "if ($feature.Basin_Name == 'Central North Sea' || $feature.Basin_Name == 'Southern North Sea') { return 'Running'; } else { return 'Open Applications'; }",
            uniqueValueInfos: [
              {
                value: "Running",
                symbol: {
                  type: "simple-fill",
                  color: [234, 179, 8, 0.2],
                  outline: { color: [234, 179, 8, 0.8], width: 1.5 }
                }
              },
              {
                value: "Open Applications",
                symbol: {
                  type: "simple-fill",
                  color: [255, 0, 0, 0.25], // Stronger red fill as per image
                  outline: { color: [255, 0, 0, 1], width: 1.2 } // Solid red border as per image
                }
              }
            ]
          },
          labelingInfo: [{
            labelExpressionInfo: { expression: "$feature.Basin_Name" },
            symbol: {
              type: "text",
              color: "white",
              backgroundColor: [20, 20, 20, 0.8], // Black box background
              borderLineColor: [20, 20, 20, 0.8],
              borderLineSize: 1,
              font: { size: 10, weight: "bold", family: "Outfit, sans-serif" },
              verticalAlignment: "middle",
              horizontalAlignment: "center"
            },
            labelPlacement: "always-horizontal",
            minScale: 20000000,
            maxScale: 0
          }]
        });
        map.add(basinsLayer);

        // 1b. Global Basins Layer (Legacy USGS data for other regions)
        const globalBasinsLayer = new GeoJSONLayer({
          id: 'global-basins',
          url: '/usgs_petroleum_provinces_selected.geojson',
          title: 'Global Petroleum Basins',
          visible: true,
          outFields: ["*"],
          // Filter out basins in the North Sea / Netherlands region to avoid overlap
          definitionExpression: "NAME NOT IN ('Anglo-Dutch Basin', 'North Sea Graben', 'Northwest German Basin', 'Horda-Norwegian-Danish Basin', 'Mid-North Sea High', 'London-Brabant Platform')",
          elevationInfo: { mode: "on-the-ground" },
          renderer: {
            type: "simple",
            symbol: {
              type: "simple-fill",
              color: [255, 0, 0, 0.15],
              outline: { color: [255, 0, 0, 0.6], width: 1 }
            }
          } as any,
          labelingInfo: [{
            labelExpressionInfo: { expression: "$feature.NAME" },
            symbol: {
              type: "text",
              color: [255, 255, 255, 0.6],
              font: { size: 8, weight: "bold", family: "Outfit, sans-serif" },
              verticalAlignment: "middle",
              horizontalAlignment: "center",
              haloColor: [0, 0, 0, 0.5],
              haloSize: 1
            },
            labelPlacement: "always-horizontal",
            minScale: 50000000,
            maxScale: 20000000 // Only show when zoomed out
          }]
        });
        map.add(globalBasinsLayer);

        // 2. WFS Layers
        const createWfsLayer = async (config: any) => {
          const l = new GraphicsLayer({
            id: config.id,
            title: config.id.toUpperCase(),
            visible: activeLayersRef.current.has(config.id),
            elevationInfo: { mode: "on-the-ground" }
          });

          try {
            // Use the licences endpoint for all dummy layers, but with an explicit offset per dummy layer to spread them around
            const res = await fetch(`${window.location.origin}/api/nlog/wfs?typeName=nlog:gdw_ng_licence_utm`);
            if (res.ok) {
              const data = await res.json();
              data.features.forEach((f: any, i: number) => {
                if (!f.geometry) return;

                const blockName = f.properties.LICENCE_NAME || f.properties.name || f.properties.lbl || f.properties.NAME || f.properties.LICENCE_AREA_NAME || 'Asset';

                // Check for promotion data match
                const promoData = blockPromotionData.find(p => {
                  if (!blockName) return false;
                  const baseBlock = p.name.split(' ')[0].toLowerCase().trim();
                  const normWFS = blockName.toLowerCase().replace(/f0(\d)/g, 'f$1');
                  const words = normWFS.split(/[^a-z0-9]+/);
                  return words.includes(baseBlock);
                });

                if (!promoData) return; // Only process promoted blocks

                // Match config layer to promoData status
                const statusMap: Record<string, string> = {
                  'running': 'licences',
                  'pending award': 'pending',
                  'open applications': 'openapp'
                };
                const expectedLayer = statusMap[promoData.status.toLowerCase()] || 'licences';
                if (config.id !== expectedLayer) return;

                const fixCoords = (c: number[]) => {
                  let lon = c[0];
                  let lat = c[1];
                  if (c[0] > 10000) {
                    lon = 5.3872 + (c[0] - 155000) * 0.0000137;
                    lat = 52.1552 + (c[1] - 463000) * 0.000009;
                  }
                  // No offset for the promoted blocks, they should be in their real geographical locations
                  return [lon, lat];
                };

                let geom: any = null;
                if (f.geometry.type === "Point") {
                  const p = fixCoords(f.geometry.coordinates);
                  geom = new Point({ longitude: p[0], latitude: p[1], spatialReference: { wkid: 4326 } });
                } else if (f.geometry.type === "Polygon") {
                  geom = new Polygon({ rings: f.geometry.coordinates.map((r: any) => r.map(fixCoords)), spatialReference: { wkid: 4326 } });
                } else if (f.geometry.type === "MultiPolygon") {
                  geom = new Polygon({ rings: f.geometry.coordinates[0].map((r: any) => r.map(fixCoords)), spatialReference: { wkid: 4326 } });
                }

                if (geom) {

                  // Main polygon graphic
                  l.add(new Graphic({
                    geometry: geom,
                    symbol: {
                      type: 'simple-fill',
                      color: config.color, // Always follow legend color
                      outline: { color: promoData ? [255, 255, 255, 1] : [255, 255, 255, 0.3], width: promoData ? 2 : 0.5 }
                    } as any,
                    attributes: {
                      name: blockName,
                      type: config.id,
                      status: config.id,
                      isPromoted: !!promoData,
                      promoDetails: promoData,
                      ...f.properties
                    }
                  }));

                  // Block Label Graphic
                  if (geom.type === "polygon") {
                    l.add(new Graphic({
                      geometry: geom.centroid || geom.extent.center,
                      symbol: {
                        type: "text",
                        color: [255, 255, 255, 0.8],
                        haloColor: [0, 0, 0, 0.4],
                        haloSize: 1,
                        text: promoData.name,
                        font: { size: 8, weight: "normal", family: "Outfit, sans-serif" },
                        verticalAlignment: "middle",
                        horizontalAlignment: "center"
                      } as any
                    }));
                  }
                }
              });

              // Add manual fallback for Pending blocks not in WFS
              const pendingFallbacks = [
                { name: "F12 (Exploration)", lon: 4.6, lat: 54.55, status: "pending" },
                { name: "F14 (Exploration)", lon: 4.6, lat: 54.3, status: "pending" },
                { name: "F15c (Exploration)", lon: 4.85, lat: 54.25, status: "pending" }
              ];

              for (const fb of pendingFallbacks) {
                // Check if already added via WFS (using a simplified check)
                const items = l.graphics.toArray();
                const exists = items.some((g: any) => g.attributes && g.attributes.name && g.attributes.name.includes(fb.name.split(' ')[0]));

                if (!exists && config.id === fb.status) {
                  const promoData = blockPromotionData.find(p => p.name === fb.name);
                  if (promoData) {
                    const center = new Point({ longitude: fb.lon, latitude: fb.lat, spatialReference: { wkid: 4326 } });
                    // Create a small 0.1 degree square
                    const square = new Polygon({
                      rings: [[
                        [fb.lon - 0.05, fb.lat - 0.05],
                        [fb.lon + 0.05, fb.lat - 0.05],
                        [fb.lon + 0.05, fb.lat + 0.05],
                        [fb.lon - 0.05, fb.lat + 0.05],
                        [fb.lon - 0.05, fb.lat - 0.05]
                      ]],
                      spatialReference: { wkid: 4326 }
                    });

                    l.add(new Graphic({
                      geometry: square,
                      symbol: {
                        type: 'simple-fill',
                        color: config.color,
                        outline: { color: [255, 255, 255, 1], width: 2 }
                      } as any,
                      attributes: {
                        name: fb.name,
                        type: config.id,
                        status: config.id,
                        isPromoted: true,
                        promoDetails: promoData
                      }
                    }));

                    l.add(new Graphic({
                      geometry: center,
                      symbol: {
                        type: "text",
                        color: [255, 255, 255, 0.8],
                        haloColor: [0, 0, 0, 0.4],
                        haloSize: 1,
                        text: fb.name,
                        font: { size: 8, weight: "normal", family: "Outfit, sans-serif" },
                        verticalAlignment: "middle",
                        horizontalAlignment: "center"
                      } as any
                    }));
                  }
                }
              }
            }
          } catch (e) { console.error(e); }
          return l;
        };

        const wfsConfigs = [
          { id: 'licences', color: [234, 179, 8, 0.5], xOffset: 0, yOffset: 0, modulo: 1 },         // Yellow (Running)
          { id: 'pending', color: [134, 239, 172, 0.5], xOffset: 0.5, yOffset: 0.5, modulo: 3 },    // Light Green
          { id: 'openapp', color: [255, 0, 0, 0.5], xOffset: -0.5, yOffset: -0.5, modulo: 4 },   // Red (previously orange)
        ];

        for (const cfg of wfsConfigs) {
          const l = await createWfsLayer(cfg);
          map.add(l);
        }

        const selectionLayer = new GraphicsLayer({ id: 'selection_hud', elevationInfo: { mode: "on-the-ground" } });
        map.add(selectionLayer);

        const blockLayerIds = ['licences', 'pending', 'openapp'];

        view.on("pointer-move", async (event: any) => {
          if (onMouseMove) {
            const point = view.toMap({ x: event.x, y: event.y });
            if (point) onMouseMove({ lon: point.longitude, lat: point.latitude });
          }
          const response = await view.hitTest(event);
          const results = response.results.filter((res: any) =>
            res.graphic?.layer?.id === 'basins' || blockLayerIds.includes(res.graphic?.layer?.id)
          ).sort((a: any, b: any) => (a.graphic?.layer?.id === 'basins' ? 1 : -1));

          if (results.length > 0) {
            const g = results[0].graphic;
            onHoverFeature?.({
              x: event.x,
              y: event.y,
              attributes: {
                name: g.attributes.name || g.attributes.NAME || 'Data',
                type: g.layer.id === 'basins' ? 'Basin' : 'Exploration Block'
              }
            });
          } else {
            onHoverFeature?.(null);
          }
        });

        view.on("click", async (event: any) => {
          const response = await view.hitTest(event);
          const results = response.results.filter((res: any) =>
            res.graphic?.layer?.id === 'basins' || blockLayerIds.includes(res.graphic?.layer?.id)
          ).sort((a: any, b: any) => (a.graphic?.layer?.id === 'basins' ? 1 : -1));

          if (results.length > 0) {
            const g = results[0].graphic;
            const attr = g.attributes;
            const zoomLevel = g.layer.id === 'basins' ? 8 : 10;
            view.goTo({ target: g.geometry, zoom: zoomLevel, tilt: 45 }, { duration: 1500 });

            const isBasin = g.layer.id === 'basins';
            const isRunningBasin = isBasin && (attr.NAME === 'Anglo-Dutch Basin' || attr.NAME === 'North Sea Graben' || attr.NAME === 'Northwest German Basin');

            onBlockSelect({
              name: attr.name || attr.NAME || "Area",
              lon: event.mapPoint.longitude,
              lat: event.mapPoint.latitude,
              details: isBasin ? {
                ...attr,
                promoDetails: {
                  status: isRunningBasin ? 'Running' : 'Open Applications',
                  location: attr.NAME || 'Global Province',
                  area: 'Regional Basin',
                  waterDepth: 'Variable',
                  geologicalSetting: 'Major petroleum province under analysis.'
                }
              } : attr,
              type: isBasin ? 'Basin' : 'Exploration Block',
              geometry: g.geometry
            });
          } else {
            onBlockSelect(null);
          }
        });

        viewRef.current = view;
        setLoaded(true);

        const rotate = () => {
          if (viewRef.current && !selectedBlockRef.current && !viewRef.current.interacting && isRotatingRef.current) {
            const cam = viewRef.current.camera?.clone();
            if (cam && cam.position) {
              cam.position.longitude += 0.008;
              viewRef.current.camera = cam;
            }
          }
          requestAnimationFrame(rotate);
        };
        rotate();

      } catch (err) { console.error(err); }
    };

    initMap();
    return () => { isDestroyed = true; view?.destroy(); };
  }, []);

  useEffect(() => {
    if (!viewRef.current || !isInteractive || !loaded) return;
    const newTilt = 65 * (1 - Math.min(1, Math.max(0, (altitude - 100000) / (24000000 - 100000))));
    viewRef.current.goTo({
      target: {
        type: "point",
        longitude: viewRef.current.camera.position.longitude,
        latitude: viewRef.current.camera.position.latitude,
        z: altitude
      },
      tilt: newTilt
    }, { duration: 400, easing: "out-expo" });
  }, [altitude, isInteractive, loaded]);

  useEffect(() => {
    if (!viewRef.current || !loaded || !searchQuery) return;

    const findFeature = async () => {
      const searchTerms = searchQuery.toLowerCase().trim();
      if (!searchTerms) return;

      const layers = viewRef.current.map.layers.toArray();
      for (const layer of layers) {
        if (layer.type === "geojson" || layer.type === "graphics") {
          const graphics = layer.type === "geojson"
            ? (await layer.queryFeatures()).features
            : layer.graphics.toArray();

          const found = graphics.find((g: any) => {
            const name = (g.attributes?.name || g.attributes?.NAME || "").toLowerCase();
            return name.includes(searchTerms);
          });

          if (found) {
            viewRef.current.goTo({ target: found.geometry, zoom: 10, tilt: 45 }, { duration: 1500 });
            onBlockSelect({
              name: found.attributes.name || found.attributes.NAME || "Area",
              lon: found.geometry.extent?.center.longitude || found.geometry.longitude,
              lat: found.geometry.extent?.center.latitude || found.geometry.latitude,
              details: found.attributes,
              type: layer.id === 'basins' ? 'Basin' : 'Exploration Block',
              geometry: found.geometry
            });
            return;
          }
        }
      }
    };

    findFeature();
  }, [searchQuery, loaded, onBlockSelect]);

  useEffect(() => {
    if (!viewRef.current || !loaded) return;

    viewRef.current.map.layers.forEach((l: any) => {
      if (l.id !== 'selection_hud') {
        const blockLayerIds = ['licences', 'pending', 'openapp'];
        const isActiveLayer = blockLayerIds.includes(l.id);
        if (isActiveLayer) {
          l.visible = showBlocks && (activeLayers.has(l.id) || (!isInteractive && scrollProgress > 0.6));
        } else if (l.id === 'basins') {
          l.visible = showBasins;
          // Dynamically filter basins based on 'openapp' toggle
          if (activeLayers.has('openapp')) {
            l.definitionExpression = null; // Show all basins
          } else {
            // Only show 'Running' basins
            l.definitionExpression = "NAME IN ('Anglo-Dutch Basin', 'North Sea Graben', 'Northwest German Basin')";
          }
        }
      }
    });

    // Update Basemap if changed
    if (viewRef.current.map.basemap.id !== basemap) {
      viewRef.current.map.basemap = basemap;
    }

    if (isInteractive) return;

    const startLon = 0;
    const startLat = 10;
    const endLon = 5.2913;
    const endLat = 52.1326;

    const startAltitude = 25000000;
    const z = startAltitude + (altitude - startAltitude) * scrollProgress;

    viewRef.current.goTo({
      target: {
        longitude: startLon + (endLon - startLon) * scrollProgress + (1 - scrollProgress) * 15,
        latitude: startLat + (endLat - startLat) * scrollProgress,
        z: z
      },
      tilt: scrollProgress * 35 // Slightly less tilt for a better global view
    }, { animate: false });
  }, [scrollProgress, isInteractive, loaded, activeLayers, altitude, showBasins, showBlocks, basemap]);

  return <div ref={mapDiv} className="fixed inset-0 w-full h-full" />;
}
