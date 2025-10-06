import proj4 from 'proj4';

// WGS84 (EPSG:4326) and Web Mercator (EPSG:3857)
const WGS84 = 'EPSG:4326';
const WEB_MERCATOR = 'EPSG:3857';

/**
 * Convert lon/lat to EPSG:3857 (Web Mercator) meters
 */
export function lonLatTo3857(lon: number, lat: number): { x: number; y: number } {
  const [x, y] = proj4(WGS84, WEB_MERCATOR, [lon, lat]);
  return { x, y };
}

/**
 * Convert EPSG:3857 meters to lon/lat
 */
export function mercatorToLonLat(x: number, y: number): { lon: number; lat: number } {
  const [lon, lat] = proj4(WEB_MERCATOR, WGS84, [x, y]);
  return { lon, lat };
}

/**
 * Get tile bounds in EPSG:3857 meters for XYZ tile coords
 */
export function tileBoundsXYZ(
  z: number,
  x: number,
  y: number
): { minX: number; minY: number; maxX: number; maxY: number } {
  const n = Math.pow(2, z);
  const tileSize = (20037508.34 * 2) / n; // Web Mercator world width

  const minX = -20037508.34 + x * tileSize;
  const maxX = minX + tileSize;
  const maxY = 20037508.34 - y * tileSize;
  const minY = maxY - tileSize;

  return { minX, minY, maxX, maxY };
}

/**
 * Convert lat/lon to tile coordinates at given zoom
 */
export function latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n
  );
  return { x, y };
}

/**
 * Get all tile coordinates for a bbox at given zoom
 */
export function getTilesForBBox(
  bbox: [number, number, number, number],
  zoom: number
): Array<{ z: number; x: number; y: number }> {
  const [west, south, east, north] = bbox;

  const minTile = latLonToTile(north, west, zoom);
  const maxTile = latLonToTile(south, east, zoom);

  const tiles: Array<{ z: number; x: number; y: number }> = [];

  for (let x = minTile.x; x <= maxTile.x; x++) {
    for (let y = minTile.y; y <= maxTile.y; y++) {
      tiles.push({ z: zoom, x, y });
    }
  }

  return tiles;
}

