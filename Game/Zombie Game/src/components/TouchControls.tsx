import React, { useRef, useState, useCallback, useEffect } from 'react';
import { RotateCcw, ChevronRight } from 'lucide-react';

interface TouchControlsProps {
  onMove: (dx: number, dy: number) => void;
  onAim: (angle: number, isFiring: boolean) => void;
  onReload: () => void;
  onSwitchWeapon: () => void;
}

export function TouchControls({ onMove, onAim, onReload, onSwitchWeapon }: TouchControlsProps) {
  // Movement Stick Ref & State
  const moveTouchId = useRef<number | null>(null);
  const moveCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [movePos, setMovePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Aim Stick Ref & State
  const aimTouchId = useRef<number | null>(null);
  const aimCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [aimPos, setAimPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const radius = 50;

  // Handle Touch Move Stick
  const handleMoveStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    moveTouchId.current = touch.identifier;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    moveCenter.current = { x: cx, y: cy };
  };

  const handleMoveChange = useCallback((e: TouchEvent) => {
    if (moveTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === moveTouchId.current) {
        const dx = touch.clientX - moveCenter.current.x;
        const dy = touch.clientY - moveCenter.current.y;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, radius);
        const angle = Math.atan2(dy, dx);

        const nx = (Math.cos(angle) * clampedDist) / radius;
        const ny = (Math.sin(angle) * clampedDist) / radius;

        setMovePos({ x: Math.cos(angle) * clampedDist, y: Math.sin(angle) * clampedDist });
        onMove(nx, ny);
      }
    }
  }, [onMove]);

  const handleMoveEnd = useCallback((e: TouchEvent) => {
    if (moveTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === moveTouchId.current) {
        moveTouchId.current = null;
        setMovePos({ x: 0, y: 0 });
        onMove(0, 0);
      }
    }
  }, [onMove]);

  // Handle Aim & Fire Stick
  const handleAimStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    aimTouchId.current = touch.identifier;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    aimCenter.current = { x: cx, y: cy };
  };

  const handleAimChange = useCallback((e: TouchEvent) => {
    if (aimTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === aimTouchId.current) {
        const dx = touch.clientX - aimCenter.current.x;
        const dy = touch.clientY - aimCenter.current.y;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, radius);
        const angle = Math.atan2(dy, dx);

        setAimPos({ x: Math.cos(angle) * clampedDist, y: Math.sin(angle) * clampedDist });
        onAim(angle, dist > 15); // fire when pulled beyond threshold
      }
    }
  }, [onAim]);

  const handleAimEnd = useCallback((e: TouchEvent) => {
    if (aimTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === aimTouchId.current) {
        aimTouchId.current = null;
        setAimPos({ x: 0, y: 0 });
        onAim(0, false);
      }
    }
  }, [onAim]);

  useEffect(() => {
    window.addEventListener('touchmove', handleMoveChange, { passive: false });
    window.addEventListener('touchend', handleMoveEnd);
    window.addEventListener('touchcancel', handleMoveEnd);
    window.addEventListener('touchmove', handleAimChange, { passive: false });
    window.addEventListener('touchend', handleAimEnd);
    window.addEventListener('touchcancel', handleAimEnd);

    return () => {
      window.removeEventListener('touchmove', handleMoveChange);
      window.removeEventListener('touchend', handleMoveEnd);
      window.removeEventListener('touchcancel', handleMoveEnd);
      window.removeEventListener('touchmove', handleAimChange);
      window.removeEventListener('touchend', handleAimEnd);
      window.removeEventListener('touchcancel', handleAimEnd);
    };
  }, [handleMoveChange, handleMoveEnd, handleAimChange, handleAimEnd]);

  return (
    <div className="absolute inset-0 pointer-events-none z-40 select-none flex justify-between items-end p-6">
      {/* Left Locomotion Joystick */}
      <div
        onTouchStart={handleMoveStart}
        className="pointer-events-auto relative w-28 h-28 rounded-full border-2 border-emerald-500/40 bg-black/40 backdrop-blur-sm flex items-center justify-center touch-none"
      >
        <div
          className="w-12 h-12 rounded-full bg-emerald-500/80 shadow-[0_0_15px_#10B981] absolute pointer-events-none"
          style={{ transform: `translate(${movePos.x}px, ${movePos.y}px)` }}
        />
      </div>

      {/* Right Aim & Fire Joystick flanked by Action Buttons */}
      <div className="pointer-events-auto flex items-end gap-3 touch-none">
        {/* Rapid Action Buttons */}
        <div className="flex flex-col gap-2 mb-2">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onSwitchWeapon();
            }}
            className="w-14 h-14 rounded-full bg-[#13191C]/90 border border-amber-500/50 text-amber-400 font-mono text-xs flex flex-col items-center justify-center shadow-lg active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
            <span className="text-[9px]">WEP</span>
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onReload();
            }}
            className="w-14 h-14 rounded-full bg-red-950/80 border border-red-500/70 text-red-400 font-mono text-xs flex flex-col items-center justify-center shadow-lg active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[9px]">RELOAD</span>
          </button>
        </div>

        {/* Aim & Fire Joystick */}
        <div
          onTouchStart={handleAimStart}
          className="relative w-28 h-28 rounded-full border-2 border-red-500/40 bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <div
            className="w-12 h-12 rounded-full bg-red-500/80 shadow-[0_0_15px_#EF4444] absolute pointer-events-none"
            style={{ transform: `translate(${aimPos.x}px, ${aimPos.y}px)` }}
          />
        </div>
      </div>
    </div>
  );
}
