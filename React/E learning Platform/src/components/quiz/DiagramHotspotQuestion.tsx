import React from 'react';
import { HotspotArea } from '../../types';
import { sounds } from '../../services/audioEffects';

interface DiagramHotspotQuestionProps {
  hotspots?: HotspotArea[];
  selectedHotspotId?: string;
  isSubmitted: boolean;
  onSelectHotspot: (hotspotId: string) => void;
}

export const DiagramHotspotQuestion: React.FC<DiagramHotspotQuestionProps> = ({
  hotspots = [],
  selectedHotspotId,
  isSubmitted,
  onSelectHotspot
}) => {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#171B26] border border-black/10 dark:border-white/10 shadow-xs space-y-4">
      <div className="text-xs font-mono text-slate-500">
        Click directly on any node in the cluster diagram to select your answer:
      </div>

      <div className="relative aspect-video w-full rounded-xl bg-[#090B10] border border-black/10 dark:border-white/10 overflow-hidden flex items-center justify-center">
        {/* SVG Diagram Canvas */}
        <svg viewBox="0 0 600 340" className="w-full h-full">
          {/* Background Grid */}
          <defs>
            <pattern id="hotspot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="600" height="340" fill="url(#hotspot-grid)" />

          {/* Network Partition Wall */}
          <line x1="380" y1="20" x2="380" y2="320" stroke="#EF4444" strokeWidth="2.5" strokeDasharray="6,6" />
          <text x="390" y="45" fill="#EF4444" fontSize="10" fontFamily="monospace" fontWeight="bold">
            PARTITION WALL (CUT)
          </text>

          {/* Partition 1 Label (Majority Quorum = 3/5) */}
          <text x="30" y="40" fill="#10B981" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
            Partition 1 (Nodes A, B, C) — Quorum Majority (3/5)
          </text>

          {/* Partition 2 Label (Minority = 2/5) */}
          <text x="400" y="310" fill="#EF4444" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
            Partition 2 (Nodes D, E) — Minority (2/5)
          </text>

          {/* Connection Lines */}
          <line x1="120" y1="120" x2="240" y2="90" stroke="rgba(99,102,241,0.3)" strokeWidth="2" />
          <line x1="120" y1="120" x2="200" y2="230" stroke="rgba(99,102,241,0.3)" strokeWidth="2" />
          <line x1="240" y1="90" x2="200" y2="230" stroke="rgba(99,102,241,0.3)" strokeWidth="2" />
          <line x1="480" y1="110" x2="480" y2="230" stroke="rgba(239,68,68,0.3)" strokeWidth="2" />

          {/* Render Clickable Hotspot Nodes */}
          {hotspots.map(h => {
            const isSelected = selectedHotspotId === h.id;
            const cx = (h.xPercent / 100) * 600;
            const cy = (h.yPercent / 100) * 340;

            let nodeFill = '#171B26';
            let strokeColor = '#6366F1';
            if (isSubmitted) {
              if (h.isCorrect) strokeColor = '#10B981';
              else if (isSelected && !h.isCorrect) strokeColor = '#EF4444';
            } else if (isSelected) {
              strokeColor = '#F59E0B';
              nodeFill = '#312E81';
            }

            return (
              <g
                key={h.id}
                onClick={() => {
                  if (!isSubmitted) {
                    sounds.playClick();
                    onSelectHotspot(h.id);
                  }
                }}
                className="cursor-pointer group"
              >
                {/* Selection ring if selected */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="32"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="3"
                    strokeDasharray="4,4"
                    className="animate-spin-slow"
                  />
                )}

                {/* Node Circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="24"
                  fill={nodeFill}
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  className="transition-transform group-hover:scale-110"
                />

                {/* Node Label Text */}
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  {h.id.replace('node-', '').toUpperCase()}
                </text>

                {/* Subtitle label */}
                <text
                  x={cx}
                  y={cy + 35}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {h.label.split('(')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Status preview */}
      {selectedHotspotId && (
        <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono flex items-center justify-between">
          <span>Selected Target: <strong>{selectedHotspotId.toUpperCase()}</strong></span>
          <span className="text-indigo-500">Click Check Answer below to lock in</span>
        </div>
      )}
    </div>
  );
};

