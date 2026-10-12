import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Ghost,
  Shield,
  Crosshair,
  Plus,
  Trash2,
  Copy,
  Sliders,
  Sparkles,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { AnimationClip, BoundingBox, HitboxType, SpriteFrame, ViewportBackground } from '../types/sprite';
import { useSpriteAnimator } from '../hooks/useSpriteAnimator';
import { HitboxInspector } from './HitboxInspector';

interface RightDockProps {
  image: HTMLImageElement | null;
  clips: AnimationClip[];
  activeClipId: string;
  frames: Record<string, SpriteFrame>;
  onSelectClip: (id: string) => void;
  onCreateClip: (name: string) => void;
  onDeleteClip: (id: string) => void;
  onDuplicateClip: (id: string) => void;
  onRenameClip: (id: string, newName: string) => void;
  onUpdateClipFps: (id: string, fps: number) => void;
  onUpdateClipFrames: (id: string, frameIds: string[]) => void;
  onUpdateFrameAnchor: (frameId: string, anchor: { x: number; y: number }) => void;
  onApplyAnchorToAll: (anchor: { x: number; y: number }) => void;
  onAddHitbox: (frameId: string, type: HitboxType) => void;
  onUpdateHitbox: (frameId: string, hitbox: BoundingBox) => void;
  onDeleteHitbox: (frameId: string, hitboxId: string) => void;
  pixelated: boolean;
}

