import React, { useRef, useState, useCallback, useEffect } from 'react';

interface VirtualJoystickProps {
  onMoveVector: (dx: number, dy: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMoveVector }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const radius = 45; // Max knob displacement

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setActive(true);
    updateVector(e.clientX, e.clientY);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!active) return;
      updateVector(e.clientX, e.clientY);
    },
    [active]
  );

  const handlePointerUp = useCallback(() => {
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMoveVector(0, 0);
  }, [onMoveVector]);

  useEffect(() => {
    if (active) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [active, handlePointerMove, handlePointerUp]);

  const updateVector = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const diffX = clientX - centerX;
    const diffY = clientY - centerY;
    const dist = Math.sqrt(diffX * diffX + diffY * diffY);

    if (dist === 0) {
      setKnobPos({ x: 0, y: 0 });
      onMoveVector(0, 0);
      return;
    }

    const clampedDist = Math.min(radius, dist);
    const normX = diffX / dist;
    const normY = diffY / dist;

    setKnobPos({
      x: normX * clampedDist,
      y: normY * clampedDist,
    });

    onMoveVector(normX * (clampedDist / radius), normY * (clampedDist / radius));
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="pointer-events-auto relative w-28 h-28 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700/60 shadow-2xl flex items-center justify-center touch-none select-none"
    >
      {/* Center base ring */}
      <div className="w-12 h-12 rounded-full border border-slate-700/40" />

      {/* Draggable Knob */}
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
        className={`absolute w-12 h-12 rounded-full border shadow-xl flex items-center justify-center transition-transform duration-75 ${
          active
            ? 'bg-amber-500/80 border-amber-300 scale-110 shadow-amber-500/30'
            : 'bg-slate-800/80 border-slate-600'
        }`}
      >
        <div className="w-3 h-3 rounded-full bg-white/70" />
      </div>
    </div>
  );
};
