export type Layer = 'bloom' | 'anomaly';

export interface TimeseriesData {
  lat: number;
  lon: number;
  data: Array<{
    date: string;
    ari: number;
    ndvi: number;
    bloom_probability: number;
  }>;
}

export interface ExplainData {
  lat: number;
  lon: number;
  date: string;
  ari: number;
  delta_ari: number;
  z_score: number;
  confidence: number;
  explanation: string;
}

export interface MapConfig {
  center: [number, number];
  zoom: number;
}

