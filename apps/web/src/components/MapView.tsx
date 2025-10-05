'use client';

import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import { Layer } from '@/types';
import { getTileUrl } from '@/lib/api';
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

export default function MapView({ layer, date, aoiId }: MapViewProps) {
  const [clickedPosition, setClickedPosition] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const handleMapClick = (lat: number, lon: number) => {
    setClickedPosition({ lat, lon });
  };

  const tileUrl = getTileUrl(layer, aoiId, date);

  return (
    <>
      <MapContainer
        center={[38.4, -121.25]}
        zoom={9}
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

        <MapClickHandler onMapClick={handleMapClick} />
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

