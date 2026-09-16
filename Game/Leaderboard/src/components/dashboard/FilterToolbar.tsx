import React from 'react';
import { 
  Search, 
  X, 
  Globe, 
  Users, 
  MapPin, 
  Star, 
  Radio, 
  Filter,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { Category, Region, Timeframe, Tier } from '@/types/leaderboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FilterToolbarProps {
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  category: Category;
  onCategoryChange: (cat: Category) => void;
  region: Region;
  onRegionChange: (reg: Region) => void;
  tier: 'all' | Tier;
  onTierChange: (tier: 'all' | Tier) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLive: boolean;
  onToggleLive: () => void;
  totalFilteredCount: number;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  timeframe,
  onTimeframeChange,
  category,
  onCategoryChange,
  region,
  onRegionChange,
  tier,
  onTierChange,
  searchQuery,
  onSearchChange,
  isLive,
  onToggleLive,
  totalFilteredCount,
}) => {
  return (
    <div className="w-full space-y-4">
      {/* Top Controls Row: Timeframe + Category Navigation + Live Status Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Timeframe selector (Daily, Weekly, All-Time) */}
        <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-border/80 shadow-sm">
          {(['daily', 'weekly', 'alltime'] as Timeframe[]).map((tf) => {
            const active = timeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold capitalize transition-all ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <Calendar className="h-3 w-3" />
                {tf === 'alltime' ? 'All-Time' : tf}
              </button>
            );
          })}
        </div>

        {/* Category Toggles (Global, Friends, Regional, Starred) */}
        <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-border/80 shadow-sm">
          <button
            onClick={() => onCategoryChange('global')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              category === 'global'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Global
          </button>

          <button
            onClick={() => onCategoryChange('friends')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              category === 'friends'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Friends
          </button>

          <button
            onClick={() => onCategoryChange('regional')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              category === 'regional'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            Regional
          </button>

          <button
            onClick={() => onCategoryChange('favorites')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              category === 'favorites'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Star className="h-3.5 w-3.5 fill-amber-400/20 text-amber-400" />
            Starred
          </button>
        </div>

        {/* Live rank movement pause / resume switch */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleLive}
          className={`gap-2 text-xs font-semibold ${
            isLive
              ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
              : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          <Radio className={`h-3.5 w-3.5 ${isLive ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
          {isLive ? 'Live Feed: Active' : 'Live Feed: Paused'}
        </Button>

      </div>

      {/* Bottom Filter Row: Search Input + Region Select + Tier Select + Match Count */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        
        {/* Search Bar */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by player name, tag (#NA1), or country..."
            className="pl-10 pr-10 bg-slate-900/90 text-xs sm:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Region Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-slate-900/90 px-3 py-1.5 shadow-sm">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={region}
              onChange={(e) => onRegionChange(e.target.value as Region)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Regions</option>
              <option value="na" className="bg-slate-900 text-white">🇺🇸 North America (NA)</option>
              <option value="eu" className="bg-slate-900 text-white">🇪🇺 Europe (EU)</option>
              <option value="ap" className="bg-slate-900 text-white">🇯🇵 Asia-Pacific (AP)</option>
              <option value="sa" className="bg-slate-900 text-white">🇧🇷 South America (SA)</option>
            </select>
          </div>

          {/* Tier Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-slate-900/90 px-3 py-1.5 shadow-sm">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={tier}
              onChange={(e) => onTierChange(e.target.value as 'all' | Tier)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer capitalize"
            >
              <option value="all" className="bg-slate-900 text-white">All Tiers</option>
              <option value="master" className="bg-slate-900 text-purple-400">Master</option>
              <option value="diamond" className="bg-slate-900 text-cyan-400">Diamond</option>
              <option value="gold" className="bg-slate-900 text-amber-400">Gold</option>
              <option value="silver" className="bg-slate-900 text-slate-300">Silver</option>
              <option value="bronze" className="bg-slate-900 text-orange-400">Bronze</option>
            </select>
          </div>

          {/* Results Counter Badge */}
          <div className="rounded-xl border border-border/70 bg-slate-900/60 px-3 py-1.5 text-xs text-muted-foreground">
            Matching: <span className="font-mono font-bold text-emerald-400">{totalFilteredCount.toLocaleString()}</span> players
          </div>

        </div>

      </div>
    </div>
  );
};
