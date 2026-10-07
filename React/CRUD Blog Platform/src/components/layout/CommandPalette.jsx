import React, { useState, useEffect, useRef } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Search, FileText, Hash, PenSquare, Bookmark, X, ArrowRight } from 'lucide-react';

export const CommandPalette = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    posts,
    tags,
    navigateToArticle,
    navigateToTagHub,
    navigateToEditor,
    setIsBookmarksOpen,
    toggleTheme
  } = useBlog();

  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredPosts = query.trim()
    ? posts.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        p.author.name.toLowerCase().includes(query.toLowerCase())
      )
    : posts.slice(0, 4);

  const filteredTags = query.trim()
    ? tags.filter(t => 
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase())
      )
    : tags.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#1B1C21] rounded-2xl shadow-2xl border border-[#E5E5DF] dark:border-[#26272C] overflow-hidden transform animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E5E5DF] dark:border-[#26272C] gap-3">
          <Search className="w-5 h-5 text-[#71717A] dark:text-[#9496A1]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories, tags, authors, or commands..."
            className="flex-1 bg-transparent border-none outline-hidden text-[#18181B] dark:text-[#F4F4F6] text-sm placeholder:text-[#71717A]/60"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 text-xs">
          
          {/* Quick Actions */}
          <div>
            <h6 className="px-2 font-mono uppercase tracking-wider text-[10px] text-[#71717A] dark:text-[#9496A1] mb-1 font-semibold">
              Quick Navigation
            </h6>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  navigateToEditor();
                  setIsCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[#18181B] dark:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] cursor-pointer transition-colors"
              >
                <PenSquare className="w-3.5 h-3.5 text-[#E11D48]" />
                <span className="font-medium truncate">Draft New Story</span>
              </button>
              <button
                onClick={() => {
                  setIsBookmarksOpen(true);
                  setIsCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[#18181B] dark:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] cursor-pointer transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span className="font-medium truncate">Read Later List</span>
              </button>
            </div>
          </div>

          {/* Stories Section */}
          {filteredPosts.length > 0 && (
            <div>
              <h6 className="px-2 font-mono uppercase tracking-wider text-[10px] text-[#71717A] dark:text-[#9496A1] mb-1 font-semibold">
                Stories
              </h6>
              <div className="space-y-1">
                {filteredPosts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => {
                      navigateToArticle(post.slug);
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-[#F3F3EE] dark:hover:bg-[#141518] group cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <FileText className="w-4 h-4 text-[#71717A] dark:text-[#9496A1] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-serif text-sm font-medium text-[#18181B] dark:text-[#F4F4F6] group-hover:text-[#E11D48] dark:group-hover:text-[#E11D48] transition-colors truncate">
                          {post.title}
                        </p>
                        <p className="text-[11px] text-[#71717A] dark:text-[#9496A1] truncate">
                          {post.author.name} · {post.readingTime} min read
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#71717A] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Topics / Tags Section */}
          {filteredTags.length > 0 && (
            <div>
              <h6 className="px-2 font-mono uppercase tracking-wider text-[10px] text-[#71717A] dark:text-[#9496A1] mb-1 font-semibold">
                Curated Topics
              </h6>
              <div className="space-y-1">
                {filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      navigateToTagHub(tag.slug);
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-[#F3F3EE] dark:hover:bg-[#141518] group cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold text-[#18181B] dark:text-[#F4F4F6] truncate">
                          #{tag.name}
                        </p>
                        <p className="text-[11px] text-[#71717A] dark:text-[#9496A1] truncate">
                          {tag.postsCount || 0} stories · {tag.followersCount || 0} subscribers
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#71717A] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#F3F3EE]/60 dark:bg-[#141518]/60 border-t border-[#E5E5DF] dark:border-[#26272C] flex items-center justify-between text-[11px] text-[#71717A] dark:text-[#9496A1] font-mono">
          <span>Navigate with mouse or ↵ enter</span>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
};