export const RightDock: React.FC<RightDockProps> = ({
  image,
  clips,
  activeClipId,
  frames,
  onSelectClip,
  onCreateClip,
  onDeleteClip,
  onDuplicateClip,
  onRenameClip,
  onUpdateClipFps,
  onUpdateClipFrames,
  onUpdateFrameAnchor,
  onApplyAnchorToAll,
  onAddHitbox,
  onUpdateHitbox,
  onDeleteHitbox,
  pixelated,
}) => {
  // Stage options
  const [background, setBackground] = useState<ViewportBackground>('checkerboard');
  const [showOnionSkin, setShowOnionSkin] = useState<boolean>(false);
  const [onionSkinOpacity, setOnionSkinOpacity] = useState<number>(0.5);
  const [showHitboxes, setShowHitboxes] = useState<boolean>(true);
  const [showAnchor, setShowAnchor] = useState<boolean>(true);

  // Active clip
  const activeClip = clips.find((c) => c.id === activeClipId) || clips[0] || null;

  // New clip naming
  const [isCreatingClip, setIsCreatingClip] = useState(false);
  const [newClipName, setNewClipName] = useState('');

  // Drag and drop filmstrip reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const {
    previewCanvasRef,
    isPlaying,
    currentFrameIndex,
    setCurrentFrameIndex,
    fps,
    setFps,
    loop,
    pingPong,
    previewZoom,
    setPreviewZoom,
    togglePlay,
    stepForward,
    stepBackward,
    toggleLoop,
    togglePingPong,
    activeFrame,
  } = useSpriteAnimator({
    image,
    clip: activeClip,
    frames,
    background,
    showOnionSkin,
    onionSkinOpacity,
    showHitboxes,
    showAnchor,
    pixelated,
  });

  const handleFpsChange = (newFps: number) => {
    setFps(newFps);
    if (activeClip) {
      onUpdateClipFps(activeClip.id, newFps);
    }
  };

  const handleCreateClipSubmit = () => {
    if (newClipName.trim()) {
      onCreateClip(newClipName.trim());
      setNewClipName('');
      setIsCreatingClip(false);
    }
  };

  // Filmstrip reordering
  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx || !activeClip) return;

    const updated = [...activeClip.frameIds];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIdx, 0, moved);
    setDraggedIndex(targetIdx);
    onUpdateClipFrames(activeClip.id, updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleRemoveFrameFromClip = (idx: number) => {
    if (!activeClip) return;
    const updated = [...activeClip.frameIds];
    updated.splice(idx, 1);
    onUpdateClipFrames(activeClip.id, updated);
  };

  return (
    <aside className="w-[360px] bg-dock border-l border-border-subtle flex flex-col h-[calc(100vh-3rem)] overflow-y-auto select-none">
      {/* 1. TOP PREVIEW ARENA (260px Height) */}
      <div className="relative h-[260px] bg-void border-b border-border-subtle flex items-center justify-center overflow-hidden">
        {/* Live Canvas */}
        <canvas
          ref={previewCanvasRef}
          width={360}
          height={260}
          className={`w-full h-full block ${pixelated ? 'pixelated' : ''}`}
        />

        {/* Floating Top-Left Stage Toolbar */}
        <div className="absolute top-2 left-2 z-20 flex items-center space-x-1 bg-dock/90 backdrop-blur-md p-1 rounded-md border border-border-subtle text-text-muted">
          {/* Background switcher */}
          <button
            onClick={() =>
              setBackground((b) =>
                b === 'checkerboard'
                  ? 'stage'
                  : b === 'stage'
                  ? 'void'
                  : b === 'void'
                  ? 'chroma'
                  : 'checkerboard'
              )
            }
            title={`Background: ${background}`}
            className="px-1.5 py-0.5 rounded hover:bg-card text-[10px] font-mono text-text-display hover:text-accent-cyan transition-colors"
          >
            {background === 'checkerboard' && '🏁 Check'}
            {background === 'stage' && '🥋 Stage'}
            {background === 'void' && '⬛ Void'}
            {background === 'chroma' && '🟩 Green'}
          </button>

          <div className="h-2.5 w-[1px] bg-border-subtle" />

          {/* Onion skin toggle */}
          <button
            onClick={() => setShowOnionSkin(!showOnionSkin)}
            title="Toggle Onion Skin Ghosting"
            className={`p-1 rounded transition-colors ${
              showOnionSkin ? 'text-accent-violet bg-accent-violet/20' : 'hover:text-text-display'
            }`}
          >
            <Ghost className="w-3.5 h-3.5" />
          </button>

          {/* Hitbox overlay toggle */}
          <button
            onClick={() => setShowHitboxes(!showHitboxes)}
            title="Toggle Hitboxes / Hurtboxes"
            className={`p-1 rounded transition-colors ${
              showHitboxes ? 'text-accent-amber bg-accent-amber/20' : 'hover:text-text-display'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
          </button>

          {/* Anchor toggle */}
          <button
            onClick={() => setShowAnchor(!showAnchor)}
            title="Toggle Anchor Pivot Crosshair"
            className={`p-1 rounded transition-colors ${
              showAnchor ? 'text-accent-amber bg-accent-amber/20' : 'hover:text-text-display'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Top-Right Telemetry Pill */}
        <div className="absolute top-2 right-2 z-20 flex items-center space-x-1.5 bg-dock/90 backdrop-blur-md px-2 py-1 rounded-md border border-border-subtle font-mono text-[10px]">
          <span className="text-accent-cyan font-bold">{fps} FPS</span>
          <span className="text-text-muted">•</span>
          <span className="text-text-display">
            {activeClip && activeClip.frameIds.length > 0
              ? `${String(currentFrameIndex + 1).padStart(2, '0')} / ${String(
                  activeClip.frameIds.length
                ).padStart(2, '0')}`
              : '00 / 00'}
          </span>
        </div>

        {/* Zoom controls for preview */}
        <div className="absolute bottom-2 right-2 z-20 flex items-center space-x-1 bg-dock/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-mono text-text-muted">
          <button
            onClick={() => setPreviewZoom(Math.max(1, previewZoom - 1))}
            className="hover:text-text-display px-1"
          >
            -
          </button>
          <span>{previewZoom}×</span>
          <button
            onClick={() => setPreviewZoom(Math.min(12, previewZoom + 1))}
            className="hover:text-text-display px-1"
          >
            +
          </button>
        </div>
      </div>

      {/* 2. MIDDLE TACTILE TRANSPORT CONTROLS */}
      <div className="p-3 bg-dock border-b border-border-subtle space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Step Back */}
            <button
              onClick={stepBackward}
              title="Step Frame Backward [A]"
              className="p-1.5 rounded bg-card hover:bg-border-subtle text-text-display transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Glowing Play / Pause Button */}
            <button
              onClick={togglePlay}
              title="Play / Pause Animation [Space]"
              className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-accent-emerald text-void flex items-center justify-center shadow-glow-cyan hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-void" />
              ) : (
                <Play className="w-5 h-5 fill-void ml-0.5" />
              )}
            </button>

            {/* Step Forward */}
            <button
              onClick={stepForward}
              title="Step Frame Forward [D]"
              className="p-1.5 rounded bg-card hover:bg-border-subtle text-text-display transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Loop Toggle */}
            <button
              onClick={toggleLoop}
              title="Loop Animation"
              className={`p-1.5 rounded transition-colors ${
                loop
                  ? 'bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/40'
                  : 'bg-card text-text-muted hover:text-text-display'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            {/* Ping-Pong Toggle */}
            <button
              onClick={togglePingPong}
              title="Ping-Pong Playback (Forward then Reverse)"
              className={`p-1.5 rounded transition-colors ${
                pingPong
                  ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/40'
                  : 'bg-card text-text-muted hover:text-text-display'
              }`}
            >
              <Repeat1 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* FPS Slider with direct readout */}
        <div className="bg-card p-2 rounded-lg border border-border-subtle flex items-center space-x-3">
          <span className="text-[11px] font-mono text-text-muted w-14">
            {fps} FPS
          </span>
          <input
            type="range"
            min="1"
            max="60"
            value={fps}
            onChange={(e) => handleFpsChange(parseInt(e.target.value) || 1)}
            className="flex-1 cursor-pointer h-1.5 bg-void rounded-lg"
          />
        </div>
      </div>

      {/* 3. CLIP MANAGER & FILMSTRIP */}
      <div className="p-3 bg-dock border-b border-border-subtle space-y-2.5">
        {/* Clip Selector Tabs */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-text-display text-[11px] uppercase tracking-wider text-text-muted">
            Animation Clips ({clips.length})
          </span>
          <button
            onClick={() => setIsCreatingClip(true)}
            title="Create New Clip"
            className="flex items-center space-x-1 text-[11px] font-medium text-accent-cyan hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Clip</span>
          </button>
        </div>

        {/* New Clip Input Dialog / Inline */}
        {isCreatingClip && (
          <div className="flex items-center space-x-1.5 bg-card p-1.5 rounded border border-accent-cyan">
            <input
              type="text"
              placeholder="Clip name (e.g. Roll, Hurt)..."
              value={newClipName}
              onChange={(e) => setNewClipName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateClipSubmit()}
              autoFocus
              className="bg-transparent text-xs text-text-display outline-none flex-1 px-1"
            />
            <button
              onClick={handleCreateClipSubmit}
              className="px-2 py-0.5 rounded bg-accent-cyan text-void text-[11px] font-bold"
            >
              Add
            </button>
            <button
              onClick={() => setIsCreatingClip(false)}
              className="px-1.5 py-0.5 rounded text-text-muted hover:text-text-display text-[11px]"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Clip Tabs */}
        <div className="flex flex-wrap gap-1">
          {clips.map((clip) => {
            const isActive = clip.id === activeClipId;
            return (
              <div
                key={clip.id}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-all ${
                  isActive
                    ? 'bg-accent-violet text-text-display font-semibold shadow-sm'
                    : 'bg-card text-text-muted hover:text-text-display hover:bg-border-subtle'
                }`}
              >
                <button
                  onClick={() => onSelectClip(clip.id)}
                  className="outline-none"
                >
                  {clip.name}
                  <span className="ml-1 text-[10px] opacity-70 font-mono">
                    ({clip.frameIds.length})
                  </span>
                </button>

                {isActive && clips.length > 1 && (
                  <button
                    onClick={() => onDeleteClip(clip.id)}
                    title="Delete Clip"
                    className="ml-1 opacity-70 hover:opacity-100 hover:text-accent-crimson"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Filmstrip with Frame Thumbnails */}
        {activeClip && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] text-text-muted font-mono block">
              Timeline Filmstrip (Drag to re-order • {activeClip.frameIds.length} frames)
            </span>

            <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 pt-1">
              {activeClip.frameIds.map((fId, idx) => {
                const f = frames[fId];
                if (!f) return null;
                const isCurrent = idx === currentFrameIndex;

                return (
                  <div
                    key={`${fId}_${idx}`}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setCurrentFrameIndex(idx)}
                    className={`relative flex-shrink-0 w-14 h-16 rounded bg-card border cursor-pointer group transition-all flex flex-col items-center justify-between p-1 ${
                      isCurrent
                        ? 'border-accent-cyan ring-2 ring-accent-cyan/50 shadow-glow-cyan'
                        : 'border-border-subtle hover:border-slate-600'
                    }`}
                  >
                    {/* Index header */}
                    <span className="text-[9px] font-mono text-text-muted">
                      #{idx + 1}
                    </span>

                    {/* Frame sprite preview snippet */}
                    <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                      {image && (
                        <div
                          style={{
                            width: f.sourceRect.width,
                            height: f.sourceRect.height,
                            backgroundImage: `url(${image.src})`,
                            backgroundPosition: `-${f.sourceRect.x}px -${f.sourceRect.y}px`,
                            transform: `scale(${Math.min(
                              28 / f.sourceRect.width,
                              28 / f.sourceRect.height
                            )})`,
                            imageRendering: 'pixelated',
                          }}
                        />
                      )}
                    </div>

                    {/* Remove frame from clip on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFrameFromClip(idx);
                      }}
                      title="Remove Frame from Clip"
                      className="absolute top-0.5 right-0.5 p-0.5 rounded bg-dock/80 text-text-muted hover:text-accent-crimson opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. HITBOX & ANCHOR INSPECTOR */}
      <HitboxInspector
        frame={activeFrame}
        onUpdateAnchor={(anchor) => {
          if (activeFrame) onUpdateFrameAnchor(activeFrame.id, anchor);
        }}
        onApplyAnchorToAll={() => {
          if (activeFrame) onApplyAnchorToAll(activeFrame.anchorPoint);
        }}
        onAddHitbox={(type) => {
          if (activeFrame) onAddHitbox(activeFrame.id, type);
        }}
        onUpdateHitbox={(hb) => {
          if (activeFrame) onUpdateHitbox(activeFrame.id, hb);
        }}
        onDeleteHitbox={(hbId) => {
          if (activeFrame) onDeleteHitbox(activeFrame.id, hbId);
        }}
      />
    </aside>
  );
};
