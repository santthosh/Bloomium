import { Layer } from '@/types';

interface SidebarProps {
  selectedLayer: Layer;
  onLayerChange: (layer: Layer) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  aoiId: string;
}

const AVAILABLE_DATES = [
  '2025-08-01',
  '2025-08-08',
  '2025-08-15',
  '2025-08-22',
  '2025-09-01',
  '2025-09-08',
];

export default function Sidebar({
  selectedLayer,
  onLayerChange,
  selectedDate,
  onDateChange,
  aoiId,
}: SidebarProps) {
  return (
    <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Layer Selection */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Layer</h2>
          <div className="space-y-2">
            <button
              onClick={() => onLayerChange('bloom')}
              className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                selectedLayer === 'bloom'
                  ? 'bg-bloom-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">Bloom Probability</div>
              <div className="text-sm opacity-90">
                {selectedLayer === 'bloom' ? 'Active' : 'Show bloom patterns'}
              </div>
            </button>
            
            <button
              onClick={() => onLayerChange('anomaly')}
              className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                selectedLayer === 'anomaly'
                  ? 'bg-bloom-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">Anomaly (Z-Score)</div>
              <div className="text-sm opacity-90">
                {selectedLayer === 'anomaly' ? 'Active' : 'Show anomalies'}
              </div>
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Date</h2>
          <select
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bloom-500 focus:border-bloom-500"
          >
            {AVAILABLE_DATES.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </option>
            ))}
          </select>
        </div>

        {/* AOI Info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Area of Interest</h2>
          <div className="px-4 py-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">AOI ID</div>
            <div className="font-mono text-sm text-gray-900">{aoiId}</div>
          </div>
        </div>

        {/* Legend */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Legend</h2>
          {selectedLayer === 'bloom' ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-700">Low probability</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-700">Moderate</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">High probability</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-700">Below normal</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-gray-300 rounded"></div>
                <span className="text-sm text-gray-700">Normal</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-700">Above normal</span>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed">
            Click anywhere on the map to view time series data and explanations for that location.
          </p>
        </div>
      </div>
    </aside>
  );
}

