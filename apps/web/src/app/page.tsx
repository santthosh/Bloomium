'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Layer } from '@/types';

// Dynamically import map to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
});

export default function Home() {
  const [selectedLayer, setSelectedLayer] = useState<Layer>('bloom');
  const [selectedDate, setSelectedDate] = useState<string>('2025-09-01');
  const [aoiId, setAoiId] = useState<string>('demo-aoi-1');

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedLayer={selectedLayer}
          onLayerChange={setSelectedLayer}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          aoiId={aoiId}
        />
        
        <main className="flex-1 relative">
          <MapView
            layer={selectedLayer}
            date={selectedDate}
            aoiId={aoiId}
          />
        </main>
      </div>
    </div>
  );
}

