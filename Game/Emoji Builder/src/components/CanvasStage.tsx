import React, { useRef, useState } from 'react';
import {
  Sparkles,
  Grid,
  Magnet,
  BringToFront,
  SendToBack,
  Wand2,
  Plus,
  MessageSquarePlus,
  RefreshCw,
} from 'lucide-react';
import {
  StoryPanel,
  EmojiSticker,
  SpeechBubble,
  AspectRatio,
  BackgroundMode,
  ThemeConfig,
} from '../types';
import { StickerItem } from './StickerItem';
import { SpeechBubbleItem } from './SpeechBubbleItem';
import { BranchChoiceOverlay } from './BranchChoiceOverlay';
import { sound } from '../utils/soundEngine';

interface CanvasStageProps {
  panel: StoryPanel | null;
  panelIndex: number;
  totalPanels: number;
  theme: ThemeConfig;
  bgMode: BackgroundMode;
  aspectRatio: AspectRatio;
  gameMode: 'creator' | 'reader' | 'plot_guesser';
  selectedStickerId: string | null;
  selectedBubbleId: string | null;
  onSelectSticker: (id: string | null) => void;
  onUpdateSticker: (id: string, updates: Partial<EmojiSticker>) => void;
  onDeleteSticker: (id: string) => void;
  onDuplicateSticker: (id: string) => void;
  onBringStickerToFront: (id: string) => void;
  onSendStickerToBack: (id: string) => void;
  onAddSticker: (char: string, name?: string, x?: number, y?: number) => void;
  onSelectBubble: (id: string | null) => void;
  onUpdateBubble: (id: string, updates: Partial<SpeechBubble>) => void;
  onDeleteBubble: (id: string) => void;
  onAddSpeechBubble: () => void;
  onUpdatePanel: (updates: Partial<StoryPanel>) => void;
  onSelectBranchPanel: (targetPanelId: string) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  panel,
  panelIndex,
  totalPanels,
  theme,
  bgMode,
  aspectRatio,
  gameMode,
  selectedStickerId,
  selectedBubbleId,
  onSelectSticker,
  onUpdateSticker,
  onDeleteSticker,
  onDuplicateSticker,
  onBringStickerToFront,
  onSendStickerToBack,
  onAddSticker,
  onSelectBubble,
  onUpdateBubble,
  onDeleteBubble,
  onAddSpeechBubble,
  onUpdatePanel,
  onSelectBranchPanel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [magnetGrid, setMagnetGrid] = useState(false);
  const [selectedFont, setSelectedFont] = useState<'font-sniglet' | 'font-hand' | 'font-quicksand' | 'font-outfit'>('font-sniglet');
  const isDark = theme.isDark;

