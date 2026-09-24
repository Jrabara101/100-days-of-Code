import React, { useRef, useState } from 'react';
import { Trash2, MessageCircle, MessageSquare } from 'lucide-react';
import { SpeechBubble } from '../types';
import { sound } from '../utils/soundEngine';

interface SpeechBubbleItemProps {
  bubble: SpeechBubble;
  isSelected: boolean;
  isDark?: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onSelect: () => void;
  onUpdate: (updates: Partial<SpeechBubble>) => void;
  onDelete: () => void;
}

export const SpeechBubbleItem: React.FC<SpeechBubbleItemProps> = ({
  bubble,
  isSelected,
  isDark = false,
  containerRef,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: bubble.x,
    initY: bubble.y,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: bubble.x,
      initY: bubble.y,
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

    const newX = Math.max(5, Math.min(95, dragStartRef.current.initX + deltaPercentX));
    const newY = Math.max(5, Math.min(95, dragStartRef.current.initY + deltaPercentY));

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

  // Tail styling
  const isBottomLeft = bubble.tailDirection === 'bottom-left';
  const isBottomRight = bubble.tailDirection === 'bottom-right';

  return (
    <div
      style={{
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 45 : 30,
      }}
      className={`absolute cursor-move select-none touch-none transition-transform max-w-[280px] sm:max-w-[340px] ${
        isDragging ? 'opacity-85 scale-102' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={() => setIsEditing(true)}
    >
      <div
        className={`relative p-3 rounded-3xl border-2 shadow-clay-card transition-all ${
          bubble.type === 'thought'
            ? 'wobbly-thought'
            : isBottomRight
            ? 'wobbly-bubble-alt'
            : 'wobbly-bubble'
        } ${
          isDark
            ? 'bg-[#1e2330] text-stone-100 border-[#374151]'
            : 'bg-white text-stone-800 border-rose-200'
        } ${isSelected ? 'ring-2 ring-berry-red shadow-lg' : ''}`}
      >
        {/* Tail triangle */}
        {bubble.type !== 'thought' && (
          <div
            className={`absolute w-0 h-0 border-t-[10px] ${
              isDark ? 'border-t-[#1e2330]' : 'border-t-white'
            } ${
              isBottomLeft
                ? '-bottom-2.5 left-5 border-r-[10px] border-r-transparent'
                : '-bottom-2.5 right-6 border-l-[10px] border-l-transparent'
            }`}
          />
        )}

        {/* Thought bubbles circles */}
        {bubble.type === 'thought' && (
          <>
            <div className="absolute -bottom-2 left-6 w-3 h-3 rounded-full bg-white border border-rose-200" />
            <div className="absolute -bottom-4 left-4 w-2 h-2 rounded-full bg-white border border-rose-200" />
          </>
        )}

        {/* Decorative corner pin */}
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-berry-red border border-white shadow-sm flex items-center justify-center text-[8px] text-white">
          ★
        </div>

        {/* Content */}
        {isEditing ? (
          <textarea
            autoFocus
            value={bubble.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                setIsEditing(false);
              }
            }}
            className="w-full bg-transparent font-hand text-base leading-tight font-bold outline-none resize-none border-b border-berry-red"
            rows={2}
          />
        ) : (
          <p className="font-hand text-base leading-tight font-bold tracking-wide">
            {bubble.text}
          </p>
        )}

        {/* Mini action bar when selected */}
        {isSelected && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-full shadow-md border border-stone-200 z-50">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[10px] font-fredoka font-bold text-stone-700 px-1 hover:text-berry-red"
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
            <div className="h-2 w-px bg-stone-200" />
            <button
              onClick={() =>
                onUpdate({
                  tailDirection: isBottomLeft ? 'bottom-right' : 'bottom-left',
                })
              }
              className="text-[10px] font-fredoka font-bold text-stone-700 px-1 hover:text-berry-red"
              title="Flip Tail Direction"
            >
              Tail ↔
            </button>
            <div className="h-2 w-px bg-stone-200" />
            <button
              onClick={onDelete}
              className="p-0.5 text-rose-500 hover:text-rose-700"
              title="Delete Bubble"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
