import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Search, 
  Clock, 
  BookOpen, 
  ExternalLink, 
  Bookmark, 
  Mic, 
  Share2, 
  Zap, 
  Check, 
  ArrowDown, 
  Scissors, 
  Volume2, 
  Sparkles,
  MessageSquare,
  FastForward
} from 'lucide-react';
import { usePodcast } from '../context/PodcastContext';
import { Chapter, MentionedResource, TranscriptSentence } from '../types';

export const InteractiveEpisodeStage: React.FC = () => {
  const { 
    currentEpisode, 
    currentTime, 
    isPlaying, 
    togglePlay, 
    seekTo, 
    activeChapter, 
    activeSentenceId,
    skipIntro,
    addToVault,
    setActiveAudiogramClip,
    setIsAudiogramModalOpen,
    setIsVoicemailModalOpen,
    voicemails
  } = usePodcast();

  // Search & Filter state for transcript
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');
  const [selectedSpeakerFilter, setSelectedSpeakerFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [userHasScrolledManually, setUserHasScrolledManually] = useState<boolean>(false);

  // Floating Quote Clipper state
  const [selectedTextClip, setSelectedTextClip] = useState<{
    text: string;
    speakerName: string;
    startTimeSec: number;
    endTimeSec: number;
  } | null>(null);
  const [clipSavedToast, setClipSavedToast] = useState<boolean>(false);

  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const activeSentenceRef = useRef<HTMLSpanElement | null>(null);

  // Auto-scroll choreography
  useEffect(() => {
    if (autoScroll && !userHasScrolledManually && activeSentenceRef.current && transcriptContainerRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeSentenceId, autoScroll, userHasScrolledManually]);

  // Detect manual scroll
  const handleScroll = () => {
    if (!transcriptContainerRef.current) return;
    setUserHasScrolledManually(true);
  };

  const syncToLiveAudio = () => {
    setUserHasScrolledManually(false);
    setAutoScroll(true);
    if (activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Text selection handler for Quote Clipper
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      // Don't immediately clear if clicking floating bar buttons
      return;
    }
    const text = selection.toString().trim();
    if (text.length > 15) {
      // Find sentence matching selection
      let matchSentence: TranscriptSentence | null = null;
      for (const blk of currentEpisode.transcript) {
        for (const s of blk.sentences) {
          if (text.includes(s.text.slice(0, 20)) || s.text.includes(text.slice(0, 20))) {
            matchSentence = s;
            break;
          }
        }
        if (matchSentence) break;
      }

      const start = matchSentence ? matchSentence.startTimeSec : Math.floor(currentTime);
      const end = matchSentence ? matchSentence.endTimeSec : Math.floor(currentTime) + 25;
      const speaker = currentEpisode.speakers.find(sp => sp.id === matchSentence?.speakerId)?.name || 'Speaker';

      setSelectedTextClip({
        text,
        speakerName: speaker,
        startTimeSec: start,
        endTimeSec: end
      });
    }
  };

  const handleSaveSelectedClip = () => {
    if (!selectedTextClip) return;
    addToVault({
      episodeId: currentEpisode.id,
      episodeTitle: currentEpisode.title,
      speakerName: selectedTextClip.speakerName,
      quoteText: selectedTextClip.text,
      startTimeSec: selectedTextClip.startTimeSec,
      endTimeSec: selectedTextClip.endTimeSec,
      tags: [currentEpisode.tags[0] || 'Highlighted Quote']
    });
    setClipSavedToast(true);
    setTimeout(() => {
      setClipSavedToast(false);
      setSelectedTextClip(null);
    }, 2000);
  };

  const handleExportAudiogram = () => {
    if (!selectedTextClip) return;
    setActiveAudiogramClip({
      id: `clip-${Date.now()}`,
      episodeId: currentEpisode.id,
      episodeTitle: currentEpisode.title,
      speakerName: selectedTextClip.speakerName,
      quoteText: selectedTextClip.text,
      startTimeSec: selectedTextClip.startTimeSec,
      endTimeSec: selectedTextClip.endTimeSec,
      dateSaved: 'Just now',
      tags: [currentEpisode.tags[0] || 'Clip']
    });
    setIsAudiogramModalOpen(true);
  };

  // Filtered transcript blocks
  const filteredBlocks = currentEpisode.transcript.filter(block => {
    const matchesSpeaker = selectedSpeakerFilter === 'all' || block.speakerId === selectedSpeakerFilter;
    const matchesQuery = !transcriptSearch.trim() || 
      block.text.toLowerCase().includes(transcriptSearch.toLowerCase());
    return matchesSpeaker && matchesQuery;
  });

  const isWithinIntroBanter = currentTime < currentEpisode.introBanterEndSec;

  return (
    <div className="relative w-full">
      
      {/* Ambient Cover Art Backlight Diffused Glow */}
      <div 
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-3/4 h-80 rounded-full blur-[110px] pointer-events-none opacity-25"
        style={{
          background: `radial-gradient(circle, #F59E0B 0%, rgba(251, 113, 133, 0.4) 50%, transparent 80%)`
        }}
      />

      {/* Stage Header Banner */}
      <section className="relative z-10 p-6 md:p-8 rounded-3xl bg-[var(--canvas-console)] border border-[var(--border-hairline)] mb-6 shadow-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Left Metadata & Title */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-tabular text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30">
                EPISODE {currentEpisode.number} • SEASON {currentEpisode.season}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono-tabular">
                {currentEpisode.publishDate}
              </span>
              <span className="text-xs text-[var(--border-hairline)]">•</span>
              <span className="text-xs font-mono-tabular text-[var(--text-secondary)]">
                {Math.floor(currentEpisode.durationSec / 60)}m Total Runtime
              </span>
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[var(--text-primary)] tracking-tight leading-tight">
              {currentEpisode.title}
            </h1>

            <p className="text-sm md:text-base text-[var(--text-secondary)] max-w-3xl leading-relaxed">
              {currentEpisode.takeawaySummary}
            </p>

            {/* Speaker Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {currentEpisode.speakers.map(speaker => (
                <div 
                  key={speaker.id} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--canvas-stage)] border border-[var(--border-hairline)] text-xs"
                >
                  <img 
                    src={speaker.avatar} 
                    alt={speaker.name}
                    className="w-5 h-5 rounded-full object-cover" 
                  />
                  <span className="font-semibold text-[var(--text-primary)]">{speaker.name}</span>
                  <span className="text-[10px] uppercase font-mono-tabular text-amber-500/90 font-bold">
                    {speaker.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Action & Quick Stat */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-[var(--border-hairline)]">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-neutral-950 font-bold text-sm hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/25 active:scale-95"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Stage</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>Play Episode</span>
                  </>
                )}
              </button>
            </div>

            {/* Smart Skip the Banter Pill */}
            {isWithinIntroBanter && (
              <button
                onClick={skipIntro}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono-tabular font-bold bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 transition-all shadow-sm animate-pulse"
                title="Jump directly to where the core conversation begins"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>⏭️ Skip Banter ({Math.floor(currentEpisode.introBanterEndSec / 60)}:{(currentEpisode.introBanterEndSec % 60).toString().padStart(2, '0')})</span>
              </button>
            )}
          </div>

        </div>

        {/* Chapter Timeline Bar */}
        <div className="mt-8 pt-6 border-t border-[var(--border-hairline)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono-tabular mb-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Active Chapter: <strong className="text-[var(--text-primary)]">{activeChapter?.title || 'Overview'}</strong></span>
            </div>
            <span>{currentEpisode.chapters.length} Chapters</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {currentEpisode.chapters.map((ch, idx) => {
              const isActive = activeChapter?.id === ch.id;
              const isPast = currentTime >= ch.endTimeSec;

              return (
                <button
                  key={ch.id}
                  onClick={() => seekTo(ch.startTimeSec)}
                  className={`text-left p-2.5 rounded-xl border transition-all text-xs font-mono-tabular group ${
                    isActive 
                      ? 'bg-amber-500/15 border-amber-500 text-[var(--text-primary)] ring-1 ring-amber-500/30'
                      : isPast
                        ? 'bg-[var(--canvas-stage)]/60 border-[var(--border-hairline)] text-[var(--text-muted)]'
                        : 'bg-[var(--canvas-stage)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-amber-500/80 font-bold">
                      {Math.floor(ch.startTimeSec / 60)}:{(ch.startTimeSec % 60).toString().padStart(2, '0')}
                    </span>
                    {ch.isIntroBanter && (
                      <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-neutral-800 text-neutral-400">
                        Banter
                      </span>
                    )}
                  </div>
                  <p className="font-medium truncate group-hover:text-amber-400 transition-colors">
                    {ch.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Workspace Split (12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Zone: Bi-Directional Read-Along Transcript (Cols 1–8) */}
        <section className="lg:col-span-8 relative rounded-3xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] p-5 sm:p-7 shadow-lg">
          
          {/* Sticky Transcript Toolbar */}
          <div className="sticky top-16 z-30 mb-6 p-3 rounded-2xl glass-dock border border-[var(--border-hairline)] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-amber-500/70" />
              <input
                type="text"
                value={transcriptSearch}
                onChange={(e) => setTranscriptSearch(e.target.value)}
                placeholder="Search spoken words in this episode..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--canvas-console)] border border-[var(--border-hairline)] focus:outline-none focus:border-amber-500 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors"
              />
              {transcriptSearch && (
                <button
                  onClick={() => setTranscriptSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills & Auto-Scroll */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Speaker Select */}
              <select
                value={selectedSpeakerFilter}
                onChange={(e) => setSelectedSpeakerFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--canvas-console)] border border-[var(--border-hairline)] text-xs text-[var(--text-secondary)] focus:outline-none font-mono-tabular"
              >
                <option value="all">All Speakers</option>
                {currentEpisode.speakers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>

              {/* Auto Scroll Toggle */}
              <button
                onClick={() => {
                  setAutoScroll(!autoScroll);
                  if (!autoScroll) setUserHasScrolledManually(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono-tabular font-medium transition-colors ${
                  autoScroll 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                    : 'bg-[var(--canvas-console)] text-[var(--text-muted)] border border-[var(--border-hairline)]'
                }`}
              >
                Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
              </button>
            </div>

          </div>

          {/* Sync to Live Audio Floating Pill (Shown if user manually scrolled) */}
          {userHasScrolledManually && (
            <div className="sticky top-32 z-20 flex justify-center -mb-8 pointer-events-none">
              <button
                onClick={syncToLiveAudio}
                className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-all transform animate-bounce"
              >
                <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
                <span>↓ Sync to Live Audio</span>
              </button>
            </div>
          )}

          {/* Floating Audio Quote Clipper Bar */}
          {selectedTextClip && (
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 glass-modal p-3.5 rounded-2xl shadow-2xl border border-amber-500/50 flex flex-col sm:flex-row items-center gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                <span className="font-mono-tabular text-xs font-bold text-amber-400">
                  {Math.floor(selectedTextClip.startTimeSec / 60)}:{(selectedTextClip.startTimeSec % 60).toString().padStart(2, '0')} – {Math.floor(selectedTextClip.endTimeSec / 60)}:{(selectedTextClip.endTimeSec % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  • {selectedTextClip.endTimeSec - selectedTextClip.startTimeSec}s Clip
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => seekTo(selectedTextClip.startTimeSec)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[var(--text-primary)] transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={handleSaveSelectedClip}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm"
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                  <span>Save to Vault</span>
                </button>

                <button
                  onClick={handleExportAudiogram}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs hover:brightness-110 transition-all shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Export Audiogram</span>
                </button>

                <button
                  onClick={() => setSelectedTextClip(null)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Toast on clip save */}
          {clipSavedToast && (
            <div className="fixed bottom-28 right-8 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs shadow-xl flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Quote saved to your Personal Vault!</span>
            </div>
          )}

          {/* Dialogue Blocks List */}
          <div 
            ref={transcriptContainerRef}
            onScroll={handleScroll}
            onMouseUp={handleMouseUp}
            className="space-y-6 max-h-[720px] overflow-y-auto pr-2 scroll-smooth select-text"
          >
            {filteredBlocks.length === 0 ? (
              <div className="p-12 text-center text-[var(--text-muted)]">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                <p className="text-sm">No spoken lines matched "{transcriptSearch}".</p>
                <p className="text-xs mt-1">Try another keyword or reset the search query.</p>
              </div>
            ) : (
              filteredBlocks.map((block) => {
                const speaker = currentEpisode.speakers.find(s => s.id === block.speakerId);
                const blockMins = Math.floor(block.startTimeSec / 60);
                const blockSecs = (block.startTimeSec % 60).toString().padStart(2, '0');

                return (
                  <div 
                    key={block.id}
                    className="p-4 rounded-2xl bg-[var(--canvas-console)]/70 border border-[var(--border-hairline)] transition-colors hover:border-amber-500/20"
                  >
                    {/* Speaker Header with Clickable Timestamp */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={speaker?.avatar} 
                          alt={speaker?.name}
                          className="w-7 h-7 rounded-full object-cover border border-[var(--border-hairline)]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-[var(--text-primary)]">
                              {speaker?.name}
                            </span>
                            <span className={`text-[9px] uppercase font-mono-tabular font-bold px-1.5 py-0.2 rounded ${
                              speaker?.role === 'host' 
                                ? 'bg-amber-500/15 text-amber-500' 
                                : 'bg-indigo-500/15 text-indigo-400'
                            }`}>
                              {speaker?.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Clickable Monospace Timestamp Pill */}
                      <button
                        onClick={() => seekTo(block.startTimeSec)}
                        className="font-mono-tabular text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--canvas-stage)] text-amber-500/90 border border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
                        title="Jump audio to this block"
                      >
                        [{blockMins}:{blockSecs}]
                      </button>
                    </div>

                    {/* Sentence Paragraph with Real-Time Illuminating Highlighter */}
                    <p className="text-sm md:text-base leading-relaxed text-[var(--text-secondary)] font-medium">
                      {block.sentences.map((sentence) => {
                        const isActive = activeSentenceId === sentence.id;

                        return (
                          <span
                            key={sentence.id}
                            ref={isActive ? (el) => { activeSentenceRef.current = el; } : null}
                            onClick={() => seekTo(sentence.startTimeSec)}
                            className={`cursor-pointer transition-all duration-200 px-1 py-0.5 rounded ${
                              isActive
                                ? 'transcript-line-active text-[var(--text-primary)] font-semibold shadow-sm'
                                : 'opacity-60 hover:opacity-100 hover:text-[var(--text-primary)] hover:bg-white/5'
                            }`}
                          >
                            {sentence.text}{' '}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="italic">
              💡 Tip: Highlight any 1–3 sentences with your cursor to save a quote or export an animated audiogram.
            </span>
            <span className="font-mono-tabular">
              {filteredBlocks.length} Dialogue Blocks
            </span>
          </div>
        </section>

        {/* Right Zone: Mentioned in This Episode Companion Shelf (Cols 9–12) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Companion Shelf Container */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--canvas-console)] border border-[var(--border-hairline)] shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-hairline)]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <h3 className="font-display font-bold text-sm tracking-tight text-[var(--text-primary)] uppercase">
                  Mentioned in This Episode
                </h3>
              </div>
              <span className="font-mono-tabular text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold">
                {currentEpisode.resources.length} Linked
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)] mb-4">
              Structured visual shelf replacing messy URL walls. Click any timestamp to jump to the conversation moment.
            </p>

            {/* Categorized Resource Cards */}
            <div className="space-y-3.5">
              {currentEpisode.resources.map((res) => {
                return (
                  <div
                    key={res.id}
                    className="p-3.5 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] hover:border-amber-500/40 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono-tabular font-bold px-2 py-0.5 rounded bg-black/40 text-amber-400 border border-amber-500/20">
                        {res.categoryLabel}
                      </span>

                      {/* Clickable Timestamp Badge */}
                      <button
                        onClick={() => seekTo(res.timestampSec)}
                        className="font-mono-tabular text-[10px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 group-hover:underline"
                        title="Jump audio to this discussion"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{res.badgeText}</span>
                      </button>
                    </div>

                    <h4 className="font-semibold text-xs text-[var(--text-primary)] mb-1 leading-snug group-hover:text-amber-400 transition-colors">
                      {res.title}
                    </h4>

                    {res.authorOrHost && (
                      <p className="text-[11px] text-[var(--text-muted)] mb-1.5 font-medium">
                        by {res.authorOrHost}
                      </p>
                    )}

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2 leading-relaxed">
                      {res.description}
                    </p>

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      <span>Explore Resource</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Listener Q&A / Voicemail Mailbag Trigger Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-[var(--canvas-console)] to-rose-500/10 border border-amber-500/30 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-4 h-4 text-amber-500" />
              <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                Listener Q&A / Voicemail Mailbag
              </h4>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Have a burning question about solo builder economics or pricing? Record a 60-second audio voicemail for next week's show.
            </p>

            <button
              onClick={() => setIsVoicemailModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <Mic className="w-4 h-4 fill-current" />
              <span>🎙️ Leave a 60-Sec Question</span>
            </button>

            <div className="mt-3 pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>{voicemails.length} Questions Submitted</span>
              <span className="text-emerald-400 font-medium">● Host actively reviewing</span>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
};
