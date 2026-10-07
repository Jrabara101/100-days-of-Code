import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { Rss, Bookmark, PenSquare, Tag, Terminal } from 'lucide-react';

export const Footer = () => {
  const { navigateToFeed, navigateToEditor, setIsRssModalOpen, setTagModalData } = useBlog();

  return (
    <footer className="mt-24 border-t border-[#E5E5DF] dark:border-[#26272C] bg-[#F3F3EE]/50 dark:bg-[#141518]/50 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded bg-[#18181B] dark:bg-[#F4F4F6] text-white dark:text-[#18181B] flex items-center justify-center font-serif text-sm font-bold">
              C
            </span>
            <span className="font-serif font-bold text-base text-[#18181B] dark:text-[#F4F4F6]">
              Chronicle &amp; Codex
            </span>
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#9496A1] leading-relaxed">
            An intentional digital publishing and high-signal community discourse platform. Built with typographic restraint, zero-anxiety autosave, and recursive tree discussions.
          </p>
        </div>

        <div className="flex flex-wrap gap-8 text-xs text-[#71717A] dark:text-[#9496A1]">
          <div>
            <h5 className="font-mono uppercase tracking-wider text-[11px] text-[#18181B] dark:text-[#F4F4F6] mb-2 font-semibold">
              Publishing
            </h5>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => navigateToEditor()} className="hover:text-[#18181B] dark:hover:text-[#F4F4F6] cursor-pointer">
                  Editorial Studio
                </button>
              </li>
              <li>
                <button onClick={() => navigateToFeed({ feedTab: 'trending' })} className="hover:text-[#18181B] dark:hover:text-[#F4F4F6] cursor-pointer">
                  Trending Velocity
                </button>
              </li>
              <li>
                <button onClick={() => setIsRssModalOpen(true)} className="hover:text-[#18181B] dark:hover:text-[#F4F4F6] cursor-pointer flex items-center gap-1">
                  <Rss className="w-3 h-3 text-[#D97706]" /> RSS Syndication
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-mono uppercase tracking-wider text-[11px] text-[#18181B] dark:text-[#F4F4F6] mb-2 font-semibold">
              Taxonomy
            </h5>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => setTagModalData({ isOpen: true, tag: null })} className="hover:text-[#18181B] dark:hover:text-[#F4F4F6] cursor-pointer">
                  Create Topic Tag
                </button>
              </li>
              <li>
                <button onClick={() => navigateToFeed({ feedTab: 'following' })} className="hover:text-[#18181B] dark:hover:text-[#F4F4F6] cursor-pointer">
                  Subscribed Feeds
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-mono uppercase tracking-wider text-[11px] text-[#18181B] dark:text-[#F4F4F6] mb-2 font-semibold">
              Architecture
            </h5>
            <p className="max-w-[200px] leading-relaxed font-mono text-[11px] opacity-80">
              React + Vite + Tailwind v4 + PostgreSQL/CTE Tree Logic.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#E5E5DF]/60 dark:border-[#26272C]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#71717A] dark:text-[#9496A1] font-mono">
        <span>© 2026 Chronicle &amp; Codex. Distraction-Free Publishing.</span>
        <span>Warm Linen (#FAFAF8) &amp; Obsidian (#0C0D0E)</span>
      </div>
    </footer>
  );
};
