import React, { useState } from 'react';
import {
  Sparkles,
  Undo2,
  Redo2,
  Share2,
  Film,
  Download,
  Gamepad2,
  Palette,
  Image as ImageIcon,
  Check,
  ChevronDown,
  BookOpen,
  Wand2,
} from 'lucide-react';
import { AspectRatio, BackgroundMode, ThemeId } from '../types';
import { THEMES } from '../data/themeDefinitions';
import { sound } from '../utils/soundEngine';

interface HeaderProps {
  title: string;
  themeId: ThemeId;
  bgMode: BackgroundMode;
  aspectRatio: AspectRatio;
  gameMode: 'creator' | 'reader' | 'plot_guesser';
  canUndo: boolean;
  canRedo: boolean;
  onUpdateTitle: (title: string) => void;
  onSelectTheme: (theme: ThemeId) => void;
  onToggleBgMode: (mode: BackgroundMode) => void;
  onSelectAspectRatio: (ratio: AspectRatio) => void;
  onSelectGameMode: (mode: 'creator' | 'reader' | 'plot_guesser') => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenReelModal: () => void;
  onOpenExportModal: () => void;
  onShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  themeId,
  bgMode,
  aspectRatio,
  gameMode,
  canUndo,
  canRedo,
  onUpdateTitle,
  onSelectTheme,
  onToggleBgMode,
  onSelectAspectRatio,
  onSelectGameMode,
  onUndo,
  onRedo,
  onOpenReelModal,
  onOpenExportModal,
  onShare,
}) => {
  const currentTheme = THEMES[themeId];
  const isDark = currentTheme.isDark;
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareClick = () => {
    onShare();
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <header
      className={`fixed top-2.5 left-4 right-4 z-50 h-16 rounded-3xl border px-4 flex items-center justify-between gap-3 backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-[#10131a]/95 border-[#374151] shadow-brutal-hard text-stone-100'
          : 'bg-white/92 border-white/90 shadow-marshmallow text-stone-800'
      }`}
    >
      {/* 1. Brand & Episode Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-2xl shadow-clay-sm animate-bounce cursor-pointer ${
              isDark ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-gradient-to-tr from-berry-red via-cream-pink to-vanilla-custard'
            }`}
            style={{ animationDuration: '3s' }}
            title="EmojiStory Studio"
          >
            {currentTheme.icon}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={`font-fredoka text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>
                EmojiStory
              </span>
              <span
                className="px-2 py-0.5 rounded-full font-fredoka text-[10px] font-bold tracking-wide shadow-sm"
                style={{ backgroundColor: currentTheme.badgeBg, color: currentTheme.badgeText }}
              >
                {themeId.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className={`h-6 w-px mx-1 ${isDark ? 'bg-stone-700' : 'bg-rose-100'}`} />

        {/* Editable Story Ribbon */}
        <div
          className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-2xl border shadow-inner ${
            isDark ? 'bg-[#191b23] border-[#374151]' : 'bg-rose-50/70 border-rose-200/50'
          }`}
        >
          <span className="text-base">{currentTheme.icon}</span>
          <input
            className={`bg-transparent font-fredoka text-xs font-semibold outline-none w-56 lg:w-72 truncate ${
              isDark ? 'text-stone-100 focus:text-amber-400' : 'text-stone-800 focus:text-berry-red'
            }`}
            type="text"
            value={title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            title="Click to edit story title"
          />
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Auto-saved to browser storage" />
        </div>
      </div>

      {/* 2. Center Aspect Ratio & Mode Switches */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Aspect Ratio Buttons */}
        <div
          className={`flex items-center gap-1 p-1 rounded-2xl border shadow-inner ${
            isDark ? 'bg-[#191b23] border-[#374151]' : 'bg-rose-50/80 border-rose-100/60'
          }`}
        >
          {(['1:1', '16:9', '9:16'] as AspectRatio[]).map((ratio) => {
            const active = aspectRatio === ratio;
            return (
              <button
                key={ratio}
                onClick={() => onSelectAspectRatio(ratio)}
                className={`px-2.5 py-1 rounded-xl font-fredoka text-xs transition-all ${
                  active
                    ? isDark
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-brutal-hard'
                      : 'bg-berry-red text-white font-bold shadow-clay-sm'
                    : isDark
                    ? 'text-stone-400 hover:text-white hover:bg-stone-800'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
                }`}
              >
                {ratio === '1:1' ? '1:1 Square' : ratio === '16:9' ? '16:9 Cinema' : '9:16 Reel'}
              </button>
            );
          })}
        </div>

        {/* Background Mode Toggle (CSS Pattern vs Picture Artwork) */}
        <button
          onClick={() => onToggleBgMode(bgMode === 'styled_pattern' ? 'picture_artwork' : 'styled_pattern')}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-fredoka text-xs font-bold border transition-all clay-puffy ${
            bgMode === 'picture_artwork'
              ? isDark
                ? 'bg-purple-900/50 border-purple-500 text-purple-300'
                : 'bg-rose-100 border-rose-300 text-rose-800'
              : isDark
              ? 'bg-[#191b23] border-[#374151] text-stone-300'
              : 'bg-white border-stone-200 text-stone-700'
          }`}
          title="Toggle between CSS Dot-Grid Pattern and Theme Picture Backdrop"
        >
          {bgMode === 'picture_artwork' ? <ImageIcon className="w-3.5 h-3.5" /> : <Palette className="w-3.5 h-3.5" />}
          <span>{bgMode === 'picture_artwork' ? 'Backdrop Picture' : 'Styled Pattern'}</span>
        </button>

        {/* Game Mode Selector: Studio vs Reader vs Plot Guesser */}
        <div
          className={`flex items-center gap-1 p-1 rounded-2xl border shadow-inner ${
            isDark ? 'bg-[#191b23] border-[#374151]' : 'bg-stone-100/80 border-stone-200/60'
          }`}
        >
          <button
            onClick={() => onSelectGameMode('creator')}
            className={`px-2 py-1 rounded-xl font-fredoka text-xs font-semibold flex items-center gap-1 transition-all ${
              gameMode === 'creator'
                ? isDark
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-white text-stone-900 shadow-sm font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Creator Studio: Edit story, stickers & scenes"
          >
            <Wand2 className="w-3 h-3" />
            <span className="hidden lg:inline">Studio</span>
          </button>
          <button
            onClick={() => onSelectGameMode('reader')}
            className={`px-2 py-1 rounded-xl font-fredoka text-xs font-semibold flex items-center gap-1 transition-all ${
              gameMode === 'reader'
                ? isDark
                  ? 'bg-purple-500 text-white font-bold'
                  : 'bg-purple-500 text-white shadow-sm font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Reader Mode: Interactive story with branching choices"
          >
            <BookOpen className="w-3 h-3" />
            <span className="hidden lg:inline">Reader</span>
          </button>
          <button
            onClick={() => onSelectGameMode('plot_guesser')}
            className={`px-2 py-1 rounded-xl font-fredoka text-xs font-semibold flex items-center gap-1 transition-all ${
              gameMode === 'plot_guesser'
                ? 'bg-emerald-500 text-white shadow-sm font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Party Game: Decode the Secret Plot with Hot/Cold hints"
          >
            <Gamepad2 className="w-3 h-3" />
            <span className="hidden lg:inline">Guess Plot</span>
          </button>
        </div>
      </div>

      {/* 3. Top Right Actions: Theme Dropdown, Undo/Redo, Present Reel, Export */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className={`px-3 py-1.5 rounded-2xl font-fredoka text-xs font-bold border flex items-center gap-1.5 transition-all clay-puffy ${
              isDark ? 'bg-[#1f2937] border-[#374151] text-amber-400' : 'bg-white border-rose-200 text-stone-800 shadow-sm'
            }`}
            title="Switch Visual Theme & Aesthetics"
          >
            <span>{currentTheme.icon}</span>
            <span className="hidden xl:inline">{currentTheme.name}</span>
            <ChevronDown className="w-3 h-3 text-stone-400" />
          </button>

          {isThemeMenuOpen && (
            <div
              className={`absolute right-0 top-12 w-64 rounded-2xl p-2 border shadow-xl z-50 flex flex-col gap-1 backdrop-blur-lg ${
                isDark ? 'bg-[#191b23] border-[#374151] text-stone-200' : 'bg-white/95 border-rose-100 text-stone-800'
              }`}
            >
              <div className="px-2 py-1 text-[10px] font-fredoka uppercase tracking-wider text-stone-400 font-bold">
                Select Visual World (7 Variations)
              </div>
              {(Object.keys(THEMES) as ThemeId[]).map((tKey) => {
                const item = THEMES[tKey];
                const active = themeId === tKey;
                return (
                  <button
                    key={tKey}
                    onClick={() => {
                      onSelectTheme(tKey);
                      setIsThemeMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-fredoka transition-all ${
                      active
                        ? isDark
                          ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30'
                          : 'bg-rose-50 text-berry-red font-bold border border-rose-200'
                        : isDark
                        ? 'hover:bg-stone-800 text-stone-300'
                        : 'hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <div className="flex flex-col text-left">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-[10px] text-stone-400 truncate w-40">{item.tagline}</span>
                      </div>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Undo / Redo */}
        <div
          className={`hidden sm:flex items-center p-1 rounded-2xl border ${
            isDark ? 'bg-[#191b23] border-[#374151]' : 'bg-rose-50/70 border-rose-100/60'
          }`}
        >
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all clay-puffy ${
              canUndo
                ? isDark
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                  : 'bg-white hover:bg-rose-100 text-stone-700 shadow-sm'
                : 'opacity-40 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`w-7 h-7 rounded-xl ml-1 flex items-center justify-center transition-all clay-puffy ${
              canRedo
                ? isDark
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                  : 'bg-white hover:bg-rose-100 text-stone-700 shadow-sm'
                : 'opacity-40 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Present Reel Button */}
        <button
          onClick={onOpenReelModal}
          className={`px-3 py-1.5 rounded-2xl font-fredoka text-xs font-bold flex items-center gap-1.5 transition-all clay-puffy ${
            isDark
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-brutal-hard'
              : 'bg-berry-soft hover:bg-rose-200/70 text-rose-800 border border-rose-200 shadow-sm'
          }`}
          title="Play Cinematic Story Reel with Sound FX and Camera Zooms"
        >
          <Film className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Play Reel</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShareClick}
          className={`px-3 py-1.5 rounded-2xl font-fredoka text-xs font-bold border flex items-center gap-1.5 transition-all clay-puffy ${
            isDark
              ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-[#374151]'
              : 'bg-white hover:bg-rose-50 text-stone-700 border-stone-200 shadow-sm'
          }`}
          title="Copy one-click shareable story link to clipboard"
        >
          {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{copiedShare ? 'Copied Link!' : 'Share'}</span>
        </button>

        {/* Export Button (Puffy Warm Custard & Strawberry Oven Bake) */}
        <button
          onClick={onOpenExportModal}
          className={`px-3.5 py-1.5 rounded-2xl font-fredoka text-xs font-bold flex items-center gap-1.5 transition-all clay-puffy border-t ${
            isDark
              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-brutal-hard border-amber-300'
              : 'bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-500 text-amber-950 shadow-clay-btn border-amber-100'
          }`}
          title="Export high-resolution PNG comic strips or animated video reel"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Bake Comic</span>
        </button>
      </div>
    </header>
  );
};
