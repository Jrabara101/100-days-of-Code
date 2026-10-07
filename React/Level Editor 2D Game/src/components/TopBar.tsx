import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Undo2,
  Redo2,
  Grid,
  Magnet,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Share2,
  Download,
  FolderOpen,
  CheckCircle2,
  Edit2,
} from 'lucide-react';
import { Button, Badge } from './ui/index.js';
import { sound } from '../utils/audio.js';

interface TopBarProps {
  title: string;
  author: string;
  onUpdateTitle: (title: string) => void;
  isPlaytesting: boolean;
  onTogglePlaytest: () => void;
  onResetPlaytest: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  gridSize: number;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onChangeGridSize: (size: number) => void;
  isAutoTileEnabled: boolean;
  onToggleAutoTile: () => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  onOpenVault: () => void;
  onOpenExport: () => void;
  onSaveCloud: () => void;
  isSaving: boolean;
  lastSavedAt: string | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  author,
  onUpdateTitle,
  isPlaytesting,
  onTogglePlaytest,
  onResetPlaytest,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  gridSize,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  onChangeGridSize,
  isAutoTileEnabled,
  onToggleAutoTile,
  showHeatmap,
  onToggleHeatmap,
  onOpenVault,
  onOpenExport,
  onSaveCloud,
  isSaving,
  lastSavedAt,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const handleFinishTitle = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    } else {
      setTitleInput(title);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    sound.setMuted(next);
    setIsMuted(next);
    sound.playClick();
  };

  return (
    <header className="h-12 bg-[#121620] border-b border-[#222B3D] flex items-center justify-between px-3.5 z-30 select-none">
      {/* Left: Branding & Map Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glowCyan">
            <span className="font-mono font-black text-xs text-slate-950">2D</span>
          </div>
          <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-cyan-400 to-slate-200 bg-clip-text text-transparent hidden sm:inline">
            FORGE<span className="text-cyan-400">2D</span>
          </span>
        </div>

        <div className="h-4 w-px bg-[#222B3D] hidden sm:block" />

        {/* Map Title Rename */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              autoFocus
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleFinishTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishTitle();
                if (e.key === 'Escape') {
                  setTitleInput(title);
                  setIsEditingTitle(false);
                }
              }}
              className="bg-[#0A0C10] border border-cyan-500/50 rounded px-2 py-0.5 text-xs font-semibold text-white focus:outline-none w-44"
            />
          ) : (
            <button
              onClick={() => {
                setTitleInput(title);
                setIsEditingTitle(true);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#F8FAFC] hover:text-cyan-400 transition-colors group"
              title="Click to rename map"
            >
              <span>{title}</span>
              <Edit2 className="w-3 h-3 text-[#64748B] group-hover:text-cyan-400" />
            </button>
          )}

          <Badge variant="cyan" className="hidden md:inline-flex">
            {author}
          </Badge>
        </div>

        {/* Cloud Save Status */}
        <button
          onClick={onSaveCloud}
          disabled={isSaving}
          className="flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-cyan-400 transition-colors ml-1"
          title="Save to Authoritative SQLite Backend"
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
          <span className="hidden lg:inline">
            {isSaving ? 'Saving...' : lastSavedAt ? `Saved ${lastSavedAt}` : 'Saved to Cloud'}
          </span>
        </button>
      </div>

      {/* Center: Transport Controls (Playtest, Restart, Undo/Redo) */}
      <div className="flex items-center gap-2">
        {/* Playtest Button (Space) */}
        <button
          onClick={onTogglePlaytest}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs transition-all duration-200 active:scale-95 ${
            isPlaytesting
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-glowAmber ring-2 ring-amber-400/50 animate-pulse'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glowEmerald ring-2 ring-emerald-400/30'
          }`}
          title="Toggle Instant Playtest (Space)"
        >
          {isPlaytesting ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>EDIT MODE</span>
              <kbd className="bg-slate-950/20 px-1 rounded text-[10px] font-mono">SPACE</kbd>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>PLAYTEST</span>
              <kbd className="bg-slate-950/20 px-1 rounded text-[10px] font-mono">SPACE</kbd>
            </>
          )}
        </button>

        {isPlaytesting && (
          <Button
            variant="default"
            size="sm"
            onClick={onResetPlaytest}
            className="text-xs text-amber-400"
            title="Reset Spawn"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}

        <div className="h-4 w-px bg-[#222B3D]" />

        {/* History Undo / Redo */}
        <div className="flex items-center gap-1 bg-[#192030] p-0.5 rounded-lg border border-[#222B3D]">
          <button
            onClick={onUndo}
            disabled={!canUndo || isPlaytesting}
            className="p-1.5 rounded hover:bg-[#222B3D] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo || isPlaytesting}
            className="p-1.5 rounded hover:bg-[#222B3D] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Viewport Controls, Toggles & Modals */}
      <div className="flex items-center gap-2">
        {/* Telemetry pill */}
        <div className="hidden xl:flex items-center gap-2 bg-[#192030] px-2.5 py-1 rounded-lg border border-[#222B3D] text-xs font-mono text-[#94A3B8]">
          <span>Zoom: <strong className="text-cyan-400">{Math.round(zoom * 100)}%</strong></span>
          <span className="text-[#64748B]">•</span>
          <span>Grid: <strong className="text-white">{gridSize}px</strong></span>
        </div>

        {/* Grid size toggle (16, 32, 64) */}
        <div className="hidden md:flex items-center bg-[#192030] p-0.5 rounded-lg border border-[#222B3D] text-[11px] font-mono">
          {[16, 32, 64].map((size) => (
            <button
              key={size}
              onClick={() => {
                onChangeGridSize(size);
                sound.playClick();
              }}
              className={`px-2 py-0.5 rounded ${
                gridSize === size
                  ? 'bg-cyan-500/20 text-cyan-400 font-bold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Snapping Toggle */}
        <button
          onClick={() => {
            onToggleSnap();
            sound.playClick();
          }}
          className={`p-1.5 rounded-lg border transition-colors ${
            snapToGrid
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
              : 'bg-[#192030] border-[#222B3D] text-[#64748B]'
          }`}
          title="Toggle Grid Snapping"
        >
          <Magnet className="w-3.5 h-3.5" />
        </button>

        {/* Grid lines toggle */}
        <button
          onClick={() => {
            onToggleGrid();
            sound.playClick();
          }}
          className={`p-1.5 rounded-lg border transition-colors ${
            showGrid
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
              : 'bg-[#192030] border-[#222B3D] text-[#64748B]'
          }`}
          title="Toggle Grid Lines"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        {/* Auto-tile toggle */}
        <button
          onClick={() => {
            onToggleAutoTile();
            sound.playClick();
          }}
          className={`p-1.5 rounded-lg border transition-colors hidden sm:flex items-center gap-1 ${
            isAutoTileEnabled
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-glowEmerald'
              : 'bg-[#192030] border-[#222B3D] text-[#64748B]'
          }`}
          title="Auto-Tile 47-Blob Bitmask Mode (A)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono hidden lg:inline">Auto-Tile</span>
        </button>

        {/* Community Death Heatmap Toggle */}
        <button
          onClick={() => {
            onToggleHeatmap();
            sound.playClick();
          }}
          className={`p-1.5 rounded-lg border transition-colors ${
            showHeatmap
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-glowCrimson'
              : 'bg-[#192030] border-[#222B3D] text-[#64748B]'
          }`}
          title="Toggle Community Death Heatmap"
        >
          <Flame className="w-3.5 h-3.5" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={toggleMute}
          className="p-1.5 rounded-lg border bg-[#192030] border-[#222B3D] text-[#94A3B8] hover:text-white"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
        </button>

        <div className="h-4 w-px bg-[#222B3D]" />

        {/* Arcade Vault Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenVault}
          className="text-xs text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
          title="Browse Arcade Vault Maps & Forks"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Arcade Vault</span>
        </Button>

        {/* Export CTA Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenExport}
          className="text-xs"
          title="Export to Tiled JSON, Godot 4, Unity CSV, PNG"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </Button>
      </div>
    </header>
  );
};
