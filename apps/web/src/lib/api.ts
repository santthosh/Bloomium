import { TimeseriesData, ExplainData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchTimeseries(
  lat: number,
  lon: number,
  aoiId: string
): Promise<TimeseriesData> {
  const response = await fetch(
    `${API_URL}/timeseries?lat=${lat}&lon=${lon}&aoi_id=${aoiId}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch timeseries data');
  }
  
  return response.json();
}

export async function fetchExplanation(
  lat: number,
  lon: number,
  date: string
): Promise<ExplainData> {
  const response = await fetch(
    `${API_URL}/explain?lat=${lat}&lon=${lon}&date=${date}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch explanation');
  }
  
  return response.json();
}

export async function resolveAOI(
  name?: string,
  bbox?: [number, number, number, number]
): Promise<{ aoi_id: string }> {
  const response = await fetch(`${API_URL}/aoi/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, bbox }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to resolve AOI');
  }
  
  return response.json();
}

export function getTileUrl(
  layer: 'bloom' | 'anomaly',
  aoiId: string,
  date: string
): string {
  return `${API_URL}/tiles/${layer}/{z}/{x}/{y}.png?aoi_id=${aoiId}&date=${date}`;
}

