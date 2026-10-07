import React from 'react';
import { X, Sparkles, Share2 } from 'lucide-react';
import { Post } from '../types';
import { StageBadge } from './StageBadge';

interface OGPreviewModalProps {
  post: Post | null;
  onClose: () => void;
}

export const OGPreviewModal: React.FC<OGPreviewModalProps> = ({ post, onClose }) => {
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-surface-elevated-light dark:bg-surface-elevated-dark border border-border-subtle-light dark:border-border-subtle-dark rounded-2xl shadow-2xl p-6 z-10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle-light dark:border-border-subtle-dark">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-accent-indigo" />
            <h3 className="font-mono text-sm font-semibold text-primary-light dark:text-primary-dark">
              Dynamic OpenGraph Social Card Generation
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-light dark:text-muted-dark font-sans leading-relaxed">
          Automated 1200x630px social card preview rendered when sharing on X (Twitter), LinkedIn, iMessage, and Slack.
        </p>

        {/* The 1200x630 (16:9 or 1.91:1) Social Card Simulation */}
        <div className="w-full aspect-[1.91/1] rounded-xl overflow-hidden border border-zinc-700/80 bg-[#0C0C0E] text-white p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
          {/* Subtle noise & gradient accent */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-indigo/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-emerald/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Bar */}
          <div className="relative z-10 flex items-center justify-between font-mono text-xs text-zinc-400">
            <div className="flex items-center space-x-2">
              <span className="text-base text-accent-indigo">✦</span>
              <span className="font-semibold text-white tracking-wide">JULIAN VANCE</span>
              <span>/</span>
              <span>DIGITAL GARDEN</span>
            </div>
            <StageBadge stage={post.stage} size="sm" />
          </div>

          {/* Center Title & Excerpt */}
          <div className="relative z-10 space-y-2">
            <h2 className="text-xl sm:text-3xl font-serif font-normal text-white leading-tight line-clamp-2">
              {post.title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          </div>

          {/* Bottom Metadata */}
          <div className="relative z-10 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <div className="flex items-center space-x-2">
              <span>{post.readTimeMinutes} min read</span>
              <span>•</span>
              <span className="text-zinc-500">julianvance.design</span>
            </div>

            <div className="flex items-center space-x-1.5">
              {post.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded bg-zinc-800/80 text-[10px] text-zinc-300">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-border-subtle-light dark:border-border-subtle-dark text-xs font-mono"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
