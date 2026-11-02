import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../services/restaurantStore';
import { Sparkles, Camera, MapPin, Utensils, ArrowUpRight, Wine, Sun, Moon } from 'lucide-react';

export default function RelationalGalleryGrid() {
  const {
    theme,
    toggleTheme,
    galleryAssets,
    menuItems,
    diningZones,
    setDishDetailModal,
    openReservationModal
  } = useRestaurant();

  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Captures', count: galleryAssets.length },
    { id: 'culinary', label: 'Plates & Fire', count: galleryAssets.filter(g => g.category === 'culinary').length },
    { id: 'interior', label: 'Dining Rooms & Patio', count: galleryAssets.filter(g => g.category === 'interior').length },
    { id: 'cellar', label: 'The Cellar', count: galleryAssets.filter(g => g.category === 'cellar').length }
  ];

  const filteredAssets = useMemo(() => {
    return galleryAssets.filter(item => {
      // Mood matching (or 'both')
      const moodMatches = item.lighting_mood === 'both' || item.lighting_mood === theme;
      const categoryMatches = activeCategory === 'all' || item.category === activeCategory;
      return moodMatches && categoryMatches;
    });
  }, [galleryAssets, theme, activeCategory]);

  const handleHotspotClick = (asset) => {
    if (asset.linked_dish_id) {
      const dish = menuItems.find(m => m.id === asset.linked_dish_id);
      if (dish) setDishDetailModal(dish);
    } else if (asset.linked_zone_id) {
      openReservationModal(asset.linked_zone_id);
    }
  };

  return (
    <section id="gallery" className="py-20 lg:py-28 bg-[var(--bg-canvas)] border-b border-[var(--border-hairline)] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header & Ambient Control Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--accent-gold)]">
              <Camera className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>Relational Visual Archive • Dish &amp; Space Hotspots</span>
            </div>
            
            <h2 className="font-editorial text-4xl sm:text-5xl font-light text-[var(--text-primary)] tracking-tight">
              Atmospheric Chronicle
            </h2>
            
            <p className="text-base text-[var(--text-muted)] font-body font-light leading-relaxed">
              Every frame is relationally linked to our living ledger. Click any plate hotspot to inspect farm provenance and reviews, or touch an architectural sightline to book that exact atmosphere.
            </p>
          </div>

          {/* Ambience Mood Indicator */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="p-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-center">
              <button
                onClick={() => theme !== 'daylight' && toggleTheme()}
                className={`px-3 py-1 rounded-full text-xs font-mono-numbers flex items-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'daylight'
                    ? 'bg-amber-500/20 text-amber-600 font-semibold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Daylight</span>
              </button>

              <button
                onClick={() => theme !== 'candlelight' && toggleTheme()}
                className={`px-3 py-1 rounded-full text-xs font-mono-numbers flex items-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'candlelight'
                    ? 'bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] font-semibold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Candlelight</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-10 scrollbar-none">
          {categories.map(cat => {
            const isCatActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-mono-numbers uppercase tracking-wider transition-all cursor-pointer ${
                  isCatActive
                    ? 'bg-[var(--brand-primary)] text-[#FAF7F2] font-semibold shadow-sm'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`ml-2 text-[10px] ${isCatActive ? 'opacity-80' : 'opacity-50'}`}>
                  ({cat.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Asymmetrical Bento Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset, idx) => {
            const isLarge = idx === 0 || idx === 5;
            return (
              <div
                key={asset.id}
                className={`group relative rounded-2xl overflow-hidden border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-md transition-all duration-500 hover:shadow-2xl ${
                  isLarge ? 'sm:col-span-2 lg:col-span-2 sm:row-span-2 min-h-[420px]' : 'min-h-[300px]'
                }`}
              >
                <img
                  src={asset.image_url}
                  alt={asset.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Relational Hotspot Trigger Tag */}
                <div className="absolute top-4 left-4 z-10">
                  {asset.linked_dish_id && (
                    <button
                      onClick={() => handleHotspotClick(asset)}
                      className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-[var(--brand-primary)] backdrop-blur-md border border-white/20 text-white text-xs font-mono-numbers flex items-center gap-1.5 transition-all cursor-pointer shadow-lg hover:scale-105"
                    >
                      <Utensils className="w-3.5 h-3.5 text-amber-300" />
                      <span>{asset.linked_dish_title}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-75" />
                    </button>
                  )}

                  {asset.linked_zone_id && (
                    <button
                      onClick={() => handleHotspotClick(asset)}
                      className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-[var(--brand-primary)] backdrop-blur-md border border-white/20 text-white text-xs font-mono-numbers flex items-center gap-1.5 transition-all cursor-pointer shadow-lg hover:scale-105"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{asset.linked_zone_name}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-75" />
                    </button>
                  )}
                </div>

                {/* Bottom Caption Strip */}
                <div className="absolute bottom-0 inset-x-0 p-5 space-y-1.5 z-10">
                  <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[var(--accent-gold)] block">
                    {asset.category} • {asset.lighting_mood === 'candlelight' ? '🕯️ Evening Service' : '☀️ Midday Light'}
                  </span>
                  <p className="text-sm font-editorial text-white/95 leading-snug">
                    {asset.caption}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
