import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Award,
} from 'lucide-react';
import { COACHES } from '../data/mockData';
import { Coach } from '../types';

export const CoachAuditionDeck: React.FC = () => {
  const [selectedCoach, setSelectedCoach] = useState<Coach>(COACHES[0]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const toggleAudio = (coach: Coach) => {
    if (selectedCoach.id === coach.id) {
      setIsPlayingAudio(!isPlayingAudio);
    } else {
      setSelectedCoach(coach);
      setIsPlayingAudio(true);
    }
  };

  return (
    <section className="py-20 md:py-28 border-t border-white/10 relative" id="coaches">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111318] border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Zero Cheesy Cheerleaders
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Coach Archetype & Vibe Audition Deck
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-2">
            Audition your trainers before you train. Switch between scientific biomechanics,
            high-octane engine hypes, and restorative mobility masters.
          </p>
        </div>

        {/* 4 Coach Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {COACHES.map((coach) => {
            const isSelected = selectedCoach.id === coach.id;
            return (
              <div
                key={coach.id}
                onClick={() => setSelectedCoach(coach)}
                className={`cursor-pointer rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#14171E] border-[#D4FF00] shadow-xl shadow-[#D4FF00]/10 scale-[1.02]'
                    : 'bg-[#111318] border-white/10 hover:border-white/30'
                }`}
              >
                <div>
                  {/* Coach Avatar & Style Tag */}
                  <div className="relative mb-4">
                    <img
                      src={coach.avatarUrl}
                      alt={coach.name}
                      className="w-full h-52 object-cover rounded-2xl border border-white/10"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[#D4FF00] font-mono text-[10px] font-bold">
                      {coach.styleLabel}
                    </div>
                  </div>

                  <h3 className="font-display text-xl font-extrabold text-white">
                    {coach.name}
                  </h3>
                  <span className="text-xs font-mono text-zinc-400 block mt-0.5">
                    {coach.title}
                  </span>

                  {/* Philosophy Quote */}
                  <p className="text-xs text-zinc-300 italic mt-3 line-clamp-3 leading-relaxed">
                    "{coach.quote}"
                  </p>
                </div>

                {/* Audio Audition Trigger */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAudio(coach);
                    }}
                    className={`h-9 px-3 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all ${
                      isSelected && isPlayingAudio
                        ? 'bg-[#D4FF00] text-[#08090C]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isSelected && isPlayingAudio ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" /> Playing Cue
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" /> Audition Voice
                      </>
                    )}
                  </button>

                  <span className="text-[10px] font-mono text-zinc-500">
                    {coach.samplePlaylist.bpmRange}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Coach Interactive Spotlight Deck */}
        <div className="rounded-3xl bg-[#111318] border border-white/15 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
          {/* Left Column: Coach Audio & Voiceover Waveform (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/30 text-[#D4FF00] font-mono text-xs font-bold uppercase">
                Active Audition
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {selectedCoach.handle}
              </span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              {selectedCoach.name} — "{selectedCoach.styleLabel}"
            </h3>

            {/* Audio Transcript Card */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 relative">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  Live Coach Audio Cue Sample
                </span>
                <span className="text-zinc-500">0:15 / 0:15 HD Voice</span>
              </div>
              <p className="text-sm text-zinc-200 font-mono italic leading-relaxed">
                {selectedCoach.audioCuePreview}
              </p>

              {/* Animated Waveform Visualizer */}
              <div className="flex items-end gap-1.5 h-8 mt-4 pt-2 border-t border-white/5">
                {[12, 24, 38, 20, 48, 62, 30, 18, 55, 70, 45, 28, 60, 42, 16, 32, 50, 22].map(
                  (val, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        isPlayingAudio ? 'bg-[#D4FF00] animate-pulse' : 'bg-zinc-700'
                      }`}
                      style={{
                        height: isPlayingAudio ? `${Math.max(15, (val * (idx % 2 === 0 ? 1 : 0.7)))}%` : '20%',
                      }}
                    />
                  )
                )}
              </div>
            </div>

            {/* Credentials Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-mono text-zinc-400 mr-2 flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-400" /> Credentials:
              </span>
              {selectedCoach.credentials.map((cred) => (
                <span
                  key={cred}
                  className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300"
                >
                  {cred}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Integrated Apple Music / Spotify Playlist Card (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-black/80 border border-white/10 flex flex-col justify-between gap-6 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Music className="w-4 h-4 text-[#D4FF00]" />
                Curated Workout Soundtrack
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                100% BPM Synced
              </span>
            </div>

            <div>
              <h4 className="font-display text-lg font-bold text-white">
                {selectedCoach.samplePlaylist.title}
              </h4>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                {selectedCoach.samplePlaylist.curator} • {selectedCoach.samplePlaylist.tracks} Tracks
              </p>
              <div className="mt-3 p-3 rounded-xl bg-zinc-900 border border-white/5 text-xs font-mono text-zinc-300 flex items-center justify-between">
                <span>Pacing Cadence:</span>
                <span className="text-[#D4FF00] font-bold">
                  {selectedCoach.samplePlaylist.bpmRange}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://music.apple.com"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white flex items-center justify-center gap-2 transition-all"
              >
                Apple Music <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://spotify.com"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-2 border border-emerald-500/30 transition-all"
              >
                Spotify <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
