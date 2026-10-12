import React, { useState } from 'react';
import { ReplayPayload } from '../types/replay';
import { compressToEncodedUri, compressReplayPayload } from '../lib/compression';
import { formatTime, formatTick } from '../lib/utils';
import {
  X,
  Share2,
  Download,
  Video,
  Copy,
  Check,
  UploadCloud,
  Film,
  Scissors,
  Sparkles,
} from 'lucide-react';

interface ClipExportDialogProps {
  isOpen: boolean;
  payload: ReplayPayload;
  loopRange: [number, number] | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onClose: () => void;
  onUploadToBackend: (trimmedPayload: ReplayPayload) => Promise<void>;
  onExportVideoClip: (startTick: number, endTick: number) => Promise<void>;
}

export const ClipExportDialog: React.FC<ClipExportDialogProps> = ({
  isOpen,
  payload,
  loopRange,
  canvasRef,
  onClose,
  onUploadToBackend,
  onExportVideoClip,
}) => {
  const totalTicks = payload.metadata.totalTicks;
  const initialStart = loopRange ? loopRange[0] : 0;
  const initialEnd = loopRange ? loopRange[1] : totalTicks;

  const [startTick, setStartTick] = useState<number>(initialStart);
  const [endTick, setEndTick] = useState<number>(initialEnd);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const safeTotal = Math.max(1, totalTicks);
  const durationTicks = Math.max(1, endTick - startTick);
  const durationMs = Math.round((durationTicks / 60) * 1000);

  // Generate trimmed slice payload
  const getTrimmedPayload = (): ReplayPayload => {
    const slicedInputs = payload.inputs
      .filter(i => i.tick >= startTick && i.tick <= endTick)
      .map(i => ({ ...i, tick: i.tick - startTick }));

    const slicedKeyframes = payload.keyframes
      .filter(k => k.tick >= startTick && k.tick <= endTick)
      .map(k => ({ ...k, tick: k.tick - startTick }));

    const slicedMarkers = payload.metadata.markers
      .filter(m => m.tick >= startTick && m.tick <= endTick)
      .map(m => ({ ...m, tick: m.tick - startTick }));

    return {
      metadata: {
        ...payload.metadata,
        replayId: `clip-${payload.metadata.replayId}-${startTick}-${endTick}`,
        gameTitle: `${payload.metadata.gameTitle} [Clip]`,
        totalTicks: durationTicks,
        durationMs,
        checksum: `sha256-clip-${Date.now().toString(36)}`,
        markers: slicedMarkers,
      },
      keyframes: slicedKeyframes,
      inputs: slicedInputs,
    };
  };

  // Copy shareable URL string
  const handleCopyShareableUrl = () => {
    try {
      const trimmed = getTrimmedPayload();
      const hash = compressToEncodedUri(trimmed);
      const url = `${window.location.origin}${window.location.pathname}#replay=${hash}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Copy raw telemetry hash
  const handleCopyRawHash = () => {
    try {
      const trimmed = getTrimmedPayload();
      const hash = compressToEncodedUri(trimmed);
      navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Download .replay file
  const handleDownloadReplayFile = () => {
    const trimmed = getTrimmedPayload();
    const jsonStr = JSON.stringify(trimmed, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trimmed.metadata.replayId}.replay.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Upload to Fastify server archive
  const handleUploadArchive = async () => {
    setIsUploading(true);
    setUploadSuccess(null);
    try {
      const trimmed = getTrimmedPayload();
      await onUploadToBackend(trimmed);
      setUploadSuccess('Successfully uploaded to Fastify flight recorder archive!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadSuccess(`Upload error: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger WebM video export
  const handleExportWebM = async () => {
    setIsExportingVideo(true);
    try {
      await onExportVideoClip(startTick, endTick);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingVideo(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-xl bg-[#141C30] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animation-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-950 border border-sky-500/40 text-sky-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-base text-slate-100">
                CLIP FORGE &amp; EXPORT SUITE
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Trim, Share Deterministic Telemetry, or Render WebM Video
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
          {/* Trimming Handles Section */}
          <div className="flex flex-col gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" /> TRIM RANGE:
              </span>
              <span>
                {formatTick(startTick)} → {formatTick(endTick)} ({formatTime(durationMs)})
              </span>
            </div>

            {/* Sliders for In and Out Points */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 w-16">IN TICK:</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, endTick - 30)}
                  value={startTick}
                  onChange={(e) => setStartTick(parseInt(e.target.value, 10))}
                  className="flex-1 accent-cyan-400 cursor-pointer"
                />
                <span className="text-xs font-mono text-cyan-300 w-14 text-right">
                  {startTick}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 w-16">OUT TICK:</span>
                <input
                  type="range"
                  min={Math.min(safeTotal, startTick + 30)}
                  max={safeTotal}
                  value={endTick}
                  onChange={(e) => setEndTick(parseInt(e.target.value, 10))}
                  className="flex-1 accent-sky-400 cursor-pointer"
                />
                <span className="text-xs font-mono text-sky-300 w-14 text-right">
                  {endTick}
                </span>
              </div>
            </div>

            {/* Quick Trim Preset Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
              <span className="text-[10px] font-mono text-slate-500">PRESETS:</span>
              <button
                onClick={() => {
                  setStartTick(0);
                  setEndTick(safeTotal);
                }}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                Full Match
              </button>
              <button
                onClick={() => {
                  const end = Math.min(safeTotal, startTick + 300);
                  setEndTick(end);
                }}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                +5s Clip
              </button>
              <button
                onClick={() => {
                  const end = Math.min(safeTotal, startTick + 600);
                  setEndTick(end);
                }}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                +10s Highlight
              </button>
            </div>
          </div>

          {/* Export Options Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Share URL Hash */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-1">
                  <Share2 className="w-4 h-4" />
                  <span>SHAREABLE URL HASH</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Zero video render needed. Replay encoded in URL string.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyShareableUrl}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-950 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 font-medium text-xs transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'COPIED LINK!' : 'COPY URL'}</span>
                </button>
                <button
                  onClick={handleCopyRawHash}
                  title="Copy LZ-String Telemetry Hash"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="font-mono text-[10px]">#HASH</span>}
                </button>
              </div>
            </div>

            {/* 2. Download .replay file */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD .REPLAY</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Compact deterministic JSON telemetry packet.
                </p>
              </div>
              <button
                onClick={handleDownloadReplayFile}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 font-medium text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>SAVE .REPLAY FILE</span>
              </button>
            </div>

            {/* 3. Render Canvas WebM Clip */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs mb-1">
                  <Video className="w-4 h-4" />
                  <span>RENDER WEBM VIDEO</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Client-side MediaRecorder capture of selected range.
                </p>
              </div>
              <button
                onClick={handleExportWebM}
                disabled={isExportingVideo}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-950 hover:bg-sky-900/80 border border-sky-500/50 text-sky-300 font-medium text-xs transition-colors disabled:opacity-50"
              >
                <Film className="w-3.5 h-3.5" />
                <span>{isExportingVideo ? 'RECORDING FRAMES...' : 'RENDER WEBM CLIP'}</span>
              </button>
            </div>

            {/* 4. Upload to Cloud Archive (Fastify + SQLite) */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                  <UploadCloud className="w-4 h-4" />
                  <span>CLOUD ARCHIVE API</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Fastify backend server storage with SHA-256 hash.
                </p>
              </div>
              <button
                onClick={handleUploadArchive}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-medium text-xs transition-colors disabled:opacity-50"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isUploading ? 'ARCHIVING...' : 'UPLOAD TO API'}</span>
              </button>
            </div>
          </div>

          {/* Feedback notice if any */}
          {uploadSuccess && (
            <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-300 text-xs font-mono text-center">
              {uploadSuccess}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
