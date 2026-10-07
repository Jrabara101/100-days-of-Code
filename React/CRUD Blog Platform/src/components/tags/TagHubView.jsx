import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { PostCard } from '../feed/PostCard';
import { 
  ArrowLeft, 
  Check, 
  Plus, 
  BookOpen, 
  Users, 
  Settings, 
  Sparkles, 
  Flame,
  MessageSquare
} from 'lucide-react';

export const TagHubView = ({ tagSlug }) => {
  const { 
    tags, 
    posts, 
    followedTags, 
    toggleFollowTag, 
    navigateToFeed, 
    setTagModalData 
  } = useBlog();

  const [sortTab, setSortTab] = useState('latest');

  const tag = tags.find(t => t.slug === tagSlug);

  if (!tag) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#18181B] dark:text-[#F4F4F6] mb-3">
          Topic Not Found
        </h2>
        <p className="text-sm text-[#71717A] dark:text-[#9496A1] mb-6">
          The requested taxonomy "{tagSlug}" does not exist or has been retired.
        </p>
        <button
          onClick={() => navigateToFeed()}
          className="px-4 py-2 rounded-lg text-xs font-medium bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B]"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const isFollowing = followedTags.includes(tag.id);

  // Filter and sort posts tagged with this tag
  let taggedPosts = posts.filter(p => p.status === 'published' && (p.tagIds || []).includes(tag.id));

  if (sortTab === 'discussed') {
    taggedPosts = [...taggedPosts].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  } else if (sortTab === 'top') {
    taggedPosts = [...taggedPosts].sort((a, b) => (b.clapsCount || 0) - (a.clapsCount || 0));
  } else {
    // Latest
    taggedPosts = [...taggedPosts].sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      
      {/* Back button */}
      <button
        onClick={() => navigateToFeed()}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Stories</span>
      </button>

      {/* Tag Hero Stage */}
      <header className="p-8 sm:p-10 rounded-3xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#141518] shadow-xs mb-10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tag.color || '#2563EB' }}
              />
              <span className="text-xs font-mono uppercase tracking-wider text-[#71717A] dark:text-[#9496A1]">
                Curated Topic Taxonomy
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F6]">
              #{tag.name}
            </h1>

            <p className="text-sm sm:text-base text-[#71717A] dark:text-[#9496A1] leading-relaxed">
              {tag.description || 'Deep editorial analyses and discussions under this taxonomy.'}
            </p>

            <div className="flex items-center gap-5 text-xs font-mono text-[#71717A] dark:text-[#9496A1] pt-2">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 opacity-80" />
                {tag.postsCount || taggedPosts.length} stories published
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 opacity-80" />
                {tag.followersCount || 0} followers
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setTagModalData({ isOpen: true, tag })}
              className="p-2.5 rounded-xl border border-[#E5E5DF] dark:border-[#26272C] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#1B1C21] transition-colors cursor-pointer"
              title="Edit Tag Definition"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => toggleFollowTag(tag.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-medium transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                isFollowing
                  ? 'bg-[#E5E5DF] dark:bg-[#26272C] text-[#18181B] dark:text-[#F4F4F6]'
                  : 'bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] hover:opacity-90 active:scale-95'
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Following Topic</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Follow Topic</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Sorting Tabs */}
      <div className="flex items-center justify-between border-b border-[#E5E5DF] dark:border-[#26272C] pb-3 mb-8">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSortTab('latest')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              sortTab === 'latest'
                ? 'bg-[#F3F3EE] dark:bg-[#1B1C21] text-[#18181B] dark:text-[#F4F4F6] font-semibold'
                : 'text-[#71717A] dark:text-[#9496A1]'
            }`}
          >
            Latest Stories
          </button>
          <button
            onClick={() => setSortTab('discussed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              sortTab === 'discussed'
                ? 'bg-[#F3F3EE] dark:bg-[#1B1C21] text-[#18181B] dark:text-[#F4F4F6] font-semibold'
                : 'text-[#71717A] dark:text-[#9496A1]'
            }`}
          >
            Most Viewed
          </button>
          <button
            onClick={() => setSortTab('top')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              sortTab === 'top'
                ? 'bg-[#F3F3EE] dark:bg-[#1B1C21] text-[#18181B] dark:text-[#F4F4F6] font-semibold'
                : 'text-[#71717A] dark:text-[#9496A1]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>All-Time Top</span>
          </button>
        </div>

        <span className="text-xs font-mono text-[#71717A] dark:text-[#9496A1]">
          {taggedPosts.length} {taggedPosts.length === 1 ? 'article' : 'articles'}
        </span>
      </div>

      {/* Tagged Posts Stream */}
      {taggedPosts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-[#E5E5DF] dark:border-[#26272C] bg-[#F3F3EE]/40 dark:bg-[#141518]/40">
          <p className="font-serif text-lg text-[#18181B] dark:text-[#F4F4F6] mb-2">
            No published stories in #{tag.name} yet
          </p>
          <p className="text-xs text-[#71717A] dark:text-[#9496A1] mb-4">
            Be the inaugural author to publish under this taxonomy.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {taggedPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

    </div>
  );
};
