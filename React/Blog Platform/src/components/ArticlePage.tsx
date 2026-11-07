import React, { useState, useEffect, useRef } from 'react';
import { Article, ReadingMode, ArticleSection } from '../types';
import { useReader } from '../context/ReaderContext';
import {
  Clock,
  Play,
  Pause,
  BookOpen,
  Zap,
  Bookmark,
  Check,
  Copy,
  Scissors,
  Share2,
  ArrowRight,
  ArrowLeft,
  Sliders,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink,
  Film,
  Volume2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  calculateDynamicReadingTime,
  calculateRemainingTime,
  getCategoryById,
  getArticleById,
  mapParagraphToVideoTimestamp,
} from '../services/editorialEngine';
import { InlineFootnotePopover } from './InlineFootnotePopover';
import { SelectionClipper } from './SelectionClipper';
import confetti from 'canvas-confetti';

interface ArticlePageProps {
  article: Article;
  onBackToFeed: () => void;
  onOpenArticle: (articleId: string) => void;
  initialParagraphId?: string;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({
  article,
  onBackToFeed,
  onOpenArticle,
  initialParagraphId,
}) => {
  const {
    settings,
    setIsComfortStudioOpen,
    addArticleToQueue,
    queue,
    updateReadingProgress,
    startPipVideo,
    pip,
    setPipPlaying,
    setPipTime,
    openQuoteCard,
  } = useReader();

  const [readingMode, setReadingMode] = useState<ReadingMode>(
    article.hasVideo && article.format === 'video-essay' ? 'watch' : 'full'
  );

  const [activeSectionId, setActiveSectionId] = useState<string>(article.sections[0]?.id || '');
  const [activeParagraphId, setActiveParagraphId] = useState<string>(initialParagraphId || '');
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isMobileChapterDrawerOpen, setIsMobileChapterDrawerOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Takeaways checklist state
  const [checkedTakeaways, setCheckedTakeaways] = useState<Record<string, boolean>>({});
  const [copiedTakeaways, setCopiedTakeaways] = useState(false);

  // Video element ref in hero
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const heroVideoContainerRef = useRef<HTMLDivElement>(null);
  const readingStageRef = useRef<HTMLDivElement>(null);

  const category = getCategoryById(article.categoryId);
  const isQueued = queue.some((q) => q.articleId === article.id);
  const dynamicTime = calculateDynamicReadingTime(article, readingMode);

  // Scroll to initial paragraph if resumed
  useEffect(() => {
    if (initialParagraphId) {
      setTimeout(() => {
        const el = document.getElementById(initialParagraphId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-rose-500/10', 'rounded-lg', 'transition-all');
          setTimeout(() => el.classList.remove('bg-rose-500/10'), 3000);
        }
      }, 300);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [article.id, initialParagraphId]);

  // Track scroll progress and active section via Intersection Observer
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = totalHeight > 0 ? Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100)) : 0;
      setScrollProgress(progress);

      // Save bookmark progress periodically
      if (article.id && activeParagraphId) {
        updateReadingProgress(article, progress, activeParagraphId, activeSectionId);
      }

      // Check if hero video scrolled out of view and is playing -> activate PiP
      if (heroVideoContainerRef.current && heroVideoRef.current && !heroVideoRef.current.paused) {
        const rect = heroVideoContainerRef.current.getBoundingClientRect();
        if (rect.bottom < 50 && !pip.isActive) {
          startPipVideo(article.id, heroVideoRef.current.currentTime);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article, activeParagraphId, activeSectionId, pip.isActive]);

  // Observer for active headings & paragraphs
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const secId = entry.target.getAttribute('data-section-id');
            const pId = entry.target.getAttribute('id');
            if (secId) setActiveSectionId(secId);
            if (pId) setActiveParagraphId(pId);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    const trackedElements = document.querySelectorAll('[data-section-id], [data-track-paragraph]');
    trackedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [article.id, readingMode]);

  // Handle paragraph click to jump video
  const handleParagraphClick = (paragraphId: string) => {
    if (!article.hasVideo || !article.videoMetadata) return;
    const targetSeconds = mapParagraphToVideoTimestamp(article, paragraphId);
    if (targetSeconds > 0) {
      if (readingMode === 'watch' && heroVideoRef.current) {
        heroVideoRef.current.currentTime = targetSeconds;
        heroVideoRef.current.play().catch(() => {});
      } else {
        startPipVideo(article.id, targetSeconds);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleTakeaway = (id: string) => {
    setCheckedTakeaways((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // Check if all are checked -> confetti!
      const allChecked = article.keyTakeaways.every((kt) => next[kt.id]);
      if (allChecked) {
        try {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } });
        } catch (e) {}
      }
      return next;
    });
  };

