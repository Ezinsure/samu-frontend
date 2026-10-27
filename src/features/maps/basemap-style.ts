import type { StyleSpecification } from "maplibre-gl";

/**
 * Raster basemap. Vector free-tile CDNs have been unreliable here
 * (Carto vector 500s; OpenFreeMap planet tiles return empty bodies),
 * so we use OSM raster tiles that MapLibre composites cleanly.
 * Always light — dark raster basemaps read as a blank black panel.
 */
const OSM_STYLE: StyleSpecification = {
  version: 8,
  // Required for symbol layers (cluster counts). Noto Sans ships with demotiles.
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#e8eef3" },
    },
    {
      id: "osm-basemap",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

/** Stable style reference — a new object every render makes MapLibre reload forever (black canvas). */
export function basemapStyle(_dark?: boolean): StyleSpecification {
  return OSM_STYLE;
}
