import React, { useRef, useState, useEffect } from 'react';
import {
  Copy,
  FlipHorizontal,
  Trash2,
  BringToFront,
  SendToBack,
  RotateCw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { EmojiSticker } from '../types';
import { sound } from '../utils/soundEngine';

interface StickerItemProps {
  sticker: EmojiSticker;
  isSelected: boolean;
  isDark?: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onSelect: () => void;
  onUpdate: (updates: Partial<EmojiSticker>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

export const StickerItem: React.FC<StickerItemProps> = ({
  sticker,
  isSelected,
  isDark = false,
  containerRef,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: sticker.x,
    initY: sticker.y,
  });

  // Dragging sticker position in percent
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: sticker.x,
      initY: sticker.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const deltaPercentX = (deltaX / rect.width) * 100;
    const deltaPercentY = (deltaY / rect.height) * 100;

    const newX = Math.max(2, Math.min(98, dragStartRef.current.initX + deltaPercentX));
    const newY = Math.max(2, Math.min(98, dragStartRef.current.initY + deltaPercentY));

    onUpdate({ x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      sound.playPop();
    }
  };

  // Rotation Handle
  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsRotating(true);
  };

  useEffect(() => {
    if (!isRotating) return;

    const handleRotateMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const stickerPixelX = rect.left + (sticker.x / 100) * rect.width;
      const stickerPixelY = rect.top + (sticker.y / 100) * rect.height;

      const angleRad = Math.atan2(e.clientY - stickerPixelY, e.clientX - stickerPixelX);
      let angleDeg = Math.round((angleRad * 180) / Math.PI) - 90;
      if (angleDeg < -180) angleDeg += 360;
      if (angleDeg > 180) angleDeg -= 360;

      onUpdate({ rotation: angleDeg });
    };

    const handleRotateEnd = () => {
      setIsRotating(false);
      sound.playPop();
    };

    window.addEventListener('pointermove', handleRotateMove);
    window.addEventListener('pointerup', handleRotateEnd);

    return () => {
      window.removeEventListener('pointermove', handleRotateMove);
      window.removeEventListener('pointerup', handleRotateEnd);
    };
  }, [isRotating, containerRef, sticker.x, sticker.y, onUpdate]);

  // Animation CSS selector
  const animClass =
    sticker.animation === 'bounce'
      ? 'animate-sticker-bounce'
      : sticker.animation === 'float'
      ? 'animate-sticker-float'
      : sticker.animation === 'wobble'
      ? 'animate-sticker-wobble'
      : sticker.animation === 'pulse'
      ? 'animate-sticker-pulse'
      : sticker.animation === 'shake'
      ? 'animate-sticker-shake'
      : '';

  const cycleAnimation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const anims: (EmojiSticker['animation'] | undefined)[] = ['bounce', 'float', 'wobble', 'pulse', 'shake', undefined];
    const currIdx = anims.indexOf(sticker.animation);
    const nextAnim = anims[(currIdx + 1) % anims.length];
    onUpdate({ animation: nextAnim });
    sound.playSquish();
  };

  return (
    <div
      style={{
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1}) ${
          sticker.flipped ? 'scaleX(-1)' : ''
        }`,
        zIndex: isSelected ? 40 : sticker.zIndex || 20,
      }}
      className={`absolute cursor-move touch-none select-none transition-transform duration-75 ${
        isDragging ? 'opacity-80 scale-105' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Active selection bounding box */}
      {isSelected && (
        <div
          className={`absolute -inset-2.5 rounded-2xl border-2 pointer-events-none ${
            isDark
              ? 'border-amber-400 bg-amber-400/10 shadow-brutal-glow'
              : 'border-dashed border-berry-red bg-rose-200/25 shadow-clay-card'
          }`}
        >
          {/* Corner handles */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-berry-red border border-white shadow-sm" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-berry-red border border-white shadow-sm" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-berry-red border border-white shadow-sm" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-berry-red border border-white shadow-sm" />

          {/* Top Rotation handle */}
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-400 border border-white shadow-sm flex items-center justify-center cursor-grab active:cursor-grabbing pointer-events-auto"
            onPointerDown={handleRotateStart}
            title="Drag to rotate sticker"
          >
            <RotateCw className="w-2.5 h-2.5 text-stone-900" />
          </div>
        </div>
      )}

      {/* Emoji Character */}
      <div
        className={`text-6xl sm:text-7xl filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.2)] ${animClass} hover:scale-105 transition-transform`}
      >
        {sticker.char}
      </div>

      {/* Floating Action Menu for Selected Sticker */}
      {isSelected && (
        <div
          className={`absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full border shadow-xl z-50 pointer-events-auto backdrop-blur-md ${
            isDark
              ? 'bg-[#10131a]/95 border-[#374151] text-stone-200 shadow-brutal-hard'
              : 'bg-white/95 border-rose-100 text-stone-800 shadow-clay-card'
          }`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Duplicate */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-700 clay-puffy"
            title="Duplicate Sticker"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Flip Horizontal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ flipped: !sticker.flipped });
              sound.playPop();
            }}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-700 clay-puffy"
            title="Flip Horizontal"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Scale Up / Down */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ scale: Math.max(0.6, Math.round((sticker.scale - 0.2) * 10) / 10) });
              sound.playPop();
            }}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-700 clay-puffy"
            title="Decrease Size"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ scale: Math.min(3.5, Math.round((sticker.scale + 0.2) * 10) / 10) });
              sound.playPop();
            }}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-700 clay-puffy"
            title="Increase Size"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Animation Toggle */}
          <button
            onClick={cycleAnimation}
            className={`p-1 rounded-lg clay-puffy ${
              sticker.animation ? 'bg-amber-100 text-amber-800 font-bold' : 'hover:bg-stone-100 text-stone-700'
            }`}
            title={`Animation: ${sticker.animation || 'None'} (Click to cycle)`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Layer Controls */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBringToFront();
            }}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-700 clay-puffy"
            title="Bring to Front"
          >
            <BringToFront className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendToBack();
            }}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-700 clay-puffy"
            title="Send to Back"
          >
            <SendToBack className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-stone-200" />

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 clay-puffy"
            title="Delete Sticker"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
