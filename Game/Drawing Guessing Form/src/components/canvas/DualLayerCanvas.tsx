import React, { useState } from 'react';
import { Feather, Undo2, FileX2, Award } from 'lucide-react';
import { useCanvasEngine } from '@/hooks/useCanvasEngine';
import { ToolType, DrawAction, Player } from '@/types/game';
import { TimeVignette } from '@/components/react-bits/TimeVignette';
import { cn } from '@/lib/utils';

interface DualLayerCanvasProps {
  currentTool: ToolType;
  brushColor: string;
  brushSize: number;
  isDrawingEnabled: boolean;
  isBlindfold: boolean;
  isOneLineOnly: boolean;
  actions: DrawAction[];
  onCommitAction: (action: DrawAction) => void;
  onUndo: () => void;
  onClear: () => void;
  activeArtist?: Player;
  timeLeft: number;
  burstPoints?: number | null;
}

export const DualLayerCanvas: React.FC<DualLayerCanvasProps> = ({
  currentTool,
  brushColor,
  brushSize,
  isDrawingEnabled,
  isBlindfold,
  isOneLineOnly,
  actions,
  onCommitAction,
  onUndo,
  onClear,
  activeArtist,
  timeLeft,
  burstPoints,
}) => {
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const {
    layer1Ref,
    layer2Ref,
    containerRef,
    handlePointerDown,
    handlePointerMove,
    commitActiveStroke,
  } = useCanvasEngine({
    currentTool,
    brushColor,
    brushSize,
    isDrawingEnabled,
    isBlindfold,
    isOneLineOnly,
    actions,
    onCommitAction,
  });

  const handleClearWithShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
    onClear();
  };

  return (
    <section className="flex-1 flex flex-col items-center justify-center min-w-0 order-1 lg:order-2 w-full">
      {/* Spiral Sketchbook Cover */}
      <div
        className={cn(
          'relative w-full max-w-3xl bg-[#E2D6C0] rounded-2xl p-2 sm:p-3.5 shadow-sketchbook border border-[#BFAFA0] flex transition-transform',
          isShaking && 'animate-paper-shake'
        )}
      >
        {/* Spiral Wire Binding Ring Spine */}
        <div className="w-4 sm:w-5 flex flex-col justify-around py-3 shrink-0 items-center mr-1 select-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-2.5 rounded-full border-2 border-stone-600 bg-stone-300 shadow-sm mb-1.5"
            />
          ))}
        </div>

        {/* The Sketch Page Itself */}
        <div
          ref={containerRef}
          className="relative flex-1 aspect-[4/3] paper-texture rounded-xl shadow-inner border border-[#E0D5C3] overflow-hidden flex items-center justify-center touch-none select-none"
          onPointerLeave={() => {
            setCursorPos(null);
            commitActiveStroke();
          }}
          onPointerMove={(e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            setCursorPos({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }}
        >
          {/* Perforation dotted guide line near spiral */}
          <div className="absolute left-2 top-0 bottom-0 border-r border-dashed border-[#DDD0BC] pointer-events-none z-10" />

          {/* Dynamic Red/Amber Vignette when time drops <= 15s */}
          <TimeVignette timeLeft={timeLeft} active={timeLeft <= 15} />

          {/* LAYER 1: Background & Committed Artwork Canvas */}
          <canvas
            ref={layer1Ref}
            className="absolute inset-0 w-full h-full block cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={commitActiveStroke}
            onPointerCancel={commitActiveStroke}
          />

          {/* LAYER 2: Dynamic Live Drawing Preview Canvas */}
          <canvas
            ref={layer2Ref}
            className="absolute inset-0 w-full h-full block pointer-events-none"
          />

          {/* Custom Studio Cursor Preview Ring */}
          {cursorPos && isDrawingEnabled && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full border border-studio-sienna transition-opacity duration-75"
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`,
                width: `${Math.max(brushSize, 8)}px`,
                height: `${Math.max(brushSize, 8)}px`,
                backgroundColor:
                  currentTool === 'eraser' ? 'rgba(255,255,255,0.4)' : `${brushColor}33`,
              }}
            />
          )}

          {/* Active Artist Ribbon / Label */}
          <div className="absolute top-2.5 left-4 z-20 flex items-center gap-1.5 bg-studio-paper/90 backdrop-blur-sm border border-[#D5C7B0] px-2.5 py-1 rounded-full text-xs font-serif font-bold text-studio-ink shadow-sm pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-studio-moss animate-ping" />
            <Feather className="w-3 h-3 text-studio-sienna" />
            <span>
              {activeArtist?.username || 'Alex'}{' '}
              <span className="text-studio-charcoal font-normal">
                {isDrawingEnabled ? '(You are sketching)' : '(Sketching now...)'}
              </span>
            </span>
          </div>

          {/* Quick Page Actions for active artist */}
          {isDrawingEnabled && (
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-studio-paper/90 backdrop-blur-sm border border-[#D5C7B0] p-1 rounded-xl shadow-sm">
              <button
                onClick={onUndo}
                className="p-1.5 rounded-lg text-studio-charcoal hover:text-studio-ink hover:bg-white active:scale-95 transition"
                title="Undo Last Stroke"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClearWithShake}
                className="p-1.5 rounded-lg text-studio-charcoal hover:text-studio-sienna hover:bg-studio-sienna/10 active:scale-95 transition"
                title="Fresh Blank Page"
              >
                <FileX2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Floating Points Burst Notification (Stamp Style) */}
          {burstPoints && (
            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
              <div className="animate-float-up px-4 py-2 rounded-full bg-studio-moss font-serif font-bold text-white text-sm shadow-xl flex items-center gap-2 border border-emerald-200">
                <Award className="w-4 h-4 text-amber-300" />
                <span>+{burstPoints} PTS WAXY SEAL!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Handcrafted Footer Subtitle */}
      <div className="w-full max-w-3xl mt-1.5 px-2 flex items-center justify-between text-[11px] text-[#CBB9A7] font-serif italic">
        <span>Studio Desk No. 4 • Pressed Cotton Surface</span>
        <span className="font-hand text-amber-200/90 text-sm font-bold">
          {isDrawingEnabled
            ? 'Use smooth strokes for quick guesses!'
            : 'Type your guess in the Den Parchment Chat!'}
        </span>
      </div>
    </section>
  );
};
