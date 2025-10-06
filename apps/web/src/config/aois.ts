export interface AOIConfig {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
}

export const AVAILABLE_AOIS: AOIConfig[] = [
  {
    id: 'california-central-valley',
    name: 'California Central Valley',
    center: [38.4, -121.25],
    zoom: 10,
  },
  {
    id: 'japan-agricultural',
    name: 'Japan Agricultural Regions',
    center: [35.75, 139.75],
    zoom: 9,
  },
  {
    id: 'south-africa-wine-lands',
    name: 'South Africa Wine Lands',
    center: [-33.75, 19.25],
    zoom: 9,
  },
];

export function getAOIConfig(aoiId: string): AOIConfig | undefined {
  return AVAILABLE_AOIS.find((aoi) => aoi.id === aoiId);
}

