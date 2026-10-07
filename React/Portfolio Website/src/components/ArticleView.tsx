import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Calendar, Share2, Twitter, Copy, Check, Sparkles, MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import { Post } from '../types';
import { StageBadge } from './StageBadge';
import { ArticleRenderer } from './ArticleRenderer';
import { StorageEngine } from '../lib/storage';

interface ArticleViewProps {
  post: Post;
  allPosts: Post[];
  onBack: () => void;
  onSelectPost: (post: Post) => void;
  onOpenOGPreview?: (post: Post) => void;
}

interface FloatingClap {
  id: number;
  label: string;
}

export const ArticleView: React.FC<ArticleViewProps> = ({
  post,
  allPosts,
  onBack,
  onSelectPost,
  onOpenOGPreview,
}) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [claps, setClaps] = useState<number>(post.claps_count || 0);
  const [userClaps, setUserClaps] = useState<number>(0);
  const [floatingClaps, setFloatingClaps] = useState<FloatingClap[]>([]);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);

  // Quote sharing toolbar state
  const [selectedQuote, setSelectedQuote] = useState<string>('');
  const [quoteToolbarPos, setQuoteToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [quoteCopied, setQuoteCopied] = useState<boolean>(false);

  // Table of Contents
  const [headings, setHeadings] = useState<Array<{ id: string; text: string; level: number }>>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  const articleContentRef = useRef<HTMLDivElement>(null);

  // Load user claps and increment view count on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setUserClaps(StorageEngine.getUserClapsForPost(post.id));
    StorageEngine.incrementViews(post.id);
  }, [post.id]);

  // Track scroll progress for the top 2px bar & scroll-spy
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }

      // Scroll-spy for headings
      const headingElements = document.querySelectorAll('h2, h3');
      let currentId = '';
      headingElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140) {
          currentId = el.id;
        }
      });
      if (currentId) {
        setActiveHeadingId(currentId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parse headings from Markdown content for interactive TOC
  useEffect(() => {
    const lines = post.content.split('\n');
    const extracted: Array<{ id: string; text: string; level: number }> = [];

    lines.forEach((line) => {
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);

      if (h2Match) {
        const text = h2Match[1].replace(/\*\*/g, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        extracted.push({ id, text, level: 2 });
      } else if (h3Match) {
        const text = h3Match[1].replace(/\*\*/g, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        extracted.push({ id, text, level: 3 });
      }
    });

    setHeadings(extracted);

    // Apply IDs to h2/h3 in the rendered DOM after render
    setTimeout(() => {
      const container = articleContentRef.current;
      if (!container) return;
      const h2s = container.querySelectorAll('h2');
      const h3s = container.querySelectorAll('h3');

      h2s.forEach(h => {
        const id = h.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (id) h.id = id;
      });
      h3s.forEach(h => {
        const id = h.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (id) h.id = id;
      });
    }, 100);
  }, [post.content]);

  // Text selection handler for Quote Sharing
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setQuoteToolbarPos(null);
        setSelectedQuote('');
        return;
      }

      const text = selection.toString().trim();
      if (text.length > 5 && articleContentRef.current?.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedQuote(text);
        setQuoteToolbarPos({
          top: rect.top + window.scrollY - 48,
          left: rect.left + rect.width / 2,
        });
      } else {
        setQuoteToolbarPos(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Clapping handler with bursting +1 bubbles
  const handleClap = async () => {
    if (userClaps >= 50) return;

    const newTotal = claps + 1;
    const newUserTotal = userClaps + 1;
    setClaps(newTotal);
    setUserClaps(newUserTotal);

    // Spawn floating animation particle
    const clapId = Date.now() + Math.random();
    setFloatingClaps((prev) => [...prev, { id: clapId, label: `+${newUserTotal}` }]);
    setTimeout(() => {
      setFloatingClaps((prev) => prev.filter((c) => c.id !== clapId));
    }, 850);

    // Persist asynchronously
    await StorageEngine.incrementClaps(post.id, 1);
  };

  // Share to X/Twitter
  const handleShareX = () => {
    const text = `Reading "${post.title}" by @julianvance:`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  // Quote share to X
  const handleShareQuoteToX = () => {
    if (!selectedQuote) return;
    const tweetText = `"${selectedQuote}"\n\n— from "${post.title}" by @julianvance`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
    setQuoteToolbarPos(null);
  };

  const handleCopyQuote = async () => {
    if (!selectedQuote) return;
    await navigator.clipboard.writeText(`"${selectedQuote}" — ${post.title}`);
    setQuoteCopied(true);
    setTimeout(() => {
      setQuoteCopied(false);
      setQuoteToolbarPos(null);
    }, 1500);
  };

  // Copy article link
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Handle newsletter micro-subscription
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    const res = await StorageEngine.subscribeNewsletter(newsletterEmail, post.slug);
    setNewsletterStatus(res.message);
    if (res.success) setNewsletterEmail('');
    setTimeout(() => setNewsletterStatus(null), 4000);
  };

  const formattedDate = post.published_at
    ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(post.published_at))
    : 'Draft';

  const otherPosts = allPosts.filter(p => p.id !== post.id && p.status === 'published').slice(0, 2);

  return (
    <div className="relative min-h-screen pb-32">
      {/* 2px Fixed Reading Progress Bar at Browser Viewport Top */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-accent-indigo transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Floating Quote Selection Toolbar */}
      {quoteToolbarPos && (
        <div
          className="fixed z-50 -translate-x-1/2 flex items-center space-x-1 px-3 py-1.5 rounded-full bg-zinc-900 text-white shadow-2xl border border-zinc-700 animate-slide-up text-xs font-mono"
          style={{ top: `${quoteToolbarPos.top}px`, left: `${quoteToolbarPos.left}px` }}
        >
          <button
            onClick={handleShareQuoteToX}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
          >
            <Twitter className="w-3.5 h-3.5 text-sky-400" />
            <span>Tweet Quote</span>
          </button>
          <span className="text-zinc-600">|</span>
          <button
            onClick={handleCopyQuote}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
          >
            {quoteCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-accent-emerald" />
                <span className="text-accent-emerald">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Article Navigation Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="group flex items-center space-x-2 text-xs font-mono text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Digital Garden</span>
        </button>

        <div className="flex items-center space-x-3 text-xs font-mono text-muted-light dark:text-muted-dark">
          {onOpenOGPreview && (
            <button
              onClick={() => onOpenOGPreview(post)}
              className="hover:text-primary-light dark:hover:text-primary-dark transition-colors flex items-center space-x-1"
              title="Preview Social OpenGraph Card"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent-indigo" />
              <span className="hidden sm:inline">OG Card Preview</span>
            </button>
          )}
        </div>
      </div>

      {/* Article Layout Grid (Reading Column + Sticky TOC) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-12">
          {/* Main Reading Column */}
          <article className="max-w-2xl mx-auto w-full">
            {/* Header Stage & Metadata */}
            <header className="mb-10 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-muted-light dark:text-muted-dark">
                <StageBadge stage={post.stage} size="md" />
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-accent-indigo" />
                  <span>{post.readTimeMinutes} min read</span>
                </span>
              </div>

              {/* Editorial Serif Headline */}
              <h1 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-primary-light dark:text-primary-dark leading-tight">
                {post.title}
              </h1>

              {/* Excerpt Lead */}
              <p className="text-lg text-muted-light dark:text-muted-dark font-sans leading-relaxed pt-1">
                {post.excerpt}
              </p>

              {/* Author Snippet */}
              <div className="flex items-center space-x-3 pt-4 pb-4 border-y border-border-subtle-light dark:border-border-subtle-dark font-sans">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-indigo to-accent-emerald flex items-center justify-center text-white font-mono text-xs font-bold ring-2 ring-border-subtle-light dark:ring-border-subtle-dark">
                  JV
                </div>
                <div>
                  <h4 className="text-sm font-medium text-primary-light dark:text-primary-dark">
                    Julian Vance
                  </h4>
                  <p className="text-xs text-muted-light dark:text-muted-dark font-mono">
                    Staff Design Technologist • Living Digital Garden
                  </p>
                </div>
              </div>
            </header>

            {/* Article Body Content */}
            <div ref={articleContentRef} className="pb-16">
              <ArticleRenderer content={post.content} />
            </div>

            {/* Article Footer Tags */}
            <div className="pt-6 border-t border-border-subtle-light dark:border-border-subtle-dark flex flex-wrap items-center gap-2 mb-12">
              <span className="text-xs font-mono text-muted-light dark:text-muted-dark mr-1">Filed under:</span>
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded text-xs font-mono bg-surface-secondary-light dark:bg-surface-secondary-dark text-primary-light dark:text-primary-dark border border-border-subtle-light dark:border-border-subtle-dark"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Contextual In-Article Newsletter Subscription Box */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/60 dark:bg-surface-secondary-dark/60 mb-16">
              <div className="flex items-center space-x-2 text-accent-indigo text-xs font-mono uppercase tracking-wider mb-2 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Digital Garden Dispatch</span>
              </div>
              <h3 className="text-xl font-serif text-primary-light dark:text-primary-dark mb-2">
                Enjoyed this field inquiry?
              </h3>
              <p className="text-sm text-muted-light dark:text-muted-dark mb-4 font-sans leading-relaxed">
                I publish developing essays on local-first architectures, design ergonomics, and engineering craft ~twice a month. No spam, ever.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email (e.g. elena@company.com)..."
                  required
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark text-xs font-mono focus:outline-none focus:border-accent-indigo"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary-light dark:bg-primary-dark text-white dark:text-zinc-900 text-xs font-mono font-semibold hover:opacity-90 transition-opacity"
                >
                  Subscribe to Essays
                </button>
              </form>

              {newsletterStatus && (
                <p className="text-xs font-mono text-accent-emerald mt-3 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{newsletterStatus}</span>
                </p>
              )}
            </div>

            {/* Related Essays */}
            {otherPosts.length > 0 && (
              <div className="pt-8 border-t border-border-subtle-light dark:border-border-subtle-dark">
                <h3 className="text-xs uppercase font-mono tracking-wider text-muted-light dark:text-muted-dark font-semibold mb-4">
                  Further Reading in the Garden
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {otherPosts.map(op => (
                    <div
                      key={op.id}
                      onClick={() => onSelectPost(op)}
                      className="p-4 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark hover:border-accent-indigo/50 bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 cursor-pointer transition-all"
                    >
                      <StageBadge stage={op.stage} size="sm" />
                      <h4 className="text-base font-serif font-medium text-primary-light dark:text-primary-dark mt-2 line-clamp-2">
                        {op.title}
                      </h4>
                      <p className="text-xs text-muted-light dark:text-muted-dark font-mono mt-1">
                        {op.readTimeMinutes} min read →
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sticky Interactive Table of Contents (Desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="p-4 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40">
                <h4 className="text-[11px] uppercase font-mono tracking-wider text-muted-light dark:text-muted-dark font-semibold mb-3">
                  Table of Contents
                </h4>
                {headings.length === 0 ? (
                  <p className="text-xs text-muted-light dark:text-muted-dark font-mono">Overview</p>
                ) : (
                  <nav className="space-y-2 text-xs font-mono">
                    {headings.map(h => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(h.id);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className={`block transition-colors line-clamp-1 ${
                          h.level === 3 ? 'pl-3 text-[11px]' : ''
                        } ${
                          activeHeadingId === h.id
                            ? 'text-accent-indigo font-semibold'
                            : 'text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark'
                        }`}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                )}
              </div>

              {/* Clapping counter sidebar hint */}
              <div className="p-4 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/20 dark:bg-surface-secondary-dark/20 text-xs font-mono text-muted-light dark:text-muted-dark">
                <span className="block font-semibold text-primary-light dark:text-primary-dark mb-1">
                  Appreciation
                </span>
                <span>{claps} total claps</span>
                {userClaps > 0 && <span className="block text-accent-emerald mt-0.5">({userClaps} from you)</span>}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Floating Bottom Engagement Dock */}
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="relative pointer-events-auto flex items-center space-x-2 px-3 py-2 rounded-full border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light/90 dark:bg-surface-elevated-dark/90 backdrop-blur-xl shadow-2xl font-mono text-xs">
          {/* Floating clap animation particles */}
          {floatingClaps.map(fc => (
            <span
              key={fc.id}
              className="absolute -top-6 left-6 font-mono text-xs font-bold text-accent-indigo animate-burst-float pointer-events-none select-none"
            >
              {fc.label}
            </span>
          ))}

          {/* Clapping Button with live counter */}
          <button
            onClick={handleClap}
            disabled={userClaps >= 50}
            className={`group flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-150 ${
              userClaps > 0
                ? 'bg-accent-indigo/10 text-accent-indigo font-semibold border border-accent-indigo/30'
                : 'hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark text-primary-light dark:text-primary-dark'
            } ${userClaps >= 50 ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
            title="Applaud essay (Up to 50 claps)"
          >
            <span className="text-base group-hover:scale-110 transition-transform">👏</span>
            <span>{claps}</span>
          </button>

          <span className="h-4 w-px bg-border-subtle-light dark:bg-border-subtle-dark" />

          {/* Share to X */}
          <button
            onClick={handleShareX}
            className="p-2 rounded-full hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            title="Share to X"
          >
            <Twitter className="w-4 h-4 text-sky-400" />
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            title="Copy essay link"
          >
            {linkCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-accent-emerald" />
                <span className="text-accent-emerald font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
