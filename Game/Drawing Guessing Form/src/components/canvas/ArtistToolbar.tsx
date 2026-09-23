import React from 'react';
import { PenTool, Pencil, PaintBucket, Eraser, Undo2, FileX2, Sparkles } from 'lucide-react';
import { ToolType } from '@/types/game';
import { Slider } from '@/components/ui/slider';
import { WashiTape } from '@/components/react-bits/WashiTape';
import { cn } from '@/lib/utils';

interface ArtistToolbarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  brushColor: string;
  onSelectColor: (color: string) => void;
  brushSize: number;
  onSelectSize: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
  isArtist: boolean;
  activeWord: string;
  isBlindfold: boolean;
  isOneLineOnly: boolean;
}

// 16 curated rich artisan gouache and sketch pigments
export const ARTISAN_PALETTE = [
  { name: 'Deep Ink Navy', color: '#1E2638' },
  { name: 'Graphite Charcoal', color: '#4A4E58' },
  { name: 'Burnt Sienna', color: '#C85A32' },
  { name: 'Terracotta Rust', color: '#E87D56' },
  { name: 'Yellow Ochre', color: '#D9822B' },
  { name: 'Warm Mustard', color: '#E5A93C' },
  { name: 'Raw Umber', color: '#6E442B' },
  { name: 'Walnut Bark', color: '#442F24' },
  { name: 'Forest Moss', color: '#3B5E41' },
  { name: 'Olive Sage', color: '#7B9368' },
  { name: 'Spring Lichen', color: '#99B871' },
  { name: 'Indigo Gouache', color: '#36558F' },
  { name: 'Cerulean Sketch', color: '#4D82B8' },
  { name: 'Clay Rose', color: '#C26D68' },
  { name: 'Petal Blush', color: '#E29590' },
  { name: 'Chalk White', color: '#FDFBF7' },
];

