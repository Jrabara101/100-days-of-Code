import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';
import { 
  Flame, 
  Bookmark, 
  MessageSquare, 
  Share2, 
  Edit3, 
  Check, 
  Sparkles 
} from 'lucide-react';

export const FloatingReactionDock = ({ post, commentCount = 0 }) => {
  const { 
    clapPost, 
    bookmarks, 
    toggleBookmark, 
    navigateToEditor, 
    currentUser, 
    setQuoteShareData 
  } = useBlog();
  const { showToast } = useToast();

  const [clapAnim, setClapAnim] = useState(false);
  const isBookmarked = bookmarks.includes(post.id);
  const isAuthor = currentUser.id === post.authorId;

  const handleClap = (e) => {
    e.stopPropagation();
    clapPost(post.id, 1);
    setClapAnim(true);
    setTimeout(() => setClapAnim(false), 300);

    // Micro celebration confetti burst at button coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    confetti({
      particleCount: 20,
      spread: 60,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight
      },
      colors: ['#E11D48', '#4F46E5', '#D97706'],
      ticks: 120,
      gravity: 1.2
    });
  };

  const scrollToComments = () => {
    const el = document.getElementById('comments-discussion-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Article link copied to clipboard', 'info');
    }
  };

  return (
    <div className="sticky bottom-6 z-30 flex items-center justify-center pointer-events-none mt-12 mb-6">
      <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 bg-white/90 dark:bg-[#1B1C21]/90 backdrop-blur-md rounded-full shadow-xl border border-[#E5E5DF] dark:border-[#26272C] text-xs font-mono text-[#18181B] dark:text-[#F4F4F6]">
        
        {/* Claps / Appreciation Counter */}
        <button
          onClick={handleClap}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#F3F3EE] dark:hover:bg-[#141518] transition-all cursor-pointer group ${
            clapAnim ? 'scale-115 text-[#E11D48]' : ''
          }`}
          title="Applaud essay"
        >
          <span className="text-base select-none">👏</span>
          <span className="font-semibold text-xs text-[#18181B] dark:text-[#F4F4F6] group-hover:text-[#E11D48]">
            {post.clapsCount || 0}
          </span>
        </button>

        <div className="w-[1px] h-4 bg-[#E5E5DF] dark:border-[#26272C]" />

        {/* Discussion Jump */}
        <button
          onClick={scrollToComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#F3F3EE] dark:hover:bg-[#141518] text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] transition-colors cursor-pointer"
          title="Jump to discussion"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{commentCount}</span>
        </button>

        <div className="w-[1px] h-4 bg-[#E5E5DF] dark:border-[#26272C]" />

        {/* Bookmark Pill */}
        <button
          onClick={() => toggleBookmark(post.id)}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            isBookmarked
              ? 'text-[#E11D48] bg-[#E11D48]/10'
              : 'text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#141518]'
          }`}
          title={isBookmarked ? 'Bookmarked in Read Later' : 'Bookmark story'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-2 rounded-full text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] transition-colors cursor-pointer"
          title="Share Story"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {/* Edit Button (if author) */}
        {isAuthor && (
          <>
            <div className="w-[1px] h-4 bg-[#E5E5DF] dark:border-[#26272C]" />
            <button
              onClick={() => navigateToEditor(post.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] hover:opacity-90 transition-opacity cursor-pointer text-[11px] font-sans font-medium"
              title="Edit story in studio"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
