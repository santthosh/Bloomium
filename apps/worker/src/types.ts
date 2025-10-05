export interface AOIInput {
  aoi_id: string;
  bbox: [number, number, number, number];
  dates: string[];
  name?: string;
}

export interface TileCoord {
  z: number;
  x: number;
  y: number;
}

export interface MetaData {
  aoi_id: string;
  date: string;
  bbox: [number, number, number, number];
  tile_count: number;
  generated_at: string;
  zoom_levels: number[];
}

export interface TimeseriesPoint {
  date: string;
  ari: number;
  ndvi: number;
  bloom_probability: number;
}

