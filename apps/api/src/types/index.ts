import { z } from 'zod';

// AOI Schema
export const AOISchema = z.object({
  aoi_id: z.string(),
  name: z.string().optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  dates: z.array(z.string()),
});

export type AOI = z.infer<typeof AOISchema>;

// Request Schemas
export const AOIResolveRequestSchema = z.object({
  name: z.string().optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
});

export const TimeseriesQuerySchema = z.object({
  lat: z.string().transform(Number),
  lon: z.string().transform(Number),
  aoi_id: z.string(),
});

export const ExplainQuerySchema = z.object({
  lat: z.string().transform(Number),
  lon: z.string().transform(Number),
  date: z.string(),
});

// Response Types
export interface TimeseriesResponse {
  lat: number;
  lon: number;
  data: Array<{
    date: string;
    ari: number;
    ndvi: number;
    bloom_probability: number;
  }>;
}

export interface ExplainResponse {
  lat: number;
  lon: number;
  date: string;
  ari: number;
  delta_ari: number;
  z_score: number;
  confidence: number;
  explanation: string;
}

export interface MetaData {
  aoi_id: string;
  date: string;
  bbox: [number, number, number, number];
  tile_count: number;
  generated_at: string;
}

