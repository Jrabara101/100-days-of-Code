import React, { useState } from 'react';
import { Disc3, ThumbsUp, Play, Pause, Plus, Sparkles, Volume2, Music } from 'lucide-react';

export function VinylShelfPlayer({
  event,
  tracks,
  onUpvoteTrack,
  onAddNewTrack
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [selectedVibe, setSelectedVibe] = useState('All');
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const eventTracks = tracks.filter(t => !t.archetype || t.archetype === event.id);
  const currentPlayingTrack = eventTracks[activeTrackIndex] || eventTracks[0] || {
    title: 'September',
    artist: 'Earth, Wind & Fire',
    category: 'Peak Dancefloor',
    tempo: '126 BPM'
  };

  const vibes = ['All', 'Peak Dancefloor', 'Cocktail Hour', 'Late Night'];

  const displayedTracks = eventTracks.filter(t => {
    if (selectedVibe === 'All') return true;
    return t.category === selectedVibe;
  });

  const handleCreateTrack = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddNewTrack({
      title: newTitle.trim(),
      artist: newArtist.trim() || 'Guest Choice',
      category: selectedVibe !== 'All' ? selectedVibe : 'Peak Dancefloor',
      submittedBy: 'You',
      upvotes: 1
    });
    setNewTitle('');
    setNewArtist('');
    setShowAddModal(false);
  };

  return (
    <section id="soundtrack" className="w-full mt-14 pt-8 border-t border-theme-border">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-theme-gold font-semibold mb-1">
            <Disc3 className="w-3.5 h-3.5" />
            <span>Crowd-Curated Soundtrack</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-theme-primary font-normal">
            The Live Vinyl Shelf & Dancefloor Queue
          </h2>
          <p className="text-xs sm:text-sm text-theme-secondary max-w-xl mt-1">
            Built track-by-track from guests' RSVP responses. Upvote the anthems you want spinning when the night peaks.
          </p>
        </div>

        {/* Add Track Action */}
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-accent text-white text-xs font-medium hover:brightness-110 transition shadow-sm self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nominate a Track</span>
        </button>
      </div>

      {/* Main Player & Vinyl Deck Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-theme-card border border-theme-border shadow-paper grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column (5 Cols): The Tactile Spinning Vinyl Record */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            
            {/* Spinning Vinyl Disc */}
            <div 
              className={`w-full h-full rounded-full bg-[#111113] shadow-2xl flex items-center justify-center relative border-4 border-neutral-800 ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
            >
              {/* Grooves */}
              <div className="absolute inset-4 rounded-full border border-neutral-800/80 pointer-events-none"></div>
              <div className="absolute inset-8 rounded-full border border-neutral-700/60 pointer-events-none"></div>
              <div className="absolute inset-12 rounded-full border border-neutral-800/80 pointer-events-none"></div>
              <div className="absolute inset-16 rounded-full border border-neutral-700/50 pointer-events-none"></div>

              {/* Center Vinyl Label */}
              <div 
                className="w-24 h-24 rounded-full p-2 flex flex-col items-center justify-center text-center shadow-md relative z-10"
                style={{ backgroundColor: event.goldColor || '#C5A059' }}
              >
                <div className="text-[8px] font-mono uppercase tracking-widest text-neutral-900 font-bold">
                  SIDE A • 33 RPM
                </div>
                <div className="text-[10px] font-serif font-bold text-neutral-950 truncate max-w-[80px] my-0.5">
                  {currentPlayingTrack.title}
                </div>
                <div className="w-3.5 h-3.5 rounded-full bg-neutral-900 border-2 border-white/50"></div>
              </div>
            </div>

            {/* Tonearm Simulation */}
            <div 
              className={`absolute -top-3 right-4 w-24 h-32 pointer-events-none transition-transform duration-700 origin-top-right ${
                isPlaying ? 'rotate-12' : '-rotate-6'
              }`}
            >
              {/* Tonearm pivot */}
              <div className="w-6 h-6 rounded-full bg-neutral-400 border border-neutral-300 shadow-md"></div>
              {/* Metal arm rod */}
              <div className="w-1.5 h-28 bg-gradient-to-b from-neutral-300 via-neutral-400 to-neutral-500 ml-2 rounded-full"></div>
              {/* Cartridge head */}
              <div className="w-4 h-6 bg-neutral-800 rounded-sm ml-1 -mt-1 shadow-sm"></div>
            </div>

          </div>

          {/* Player Controls Under Record */}
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full bg-theme-accent text-white flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg"
              title={isPlaying ? 'Pause Vinyl' : 'Play Vinyl'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <div>
              <div className="font-serif font-semibold text-theme-primary text-base">
                {currentPlayingTrack.title}
              </div>
              <div className="text-xs text-theme-secondary">
                {currentPlayingTrack.artist} • <span className="font-mono text-theme-accent">{currentPlayingTrack.tempo || '120 BPM'}</span>
              </div>
            </div>
          </div>

          {/* Sound Wave Frequency Visualizer */}
          {isPlaying && (
            <div className="flex items-center gap-1 mt-4 h-6">
              {[40, 70, 90, 60, 30, 85, 100, 65, 45, 95, 75, 50, 80, 60].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-theme-accent rounded-full transition-all duration-300 animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${(i * 0.1).toFixed(1)}s`
                  }}
                ></div>
              ))}
            </div>
          )}

        </div>

        {/* Right Column (7 Cols): The Queue & Upvote Rankings */}
        <div className="lg:col-span-7">
          
          {/* Vibe Tabs */}
          <div className="flex items-center justify-between gap-2 mb-4 border-b border-theme-border pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {vibes.map(v => (
                <button
                  key={v}
                  onClick={() => setSelectedVibe(v)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    selectedVibe === v
                      ? 'bg-theme-accent text-white font-semibold'
                      : 'bg-theme-inset text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <span className="text-xs font-mono text-theme-muted hidden sm:inline">
              {displayedTracks.length} Tracks in Queue
            </span>
          </div>

          {/* Track List */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {displayedTracks.map((track, idx) => {
              const isCurrent = track.title === currentPlayingTrack.title;
              return (
                <div
                  key={track.id || idx}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-theme-foil bg-theme-inset ring-1 ring-theme-foil'
                      : 'border-theme-border bg-theme-card hover:bg-theme-inset/50'
                  }`}
                >
                  <div 
                    onClick={() => {
                      const realIndex = eventTracks.findIndex(t => t.title === track.title);
                      if (realIndex >= 0) setActiveTrackIndex(realIndex);
                      setIsPlaying(true);
                    }}
                    className="cursor-pointer flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-theme-card border border-theme-border flex items-center justify-center font-mono text-xs font-bold text-theme-muted flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-theme-primary text-xs sm:text-sm truncate">
                        {track.title}
                      </div>
                      <div className="text-[11px] text-theme-muted truncate">
                        {track.artist} • <span className="text-theme-secondary">Nominated by {track.submittedBy}</span>
                      </div>
                    </div>
                  </div>

                  {/* Upvote Pill */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-card border border-theme-border text-theme-muted hidden sm:inline">
                      {track.category}
                    </span>

                    <button
                      onClick={() => onUpvoteTrack(track.id || track.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-theme-border bg-theme-card hover:border-theme-foil text-xs text-theme-primary hover:text-theme-accent transition shadow-sm active:scale-95"
                      title="Upvote this track"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-theme-accent" />
                      <span className="font-mono font-bold">{track.upvotes || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Modal to Nominate a Track */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-theme-card border border-theme-foil p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-serif font-bold text-theme-primary mb-2">
              Nominate a Dancefloor Anthem
            </h3>
            <p className="text-xs text-theme-secondary mb-4">
              Add your guarantee track to the vinyl shelf. Other guests can upvote it to shape the evening's DJ set!
            </p>

            <form onSubmit={handleCreateTrack} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-theme-muted uppercase mb-1">
                  Track Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., September"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-inset text-theme-primary text-xs focus:outline-none focus:ring-1 focus:ring-theme-foil"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-theme-muted uppercase mb-1">
                  Artist:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Earth, Wind & Fire"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-inset text-theme-primary text-xs focus:outline-none focus:ring-1 focus:ring-theme-foil"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-xs text-theme-muted hover:text-theme-primary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-theme-accent text-white font-medium text-xs hover:brightness-110 transition shadow-sm"
                >
                  Add to Vinyl Shelf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}

