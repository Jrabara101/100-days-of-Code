import React, { useState } from 'react';
import { ArrowRight, BookOpen, Search, Sparkles } from 'lucide-react';
import { Post, PostStage } from '../types';
import { StageBadge } from './StageBadge';

interface WritingStreamProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onOpenRSS?: () => void;
}

export const WritingStream: React.FC<WritingStreamProps> = ({ posts, onSelectPost, onOpenRSS }) => {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPosts = posts.filter(post => {
    const matchesStage = selectedStage === 'all' || post.stage === selectedStage;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStage && matchesSearch;
  });

  return (
    <section id="essays" className="py-20 border-b border-border-subtle-light dark:border-border-subtle-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-accent-emerald uppercase tracking-wider mb-2 font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Section 02 / Digital Garden</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal text-primary-light dark:text-primary-dark">
              Essays, Explorations & Field Notes
            </h2>
            <p className="text-sm text-muted-light dark:text-muted-dark mt-1 font-sans">
              Thoughts across progressive lifecycle stages: Seedlings (raw), Budding (developing), and Evergreen (definitive).
            </p>
          </div>

          {onOpenRSS && (
            <button
              onClick={onOpenRSS}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/60 dark:bg-surface-secondary-dark/60 hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark font-mono text-xs text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors self-start md:self-end"
              title="View RSS Feed"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent-indigo" />
              <span>RSS Feed</span>
            </button>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border-subtle-light dark:border-border-subtle-dark">
          {/* Stage Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Lifecycle' },
              { id: 'evergreen', label: '🌲 Evergreen' },
              { id: 'budding', label: '🌿 Budding' },
              { id: 'seedling', label: '🌱 Seedling' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedStage(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  selectedStage === tab.id
                    ? 'bg-primary-light dark:bg-primary-dark text-white dark:text-zinc-900 font-semibold'
                    : 'text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search essays, tags, topics..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 text-xs font-mono placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-none focus:border-accent-indigo"
            />
          </div>
        </div>

        {/* Borderless Editorial Table List */}
        <div className="divide-y divide-border-subtle-light/60 dark:divide-border-subtle-dark/60">
          {filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-muted-light dark:text-muted-dark font-mono text-xs">
              No digital garden essays found matching your criteria.
            </div>
          ) : (
            filteredPosts.map((post) => {
              const formattedDate = post.published_at 
                ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(post.published_at))
                : 'Draft';

              return (
                <div
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="group py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-surface-secondary-light/40 dark:hover:bg-surface-secondary-dark/40 px-3 -mx-3 rounded-xl transition-all duration-200"
                >
                  {/* Left: Metadata & Title */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center space-x-3 text-xs font-mono text-muted-light dark:text-muted-dark">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <StageBadge stage={post.stage} />
                      <span>•</span>
                      <span>{post.readTimeMinutes} min read</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-serif font-medium text-primary-light dark:text-primary-dark group-hover:text-accent-indigo transition-colors leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-sm text-muted-light dark:text-muted-dark line-clamp-1 font-sans">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Right: Tags & Reveal Arrow */}
                  <div className="flex items-center space-x-4 shrink-0 font-mono text-xs">
                    <div className="hidden lg:flex items-center space-x-1.5">
                      {post.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded text-[11px] bg-surface-elevated-light dark:bg-surface-elevated-dark text-muted-light dark:text-muted-dark border border-border-subtle-light dark:border-border-subtle-dark">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <span className="flex items-center space-x-1 text-muted-light dark:text-muted-dark group-hover:text-primary-light dark:group-hover:text-primary-dark group-hover:translate-x-1 transition-all">
                      <span className="hidden sm:inline text-xs">Read</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
