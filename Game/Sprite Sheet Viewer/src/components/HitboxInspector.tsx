import React from 'react';
import {
  Crosshair,
  Shield,
  Sword,
  BoxSelect,
  Plus,
  Trash2,
  Copy,
} from 'lucide-react';
import { BoundingBox, HitboxType, SpriteFrame } from '../types/sprite';

interface HitboxInspectorProps {
  frame: SpriteFrame | null;
  onUpdateAnchor: (anchor: { x: number; y: number }) => void;
  onApplyAnchorToAll: () => void;
  onAddHitbox: (type: HitboxType) => void;
  onUpdateHitbox: (hitbox: BoundingBox) => void;
  onDeleteHitbox: (id: string) => void;
}

export const HitboxInspector: React.FC<HitboxInspectorProps> = ({
  frame,
  onUpdateAnchor,
  onApplyAnchorToAll,
  onAddHitbox,
  onUpdateHitbox,
  onDeleteHitbox,
}) => {
  if (!frame) {
    return (
      <div className="p-4 text-center text-text-muted text-xs">
        Select a frame to edit anchor &amp; hitboxes
      </div>
    );
  }

  const { sourceRect, anchorPoint, hitboxes } = frame;

  // Preset anchor points
  const setAnchorBottomCenter = () => {
    onUpdateAnchor({
      x: Math.round(sourceRect.width / 2),
      y: sourceRect.height,
    });
  };

  const setAnchorTrueCenter = () => {
    onUpdateAnchor({
      x: Math.round(sourceRect.width / 2),
      y: Math.round(sourceRect.height / 2),
    });
  };

  const setAnchorTopLeft = () => {
    onUpdateAnchor({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-3 p-3 bg-dock border-t border-border-subtle text-xs select-none">
      {/* Anchor Pivot Pin Section */}
      <div className="space-y-2 bg-card p-2.5 rounded-lg border border-border-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 font-semibold text-text-display">
            <Crosshair className="w-3.5 h-3.5 text-accent-amber" />
            <span>Anchor Pivot Point</span>
          </div>
          <button
            onClick={onApplyAnchorToAll}
            title="Apply this anchor coordinate to all frames in the atlas"
            className="flex items-center space-x-1 text-[10px] text-text-muted hover:text-accent-amber transition-colors"
          >
            <Copy className="w-3 h-3" />
            <span>Apply to All</span>
          </button>
        </div>

        {/* Anchor X/Y Coordinates */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-text-muted font-mono block mb-0.5">
              Anchor X (px)
            </span>
            <input
              type="number"
              value={anchorPoint.x}
              onChange={(e) =>
                onUpdateAnchor({ ...anchorPoint, x: parseInt(e.target.value) || 0 })
              }
              className="w-full bg-void border border-border-subtle rounded px-2 py-0.5 font-mono text-text-display focus:border-accent-amber outline-none"
            />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-mono block mb-0.5">
              Anchor Y (px)
            </span>
            <input
              type="number"
              value={anchorPoint.y}
              onChange={(e) =>
                onUpdateAnchor({ ...anchorPoint, y: parseInt(e.target.value) || 0 })
              }
              className="w-full bg-void border border-border-subtle rounded px-2 py-0.5 font-mono text-text-display focus:border-accent-amber outline-none"
            />
          </div>
        </div>

        {/* Quick Pivot Presets */}
        <div className="grid grid-cols-3 gap-1 pt-1">
          <button
            onClick={setAnchorBottomCenter}
            className="py-1 text-[10px] font-mono rounded bg-void hover:bg-border-subtle text-text-muted hover:text-text-display border border-border-subtle transition-colors"
          >
            Ground Center
          </button>
          <button
            onClick={setAnchorTrueCenter}
            className="py-1 text-[10px] font-mono rounded bg-void hover:bg-border-subtle text-text-muted hover:text-text-display border border-border-subtle transition-colors"
          >
            True Center
          </button>
          <button
            onClick={setAnchorTopLeft}
            className="py-1 text-[10px] font-mono rounded bg-void hover:bg-border-subtle text-text-muted hover:text-text-display border border-border-subtle transition-colors"
          >
            Top-Left (0,0)
          </button>
        </div>
      </div>

      {/* Hitboxes / Hurtboxes / Colliders List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-text-display text-[11px] uppercase tracking-wider text-text-muted">
            Hitboxes ({hitboxes.length})
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onAddHitbox('hurtbox')}
              title="Add Amber Hurtbox"
              className="p-1 rounded bg-accent-amber/20 hover:bg-accent-amber/30 text-accent-amber border border-accent-amber/40 transition-colors"
            >
              <Shield className="w-3 h-3" />
            </button>
            <button
              onClick={() => onAddHitbox('hitbox')}
              title="Add Crimson Hitbox / Attack Damage"
              className="p-1 rounded bg-accent-crimson/20 hover:bg-accent-crimson/30 text-accent-crimson border border-accent-crimson/40 transition-colors"
            >
              <Sword className="w-3 h-3" />
            </button>
            <button
              onClick={() => onAddHitbox('collision')}
              title="Add Emerald Collision / Terrain Box"
              className="p-1 rounded bg-accent-emerald/20 hover:bg-accent-emerald/30 text-accent-emerald border border-accent-emerald/40 transition-colors"
            >
              <BoxSelect className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Hitbox items */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {hitboxes.map((hb) => {
            const isHurt = hb.type === 'hurtbox';
            const isHit = hb.type === 'hitbox';
            const isCol = hb.type === 'collision';

            const badgeColor = isHit
              ? 'bg-accent-crimson text-void'
              : isHurt
              ? 'bg-accent-amber text-void'
              : 'bg-accent-emerald text-void';

            return (
              <div
                key={hb.id}
                className="bg-card p-2 rounded-lg border border-border-subtle space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded ${badgeColor}`}
                    >
                      {hb.type}
                    </span>
                    <input
                      type="text"
                      value={hb.label || ''}
                      placeholder="Label..."
                      onChange={(e) => onUpdateHitbox({ ...hb, label: e.target.value })}
                      className="bg-transparent text-[11px] font-medium text-text-display outline-none w-24 hover:border-b border-border-subtle"
                    />
                  </div>
                  <button
                    onClick={() => onDeleteHitbox(hb.id)}
                    title="Delete Hitbox"
                    className="text-text-muted hover:text-accent-crimson transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1 font-mono text-[10px]">
                  <div>
                    <span className="text-text-muted block">X</span>
                    <input
                      type="number"
                      value={hb.x}
                      onChange={(e) =>
                        onUpdateHitbox({ ...hb, x: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-void border border-border-subtle rounded px-1 py-0.5 text-text-display outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-text-muted block">Y</span>
                    <input
                      type="number"
                      value={hb.y}
                      onChange={(e) =>
                        onUpdateHitbox({ ...hb, y: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-void border border-border-subtle rounded px-1 py-0.5 text-text-display outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-text-muted block">W</span>
                    <input
                      type="number"
                      value={hb.width}
                      onChange={(e) =>
                        onUpdateHitbox({ ...hb, width: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-full bg-void border border-border-subtle rounded px-1 py-0.5 text-text-display outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-text-muted block">H</span>
                    <input
                      type="number"
                      value={hb.height}
                      onChange={(e) =>
                        onUpdateHitbox({
                          ...hb,
                          height: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full bg-void border border-border-subtle rounded px-1 py-0.5 text-text-display outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
