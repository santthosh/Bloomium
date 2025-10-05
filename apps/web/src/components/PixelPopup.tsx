'use client';

import { useEffect, useState } from 'react';
import { fetchTimeseries, fetchExplanation } from '@/lib/api';
import { TimeseriesData, ExplainData } from '@/types';

interface PixelPopupProps {
  lat: number;
  lon: number;
  date: string;
  aoiId: string;
  onClose: () => void;
}

export default function PixelPopup({
  lat,
  lon,
  date,
  aoiId,
  onClose,
}: PixelPopupProps) {
  const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null);
  const [explanation, setExplanation] = useState<ExplainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        const [tsData, explainData] = await Promise.all([
          fetchTimeseries(lat, lon, aoiId),
          fetchExplanation(lat, lon, date),
        ]);
        
        setTimeseries(tsData);
        setExplanation(explainData);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [lat, lon, date, aoiId]);

  return (
    <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-2xl overflow-hidden z-[1000]">
      <div className="bg-bloom-600 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold">Pixel Details</h3>
        <button
          onClick={onClose}
          className="text-white hover:text-bloom-100 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {loading && (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500">{error}</div>
        )}

        {!loading && !error && explanation && (
          <>
            {/* Location */}
            <div className="mb-4">
              <div className="text-sm text-gray-600">Location</div>
              <div className="font-mono text-sm">
                {lat.toFixed(4)}°, {lon.toFixed(4)}°
              </div>
            </div>

            {/* Explanation */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700 leading-relaxed">
                {explanation.explanation}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-600 font-medium">ARI</div>
                <div className="text-lg font-bold text-blue-900">
                  {explanation.ari.toFixed(3)}
                </div>
              </div>
              
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-xs text-orange-600 font-medium">ΔARI</div>
                <div className="text-lg font-bold text-orange-900">
                  {explanation.delta_ari > 0 ? '+' : ''}
                  {explanation.delta_ari.toFixed(3)}
                </div>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-xs text-purple-600 font-medium">Z-Score</div>
                <div className="text-lg font-bold text-purple-900">
                  {explanation.z_score.toFixed(2)}
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xs text-green-600 font-medium">Confidence</div>
                <div className="text-lg font-bold text-green-900">
                  {(explanation.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Time Series Chart (Simple) */}
            {timeseries && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Time Series
                </div>
                <div className="h-32 flex items-end space-x-1">
                  {timeseries.data.map((point, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-bloom-500 rounded-t"
                      style={{
                        height: `${point.bloom_probability * 100}%`,
                      }}
                      title={`${point.date}: ${(point.bloom_probability * 100).toFixed(0)}%`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>{timeseries.data[0]?.date}</span>
                  <span>{timeseries.data[timeseries.data.length - 1]?.date}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