  if (!panel) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 font-fredoka">
        No active panel selected.
      </div>
    );
  }

  // Aspect ratio dimension styling
  const aspectClass =
    aspectRatio === '1:1'
      ? 'aspect-square max-w-[560px]'
      : aspectRatio === '9:16'
      ? 'aspect-[9/16] max-h-[580px] max-w-[360px]'
      : 'aspect-[16/9] max-w-[830px]';

  // Handle drop from drag-and-drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const char = e.dataTransfer.getData('text/plain');
    if (!char) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    onAddSticker(char, undefined, Math.round(x), Math.round(y));
  };

  // Quick prop bar items
  const quickProps = [
    { char: '🍓', label: 'Strawberry' },
    { char: '🎂', label: '3-Tier Cake' },
    { char: '🐻', label: 'Chef Teddy' },
    { char: '🍯', label: 'Honey Jar' },
    { char: '🪄', label: 'Magic Whisk' },
    { char: '🍒', label: 'Cherries' },
    { char: '⭐', label: 'Gold Star' },
    { char: '🧁', label: 'Whip Cupcake' },
    { char: '🥛', label: 'Fresh Milk' },
    { char: '🎀', label: 'Ribbon' },
    { char: '✨', label: 'Sparkles' },
    { char: '🍪', label: 'Cookie' },
  ];

  return (
    <section
      className={`flex-1 flex flex-col items-center justify-between relative overflow-hidden rounded-3xl p-3 border transition-colors ${
        isDark
          ? 'bg-[#0b0e15] border-[#374151]'
          : 'bg-[#FFF8F6] border-rose-100/80 shadow-inner'
      }`}
      onClick={() => {
        onSelectSticker(null);
        onSelectBubble(null);
      }}
    >
      {/* 1. Top Floating Marshmallow / Atelier Toolbar */}
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md z-20 border transition-all ${
          isDark
            ? 'bg-[#10131a]/95 border-[#374151] text-stone-200 shadow-brutal-hard'
            : 'bg-white/95 border-white shadow-marshmallow text-stone-700'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setMagnetGrid(!magnetGrid);
            sound.playPop();
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-fredoka text-xs font-bold transition-all clay-puffy ${
            magnetGrid
              ? isDark
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'bg-matcha-mint text-emerald-950 shadow-clay-sm'
              : 'hover:bg-stone-100 text-stone-600'
          }`}
          title="Toggle Grid Magnet Lines"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span>{magnetGrid ? 'Magnet ON' : 'Magnet Grid'}</span>
        </button>

        <div className={`h-4 w-px ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />

        {/* Add Speech Bubble Quick Trigger */}
        <button
          onClick={() => onAddSpeechBubble()}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-fredoka text-xs font-bold transition-all clay-puffy ${
            isDark
              ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40 hover:bg-purple-800'
              : 'bg-rose-50 text-berry-red border border-rose-200 hover:bg-rose-100'
          }`}
          title="Add Dialogue Speech Bubble"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>+ Dialogue Bubble</span>
        </button>

        <div className={`h-4 w-px ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />

        {/* Bring to front / back */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => {
              if (selectedStickerId) onBringStickerToFront(selectedStickerId);
            }}
            disabled={!selectedStickerId}
            className={`p-1 rounded-full clay-puffy ${
              selectedStickerId ? 'hover:bg-rose-100 text-berry-red' : 'opacity-30 cursor-not-allowed'
            }`}
            title="Bring Selected Sticker to Front"
          >
            <BringToFront className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (selectedStickerId) onSendStickerToBack(selectedStickerId);
            }}
            disabled={!selectedStickerId}
            className={`p-1 rounded-full clay-puffy ${
              selectedStickerId ? 'hover:bg-rose-100 text-berry-red' : 'opacity-30 cursor-not-allowed'
            }`}
            title="Send Selected Sticker to Back"
          >
            <SendToBack className="w-4 h-4" />
          </button>
        </div>

        {/* Active Stage Pill */}
        <span
          className="px-2.5 py-0.5 rounded-full font-fredoka text-[10px] font-bold tracking-wide"
          style={{ backgroundColor: theme.primaryLight, color: theme.primaryColor }}
        >
          {theme.icon} {theme.name.toUpperCase()} STAGE
        </span>
      </div>

      {/* 2. Quick Add Scene Prop Palette Carousel */}
      <div
        className={`w-full max-w-[830px] my-1 p-1 px-3 rounded-2xl border shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-none z-10 backdrop-blur-sm ${
          isDark ? 'bg-[#141822]/90 border-[#374151]' : 'bg-white/80 border-rose-100/90'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-fredoka text-[10px] uppercase font-bold text-rose-400 shrink-0">
          Quick Prop:
        </span>
        {quickProps.map((qp) => (
          <button
            key={qp.label}
            onClick={() => {
              onAddSticker(qp.char, qp.label);
              sound.playPop();
            }}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full font-fredoka text-[11px] font-semibold clay-puffy shrink-0 border transition-transform ${
              isDark
                ? 'bg-[#1e2330] hover:bg-[#283042] text-stone-200 border-[#374151]'
                : 'bg-rose-50/70 hover:bg-rose-100 text-stone-700 border-rose-200/60'
            }`}
            title={`Add ${qp.label}`}
          >
            <span className="text-sm">{qp.char}</span>
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Main Frame Canvas Viewport */}
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          backgroundImage:
            bgMode === 'picture_artwork' && theme.pictureSrc
              ? `url("${theme.pictureSrc}")`
              : theme.canvasPattern,
          backgroundSize: bgMode === 'picture_artwork' ? 'cover' : '24px 24px',
          backgroundPosition: 'center',
          borderColor: theme.frameBorderColor,
        }}
        className={`relative w-full ${aspectClass} flex-1 my-1 rounded-[34px] border-[6px] p-4 flex flex-col justify-between overflow-hidden select-none transition-all ${
          isDark
            ? 'shadow-brutal-hard bg-[#0b0e15]'
            : 'shadow-wood-frame bg-gradient-to-b from-[#FFFDFB] to-[#FFF5EE]'
        }`}
      >
        {/* Floating backdrop blobs (for Kawaii themes) */}
        {!isDark && bgMode === 'styled_pattern' && (
          <>
            <div className="absolute -top-10 left-12 w-48 h-24 rounded-full bg-rose-100/40 blur-[2px] pointer-events-none" />
            <div className="absolute top-10 right-10 w-60 h-32 rounded-full bg-amber-100/40 blur-[2px] pointer-events-none" />
            <div className="absolute bottom-4 left-1/3 w-72 h-24 rounded-full bg-pink-100/50 blur-[2px] pointer-events-none" />
          </>
        )}

        {/* Magnet Grid Overlay */}
        {magnetGrid && (
          <div
            className="absolute inset-0 pointer-events-none z-10 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        )}

        {/* Picture Backdrop Dimmer (to ensure emojis pop over images) */}
        {bgMode === 'picture_artwork' && (
          <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[0.5px] pointer-events-none z-0" />
        )}

        {/* Frame Top Header Stamp */}
        <div className="flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-2xl font-fredoka text-xs font-bold shadow-clay-sm"
              style={{ backgroundColor: theme.primaryColor, color: '#ffffff' }}
            >
              PAGE #{String(panelIndex + 1).padStart(2, '0')}
            </span>
            <span
              className={`font-fredoka text-xs sm:text-sm font-bold tracking-wide truncate max-w-[260px] sm:max-w-[420px] ${
                isDark ? 'text-white' : 'text-stone-800'
              }`}
            >
              {panel.title || `Beat #${panelIndex + 1}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-xl font-fredoka text-[11px] font-bold shadow-sm border ${
                isDark
                  ? 'bg-[#1e2330] text-amber-400 border-amber-500/30'
                  : 'bg-white/90 text-berry-red border-rose-100'
              }`}
            >
              {((panel.durationMs || 3000) / 1000).toFixed(1)}s • {aspectRatio}
            </span>
            <span
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_#34D399] animate-pulse"
              style={{ backgroundColor: theme.accentColor }}
              title="Live interactive canvas"
            />
          </div>
        </div>

        {/* Central Staging Area: Render Stickers and Speech Bubbles */}
        <div className="relative flex-1 w-full my-1 z-10">
          {panel.stickers.map((sticker) => (
            <StickerItem
              key={sticker.id}
              sticker={sticker}
              isSelected={selectedStickerId === sticker.id}
              isDark={isDark}
              containerRef={containerRef}
              onSelect={() => onSelectSticker(sticker.id)}
              onUpdate={(updates) => onUpdateSticker(sticker.id, updates)}
              onDelete={() => onDeleteSticker(sticker.id)}
              onDuplicate={() => onDuplicateSticker(sticker.id)}
              onBringToFront={() => onBringStickerToFront(sticker.id)}
              onSendToBack={() => onSendStickerToBack(sticker.id)}
            />
          ))}

          {(panel.speechBubbles || []).map((bubble) => (
            <SpeechBubbleItem
              key={bubble.id}
              bubble={bubble}
              isSelected={selectedBubbleId === bubble.id}
              isDark={isDark}
              containerRef={containerRef}
              onSelect={() => onSelectBubble(bubble.id)}
              onUpdate={(updates) => onUpdateBubble(bubble.id, updates)}
              onDelete={() => onDeleteBubble(bubble.id)}
            />
          ))}

          {/* Branching choices overlay (especially useful in reader or playback mode) */}
          <BranchChoiceOverlay
            choices={panel.choices || []}
            isDark={isDark}
            onSelectChoice={onSelectBranchPanel}
          />
        </div>

        {/* Frame Bottom Info Stamp */}
        <div
          className={`flex items-center justify-between z-10 pt-1.5 border-t text-[11px] font-fredoka shrink-0 ${
            isDark
              ? 'border-stone-800 text-stone-400'
              : 'border-rose-200/60 text-rose-900/80'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span>Mood: {panel.mood.toUpperCase()}</span>
            <span>•</span>
            <span>Stickers: {panel.stickers.length}</span>
            <span>•</span>
            <span>Bubbles: {(panel.speechBubbles || []).length}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full font-bold shadow-sm ${
              isDark
                ? 'bg-stone-800 text-amber-400'
                : 'bg-vanilla-custard text-amber-950 border border-amber-200'
            }`}
          >
            BEAT {panelIndex + 1} / {totalPanels}
          </span>
        </div>
      </div>

      {/* 4. Real-Time Dialogue / Caption Subtitle Bar */}
      <div
        className={`w-full max-w-[830px] mt-1 p-2 rounded-2xl border flex items-center justify-between gap-3 shadow-marshmallow z-20 backdrop-blur-md ${
          isDark ? 'bg-[#10131a]/95 border-[#374151]' : 'bg-white/95 border-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className="px-2.5 py-1 rounded-xl text-white font-fredoka text-xs font-bold shrink-0 shadow-sm"
            style={{ backgroundColor: theme.primaryColor }}
          >
            Story Subtitle:
          </span>
          <input
            className={`flex-1 bg-transparent font-semibold text-xs sm:text-sm outline-none border-b border-transparent focus:border-berry-red px-1 truncate ${selectedFont} ${
              isDark ? 'text-white focus:border-amber-400' : 'text-stone-800 focus:border-berry-red'
            }`}
            type="text"
            value={panel.caption}
            onChange={(e) => onUpdatePanel({ caption: e.target.value })}
            placeholder="Type a story subtitle or generate prose..."
          />
        </div>

        {/* Font Switcher & Jelly Swatches */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center p-0.5 rounded-xl ${
              isDark ? 'bg-stone-800' : 'bg-stone-100'
            }`}
          >
            <button
              onClick={() => setSelectedFont('font-sniglet')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                selectedFont === 'font-sniglet'
                  ? isDark
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-berry-red text-white'
                  : 'text-stone-500 hover:text-stone-800 font-sniglet'
              }`}
            >
              Sniglet
            </button>
            <button
              onClick={() => setSelectedFont('font-hand')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold font-hand transition-all ${
                selectedFont === 'font-hand'
                  ? isDark
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-berry-red text-white'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Patrick
            </button>
            <button
              onClick={() => setSelectedFont('font-quicksand')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold font-quicksand transition-all ${
                selectedFont === 'font-quicksand'
                  ? isDark
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-berry-red text-white'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Quicksand
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
