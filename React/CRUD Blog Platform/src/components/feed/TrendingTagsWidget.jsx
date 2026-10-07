import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { TrendingUp, Plus, Check, ChevronRight } from 'lucide-react';

export const TrendingTagsWidget = () => {
  const { tags, followedTags, toggleFollowTag, navigateToTagHub, setTagModalData } = useBlog();

  // Sort tags by follower count or post velocity
  const sortedTags = [...tags].sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0)).slice(0, 5);

  return (
    <div className="p-5 rounded-2xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#141518] shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#E11D48]" />
          <h4 className="font-serif font-bold text-base text-[#18181B] dark:text-[#F4F4F6]">
            Trending Topics
          </h4>
        </div>
        <button
          onClick={() => setTagModalData({ isOpen: true, tag: null })}
          className="text-[11px] font-mono text-[#4F46E5] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>New Topic</span>
        </button>
      </div>

      <div className="space-y-3">
        {sortedTags.map(tag => {
          const isFollowing = followedTags.includes(tag.id);

          return (
            <div
              key={tag.id}
              className="flex items-center justify-between gap-3 group"
            >
              <button
                onClick={() => navigateToTagHub(tag.slug)}
                className="flex items-center gap-2 min-w-0 text-left cursor-pointer flex-1"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-[#18181B] dark:text-[#F4F4F6] group-hover:text-[#E11D48] transition-colors truncate">
                    #{tag.name}
                  </p>
                  <p className="text-[11px] text-[#71717A] dark:text-[#9496A1] font-mono">
                    {tag.postsCount || 0} stories · {tag.followersCount || 0} followers
                  </p>
                </div>
              </button>

              <button
                onClick={() => toggleFollowTag(tag.id)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                  isFollowing
                    ? 'bg-[#E5E5DF] dark:bg-[#26272C] text-[#18181B] dark:text-[#F4F4F6]'
                    : 'bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] hover:opacity-90'
                }`}
              >
                {isFollowing ? (
                  <span className="flex items-center gap-1 text-[#0D9488]">
                    <Check className="w-3 h-3" /> Following
                  </span>
                ) : (
                  <span>Follow</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
