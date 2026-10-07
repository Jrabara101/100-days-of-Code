import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { X, Bookmark, Trash2, ArrowRight, Clock } from 'lucide-react';

export const BookmarksDrawer = () => {
  const {
    bookmarks,
    posts,
    isBookmarksOpen,
    setIsBookmarksOpen,
    toggleBookmark,
    navigateToArticle
  } = useBlog();

  if (!isBookmarksOpen) return null;

  const bookmarkedPosts = posts.filter(p => bookmarks.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="absolute inset-y-0 right-0 max-w-md w-full bg-white dark:bg-[#141518] border-l border-[#E5E5DF] dark:border-[#26272C] shadow-2xl flex flex-col transform animate-in slide-in-from-right duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E5E5DF] dark:border-[#26272C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#E11D48]" />
            <h3 className="font-serif font-bold text-lg text-[#18181B] dark:text-[#F4F4F6]">
              Read Later Library
            </h3>
            <span className="text-xs font-mono bg-[#F3F3EE] dark:bg-[#1B1C21] px-2 py-0.5 rounded-full text-[#71717A] dark:text-[#9496A1]">
              {bookmarkedPosts.length}
            </span>
          </div>
          <button
            onClick={() => setIsBookmarksOpen(false)}
            className="p-1.5 rounded-lg text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#1B1C21] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bookmarked Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {bookmarkedPosts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#71717A] dark:text-[#9496A1]">
              <Bookmark className="w-10 h-10 stroke-[1.2] opacity-40 mb-3" />
              <p className="font-serif text-base text-[#18181B] dark:text-[#F4F4F6] mb-1">
                Your reading list is pristine
              </p>
              <p className="text-xs leading-relaxed max-w-xs">
                Bookmark thoughtful essays by clicking the bookmark pill at the bottom of any story.
              </p>
            </div>
          ) : (
            bookmarkedPosts.map((post) => (
              <div
                key={post.id}
                className="group relative p-3.5 rounded-xl border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#1B1C21] hover:border-[#71717A]/40 transition-all flex gap-3"
              >
                {post.coverImage && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-[#F3F3EE]">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4
                      onClick={() => {
                        navigateToArticle(post.slug);
                        setIsBookmarksOpen(false);
                      }}
                      className="font-serif font-semibold text-sm text-[#18181B] dark:text-[#F4F4F6] hover:text-[#E11D48] transition-colors line-clamp-2 cursor-pointer mb-1"
                    >
                      {post.title}
                    </h4>
                    <p className="text-xs text-[#71717A] dark:text-[#9496A1] truncate">
                      By {post.author.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#71717A] dark:text-[#9496A1] font-mono mt-2 pt-2 border-t border-[#E5E5DF]/60 dark:border-[#26272C]/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readingTime} min read
                    </span>
                    <button
                      onClick={() => toggleBookmark(post.id)}
                      className="text-[#E11D48] hover:text-red-700 p-1 cursor-pointer"
                      title="Remove from reading list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {bookmarkedPosts.length > 0 && (
          <div className="p-4 border-t border-[#E5E5DF] dark:border-[#26272C] bg-[#F3F3EE]/50 dark:bg-[#1B1C21]/50 text-center">
            <p className="text-xs text-[#71717A] dark:text-[#9496A1] font-mono">
              Offline-ready local sync enabled
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
