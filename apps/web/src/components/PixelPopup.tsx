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
    <div className="absolute top-4 right-4 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden z-[1000] border-2 border-petal-pink-200">
      <div className="bg-gradient-to-r from-petal-pink to-sky-blue text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold text-lg">🔍 Pixel Details</h3>
        <button
          onClick={onClose}
          className="text-white hover:text-space-navy transition-colors bg-white/20 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center font-bold"
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
            <div className="mb-4 p-3 bg-sky-blue-50 rounded-xl border border-sky-blue-200">
              <div className="text-xs text-space-navy-600 font-medium">📍 Location</div>
              <div className="font-mono text-sm font-bold text-space-navy">
                {lat.toFixed(4)}°, {lon.toFixed(4)}°
              </div>
            </div>

            {/* Explanation */}
            <div className="mb-4 p-4 bg-gradient-to-br from-petal-pink-50 to-sky-blue-50 rounded-xl border-l-4 border-petal-pink">
              <div className="text-sm text-space-navy leading-relaxed">
                {explanation.explanation}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-petal-pink-50 rounded-xl border border-petal-pink-200">
                <div className="text-xs text-petal-pink-700 font-bold">ARI</div>
                <div className="text-lg font-bold text-petal-pink">
                  {explanation.ari.toFixed(3)}
                </div>
              </div>
              
              <div className="p-3 bg-leaf-green-50 rounded-xl border border-leaf-green-200">
                <div className="text-xs text-leaf-green-700 font-bold">ΔARI</div>
                <div className="text-lg font-bold text-leaf-green">
                  {explanation.delta_ari > 0 ? '+' : ''}
                  {explanation.delta_ari.toFixed(3)}
                </div>
              </div>
              
              <div className="p-3 bg-sky-blue-50 rounded-xl border border-sky-blue-200">
                <div className="text-xs text-sky-blue-700 font-bold">Z-Score</div>
                <div className="text-lg font-bold text-sky-blue">
                  {explanation.z_score.toFixed(2)}
                </div>
              </div>
              
              <div className="p-3 bg-space-navy-50 rounded-xl border border-space-navy-200">
                <div className="text-xs text-space-navy-700 font-bold">Confidence</div>
                <div className="text-lg font-bold text-space-navy">
                  {(explanation.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Time Series Chart (Simple) */}
            {timeseries && (
              <div className="mt-4 p-4 bg-gradient-to-br from-white to-sky-blue-50 rounded-xl border border-sky-blue-200">
                <div className="text-sm font-bold text-space-navy mb-2 flex items-center">
                  <span className="text-base mr-1">📈</span>
                  Time Series
                </div>
                <div className="h-32 flex items-end space-x-1 bg-white rounded-lg p-2">
                  {timeseries.data.map((point, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-petal-pink to-petal-pink-400 rounded-t hover:from-petal-pink-600 hover:to-petal-pink transition-all"
                      style={{
                        height: `${point.bloom_probability * 100}%`,
                      }}
                      title={`${point.date}: ${(point.bloom_probability * 100).toFixed(0)}%`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-space-navy-700 font-medium">
                  <span>{timeseries.data[0]?.date}</span>
                  <span className="text-petal-pink">Bloom Probability</span>
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

