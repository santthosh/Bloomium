'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Layer } from '@/types';
import { fetchAOIMetadata } from '@/lib/api';

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
  const [aoiId, setAoiId] = useState<string>('california-central-valley');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch AOI metadata when AOI changes
  useEffect(() => {
    async function loadAOIMetadata() {
      try {
        setLoading(true);
        const metadata = await fetchAOIMetadata(aoiId);
        setAvailableDates(metadata.dates);
        
        // Set first date as default if current date not in list
        if (metadata.dates.length > 0 && !metadata.dates.includes(selectedDate)) {
          setSelectedDate(metadata.dates[0]);
        }
      } catch (error) {
        console.error('Failed to load AOI metadata:', error);
        // Fallback to hardcoded dates
        const fallbackDates = [
          '2025-08-01',
          '2025-08-08',
          '2025-08-15',
          '2025-08-22',
          '2025-09-01',
          '2025-09-08',
        ];
        setAvailableDates(fallbackDates);
      } finally {
        setLoading(false);
      }
    }

    loadAOIMetadata();
  }, [aoiId]);

  return (
    <div className="flex flex-col h-screen">
      <Header 
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex flex-1 overflow-hidden relative">

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          selectedLayer={selectedLayer}
          onLayerChange={setSelectedLayer}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          aoiId={aoiId}
          onAoiChange={setAoiId}
          availableDates={availableDates}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
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

