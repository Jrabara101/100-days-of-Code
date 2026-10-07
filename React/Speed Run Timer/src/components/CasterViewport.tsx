import React, { useState } from 'react';
import { 
  MultiplayerRaceState, 
  RaceParticipant 
} from '../types/race';
import { formatTime, formatDelta } from '../utils/formatters';
import { SplitBoard } from './SplitBoard';
import { Badge, Button } from './ui/primitives';
import { 
  Trophy, 
  Tv, 
  Gauge, 
  Activity, 
  Radio, 
  Flame, 
  Users, 
  Star, 
  Camera, 
  Layers,
  MessageSquare
} from 'lucide-react';

interface CasterViewportProps {
  raceState: MultiplayerRaceState;
  myParticipant?: RaceParticipant;
  onTriggerSplit: () => void;
  onStartCountdown: () => void;
}

export const CasterViewport: React.FC<CasterViewportProps> = ({
  raceState,
  myParticipant,
  onTriggerSplit,
  onStartCountdown,
}) => {
  const [broadcastCamera, setBroadcastCamera] = useState<'SPLIT' | 'RUNNER_1' | 'RUNNER_2' | 'GHOST'>('SPLIT');
  const [casterNote, setCasterNote] = useState<string>('Grand Finals: Both runners within 2.1s heading into Sector 07 Citadel Ascent.');

  // Sort participants by progress and time
  const sortedParticipants = [...raceState.participants].sort((a, b) => {
    // Finished runners sorted by final time
    if (a.hasFinished && b.hasFinished) {
      return (a.finalTimeMs || 0) - (b.finalTimeMs || 0);
    }
    if (a.hasFinished) return -1;
    if (b.hasFinished) return 1;
    // Otherwise higher split index leads
    if (b.currentSplitIndex !== a.currentSplitIndex) {
      return b.currentSplitIndex - a.currentSplitIndex;
    }
    // Tie breaker: completed split time of latest segment
    const aLast = a.completedSplits[a.completedSplits.length - 1]?.completedAtMs || 0;
    const bLast = b.completedSplits[b.completedSplits.length - 1]?.completedAtMs || 0;
    return aLast - bLast;
  });

  const runner1 = sortedParticipants[0];
  const runner2 = sortedParticipants[1];

  const totalSegments = raceState.segments.length || 8;

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Broadcast Header & Tournament Tally */}
      <div className="flex flex-wrap items-center justify-between p-3 rounded-[4px] bg-obsidian-card border border-obsidian-border gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="ruby" className="flex items-center gap-1.5 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-neon-ruby animate-ping" />
            ON AIR // LIVE FEED
          </Badge>
          <div className="font-mono text-xs">
            <span className="text-slate-400">MATCH: </span>
            <span className="text-slate-100 font-bold">GRAND FINALS // BEST OF 5</span>
          </div>
        </div>

        {/* Camera POV Switcher */}
        <div className="flex items-center gap-1 bg-obsidian-void p-1 rounded border border-obsidian-border text-xs font-mono">
          <Camera className="h-3.5 w-3.5 text-neon-cyan ml-1 mr-0.5" />
          <button
            onClick={() => setBroadcastCamera('SPLIT')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
              broadcastCamera === 'SPLIT' ? 'bg-neon-cyan text-obsidian-void' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SPLIT VIEW
          </button>
          <button
            onClick={() => setBroadcastCamera('RUNNER_1')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
              broadcastCamera === 'RUNNER_1' ? 'bg-neon-cyan text-obsidian-void' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            P1 POV
          </button>
          <button
            onClick={() => setBroadcastCamera('RUNNER_2')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
              broadcastCamera === 'RUNNER_2' ? 'bg-neon-cyan text-obsidian-void' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            P2 POV
          </button>
        </div>
      </div>

      {/* Relative Position Race Track (Progress Circuit) */}
      <div className="p-4 rounded-[4px] bg-obsidian-surface border border-obsidian-border">
        <div className="flex items-center justify-between mb-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-neon-cyan" />
            <span className="font-bold text-slate-200 uppercase tracking-wider">
              DYNAMIC RACE CIRCUIT // RELATIVE POSITIONS
            </span>
          </div>
          <span className="text-slate-400">SECTORS 01 — {String(totalSegments).padStart(2, '0')}</span>
        </div>

        {/* Circuit Track Bar */}
        <div className="relative h-12 bg-obsidian-void rounded border border-obsidian-border/70 flex items-center px-4 overflow-hidden">
          {/* Sector Gate Lines */}
          {raceState.segments.map((seg, idx) => {
            const leftPercent = ((idx + 1) / totalSegments) * 100;
            return (
              <div
                key={seg.id}
                className="absolute top-0 bottom-0 border-r border-obsidian-border/60 flex flex-col justify-end pb-1 pr-1 pointer-events-none"
                style={{ left: `${leftPercent}%` }}
              >
                <span className="text-[8px] font-mono text-slate-600 font-bold">
                  S{idx + 1}
                </span>
              </div>
            );
          })}

          {/* Runners on the Track */}
          {raceState.participants.map((p, idx) => {
            const progress = totalSegments > 0 ? (p.currentSplitIndex / totalSegments) * 100 : 0;
            const isP1 = idx === 0;
            const topOffset = idx % 2 === 0 ? 'top-1.5' : 'bottom-1.5';

            return (
              <div
                key={p.playerId}
                className={`absolute ${topOffset} transition-all duration-500 flex items-center gap-1.5 z-10`}
                style={{ left: `calc(${progress}% - 14px)` }}
              >
                <div
                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shadow-lg font-mono text-[10px] font-bold ${
                    p.isGhost
                      ? 'border-neon-purple bg-neon-purple/20 text-neon-purple'
                      : isP1
                      ? 'border-neon-emerald bg-neon-emerald/30 text-neon-emerald shadow-glow-emerald/50'
                      : 'border-neon-ruby bg-neon-ruby/30 text-neon-ruby shadow-glow-ruby/50'
                  }`}
                  title={`${p.username} (Sector ${p.currentSplitIndex})`}
                >
                  {idx + 1}
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-obsidian-base/90 border border-obsidian-border text-slate-200 hidden sm:inline whitespace-nowrap">
                  {p.username}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Arena Multi-Runner Telemetry Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Runner 1 (Leader / Cyan-Emerald) */}
        {runner1 && (
          <div className="p-4 rounded-[4px] bg-obsidian-card border border-neon-cyan/40 shadow-glow-cyan/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-obsidian-border">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-neon-emerald animate-ping" />
                  <span className="font-mono font-bold text-sm text-slate-100">{runner1.username}</span>
                  <Badge variant="emerald">RANK #1 LEADING</Badge>
                </div>
                <span className="font-mono text-xs text-neon-cyan font-bold">
                  SECTOR {runner1.currentSplitIndex} / {totalSegments}
                </span>
              </div>

              {/* Live Time & Split Delta */}
              <div className="my-3 flex items-baseline justify-between bg-obsidian-void p-3 rounded border border-obsidian-border">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">CURRENT TIME</span>
                  <span className="font-mono font-black text-3xl text-neon-cyan">
                    {formatTime(runner1.currentRunTimeMs || 0, true)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">PACE STATUS</span>
                  <span className="font-mono font-black text-xl text-neon-emerald">
                    {runner1.completedSplits.length > 0
                      ? formatDelta(runner1.completedSplits[runner1.completedSplits.length - 1].deltaVsPbMs).text
                      : 'PB PACE'}
                  </span>
                </div>
              </div>

              {/* Telemetry Telemetry Gauges */}
              <div className="grid grid-cols-3 gap-2 font-mono text-xs mb-3">
                <div className="p-2 rounded bg-obsidian-surface border border-obsidian-border text-center">
                  <span className="text-[9px] text-slate-400 block">VELOCITY</span>
                  <span className="font-bold text-neon-cyan">{runner1.currentVelocity || 942} px/s</span>
                </div>
                <div className="p-2 rounded bg-obsidian-surface border border-obsidian-border text-center">
                  <span className="text-[9px] text-slate-400 block">APM CADENCE</span>
                  <span className="font-bold text-slate-200">{runner1.currentApm || 420}</span>
                </div>
                <div className="p-2 rounded bg-obsidian-surface border border-obsidian-border text-center">
                  <span className="text-[9px] text-slate-400 block">GOLD SPLITS</span>
                  <span className="font-bold text-neon-gold">
                    {runner1.completedSplits.filter(s => s.isGold).length} ★
                  </span>
                </div>
              </div>
            </div>

            {/* Projected Finish Time */}
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-2 border-t border-obsidian-border">
              <span>PROJECTED FINISH:</span>
              <span className="text-slate-200 font-bold">14:26.80 [SUB-14:30 POSSIBLE]</span>
            </div>
          </div>
        )}

        {/* Runner 2 (Chaser / Ruby-Magenta) */}
        {runner2 ? (
          <div className="p-4 rounded-[4px] bg-obsidian-card border border-neon-ruby/40 shadow-glow-ruby/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-obsidian-border">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-neon-ruby" />
                  <span className="font-mono font-bold text-sm text-slate-100">{runner2.username}</span>
                  <Badge variant="ruby">RANK #2 CHASING</Badge>
                </div>
                <span className="font-mono text-xs text-neon-ruby font-bold">
                  SECTOR {runner2.currentSplitIndex} / {totalSegments}
                </span>
              </div>

              {/* Live Time & Split Delta */}
              <div className="my-3 flex items-baseline justify-between bg-obsidian-void p-3 rounded border border-obsidian-border">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">CURRENT TIME</span>
                  <span className="font-mono font-black text-3xl text-slate-200">
                    {formatTime(runner2.currentRunTimeMs || 0, true)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">DELTA VS LEADER</span>
                  <span className="font-mono font-black text-xl text-neon-ruby">
                    {runner2.completedSplits.length > 0
                      ? formatDelta(runner2.completedSplits[runner2.completedSplits.length - 1].deltaVsLeaderMs).text
                      : '+01.84s'}
                  </span>
                </div>
              </div>

              {/* Telemetry Gauges */}
              <div className="grid grid-cols-3 gap-2 font-mono text-xs mb-3">
                <div className="p-2 rounded bg-obsidian-surface border border-obsidian-border text-center">
                  <span className="text-[9px] text-slate-400 block">VELOCITY</span>
                  <span className="font-bold text-slate-300">{runner2.currentVelocity || 910} px/s</span>
                </div>
                <div className="p-2 rounded bg-obsidian-surface border border-obsidian-border text-center">
                  <span className="text-[9px] text-slate-400 block">APM CADENCE</span>
                  <span className="font-bold text-slate-200">{runner2.currentApm || 398}</span>
                </div>
                <div className="p-2 rounded bg-obsidian-surface border border-obsidian-border text-center">
                  <span className="text-[9px] text-slate-400 block">GLITCH SYNC</span>
                  <span className="font-bold text-neon-emerald">88% PASS</span>
                </div>
              </div>
            </div>

            {/* Projected Finish Time */}
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-2 border-t border-obsidian-border">
              <span>PROJECTED FINISH:</span>
              <span className="text-slate-200 font-bold">14:31.40 [+4.60s GAP]</span>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-[4px] bg-obsidian-card/50 border border-dashed border-obsidian-border flex flex-col items-center justify-center text-center text-slate-500 font-mono text-xs">
            <Users className="h-8 w-8 mb-2 opacity-50" />
            <span>Awaiting Runner 2 to Join Room...</span>
            <span className="text-[10px] text-slate-600 mt-1">Share room code {raceState.roomCode}</span>
          </div>
        )}
      </div>

      {/* Caster Live Commentary Feed & Match Controls */}
      <div className="p-3 rounded-[4px] bg-obsidian-surface border border-obsidian-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <MessageSquare className="h-4 w-4 text-neon-gold shrink-0" />
          <span className="text-slate-400 uppercase text-[10px] font-bold shrink-0">CASTER NOTE:</span>
          <input
            type="text"
            value={casterNote}
            onChange={(e) => setCasterNote(e.target.value)}
            className="flex-1 bg-obsidian-void border border-obsidian-border rounded px-2.5 py-1 text-slate-200 text-xs focus:border-neon-cyan focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {raceState.status === 'RACING' && (
            <Button variant="primary" size="sm" onClick={onTriggerSplit}>
              TRIGGER SPLIT [SPACE]
            </Button>
          )}
          {(raceState.status === 'LOBBY' || raceState.status === 'RACE_FINISHED') && (
            <Button variant="gold" size="sm" onClick={onStartCountdown}>
              START MATCH
            </Button>
          )}
        </div>
      </div>

      {/* Primary Comparative Split Board */}
      <SplitBoard
        segments={raceState.segments}
        participant={runner1 || myParticipant}
        currentSplitIndex={runner1?.currentSplitIndex || 0}
      />
    </div>
  );
};
