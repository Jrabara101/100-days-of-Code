import React, { useState } from 'react';
import { useSequencerStore } from '../store/useSequencerStore';
import { triggerTrackSound } from '../audio/synthesizer';
import { audioEngine } from '../audio/audioGraph';
import { Toggle } from './ui/toggle';
import { Volume2 } from 'lucide-react';

export const StepMatrix: React.FC = () => {
  const tracks = useSequencerStore((s) => s.tracks);
  const toggleStep = useSequencerStore((s) => s.toggleStep);
  const toggleMute = useSequencerStore((s) => s.toggleMute);
  const toggleSolo = useSequencerStore((s) => s.toggleSolo);
  const setTrackPitch = useSequencerStore((s) => s.setTrackPitch);
  const currentStep = useSequencerStore((s) => s.currentStep);
  const activeKit = useSequencerStore((s) => s.activeKit);

  const [previewFlash, setPreviewFlash] = useState<string | null>(null);

  const handlePreview = (trackId: string, pitchOffset: number) => {
    audioEngine.init();
    triggerTrackSound(trackId, audioEngine.ctx?.currentTime || 0, activeKit, pitchOffset);
    setPreviewFlash(trackId);
    setTimeout(() => setPreviewFlash(null), 150);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* STEP NUMBER TICK RULER (1 to 16 with beat groupings) */}
      <div className="pt-2 pb-1 flex items-center">
        {/* Track info header spacer */}
        <div className="w-40 md:w-56 shrink-0 pr-3 flex items-center justify-between text-[10px] font-mono uppercase text-[#78716C] tracking-wider">
          <span>TRACK CHANNEL</span>
          <span>M / S / TONE</span>
        </div>

        {/* 16 steps grouped into 4 beats */}
        <div className="grid grid-cols-16 flex-1 gap-1 md:gap-1.5 text-center font-mono text-[10px]">
          {/* Beat 1 */}
          <div className="col-span-4 grid grid-cols-4 gap-1 md:gap-1.5 bg-[#151312] py-1 rounded-lg border border-[#24201D]">
            <span className="text-amber-400 font-bold">01</span>
            <span className="text-[#57534E]">02</span>
            <span className="text-[#57534E]">03</span>
            <span className="text-[#57534E]">04</span>
          </div>
          {/* Beat 2 */}
          <div className="col-span-4 grid grid-cols-4 gap-1 md:gap-1.5 bg-[#171514] py-1 rounded-lg border border-[#24201D]">
            <span className="text-amber-400 font-bold">05</span>
            <span className="text-[#57534E]">06</span>
            <span className="text-[#57534E]">07</span>
            <span className="text-[#57534E]">08</span>
          </div>
          {/* Beat 3 */}
          <div className="col-span-4 grid grid-cols-4 gap-1 md:gap-1.5 bg-[#151312] py-1 rounded-lg border border-[#24201D]">
            <span className="text-amber-400 font-bold">09</span>
            <span className="text-[#57534E]">10</span>
            <span className="text-[#57534E]">11</span>
            <span className="text-[#57534E]">12</span>
          </div>
          {/* Beat 4 */}
          <div className="col-span-4 grid grid-cols-4 gap-1 md:gap-1.5 bg-[#171514] py-1 rounded-lg border border-[#24201D]">
            <span className="text-amber-400 font-bold">13</span>
            <span className="text-[#57534E]">14</span>
            <span className="text-[#57534E]">15</span>
            <span className="text-[#57534E]">16</span>
          </div>
        </div>
      </div>

      {/* RECESSED MATRIX TRAY */}
      <div className="rounded-2xl bg-[#0C0A09] p-2 md:p-3.5 shadow-recessed border border-[#26211E]">
        <div className="flex flex-col gap-2">
          {tracks.map((track, trackIdx) => {
            const isFlashing = previewFlash === track.id;

            return (
              <div key={track.id} className="flex items-center gap-1.5 md:gap-2 group">
                {/* TRACK CONTROLS HEADER BAR */}
                <div
                  className={`w-40 md:w-56 shrink-0 bg-[#1A1816] rounded-xl p-2 border border-[#2B2724] flex items-center justify-between shadow-sm transition-all duration-150 ${
                    isFlashing ? 'brightness-125' : ''
                  }`}
                >
                  {/* Preview Trigger & Label */}
                  <button
                    onClick={() => handlePreview(track.id, track.pitchOffset)}
                    className="flex items-center gap-2 font-mono text-[11px] font-bold text-left hover:text-white transition-colors overflow-hidden truncate"
                    title={`Click to preview instrument (Hotkey: ${trackIdx + 1})`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-transform active:scale-125"
                      style={{ backgroundColor: track.accentColor }}
                    />
                    <span className="truncate text-[#E7E5E4]">{track.name}</span>
                  </button>

                  {/* Track Actions (Mute, Solo, Pitch) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Pitch Tone Selector */}
                    <select
                      value={track.pitchOffset}
                      onChange={(e) => setTrackPitch(track.id, parseInt(e.target.value, 10))}
                      className="appearance-none bg-[#24201D] hover:bg-[#2C2723] text-[#A8A29E] hover:text-white border border-[#383330] rounded px-1 py-0.5 text-[9px] font-mono focus:outline-none cursor-pointer"
                      title="Pitch offset in semitones"
                    >
                      <option value={-12}>-12</option>
                      <option value={-7}>-7</option>
                      <option value={-5}>-5</option>
                      <option value={-2}>-2</option>
                      <option value={0}>0</option>
                      <option value={2}>+2</option>
                      <option value={5}>+5</option>
                      <option value={7}>+7</option>
                      <option value={12}>+12</option>
                    </select>

                    {/* Mute Button */}
                    <Toggle
                      pressed={track.isMuted}
                      onPressedChange={() => toggleMute(track.id)}
                      variant="mute"
                      className="w-5 h-5 rounded text-[9px] font-bold"
                      title="Mute Track"
                    >
                      M
                    </Toggle>

                    {/* Solo Button */}
                    <Toggle
                      pressed={track.isSoloed}
                      onPressedChange={() => toggleSolo(track.id)}
                      variant="solo"
                      className="w-5 h-5 rounded text-[9px] font-bold"
                      title="Solo Track"
                    >
                      S
                    </Toggle>
                  </div>
                </div>

                {/* 16 BACKLIT MECHANICAL SILICONE PADS */}
                <div className="grid grid-cols-16 flex-1 gap-1 md:gap-1.5">
                  {track.steps.map((isActive, stepIdx) => {
                    const isQuarterBeat = stepIdx % 4 === 0;
                    const isCurrentPlayhead = currentStep === stepIdx;

                    return (
                      <button
                        key={stepIdx}
                        type="button"
                        onClick={() => {
                          toggleStep(trackIdx, stepIdx);
                          if (!isActive) {
                            handlePreview(track.id, track.pitchOffset);
                          }
                        }}
                        className={`h-11 md:h-12 rounded-lg font-mono text-[10px] font-bold transition-all relative flex items-center justify-center border select-none ${
                          isActive
                            ? 'text-black shadow-md'
                            : 'bg-[#1D1A18] hover:bg-[#282421] text-[#57534E] border-[#2A2522]'
                        } ${
                          isCurrentPlayhead
                            ? 'ring-2 ring-white scale-95 z-10'
                            : 'hover:scale-[1.02]'
                        } ${
                          isQuarterBeat && !isActive ? 'border-l-[#3F3935]' : ''
                        }`}
                        style={{
                          backgroundColor: isActive ? track.accentColor : undefined,
                          borderColor: isActive ? '#FFFFFF' : undefined,
                          boxShadow: isActive
                            ? `0 0 16px ${track.accentColor}80, inset 0 1px 2px rgba(255,255,255,0.6)`
                            : undefined,
                        }}
                      >
                        <span className="opacity-60 text-[9px] pointer-events-none">
                          {stepIdx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
