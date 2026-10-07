import React, { useState, useEffect } from 'react';
import { Beatmap } from '../../types/game';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Play, Volume2, Flame, Gauge, Zap, Ghost, Wrench, Settings, Users, Sparkles } from 'lucide-react';
import { globalAudioEngine } from '../../audio/RhythmAudioEngine';

interface SongSelectDashboardProps {
  songs: Beatmap[];
  onSelectSong: (song: Beatmap, options: { ghostEnabled: boolean }) => void;
  scrollSpeed: number;
  onSetScrollSpeed: (speed: number) => void;
  zenMode: boolean;
  onToggleZenMode: () => void;
  onOpenCalibration: () => void;
  onOpenChartCreator: () => void;
  onOpenOnlineDuel: () => void;
}

export const SongSelectDashboard: React.FC<SongSelectDashboardProps> = ({
  songs,
  onSelectSong,
  scrollSpeed,
  onSetScrollSpeed,
  zenMode,
  onToggleZenMode,
  onOpenCalibration,
  onOpenChartCreator,
  onOpenOnlineDuel,
}) => {
  const [selectedSongId, setSelectedSongId] = useState<string>(songs[0]?.id || '');
  const [previewingSongId, setPreviewingSongId] = useState<string | null>(null);
  const [ghostDuelEnabled, setGhostDuelEnabled] = useState<boolean>(true);

  const selectedSong = songs.find(s => s.id === selectedSongId) || songs[0];

  const handleTogglePreview = (song: Beatmap) => {
    if (previewingSongId === song.id) {
      globalAudioEngine.stopSynthTrack();
      setPreviewingSongId(null);
    } else {
      globalAudioEngine.startSynthTrack(song.bpm, song.synthTheme || 'synthwave');
      setPreviewingSongId(song.id);
    }
  };

  useEffect(() => {
    return () => {
      globalAudioEngine.stopSynthTrack();
    };
  }, []);

  const getDifficultyBadgeVariant = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'emerald';
      case 'Normal': return 'primary';
      case 'Hard': return 'gold';
      case 'Expert': return 'fever';
      default: return 'default';
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background text-white p-4 md:p-8 overflow-y-auto">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-primary rounded-sm shadow-neon-cyan animate-pulse" />
            <h1 className="font-display text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
              CYBER//BEAT <span className="text-primary font-normal">VELOCITY COCKPIT</span>
            </h1>
          </div>
          <p className="text-xs font-mono text-gray-400 mt-1">
            ARCADE HIGHWAY v2.4 • SUB-MILLISECOND AUDIO TIMING ENGINE
          </p>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="glass" size="sm" onClick={onOpenCalibration}>
            <Settings className="w-4 h-4 mr-1.5 text-primary" /> Calibrate Sync
          </Button>

          <Button variant="glass" size="sm" onClick={onOpenChartCreator}>
            <Wrench className="w-4 h-4 mr-1.5 text-accent-gold" /> Beatmap Studio
          </Button>

          <Button variant="glass" size="sm" onClick={onOpenOnlineDuel}>
            <Users className="w-4 h-4 mr-1.5 text-secondary" /> Room Duels
          </Button>
        </div>
      </header>

      {/* Main Selection Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 flex-1">
        {/* Left 7 Columns: Song Track List */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-gray-400">
              AVAILABLE TRACK CATALOG ({songs.length})
            </span>
            <span className="font-mono text-xs text-primary">SELECT WITH ARROWS / CLICK</span>
          </div>

          <div className="flex flex-col gap-3">
            {songs.map((song) => {
              const isSelected = song.id === selectedSongId;
              const isPreviewing = previewingSongId === song.id;

              return (
                <div
                  key={song.id}
                  onClick={() => setSelectedSongId(song.id)}
                  className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-surface-mid/90 shadow-[0_0_20px_rgba(0,240,255,0.2)] translate-x-1.5'
                      : 'border-white/10 bg-surface-low/70 hover:bg-surface-mid/50 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Track Number / Star rating icon */}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center font-display font-black text-lg transition-transform ${
                        isSelected
                          ? 'bg-primary text-black shadow-neon-cyan scale-105'
                          : 'bg-surface-high text-gray-400 group-hover:text-white'
                      }`}
                    >
                      {song.starRating}★
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-base text-white group-hover:text-primary transition-colors">
                          {song.title}
                        </span>
                        {song.id === 'tutorial-01' && (
                          <Badge variant="emerald">DROP & TAP</Badge>
                        )}
                      </div>
                      <span className="text-xs font-mono text-gray-400">
                        {song.artist} • {song.notes.length} NOTES
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={getDifficultyBadgeVariant(song.difficulty)}>
                      {song.difficulty}
                    </Badge>
                    <div className="hidden sm:flex flex-col items-end text-xs font-mono text-gray-400">
                      <span className="font-bold text-white">{song.bpm} BPM</span>
                      <span>{(song.durationMs / 1000).toFixed(0)}s</span>
                    </div>
                    {/* Audio Preview Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePreview(song);
                      }}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                        isPreviewing
                          ? 'border-primary bg-primary/20 text-primary shadow-neon-cyan animate-pulse'
                          : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                      aria-label="Preview track"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Selected Track Showcase & Stage Cockpit */}
        {selectedSong && (
          <div className="lg:col-span-5 flex flex-col gap-5">
            <Card className="border-primary/40 bg-surface-low/90 shadow-2xl relative overflow-hidden">
              {/* Background Cyber Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <Badge variant={getDifficultyBadgeVariant(selectedSong.difficulty)}>
                    {selectedSong.difficulty} LEVEL {selectedSong.starRating}
                  </Badge>
                  <span className="font-mono text-xs text-accent-gold flex items-center gap-1 font-bold">
                    <Flame className="w-3.5 h-3.5 text-accent-fever" /> FEVER ENGINE READY
                  </span>
                </div>
                <CardTitle className="text-2xl mt-2">{selectedSong.title}</CardTitle>
                <CardDescription>{selectedSong.artist}</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-surface-mid/60 border border-white/10 font-mono text-center">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">TEMPO</div>
                    <div className="text-lg font-bold text-primary">{selectedSong.bpm} BPM</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">NOTES</div>
                    <div className="text-lg font-bold text-accent-gold">{selectedSong.notes.length}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">LENGTH</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {Math.round(selectedSong.durationMs / 1000)}s
                    </div>
                  </div>
                </div>

                {/* Highway Scroll Speed (Approach Rate) Setting */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-primary" /> Scroll Speed (Approach Rate)
                    </span>
                    <span className="font-bold text-primary font-mono text-sm">
                      {scrollSpeed.toFixed(1)}x
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[1.5, 2.0, 2.5, 3.2, 4.0].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => onSetScrollSpeed(spd)}
                        className={`py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                          scrollSpeed === spd
                            ? 'bg-primary text-black shadow-neon-cyan'
                            : 'bg-surface-high/80 text-gray-300 hover:bg-surface-high'
                        }`}
                      >
                        {spd.toFixed(1)}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modifiers: Zen Mode & Ghost Duel */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {/* Zen Mode */}
                  <div
                    onClick={onToggleZenMode}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      zenMode
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-surface-mid/40 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-bold">ZEN MODE</span>
                      <span className="text-[10px]">No failing</span>
                    </div>
                  </div>

                  {/* Ghost Duel */}
                  <div
                    onClick={() => setGhostDuelEnabled(!ghostDuelEnabled)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      ghostDuelEnabled
                        ? 'border-secondary bg-secondary/10 text-secondary'
                        : 'border-white/10 bg-surface-mid/40 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <Ghost className="w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-bold">GHOST DUEL</span>
                      <span className="text-[10px]">Race rival telemetry</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-base py-6 shadow-neon-cyan"
                  onClick={() => {
                    globalAudioEngine.stopSynthTrack();
                    onSelectSong(selectedSong, { ghostEnabled: ghostDuelEnabled });
                  }}
                >
                  <Play className="w-5 h-5 mr-2 fill-current" /> LAUNCH TRACK
                </Button>
                <div className="text-center text-[11px] font-mono text-gray-400">
                  STANDARD 4-KEY BINDINGS: [ D ] [ F ] [ J ] [ K ] • TOUCH COMPATIBLE
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