export const ArtistToolbar: React.FC<ArtistToolbarProps> = ({
  currentTool,
  onSelectTool,
  brushColor,
  onSelectColor,
  brushSize,
  onSelectSize,
  onUndo,
  onClear,
  isArtist,
  activeWord,
  isBlindfold,
  isOneLineOnly,
}) => {
  if (!isArtist) {
    return (
      <aside className="w-full lg:w-60 bg-studio-aged/95 backdrop-blur-md border border-[#D5C7B0] rounded-2xl p-4 shadow-paper-lift flex flex-col justify-between shrink-0 order-2 lg:order-1 text-center">
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-200/50 border border-amber-300 text-amber-800 mx-auto flex items-center justify-center">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-studio-ink">You are Guessing!</h3>
            <p className="text-xs text-studio-charcoal/80 font-sans mt-1">
              Watch the sketchbook strokes closely and whisper your deductions in the Den chat!
            </p>
          </div>
          <div className="p-3 bg-white/70 rounded-xl border border-[#D5C7B0] text-xs font-serif italic text-studio-charcoal">
            💡 <span className="font-semibold">Tip:</span> Near-miss guesses receive warm hints!
          </div>
        </div>
        <div className="pt-3 border-t border-[#D5C7B0]/80 flex items-center justify-between text-[11px] text-studio-charcoal">
          <span className="italic font-serif flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-studio-moss" />
            <span>Spectator View</span>
          </span>
          <span className="font-hand text-studio-sienna font-bold">Den Scribe</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-60 bg-studio-aged/95 backdrop-blur-md border border-[#D5C7B0] rounded-2xl p-3 shadow-paper-lift flex flex-col justify-between shrink-0 order-2 lg:order-1">
      <div>
        {/* Pencil Case Header */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#D5C7B0]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-studio-sienna/15 border border-studio-sienna/30 flex items-center justify-center text-studio-sienna">
              <PenTool className="w-3.5 h-3.5" />
            </span>
            <div>
              <h3 className="font-serif font-bold text-xs text-studio-ink">Pencil Case Tools</h3>
              <p className="text-[10px] text-studio-charcoal/75 font-sans">Craft & Mediums</p>
            </div>
          </div>
          <WashiTape label="Artist Easel" className="rotate-1" />
        </div>

        {/* Word Reminder Banner for Artist */}
        <div className="mb-2.5 p-2 rounded-xl bg-amber-100/70 border border-amber-300/70 text-center">
          <div className="text-[9px] uppercase tracking-wider font-bold text-amber-900 font-sans">Draw Prompt</div>
          <div className="font-serif font-extrabold text-sm text-studio-ink tracking-wider">{activeWord}</div>
          {isBlindfold && (
            <div className="mt-1 text-[9px] bg-rose-200/80 text-rose-900 font-bold px-1.5 py-0.5 rounded">
              🕶️ Blindfold Active (Ink fades!)
            </div>
          )}
          {isOneLineOnly && (
            <div className="mt-1 text-[9px] bg-purple-200/80 text-purple-900 font-bold px-1.5 py-0.5 rounded">
              ✏️ One-Line Mode (Don't lift pen!)
            </div>
          )}
        </div>

        {/* Medium / Tool Picker */}
        <div className="grid grid-cols-3 lg:grid-cols-1 gap-1.5 mb-3" id="tool-group">
          {/* 2B Graphite / Brush */}
          <button
            onClick={() => onSelectTool('brush')}
            className={cn(
              'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-semibold text-xs transition active:scale-95 shadow-sm',
              currentTool === 'brush'
                ? 'bg-white text-studio-sienna border border-studio-sienna/40'
                : 'bg-studio-paper hover:bg-white text-studio-charcoal border border-transparent hover:border-[#D5C7B0]'
            )}
            title="2B Graphite Pencil"
          >
            <Pencil className="w-4 h-4 shrink-0" />
            <span className="text-[11px] truncate text-left">2B Graphite</span>
          </button>

          {/* Gouache Fill / Bucket */}
          <button
            onClick={() => onSelectTool('fill')}
            className={cn(
              'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-semibold text-xs transition active:scale-95 shadow-sm',
              currentTool === 'fill'
                ? 'bg-white text-studio-sienna border border-studio-sienna/40'
                : 'bg-studio-paper hover:bg-white text-studio-charcoal border border-transparent hover:border-[#D5C7B0]'
            )}
            title="Watercolor / Gouache Fill"
          >
            <PaintBucket className="w-4 h-4 shrink-0" />
            <span className="text-[11px] truncate text-left">Gouache Fill</span>
          </button>

          {/* Kneaded Eraser */}
          <button
            onClick={() => onSelectTool('eraser')}
            className={cn(
              'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-semibold text-xs transition active:scale-95 shadow-sm',
              currentTool === 'eraser'
                ? 'bg-white text-studio-sienna border border-studio-sienna/40'
                : 'bg-studio-paper hover:bg-white text-studio-charcoal border border-transparent hover:border-[#D5C7B0]'
            )}
            title="Kneaded Eraser"
          >
            <Eraser className="w-4 h-4 shrink-0" />
            <span className="text-[11px] truncate text-left">Kneaded Eraser</span>
          </button>
        </div>

        {/* Brush Size / Tip Pressure Slider */}
        <div className="bg-white/80 border border-[#D5C7B0] rounded-xl p-2.5 mb-3 shadow-inner">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-studio-charcoal/80">
              Tip Pressure / Size
            </span>
            <span className="font-hand text-sm font-bold text-studio-sienna">{brushSize} pt</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Slider
              min={2}
              max={32}
              value={brushSize}
              onValueChange={onSelectSize}
              className="accent-studio-sienna"
            />
            <div
              className="w-5 h-5 rounded-full bg-studio-paper border border-[#C5B59E] flex items-center justify-center shrink-0 shadow-sm"
              title="Preview Size"
            >
              <div
                className="rounded-full transition-all"
                style={{
                  backgroundColor: currentTool === 'eraser' ? '#D5C7B0' : brushColor,
                  width: `${Math.min(Math.max(brushSize / 2.2, 3), 14)}px`,
                  height: `${Math.min(Math.max(brushSize / 2.2, 3), 14)}px`,
                }}
              />
            </div>
          </div>
        </div>

        {/* 16-Color Artisan Pigment Swatches */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-studio-charcoal/80">
              Pigment Palette (16)
            </span>
            <span
              className="w-3 h-3 rounded-full border border-stone-300 shadow-sm"
              style={{ backgroundColor: brushColor }}
            />
          </div>
          <div className="grid grid-cols-8 lg:grid-cols-8 gap-1.5 bg-white/70 p-2 rounded-xl border border-[#D5C7B0]">
            {ARTISAN_PALETTE.map((swatch) => (
              <button
                key={swatch.color}
                onClick={() => onSelectColor(swatch.color)}
                style={{ backgroundColor: swatch.color }}
                title={swatch.name}
                className={cn(
                  'w-5 h-5 rounded-full shadow-inner transition-transform active:scale-90',
                  brushColor === swatch.color &&
                    'ring-2 ring-studio-sienna ring-offset-1 ring-offset-white scale-110'
                )}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons: Undo and Clear */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onUndo}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white hover:bg-studio-paper border border-[#D5C7B0] text-studio-charcoal hover:text-studio-ink text-xs font-serif font-bold transition active:scale-95 shadow-sm"
            title="Undo Last Stroke"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          <button
            onClick={onClear}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white hover:bg-rose-50 border border-[#D5C7B0] hover:border-rose-300 text-studio-charcoal hover:text-rose-700 text-xs font-serif font-bold transition active:scale-95 shadow-sm"
            title="Clear Entire Page"
          >
            <FileX2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Mini Studio Notes / Paper Rag watermark */}
      <div className="mt-3 pt-2.5 border-t border-[#D5C7B0]/80 flex items-center justify-between text-[11px] text-studio-charcoal">
        <span className="italic font-serif flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-studio-moss" />
          <span>Paper grain active</span>
        </span>
        <span className="font-hand text-studio-sienna font-bold">100% Cotton Rag</span>
      </div>
    </aside>
  );
};
