import React, { useState, useRef } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Hash, Check, Plus, BookOpen, Users } from 'lucide-react';

export const TagBadge = ({ tag, clickable = true, showCount = false, size = 'md' }) => {
  const { navigateToTagHub, followedTags, toggleFollowTag } = useBlog();
  const [showPopover, setShowPopover] = useState(false);
  const hoverTimeoutRef = useRef(null);

  if (!tag) return null;

  const isFollowing = followedTags.includes(tag.id);

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPopover(true);
    }, 280);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 200);
  };

  const handleClick = (e) => {
    if (!clickable) return;
    e.stopPropagation();
    navigateToTagHub(tag.slug);
  };

  const sizeClasses = size === 'sm'
    ? 'text-[11px] px-2 py-0.5 gap-1'
    : size === 'lg'
    ? 'text-sm px-3.5 py-1.5 gap-1.5 font-medium'
    : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        style={{
          color: tag.color || '#2563EB',
          backgroundColor: tag.bgColor || 'rgba(37, 99, 235, 0.1)',
          borderColor: `${tag.color || '#2563EB'}33`
        }}
        className={`inline-flex items-center rounded-full border transition-all duration-150 font-mono select-none hover:shadow-xs hover:brightness-110 active:scale-95 ${sizeClasses} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className="opacity-70">#</span>
        <span className="truncate max-w-[140px]">{tag.name}</span>
        {showCount && typeof tag.postsCount === 'number' && (
          <span className="opacity-60 text-[10px] ml-0.5">({tag.postsCount})</span>
        )}
      </button>

      {/* Tag Hovercard Popover */}
      {showPopover && (
        <div
          className="absolute z-40 bottom-full left-0 mb-2 w-64 p-3.5 bg-white dark:bg-[#1B1C21] rounded-xl shadow-xl border border-[#E5E5DF] dark:border-[#26272C] text-left animate-in fade-in zoom-in-95 duration-150"
          onMouseEnter={() => clearTimeout(hoverTimeoutRef.current)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: tag.color || '#2563EB' }}
              />
              <h4 className="font-semibold text-sm text-[#18181B] dark:text-[#F4F4F6] font-mono">
                #{tag.name}
              </h4>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFollowTag(tag.id);
              }}
              className={`text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 font-medium transition-all ${
                isFollowing
                  ? 'bg-[#E5E5DF] dark:bg-[#26272C] text-[#18181B] dark:text-[#F4F4F6]'
                  : 'bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] hover:opacity-90'
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-3 h-3 text-[#0D9488]" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>Follow</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-[#71717A] dark:text-[#9496A1] leading-relaxed mb-3 line-clamp-3">
            {tag.description || 'Topic curation and reader discussions.'}
          </p>

          <div className="flex items-center justify-between text-[11px] text-[#71717A] dark:text-[#9496A1] font-mono border-t border-[#E5E5DF]/60 dark:border-[#26272C]/60 pt-2">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 opacity-70" />
              {tag.postsCount || 0} stories
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 opacity-70" />
              {tag.followersCount || 0} followers
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
