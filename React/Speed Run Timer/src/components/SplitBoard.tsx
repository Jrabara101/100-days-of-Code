import React from 'react';
import { 
  SplitSegmentDefinition, 
  PlayerSegmentRecord, 
  RaceParticipant 
} from '../types/race';
import { formatTime, formatDelta } from '../utils/formatters';
import { Star, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

interface SplitBoardProps {
  segments: SplitSegmentDefinition[];
  participant?: RaceParticipant;
  currentSplitIndex: number;
  highlightLeader?: boolean;
}

export const SplitBoard: React.FC<SplitBoardProps> = ({
  segments,
  participant,
  currentSplitIndex,
}) => {
  const completedSplits = participant?.completedSplits || [];

  // Calculate run completion percentage
  const totalSegments = segments.length;
  const completedCount = completedSplits.length;
  const progressPercent = totalSegments > 0 
    ? Math.min(100, Math.round((completedCount / totalSegments) * 100))
    : 0;

  return (
    <div className="w-full flex flex-col bg-obsidian-surface/60 rounded-[4px] border border-obsidian-border overflow-hidden shadow-xl">
      {/* Progress Track */}
      <div className="w-full bg-obsidian-void h-1.5 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-neon-cyan via-neon-emerald to-neon-gold transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-12 px-3 py-2 bg-obsidian-base/80 border-b border-obsidian-border text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
        <div className="col-span-5 flex items-center gap-1">
          <span>SEGMENT</span>
        </div>
        <div className="col-span-2 text-right">BEST (GOLD)</div>
        <div className="col-span-2 text-right">PB SPLIT</div>
        <div className="col-span-3 text-right">LIVE / DELTA</div>
      </div>

      {/* Split Rows */}
      <div className="divide-y divide-obsidian-border/40 max-h-[420px] overflow-y-auto custom-scrollbar">
        {segments.map((segment, index) => {
          const splitRecord = completedSplits.find(s => s.splitIndex === index);
          const isCurrent = index === currentSplitIndex && !participant?.hasFinished;
          const isCompleted = splitRecord !== undefined;
          const isGold = splitRecord?.isGold;

          const deltaInfo = splitRecord ? formatDelta(splitRecord.deltaVsPbMs) : null;

          return (
            <div
              key={segment.id}
              className={`grid grid-cols-12 px-3 py-2 text-xs font-mono items-center transition-colors ${
                isCurrent 
                  ? 'bg-neon-cyan/10 border-l-2 border-neon-cyan text-slate-100 font-bold animate-pulse-fast' 
                  : isGold
                  ? 'bg-neon-gold/10 border-l-2 border-neon-gold'
                  : isCompleted
                  ? 'bg-obsidian-base/30 text-slate-200'
                  : 'text-slate-400 hover:bg-white/[0.02]'
              }`}
            >
              {/* Segment Name */}
              <div className="col-span-5 flex items-center gap-2 truncate pr-2">
                <span className="text-[10px] text-slate-400 font-semibold w-4">
                  {index + 1}.
                </span>
                <span className={`truncate ${isCurrent ? 'text-neon-cyan font-bold' : isGold ? 'text-neon-gold font-bold' : ''}`}>
                  {segment.name}
                </span>
                {isGold && (
                  <Star className="h-3 w-3 text-neon-gold fill-neon-gold shrink-0 animate-spin" />
                )}
                {isCurrent && (
                  <ChevronRight className="h-3 w-3 text-neon-cyan shrink-0 animate-bounce" />
                )}
              </div>

              {/* Best Segment (Gold) Duration */}
              <div className="col-span-2 text-right text-[11px] text-slate-400 tabular-nums">
                {segment.goldSegmentDurationMs 
                  ? formatTime(segment.goldSegmentDurationMs, true) 
                  : '--:--'}
              </div>

              {/* Personal Best Cumulative Split */}
              <div className="col-span-2 text-right text-[11px] text-slate-300 tabular-nums">
                {segment.personalBestSplitMs 
                  ? formatTime(segment.personalBestSplitMs, false) 
                  : '--:--'}
              </div>

              {/* Current Elapsed & Delta Tag */}
              <div className="col-span-3 text-right flex items-center justify-end gap-1.5 tabular-nums">
                {splitRecord ? (
                  <>
                    <span className="font-bold text-slate-100">
                      {formatTime(splitRecord.completedAtMs, true)}
                    </span>
                    {deltaInfo && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          isGold
                            ? 'bg-neon-gold/20 text-neon-gold border border-neon-gold/40'
                            : deltaInfo.isAhead
                            ? 'bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/40'
                            : 'bg-neon-ruby/20 text-neon-ruby border border-neon-ruby/40'
                        }`}
                      >
                        {deltaInfo.text}
                      </span>
                    )}
                  </>
                ) : isCurrent ? (
                  <span className="text-neon-cyan text-[11px] font-bold flex items-center gap-1 animate-pulse">
                    <Zap className="h-3 w-3" />
                    IN SECTOR
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">-:--.--</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
