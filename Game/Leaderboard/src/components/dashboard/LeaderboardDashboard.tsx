import React, { useState, useMemo, useCallback } from 'react';
import { 
  Trophy, 
  Gamepad2, 
  Flame, 
  Users, 
  BarChart3, 
  History, 
  Sparkles, 
  Menu,
  X,
  Shield,
  Clock
} from 'lucide-react';
import { 
  Category, 
  LeaderboardItem, 
  Region, 
  Tier, 
  Timeframe 
} from '@/types/leaderboard';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';
import { useFavorites } from '@/hooks/useFavorites';
import { useDebounce } from '@/hooks/useDebounce';
import { HeaderBar } from './HeaderBar';
import { PodiumSection } from './PodiumSection';
import { FilterToolbar } from './FilterToolbar';
import { LeaderboardTable } from './LeaderboardTable';
import { PlayerProfileModal } from './PlayerProfileModal';
import { HallOfFameModal } from './HallOfFameModal';

export const LeaderboardDashboard: React.FC = () => {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'tournaments' | 'stats'>('leaderboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter state
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const [category, setCategory] = useState<Category>('global');
  const [region, setRegion] = useState<Region>('all');
  const [tier, setTier] = useState<'all' | Tier>('all');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'username' | 'winRate' | 'score'>('rank');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals state
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardItem | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(false);

  // Debounced search for instant 60fps filtering
  const debouncedSearch = useDebounce(searchInput, 200);

  // TanStack Query Real-Time Server State Hook
  const {
    players,
    isLoading,
    isLive,
    toggleLive,
    onlineCount,
    simulateMatchWin,
    isSimulating,
    userRankData,
  } = useLeaderboardData(timeframe);

  // Favorites Hook (localStorage persistence)
  const { favorites, toggleFavorite } = useFavorites();

  const handleToggleFavorite = useCallback((userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(userId);
  }, [toggleFavorite]);

  const handleSelectPlayer = useCallback((player: LeaderboardItem) => {
    setSelectedPlayer(player);
    setIsProfileOpen(true);
  }, []);

  const handleSort = useCallback((column: 'rank' | 'username' | 'winRate' | 'score') => {
    if (sortBy === column) {
      setSortAsc((prev) => !prev);
    } else {
      setSortBy(column);
      setSortAsc(column === 'rank' || column === 'username');
    }
  }, [sortBy]);

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    setCategory('global');
    setRegion('all');
    setTier('all');
    setSortBy('rank');
    setSortAsc(true);
  }, []);

  // Multi-dimensional filtering and sorting engine
  const filteredPlayers = useMemo(() => {
    let result = players;

    // 1. Category Filter
    if (category === 'friends') {
      result = result.filter((p) => p.isFriend);
    } else if (category === 'favorites') {
      result = result.filter((p) => favorites.has(p.userId));
    } else if (category === 'regional') {
      // Filter by NA / default user's region
      result = result.filter((p) => p.region === 'na');
    }

    // 2. Region Dropdown
    if (region !== 'all') {
      result = result.filter((p) => p.region === region);
    }

    // 3. Tier Filter
    if (tier !== 'all') {
      result = result.filter((p) => p.tier === tier);
    }

    // 4. Debounced Search Query
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.username.toLowerCase().includes(q) ||
          p.tag.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          p.favoriteAgent.toLowerCase().includes(q)
      );
    }

    // 5. Sorting
    return [...result].sort((a, b) => {
      const modifier = sortAsc ? 1 : -1;
      if (sortBy === 'rank') {
        return (a.rank - b.rank) * modifier;
      }
      if (sortBy === 'score') {
        return (b.score - a.score) * (sortAsc ? -1 : 1);
      }
      if (sortBy === 'winRate') {
        return (b.winRate - a.winRate) * (sortAsc ? -1 : 1);
      }
      if (sortBy === 'username') {
        return a.username.localeCompare(b.username) * modifier;
      }
      return 0;
    });
  }, [players, category, favorites, region, tier, debouncedSearch, sortBy, sortAsc]);

  // Top 3 players for podium
  const topThree = useMemo(() => {
    return players.slice(0, 3);
  }, [players]);

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex w-72 flex-col justify-between border-r border-border/80 bg-slate-950/90 p-6 fixed inset-y-0 left-0 z-30 backdrop-blur-md">
        <div className="space-y-6">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20">
              <Trophy className="h-6 w-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white">APEX ELITE</div>
              <div className="text-[11px] font-bold text-emerald-400">GLOBAL LEAGUE</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 pt-4">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Trophy className="h-4 w-4" />
              Global Leaderboard
            </button>

            <button
              onClick={() => setActiveTab('tournaments')}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                activeTab === 'tournaments'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              Championship Circuit
            </button>

            <button
              onClick={() => setIsHallOfFameOpen(true)}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-amber-400 transition-all"
            >
              <History className="h-4 w-4 text-amber-400" />
              Hall of Fame
            </button>

            <button
              onClick={() => handleSelectPlayer(players[0] || userRankData)}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              Player Analytics
            </button>
          </nav>
        </div>

        {/* User Card in Sidebar */}
        <div className="rounded-2xl border border-border/80 bg-slate-900/80 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-black text-sm border border-emerald-500/40">
              V
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-white truncate">Vortex_99</div>
              <div className="text-[11px] font-mono text-emerald-400">Rank #42 • Master</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-800 pt-2 text-slate-400">
            <span>Current LP: <strong className="text-white">3,420</strong></span>
            <span className="text-emerald-400 font-bold">+124 today</span>
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex flex-1 flex-col lg:pl-72 w-full min-w-0">
        
        {/* Sticky Header Bar */}
        <HeaderBar
          onlineCount={onlineCount}
          userRankData={userRankData}
          onSimulateMatch={() => simulateMatchWin({ scoreBonus: 45, isVictory: true })}
          isSimulating={isSimulating}
          onOpenHallOfFame={() => setIsHallOfFameOpen(true)}
        />

        {/* Main Content View */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          
          {/* Top 3 Contenders Podium */}
          <PodiumSection
            topPlayers={topThree}
            onSelectPlayer={handleSelectPlayer}
          />

          {/* Filtering and Search Controls */}
          <FilterToolbar
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            category={category}
            onCategoryChange={setCategory}
            region={region}
            onRegionChange={setRegion}
            tier={tier}
            onTierChange={setTier}
            searchQuery={searchInput}
            onSearchChange={setSearchInput}
            isLive={isLive}
            onToggleLive={toggleLive}
            totalFilteredCount={filteredPlayers.length}
          />

          {/* Virtualized Table */}
          <LeaderboardTable
            players={filteredPlayers}
            sortBy={sortBy}
            sortAsc={sortAsc}
            onSort={handleSort}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectPlayer={handleSelectPlayer}
            onResetFilters={handleResetFilters}
          />

        </main>

        {/* Global Footer */}
        <footer className="border-t border-border/60 bg-slate-950 py-6 text-center text-xs text-muted-foreground">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              Apex Elite Esports Leaderboard System • Powered by React, Vite, TanStack Virtual & Tailwind CSS
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <span className="hover:text-slate-400 cursor-pointer">Tournament Rules</span>
              <span>•</span>
              <span className="hover:text-slate-400 cursor-pointer">Anti-Cheat Policy</span>
              <span>•</span>
              <span className="hover:text-slate-400 cursor-pointer" onClick={() => setIsHallOfFameOpen(true)}>Hall of Fame</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Detailed Player Profile Modal */}
      <PlayerProfileModal
        player={selectedPlayer}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Hall of Fame Modal */}
      <HallOfFameModal
        isOpen={isHallOfFameOpen}
        onClose={() => setIsHallOfFameOpen(false)}
      />

    </div>
  );
};
