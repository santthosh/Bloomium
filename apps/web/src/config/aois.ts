export interface AOIConfig {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
  bbox: [number, number, number, number]; // [west, south, east, north]
}

export const AVAILABLE_AOIS: AOIConfig[] = [
  {
    id: 'california-central-valley',
    name: 'California Central Valley',
    center: [38.4, -121.25],
    zoom: 10,
    bbox: [-121.5, 38.2, -121.0, 38.6],
  },
  {
    id: 'japan-agricultural',
    name: 'Japan Agricultural Regions',
    center: [35.75, 139.75],
    zoom: 9,
    bbox: [139.5, 35.5, 140.0, 36.0],
  },
  {
    id: 'south-africa-wine-lands',
    name: 'South Africa Wine Lands',
    center: [-33.9, 19.0],
    zoom: 10,
    bbox: [18.8, -34.1, 19.2, -33.7],
  },
];

export function getAOIConfig(aoiId: string): AOIConfig | undefined {
  return AVAILABLE_AOIS.find((aoi) => aoi.id === aoiId);
}

