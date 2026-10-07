import React, { useState } from 'react';
import {
  Trophy,
  Search,
  Sparkles,
  Layers,
  Code2,
  Sliders,
  CheckCircle2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AchievementNode, BlockBiome } from '../../types/achievement';
import { Progress } from '../ui/progress';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface TopNavigationBarProps {
  nodes: Record<string, AchievementNode>;
  activeBiomeFilter: BlockBiome | 'all';
  onBiomeFilterChange: (biome: BlockBiome | 'all') => void;
  onFocusNode: (nodeId: string) => void;
  onOpenFlexPlinth: () => void;
  onOpenArchSpec: () => void;
  onToggleTelemetryDock: () => void;
  isTelemetryDockOpen: boolean;
  isConnected: boolean;
  totalPoints: number;
  unlockedCount: number;
}

export const TopNavigationBar: React.FC<TopNavigationBarProps> = ({
  nodes,
  activeBiomeFilter,
  onBiomeFilterChange,
  onFocusNode,
  onOpenFlexPlinth,
  onOpenArchSpec,
  onToggleTelemetryDock,
  isTelemetryDockOpen,
  isConnected,
  totalPoints,
  unlockedCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const totalCount = Object.keys(nodes).length;
  const completionPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  // Search Results
  const matchingNodes = searchQuery.trim()
    ? Object.values(nodes).filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.biome.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.tier.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="relative z-40 w-full bg-surface/95 border-b border-slate-800/80 backdrop-blur-xl px-4 py-2.5 shadow-xl select-none">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left Branding & Overall Telemetry Progress */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-700 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.4)] border border-cyan-400/40">
              <Layers className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold tracking-tight text-white font-display">
                  Archipelago Matrix
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-primary/20 text-primary rounded border border-primary/30 uppercase font-bold">
                  v4.2 DAG
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {/* WebSocket Health Dot */}
                <div
                  className="flex items-center gap-1 text-[11px] font-mono"
                  title={isConnected ? 'Fastify WebSocket connected' : 'Connecting / Offline mode'}
                >
                  {isConnected ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 font-semibold">Authoritative WS</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-amber-400 font-semibold">Local Fallback</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gamerscore Points Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container border border-slate-700/80 shadow-inner">
            <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
            <div className="flex flex-col">
              <span className="text-xs font-mono font-extrabold text-amber-300 tracking-wider">
                {totalPoints.toLocaleString()} PTS
              </span>
            </div>
          </div>
        </div>

        {/* Center: Overall Completion Bar & Biome Tabs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Progress Bar Capsule */}
          <div className="flex items-center gap-2.5 min-w-[200px] w-full sm:w-auto">
            <div className="flex flex-col flex-1">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Completion</span>
                <span className="text-primary font-bold">
                  {unlockedCount} / {totalCount} ({completionPercentage.toFixed(0)}%)
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2 w-48" />
            </div>
          </div>

          {/* Biome Category Tabs */}
          <Tabs
            value={activeBiomeFilter}
            onValueChange={(val) => onBiomeFilterChange(val as BlockBiome | 'all')}
          >
            <TabsList className="bg-surface-container/80 border border-slate-800">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="overworld" className="text-xs">
                Overworld
              </TabsTrigger>
              <TabsTrigger value="nether" className="text-xs">
                Nether
              </TabsTrigger>
              <TabsTrigger value="crystal_depths" className="text-xs">
                Depths
              </TabsTrigger>
              <TabsTrigger value="celestial" className="text-xs">
                Celestial
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Right Search Bar & Utility Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Autocomplete Node Search Bar */}
          <div className="relative w-44 md:w-48">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search matrix..."
                className="pl-8 h-8 text-xs bg-surface-container border-slate-700/80"
              />
            </div>

            {/* Instant Search Dropdown */}
            {isSearchFocused && matchingNodes.length > 0 && (
              <div className="absolute top-10 left-0 right-0 z-50 rounded-xl bg-surface/98 border border-slate-700 p-1.5 shadow-2xl backdrop-blur-xl max-h-64 overflow-y-auto">
                {matchingNodes.map((n) => (
                  <button
                    key={n.id}
                    onMouseDown={() => {
                      onFocusNode(n.id);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs hover:bg-surface-high transition-colors"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-bold text-white truncate">{n.title}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{n.biome}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1 rounded ${
                        n.isUnlocked ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400'
                      }`}
                    >
                      {n.isUnlocked ? 'UNLOCKED' : `${n.points}p`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Flex Plinth Showcase Trigger */}
          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenFlexPlinth}
            className="h-8 gap-1.5 text-xs text-amber-300 hover:text-amber-200 border-amber-500/30 bg-amber-500/10"
            title="Open Trophy Flex Plinth"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Plinth</span>
          </Button>

          {/* Arch Spec Dialog Trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenArchSpec}
            className="h-8 gap-1.5 text-xs text-slate-300"
            title="Fastify & DAG Architecture Spec"
          >
            <Code2 className="w-3.5 h-3.5 text-primary" />
            <span className="hidden lg:inline">Spec</span>
          </Button>

          {/* Telemetry Simulator Injector Toggle */}
          <Button
            size="sm"
            variant={isTelemetryDockOpen ? 'primary' : 'secondary'}
            onClick={onToggleTelemetryDock}
            className="h-8 gap-1.5 text-xs font-semibold"
            title="Toggle Event Telemetry Simulator"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Telemetry</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
