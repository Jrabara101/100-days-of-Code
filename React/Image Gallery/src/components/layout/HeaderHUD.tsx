import React, { useState } from 'react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { ApertureLogo } from '../brand/ApertureLogo';
import { BackgroundVariation } from '../../types/gallery';

export const HeaderHUD: React.FC = () => {
  const searchQuery = useGalleryStore((s) => s.searchQuery);
  const setSearchQuery = useGalleryStore((s) => s.setSearchQuery);
  const bgVariation = useGalleryStore((s) => s.bgVariation);
  const setBgVariation = useGalleryStore((s) => s.setBgVariation);
  const toggleSidebar = useGalleryStore((s) => s.toggleSidebar);
  const columnCount = useGalleryStore((s) => s.columnCount);
  const setColumnCount = useGalleryStore((s) => s.setColumnCount);
  const activeRatingFilter = useGalleryStore((s) => s.activeRatingFilter);
  const setActiveRatingFilter = useGalleryStore((s) => s.setActiveRatingFilter);
  const formatFilter = useGalleryStore((s) => s.formatFilter);
  const setFormatFilter = useGalleryStore((s) => s.setFormatFilter);

  const [showBgDropdown, setShowBgDropdown] = useState(false);

  const bgLabels: Record<BackgroundVariation, { label: string; icon: string }> = {
    void: { label: 'Obsidian Void', icon: 'grid_goldenratio' },
    canvas: { label: 'HTML Canvas Matrix', icon: 'grain' },
    volumetric: { label: 'Volumetric Cyan Aura', icon: 'blur_on' },
    studio: { label: 'Studio Backdrop', icon: 'photo_camera' },
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-surface-container-lowest/90 backdrop-blur-xl flex items-center justify-between px-3 sm:px-5 border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
      {/* Left: Aperture Logo & Workspaces Breadcrumb */}
      <div className="flex items-center gap-3 min-w-max">
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container"
          title="Toggle Sidebar"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <ApertureLogo size={32} />

        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm uppercase tracking-wider text-on-surface">
            AETHER
          </span>
          <span className="h-4 w-[1px] bg-outline-variant/40 hidden sm:block" />
          <nav className="hidden xl:flex items-center gap-1.5 text-xs font-mono-data text-outline">
            <span className="hover:text-on-surface cursor-pointer">Workspaces</span>
            <span>/</span>
            <span className="hover:text-on-surface cursor-pointer">Obsidian Archive</span>
            <span>/</span>
            <span className="text-primary font-medium">Spatial Masonry</span>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-low border border-outline-variant/30">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
          <span className="font-mono-data text-[10px] text-primary-fixed-dim uppercase tracking-wider">
            GPU ACCEL • 60 FPS
          </span>
        </div>
      </div>

      {/* Center: Search & Filter Toolbar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl mx-2 sm:mx-6">
        <div className="relative flex-1">
          <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface-variant hover:border-outline-variant transition-colors focus-within:border-primary">
            <span className="material-symbols-outlined text-[18px] text-outline">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search EXIF, lens, tag, camera, place..."
              className="bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-outline hover:text-white"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-highest border border-outline-variant/20 font-mono-data text-[9px] text-outline">
              ⌘K
            </div>
          </div>
        </div>

        {/* Quick Filter Buttons (RAW, 5 Stars) */}
        <div className="hidden 2xl:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFormatFilter(formatFilter === 'ARW' ? null : 'ARW')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono-data transition-colors ${
              formatFilter === 'ARW'
                ? 'bg-primary/20 text-primary border border-primary/40 font-semibold'
                : 'bg-surface-container text-on-surface-variant hover:text-primary'
            }`}
          >
            RAW (ARW)
          </button>
          <button
            type="button"
            onClick={() => setActiveRatingFilter(activeRatingFilter === 5 ? null : 5)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono-data transition-colors ${
              activeRatingFilter === 5
                ? 'bg-primary/20 text-primary border border-primary/40 font-semibold'
                : 'bg-surface-container text-on-surface-variant hover:text-primary'
            }`}
          >
            ★ 5 Stars
          </button>
        </div>
      </div>

      {/* Right: Background Variations Switcher & Telemetry */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-max">
        {/* Background Variations Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBgDropdown(!showBgDropdown)}
            title="Switch Background Variation (Picture & HTML Canvas)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/40 hover:border-primary/50 text-xs font-mono-data text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              {bgLabels[bgVariation].icon}
            </span>
            <span className="hidden sm:inline text-[11px]">{bgLabels[bgVariation].label}</span>
            <span className="material-symbols-outlined text-[14px] text-outline">
              arrow_drop_down
            </span>
          </button>

          {showBgDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-surface-container-high border border-outline-variant/40 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[9px] font-mono-data uppercase text-outline tracking-wider">
                Stage Background Variations
              </div>
              {(['void', 'canvas', 'volumetric', 'studio'] as BackgroundVariation[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setBgVariation(v);
                    setShowBgDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${
                    bgVariation === v
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {bgLabels[v].icon}
                  </span>
                  <div className="flex flex-col">
                    <span>{bgLabels[v].label}</span>
                    <span className="text-[10px] text-outline font-mono-data">
                      {v === 'canvas'
                        ? 'React Bits interactive particle matrix'
                        : v === 'void'
                        ? 'Obsidian reticle darkroom'
                        : v === 'volumetric'
                        ? 'Volumetric photonic glow'
                        : 'Photographic studio backdrop'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Column Count Selector */}
        <div className="hidden lg:flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/30">
          {[2, 3, 4, 5].map((cols) => (
            <button
              key={cols}
              type="button"
              onClick={() => setColumnCount(cols)}
              className={`w-6 h-6 rounded flex items-center justify-center font-mono-data text-[11px] transition-colors ${
                columnCount === cols
                  ? 'bg-surface-container-highest text-primary font-bold shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
              title={`${cols} Columns`}
            >
              {cols}C
            </button>
          ))}
        </div>

        {/* Real-time Rendering Telemetry HUD */}
        <div className="hidden xl:flex items-center gap-3 px-3 py-1 rounded-lg bg-surface-container-low/60 border border-outline-variant/20 font-mono-data text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="text-outline">FPS</span>
            <span className="text-primary font-semibold">120</span>
          </div>
          <span className="h-3 w-[1px] bg-outline-variant/30" />
          <div className="flex items-center gap-1.5">
            <span className="text-outline">VRAM</span>
            <span className="text-on-surface">2.4 GB</span>
          </div>
        </div>
      </div>
    </header>
  );
};
