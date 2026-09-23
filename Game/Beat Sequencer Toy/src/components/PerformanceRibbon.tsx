import React, { useRef } from 'react';
import { useSequencerStore } from '../store/useSequencerStore';
import { StutterType } from '../types/sequencer';
import { Disc, Sliders } from 'lucide-react';
import { Slider } from './ui/slider';
import { Toggle } from './ui/toggle';
import { audioEngine } from '../audio/audioGraph';

interface PerformanceRibbonProps {
  onTapeStopStateChange: (active: boolean) => void;
}

export const PerformanceRibbon: React.FC<PerformanceRibbonProps> = ({ onTapeStopStateChange }) => {
  const isPlaying = useSequencerStore((s) => s.isPlaying);
  const bpm = useSequencerStore((s) => s.bpm);
  const setBpm = useSequencerStore((s) => s.setBpm);
  const filterCutoff = useSequencerStore((s) => s.masterEffects.filterCutoff);
  const setFilterCutoff = useSequencerStore((s) => s.setFilterCutoff);
  const activeStutter = useSequencerStore((s) => s.masterEffects.activeStutter);
  const setActiveStutter = useSequencerStore((s) => s.setActiveStutter);
  const tapeStopActive = useSequencerStore((s) => s.masterEffects.tapeStopActive);
  const setTapeStopActive = useSequencerStore((s) => s.setTapeStopActive);

  const originalBpmRef = useRef<number>(bpm);
  const tapeIntervalRef = useRef<number | null>(null);

  const engageTapeStop = () => {
    if (!isPlaying || tapeStopActive) return;
    setTapeStopActive(true);
    onTapeStopStateChange(true);
    originalBpmRef.current = bpm;

    let currentBpm = bpm;
    tapeIntervalRef.current = window.setInterval(() => {
      currentBpm = Math.max(12, currentBpm * 0.85);
      setBpm(Math.round(currentBpm));
      if (currentBpm <= 14 && tapeIntervalRef.current) {
        clearInterval(tapeIntervalRef.current);
        tapeIntervalRef.current = null;
      }
    }, 45);

    // Filter sweep down
    if (audioEngine.masterFilter && audioEngine.ctx) {
      audioEngine.masterFilter.frequency.setTargetAtTime(140, audioEngine.ctx.currentTime, 0.25);
    }
  };

  const releaseTapeStop = () => {
    if (!tapeStopActive) return;
    if (tapeIntervalRef.current) {
      clearInterval(tapeIntervalRef.current);
      tapeIntervalRef.current = null;
    }
    setTapeStopActive(false);
    onTapeStopStateChange(false);
    setBpm(originalBpmRef.current);

    // Restore filter cutoff
    if (audioEngine.masterFilter && audioEngine.ctx) {
      audioEngine.masterFilter.frequency.setTargetAtTime(filterCutoff, audioEngine.ctx.currentTime, 0.05);
    }
  };

  const stutterOptions: StutterType[] = ['none', '1/8', '1/16', '1/32'];

  return (
    <section className="mt-4 pt-3.5 border-t border-[#292421] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
      {/* Spring-Loaded Tape Stop Arcade Brake Button */}
      <div className="md:col-span-3">
        <button
          type="button"
          onMouseDown={engageTapeStop}
          onMouseUp={releaseTapeStop}
          onMouseLeave={releaseTapeStop}
          onTouchStart={(e) => {
            e.preventDefault();
            engageTapeStop();
          }}
          onTouchEnd={releaseTapeStop}
          className={`w-full group relative flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl border text-white font-mono font-bold text-xs uppercase tracking-wider transition-all duration-100 select-none ${
            tapeStopActive
              ? 'bg-rose-900 border-rose-500 translate-y-1 shadow-[inset_0_3px_8px_rgba(0,0,0,0.8)]'
              : 'bg-gradient-to-b from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 active:from-rose-800 active:to-rose-900 border-rose-400/40 shadow-[0_4px_14px_rgba(225,29,72,0.4)]'
          }`}
          title="Hold down to trigger analogue tape-stop effect"
        >
          <Disc
            className={`w-4 h-4 transition-transform ${
              tapeStopActive ? 'animate-none opacity-50' : 'animate-spin'
            }`}
            style={{ animationDuration: '3s' }}
          />
          <span>{tapeStopActive ? 'BRAKING...' : 'TAPE STOP (HOLD)'}</span>
        </button>
      </div>

      {/* Resonant Low-Pass Filter Macro Slider */}
      <div className="md:col-span-5 bg-[#181615] p-3 rounded-2xl border border-[#2C2723] flex flex-col gap-1.5 shadow-inner">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-[#A8A29E] flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-500" /> MASTER RESONANT FILTER
          </span>
          <span className="text-amber-400 font-bold">
            {filterCutoff >= 19500 ? '20,000 Hz (WIDE OPEN)' : `${Math.round(filterCutoff).toLocaleString()} Hz`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[#78716C]">MUD</span>
          <Slider
            min={150}
            max={20000}
            step={10}
            value={filterCutoff}
            onChange={(val) => setFilterCutoff(val)}
            accent="amber"
          />
          <span className="text-[9px] font-mono text-[#78716C]">AIR</span>
        </div>
      </div>

      {/* Dynamic Stutter Roll Division Switches */}
      <div className="md:col-span-4 bg-[#181615] p-3 rounded-2xl border border-[#2C2723] flex items-center justify-between shadow-inner">
        <div className="flex flex-col">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#78716C]">
            BEAT STUTTER
          </span>
          <span className="text-[11px] font-mono font-bold text-[#E7E5E4]">ROLL DIVISION</span>
        </div>

        <div className="flex items-center gap-1.5">
          {stutterOptions.map((opt) => (
            <Toggle
              key={opt}
              pressed={activeStutter === opt}
              onPressedChange={() => setActiveStutter(opt)}
              variant="stutter"
              className="px-2.5 py-1.5 rounded-lg text-[11px]"
            >
              {opt === 'none' ? 'OFF' : opt}
            </Toggle>
          ))}
        </div>
      </div>
    </section>
  );
};
