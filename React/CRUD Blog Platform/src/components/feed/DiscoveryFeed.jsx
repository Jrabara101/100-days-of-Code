import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { PostCard } from './PostCard';
import { TrendingTagsWidget } from './TrendingTagsWidget';
import { ActiveDiscussionsWidget } from './ActiveDiscussionsWidget';
import { TagBadge } from '../common/TagBadge';
import { Sparkles, Compass, Flame, Heart, Search, X, BookOpen, Filter } from 'lucide-react';

export const DiscoveryFeed = () => {
  const { posts, tags, followedTags, currentView, navigateToFeed } = useBlog();

  const [activeTab, setActiveTab] = useState(currentView.feedTab || 'all');
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [searchQuery, setSearchQuery] = useState(currentView.searchQuery || '');

  // Filter published posts
  const publishedPosts = posts.filter(p => p.status === 'published');

  // Filter logic
  let filteredPosts = publishedPosts;

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredPosts = filteredPosts.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.author.name.toLowerCase().includes(q)
    );
  }

  // Tag filter
  if (selectedTagId) {
    filteredPosts = filteredPosts.filter(p => (p.tagIds || []).includes(selectedTagId));
  }

  // Tab filter
  if (activeTab === 'following') {
    filteredPosts = filteredPosts.filter(p => 
      (p.tagIds || []).some(tid => followedTags.includes(tid))
    );
  } else if (activeTab === 'trending') {
    filteredPosts = [...filteredPosts].sort((a, b) => 
      ((b.clapsCount || 0) + (b.viewsCount || 0)) - ((a.clapsCount || 0) + (a.viewsCount || 0))
    );
  } else {
    // Latest default
    filteredPosts = [...filteredPosts].sort((a, b) => 
      new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      
      {/* Editorial Hero Statement */}
      <section className="mb-10 text-center sm:text-left border-b border-[#E5E5DF] dark:border-[#26272C] pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#E11D48]/10 text-[#E11D48] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Volume IV · Distraction-Free Publishing</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F6] leading-[1.15]">
              Editorial Craft &amp; Civil Discourse
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#71717A] dark:text-[#9496A1] max-w-2xl font-normal leading-relaxed">
              Pairing typographical serenity with deep tag taxonomies, zero-anxiety autosave, and recursive tree community discussions.
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search essays, tags..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#141518] text-[#18181B] dark:text-[#F4F4F6] focus:outline-hidden focus:ring-1 focus:ring-[#18181B] dark:focus:ring-white transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Topic Filter Strip */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedTagId(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
              selectedTagId === null
                ? 'bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] shadow-xs'
                : 'bg-[#F3F3EE] dark:bg-[#141518] text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] border border-[#E5E5DF] dark:border-[#26272C]'
            }`}
          >
            All Topics ({publishedPosts.length})
          </button>

          {tags.map(tag => {
            const isSelected = selectedTagId === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => setSelectedTagId(isSelected ? null : tag.id)}
                style={{
                  borderColor: isSelected ? tag.color : undefined,
                  backgroundColor: isSelected ? tag.bgColor : undefined,
                  color: isSelected ? tag.color : undefined
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all shrink-0 cursor-pointer border ${
                  isSelected 
                    ? 'ring-1 ring-current font-bold'
                    : 'bg-[#F3F3EE] dark:bg-[#141518] text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] border-[#E5E5DF] dark:border-[#26272C]'
                }`}
              >
                #{tag.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Feed + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Main Feed 65% ~ 8 cols) */}
        <main className="lg:col-span-8 space-y-6">
          
          {/* Feed Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-[#E5E5DF] dark:border-[#26272C] pb-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#F3F3EE] dark:bg-[#1B1C21] text-[#18181B] dark:text-[#F4F4F6] font-semibold'
                    : 'text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6]'
                }`}
              >
                Latest Stories
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'following'
                    ? 'bg-[#F3F3EE] dark:bg-[#1B1C21] text-[#18181B] dark:text-[#F4F4F6] font-semibold'
                    : 'text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6]'
                }`}
              >
                <span>Subscribed Topics</span>
                {followedTags.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('trending')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'trending'
                    ? 'bg-[#F3F3EE] dark:bg-[#1B1C21] text-[#18181B] dark:text-[#F4F4F6] font-semibold'
                    : 'text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>Trending Velocity</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-[#71717A] dark:text-[#9496A1]">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'story' : 'stories'}
            </span>
          </div>

          {/* Post Stream */}
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#E5E5DF] dark:border-[#26272C] bg-[#F3F3EE]/40 dark:bg-[#141518]/40">
              <BookOpen className="w-8 h-8 text-[#71717A] dark:text-[#9496A1] mx-auto mb-3 opacity-60" />
              <h3 className="font-serif text-lg font-bold text-[#18181B] dark:text-[#F4F4F6] mb-1">
                No matching stories found
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#9496A1] max-w-sm mx-auto mb-4">
                Try loosening your search query or reset the topic filter to explore our full publication archives.
              </p>
              <button
                onClick={() => {
                  setSelectedTagId(null);
                  setSearchQuery('');
                  setActiveTab('all');
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-[#18181B] dark:bg-[#F4F4F6] text-white dark:text-[#18181B] hover:opacity-90 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post, idx) => (
                <PostCard key={post.id} post={post} featured={idx === 0 && !searchQuery && !selectedTagId} />
              ))}
            </div>
          )}

        </main>

        {/* Right Sidebar (35% ~ 4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          <TrendingTagsWidget />
          <ActiveDiscussionsWidget />

          {/* Subtle Platform Digest Callout */}
          <div className="p-5 rounded-2xl border border-[#E5E5DF] dark:border-[#26272C] bg-[#F3F3EE]/40 dark:bg-[#141518]/40 text-xs text-[#71717A] dark:text-[#9496A1] leading-relaxed">
            <h5 className="font-mono uppercase tracking-wider text-[11px] text-[#18181B] dark:text-[#F4F4F6] font-semibold mb-2">
              The Editorial Standard
            </h5>
            <p>
              Every post is formatted with optical line sizing, responsive syntax-highlighted blocks, and persistent draft backups. Select any phrase while reading to bridge directly into discussion replies.
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
};
