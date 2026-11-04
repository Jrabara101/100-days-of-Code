import React, { useState } from 'react';
import { 
  MapPin, 
  Eye, 
  ZoomIn, 
  ShieldCheck, 
  AlertCircle, 
  Layers, 
  Info, 
  Check, 
  Image as ImageIcon 
} from 'lucide-react';
import { MediaItem, ConditionPin } from '../types/auction';

interface ConditionPinboardGalleryProps {
  mediaGallery: MediaItem[];
  conditionPins: ConditionPin[];
  lotTitle: string;
}

export const ConditionPinboardGallery: React.FC<ConditionPinboardGalleryProps> = ({
  mediaGallery,
  conditionPins,
  lotTitle,
}) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [showPins, setShowPins] = useState(true);
  const [selectedPin, setSelectedPin] = useState<ConditionPin | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'exterior' | 'interior' | 'movement' | 'provenance'>('all');

  const currentMedia = mediaGallery[activeMediaIndex] || mediaGallery[0];

  // Filter media by tab
  const filteredMedia = mediaGallery.filter(item => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const getCategoryColor = (category: ConditionPin['category']) => {
    switch (category) {
      case 'blemish':
        return 'bg-amber-500 text-black border-amber-300 shadow-amber-500/40';
      case 'restoration':
        return 'bg-blue-500 text-white border-blue-300 shadow-blue-500/40';
      case 'serial':
        return 'bg-purple-500 text-white border-purple-300 shadow-purple-500/40';
      case 'patina':
        return 'bg-emerald-500 text-white border-emerald-300 shadow-emerald-500/40';
      case 'mint_detail':
        return 'bg-emerald-600 text-white border-emerald-300 shadow-emerald-600/40';
      default:
        return 'bg-neutral-800 text-white border-neutral-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs & Pin Toggle Sub-bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E3DC] dark:border-[#252934] pb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-[#646870] dark:text-[#8E96A8] hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
            }`}
          >
            All Media ({mediaGallery.length})
          </button>
          <button
            onClick={() => setActiveTab('exterior')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeTab === 'exterior'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-[#646870] dark:text-[#8E96A8] hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
            }`}
          >
            Exterior
          </button>
          <button
            onClick={() => setActiveTab('interior')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeTab === 'interior'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-[#646870] dark:text-[#8E96A8] hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
            }`}
          >
            Interior
          </button>
          <button
            onClick={() => setActiveTab('movement')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeTab === 'movement'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-[#646870] dark:text-[#8E96A8] hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
            }`}
          >
            Movement / Engine
          </button>
          <button
            onClick={() => setActiveTab('provenance')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeTab === 'provenance'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-[#646870] dark:text-[#8E96A8] hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
            }`}
          >
            Docs & Certs
          </button>
        </div>

        {/* Pinboard Overlay Toggle */}
        <button
          onClick={() => setShowPins(!showPins)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-all ${
            showPins
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-[#646870] dark:text-[#8E96A8]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{showPins ? `Pins Visible (${conditionPins.length})` : 'Show Pins'}</span>
        </button>
      </div>

      {/* Main Hero Viewport with Interactive Hotspot Pins */}
      <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-neutral-900 border border-[#E5E3DC] dark:border-[#252934] shadow-md group">
        <img
          src={currentMedia.url}
          alt={currentMedia.caption || lotTitle}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
        />

        {/* Caption Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between">
          <p className="text-white text-xs font-medium max-w-md drop-shadow-md">
            {currentMedia.caption}
          </p>
          <div className="flex items-center gap-2 text-white/80 font-mono text-[11px] bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{activeMediaIndex + 1} / {mediaGallery.length}</span>
          </div>
        </div>

        {/* Condition Pins Overlay (Rendered when on hero or items with pins) */}
        {showPins && (currentMedia.hasConditionPins || activeMediaIndex === 0) && (
          <div className="absolute inset-0 pointer-events-none">
            {conditionPins.map((pin, idx) => {
              const isSelected = selectedPin?.id === pin.id;
              return (
                <div
                  key={pin.id}
                  style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                >
                  <button
                    onClick={() => setSelectedPin(isSelected ? null : pin)}
                    className={`relative flex items-center justify-center w-7 h-7 rounded-full border-2 text-xs font-bold font-mono transition-transform hover:scale-125 shadow-lg cursor-pointer ${getCategoryColor(
                      pin.category
                    )} ${isSelected ? 'scale-125 ring-4 ring-white/50' : 'animate-bounce'}`}
                    title={pin.label}
                  >
                    <span>{idx + 1}</span>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white border border-black/40" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Zoomed Disclosure Inspection Card Modal Overlay */}
        {selectedPin && (
          <div className="absolute top-4 right-4 max-w-xs sm:max-w-sm bg-[#FFFFFF] dark:bg-[#181B23] border border-amber-500/40 dark:border-amber-500/30 rounded-xl p-4 shadow-2xl z-20 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-mono font-bold text-xs flex items-center justify-center">
                  !
                </span>
                <span className="font-semibold text-xs text-[#111315] dark:text-[#F8FAFC]">
                  {selectedPin.label}
                </span>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-neutral-400 hover:text-neutral-200 text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#646870] dark:text-[#8E96A8] leading-relaxed mb-3">
              {selectedPin.description}
            </p>

            {selectedPin.inspectorNote && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                <div>
                  <span className="font-bold block">Specialist Audit Note:</span>
                  <span>{selectedPin.inspectorNote}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thumbnails Quadrant */}
      <div className="grid grid-cols-5 gap-2.5">
        {mediaGallery.map((item, index) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveMediaIndex(index);
              setSelectedPin(null);
            }}
            className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all relative group cursor-pointer ${
              activeMediaIndex === index
                ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'border-transparent hover:border-neutral-400 dark:hover:border-neutral-600 opacity-80 hover:opacity-100'
            }`}
          >
            <img
              src={item.thumbnailUrl || item.url}
              alt={item.caption}
              className="w-full h-full object-cover"
            />
            {item.hasConditionPins && (
              <div className="absolute top-1 right-1 px-1 py-0.5 rounded bg-amber-500 text-black font-mono text-[9px] font-bold shadow">
                PINS
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Condition Pinboard Summary Bar */}
      {conditionPins.length > 0 && (
        <div className="p-3 rounded-xl bg-[#F3F2EE] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#646870] dark:text-[#8E96A8]">
            <Info className="w-4 h-4 text-amber-500" />
            <span>
              <strong className="text-[#111315] dark:text-[#F8FAFC]">
                {conditionPins.length} Disclosed Condition Hotspots:
              </strong> Click numbered pins above to inspect micro-blemishes, serial stamps & verified restorations.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

