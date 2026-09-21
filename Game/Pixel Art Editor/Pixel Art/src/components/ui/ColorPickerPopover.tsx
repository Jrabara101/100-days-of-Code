import React, { useState, useRef, useEffect } from 'react';
import { generateColorRamp, hexToRgb, rgbToHex } from '../../lib/utils';
import { Pipette, Check, Plus } from 'lucide-react';

interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
  onAddColorToPalette?: (color: string) => void;
  children: React.ReactNode;
}

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  color,
  onChange,
  onAddColorToPalette,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempColor(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const rgb = hexToRgb(tempColor) || { r: 208, g: 188, b: 255 };
  const ramp = generateColorRamp(tempColor, 5);

  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: number) => {
    const newRgb = { ...rgb, [channel]: Math.max(0, Math.min(255, val)) };
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setTempColor(hex);
    onChange(hex);
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {children}
      </div>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-3 z-50 w-72 bg-surface-panel border border-border-subtle rounded-xl p-4 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-3 border-b border-border-subtle pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Color Inspector</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-primary">{tempColor}</span>
              <div 
                className="w-5 h-5 rounded border border-white/20 shadow-inner" 
                style={{ backgroundColor: tempColor }} 
              />
            </div>
          </div>

          {/* Native HTML5 color input */}
          <div className="mb-3">
            <label className="text-[11px] font-mono text-text-muted mb-1 block">Pick Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={tempColor.length === 7 ? tempColor : '#D0BCFF'}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setTempColor(val);
                  onChange(val);
                }}
                className="w-10 h-8 rounded bg-surface border border-border-subtle cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={tempColor}
                onChange={(e) => {
                  const val = e.target.value;
                  setTempColor(val);
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    onChange(val.toUpperCase());
                  }
                }}
                className="flex-1 bg-surface-container px-2 py-1 rounded text-xs font-mono text-on-surface border border-border-subtle uppercase focus:outline-none focus:border-primary"
                maxLength={7}
              />
              {onAddColorToPalette && (
                <button
                  type="button"
                  onClick={() => onAddColorToPalette(tempColor)}
                  title="Add to Palette Swatches"
                  className="p-1.5 bg-surface-container hover:bg-surface-container-high rounded border border-border-subtle text-primary transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* RGB Sliders */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-text-muted w-3">R</span>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={rgb.r} 
                onChange={(e) => handleRgbChange('r', parseInt(e.target.value, 10))}
                className="flex-1 accent-error h-1.5 bg-surface-container rounded cursor-pointer"
              />
              <span className="text-[10px] font-mono w-7 text-right text-on-surface-variant">{rgb.r}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-text-muted w-3">G</span>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={rgb.g} 
                onChange={(e) => handleRgbChange('g', parseInt(e.target.value, 10))}
                className="flex-1 accent-emerald-400 h-1.5 bg-surface-container rounded cursor-pointer"
              />
              <span className="text-[10px] font-mono w-7 text-right text-on-surface-variant">{rgb.g}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-text-muted w-3">B</span>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={rgb.b} 
                onChange={(e) => handleRgbChange('b', parseInt(e.target.value, 10))}
                className="flex-1 accent-secondary h-1.5 bg-surface-container rounded cursor-pointer"
              />
              <span className="text-[10px] font-mono w-7 text-right text-on-surface-variant">{rgb.b}</span>
            </div>
          </div>

          {/* Shade & Tint Ramp Preview */}
          <div>
            <span className="text-[10px] font-mono text-text-muted block mb-1.5">Auto Tint / Shade Ramp</span>
            <div className="grid grid-cols-5 gap-1.5">
              {ramp.map((stepColor, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setTempColor(stepColor);
                    onChange(stepColor);
                  }}
                  className={`h-7 rounded cursor-pointer border transition-transform hover:scale-105 ${
                    stepColor.toUpperCase() === tempColor.toUpperCase() 
                      ? 'border-primary ring-1 ring-primary' 
                      : 'border-border-subtle hover:border-white/40'
                  }`}
                  style={{ backgroundColor: stepColor }}
                  title={stepColor}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
