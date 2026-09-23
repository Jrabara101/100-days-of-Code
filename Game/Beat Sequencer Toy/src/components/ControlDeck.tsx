import React, { useState, useRef } from 'react';
import { useSequencerStore } from '../store/useSequencerStore';
import { SoundKitId } from '../types/sequencer';
import { Play, Square, Dices, Trash2, Activity, Gauge, Waves, Volume2, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

const SOUND_KITS: { id: SoundKitId; label: string }[] = [
  { id: 'neon_808', label: 'NEON 808' },
  { id: 'lofi_tape', label: 'LO-FI TAPE' },
  { id: 'chiptune', label: 'CHIPTUNE 8-BIT' },
  { id: 'toy_foley', label: 'TOY FOLEY' },
];

export const ControlDeck: React.FC = () => {
  const bpm = useSequencerStore((s) => s.bpm);
  const setBpm = useSequencerStore((s) => s.setBpm);
  const swing = useSequencerStore((s) => s.swing);
  const setSwing = useSequencerStore((s) => s.setSwing);
  const isPlaying = useSequencerStore((s) => s.isPlaying);
  const setIsPlaying = useSequencerStore((s) => s.setIsPlaying);
  const currentStep = useSequencerStore((s) => s.currentStep);
  const activeKit = useSequencerStore((s) => s.activeKit);
  const setActiveKit = useSequencerStore((s) => s.setActiveKit);
  const masterVolume = useSequencerStore((s) => s.masterVolume);
  const setMasterVolume = useSequencerStore((s) => s.setMasterVolume);
  const clearGrid = useSequencerStore((s) => s.clearGrid);
  const rollChaosDice = useSequencerStore((s) => s.rollChaosDice);
  const applyEuclideanRhythm = useSequencerStore((s) => s.applyEuclideanRhythm);
  const tracks = useSequencerStore((s) => s.tracks);

  // Tap tempo state
  const tapTimesRef = useRef<number[]>([]);
  const [tapActive, setTapActive] = useState(false);

  const handleTapTempo = () => {
    const now = performance.now();
    setTapActive(true);
    setTimeout(() => setTapActive(false), 120);

    const taps = tapTimesRef.current;
    taps.push(now);
    if (taps.length > 4) taps.shift();

    if (taps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval > 0) {
        const calculatedBpm = Math.round(60000 / avgInterval);
        setBpm(calculatedBpm);
      }
    }
  };

  const handleEuclideanRoll = () => {
    // Generate complimentary Euclidean polyrhythms across tracks
    // E(4, 16) for kick, E(2, 16) rot 4 for snare, E(8, 16) for hihat, E(3, 16) for clap, etc.
    tracks.forEach((track) => {
      let pulses = 4;
      let rot = 0;
      if (track.id === 'kick') {
        pulses = [4, 5, 6][Math.floor(Math.random() * 3)];
        rot = 0;
      } else if (track.id === 'snare') {
        pulses = [2, 3][Math.floor(Math.random() * 2)];
        rot = 4;
      } else if (track.id === 'hihat') {
        pulses = [7, 8, 11, 13][Math.floor(Math.random() * 4)];
        rot = 1;
      } else if (track.id === 'openhat') {
        pulses = [2, 4][Math.floor(Math.random() * 2)];
        rot = 2;
      } else if (track.id === 'clap') {
        pulses = [2, 4][Math.floor(Math.random() * 2)];
        rot = 4;
      } else if (track.id === 'subbass') {
        pulses = [3, 5][Math.floor(Math.random() * 2)];
        rot = 0;
      }
      applyEuclideanRhythm(track.id, pulses, rot);
    });
  };

  const activeKitObj = SOUND_KITS.find((k) => k.id === activeKit) || SOUND_KITS[0];

  return (
    <section className="flex flex-col gap-4 pb-5 border-b border-[#292421]">
      {/* UPPER DECK: BRANDING, LCD TELEMETRY & TRANSPORT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Brand & Model Badge */}
        <div className="lg:col-span-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 flex items-center justify-center font-mono font-black text-black text-2xl shadow-lg border border-amber-300/40">
            16
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-white uppercase font-sans">
                POCKET-BEAT
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                MK-IV
              </span>
            </div>
            <p className="text-[10px] text-[#78716C] font-mono tracking-wider uppercase">
              TACTILE GROOVEBOX TOY
            </p>
          </div>
        </div>

        {/* LCD Telemetry Display Screen */}
        <div className="lg:col-span-5 flex items-center justify-between bg-black/95 rounded-2xl p-3.5 border border-[#302B27] shadow-lcd">
          {/* BPM Block with Tap Tempo */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#78716C]">
                TEMPO // BPM
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono font-bold text-3xl text-amber-400 tracking-tight">
                  {bpm.toFixed(1)}
                </span>
                <span className="text-[10px] font-mono text-amber-500/60">BPM</span>
              </div>
            </div>

            <button
              onClick={handleTapTempo}
              className={`h-9 px-2.5 flex flex-col items-center justify-center rounded-xl border border-[#3A342F] text-[10px] font-mono transition-all duration-100 ${
                tapActive
                  ? 'bg-amber-500 text-black scale-95 border-amber-400'
                  : 'bg-[#201D1A] hover:bg-[#2C2723] text-amber-400/90'
              }`}
              title="Tap Tempo repeatedly to set BPM"
            >
              <Activity className="w-3.5 h-3.5 mb-0.5" />
              TAP
            </button>
          </div>

          {/* Step Indicator & Kit status */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#78716C]">
                STEP
              </span>
              <span className="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-700/40 font-bold">
                {currentStep >= 0 ? `${String(currentStep + 1).padStart(2, '0')} / 16` : '-- / 16'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#78716C]">
                SWING:
              </span>
              <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                {Math.round(swing * 100)}%
              </span>
              <span className="text-[9px] font-mono text-[#57534E]">•</span>
              <span className="font-mono text-[10px] text-[#A8A29E] uppercase">
                {activeKitObj.label}
              </span>
            </div>
          </div>
        </div>

        {/* Master Transport & Quick Action Controls */}
        <div className="lg:col-span-4 flex items-center justify-end gap-2">
          {/* Play / Stop Button */}
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            variant={isPlaying ? 'destructive' : 'emerald'}
            size="lg"
            className="flex-1 sm:flex-none"
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current mr-2" />
                <span>STOP</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current mr-2" />
                <span>START</span>
              </>
            )}
          </Button>

          {/* Kit Switcher Dropdown */}
          <div className="relative">
            <select
              value={activeKit}
              onChange={(e) => setActiveKit(e.target.value as SoundKitId)}
              className="appearance-none bg-[#201D1B] hover:bg-[#2A2623] border border-[#3A342F] text-xs font-mono text-[#E7E5E4] rounded-xl h-12 pl-3 pr-8 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              {SOUND_KITS.map((k) => (
                <option key={k.id} value={k.id} className="bg-[#1E1B19] text-white">
                  KIT: {k.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-4 text-[#78716C] pointer-events-none" />
          </div>

          {/* Euclidean Generator Roll */}
          <Button
            onClick={handleEuclideanRoll}
            variant="default"
            size="icon"
            className="hover:border-cyan-500 hover:text-cyan-400"
            title="Generate Euclidean Polyrhythm"
          >
            <Sparkles className="w-4 h-4" />
          </Button>

          {/* Randomize Chaos Dice */}
          <Button
            onClick={rollChaosDice}
            variant="default"
            size="icon"
            className="hover:border-amber-500 hover:text-amber-400"
            title="Randomize Pattern Grid (Chaos Dice - Hotkey: R)"
          >
            <Dices className="w-4 h-4" />
          </Button>

          {/* Clear Grid */}
          <Button
            onClick={clearGrid}
            variant="default"
            size="icon"
            className="hover:border-rose-600 hover:text-rose-400"
            title="Clear All Steps (Hotkey: C)"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* LOWER DECK: SLIDERS ROW (BPM, SWING, MASTER VOLUME) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2 px-1 text-xs">
        {/* Tempo Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-[#A8A29E] font-medium flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-500" /> TEMPO
            </span>
            <span className="text-white font-bold">{bpm} BPM</span>
          </div>
          <Slider
            min={40}
            max={240}
            step={1}
            value={bpm}
            onChange={(val) => setBpm(val)}
            accent="amber"
          />
        </div>

        {/* Swing Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-[#A8A29E] font-medium flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-emerald-500" /> GROOVE / SWING
            </span>
            <span className="text-white font-bold">{Math.round(swing * 100)}%</span>
          </div>
          <Slider
            min={0}
            max={0.8}
            step={0.01}
            value={swing}
            onChange={(val) => setSwing(val)}
            accent="emerald"
          />
        </div>

        {/* Master Volume Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-[#A8A29E] font-medium flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-500" /> MASTER OUTPUT
            </span>
            <span className="text-white font-bold">{Math.round(masterVolume * 100)}%</span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(val) => setMasterVolume(val)}
            accent="cyan"
          />
        </div>
      </div>
    </section>
  );
};
