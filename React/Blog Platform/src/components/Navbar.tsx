import React from 'react';
import { BookOpen, Bookmark, Sliders, Scissors, Compass, Play, Sparkles } from 'lucide-react';
import { useReader } from '../context/ReaderContext';
import { calculateQueueBudget } from '../services/editorialEngine';

interface NavbarProps {
  currentView: string;
  onNavigateHome: () => void;
  onSelectCategory: (categoryId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigateHome, onSelectCategory }) => {
  const {
    settings,
    setIsComfortStudioOpen,
    highlights,
    setIsNotebookOpen,
    queue,
    setIsQueueOpen,
  } = useReader();

  const queueBudget = calculateQueueBudget(queue);

  return (
    <header
      className={`sticky top-0 z-30 transition-colors duration-300 border-b ${
        settings.palette === 'midnight'
          ? 'bg-[#0F1115]/90 border-white/10 text-white'
          : settings.palette === 'sepia'
          ? 'bg-[#F4ECD8]/90 border-[#3B3228]/15 text-[#3B3228]'
          : 'bg-[#FAF8F5]/90 border-black/10 text-[#18181B]'
      } glass-header`}
    >
      {/* Top micro metadata bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-[11px] font-mono-tabular border-b border-inherit opacity-75">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-wider text-rose-600 dark:text-rose-400">
            ISSUE № 48
          </span>
          <span className="hidden sm:inline text-inherit opacity-40">•</span>
          <span className="hidden sm:inline">AUTUMN / WINTER EDITORIAL</span>
          <span className="hidden md:inline text-inherit opacity-40">•</span>
          <span className="hidden md:inline">CIRCULATION 42,000</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-subtle-pulse"></span>
            <span className="hidden xs:inline">ALL EDITORIAL ESSAYS VERIFIED</span>
          </span>
          <span>EST. READING SPEED: 215 WPM</span>
        </div>
      </div>

      {/* Main Masthead row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={onNavigateHome}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-sm bg-rose-600 text-white text-xs font-bold font-serif shadow-sm">
                C
              </span>
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight group-hover:text-rose-600 transition-colors">
                The Chronicle <span className="italic font-normal opacity-80">&amp; Essayist</span>
              </h1>
            </div>
            <p className="text-[11px] font-interface tracking-wide uppercase opacity-60 mt-0.5">
              Tactile Newsprint &amp; Multimedia Editorial
            </p>
          </button>
        </div>

        {/* Center Navigation Shortcuts (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={onNavigateHome}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              currentView === 'home'
                ? 'bg-rose-600/10 text-rose-700 dark:text-rose-400 font-bold'
                : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
            }`}
          >
            Front Page
          </button>
          <button
            onClick={() => onSelectCategory('design')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              currentView === 'category-design'
                ? 'bg-blue-600/10 text-blue-700 dark:text-blue-400 font-bold'
                : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
            }`}
          >
            Design &amp; UI
          </button>
          <button
            onClick={() => onSelectCategory('systems')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              currentView === 'category-systems'
                ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
            }`}
          >
            Systems
          </button>
          <button
            onClick={() => onSelectCategory('culture')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              currentView === 'category-culture'
                ? 'bg-amber-600/10 text-amber-700 dark:text-amber-400 font-bold'
                : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
            }`}
          >
            Mental Models
          </button>
          <button
            onClick={() => onSelectCategory('video')}
            className={`px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors ${
              currentView === 'category-video'
                ? 'bg-purple-600/10 text-purple-700 dark:text-purple-400 font-bold'
                : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
            }`}
          >
            <Play className="w-3 h-3 fill-current text-purple-600" />
            Video Essays
          </button>
        </nav>

        {/* Right Action Tools: Queue, Notebook, Typography Studio */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Read Later Queue Button */}
          <button
            onClick={() => setIsQueueOpen(true)}
            title="Open Read Later Queue"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono-tabular border border-inherit hover:border-rose-500/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline font-interface font-medium">Queue</span>
            {queue.length > 0 ? (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full">
                {queue.length} • {queueBudget.totalMinutes}m
              </span>
            ) : (
              <span className="text-[10px] opacity-60">0</span>
            )}
          </button>

          {/* Notebook / Saved Highlights */}
          <button
            onClick={() => setIsNotebookOpen(true)}
            title="Open Personal Notebook &amp; Saved Highlights"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono-tabular border border-inherit hover:border-amber-500/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline font-interface font-medium">Notebook</span>
            {highlights.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-600/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-full">
                {highlights.length}
              </span>
            )}
          </button>

          {/* Reader Comfort & Typography Studio Toggle (Aa) */}
          <button
            onClick={() => setIsComfortStudioOpen(true)}
            title="Customize Reading Ergonomics &amp; Canvas Theme"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border border-inherit bg-black/5 dark:bg-white/10 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all cursor-pointer"
          >
            <span className="font-serif text-sm">Aa</span>
            <Sliders className="w-3 h-3 opacity-70" />
          </button>
        </div>
      </div>
    </header>
  );
};
