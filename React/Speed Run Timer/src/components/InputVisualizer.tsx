import React, { useState, useEffect } from 'react';

export const InputVisualizer: React.FC<{ apm?: number }> = ({ apm = 380 }) => {
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      setActiveKeys((prev) => ({ ...prev, [e.code]: true }));
    };
    const handleUp = (e: KeyboardEvent) => {
      setActiveKeys((prev) => ({ ...prev, [e.code]: false }));
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  const isPressed = (code: string) => !!activeKeys[code];

  return (
    <div className="flex items-center gap-3 p-2 bg-obsidian-void/80 rounded border border-obsidian-border text-[10px] font-mono">
      {/* Directional Pad */}
      <div className="flex items-center gap-1">
        <span className={`px-1.5 py-0.5 rounded border transition-colors ${isPressed('KeyA') || isPressed('ArrowLeft') ? 'bg-neon-cyan text-obsidian-void font-bold shadow-glow-cyan/50' : 'bg-obsidian-surface border-obsidian-border text-slate-500'}`}>
          ◀
        </span>
        <div className="flex flex-col gap-0.5">
          <span className={`px-1.5 py-0.5 rounded border transition-colors text-center ${isPressed('KeyW') || isPressed('ArrowUp') ? 'bg-neon-cyan text-obsidian-void font-bold shadow-glow-cyan/50' : 'bg-obsidian-surface border-obsidian-border text-slate-500'}`}>
            ▲
          </span>
          <span className={`px-1.5 py-0.5 rounded border transition-colors text-center ${isPressed('KeyS') || isPressed('ArrowDown') ? 'bg-neon-cyan text-obsidian-void font-bold shadow-glow-cyan/50' : 'bg-obsidian-surface border-obsidian-border text-slate-500'}`}>
            ▼
          </span>
        </div>
        <span className={`px-1.5 py-0.5 rounded border transition-colors ${isPressed('KeyD') || isPressed('ArrowRight') ? 'bg-neon-cyan text-obsidian-void font-bold shadow-glow-cyan/50' : 'bg-obsidian-surface border-obsidian-border text-slate-500'}`}>
          ▶
        </span>
      </div>

      {/* Action Triggers */}
      <div className="flex items-center gap-1">
        <span className={`px-2 py-1 rounded border font-bold transition-colors ${isPressed('Space') ? 'bg-neon-gold text-obsidian-void shadow-glow-gold/50' : 'bg-obsidian-surface border-obsidian-border text-slate-400'}`}>
          SPACE [SPLIT]
        </span>
        <span className={`px-1.5 py-1 rounded border transition-colors ${isPressed('KeyZ') ? 'bg-neon-emerald text-obsidian-void font-bold' : 'bg-obsidian-surface border-obsidian-border text-slate-500'}`}>
          Z
        </span>
        <span className={`px-1.5 py-1 rounded border transition-colors ${isPressed('KeyX') ? 'bg-neon-purple text-obsidian-void font-bold' : 'bg-obsidian-surface border-obsidian-border text-slate-500'}`}>
          X
        </span>
      </div>

      {/* APM Metric */}
      <div className="ml-auto flex items-center gap-1.5 pl-2 border-l border-obsidian-border">
        <span className="text-slate-400">APM:</span>
        <span className="text-neon-cyan font-bold">{apm}</span>
      </div>
    </div>
  );
};
