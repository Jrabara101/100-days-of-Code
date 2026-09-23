import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import {
  FontFamilyChoice,
  DensityChoice,
  FontScaleChoice,
  LayoutPreset,
} from '../../types/resume';

const ACCENT_PALETTES = [
  { name: 'Obsidian', hex: '#0f172a', bgClass: 'bg-slate-900' },
  { name: 'Deep Indigo', hex: '#4f46e5', bgClass: 'bg-indigo-600' },
  { name: 'Emerald', hex: '#059669', bgClass: 'bg-emerald-600' },
  { name: 'Slate', hex: '#475569', bgClass: 'bg-slate-600' },
  { name: 'Bordeaux', hex: '#881337', bgClass: 'bg-rose-900' },
];

export const StyleInspectorPane: React.FC = () => {
  const {
    present,
    updateStyles,
    resetStyles,
    toggleSectionVisibility,
  } = useResumeStore();

  const { styles, sections } = present;

  const fontOptions: { name: FontFamilyChoice; subtitle: string; fontClass: string }[] = [
    { name: 'Inter', subtitle: 'Modern Neo-Grotesque', fontClass: 'font-inter font-bold' },
    { name: 'Merriweather', subtitle: 'Classic Editorial', fontClass: 'font-serif font-bold' },
    { name: 'Roboto Mono', subtitle: 'Technical Minimal', fontClass: 'font-mono text-sm' },
    { name: 'Cinzel', subtitle: 'Executive Trajan', fontClass: 'font-cinzel tracking-wider text-sm font-bold' },
  ];

  const layoutPresets: { name: LayoutPreset; icon: string }[] = [
    { name: 'Modern Split', icon: 'view_column' },
    { name: 'Minimal Single', icon: 'view_agenda' },
    { name: 'Executive Dual', icon: 'vertical_split' },
    { name: 'Technical Grid', icon: 'grid_view' },
  ];

  return (
    <aside
      aria-label="Style and Layout Inspector"
      className="w-80 min-w-[320px] max-w-[340px] bg-surface-container-low/95 backdrop-blur-xl flex flex-col h-full shrink-0 p-space-md overflow-y-auto space-y-space-lg shadow-[-2px_0_12px_rgba(0,0,0,0.5)] z-20 no-print border-l border-outline-variant/20"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/10">
        <span className="font-title text-title text-on-surface font-semibold">Inspector & Tuning</span>
        <button
          onClick={resetStyles}
          className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-container"
          title="Reset to Defaults"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
        </button>
      </div>

      {/* Typography Choice Stack */}
      <div className="space-y-space-xs">
        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-semibold">
          Document Typography
        </label>
        <div className="grid grid-cols-2 gap-space-xs">
          {fontOptions.map((opt) => (
            <button
              key={opt.name}
              type="button"
              onClick={() => updateStyles({ fontFamily: opt.name })}
              className={`p-2 rounded-lg flex flex-col items-start text-left transition-all ${
                styles.fontFamily === opt.name
                  ? 'bg-surface-container-high text-primary ring-2 ring-primary shadow-sm'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className={`font-title text-title ${opt.fontClass}`}>{opt.name}</span>
              <span className="font-code-metric text-code-metric text-on-surface-variant text-[10px]">
                {opt.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Spacing, Density & Line Height */}
      <div className="space-y-space-md bg-surface-container p-space-sm rounded-xl border border-outline-variant/10">
        {/* Line Height Range Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Line Height</label>
            <span className="font-code-metric text-code-metric text-primary font-bold">
              {styles.lineHeight.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="1.1"
            max="1.8"
            step="0.05"
            value={styles.lineHeight}
            onChange={(e) => updateStyles({ lineHeight: parseFloat(e.target.value) })}
            className="w-full accent-primary h-1.5 bg-surface-container-lowest rounded-lg cursor-pointer"
          />
        </div>

        {/* Content Density */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Content Density</label>
            <span className="font-code-metric text-code-metric text-secondary capitalize">
              {styles.density}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-surface-container-lowest p-0.5 rounded-lg">
            {(['compact', 'normal', 'relaxed'] as DensityChoice[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => updateStyles({ density: d })}
                className={`py-1 text-center font-label-sm text-label-sm rounded capitalize transition-colors ${
                  styles.density === d
                    ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Base Font Scale */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Base Font Scale</label>
            <span className="font-code-metric text-code-metric text-on-surface font-bold">
              {styles.fontSize}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-surface-container-lowest p-0.5 rounded-lg">
            {(['10pt', '11pt', '12pt'] as FontScaleChoice[]).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => updateStyles({ fontSize: size })}
                className={`py-1 text-center font-label-sm text-label-sm rounded transition-colors ${
                  styles.fontSize === size
                    ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accent Color Swatch Picker */}
      <div className="space-y-space-xs">
        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-semibold">
          Accent Palette ({styles.primaryColorName})
        </label>
        <div className="flex items-center justify-between p-space-xs bg-surface-container rounded-xl border border-outline-variant/10">
          {ACCENT_PALETTES.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => updateStyles({ primaryColor: color.hex, primaryColorName: color.name })}
              className={`w-8 h-8 rounded-full ${color.bgClass} flex items-center justify-center transition-all ${
                styles.primaryColor === color.hex
                  ? 'ring-2 ring-offset-2 ring-offset-surface ring-primary scale-110 shadow-md'
                  : 'hover:scale-105'
              }`}
              title={color.name}
            >
              {styles.primaryColor === color.hex && (
                <span className="material-symbols-outlined text-white text-[14px]">check</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Architecture Presets */}
      <div className="space-y-space-xs">
        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-semibold">
          Layout Structure
        </label>
        <div className="grid grid-cols-2 gap-space-xs">
          {layoutPresets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => updateStyles({ layoutPreset: preset.name })}
              className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                styles.layoutPreset === preset.name
                  ? 'bg-surface-container-high text-primary ring-1 ring-primary/40 font-semibold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{preset.icon}</span>
              <span className="font-label-sm text-label-sm">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section Visibility Checklist */}
      <div className="space-y-space-xs">
        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-semibold">
          Visible Sections
        </label>
        <div className="space-y-1 bg-surface-container p-space-xs rounded-xl border border-outline-variant/10">
          {sections.map((section) => (
            <label
              key={section.id}
              className="flex items-center justify-between p-1.5 rounded hover:bg-surface-container-high cursor-pointer transition-colors"
            >
              <span className="font-body-sm text-body-sm text-on-surface">{section.title}</span>
              <input
                type="checkbox"
                checked={section.isVisible}
                onChange={() => toggleSectionVisibility(section.id)}
                className="accent-primary w-4 h-4 rounded cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
};
