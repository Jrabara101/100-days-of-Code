import React, { useState } from 'react';
import { MediaItem } from '../../types/gallery';
import { Tabs } from '../ui/tabs';

interface ExifInspectorProps {
  item: MediaItem;
  activeLut: string;
  onSelectLut: (lut: string) => void;
}

export const ExifInspector: React.FC<ExifInspectorProps> = ({
  item,
  activeLut,
  onSelectLut,
}) => {
  const [activeTab, setActiveTab] = useState<'metadata' | 'palette' | 'grade'>('metadata');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(label);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const copyAllHex = () => {
    const allHex = item.dominantColors.map((c) => c.hex).join(', ');
    copyToClipboard(allHex, 'All Swatches');
  };

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4">
      <div className="space-y-4">
        {/* Inspector Tabs */}
        <Tabs
          tabs={[
            { id: 'metadata', label: 'Telemetry & EXIF' },
            { id: 'palette', label: 'Color Palette' },
            { id: 'grade', label: 'Grade & LUT' },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
        />

        {/* Tab 1: Metadata & Optics */}
        {activeTab === 'metadata' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* File Telemetry Header */}
            <div className="p-3 rounded-lg bg-surface-container space-y-1 border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="font-mono-data text-xs text-on-surface font-semibold truncate max-w-[200px]">
                  {item.title.toUpperCase().replace(/\s+/g, '_')}.{item.format}
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-mono-data text-[10px] font-semibold">
                  {item.exif.fileSize || '78.4 MB'}
                </span>
              </div>
              <div className="font-mono-data text-[10px] text-outline">
                {item.exif.resolution} • {item.exif.colorSpace} • {item.exif.bitDepth}
              </div>
            </div>

            {/* Detailed EXIF Parameter Grid */}
            <div className="space-y-1.5">
              <div className="font-mono-data text-[10px] uppercase text-outline tracking-wider px-1">
                Optics & Sensor Telemetry
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono-data text-xs">
                <div className="p-2 rounded bg-surface-container space-y-0.5 border border-outline-variant/20">
                  <span className="text-[10px] text-outline">ISO SENSITIVITY</span>
                  <div className="text-on-surface font-semibold">{item.exif.iso || 100}</div>
                </div>
                <div className="p-2 rounded bg-surface-container space-y-0.5 border border-outline-variant/20">
                  <span className="text-[10px] text-outline">APERTURE</span>
                  <div className="text-on-surface font-semibold">{item.exif.aperture || 'ƒ/2.8'}</div>
                </div>
                <div className="p-2 rounded bg-surface-container space-y-0.5 border border-outline-variant/20">
                  <span className="text-[10px] text-outline">EXPOSURE TIME</span>
                  <div className="text-on-surface font-semibold">{item.exif.shutter || '1/500s'}</div>
                </div>
                <div className="p-2 rounded bg-surface-container space-y-0.5 border border-outline-variant/20">
                  <span className="text-[10px] text-outline">FOCAL LENGTH</span>
                  <div className="text-on-surface font-semibold">{item.exif.focalLength || '50mm'}</div>
                </div>
                <div className="p-2 rounded bg-surface-container col-span-2 space-y-0.5 border border-outline-variant/20">
                  <span className="text-[10px] text-outline">CAMERA BODY</span>
                  <div className="text-on-surface font-semibold truncate">
                    {item.exif.camera || 'High-Resolution Sensor'}
                  </div>
                </div>
                <div className="p-2 rounded bg-surface-container col-span-2 space-y-0.5 border border-outline-variant/20">
                  <span className="text-[10px] text-outline">PRIMARY OPTIC</span>
                  <div className="text-on-surface font-semibold truncate">
                    {item.exif.lens || 'Prime Master Lens'}
                  </div>
                </div>
              </div>
            </div>

            {/* Geospatial Tag */}
            {item.exif.locationName && (
              <div className="space-y-1.5 pt-1">
                <div className="font-mono-data text-[10px] uppercase text-outline tracking-wider px-1">
                  Geospatial Coordinates
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container flex items-center justify-between gap-2 border border-outline-variant/20">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-7 h-7 rounded bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                    </div>
                    <div className="space-y-0.5 truncate">
                      <div className="text-xs text-on-surface font-medium truncate">
                        {item.exif.locationName}
                      </div>
                      <div className="font-mono-data text-[10px] text-outline">
                        {item.exif.latitude}° N, {Math.abs(item.exif.longitude || 0)}° W
                      </div>
                    </div>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${item.exif.latitude},${item.exif.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-outline hover:text-primary transition-colors shrink-0"
                    title="Open in Maps"
                  >
                    <span className="material-symbols-outlined text-[18px]">explore</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Color Palette Swatches */}
        {activeTab === 'palette' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between font-mono-data text-[10px] px-1">
              <span className="uppercase text-outline tracking-wider">Dominant Color Swatches</span>
              <button
                type="button"
                onClick={copyAllHex}
                className="text-primary hover:underline font-semibold"
              >
                {copiedHex === 'All Swatches' ? '✓ Copied!' : 'Copy All HEX'}
              </button>
            </div>

            <div className="space-y-2">
              {item.dominantColors.map((color, idx) => (
                <div
                  key={idx}
                  onClick={() => copyToClipboard(color.hex, color.hex)}
                  className="group flex items-center justify-between p-2 rounded-lg bg-surface-container border border-outline-variant/20 hover:border-primary/50 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 rounded-md border border-white/10 shadow-sm shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="flex flex-col">
                      <span className="font-mono-data text-xs text-on-surface font-semibold group-hover:text-primary">
                        {color.hex}
                      </span>
                      <span className="font-mono-data text-[10px] text-outline">
                        Frequency: {color.percentage}%
                      </span>
                    </div>
                  </div>

                  <span className="font-mono-data text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedHex === color.hex ? 'Copied!' : 'Copy HEX'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Grade & LUT Studio */}
        {activeTab === 'grade' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="font-mono-data text-[10px] uppercase text-outline tracking-wider px-1">
              Photonic LUT Emulation
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'none', label: 'Neutral RAW', icon: 'exposure_zero' },
                { id: 'cyan', label: 'Cyber Cyan 01', icon: 'filter_b_and_w' },
                { id: 'noir', label: 'Leica Noir Film', icon: 'contrast' },
                { id: 'golden', label: 'Alpine Sunset', icon: 'wb_sunny' },
              ].map((lut) => (
                <button
                  key={lut.id}
                  type="button"
                  onClick={() => onSelectLut(lut.id)}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                    activeLut === lut.id
                      ? 'bg-primary/10 border-primary text-primary shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-white hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] mb-1">{lut.icon}</span>
                  <span className="text-xs font-medium">{lut.label}</span>
                </button>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-surface-container space-y-2 border border-outline-variant/30">
              <div className="text-[11px] text-outline">Active Grade Pipeline:</div>
              <div className="font-mono-data text-xs text-primary font-semibold">
                LUT_{activeLut.toUpperCase()}_v2.CUBE (16-bit Float)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
