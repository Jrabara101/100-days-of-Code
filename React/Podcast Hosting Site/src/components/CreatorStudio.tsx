import React, { useState } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  BarChart3, 
  Flame, 
  Plus, 
  Scissors, 
  Share2, 
  Copy, 
  Check, 
  Sliders, 
  Radio, 
  Rss, 
  ExternalLink,
  Sparkles,
  Music,
  Users
} from 'lucide-react';
import { usePodcast } from '../context/PodcastContext';
import { Chapter } from '../types';

export const CreatorStudio: React.FC = () => {
  const { 
    currentEpisode, 
    promoteRetentionPeak, 
    updateEpisodeChapters,
    addEpisode,
    setActiveAudiogramClip,
    setIsAudiogramModalOpen
  } = usePodcast();

  const [copiedLink, setCopiedLink] = useState(false);
  const [promotedPeakToast, setPromotedPeakToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'chapters' | 'presskit' | 'upload'>('analytics');
  
  // Chapter editing state
  const [chapters, setChapters] = useState<Chapter[]>(currentEpisode.chapters);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterTime, setNewChapterTime] = useState('');

  // Audio Upload Simulator State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiChecks, setAiChecks] = useState([
    { label: 'Audio Loudness Normalized (-16 LUFS)', done: true },
    { label: '6 Thematic Chapters Auto-Detected', done: true },
    { label: '4 Books, Tools & People Extracted for Companion Shelf', done: true },
    { label: 'Intro Banter Window Flagged (00:00 - 02:40)', done: true },
    { label: 'Peak Listener Excitement Segment Computed (04:12)', done: true }
  ]);

  const handleCopyGuestLink = () => {
    navigator.clipboard.writeText(currentEpisode.guestSharePack.referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePromotePeak = (timestampSec: number) => {
    promoteRetentionPeak(currentEpisode.id, timestampSec);
    setPromotedPeakToast(true);
    setTimeout(() => setPromotedPeakToast(false), 2500);
  };

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    
    // Parse MM:SS or seconds
    let sec = 0;
    if (newChapterTime.includes(':')) {
      const [m, s] = newChapterTime.split(':').map(Number);
      sec = (m || 0) * 60 + (s || 0);
    } else {
      sec = Number(newChapterTime) || 0;
    }

    const newCh: Chapter = {
      id: `ch-custom-${Date.now()}`,
      title: newChapterTitle,
      startTimeSec: sec,
      endTimeSec: sec + 300,
      summary: 'Custom chapter added by creator.'
    };

    const updated = [...chapters, newCh].sort((a, b) => a.startTimeSec - b.startTimeSec);
    setChapters(updated);
    updateEpisodeChapters(currentEpisode.id, updated);
    setNewChapterTitle('');
    setNewChapterTime('');
  };

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  // Retention points
  const retentionCurve = currentEpisode.retentionCurve || [];

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      
      {/* Toast Notification */}
      {promotedPeakToast && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-fadeIn">
          <Flame className="w-4 h-4 fill-current" />
          <span>Retention peak promoted to public "45s Best Moment" hook!</span>
        </div>
      )}

      {/* Creator Top Navigation & Show Overview */}
      <div className="p-6 md:p-8 rounded-3xl bg-[var(--canvas-console)] border border-[var(--border-hairline)] shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Sliders className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-tabular text-xs uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Creator Hosting Hub
                </span>
                <span className="text-xs text-[var(--text-muted)]">•</span>
                <span className="text-xs font-mono-tabular text-[var(--text-secondary)]">
                  {currentEpisode.publishDate}
                </span>
              </div>
              <h2 className="font-display font-extrabold text-2xl text-[var(--text-primary)] tracking-tight">
                Studio Management: EP {currentEpisode.number}
              </h2>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-mono-tabular">
            <div className="px-3 py-2 rounded-xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)]">
              <span className="text-[var(--text-muted)] block text-[10px] uppercase">Episode Listens</span>
              <span className="font-bold text-base text-[var(--text-primary)]">14,820</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)]">
              <span className="text-[var(--text-muted)] block text-[10px] uppercase">Avg. Completion</span>
              <span className="font-bold text-base text-emerald-400">84.2%</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)]">
              <span className="text-[var(--text-muted)] block text-[10px] uppercase">Guest Referrals</span>
              <span className="font-bold text-base text-amber-400">{currentEpisode.guestSharePack.referralListens}</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 pt-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-[var(--canvas-stage)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Episode Drop-Off & Replay Curve</span>
          </button>

          <button
            onClick={() => setActiveTab('chapters')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'chapters'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-[var(--canvas-stage)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Chapter Break Editor ({chapters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('presskit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'presskit'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-[var(--canvas-stage)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Guest Press-Kit & Share Pack</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-[var(--canvas-stage)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>AI Co-Producer & Dropzone</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Episode Drop-Off & Replay Curve */}
      {activeTab === 'analytics' && (
        <section className="p-6 md:p-8 rounded-3xl bg-[var(--canvas-console)] border border-[var(--border-hairline)] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Listener Retention & Replay Heatmap
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Pinpoints which discussion segments kept listeners locked in vs. where listener drop-off occurred.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono-tabular">
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Replay Spikes (+Rewinds)
              </span>
              <span className="flex items-center gap-1.5 text-amber-500 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Audience Retention %
              </span>
            </div>
          </div>

          {/* Interactive Retention SVG Chart */}
          <div className="p-5 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)]">
            <div className="relative h-64 w-full">
              
              {/* SVG Area & Lines */}
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 240">
                {/* Background Grid Lines */}
                <line x1="0" y1="60" x2="1000" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
                <line x1="0" y1="120" x2="1000" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
                <line x1="0" y1="180" x2="1000" y2="180" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />

                {/* Retention Area Gradient */}
                <defs>
                  <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="replayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FB7185" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FB7185" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Replay Bars (Vertical Heatmap Spikes) */}
                {retentionCurve.map((pt, idx) => {
                  const x = (pt.timestampSec / currentEpisode.durationSec) * 1000;
                  const barH = (pt.replayPct / 100) * 160;
                  return (
                    <rect
                      key={idx}
                      x={x - 12}
                      y={240 - barH}
                      width={24}
                      height={barH}
                      rx={4}
                      className={pt.isPeak ? 'fill-rose-500/40 hover:fill-rose-500/70' : 'fill-rose-500/15'}
                    />
                  );
                })}

                {/* Main Retention Smooth Curve */}
                <path
                  d={`M 0,${240 - (retentionCurve[0]?.retentionPct || 100) * 2} ` +
                    retentionCurve.map(pt => {
                      const x = (pt.timestampSec / currentEpisode.durationSec) * 1000;
                      const y = 240 - (pt.retentionPct * 2.1);
                      return `L ${x},${y}`;
                    }).join(' ')
                  }
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3"
                />
              </svg>

              {/* Peak Annotations & 1-Click Promote Actions */}
              {retentionCurve.filter(pt => pt.isPeak).map((peak, idx) => {
                const leftPct = (peak.timestampSec / currentEpisode.durationSec) * 100;
                return (
                  <div
                    key={idx}
                    style={{ left: `${leftPct}%` }}
                    className="absolute top-4 -translate-x-1/2 flex flex-col items-center z-10"
                  >
                    <div className="glass-modal p-2 rounded-xl border border-rose-500/50 shadow-lg text-center whitespace-nowrap">
                      <span className="font-mono-tabular text-[10px] font-bold text-rose-400 block">
                        {peak.annotation}
                      </span>
                      <button
                        onClick={() => handlePromotePeak(peak.timestampSec)}
                        className="mt-1 px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-[10px] shadow-sm transition-colors"
                      >
                        ⚡ Promote to 45s Hook
                      </button>
                    </div>
                    <div className="w-0.5 h-16 bg-rose-500/50" />
                  </div>
                );
              })}
            </div>

            {/* Timeline Axis Labels */}
            <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[var(--text-muted)] pt-3 border-t border-[var(--border-hairline)] mt-2">
              <span>00:00 (Intro)</span>
              <span>10:00</span>
              <span>20:00</span>
              <span>32:00 (Outro)</span>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: Chapter Break Editor */}
      {activeTab === 'chapters' && (
        <section className="p-6 md:p-8 rounded-3xl bg-[var(--canvas-console)] border border-[var(--border-hairline)] shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                Interactive Chapter Editor
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Listeners navigate 4x faster with clear chapter markers. Edit timestamps and titles.
              </p>
            </div>
          </div>

          {/* Chapters Table */}
          <div className="space-y-3">
            {chapters.map((ch, idx) => (
              <div 
                key={ch.id} 
                className="p-3.5 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono-tabular text-xs font-bold text-amber-500 w-14">
                    {Math.floor(ch.startTimeSec / 60)}:{(ch.startTimeSec % 60).toString().padStart(2, '0')}
                  </span>
                  <div>
                    <span className="font-semibold text-xs text-[var(--text-primary)] block">
                      {ch.title}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                      {ch.summary || 'Timestamp marker'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {ch.isIntroBanter && (
                    <span className="text-[10px] font-mono-tabular uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                      Banter Window
                    </span>
                  )}
                  <span className="text-xs text-[var(--text-muted)] font-mono-tabular">
                    #{idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Chapter Form */}
          <form onSubmit={handleAddChapter} className="p-4 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Chapter Title (e.g., Tactical Pricing Breakdown)"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              className="flex-1 w-full px-3 py-2 rounded-xl bg-[var(--canvas-console)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              placeholder="Timestamp (MM:SS)"
              value={newChapterTime}
              onChange={(e) => setNewChapterTime(e.target.value)}
              className="w-full sm:w-36 px-3 py-2 rounded-xl bg-[var(--canvas-console)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 font-mono-tabular"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Chapter</span>
            </button>
          </form>
        </section>
      )}

      {/* TAB 3: Guest Press-Kit & Share Pack Drawer */}
      {activeTab === 'presskit' && (
        <section className="p-6 md:p-8 rounded-3xl bg-[var(--canvas-console)] border border-[var(--border-hairline)] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Dynamic Guest Press-Kit & Share Pack
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Everything for {currentEpisode.guestSharePack.guestName} to share with their audience with 1 click.
              </p>
            </div>

            <button
              onClick={handleCopyGuestLink}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm"
            >
              {copiedLink ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Referral Copied!' : 'Copy Guest Referral Link'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Ready-to-Copy Social Quotes */}
            <div className="p-5 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] space-y-3">
              <h4 className="font-semibold text-xs text-[var(--text-primary)] uppercase tracking-wider font-mono-tabular">
                Curated High-Impact Quotes
              </h4>
              {currentEpisode.guestSharePack.quotes.map((quote, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[var(--canvas-console)] border border-[var(--border-hairline)]">
                  <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
                    "{quote}"
                  </p>
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`"${quote}" — ${currentEpisode.guestSharePack.guestName} on @ResonanceStudio`);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="text-[10px] text-amber-500 font-bold hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy for X / LinkedIn</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Audiogram Card Preview */}
            <div className="p-5 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-xs text-[var(--text-primary)] uppercase tracking-wider font-mono-tabular mb-3">
                  Vertical Social Audiogram Generator
                </h4>
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-amber-600/30 via-neutral-950 to-neutral-900 border border-amber-500/30 text-center space-y-4">
                  <span className="font-mono-tabular text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                    RESONANCE STUDIO • EPISODE {currentEpisode.number}
                  </span>
                  <p className="text-sm font-display font-bold text-white leading-snug">
                    "{currentEpisode.guestSharePack.quotes[0]}"
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-neutral-300">
                    <span className="font-semibold">{currentEpisode.guestSharePack.guestName}</span>
                    <span>•</span>
                    <span className="text-amber-400">14-Day Reverse Trial</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveAudiogramClip({
                    id: `clip-guest`,
                    episodeId: currentEpisode.id,
                    episodeTitle: currentEpisode.title,
                    speakerName: currentEpisode.guestSharePack.guestName,
                    quoteText: currentEpisode.guestSharePack.quotes[0],
                    startTimeSec: currentEpisode.sampleBestMoment.startTimeSec,
                    endTimeSec: currentEpisode.sampleBestMoment.startTimeSec + 30,
                    dateSaved: 'Now',
                    tags: ['Guest Share']
                  });
                  setIsAudiogramModalOpen(true);
                }}
                className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Open Full Audiogram Exporter</span>
              </button>
            </div>

          </div>
        </section>
      )}

      {/* TAB 4: Audio Dropzone & AI Co-Producer */}
      {activeTab === 'upload' && (
        <section className="p-6 md:p-8 rounded-3xl bg-[var(--canvas-console)] border border-[var(--border-hairline)] shadow-xl space-y-6">
          <div>
            <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
              AI Co-Producer & Automated Ingestion
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Drag-and-drop a master WAV/MP3 file. Resonance automatically normalizes broadcast LUFS, detects chapters, extracts mentioned links, and generates synchronized transcripts.
            </p>
          </div>

          {/* Dropzone Box */}
          <div
            onClick={handleSimulateUpload}
            className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-[var(--canvas-stage)] text-center cursor-pointer transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h4 className="font-display font-bold text-base text-[var(--text-primary)] mb-1">
              {isUploading ? `Ingesting & Analyzing Audio (${uploadProgress}%)` : 'Drop Audio File Here or Click to Browse'}
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              Supports 48kHz 24-bit WAV, FLAC, AIFF, or 320kbps MP3 (up to 2GB)
            </p>

            {isUploading && (
              <div className="w-full max-w-xs mx-auto mt-4 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* AI Co-Producer Green Checklist */}
          <div className="p-5 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-xs text-[var(--text-primary)] uppercase tracking-wider font-mono-tabular">
                Automated Processing Verification
              </h4>
            </div>

            <div className="space-y-2">
              {aiChecks.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RSS Distribution Status */}
          <div className="p-5 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Rss className="w-5 h-5 text-amber-500" />
              <div>
                <span className="font-semibold text-xs text-[var(--text-primary)] block">
                  RSS Distribution: 100% Validated
                </span>
                <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                  https://feeds.resonance.fm/episodes.rss
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                ● Apple Podcasts Synced
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                ● Spotify Live
              </span>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};
