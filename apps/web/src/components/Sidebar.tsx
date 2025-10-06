import { Layer } from '@/types';
import { AVAILABLE_AOIS } from '@/config/aois';

interface SidebarProps {
  selectedLayer: Layer;
  onLayerChange: (layer: Layer) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  aoiId: string;
  onAoiChange: (aoiId: string) => void;
  availableDates: string[];
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  selectedLayer,
  onLayerChange,
  selectedDate,
  onDateChange,
  aoiId,
  onAoiChange,
  availableDates,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const handleLayerChange = (layer: Layer) => {
    onLayerChange(layer);
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleDateChange = (date: string) => {
    onDateChange(date);
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleAoiChange = (newAoiId: string) => {
    onAoiChange(newAoiId);
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <aside
      className={`
        fixed lg:relative
        w-80 h-full
        bg-gradient-to-b from-white to-sky-blue-50 
        border-r border-sky-blue-200 
        overflow-y-auto shadow-inner
        transition-transform duration-300 ease-in-out
        z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* AOI Selection */}
        <div>
          <h2 className="text-base font-semibold text-space-navy mb-3">
            Area of Interest
          </h2>
          <div className="space-y-2">
            {AVAILABLE_AOIS.map((aoi) => (
              <button
                key={aoi.id}
                onClick={() => handleAoiChange(aoi.id)}
                className={`w-full px-4 py-3 rounded-xl text-left transition-all transform hover:scale-[1.02] ${
                  aoiId === aoi.id
                    ? 'bg-gradient-to-r from-leaf-green to-leaf-green-600 text-white shadow-lg'
                    : 'bg-white text-space-navy hover:bg-leaf-green-50 border border-leaf-green-200'
                }`}
              >
                <div className="text-sm font-medium">🌍 {aoi.name}</div>
                <div className="text-xs opacity-90 font-mono">
                  {aoiId === aoi.id ? 'Active' : aoi.id}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div className="pt-4 border-t border-sky-blue-200">
          <h2 className="text-base font-semibold text-space-navy mb-3">
            Date
          </h2>
          <div className="space-y-3">
            {/* Selected Date Display */}
            <div className="bg-white border-2 border-leaf-green-200 rounded-xl px-4 py-3 text-center">
              <div className="text-xs text-space-navy-600 font-medium">Selected Date</div>
              <div className="text-sm font-bold text-space-navy mt-1">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={availableDates.length - 1}
                value={availableDates.indexOf(selectedDate)}
                onChange={(e) => handleDateChange(availableDates[parseInt(e.target.value)])}
                className="w-full h-2 bg-leaf-green-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${(availableDates.indexOf(selectedDate) / (availableDates.length - 1)) * 100}%, #A5D6A7 ${(availableDates.indexOf(selectedDate) / (availableDates.length - 1)) * 100}%, #A5D6A7 100%)`
                }}
              />
              <div className="flex justify-between text-[10px] text-space-navy-600">
                <span>{new Date(availableDates[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(availableDates[availableDates.length - 1]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const currentIndex = availableDates.indexOf(selectedDate);
                  if (currentIndex > 0) {
                    handleDateChange(availableDates[currentIndex - 1]);
                  }
                }}
                disabled={availableDates.indexOf(selectedDate) === 0}
                className="flex-1 px-3 py-2 bg-white border border-leaf-green-200 rounded-lg text-xs font-medium text-space-navy hover:bg-leaf-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={() => {
                  const currentIndex = availableDates.indexOf(selectedDate);
                  if (currentIndex < availableDates.length - 1) {
                    handleDateChange(availableDates[currentIndex + 1]);
                  }
                }}
                disabled={availableDates.indexOf(selectedDate) === availableDates.length - 1}
                className="flex-1 px-3 py-2 bg-white border border-leaf-green-200 rounded-lg text-xs font-medium text-space-navy hover:bg-leaf-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Layer Selection */}
        <div className="pt-4 border-t border-sky-blue-200">
          <h2 className="text-base font-semibold text-space-navy mb-3">
            Layer
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => handleLayerChange('bloom')}
              className={`w-full px-4 py-3 rounded-xl text-left transition-all transform hover:scale-[1.02] ${
                selectedLayer === 'bloom'
                  ? 'bg-gradient-to-r from-petal-pink to-petal-pink-400 text-white shadow-lg'
                  : 'bg-white text-space-navy hover:bg-petal-pink-50 border border-petal-pink-200'
              }`}
            >
              <div className="text-sm font-medium">🌸 Bloom Probability</div>
              <div className="text-xs opacity-90">
                {selectedLayer === 'bloom' ? 'Active' : 'Show bloom patterns'}
              </div>
            </button>
            
            <button
              onClick={() => handleLayerChange('anomaly')}
              className={`w-full px-4 py-3 rounded-xl text-left transition-all transform hover:scale-[1.02] ${
                selectedLayer === 'anomaly'
                  ? 'bg-gradient-to-r from-sky-blue to-sky-blue-600 text-white shadow-lg'
                  : 'bg-white text-space-navy hover:bg-sky-blue-50 border border-sky-blue-200'
              }`}
            >
              <div className="text-sm font-medium">📊 Anomaly (Z-Score)</div>
              <div className="text-xs opacity-90">
                {selectedLayer === 'anomaly' ? 'Active' : 'Show anomalies'}
              </div>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-sky-blue-200">
          <h2 className="text-base font-semibold text-space-navy mb-3">
            Legend
          </h2>
          {selectedLayer === 'bloom' ? (
            <div className="space-y-2 bg-white p-3 rounded-xl border border-petal-pink-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-sky-blue rounded"></div>
                <span className="text-xs text-space-navy font-medium">Low probability</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-leaf-green rounded"></div>
                <span className="text-xs text-space-navy font-medium">Moderate</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-petal-pink rounded"></div>
                <span className="text-xs text-space-navy font-medium">High probability</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 bg-white p-3 rounded-xl border border-sky-blue-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-space-navy-700 rounded"></div>
                <span className="text-xs text-space-navy font-medium">Below normal</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-gray-300 rounded"></div>
                <span className="text-xs text-space-navy font-medium">Normal</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-4 bg-petal-pink rounded"></div>
                <span className="text-xs text-space-navy font-medium">Above normal</span>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-4 border-t border-sky-blue-200">
          <p className="text-[10px] text-space-navy-700 leading-relaxed bg-leaf-green-50 p-3 rounded-lg border-l-4 border-leaf-green">
            💡 <strong>Tip:</strong> Click anywhere on the map to view time series data and explanations for that location.
          </p>
        </div>
      </div>
    </aside>
  );
}

