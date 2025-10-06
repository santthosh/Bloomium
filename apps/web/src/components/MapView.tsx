'use client';

import { MapContainer, TileLayer, useMapEvents, useMap, Rectangle } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { Layer } from '@/types';
import { getTileUrl } from '@/lib/api';
import { getAOIConfig } from '@/config/aois';
import PixelPopup from './PixelPopup';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  layer: Layer;
  date: string;
  aoiId: string;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ aoiId }: { aoiId: string }) {
  const map = useMap();
  
  useEffect(() => {
    const aoiConfig = getAOIConfig(aoiId);
    if (aoiConfig) {
      map.setView(aoiConfig.center, aoiConfig.zoom);
    }
  }, [aoiId, map]);
  
  return null;
}

export default function MapView({ layer, date, aoiId }: MapViewProps) {
  const [clickedPosition, setClickedPosition] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const handleMapClick = (lat: number, lon: number) => {
    setClickedPosition({ lat, lon });
  };

  const tileUrl = getTileUrl(layer, aoiId, date);
  const aoiConfig = getAOIConfig(aoiId) || { center: [38.4, -121.25] as [number, number], zoom: 10 };

  return (
    <>
      <MapContainer
        center={aoiConfig.center}
        zoom={aoiConfig.zoom}
        className="h-full w-full relative z-0"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <TileLayer
          url={tileUrl}
          opacity={0.7}
          key={`${layer}-${date}-${aoiId}`}
        />

        <Rectangle
          bounds={[
            [aoiConfig.bbox[1], aoiConfig.bbox[0]], // [south, west]
            [aoiConfig.bbox[3], aoiConfig.bbox[2]]  // [north, east]
          ]}
          pathOptions={{ 
            color: '#FFD700', 
            weight: 3, 
            fillOpacity: 0,
            dashArray: '10, 5'
          }}
        />

        <MapClickHandler onMapClick={handleMapClick} />
        <MapUpdater aoiId={aoiId} />
      </MapContainer>

      {clickedPosition && (
        <PixelPopup
          lat={clickedPosition.lat}
          lon={clickedPosition.lon}
          date={date}
          aoiId={aoiId}
          onClose={() => setClickedPosition(null)}
        />
      )}
    </>
  );
}

