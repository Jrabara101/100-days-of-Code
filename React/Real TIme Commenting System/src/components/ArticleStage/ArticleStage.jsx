import React, { useState, useEffect, useRef } from 'react';
import { mockArticle } from '../../data/mockArticle';
import { useDiscussion } from '../../context/DiscussionContext';
import PassagePin from './PassagePin';
import { MessageSquare, Sparkles, BookOpen, Quote } from 'lucide-react';

export default function ArticleStage() {
  const { comments, setActiveQuoteAnchor, setSelectedParagraphId } = useDiscussion();
  const [floatingPill, setFloatingPill] = useState(null); // { x, y, text, paragraphId }
  const articleRef = useRef(null);

  // Compute comment count per paragraph
  const paragraphCommentCounts = React.useMemo(() => {
    const counts = {};
    function traverse(list) {
      for (const c of list) {
        if (c.paragraphId) {
          counts[c.paragraphId] = (counts[c.paragraphId] || 0) + 1;
        }
        if (c.children) traverse(c.children);
      }
    }
    traverse(comments);
    return counts;
  }, [comments]);

  // Listen for text selection inside article
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !articleRef.current) {
        setFloatingPill(null);
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 5) {
        setFloatingPill(null);
        return;
      }

      // Check if selection is within article
      const range = selection.getRangeAt(0);
      if (!articleRef.current.contains(range.commonAncestorContainer)) {
        setFloatingPill(null);
        return;
      }

      // Find closest paragraph container
      let containerNode = range.commonAncestorContainer;
      if (containerNode.nodeType !== Node.ELEMENT_NODE) {
        containerNode = containerNode.parentElement;
      }
      const paragraphEl = containerNode.closest('[data-paragraph-id]');
      const paragraphId = paragraphEl ? paragraphEl.getAttribute('data-paragraph-id') : 'para-1';

      // Get bounding box of selection
      const rect = range.getBoundingClientRect();
      setFloatingPill({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        text,
        paragraphId
      });
    };

    const handleMouseDown = (e) => {
      // Don't close if clicking on the floating pill itself
      if (e.target.closest('#floating-selection-pill')) return;
      setFloatingPill(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const handleQuoteSelection = () => {
    if (!floatingPill) return;
    setActiveQuoteAnchor({
      text: floatingPill.text,
      paragraphId: floatingPill.paragraphId,
      sourceName: "Article Passage"
    });
    setFloatingPill(null);

    // Smooth scroll down to composer
    const composer = document.querySelector('textarea');
    if (composer) {
      composer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => composer.focus(), 300);
    }
  };

  return (
    <article ref={articleRef} className="w-full relative py-6">
      {/* Floating Highlight-to-Quote Pill */}
      {floatingPill && (
        <div
          id="floating-selection-pill"
          style={{
            position: 'fixed',
            left: `${floatingPill.x}px`,
            top: `${floatingPill.y}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 60
          }}
          className="animate-bounce-soft"
        >
          <button
            onClick={handleQuoteSelection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-xl border border-white/20 hover:bg-black transition-all hover:scale-105 active:scale-95"
          >
            <Quote className="w-3.5 h-3.5 text-amber-400" />
            <span>Reply to Selection</span>
          </button>
        </div>
      )}

      {/* Article Header & Byline */}
      <div className="space-y-4 pb-8 border-b border-salon-border">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Architectural Salon Essay</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-salon-ink-primary font-sans leading-tight">
          {mockArticle.title}
        </h1>

        <p className="text-base sm:text-lg text-salon-ink-secondary leading-relaxed font-serif">
          {mockArticle.subtitle}
        </p>

        {/* Author Byline */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <img
              src={mockArticle.author.avatar}
              alt={mockArticle.author.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/80"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-salon-ink-primary">
                  {mockArticle.author.name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-mono">
                  Author
                </span>
              </div>
              <p className="text-xs text-salon-ink-muted">
                {mockArticle.author.role}
              </p>
            </div>
          </div>

          <div className="text-xs text-salon-ink-muted font-mono">
            <span>{mockArticle.publishedAt}</span>
          </div>
        </div>
      </div>

      {/* Article Paragraphs with Margin Pins */}
      <div className="space-y-8 pt-8">
        {mockArticle.paragraphs.map(para => {
          const count = paragraphCommentCounts[para.id] || 0;

          return (
            <div 
              key={para.id} 
              id={para.id}
              data-paragraph-id={para.id}
              className="group/para relative transition-all duration-300 p-2 -mx-2 rounded-xl"
            >
              {/* Optional Section Tag */}
              {para.section && (
                <div className="text-[11px] font-mono uppercase tracking-wider text-salon-ink-muted mb-1">
                  § {para.section}
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                {/* Paragraph Prose */}
                <p className="text-base sm:text-lg leading-relaxed text-salon-ink-primary font-serif selection:bg-amber-200 dark:selection:bg-indigo-900">
                  {para.text}
                </p>

                {/* Right Margin Passage Pin */}
                <div className="shrink-0 pt-1">
                  <PassagePin
                    paragraphId={para.id}
                    count={count}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

