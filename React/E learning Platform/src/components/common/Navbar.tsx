import React, { useState } from 'react';
import { 
  Flame, 
  ShieldCheck, 
  Brain, 
  Search, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  GraduationCap, 
  BookOpen, 
  Layers, 
  Award,
  Video
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { sounds } from '../../services/audioEffects';

export type NavigationTab = 'dashboard' | 'classroom' | 'quiz' | 'syllabus' | 'certificate';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  dueCardsCount: number;
  onOpenMemoryVault: () => void;
  streakDays: number;
  freezeShields: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  dueCardsCount,
  onOpenMemoryVault,
  streakDays,
  freezeShields
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const toggleAudio = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    sounds.enabled = !nextState;
    if (!nextState) sounds.playClick();
  };

  const tabs: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'My Learning', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'classroom', label: 'Course Classroom', icon: <Video className="w-4 h-4" /> },
    { id: 'quiz', label: 'Diagnostic Quiz', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'syllabus', label: 'Skill Tree DAG', icon: <Layers className="w-4 h-4" /> },
    { id: 'certificate', label: 'Certificates', icon: <Award className="w-4 h-4" /> }
  ];

  return (
    <>
      <header className="h-16 sticky top-0 z-40 border-b border-black/10 dark:border-white/10 bg-[#FAF9F5]/90 dark:bg-[#090B10]/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between transition-colors">
        {/* Left: Brand Emblem & Navigation Tabs */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => { sounds.playClick(); onSelectTab('dashboard'); }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                KINESIS <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">Mastery</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Active Learning Engine
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map(tab => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sounds.playClick();
                    onSelectTab(tab.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-black/5 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center: Global Instant Search */}
        <div className="hidden xl:flex items-center flex-1 max-w-md mx-6">
          <button
            onClick={() => { sounds.playClick(); setSearchOpen(true); }}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:border-indigo-400/50 hover:bg-black/10 dark:hover:bg-white/10 text-xs transition-all shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search courses, timestamped notes, or quiz concepts...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Live Habit & Streak Cluster */}
        <div className="flex items-center gap-3">
          {/* 18-Day Streak + Freeze Shields */}
          <div 
            title={`${streakDays}-Day Momentum Streak protected by ${freezeShields} Streak Freeze Shields`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold tabular-nums"
          >
            <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse-subtle" />
            <span>{streakDays} Days</span>
            <div className="w-px h-3 bg-orange-500/20" />
            <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-mono">{freezeShields}</span>
            </div>
          </div>

          {/* Memory Vault 3-Min Daily Review Action Pill */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenMemoryVault();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
              dueCardsCount > 0
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white animate-pulse-subtle ring-2 ring-violet-500/20'
                : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/10'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Daily Review:</span>
            <span className="font-mono tabular-nums">{dueCardsCount} Cards</span>
            <span className="text-[10px] opacity-80 font-mono">(3m)</span>
          </button>

          {/* Audio Sound Toggle */}
          <button
            onClick={toggleAudio}
            title={isAudioMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            className="p-2 rounded-lg border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full ring-2 ring-indigo-500/30 overflow-hidden cursor-pointer" title="Scholar Profile: Alex Mercer">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" 
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal (⌘K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#171B26] border border-black/10 dark:border-white/10 shadow-2xl p-4 overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2 border-b border-black/10 dark:border-white/10">
              <Search className="w-5 h-5 text-indigo-500" />
              <input
                type="text"
                autoFocus
                placeholder="Search lectures, timestamped notes, Raft, Paxos, consensus..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-hidden text-sm text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/10 text-slate-500"
              >
                ESC
              </button>
            </div>

            <div className="py-3 px-2 space-y-2 max-h-72 overflow-y-auto">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-2">
                Quick Jump Suggestions
              </div>

              <div 
                onClick={() => { setSearchOpen(false); onSelectTab('classroom'); }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-indigo-500" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">04.3 — Raft Consensus & Leader Election</span>
                    <p className="text-[11px] text-slate-500">Resume lecture at @ 11:42 with interactive diagram</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-indigo-500">Lecture</span>
              </div>

              <div 
                onClick={() => { setSearchOpen(false); onSelectTab('quiz'); }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Module 04 Mastery Assessment</span>
                    <p className="text-[11px] text-slate-500">10 questions • 12m timer • Metacognitive confidence</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-violet-500">Quiz</span>
              </div>

              <div 
                onClick={() => { setSearchOpen(false); onSelectTab('classroom'); }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded bg-amber-500/20 text-amber-500 flex items-center justify-center font-mono text-[10px]">
                    📸
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Note @ 03:18: Timing Invariant Invariant</span>
                    <p className="text-[11px] text-slate-500">Heartbeat interval 15ms vs election timeout 150-300ms</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-500">Saved Note</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

