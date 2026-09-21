import React, { useState } from 'react';
import { usePixelStore } from '../../store/usePixelStore';
import { PALETTE_PRESETS } from '../../lib/palettes';
import { 
  calculateLuminance, 
  calculateHue, 
  calculateSaturation, 
  generateColorRamp,
  hexToRgb,
  rgbToHex 
} from '../../lib/utils';
import { ColorPickerPopover } from '../ui/ColorPickerPopover';
import { 
  Pipette, 
  Palette, 
  Contrast, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Check, 
  SlidersHorizontal,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

export const PalettesView: React.FC = () => {
  const {
    palette,
    activePaletteName,
    loadPalettePreset,
    primaryColor,
    setPrimaryColor,
    addColorToPalette,
    removeColorFromPalette,
    sortPalette,
    purgeUnusedColors,
  } = usePixelStore();

  const [activeSort, setActiveSort] = useState<'luminance' | 'hue' | 'saturation'>('luminance');
  const [hueShiftDegrees, setHueShiftDegrees] = useState(0);

  const selectedRgb = hexToRgb(primaryColor) || { r: 208, g: 188, b: 255 };
  const luminance = calculateLuminance(primaryColor);
  const hue = calculateHue(primaryColor);
  const saturation = calculateSaturation(primaryColor);
  const ramp = generateColorRamp(primaryColor, 5);

  const handleSort = (criteria: 'luminance' | 'hue' | 'saturation') => {
    setActiveSort(criteria);
    sortPalette(criteria);
  };

  const applyHueShift = (deg: number) => {
    setHueShiftDegrees(deg);
    // Calculate shifted hex
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const r = selectedRgb.r;
    const g = selectedRgb.g;
    const b = selectedRgb.b;

    const newR = Math.max(0, Math.min(255, r * (cos + (1.0 - cos) / 3.0) + g * (1.0 / 3.0 * (1.0 - cos) - Math.sqrt(1.0 / 3.0) * sin) + b * (1.0 / 3.0 * (1.0 - cos) + Math.sqrt(1.0 / 3.0) * sin)));
    const newG = Math.max(0, Math.min(255, r * (1.0 / 3.0 * (1.0 - cos) + Math.sqrt(1.0 / 3.0) * sin) + g * (cos + 1.0 / 3.0 * (1.0 - cos)) + b * (1.0 / 3.0 * (1.0 - cos) - Math.sqrt(1.0 / 3.0) * sin)));
    const newB = Math.max(0, Math.min(255, r * (1.0 / 3.0 * (1.0 - cos) - Math.sqrt(1.0 / 3.0) * sin) + g * (1.0 / 3.0 * (1.0 - cos) + Math.sqrt(1.0 / 3.0) * sin) + b * (cos + 1.0 / 3.0 * (1.0 - cos))));

    const shiftedHex = rgbToHex(newR, newG, newB);
    setPrimaryColor(shiftedHex);
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background text-on-surface select-none">
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Left Sidebar: Quick Tools */}
        <aside className="w-14 bg-surface-panel flex flex-col items-center py-4 gap-3 border-r border-border-subtle shrink-0">
          <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary" title="Palettes Hub">
            <Palette className="w-5 h-5" />
          </div>
          <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-text-muted" title="Contrast Ratios">
            <Contrast className="w-5 h-5" />
          </div>
          <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-text-muted" title="Ramp Generator">
            <Sparkles className="w-5 h-5" />
          </div>
        </aside>

        {/* Main Workspace Center */}
        <main className="flex-1 flex flex-col bg-bg-canvas overflow-y-auto">
          {/* Presets & Controls Header */}
          <div className="px-6 py-4 bg-surface-panel/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Active Preset</div>
                <div className="text-base font-semibold text-text-main flex items-center gap-1.5">
                  {activePaletteName}
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                </div>
              </div>

              {/* Preset Selector */}
              <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-lg border border-border-subtle">
                <select
                  value={activePaletteName}
                  onChange={(e) => loadPalettePreset(e.target.value)}
                  className="bg-transparent text-on-surface text-xs font-mono outline-none cursor-pointer"
                >
                  {Object.keys(PALETTE_PRESETS).map((pName) => (
                    <option key={pName} value={pName} className="bg-surface-panel text-on-surface">
                      {pName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sorting & Action Buttons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-surface-container rounded-lg p-1 border border-border-subtle text-xs">
                <span className="text-text-muted px-2 font-mono text-[10px] uppercase">Sort:</span>
                {(['luminance', 'hue', 'saturation'] as const).map((criteria) => (
                  <button
                    key={criteria}
                    onClick={() => handleSort(criteria)}
                    className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                      activeSort === criteria
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {criteria}
                  </button>
                ))}
              </div>

              {/* Add Color */}
              <ColorPickerPopover 
                color={primaryColor} 
                onChange={setPrimaryColor} 
                onAddColorToPalette={addColorToPalette}
              >
                <button className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-3 py-1.5 rounded-lg text-xs font-mono text-on-surface border border-border-subtle transition-colors">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>Add Color</span>
                </button>
              </ColorPickerPopover>

              {/* Purge Unused */}
              <button
                onClick={purgeUnusedColors}
                className="flex items-center gap-1.5 bg-error/10 hover:bg-error/20 text-error px-3 py-1.5 rounded-lg text-xs font-mono border border-error/30 transition-colors"
                title="Remove colors from palette that are not used in any frames"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Unused</span>
              </button>
            </div>
          </div>

          {/* Swatches Grid */}
          <div className="p-6 flex-1 max-w-6xl w-full mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {palette.map((color, idx) => {
                const isSelected = color.toUpperCase() === primaryColor.toUpperCase();
                return (
                  <div
                    key={idx}
                    onClick={() => setPrimaryColor(color)}
                    className={`group relative bg-surface-panel rounded-xl p-2.5 border transition-all cursor-pointer flex flex-col gap-2 shadow-sm ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary scale-102 z-10'
                        : 'border-border-subtle hover:border-primary/50'
                    }`}
                  >
                    <div
                      className="w-full h-14 rounded-lg border border-white/10 relative overflow-hidden flex items-center justify-center shadow-inner"
                      style={{ backgroundColor: color }}
                    >
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-surface-panel/80 backdrop-blur flex items-center justify-center text-primary shadow">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-on-surface">{color.toUpperCase()}</span>
                      <span className="text-[10px] font-mono text-text-muted">
                        Lum: {Math.round(calculateLuminance(color))}
                      </span>
                    </div>

                    {/* Delete Color on Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeColorFromPalette(color);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 rounded bg-surface-panel/90 text-error opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error hover:text-white"
                      title="Remove from palette"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Right Inspector Dock */}
        <aside className="w-80 bg-surface-panel flex flex-col border-l border-border-subtle shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-border-subtle flex items-center justify-between">
            <span className="text-xs font-semibold text-text-main flex items-center gap-1.5 uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Palette Inspector
            </span>
            <span className="font-mono text-text-muted text-xs">{palette.length} Colors</span>
          </div>

          <div className="p-4 flex flex-col gap-5">
            {/* Selected Color Breakdown */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono text-text-muted uppercase">Active Target Color</span>
              <div className="flex items-center gap-3 bg-surface p-2.5 rounded-xl border border-border-subtle">
                <div
                  className="w-14 h-14 rounded-lg border border-white/20 shadow-md shrink-0"
                  style={{ backgroundColor: primaryColor }}
                />
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-bold text-primary">{primaryColor.toUpperCase()}</span>
                  <span className="text-xs text-text-muted font-mono">
                    R: {selectedRgb.r} G: {selectedRgb.g} B: {selectedRgb.b}
                  </span>
                  <span className="text-[11px] text-text-muted font-mono mt-0.5">
                    Hue: {Math.round(hue)}° | Sat: {Math.round(saturation * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Tint & Shade Ramp */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-muted uppercase">Harmonic Ramp</span>
                <button
                  onClick={() => {
                    ramp.forEach((c) => addColorToPalette(c));
                  }}
                  className="text-[11px] font-mono text-secondary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add All to Palette
                </button>
              </div>

              <div className="grid grid-cols-5 gap-1.5 bg-surface p-2 rounded-xl border border-border-subtle">
                {ramp.map((rampColor, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPrimaryColor(rampColor)}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div
                      className="w-full h-10 rounded-lg border border-white/10 group-hover:scale-105 transition-transform shadow-sm"
                      style={{ backgroundColor: rampColor }}
                      title={rampColor}
                    />
                    <span className="text-[9px] font-mono text-text-muted">
                      {idx === 2 ? 'Base' : `${(idx - 2) * 25}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hue Shifter Slider */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-muted uppercase">Hue Rotator</span>
                <span className="font-mono text-xs text-primary font-bold">{hueShiftDegrees}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={hueShiftDegrees}
                onChange={(e) => applyHueShift(parseInt(e.target.value, 10))}
                className="w-full accent-primary h-1.5 bg-surface rounded cursor-pointer"
              />
              <button
                onClick={() => applyHueShift(0)}
                className="text-[11px] font-mono text-text-muted hover:text-on-surface self-end transition-colors"
              >
                Reset Shift
              </button>
            </div>

            {/* Contrast Ratio Check */}
            <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1.5">
              <span className="text-[10px] font-mono text-text-muted uppercase block">Readability vs Canvas Dark</span>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-on-surface-variant">Relative Luminance:</span>
                <span className="text-primary font-bold">{luminance.toFixed(1)} / 255</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-on-surface-variant">Contrast Rating:</span>
                <span className={luminance > 80 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {luminance > 80 ? 'High (Crisp)' : 'Subtle (Shadow)'}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
