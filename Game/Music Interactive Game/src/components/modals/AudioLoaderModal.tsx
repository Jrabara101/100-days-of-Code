import React, { useState, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioAnalyzer } from '@/audio/useAudioAnalyzer';
import { Dialog, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadCloud, Music4, Mic, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AudioLoaderModal: React.FC = () => {
  const { isLoaderOpen, setLoaderOpen, resetStats } = useGameStore();
  const { startProcedural, loadAudioFile, activateMicrophone, proceduralTracks } = useAudioAnalyzer();

  const [selectedTrackId, setSelectedTrackId] = useState('synthwave');
  const [isDragging, setIsDragging] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartProcedural = () => {
    resetStats();
    startProcedural(selectedTrackId);
    setLoaderOpen(false);
  };

  const handleFileUpload = async (file: File) => {
    resetStats();
    const success = await loadAudioFile(file);
    if (success) {
      setLoaderOpen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleToggleMic = async () => {
    resetStats();
    const ok = await activateMicrophone();
    if (ok) {
      setMicActive(true);
      setLoaderOpen(false);
    }
  };

  return (
    <Dialog open={isLoaderOpen} onOpenChange={setLoaderOpen} className="max-w-xl">
      <DialogHeader
        title="AUDIO LOADER PIPELINE"
        description="Feed local audio, choose procedural synth streams, or activate live mic."
        icon={<Music4 className="w-5 h-5" />}
        onClose={() => setLoaderOpen(false)}
      />

      {/* Drag & Drop Zone */}
      <div className="mt-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'group flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all',
            isDragging
              ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
              : 'border-cyan-500/30 hover:border-cyan-400/80 bg-slate-950/60 hover:bg-cyan-950/15'
          )}
        >
          <UploadCloud className="w-10 h-10 text-cyan-400/70 group-hover:text-cyan-300 group-hover:scale-110 transition-transform mb-2" />
          <span className="text-sm font-semibold text-slate-200">
            Drag & Drop MP3, WAV, FLAC, or OGG
          </span>
          <span className="text-xs text-slate-400 mt-1">
            Zero upload latency • 100% Client-side Web Audio decoding
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Preset Procedural Synth Tracks */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2.5">
          <span>CHOOSE PROCEDURAL SYNTHESIZER TRACK</span>
          <span className="text-cyan-400">INSTANT 60FPS AUDIO</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {proceduralTracks.map((track) => {
            const isSelected = selectedTrackId === track.id;
            return (
              <div
                key={track.id}
                onClick={() => setSelectedTrackId(track.id)}
                className={cn(
                  'cursor-pointer p-3 rounded-xl border transition-all text-left flex flex-col justify-between',
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'border-slate-800 bg-slate-900/40 hover:border-cyan-500/30 hover:bg-slate-900/80'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {track.title}
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-cyan-300">
                    {track.bpm} BPM
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{track.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Microphone Option */}
      <div className="mt-5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">Live Microphone Stream</div>
            <div className="text-[11px] text-slate-400">
              Visualize external sound from speakers or instruments
            </div>
          </div>
        </div>
        <Button
          variant={micActive ? 'glow' : 'outline'}
          size="sm"
          onClick={handleToggleMic}
        >
          {micActive ? 'MIC ACTIVE' : 'ENABLE MIC'}
        </Button>
      </div>

      {/* Modal Footer */}
      <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
        <Button variant="ghost" size="md" onClick={() => setLoaderOpen(false)}>
          CANCEL
        </Button>
        <Button variant="default" size="md" onClick={handleStartProcedural}>
          ENGAGE AUDIOPHILE CORE
        </Button>
      </div>
    </Dialog>
  );
};
