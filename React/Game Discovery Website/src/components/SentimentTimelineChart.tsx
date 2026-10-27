import React, { useState } from 'react';
import { ReviewTimelineBucket, PatchMilestone } from '../types/game';
import { AlertTriangle, Tag, Calendar, Info, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SentimentTimelineChartProps {
  timelineBuckets: ReviewTimelineBucket[];
  patchNotes?: PatchMilestone[];
  anomalyDetected?: boolean;
  anomalyMessage?: string;
  selectedPatch?: string;
  onSelectPatch?: (patchVersion: string) => void;
}

export function SentimentTimelineChart({
  timelineBuckets,
  patchNotes = [],
  anomalyDetected = false,
  anomalyMessage,
  selectedPatch,
  onSelectPatch,
}: SentimentTimelineChartProps) {
  const [hoveredBucket, setHoveredBucket] = useState<ReviewTimelineBucket | null>(null);

  // Maximum review count in any period for scaling
  const maxVolume = Math.max(
    1,
    ...timelineBuckets.map((b) => Math.max(b.positive, b.negative))
  );

  return (
    <div className="w-full bg-[#101622] rounded-2xl border border-white/10 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-display text-white tracking-wide">
              PLAYTIME-WEIGHTED SENTIMENT & PATCH TIMELINE
            </h3>
            <span className="text-xs font-mono text-[#94A3B8] bg-[#192234] px-2 py-0.5 rounded border border-white/5">
              Historical Histogram
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Volume of verified player reviews mapped against major developer patch milestones.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#38BDF8]" />
            <span className="text-[#94A3B8]">Positive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#F43F5E]" />
            <span className="text-[#94A3B8]">Negative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#F59E0B]" />
            <span className="text-[#F59E0B]">Patch Release</span>
          </div>
        </div>
      </div>

      {/* Authoritative Anti-Brigading Anomaly Banner */}
      {anomalyDetected && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-start gap-3 animate-in fade-in duration-200">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-amber-300">
                Authoritative Anti-Brigading Ledger
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Anomaly Filter Active
              </span>
            </div>
            <p className="text-xs leading-relaxed text-amber-100/90">
              {anomalyMessage ||
                'Off-Topic Review Activity Detected: Statistical anomaly (>3σ deviation) flagged. Outlier reviews have been isolated to protect catalog score integrity.'}
            </p>
          </div>
        </div>
      )}

      {/* Dual-Bar Histogram Area */}
      <div className="relative pt-6 pb-2">
        {/* Chart Columns Grid */}
        <div className="flex items-end justify-between gap-2 h-48 border-b border-white/10 px-2 relative">
          {timelineBuckets.map((bucket, idx) => {
            const posHeight = (bucket.positive / maxVolume) * 160;
            const negHeight = (bucket.negative / maxVolume) * 160;
            const hasPatch = !!bucket.associatedPatch;
            const isSelected = selectedPatch && bucket.associatedPatch?.version === selectedPatch;

            return (
              <div
                key={bucket.period}
                onMouseEnter={() => setHoveredBucket(bucket)}
                onMouseLeave={() => setHoveredBucket(null)}
                onClick={() => {
                  if (bucket.associatedPatch && onSelectPatch) {
                    onSelectPatch(bucket.associatedPatch.version);
                  }
                }}
                className={cn(
                  'flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group transition-all',
                  isSelected && 'scale-105'
                )}
              >
                {/* Vertical Dashed Patch Milestone Marker */}
                {hasPatch && (
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
                    <div className="w-0.5 h-full border-l-2 border-dashed border-[#F59E0B]/70" />
                    <div className="absolute -top-6 px-1.5 py-0.5 rounded bg-[#F59E0B] text-black font-mono font-extrabold text-[9px] shadow-md whitespace-nowrap">
                      {bucket.associatedPatch?.version}
                    </div>
                  </div>
                )}

                {/* Bars Stack: Positive on top, Negative on bottom or side by side */}
                <div className="flex items-end gap-1 w-full max-w-[32px] justify-center z-0">
                  {/* Positive bar */}
                  <div
                    style={{ height: `${Math.max(4, posHeight)}px` }}
                    className="w-1/2 bg-[#38BDF8] rounded-t-sm group-hover:brightness-125 transition-all shadow-sm"
                  />
                  {/* Negative bar */}
                  <div
                    style={{ height: `${Math.max(4, negHeight)}px` }}
                    className={cn(
                      'w-1/2 rounded-t-sm group-hover:brightness-125 transition-all shadow-sm',
                      bucket.isAnomaly ? 'bg-[#F43F5E] animate-pulse' : 'bg-[#F43F5E]/80'
                    )}
                  />
                </div>

                {/* Period label */}
                <span className="text-[10px] font-mono text-[#94A3B8] mt-2 group-hover:text-white">
                  {bucket.period.split('-')[1]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hovered Bucket Detailed Card Tooltip */}
        {hoveredBucket && (
          <div className="mt-4 p-3 rounded-xl bg-[#192234] border border-white/10 text-xs font-mono flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-100">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">PERIOD: {hoveredBucket.period}</span>
              <span className="text-[#38BDF8]">
                ✓ {hoveredBucket.positive} Positive
              </span>
              <span className="text-[#F43F5E]">
                ✕ {hoveredBucket.negative} Negative
              </span>
              <span className="text-white/80">
                Ratio: <strong className="text-cyan-400">{hoveredBucket.ratio}%</strong>
              </span>
            </div>

            {hoveredBucket.associatedPatch && (
              <div className="flex items-center gap-2 text-[#F59E0B]">
                <Tag className="w-3.5 h-3.5" />
                <span className="font-bold">
                  {hoveredBucket.associatedPatch.version}: "{hoveredBucket.associatedPatch.title}"
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Patch Milestone Quick Selector Pills */}
      {patchNotes.length > 0 && (
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-[#94A3B8] font-bold">PATCH OVERVIEW:</span>
          {patchNotes.map((p) => {
            const isSelected = selectedPatch === p.version;
            return (
              <button
                key={p.version}
                onClick={() => onSelectPatch && onSelectPatch(isSelected ? 'all' : p.version)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono border transition-all',
                  isSelected
                    ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50 font-bold'
                    : 'bg-[#192234] text-[#94A3B8] border-white/5 hover:text-white'
                )}
              >
                <span>{p.version}</span>
                <span className="text-white/60">({p.title})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
