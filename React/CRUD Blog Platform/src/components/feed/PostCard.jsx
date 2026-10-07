import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { TagBadge } from '../common/TagBadge';
import { Eye, MessageSquare, Bookmark, Clock, Flame } from 'lucide-react';

export const PostCard = ({ post, featured = false }) => {
  const { navigateToArticle, tags, bookmarks, toggleBookmark } = useBlog();

  const isBookmarked = bookmarks.includes(post.id);
  const postTags = tags.filter(t => (post.tagIds || []).includes(t.id));

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Draft';

  return (
    <article
      onClick={() => navigateToArticle(post.slug)}
      className={`group relative p-6 sm:p-7 rounded-2xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#141518] hover:border-[#71717A]/40 dark:hover:border-[#71717A]/40 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between ${
        featured ? 'sm:col-span-2' : ''
      }`}
    >
      <div>
        {/* Author Row & Meta */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'}
              alt={post.author?.name}
              className="w-7 h-7 rounded-full object-cover border border-[#E5E5DF] dark:border-[#26272C] shrink-0"
            />
            <div className="min-w-0 flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#9496A1]">
              <span className="font-medium text-[#18181B] dark:text-[#F4F4F6] truncate">
                {post.author?.name}
              </span>
              <span>·</span>
              <time dateTime={post.publishedAt} className="shrink-0">{formattedDate}</time>
            </div>
          </div>

          {/* Reading Time */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#71717A] dark:text-[#9496A1] bg-[#F3F3EE] dark:bg-[#1B1C21] px-2 py-0.5 rounded-full shrink-0">
            <Clock className="w-3 h-3" />
            <span>{post.readingTime} min</span>
          </div>
        </div>

        {/* Optional Cover Banner */}
        {post.coverImage && featured && (
          <div className="w-full h-52 mb-5 rounded-xl overflow-hidden bg-[#F3F3EE] dark:bg-[#1B1C21]">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
          </div>
        )}

        {/* Title */}
        <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#18181B] dark:text-[#F4F4F6] group-hover:text-[#E11D48] dark:group-hover:text-[#E11D48] transition-colors leading-snug mb-2.5">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-[#71717A] dark:text-[#9496A1] leading-relaxed line-clamp-2 mb-4 font-normal">
          {post.excerpt}
        </p>
      </div>

      {/* Footer Strip: Tags, Metrics & Bookmark */}
      <div className="pt-4 border-t border-[#E5E5DF]/70 dark:border-[#26272C]/70 flex flex-wrap items-center justify-between gap-3">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {postTags.map(tag => (
            <TagBadge key={tag.id} tag={tag} size="sm" />
          ))}
        </div>

        {/* Micro-metrics & Bookmark */}
        <div className="flex items-center gap-3 text-xs text-[#71717A] dark:text-[#9496A1] font-mono">
          <span className="flex items-center gap-1" title="Views">
            <Eye className="w-3.5 h-3.5 opacity-70" />
            {post.viewsCount || 0}
          </span>
          <span className="flex items-center gap-1" title="Appreciation Claps">
            <Flame className="w-3.5 h-3.5 text-[#E11D48] opacity-80" />
            {post.clapsCount || 0}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark(post.id);
            }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isBookmarked 
                ? 'text-[#E11D48] bg-[#E11D48]/10' 
                : 'hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#1B1C21]'
            }`}
            title={isBookmarked ? 'Remove Bookmark' : 'Save for Later'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
};
