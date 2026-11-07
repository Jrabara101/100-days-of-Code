import React from 'react';
import { useReader } from '../context/ReaderContext';
import { X, Check, Sun, Moon, Coffee, Type, AlignLeft, Maximize2, Sparkles } from 'lucide-react';
import { ThemePalette, TypographyPairing, LineWidthMode, FontSizeScale } from '../types';

export const ReaderComfortModal: React.FC = () => {
  const {
    settings,
    setPalette,
    setTypography,
    setLineWidth,
    setFontSize,
    isComfortStudioOpen,
    setIsComfortStudioOpen,
  } = useReader();

  if (!isComfortStudioOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden transition-all duration-200 ${
          settings.palette === 'midnight'
            ? 'bg-[#181B22] border-white/10 text-white'
            : settings.palette === 'sepia'
            ? 'bg-[#EFE5CD] border-[#3B3228]/20 text-[#3B3228]'
            : 'bg-[#FAF8F5] border-black/10 text-[#18181B]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-inherit">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-rose-600 text-white text-xs font-serif font-bold">
              Aa
            </span>
            <div>
              <h3 className="font-serif font-bold text-lg">Reader Comfort &amp; Typography Studio</h3>
              <p className="text-xs opacity-60 font-interface">
                Fine-tune your reading canvas, optical rhythm, and ergonomics.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsComfortStudioOpen(false)}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* Studio Controls */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. Canvas Warmth */}
          <div>
            <label className="block text-xs font-mono-tabular uppercase tracking-wider opacity-70 mb-2.5 font-bold">
              1. Canvas Warmth &amp; Optical Tint
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Daylight Paper */}
              <button
                onClick={() => setPalette('paper')}
                className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                  settings.palette === 'paper'
                    ? 'border-rose-600 ring-2 ring-rose-600/20 shadow-md'
                    : 'border-black/10 hover:border-black/30'
                } bg-[#FAF8F5] text-[#18181B]`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Sun className="w-4 h-4 text-amber-600" />
                  {settings.palette === 'paper' && (
                    <Check className="w-3.5 h-3.5 text-rose-600" />
                  )}
                </div>
                <div className="font-semibold text-xs">Daylight Paper</div>
                <div className="text-[10px] text-neutral-500">Archival #FAF8F5</div>
              </button>

              {/* Kindle Sepia */}
              <button
                onClick={() => setPalette('sepia')}
                className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                  settings.palette === 'sepia'
                    ? 'border-amber-700 ring-2 ring-amber-700/20 shadow-md'
                    : 'border-[#3B3228]/20 hover:border-[#3B3228]/40'
                } bg-[#F4ECD8] text-[#3B3228]`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Coffee className="w-4 h-4 text-amber-800" />
                  {settings.palette === 'sepia' && (
                    <Check className="w-3.5 h-3.5 text-amber-800" />
                  )}
                </div>
                <div className="font-semibold text-xs">Kindle Sepia</div>
                <div className="text-[10px] text-amber-900/70">Dusk #F4ECD8</div>
              </button>

              {/* OLED Midnight */}
              <button
                onClick={() => setPalette('midnight')}
                className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                  settings.palette === 'midnight'
                    ? 'border-purple-400 ring-2 ring-purple-400/20 shadow-md'
                    : 'border-neutral-700 hover:border-neutral-500'
                } bg-[#0F1115] text-[#F1F3F9]`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Moon className="w-4 h-4 text-purple-400" />
                  {settings.palette === 'midnight' && (
                    <Check className="w-3.5 h-3.5 text-purple-400" />
                  )}
                </div>
                <div className="font-semibold text-xs">OLED Midnight</div>
                <div className="text-[10px] text-neutral-400">Nocturnal #0F1115</div>
              </button>
            </div>
          </div>

          {/* 2. Typographic Pairing */}
          <div>
            <label className="block text-xs font-mono-tabular uppercase tracking-wider opacity-70 mb-2.5 font-bold">
              2. Typographic Voice
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Editorial Serif */}
              <button
                onClick={() => setTypography('serif')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.typography === 'serif'
                    ? 'border-rose-600 bg-rose-600/10 font-bold'
                    : 'border-inherit hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="font-serif text-base mb-0.5">Editorial Serif</div>
                <div className="text-[10px] opacity-70 font-interface">
                  Newsreader &amp; Source Serif (Recommended)
                </div>
              </button>

              {/* Swiss Modern Sans */}
              <button
                onClick={() => setTypography('sans')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.typography === 'sans'
                    ? 'border-rose-600 bg-rose-600/10 font-bold'
                    : 'border-inherit hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="font-sans font-bold text-sm mb-0.5">Swiss Sans</div>
                <div className="text-[10px] opacity-70 font-interface">
                  Plus Jakarta Sans &amp; Inter
                </div>
              </button>

              {/* Dyslexia-Friendly */}
              <button
                onClick={() => setTypography('dyslexic')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.typography === 'dyslexic'
                    ? 'border-rose-600 bg-rose-600/10 font-bold'
                    : 'border-inherit hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="font-reading-dyslexic font-bold text-sm mb-0.5">
                  High Legibility
                </div>
                <div className="text-[10px] opacity-70 font-interface">
                  Atkinson Hyperlegible (A11y)
                </div>
              </button>
            </div>
          </div>

          {/* 3. Line Measure & Font Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Measure */}
            <div>
              <label className="block text-xs font-mono-tabular uppercase tracking-wider opacity-70 mb-2 font-bold">
                3. Column Measure
              </label>
              <div className="flex items-center gap-2 p-1 rounded-lg border border-inherit">
                <button
                  onClick={() => setLineWidth('focused')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    settings.lineWidth === 'focused'
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
                  }`}
                >
                  Focused (65ch)
                </button>
                <button
                  onClick={() => setLineWidth('wide')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    settings.lineWidth === 'wide'
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
                  }`}
                >
                  Wide (82ch)
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs font-mono-tabular uppercase tracking-wider opacity-70 mb-2 font-bold">
                4. Text Scale
              </label>
              <div className="flex items-center gap-1 p-1 rounded-lg border border-inherit">
                {(['compact', 'normal', 'large'] as FontSizeScale[]).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    className={`flex-1 py-1.5 text-xs capitalize font-medium rounded-md transition-all cursor-pointer ${
                      settings.fontSize === sz
                        ? 'bg-rose-600 text-white font-bold shadow-xs'
                        : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
                    }`}
                  >
                    {sz === 'normal' ? '18px' : sz === 'compact' ? '16px' : '21px'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div
            className={`p-4 rounded-xl border border-inherit transition-all ${
              settings.palette === 'midnight'
                ? 'bg-black/40'
                : settings.palette === 'sepia'
                ? 'bg-[#E5DAC0]'
                : 'bg-white'
            }`}
          >
            <div className="text-[10px] font-mono-tabular uppercase opacity-50 mb-2 flex items-center justify-between">
              <span>Live Reading Canvas Preview</span>
              <span>
                {settings.typography.toUpperCase()} • {settings.fontSize.toUpperCase()}
              </span>
            </div>
            <p
              className={`leading-relaxed transition-all ${
                settings.typography === 'serif'
                  ? 'font-reading-serif'
                  : settings.typography === 'sans'
                  ? 'font-reading-sans'
                  : 'font-reading-dyslexic'
              } ${
                settings.fontSize === 'compact'
                  ? 'text-sm'
                  : settings.fontSize === 'large'
                  ? 'text-xl'
                  : 'text-base'
              }`}
            >
              “Physical print endures because ideas inhabit physical coordinates. When tools move
              faster than human cognition, they encourage thoughtless reactions over deliberate
              synthesis.”
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-inherit bg-black/5 dark:bg-white/5">
          <span className="text-[11px] font-mono-tabular opacity-60">
            Auto-saved to device memory
          </span>
          <button
            onClick={() => setIsComfortStudioOpen(false)}
            className="px-5 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Apply &amp; Return to Reading
          </button>
        </div>
      </div>
    </div>
  );
};