  const handleCopyAllTakeaways = () => {
    let text = `# Key Takeaways: ${article.title}\n\n`;
    article.keyTakeaways.forEach((kt, i) => {
      const isDone = checkedTakeaways[kt.id] ? '[x]' : '[ ]';
      text += `${isDone} ${kt.text}\n`;
    });
    text += `\nVia The Chronicle & Essayist (${article.author.name})`;
    navigator.clipboard.writeText(text);
    setCopiedTakeaways(true);
    setTimeout(() => setCopiedTakeaways(false), 2000);
  };

  const scrollToHeading = (headingId: string) => {
    const el = document.getElementById(headingId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSectionId(headingId);
      setIsMobileChapterDrawerOpen(false);
    }
  };

  // Find active section object
  const activeSectionIndex = article.sections.findIndex((s) => s.id === activeSectionId);
  const currentSection = article.sections[Math.max(0, activeSectionIndex)] || article.sections[0];
  const { sectionMinutesLeft, totalMinutesLeft } = calculateRemainingTime(
    article,
    Math.max(0, activeSectionIndex),
    activeParagraphId
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-300 relative ${
        settings.palette === 'midnight'
          ? 'bg-[#0F1115] text-[#F1F3F9]'
          : settings.palette === 'sepia'
          ? 'bg-[#F4ECD8] text-[#3B3228]'
          : 'bg-[#FAF8F5] text-[#18181B]'
      }`}
    >
      {/* Selection Clipper Popup */}
      <SelectionClipper
        article={article}
        onJumpToVideo={(sec) => {
          if (article.hasVideo) {
            startPipVideo(article.id, sec);
          }
        }}
      />

      {/* Top Reading Progress Bar (Fixed Hairline) */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 z-40">
        <div
          className="h-full bg-rose-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        ></div>
      </div>

      {/* Back button and breadcrumb bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <button
          onClick={onBackToFeed}
          className="inline-flex items-center gap-1.5 text-xs font-mono-tabular uppercase tracking-wider opacity-70 hover:opacity-100 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Discovery Feed</span>
        </button>
      </div>

      {/* Hero Header Section */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-8 text-center sm:text-left">
        {/* Category & Freshness Badges */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-4 text-xs font-mono-tabular">
          <span
            className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] ${category?.accentBadgeClass}`}
          >
            {category?.name}
          </span>
          <span className="opacity-40">•</span>
          <span className="opacity-70 uppercase tracking-wider">
            {new Date(article.publishedDate).toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <span className="opacity-40">•</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
            {article.freshnessLabel}
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-serif font-bold tracking-tight leading-[1.08] mb-4">
          {article.title}
        </h1>

        {/* Standfirst / Summary Deck */}
        <p className="text-base sm:text-lg md:text-xl opacity-75 font-interface leading-relaxed max-w-3xl mb-6">
          {article.standfirst}
        </p>

        {/* Author & Read Time Meta Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-inherit/15 text-xs">
          <div className="flex items-center gap-3">
            <img
              src={article.author.avatar}
              alt={article.author.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500/20"
            />
            <div className="text-left">
              <div className="font-semibold text-sm">{article.author.name}</div>
              <div className="text-[11px] opacity-60 font-interface">
                {article.author.title} • {article.author.handle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono-tabular">
            <div className="text-right">
              <div className="font-bold text-rose-600 dark:text-rose-400">
                {dynamicTime.formatted}
              </div>
              <div className="text-[10px] opacity-60">{dynamicTime.speedDetail}</div>
            </div>

            <button
              onClick={() => addArticleToQueue(article)}
              title={isQueued ? 'Article in Queue' : 'Add to Read Later Queue'}
              className={`p-2 rounded-lg border border-inherit hover:border-rose-600 transition-colors cursor-pointer ${
                isQueued ? 'bg-rose-600/10 text-rose-600' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* COMPONENT B: 3-DEPTH ADAPTIVE ARTICLE SWITCHER */}
        <div className="mt-6 mb-2">
          <div
            className={`p-1.5 rounded-2xl border flex flex-col sm:flex-row items-center gap-1.5 shadow-xs transition-all ${
              settings.palette === 'midnight'
                ? 'bg-[#181B22] border-white/10'
                : settings.palette === 'sepia'
                ? 'bg-[#E8DEC6]/60 border-[#3B3228]/15'
                : 'bg-[#F1EDE6] border-black/10'
            }`}
          >
            {/* 1. Full Long-Form Article */}
            <button
              onClick={() => setReadingMode('full')}
              className={`flex-1 w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                readingMode === 'full'
                  ? 'bg-white text-black dark:bg-neutral-900 dark:text-white shadow-sm font-bold ring-1 ring-black/10 dark:ring-white/10'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-rose-600" />
              <span>Full Essay ({article.readTimeMinutes}m)</span>
            </button>

            {/* 2. 60-Sec Key Takeaways */}
            <button
              onClick={() => setReadingMode('brief')}
              className={`flex-1 w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                readingMode === 'brief'
                  ? 'bg-white text-black dark:bg-neutral-900 dark:text-white shadow-sm font-bold ring-1 ring-black/10 dark:ring-white/10'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>60-Sec Executive Brief</span>
            </button>

            {/* 3. Embedded Chapterized Video/Audio Stream */}
            {article.hasVideo && article.videoMetadata ? (
              <button
                onClick={() => setReadingMode('watch')}
                className={`flex-1 w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  readingMode === 'watch'
                    ? 'bg-purple-600 text-white shadow-sm font-bold ring-1 ring-purple-400'
                    : 'opacity-70 hover:opacity-100 text-purple-600 dark:text-purple-400'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Video Essay ({article.videoMetadata.durationFormatted})</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Embedded Video Player Stage (If Watch mode active or toggled) */}
      {article.hasVideo && article.videoMetadata && readingMode === 'watch' && (
        <div ref={heroVideoContainerRef} className="max-w-5xl mx-auto px-4 sm:px-6 mb-12 animate-fade-in">
          <div className="rounded-2xl overflow-hidden shadow-2xl bg-black border border-neutral-800">
            <div className="relative aspect-video">
              <video
                ref={heroVideoRef}
                src={article.videoMetadata.videoUrl}
                poster={article.videoMetadata.posterUrl}
                controls
                className="w-full h-full object-cover"
                onTimeUpdate={() => {
                  if (heroVideoRef.current) {
                    setPipTime(heroVideoRef.current.currentTime);
                  }
                }}
              />
            </div>

            {/* Chapter Timeline Ribbon */}
            <div className="p-4 bg-neutral-900 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-mono-tabular text-purple-400 font-bold mb-2">
                <span className="flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  CHAPTERIZED SCRIPTLINE
                </span>
                <span>BIDIRECTIONAL SCROLL SYNC ENABLED</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {article.videoMetadata.chapters.map((ch) => (
                  <button
                    key={ch.headingId}
                    onClick={() => {
                      if (heroVideoRef.current) {
                        heroVideoRef.current.currentTime = ch.timestampSec;
                        heroVideoRef.current.play().catch(() => {});
                      }
                      scrollToHeading(ch.headingId);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-left text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-mono-tabular text-[10px] text-purple-400 font-bold">
                      {ch.timestampFormatted}
                    </div>
                    <div className="text-[11px] text-white font-medium truncate">{ch.title}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 60-SEC BRIEF VIEW MODE (When brief is active) */}
      {readingMode === 'brief' && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-16 animate-fade-in">
          <div
            className={`p-6 sm:p-8 rounded-2xl border shadow-lg ${
              settings.palette === 'midnight'
                ? 'bg-[#181B22] border-white/10'
                : settings.palette === 'sepia'
                ? 'bg-[#E8DEC6] border-[#3B3228]/20'
                : 'bg-[#F1EDE6] border-black/10'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="font-serif font-bold text-xl">
                {article.briefSummary.takeawayHeadline}
              </h3>
            </div>
            <p className="text-xs opacity-75 font-interface mb-6">
              Synthesized by editorial algorithms and verified by author. Jump directly into corresponding paragraphs below.
            </p>

            {/* Bullets */}
            <div className="space-y-4 mb-8">
              {article.briefSummary.bullets.map((bullet) => (
                <div
                  key={bullet.id}
                  className={`p-4 rounded-xl border transition-all ${
                    settings.palette === 'midnight'
                      ? 'bg-[#1F232D] border-white/10'
                      : settings.palette === 'sepia'
                      ? 'bg-[#F4ECD8] border-[#3B3228]/15'
                      : 'bg-white border-black/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-mono-tabular uppercase font-bold px-2 py-0.5 rounded-full ${
                        bullet.impactLevel === 'critical'
                          ? 'bg-rose-500/10 text-rose-600'
                          : 'bg-blue-500/10 text-blue-600'
                      }`}
                    >
                      {bullet.impactLevel} finding
                    </span>
                    <button
                      onClick={() => {
                        setReadingMode('full');
                        setTimeout(() => scrollToHeading(bullet.targetParagraphId), 150);
                      }}
                      className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span>Jump to: {bullet.targetSectionTitle}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm font-serif leading-relaxed opacity-90">{bullet.text}</p>
                </div>
              ))}
            </div>

            {/* Action Checklist */}
            <div className="border-t border-inherit/20 pt-6">
              <h4 className="text-xs font-mono-tabular uppercase font-bold tracking-wider opacity-70 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Actionable Playbook Checklist
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                {article.briefSummary.actionChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 opacity-85 leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MAIN 3-ZONE EDITORIAL READING STAGE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,68ch)_240px] xl:grid-cols-[240px_minmax(0,68ch)_260px] gap-8 xl:gap-12 justify-center">
          {/* ========================================================
              TRACK 1: DESKTOP LEFT RAIL (COMPONENT C - Living TOC)
             ======================================================== */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              {/* Progress Ring Card */}
              <div
                className={`p-4 rounded-xl border border-inherit transition-all ${
                  settings.palette === 'midnight'
                    ? 'bg-[#181B22]'
                    : settings.palette === 'sepia'
                    ? 'bg-[#EDE2CB]'
                    : 'bg-[#F8F6F0]'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {/* Circular SVG Progress Ring */}
                  <div className="relative w-10 h-10 shrink-0">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-neutral-300 dark:text-neutral-700"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-rose-600 transition-all duration-200"
                        strokeDasharray={`${scrollProgress}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono-tabular font-bold">
                      {Math.round(scrollProgress)}%
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono-tabular uppercase opacity-60">
                      Reading Progress
                    </div>
                    <div className="text-xs font-mono-tabular font-bold text-rose-600 dark:text-rose-400">
                      ~{totalMinutesLeft}m remaining
                    </div>
                  </div>
                </div>

                {/* Section Remaining Time */}
                <div className="text-[11px] font-mono-tabular opacity-75 border-t border-inherit/20 pt-2">
                  <span className="opacity-60">Current Section:</span>{' '}
                  <span className="font-semibold">{sectionMinutesLeft}m left</span>
                </div>
              </div>

              {/* Table of Contents Chapters */}
              <div>
                <h4 className="text-[11px] font-mono-tabular uppercase tracking-wider font-bold opacity-60 mb-3">
                  Table of Contents
                </h4>
                <div className="relative pl-3 border-l-2 border-inherit/30 space-y-3">
                  {article.sections.map((sec, idx) => {
                    const isActive = activeSectionId === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => scrollToHeading(sec.id)}
                        className={`block text-left text-xs transition-all cursor-pointer relative group ${
                          isActive
                            ? 'font-bold text-rose-600 dark:text-rose-400 translate-x-1'
                            : 'opacity-70 hover:opacity-100 hover:translate-x-0.5'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-rose-600"></span>
                        )}
                        <div className="font-mono-tabular text-[10px] opacity-60">
                          {idx + 1 < 10 ? `0${idx + 1}` : idx + 1} • {sec.readTimeEstimateMin}m
                        </div>
                        <div className="line-clamp-2 leading-snug">{sec.title.replace(/^\d+\.\s*/, '')}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Utility Tools */}
              <div className="pt-4 border-t border-inherit/20 space-y-2 text-xs">
                {/* Typography Studio Quick Trigger */}
                <button
                  onClick={() => setIsComfortStudioOpen(true)}
                  className="w-full flex items-center justify-between p-2 rounded-lg border border-inherit hover:border-rose-500/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sliders className="w-3.5 h-3.5 text-rose-600" />
                    <span>Comfort Studio</span>
                  </span>
                  <span className="font-serif font-bold text-xs">Aa</span>
                </button>

                {/* Copy clean link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-between p-2 rounded-lg border border-inherit hover:border-rose-500/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied Link!' : 'Share Clean Link'}</span>
                  </span>
                  {copiedLink && <Check className="w-3 h-3 text-emerald-600" />}
                </button>
              </div>
            </div>
          </aside>

          {/* ========================================================
              TRACK 2: CENTER PROSE COLUMN (Reading Stage)
             ======================================================== */}
          <article
            ref={readingStageRef}
            className={`min-w-0 transition-all ${
              settings.lineWidth === 'focused' ? 'max-w-[68ch]' : 'max-w-[82ch]'
            }`}
          >
            {/* Sections & Paragraphs */}
            <div className="space-y-12">
              {article.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  data-section-id={section.id}
                  className="scroll-mt-28 space-y-6"
                >
                  {/* Section H2 Heading */}
                  <div className="pt-4 border-t border-inherit/15">
                    <h2
                      id={section.headingId}
                      className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-1.5 leading-snug"
                    >
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p className="text-sm opacity-70 font-interface italic">
                        {section.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Paragraph blocks */}
                  {section.paragraphs.map((p) => {
                    const isTracked = p.id === activeParagraphId;

                    return (
                      <div
                        key={p.id}
                        id={p.id}
                        data-track-paragraph="true"
                        onClick={() => handleParagraphClick(p.id)}
                        className={`transition-all duration-300 relative group ${
                          article.hasVideo ? 'cursor-pointer' : ''
                        }`}
                      >
                        {/* Video sync hover indicator */}
                        {article.hasVideo && (
                          <div className="absolute -left-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 hidden sm:block">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </div>
                        )}

                        {/* Rendering by paragraph block type */}
                        {p.type === 'paragraph' && (
                          <p
                            className={`leading-[1.78] transition-all ${
                              settings.typography === 'serif'
                                ? 'font-reading-serif'
                                : settings.typography === 'sans'
                                ? 'font-reading-sans'
                                : 'font-reading-dyslexic'
                            } ${
                              settings.fontSize === 'compact'
                                ? 'text-base sm:text-[17px]'
                                : settings.fontSize === 'large'
                                ? 'text-xl sm:text-[22px]'
                                : 'text-lg sm:text-[19px]'
                            }`}
                          >
                            {/* Parse text for highlighted keywords with inline footnotes */}
                            {p.highlightKeywords && p.highlightKeywords.length > 0 ? (
                              <span>
                                {p.content.split(' ').map((word, wIdx) => {
                                  const clean = word.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                  const glossaryKey = p.highlightKeywords?.find((k) =>
                                    article.inlineGlossary[k]?.term.toLowerCase().includes(clean)
                                  );

                                  if (glossaryKey && article.inlineGlossary[glossaryKey]) {
                                    return (
                                      <React.Fragment key={wIdx}>
                                        <InlineFootnotePopover
                                          item={article.inlineGlossary[glossaryKey]}
                                          onNavigateArticle={onOpenArticle}
                                        >
                                          {word}
                                        </InlineFootnotePopover>{' '}
                                      </React.Fragment>
                                    );
                                  }
                                  return word + ' ';
                                })}
                              </span>
                            ) : (
                              p.content
                            )}
                          </p>
                        )}

                        {p.type === 'blockquote' && (
                          <blockquote className="my-6 pl-5 sm:pl-6 border-l-4 border-rose-600 py-1 font-serif italic text-lg sm:text-xl leading-relaxed opacity-90">
                            “{p.content}”
                            {p.authorNote && (
                              <cite className="block text-xs font-mono-tabular not-italic opacity-60 mt-2 font-semibold">
                                {p.authorNote}
                              </cite>
                            )}
                          </blockquote>
                        )}

                        {p.type === 'pullquote' && (
                          <div className="my-8 py-6 px-6 sm:px-8 border-y-2 border-inherit text-center">
                            <p className="font-serif text-xl sm:text-2xl font-bold italic leading-relaxed text-rose-700 dark:text-rose-400">
                              “{p.content}”
                            </p>
                          </div>
                        )}

                        {p.type === 'callout' && (
                          <div
                            className={`my-6 p-5 rounded-xl border border-inherit leading-relaxed text-sm sm:text-base font-interface ${
                              settings.palette === 'midnight'
                                ? 'bg-[#181B22]'
                                : settings.palette === 'sepia'
                                ? 'bg-[#EFE5CD]'
                                : 'bg-[#F1EDE6]'
                            }`}
                          >
                            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase font-mono-tabular mb-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Core Editorial Maxim</span>
                            </div>
                            <p className="opacity-90">{p.content}</p>
                          </div>
                        )}

                        {p.type === 'diagram' && p.diagramData && (
                          <div
                            className={`my-8 p-5 sm:p-6 rounded-2xl border border-inherit ${
                              settings.palette === 'midnight'
                                ? 'bg-[#181B22]'
                                : settings.palette === 'sepia'
                                ? 'bg-[#EDE2CB]'
                                : 'bg-[#F8F6F0]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-serif font-bold text-base">
                                {p.diagramData.title}
                              </h4>
                              <span className="text-[10px] font-mono-tabular uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold">
                                Visual Model
                              </span>
                            </div>
                            <p className="text-xs opacity-70 font-interface mb-4">
                              {p.diagramData.description}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {p.diagramData.nodes.map((node, nIdx) => (
                                <div
                                  key={nIdx}
                                  className={`p-3.5 rounded-xl border text-center transition-all ${
                                    node.status?.includes('Optimal')
                                      ? 'border-emerald-600 bg-emerald-600/5 ring-1 ring-emerald-600/20'
                                      : 'border-inherit bg-black/5 dark:bg-white/5'
                                  }`}
                                >
                                  <div className="text-xs font-semibold mb-1">{node.label}</div>
                                  <div className="font-mono-tabular font-bold text-sm text-rose-600 dark:text-rose-400">
                                    {node.metric}
                                  </div>
                                  <div className="text-[10px] opacity-60 font-mono-tabular mt-0.5">
                                    {node.status}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {p.type === 'code' && (
                          <div className="my-6 rounded-xl overflow-hidden shadow-md border border-neutral-800 bg-[#0F1115] text-[#F1F3F9] font-mono-tabular text-xs">
                            <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between opacity-70">
                              <span className="uppercase text-[10px] tracking-wider font-bold">
                                {p.codeLanguage || 'Source Code'}
                              </span>
                              <span>TS Strict</span>
                            </div>
                            <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed">
                              <code>{p.content}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>

            {/* CONTEXTUAL KEY TAKEAWAYS UNLOCKER (End of article) */}
            <div
              className={`mt-16 p-6 sm:p-8 rounded-2xl border shadow-xl transition-all ${
                settings.palette === 'midnight'
                  ? 'bg-[#181B22] border-white/10'
                  : settings.palette === 'sepia'
                  ? 'bg-[#E8DEC6] border-[#3B3228]/20'
                  : 'bg-[#F1EDE6] border-black/10'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-inherit/20">
                <div>
                  <span className="text-[10px] font-mono-tabular uppercase font-bold text-rose-600 dark:text-rose-400">
                    Retention &amp; Synthesis
                  </span>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl mt-0.5">
                    Contextual Key Takeaways Unlocker
                  </h3>
                  <p className="text-xs opacity-70 font-interface mt-1">
                    Check off takeaways as you synthesize them, or copy as clean Markdown to your notes.
                  </p>
                </div>

                <button
                  onClick={handleCopyAllTakeaways}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-inherit hover:border-rose-600 transition-colors text-xs font-semibold cursor-pointer"
                >
                  {copiedTakeaways ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              </div>

              {/* Takeaway Checkbox List */}
              <div className="space-y-3">
                {article.keyTakeaways.map((kt) => {
                  const isChecked = checkedTakeaways[kt.id];
                  return (
                    <div
                      key={kt.id}
                      onClick={() => handleToggleTakeaway(kt.id)}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-600/5 line-through opacity-70'
                          : settings.palette === 'midnight'
                          ? 'bg-[#1F232D] border-white/10'
                          : settings.palette === 'sepia'
                          ? 'bg-[#F4ECD8] border-[#3B3228]/15'
                          : 'bg-white border-black/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(isChecked)}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-rose-600 mt-0.5 pointer-events-none"
                      />
                      <div className="flex-1 text-sm font-serif leading-relaxed">
                        <span className="text-[10px] font-mono-tabular uppercase opacity-60 mr-2 font-bold not-italic">
                          [{kt.category}]
                        </span>
                        {kt.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* THE "RABBIT HOLE" CATEGORY MAP (DAG Breadcrumb Trail) */}
            <div className="mt-12 p-6 rounded-2xl border border-inherit/30 bg-black/5 dark:bg-white/5">
              <div className="text-[10px] font-mono-tabular uppercase tracking-wider opacity-60 mb-1 font-bold">
                The Category Rabbit Hole Map
              </div>
              <h4 className="font-serif font-bold text-base mb-4">
                {article.rabbitHole.seriesTitle}
              </h4>

              {/* 3-Step DAG Visual */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Step 1: Prerequisite */}
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    article.rabbitHole.prerequisite
                      ? 'border-inherit hover:border-rose-500 cursor-pointer'
                      : 'opacity-40 border-dashed border-inherit'
                  }`}
                  onClick={() => {
                    if (article.rabbitHole.prerequisite) {
                      onOpenArticle(article.rabbitHole.prerequisite.id);
                    }
                  }}
                >
                  <div className="font-mono-tabular text-[10px] opacity-60 mb-1">
                    ← STEP 01: PREREQUISITE
                  </div>
                  <div className="font-bold line-clamp-2">
                    {article.rabbitHole.prerequisite?.title || 'Foundational Entry'}
                  </div>
                </div>

                {/* Step 2: Current Node */}
                <div className="p-3 rounded-xl border-2 border-rose-600 bg-rose-600/10 text-xs">
                  <div className="font-mono-tabular text-[10px] text-rose-600 dark:text-rose-400 font-bold mb-1">
                    ● CURRENT CHAPTER ({article.rabbitHole.stepIndex} of {article.rabbitHole.totalSteps})
                  </div>
                  <div className="font-bold line-clamp-2">
                    {article.rabbitHole.currentNode.title}
                  </div>
                </div>

                {/* Step 3: Next Step */}
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    article.rabbitHole.nextStep
                      ? 'border-inherit hover:border-rose-500 cursor-pointer'
                      : 'opacity-40 border-dashed border-inherit'
                  }`}
                  onClick={() => {
                    if (article.rabbitHole.nextStep) {
                      onOpenArticle(article.rabbitHole.nextStep.id);
                    }
                  }}
                >
                  <div className="font-mono-tabular text-[10px] opacity-60 mb-1">
                    → NEXT LOGICAL STEP
                  </div>
                  <div className="font-bold line-clamp-2">
                    {article.rabbitHole.nextStep?.title || 'Next in Series'}
                  </div>
                </div>
              </div>
            </div>

            {/* COMPONENT D: CATEGORY "NEXT LOGICAL READ" CONTINUATION FOOTER */}
            <div className="mt-16 pt-8 border-t-2 border-inherit">
              <div className="text-center mb-8">
                <span className="text-[11px] font-mono-tabular uppercase tracking-wider font-bold text-rose-600 dark:text-rose-400">
                  Where to Go Next
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mt-1">
                  The Curated Continuation Trail
                </h3>
                <p className="text-xs opacity-70 max-w-md mx-auto mt-1 font-interface">
                  No algorithmic dead-ends. Choose your trajectory based on your mental bandwidth.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Go Deeper */}
                <div
                  onClick={() => onOpenArticle(article.continuationTrail.goDeeper.articleId)}
                  className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col justify-between ${
                    settings.palette === 'midnight'
                      ? 'bg-[#181B22] border-blue-500/30 hover:border-blue-500'
                      : 'bg-white border-blue-600/20 hover:border-blue-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono-tabular uppercase font-bold text-blue-600 mb-2">
                      <span>↘ Go Deeper</span>
                      <span>{article.continuationTrail.goDeeper.readTime}</span>
                    </div>
                    <h4 className="font-serif font-bold text-base mb-2 leading-snug">
                      {article.continuationTrail.goDeeper.title}
                    </h4>
                    <p className="text-xs opacity-70 font-interface leading-relaxed">
                      {article.continuationTrail.goDeeper.reason}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-inherit/20 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span>Explore Depth</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* 2. Contrarian View */}
                <div
                  onClick={() => onOpenArticle(article.continuationTrail.contrarianView.articleId)}
                  className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col justify-between ${
                    settings.palette === 'midnight'
                      ? 'bg-[#181B22] border-amber-500/30 hover:border-amber-500'
                      : 'bg-white border-amber-600/20 hover:border-amber-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono-tabular uppercase font-bold text-amber-600 mb-2">
                      <span>⇄ Contrarian View</span>
                      <span>{article.continuationTrail.contrarianView.readTime}</span>
                    </div>
                    <h4 className="font-serif font-bold text-base mb-2 leading-snug">
                      {article.continuationTrail.contrarianView.title}
                    </h4>
                    <p className="text-xs opacity-70 font-interface leading-relaxed">
                      {article.continuationTrail.contrarianView.reason}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-inherit/20 flex items-center justify-between text-xs font-bold text-amber-600">
                    <span>Challenge Assumptions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* 3. Quick Action */}
                <div
                  onClick={() => onOpenArticle(article.continuationTrail.quickAction.articleId)}
                  className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col justify-between ${
                    settings.palette === 'midnight'
                      ? 'bg-[#181B22] border-emerald-500/30 hover:border-emerald-500'
                      : 'bg-white border-emerald-600/20 hover:border-emerald-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono-tabular uppercase font-bold text-emerald-600 mb-2">
                      <span>⚡ 3-Min Quick Action</span>
                      <span>{article.continuationTrail.quickAction.readTime}</span>
                    </div>
                    <h4 className="font-serif font-bold text-base mb-2 leading-snug">
                      {article.continuationTrail.quickAction.title}
                    </h4>
                    <p className="text-xs opacity-70 font-interface leading-relaxed">
                      {article.continuationTrail.quickAction.reason}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-inherit/20 flex items-center justify-between text-xs font-bold text-emerald-600">
                    <span>Take Immediate Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* ========================================================
              TRACK 3: DESKTOP RIGHT MARGIN (Contextual Footnotes & Author)
             ======================================================== */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              {/* Author Profile Card */}
              <div
                className={`p-4 rounded-xl border border-inherit text-xs ${
                  settings.palette === 'midnight'
                    ? 'bg-[#181B22]'
                    : settings.palette === 'sepia'
                    ? 'bg-[#EDE2CB]'
                    : 'bg-[#F8F6F0]'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-xs">{article.author.name}</div>
                    <div className="text-[10px] font-mono-tabular opacity-60">
                      {article.author.handle}
                    </div>
                  </div>
                </div>
                <p className="opacity-70 leading-relaxed font-interface mb-3">
                  {article.author.title}. Contributing regularly to the Chronicle’s quarterly print issues.
                </p>
                <div className="text-[10px] font-mono-tabular opacity-60 border-t border-inherit/20 pt-2">
                  Verified Editorial Author • No Sponsored Content
                </div>
              </div>

              {/* Dynamic Context Card Aligned to Section */}
              <div
                className={`p-4 rounded-xl border border-inherit text-xs ${
                  settings.palette === 'midnight'
                    ? 'bg-[#181B22]'
                    : settings.palette === 'sepia'
                    ? 'bg-[#EDE2CB]'
                    : 'bg-[#F8F6F0]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[10px] font-mono-tabular uppercase font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Section Context</span>
                </div>
                <div className="font-serif font-bold text-sm leading-snug mb-1">
                  {currentSection.title}
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed font-interface">
                  {currentSection.subtitle ||
                    'Focus on cognitive ergonomics and intentional pacing.'}
                </p>
              </div>

              {/* Issue Watermark */}
              <div className="text-center text-[10px] font-mono-tabular opacity-40 uppercase tracking-widest pt-4">
                The Chronicle Editorial © 2026
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ========================================================
          COMPONENT C: MOBILE FLOATING BOTTOM BAR (< 1100px)
         ======================================================== */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 flex justify-center">
        <div className="w-full max-w-md bg-neutral-900/90 text-white rounded-full p-2 pl-4 pr-3 shadow-2xl border border-white/20 glass-pill flex items-center justify-between gap-2 text-xs">
          {/* Progress Ring & Section Info */}
          <button
            onClick={() => setIsMobileChapterDrawerOpen(true)}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
          >
            {/* SVG Ring */}
            <div className="relative w-8 h-8 shrink-0">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-neutral-700"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-rose-500"
                  strokeDasharray={`${scrollProgress}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono-tabular font-bold">
                {Math.round(scrollProgress)}%
              </span>
            </div>

            <div className="min-w-0">
              <div className="font-bold text-xs truncate">
                {currentSection.title.replace(/^\d+\.\s*/, '')}
              </div>
              <div className="text-[10px] font-mono-tabular opacity-70">
                {sectionMinutesLeft}m left in section
              </div>
            </div>
          </button>

          {/* Quick Actions: Comfort Studio & Chapters Sheet */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsComfortStudioOpen(true)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <span className="font-serif text-xs font-bold">Aa</span>
            </button>

            <button
              onClick={() => setIsMobileChapterDrawerOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 font-semibold text-[11px]"
            >
              <span>Chapters</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE CHAPTER DRAWER MODAL */}
      {isMobileChapterDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end lg:hidden animate-fade-in">
          <div
            className={`w-full rounded-t-2xl p-6 shadow-2xl border-t max-h-[70vh] overflow-y-auto ${
              settings.palette === 'midnight'
                ? 'bg-[#181B22] text-white border-white/20'
                : settings.palette === 'sepia'
                ? 'bg-[#F4ECD8] text-[#3B3228] border-[#3B3228]/30'
                : 'bg-[#FAF8F5] text-[#18181B] border-black/20'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-inherit/20">
              <h3 className="font-serif font-bold text-base">Chapters &amp; Reading Timeline</h3>
              <button
                onClick={() => setIsMobileChapterDrawerOpen(false)}
                className="p-1 rounded-full opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {article.sections.map((sec, idx) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToHeading(sec.id)}
                    className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      isActive
                        ? 'border-rose-600 bg-rose-600/10 font-bold'
                        : 'border-inherit hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="font-mono-tabular text-[10px] opacity-60">
                        CHAPTER {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </div>
                      <div className="font-serif text-sm">{sec.title}</div>
                    </div>
                    <span className="font-mono-tabular text-[11px] opacity-60">
                      {sec.readTimeEstimateMin}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
