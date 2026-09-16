import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeaderboardItem, Timeframe } from '../types/leaderboard';
import { generateMockLeaderboard } from '../services/mockDataGenerator';

// In-memory master storage of the 10,000 players
let masterDataCache: LeaderboardItem[] | null = null;

function getInitialData(): LeaderboardItem[] {
  if (!masterDataCache) {
    masterDataCache = generateMockLeaderboard(10000);
  }
  return masterDataCache;
}

export function useLeaderboardData(timeframe: Timeframe = 'weekly') {
  const queryClient = useQueryClient();
  const [isLive, setIsLive] = useState(true);
  const [onlineCount, setOnlineCount] = useState(142850);
  const lastUpdatedRef = useRef<number>(Date.now());

  // TanStack Query to fetch leaderboard
  const { data: rawPlayers = [], isLoading, isFetching } = useQuery<LeaderboardItem[]>({
    queryKey: ['leaderboard', timeframe],
    queryFn: async () => {
      const data = getInitialData();
      // Select score according to timeframe
      return data.map((item) => {
        const score =
          timeframe === 'daily'
            ? item.timeframeScores.daily
            : timeframe === 'weekly'
            ? item.timeframeScores.weekly
            : item.timeframeScores.alltime;
        return {
          ...item,
          score,
        };
      });
    },
    staleTime: Infinity, // handled via interval mutation
  });

  // Background simulation for real-time live match results and rank shifts
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Fluctuate online players slightly
      setOnlineCount((prev) => prev + Math.floor(Math.random() * 21) - 10);

      // Mutate scores of a few random players near the top to produce live rank shifts
      queryClient.setQueryData<LeaderboardItem[]>(['leaderboard', timeframe], (old) => {
        if (!old || old.length === 0) return old;

        // Clone top slice or copy
        const updated = [...old];
        const numMutations = 3 + Math.floor(Math.random() * 4); // 3 to 6 players

        for (let m = 0; m < numMutations; m++) {
          // Focus mutations mostly in top 150 players so changes are visible
          const targetIndex = Math.floor(Math.random() * 120);
          const target = updated[targetIndex];
          if (!target) continue;

          const deltaScore = (Math.random() > 0.4 ? 1 : -1) * (15 + Math.floor(Math.random() * 35));
          const newScore = Math.max(100, target.score + deltaScore);

          updated[targetIndex] = {
            ...target,
            previousRank: target.rank,
            score: newScore,
          };
        }

        // Re-sort by score
        updated.sort((a, b) => b.score - a.score);

        // Re-assign ranks
        for (let i = 0; i < updated.length; i++) {
          const item = updated[i];
          if (item.rank !== i + 1) {
            updated[i] = {
              ...item,
              previousRank: item.rank,
              rank: i + 1,
            };
          }
        }

        lastUpdatedRef.current = Date.now();
        return updated;
      });
    }, 3800);

    return () => clearInterval(interval);
  }, [isLive, timeframe, queryClient]);

  // Optimistic Match Simulation Mutation:
  // User plays a match, gains LP, and immediately climbs the leaderboard
  const simulateMatchMutation = useMutation({
    mutationFn: async ({ scoreBonus, isVictory }: { scoreBonus: number; isVictory: boolean }) => {
      // Simulate network latency (200ms)
      await new Promise((res) => setTimeout(res, 200));
      return { scoreBonus, isVictory };
    },
    onMutate: async ({ scoreBonus, isVictory }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leaderboard', timeframe] });
      const previousLeaderboard = queryClient.getQueryData<LeaderboardItem[]>(['leaderboard', timeframe]);

      // Optimistically update current user (we designate Rank #42 or 'user-42' / 'Vortex_99')
      queryClient.setQueryData<LeaderboardItem[]>(['leaderboard', timeframe], (old) => {
        if (!old) return old;
        const currentUserId = 'user-42';
        const userIndex = old.findIndex((p) => p.userId === currentUserId);
        if (userIndex === -1) return old;

        const current = old[userIndex];
        const newScore = current.score + scoreBonus;
        const newMatches = current.matches + 1;
        const newWinRate = isVictory
          ? Math.min(99, Math.round(((current.winRate * current.matches + 100) / newMatches)))
          : Math.max(10, Math.round(((current.winRate * current.matches) / newMatches)));

        const updated = [...old];
        updated[userIndex] = {
          ...current,
          previousRank: current.rank,
          score: newScore,
          matches: newMatches,
          winRate: newWinRate,
          streak: isVictory ? current.streak + 1 : 0,
          recentMatches: [
            {
              id: `match-live-${Date.now()}`,
              outcome: isVictory ? 'victory' : 'defeat',
              score: isVictory ? '13 - 8' : '9 - 13',
              map: 'Ascent',
              agent: current.favoriteAgent,
              kda: isVictory ? '24/11/6' : '16/15/4',
              date: 'Just now',
            },
            ...current.recentMatches.slice(0, 4),
          ],
        };

        // Re-sort
        updated.sort((a, b) => b.score - a.score);

        // Re-assign ranks
        return updated.map((item, idx) => ({
          ...item,
          previousRank: item.rank,
          rank: idx + 1,
        }));
      });

      return { previousLeaderboard };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLeaderboard) {
        queryClient.setQueryData(['leaderboard', timeframe], context.previousLeaderboard);
      }
    },
  });

  const toggleLive = useCallback(() => {
    setIsLive((prev) => !prev);
  }, []);

  // Find user summary data
  const userRankData = rawPlayers.find((p) => p.userId === 'user-42') || {
    rank: 42,
    previousRank: 42,
    score: 3420,
    tier: 'master' as const,
    username: 'Vortex_99',
    tag: '#NA1',
    winRate: 78,
  };

  return {
    players: rawPlayers,
    isLoading,
    isFetching,
    isLive,
    toggleLive,
    onlineCount,
    simulateMatchWin: simulateMatchMutation.mutate,
    isSimulating: simulateMatchMutation.isPending,
    userRankData,
  };
}
