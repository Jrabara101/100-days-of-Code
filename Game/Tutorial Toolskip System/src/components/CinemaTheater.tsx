import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useReplayEngine } from '../engine/useReplayEngine';
import { SAMPLE_REPLAYS } from '../game/SampleReplays';
import { TelemetryHeader } from './TelemetryHeader';
import { GameCanvas } from './GameCanvas';
import { TimelineScrubber } from './TimelineScrubber';
import { TransportDock } from './TransportDock';
import { EventLogSheet } from './EventLogSheet';
import { ClipExportDialog } from './ClipExportDialog';
import { IntegrityVerifierModal } from './IntegrityVerifierModal';
import { CanvasClipRecorder } from '../lib/mediaRecorder';
import { ReplayPayload } from '../types/replay';
import { decompressFromEncodedUri } from '../lib/compression';

export const CinemaTheater: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Replay Engine State Machine Hook
  const {
    session,
    metadata,
    currentInput,
    interpolatedEntities,
    ghostEntities,
    activeMarker,
    memoryBytes,
    primaryPayload,
    play,
    pause,
    togglePlay,
    seekToTick,
    stepFrame,
    jumpTime,
    setSpeed,
    toggleLoop,
    setLoopRange,
    toggleGhost,
    loadReplay,
    startRecording,
    stopRecording,
    feedLiveTick,
    addMarker,
  } = useReplayEngine(SAMPLE_REPLAYS['clutch-solo']);

  // UI Modal / Sheet States
  const [isLiveGameMode, setIsLiveGameMode] = useState(false);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isClipForgeOpen, setIsClipForgeOpen] = useState(false);
  const [isVerifierOpen, setIsVerifierOpen] = useState(false);

  // Parse URL hash on mount if shared replay exists
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#replay=')) {
        const encoded = hash.replace('#replay=', '');
        const decoded = decompressFromEncodedUri(encoded);
        if (decoded && decoded.metadata) {
          loadReplay(decoded);
        }
      }
    } catch (err) {
      console.warn('Could not parse replay from URL hash:', err);
    }
  }, [loadReplay]);

  // Fullscreen Handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  // Upload to Fastify API archive
  const handleUploadToBackend = async (payload: ReplayPayload) => {
    const res = await fetch('/api/replays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata: payload.metadata,
        payload,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
  };

  // Export WebM Video Clip
  const handleExportVideoClip = async (startTick: number, endTick: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const recorder = new CanvasClipRecorder();
    const started = recorder.start(canvas, 60);
    if (!started) return;

    // Seek to start and play until end
    seekToTick(startTick);
    play();

    const durationSeconds = (endTick - startTick) / 60;
    await new Promise(r => setTimeout(r, durationSeconds * 1000 + 300));

    pause();
    const blob = await recorder.stop();

    // Trigger download of recorded WebM file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.replayId}-clip.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-black"
    >
      {/* 1. Top Telemetry Ribbon */}
      <TelemetryHeader
        status={session.status}
        metadata={metadata}
        activeMarker={activeMarker}
        memoryBytes={memoryBytes}
        isLiveGameMode={isLiveGameMode}
        onToggleLiveGameMode={() => {
          setIsLiveGameMode(prev => !prev);
          pause();
        }}
        onSelectSampleReplay={(key) => {
          if (SAMPLE_REPLAYS[key]) {
            loadReplay(SAMPLE_REPLAYS[key]);
          }
        }}
        onStartRecording={() => startRecording('Live Custom Match Record')}
        onStopRecording={stopRecording}
      />

      {/* 2. Main Center Cinema Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 w-full max-w-7xl mx-auto">
        <GameCanvas
          ref={canvasRef}
          isLiveGameMode={isLiveGameMode}
          isPlaying={session.status === 'PLAYING' || session.status === 'SLOW_MO'}
          playbackSpeed={session.playbackSpeed}
          interpolatedEntities={interpolatedEntities}
          ghostEntities={ghostEntities}
          isGhostEnabled={session.isGhostEnabled}
          currentInput={currentInput}
          activeMarker={activeMarker}
          onLiveTick={feedLiveTick}
          onLiveMarker={addMarker}
        />
      </main>

      {/* 3. Bottom Scrubber & Transport Console Dock */}
      <footer className="w-full max-w-7xl mx-auto px-4 lg:px-6 pb-5 flex flex-col gap-3">
        {/* Scrubber Ribbon */}
        <TimelineScrubber
          currentTick={session.currentTick}
          totalTicks={session.totalTicks}
          markers={metadata.markers}
          activeMarkerId={session.activeMarkerId}
          loopRange={session.loopRange}
          isLooping={session.isLooping}
          onSeek={seekToTick}
          onSetLoopRange={setLoopRange}
        />

        {/* Floating Transport Bar */}
        <TransportDock
          isPlaying={session.status === 'PLAYING' || session.status === 'SLOW_MO'}
          playbackSpeed={session.playbackSpeed}
          isLooping={session.isLooping}
          isGhostEnabled={session.isGhostEnabled}
          totalBookmarks={metadata.markers.length}
          onTogglePlay={togglePlay}
          onStepFrame={stepFrame}
          onJumpTime={jumpTime}
          onSetSpeed={setSpeed}
          onToggleLoop={toggleLoop}
          onToggleGhost={toggleGhost}
          onOpenEvents={() => setIsEventsOpen(true)}
          onOpenClipForge={() => setIsClipForgeOpen(true)}
          onOpenVerifier={() => setIsVerifierOpen(true)}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </footer>

      {/* Modals & Drawers */}
      <EventLogSheet
        isOpen={isEventsOpen}
        markers={metadata.markers}
        currentTick={session.currentTick}
        onClose={() => setIsEventsOpen(false)}
        onSeekToTick={(tick) => {
          seekToTick(tick);
          setIsEventsOpen(false);
        }}
      />

      <ClipExportDialog
        isOpen={isClipForgeOpen}
        payload={primaryPayload}
        loopRange={session.loopRange}
        canvasRef={canvasRef}
        onClose={() => setIsClipForgeOpen(false)}
        onUploadToBackend={handleUploadToBackend}
        onExportVideoClip={handleExportVideoClip}
      />

      <IntegrityVerifierModal
        isOpen={isVerifierOpen}
        payload={primaryPayload}
        onClose={() => setIsVerifierOpen(false)}
      />
    </div>
  );
};
