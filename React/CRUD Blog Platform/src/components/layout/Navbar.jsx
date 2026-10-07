import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  PenSquare, 
  Bookmark, 
  Search, 
  Moon, 
  Sun, 
  Rss, 
  ArrowLeft, 
  BookOpen, 
  Tag as TagIcon,
  Sparkles
} from 'lucide-react';

export const Navbar = () => {
  const {
    currentView,
    navigateToFeed,
    navigateToEditor,
    bookmarks,
    setIsBookmarksOpen,
    setIsRssModalOpen,
    setIsCommandPaletteOpen,
    theme,
    toggleTheme,
    posts,
    setTagModalData
  } = useBlog();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [showArticleSnippet, setShowArticleSnippet] = useState(false);

  const activePost = currentView.type === 'article' 
    ? posts.find(p => p.slug === currentView.articleSlug) 
    : null;

  // Track scroll position for reading progress bar and article snippet reveal
  useEffect(() => {
    if (currentView.type !== 'article') {
      setScrollProgress(0);
      setShowArticleSnippet(false);
      return;
    }

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
      setShowArticleSnippet(window.scrollY > 280);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 dark:bg-[#0C0D0E]/95 backdrop-blur-md border-b border-[#E5E5DF] dark:border-[#26272C] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left Section: Wordmark & Navigation */}
        <div className="flex items-center gap-3 min-w-0">
          {currentView.type !== 'feed' ? (
            <button
              onClick={() => navigateToFeed()}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] transition-colors cursor-pointer py-1 px-2 -ml-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">All Stories</span>
            </button>
          ) : null}

          <button
            onClick={() => navigateToFeed()}
            className="flex items-center gap-2 group text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#18181B] dark:bg-[#F4F4F6] text-white dark:text-[#18181B] flex items-center justify-center font-serif text-lg font-bold shadow-xs group-hover:scale-105 transition-transform">
              C
            </div>
            <div className="hidden md:block">
              <span className="font-serif font-bold text-lg tracking-tight text-[#18181B] dark:text-[#F4F4F6]">
                Chronicle <span className="font-sans font-light text-xs text-[#71717A] dark:text-[#9496A1] tracking-widest uppercase">&amp; Codex</span>
              </span>
            </div>
          </button>
        </div>

        {/* Center Section: Article Title Snippet (Reveals on scroll) */}
        <div className="flex-1 max-w-md mx-auto hidden lg:block text-center truncate px-4">
          {currentView.type === 'article' && activePost && (
            <div
              className={`transition-all duration-300 transform ${
                showArticleSnippet ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
            >
              <p className="text-xs font-serif italic text-[#71717A] dark:text-[#9496A1] truncate">
                {activePost.title}
              </p>
            </div>
          )}
        </div>

        {/* Right Section: Actions & Chrome Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Search / Command Palette */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 text-xs font-medium text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] bg-[#F3F3EE] dark:bg-[#141518] border border-[#E5E5DF] dark:border-[#26272C] px-2.5 py-1.5 rounded-lg transition-all hover:border-[#71717A]/40 cursor-pointer"
            title="Search stories and tags"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-block font-mono text-[10px] bg-white dark:bg-[#1B1C21] px-1.5 py-0.5 rounded border border-[#E5E5DF] dark:border-[#26272C]">
              ⌘K
            </kbd>
          </button>

          {/* RSS Feed Trigger */}
          <button
            onClick={() => setIsRssModalOpen(true)}
            className="p-2 rounded-lg text-[#71717A] dark:text-[#9496A1] hover:text-[#D97706] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] transition-colors cursor-pointer"
            title="Syndication & RSS Feed"
          >
            <Rss className="w-4 h-4" />
          </button>

          {/* New Tag Taxonomy Trigger */}
          <button
            onClick={() => setTagModalData({ isOpen: true, tag: null })}
            className="hidden sm:flex items-center p-2 rounded-lg text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] transition-colors cursor-pointer"
            title="Curate Tags Taxonomy"
          >
            <TagIcon className="w-4 h-4" />
          </button>

          {/* Bookmarks Drawer Trigger */}
          <button
            onClick={() => setIsBookmarksOpen(true)}
            className="relative p-2 rounded-lg text-[#71717A] dark:text-[#9496A1] hover:text-[#E11D48] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] transition-colors cursor-pointer"
            title="Read Later Bookmarks"
          >
            <Bookmark className="w-4 h-4" />
            {bookmarks.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E11D48] ring-2 ring-[#FAFAF8] dark:ring-[#0C0D0E]" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Warm Literary Linen' : 'Switch to Obsidian Charcoal'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Write / Editor Trigger */}
          {currentView.type !== 'editor' ? (
            <button
              onClick={() => navigateToEditor()}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-[#18181B] dark:bg-[#F4F4F6] text-white dark:text-[#18181B] px-3.5 py-1.5 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer ml-1"
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>
          ) : null}

          {/* User Avatar */}
          <div className="w-7 h-7 rounded-full overflow-hidden border border-[#E5E5DF] dark:border-[#26272C] ml-1">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80"
              alt="Elena Rostova"
              className="w-full h-full object-cover"
            />
          </div>

        </div>

      </div>

      {/* Reading Progress Bar (Sticky bottom border of nav) */}
      {currentView.type === 'article' && (
        <div className="w-full bg-transparent h-[2px] relative overflow-hidden">
          <div
            className="h-full bg-[#E11D48] transition-all duration-75 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}
    </header>
  );
};
