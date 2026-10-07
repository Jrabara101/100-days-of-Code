import React from 'react';
import { 
  SplitSegmentDefinition, 
  RaceParticipant, 
  MultiplayerRaceState 
} from '../types/race';
import { MainTimerDisplay } from './MainTimerDisplay';
import { formatTime, formatDelta } from '../utils/formatters';
import { Button, Badge } from './ui/primitives';
import { Star, ChevronRight, Users, Play, RotateCcw, SkipForward, Undo2, Flame } from 'lucide-react';
import { InputVisualizer } from './InputVisualizer';

interface RunnerViewportProps {
  raceState: MultiplayerRaceState;
  myParticipant?: RaceParticipant;
  mainTextRef: React.RefObject<HTMLSpanElement | null>;
  msTextRef: React.RefObject<HTMLSpanElement | null>;
  onTriggerSplit: () => void;
  onUndoSplit: () => void;
  onSkipSplit: () => void;
  onResetRun: () => void;
  onStartCountdown: () => void;
  surgeActive: boolean;
}

export const RunnerViewport: React.FC<RunnerViewportProps> = ({
  raceState,
  myParticipant,
  mainTextRef,
  msTextRef,
  onTriggerSplit,
  onUndoSplit,
  onSkipSplit,
  onResetRun,
  onStartCountdown,
  surgeActive,
}) => {
  const currentSplitIdx = myParticipant?.currentSplitIndex || 0;
  const currentSegment = raceState.segments[currentSplitIdx];
  const nextSegment = raceState.segments[currentSplitIdx + 1];
  const completedSplits = myParticipant?.completedSplits || [];
  const latestSplit = completedSplits[completedSplits.length - 1];

  // Latest delta vs PB
  const deltaVsPb = latestSplit ? formatDelta(latestSplit.deltaVsPbMs) : null;
  const isGoldSplit = latestSplit?.isGold;

  // Find room leader
  const otherParticipants = raceState.participants.filter(
    p => p.playerId !== myParticipant?.playerId
  );
  const leadingOpponent = otherParticipants.length > 0
    ? [...otherParticipants].sort((a, b) => b.currentSplitIndex - a.currentSplitIndex)[0]
    : undefined;

  // Pacing status for main timer styling
  let deltaStatus: 'AHEAD' | 'BEHIND' | 'GOLD' | 'NEUTRAL' = 'NEUTRAL';
  if (isGoldSplit) {
    deltaStatus = 'GOLD';
  } else if (deltaVsPb) {
    deltaStatus = deltaVsPb.isAhead ? 'AHEAD' : deltaVsPb.isBehind ? 'BEHIND' : 'NEUTRAL';
  }

  return (
    <div className={`w-full max-w-md mx-auto flex flex-col bg-obsidian-surface border ${
      surgeActive ? 'border-neon-gold shadow-glow-gold/80 animate-gold-flare' : 'border-obsidian-border'
    } rounded-[6px] p-4 transition-all duration-300 relative select-none`}>
      
      {/* Surge Moment Banner */}
      {surgeActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon-gold text-obsidian-void text-[10px] font-mono font-black uppercase px-3 py-0.5 rounded-full flex items-center gap-1 shadow-glow-gold animate-bounce">
          <Flame className="h-3 w-3 fill-obsidian-void" />
          MOMENTUM SURGE // GOLD RECORD
        </div>
      )}

      {/* Header Info: Category & Hotkey Guide */}
      <div className="flex items-center justify-between pb-3 border-b border-obsidian-border/50 text-[11px] font-mono">
        <div className="truncate pr-2">
          <span className="text-slate-400">CATEGORY: </span>
          <span className="text-neon-cyan font-bold">{raceState.categoryName}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-400">HOTKEY:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-obsidian-void border border-obsidian-border text-[10px] font-bold text-slate-200">
            SPACE
          </kbd>
        </div>
      </div>

      {/* Main Stopwatch Readout */}
      <div className="my-4">
        <MainTimerDisplay
          mainTextRef={mainTextRef}
          msTextRef={msTextRef}
          deltaStatus={deltaStatus}
          size="hero"
        />
      </div>

      {/* Active Pacing Delta Banner */}
      <div className="flex items-center justify-between p-2.5 rounded-[4px] bg-obsidian-void border border-obsidian-border mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            PACE DELTA
          </span>
          {isGoldSplit && (
            <Badge variant="gold" className="flex items-center gap-1">
              <Star className="h-2.5 w-2.5 fill-neon-gold" />
              GOLD SPLIT
            </Badge>
          )}
        </div>
        <div className="font-mono font-black text-lg tabular-nums">
          {deltaVsPb ? (
            <span
              className={
                isGoldSplit
                  ? 'text-neon-gold'
                  : deltaVsPb.isAhead
                  ? 'text-neon-emerald'
                  : 'text-neon-ruby'
              }
            >
              {deltaVsPb.text}
            </span>
          ) : (
            <span className="text-slate-400 text-sm">--:--.--</span>
          )}
        </div>
      </div>

      {/* Current & Upcoming Segment */}
      <div className="bg-obsidian-base/60 rounded-[4px] border border-obsidian-border/60 p-3 mb-4 space-y-2 font-mono">
        {/* Active Split */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="h-2 w-2 rounded-full bg-neon-cyan animate-ping" />
            <span className="text-xs text-slate-400">ACTIVE:</span>
            <span className="text-sm font-bold text-slate-100 truncate">
              {currentSegment ? currentSegment.name : 'RACE FINISHED'}
            </span>
          </div>
          <span className="text-xs text-neon-cyan font-bold tabular-nums">
            {currentSegment?.targetDurationMs ? formatTime(currentSegment.targetDurationMs, false) : ''}
          </span>
        </div>

        {/* Next Split Peek */}
        {nextSegment && (
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-obsidian-border/30">
            <div className="flex items-center gap-1.5 truncate">
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="text-[10px]">NEXT:</span>
              <span className="truncate">{nextSegment.name}</span>
            </div>
            <span className="tabular-nums text-[10px] text-slate-400">
              PB: {nextSegment.personalBestSplitMs ? formatTime(nextSegment.personalBestSplitMs, false) : '--:--'}
            </span>
          </div>
        )}
      </div>

      {/* Opponent Duel Telemetry Tracker */}
      {leadingOpponent && (
        <div className="p-2.5 rounded-[4px] bg-obsidian-card/90 border border-obsidian-border mb-4 font-mono text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-neon-purple" />
            <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
              {leadingOpponent.username}:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-300">
              Sector {leadingOpponent.currentSplitIndex} / {raceState.segments.length}
            </span>
            {leadingOpponent.hasFinished ? (
              <Badge variant="purple">FINISH</Badge>
            ) : (
              <Badge variant="cyan">IN SECTOR</Badge>
            )}
          </div>
        </div>
      )}

      {/* Input Actuation Visualizer */}
      <div className="mb-4">
        <InputVisualizer apm={myParticipant?.currentApm || 380} />
      </div>

      {/* Tactical Trigger Buttons */}
      <div className="space-y-2">
        {raceState.status === 'LOBBY' || raceState.status === 'RACE_FINISHED' ? (
          <Button
            variant="primary"
            size="lg"
            className="w-full text-sm font-black tracking-widest bg-gradient-to-r from-neon-cyan to-neon-emerald"
            onClick={onStartCountdown}
          >
            <Play className="h-4 w-4 mr-2 fill-obsidian-void" />
            START SYNCHRONIZED RACE
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="w-full text-base font-black tracking-widest bg-neon-cyan hover:bg-neon-cyan/90 text-obsidian-void shadow-glow-cyan h-12"
            onClick={onTriggerSplit}
            disabled={myParticipant?.hasFinished}
          >
            {myParticipant?.hasFinished ? 'RUN COMPLETE' : 'SPLIT [SPACE / NUM 1]'}
          </Button>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onUndoSplit}
            disabled={completedSplits.length === 0}
            title="Undo Last Split [Num 8]"
          >
            <Undo2 className="h-3.5 w-3.5 mr-1" />
            Undo
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onSkipSplit}
            disabled={myParticipant?.hasFinished}
            title="Skip Current Split [Num 2]"
          >
            <SkipForward className="h-3.5 w-3.5 mr-1" />
            Skip
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onResetRun}
            title="Reset Run [Num 3]"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
