import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Camera, 
  Volume2, 
  Maximize, 
  Sparkles,
  Bookmark,
  AlertTriangle,
  Radio,
  Cpu
} from 'lucide-react';
import { Chapter, InVideoCheckpoint, TimestampedNote } from '../../types';
import { InVideoCheckpointOverlay } from './InVideoCheckpointOverlay';
import { sounds } from '../../services/audioEffects';

interface VideoStageProps {
  currentTime: number;
  durationSeconds: number;
  isPlaying: boolean;
  playbackRate: number;
  activeChapter: Chapter;
  activeCheckpoint: InVideoCheckpoint | null;
  passedCheckpointIds: Set<string>;
  notes: TimestampedNote[];
  isCameraFlashing: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onTogglePlay: () => void;
  onSeekTo: (seconds: number) => void;
  onSkipSeconds: (delta: number) => void;
  onChangeSpeed: (speed: number) => void;
  onResolveCheckpoint: (checkpointId: string) => void;
  onSnapFrame: () => void;
  formatTimecode: (seconds: number) => string;
}

export const VideoStage: React.FC<VideoStageProps> = ({
  currentTime,
  durationSeconds,
  isPlaying,
  playbackRate,
  activeChapter,
  activeCheckpoint,
  passedCheckpointIds,
  notes,
  isCameraFlashing,
  canvasRef,
  onTogglePlay,
  onSeekTo,
  onSkipSeconds,
  onChangeSpeed,
  onResolveCheckpoint,
  onSnapFrame,
  formatTimecode
}) => {
  const [hoverScrubberTime, setHoverScrubberTime] = useState<number | null>(null);
  const [hoverPositionX, setHoverPositionX] = useState<number>(0);
  const scrubberContainerRef = useRef<HTMLDivElement | null>(null);

  // High rewind density segment (Confusion Radar overlay): 09:15 - 09:50 (555s - 590s)
  const confusionStartSec = 555;
  const confusionEndSec = 590;

  // Draw animated Raft Cluster State Machine diagram on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const render = () => {
      t += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      // Dark Obsidian Studio Background
      ctx.fillStyle = '#090B10';
      ctx.fillRect(0, 0, width, height);

      // Subtle grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // State condition based on currentTime
      const isLeaderDead = currentTime >= 495; // Crashed at 08:15
      const isPartitioned = currentTime >= 870; // Partition at 14:30
      const currentTerm = isLeaderDead ? 5 : 4;

      // Draw Header Overlay on Canvas
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`RAFT CLUSTER REPLICATION SIMULATOR — TERM ${currentTerm}`, 24, 34);

      ctx.font = '11px monospace';
      ctx.fillStyle = isLeaderDead ? '#F87171' : '#34D399';
      ctx.fillText(
        isPartitioned 
          ? '● STATUS: SPLIT-BRAIN PARTITION DETECTED (QUORUM SAFETY ENFORCED)'
          : isLeaderDead 
            ? '● STATUS: LEADER A FAILED → FOLLOWER B TRANSITIONED TO CANDIDATE' 
            : '● STATUS: NORMAL OPERATION (LEADER A BROADCASTING HEARTBEATS)', 
        24, 54
      );

      // Draw Nodes
      // Node A (Leader or Failed)
      const nodeA = { x: width * 0.22, y: height * 0.45, label: 'Node A', state: isLeaderDead ? 'CRASHED' : 'LEADER' };
      // Node B (Follower or Candidate)
      const nodeB = { x: width * 0.48, y: height * 0.28, label: 'Node B', state: isLeaderDead ? 'CANDIDATE' : 'FOLLOWER' };
      // Node C (Follower)
      const nodeC = { x: width * 0.48, y: height * 0.65, label: 'Node C', state: 'FOLLOWER' };
      // Node D (Follower or Partitioned)
      const nodeD = { x: width * 0.78, y: height * 0.32, label: 'Node D', state: isPartitioned ? 'ISOLATED' : 'FOLLOWER' };
      // Node E (Follower or Partitioned)
      const nodeE = { x: width * 0.78, y: height * 0.68, label: 'Node E', state: isPartitioned ? 'ISOLATED' : 'FOLLOWER' };

      const nodes = [nodeA, nodeB, nodeC, nodeD, nodeE];

      // Draw connection lines & heartbeat pulses
      nodes.forEach((n1, i) => {
        nodes.forEach((n2, j) => {
          if (i >= j) return;
          // If partitioned, cut connection to D and E
          if (isPartitioned && ((i < 3 && j >= 3) || (j < 3 && i >= 3))) {
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
          } else {
            ctx.setLineDash([]);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
          }
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      });

      // Animated Heartbeat / RequestVote Packets
      if (!isLeaderDead) {
        // Normal heartbeats from Node A
        const pulseProgress = (t % 2) / 2;
        [nodeB, nodeC, nodeD, nodeE].forEach(target => {
          const px = nodeA.x + (target.x - nodeA.x) * pulseProgress;
          const py = nodeA.y + (target.y - nodeA.y) * pulseProgress;
          ctx.fillStyle = '#60A5FA';
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Candidate B broadcasting RequestVote RPCs
        const voteProgress = (t % 1.5) / 1.5;
        [nodeA, nodeC, nodeD, nodeE].forEach(target => {
          if (isPartitioned && target.x > width * 0.6) return; // Dropped by partition
          const px = nodeB.x + (target.x - nodeB.x) * voteProgress;
          const py = nodeB.y + (target.y - nodeB.y) * voteProgress;
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw Partition Dividing Wall if split
      if (isPartitioned) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(width * 0.63, 60);
        ctx.lineTo(width * 0.63, height - 30);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('⚡ PARTITION WALL (NETWORK CUT)', width * 0.64, 85);
      }

      // Render each node circle and label
      nodes.forEach(n => {
        let nodeColor = '#3B82F6'; // Follower
        let glowColor = 'rgba(59, 130, 246, 0.4)';

        if (n.state === 'LEADER') {
          nodeColor = '#10B981';
          glowColor = 'rgba(16, 185, 129, 0.6)';
        } else if (n.state === 'CANDIDATE') {
          nodeColor = '#F59E0B';
          glowColor = 'rgba(245, 158, 11, 0.6)';
        } else if (n.state === 'CRASHED' || n.state === 'ISOLATED') {
          nodeColor = '#EF4444';
          glowColor = 'rgba(239, 68, 68, 0.3)';
        }

        // Glow ring
        ctx.beginPath();
        ctx.arc(n.x, n.y, 28, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();

        // Solid node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#171B26';
        ctx.fill();
        ctx.strokeStyle = nodeColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Node Label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.label, n.x, n.y - 2);

        // State Badge
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = nodeColor;
        ctx.fillText(n.state, n.x, n.y + 35);
      });

      // Bottom Telemetry Bar on Canvas
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '10px monospace';
      ctx.fillText(
        `ELECTION TIMEOUT: 150-300ms | HEARTBEAT INTERVAL: 25ms | QUORUM MAJORITY: 3/5 NODES`,
        24, height - 20
      );

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, currentTime, canvasRef]);

  // Handle Scrubbing Click & Drag
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberContainerRef.current) return;
    const rect = scrubberContainerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeekTo(ratio * durationSeconds);
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberContainerRef.current) return;
    const rect = scrubberContainerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverScrubberTime(ratio * durationSeconds);
    setHoverPositionX(e.clientX - rect.left);
  };

  const currentPercent = (currentTime / durationSeconds) * 100;
  const confusionStartPercent = (confusionStartSec / durationSeconds) * 100;
  const confusionEndPercent = (confusionEndSec / durationSeconds) * 100;

  return (
    <div className="flex flex-col h-full bg-[#090B10] text-white select-none">
      {/* =========================================================================
          MAIN VIDEO STAGE VIEWPORT (Aspect Video)
          ========================================================================= */}
      <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center group">
        {/* Canvas animated diagram engine */}
        <canvas
          ref={canvasRef}
          width={854}
          height={480}
          className="w-full h-full object-contain cursor-pointer"
          onClick={onTogglePlay}
        />

        {/* Camera Shutter Flash Effect (⌘+B Snapshot) */}
        {isCameraFlashing && (
          <div className="absolute inset-0 z-40 bg-white/90 transition-opacity duration-300 pointer-events-none animate-out fade-out" />
        )}

        {/* In-Video Micro-Quiz Overlay (Active at cue points) */}
        {activeCheckpoint && (
          <InVideoCheckpointOverlay
            checkpoint={activeCheckpoint}
            onResolved={onResolveCheckpoint}
            onSkip={() => onResolveCheckpoint(activeCheckpoint.id)}
          />
        )}

        {/* Center Big Play/Pause Overlay indicator */}
        {!isPlaying && !activeCheckpoint && (
          <button
            onClick={onTogglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-2xl backdrop-blur-xs ring-4 ring-indigo-500/30"
          >
            <Play className="w-8 h-8 fill-white translate-x-0.5" />
          </button>
        )}

        {/* Top Floating Info Chip */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            LIVE SIMULATION STAGE
          </span>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-black/60 backdrop-blur-md text-indigo-400 border border-indigo-500/30">
            {activeChapter.title}
          </span>
        </div>
      </div>

      {/* =========================================================================
          TIMELINE SCRUBBER BAR with Cue Points & Rewind Density Heatmap
          ========================================================================= */}
      <div className="px-4 pt-3 pb-1 bg-[#0B0D13] border-t border-white/10">
        <div
          ref={scrubberContainerRef}
          onClick={handleScrubberClick}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={() => setHoverScrubberTime(null)}
          className="relative h-4 flex items-center cursor-pointer group"
        >
          {/* Base Scrubber Track */}
          <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden relative group-hover:h-2 transition-all">
            {/* Confusion Radar: Rewind density heatstrip (09:15-09:50) */}
            <div
              style={{
                left: `${confusionStartPercent}%`,
                width: `${confusionEndPercent - confusionStartPercent}%`
              }}
              title="Rewind Density Hotspot: 58% of learners rewatched 09:15–09:50"
              className="absolute top-0 bottom-0 bg-amber-500/40 z-10"
            />

            {/* Current Played Bar (Indigo) */}
            <div
              style={{ width: `${currentPercent}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 relative transition-all duration-75"
            />
          </div>

          {/* Hover Scrubbing Timestamp Tooltip */}
          {hoverScrubberTime !== null && (
            <div
              style={{ left: `${hoverPositionX}px` }}
              className="absolute -top-7 transform -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-mono bg-white text-slate-900 font-bold shadow-md pointer-events-none"
            >
              {formatTimecode(hoverScrubberTime)}
            </div>
          )}

          {/* Violet Diamond Marker: In-Video Checkpoint @ 08:15 (495s) */}
          <div
            style={{ left: `${(495 / durationSeconds) * 100}%` }}
            title="In-Video Quick Concept Check @ 08:15: Raft Follower Timeout"
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group/marker"
          >
            <div className={`w-3.5 h-3.5 rotate-45 border-2 transition-transform hover:scale-150 ${
              passedCheckpointIds.has('quiz-invideo-04-3-check-1')
                ? 'bg-emerald-500 border-white'
                : 'bg-violet-500 border-white animate-pulse'
            }`} />
          </div>

          {/* Violet Diamond Marker 2: Checkpoint @ 14:30 (870s) */}
          <div
            style={{ left: `${(870 / durationSeconds) * 100}%` }}
            title="In-Video Checkpoint @ 14:30: Network Partition Split-Brain Lab"
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
          >
            <div className="w-3.5 h-3.5 rotate-45 bg-violet-500 border-2 border-white transition-transform hover:scale-150" />
          </div>

          {/* Cyan Pins for Student Saved Notes */}
          {notes.map(note => (
            <div
              key={note.id}
              style={{ left: `${(note.timestampSec / durationSeconds) * 100}%` }}
              title={`Saved Note @ ${formatTimecode(note.timestampSec)}`}
              onClick={e => {
                e.stopPropagation();
                onSeekTo(note.timestampSec);
              }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white shadow-xs hover:scale-150 transition-transform" />
            </div>
          ))}

          {/* Current Scrubber Head */}
          <div
            style={{ left: `${currentPercent}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg pointer-events-none group-hover:scale-125 transition-transform"
          />
        </div>

        {/* Rewind Density Callout strip below timeline */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono py-1">
          <div className="flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            <span>Rewind Density Hotspot: 58% of learners rewatched 09:15–09:50</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-violet-400 font-semibold">
              <span className="w-2 h-2 rotate-45 bg-violet-500 inline-block" />
              Checkpoints (2)
            </span>
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              Notes ({notes.length})
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTROL BAR: Playback, Speed, 1-Click Frame Snipper, Timecode
          ========================================================================= */}
      <div className="px-4 py-3 bg-[#0B0D13] flex flex-wrap items-center justify-between gap-4 border-t border-white/5">
        {/* Left: Play/Pause, 10s skips, Speed */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
          </button>

          <button
            onClick={() => onSkipSeconds(-10)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Rewind 10s (←)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSkipSeconds(10)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Forward 10s (→)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center rounded-lg bg-white/5 p-0.5 border border-white/10 ml-2">
            {[1.0, 1.25, 1.5, 2.0].map(speed => (
              <button
                key={speed}
                onClick={() => onChangeSpeed(speed)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  playbackRate === speed
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Center: 1-Click Timestamped Note & Slide Snipper */}
        <div>
          <button
            onClick={onSnapFrame}
            className="px-3.5 py-1.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center gap-2 shadow-sm border border-violet-400/30 group"
            title="Capture slide diagram & add timestamped note (⌘+B)"
          >
            <Camera className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Snap Frame & Timestamp</span>
            <kbd className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] font-mono border border-white/20">
              ⌘B
            </kbd>
          </button>
        </div>

        {/* Right: Tabular Timecode & Fullscreen */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-xs text-slate-300 tabular-nums">
            <span className="font-bold text-white">{formatTimecode(currentTime)}</span>
            <span className="text-slate-500"> / </span>
            <span className="text-slate-400">{formatTimecode(durationSeconds)}</span>
          </div>

          <button
            onClick={() => { sounds.playClick(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Toggle Theater / Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

