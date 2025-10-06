// Core types
export type BBox = [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]

export interface AOIInput {
  aoi_id: string;
  bbox: BBox;
  dates: string[];           // ISO "YYYY-MM-DD" (week centers)
  start?: string;
  end?: string;
  name?: string;
}

export interface TileCoord {
  z: number;
  x: number;
  y: number;
}

// STAC types
export interface STACItem {
  id: string;
  properties: { 
    datetime: string; 
    'eo:cloud_cover'?: number;
  };
  assets: Record<string, { 
    href: string; 
    type?: string;
  }>;
  bbox: BBox;
}

// Grid & Mask types
export interface Grid {
  width: number;
  height: number;
  lon0: number;           // origin X (in grid CRS)
  lat0: number;           // origin Y (in grid CRS)
  pxSize: number;         // units per pixel (in grid CRS)
  data: Float32Array;     // row-major
  nodata?: number;
  epsg?: number;          // EPSG code of the grid CRS
}

export interface Mask extends Omit<Grid, 'data'> { 
  data: Uint8Array;       // 1=valid, 0=masked
}

// Band set (aligned to common grid)
export interface BandSet {
  b03: Grid;              // 10m
  b05: Grid;              // 10m (resampled from 20m)
  scl: Mask;              // 10m nearest
}

// Baseline for Z-score
export interface Baseline { 
  mean: Grid; 
  std: Grid; 
}

// Metadata
export interface Meta {
  date: string;
  cloud_pct: number;
  z_levels: number[];
  baseline: { 
    type: 'same-week-median' | 'rolling'; 
    years?: number[];
  };
  thresholds: { 
    z_sig: number; 
    delta_week: number;
  };
  notes?: string;
}

// Timeseries
export interface TimeseriesPoint {
  date: string;
  ari: number;
  cired?: number;
  bloom_probability: number;
}

// Job input
export interface RunJobInput extends AOIInput { 
  force?: boolean; 
}

