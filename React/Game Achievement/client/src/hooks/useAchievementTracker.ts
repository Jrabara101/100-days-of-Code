import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AchievementItem, 
  AchievementTrackerState, 
  AchievementCategory,
  BadgeTier
} from '../types/achievement';
import { playAchievementChime, triggerUnlockConfetti, playChestOpenFanfare, playTamperAlertSound } from '../audio/soundEffects';

export interface ToastItem {
  id: string;
  type: 'UNLOCK' | 'CLAIM' | 'TAMPER' | 'INFO';
  title: string;
  message: string;
  tier?: BadgeTier;
  timestamp: string;
}

export function useAchievementTracker() {
  const [state, setState] = useState<AchievementTrackerState>({
    achievements: {},
    activeCategory: 'all',
    searchQuery: '',
    selectedAchievementId: null,
    totalPoints: 0,
    unlockedCount: 0,
    pinnedIds: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [rewardModalAch, setRewardModalAch] = useState<AchievementItem | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const sequenceCounterRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(`session-${Math.random().toString(36).substring(2, 9)}`);

  const addToast = useCallback((toast: Omit<ToastItem, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      ...toast,
      id,
      timestamp: new Date().toLocaleTimeString()
    };
    setToasts(prev => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  // Fetch initial state via REST
  const fetchAchievements = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/achievements');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.warn('REST fetch fallback error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect WebSocket
  useEffect(() => {
    fetchAchievements();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket;
    let reconnectTimeout: any;

    function connect() {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'INIT':
              if (msg.data?.state) {
                setState(prev => ({
                  ...msg.data.state,
                  activeCategory: prev.activeCategory,
                  searchQuery: prev.searchQuery,
                  selectedAchievementId: prev.selectedAchievementId
                }));
              }
              break;

            case 'ACHIEVEMENT_UNLOCKED': {
              const ach: AchievementItem = msg.data.achievement;
              if (ach) {
                setState(prev => ({
                  ...prev,
                  achievements: { ...prev.achievements, [ach.id]: ach },
                  totalPoints: msg.data.state?.totalPoints ?? (prev.totalPoints + ach.points),
                  unlockedCount: msg.data.state?.unlockedCount ?? (prev.unlockedCount + 1)
                }));

                // Juiced feedback
                playAchievementChime(ach.tier);
                triggerUnlockConfetti(ach.tier);
                addToast({
                  type: 'UNLOCK',
                  title: `🏆 Milestone Unlocked: ${ach.title}`,
                  message: `+${ach.points} Gamerscore PTS earned! [Rarity: Top ${ach.globalRarityPercent}%]`,
                  tier: ach.tier
                });
              }
              break;
            }

            case 'PROGRESS_UPDATE': {
              if (msg.data?.state) {
                setState(prev => ({
                  ...msg.data.state,
                  activeCategory: prev.activeCategory,
                  searchQuery: prev.searchQuery,
                  selectedAchievementId: prev.selectedAchievementId
                }));
              }
              break;
            }

            case 'REWARD_CLAIMED': {
              const ach: AchievementItem = msg.data.achievement;
              if (ach) {
                setState(prev => ({
                  ...prev,
                  achievements: { ...prev.achievements, [ach.id]: ach }
                }));
              }
              break;
            }

            case 'PIN_TOGGLED': {
              if (msg.data?.pinnedIds) {
                setState(prev => ({
                  ...prev,
                  pinnedIds: msg.data.pinnedIds,
                  achievements: msg.data.state?.achievements ?? prev.achievements
                }));
              }
              break;
            }

            case 'TAMPER_ALERT': {
              playTamperAlertSound();
              addToast({
                type: 'TAMPER',
                title: '⚠️ Security Alert: Anti-Spoofing Evaluator',
                message: msg.data.alert || 'Abnormal event frequency or sequence violation detected.'
              });
              break;
            }

            case 'SYSTEM_RESET': {
              if (msg.data?.state) {
                setState(msg.data.state);
                addToast({
                  type: 'INFO',
                  title: 'Vault Reset',
                  message: 'Telemetry ledger & achievements reinitialized to benchmark state.'
                });
              }
              break;
            }
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        ws.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchAchievements, addToast]);

  // Set active category tab
  const setCategory = useCallback((category: AchievementCategory | 'all') => {
    setState(prev => ({ ...prev, activeCategory: category }));
  }, []);

  // Set search query
  const setSearch = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  // Select achievement for Sheet drawer
  const selectAchievement = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedAchievementId: id }));
  }, []);

  // Toggle Pin with optimistic update and rollback
  const togglePin = useCallback(async (id: string) => {
    const previousPinned = [...state.pinnedIds];
    const item = state.achievements[id];
    if (!item) return;

    if (!item.isPinned && previousPinned.length >= 3) {
      addToast({
        type: 'INFO',
        title: 'Showcase Full',
        message: 'The Flex Plinth showcase is reserved for your top 3 trophies.'
      });
      return;
    }

    // Optimistic update
    const newPinned = item.isPinned 
      ? previousPinned.filter(pId => pId !== id)
      : [...previousPinned, id];

    setState(prev => ({
      ...prev,
      pinnedIds: newPinned,
      achievements: {
        ...prev.achievements,
        [id]: { ...item, isPinned: !item.isPinned }
      }
    }));

    try {
      const res = await fetch(`/api/achievements/${id}/pin`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to update pin state');
      }
    } catch {
      // Rollback
      setState(prev => ({
        ...prev,
        pinnedIds: previousPinned,
        achievements: {
          ...prev.achievements,
          [id]: { ...item, isPinned: item.isPinned }
        }
      }));
      addToast({
        type: 'INFO',
        title: 'Sync Failed',
        message: 'Could not pin achievement to plinth. Reverted to previous state.'
      });
    }
  }, [state.pinnedIds, state.achievements, addToast]);

  // Claim reward with optimistic update and celebratory vault sequence
  const claimReward = useCallback(async (achievementId: string) => {
    const ach = state.achievements[achievementId];
    if (!ach || !ach.reward || ach.reward.isClaimed || !ach.isUnlocked) return;

    setClaimingId(achievementId);
    const previousAch = { ...ach };

    // Optimistic
    setState(prev => ({
      ...prev,
      achievements: {
        ...prev.achievements,
        [achievementId]: {
          ...ach,
          reward: { ...ach.reward!, isClaimed: true, claimedAt: new Date().toISOString() }
        }
      }
    }));

    try {
      const res = await fetch(`/api/achievements/${achievementId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlockToken: ach.reward.unlockToken })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Claim rejected by rule engine');
      }

      const result = await res.json();
      
      // Play celebratory sound and open loot vault modal
      playChestOpenFanfare();
      triggerUnlockConfetti('gold');
      setRewardModalAch(ach);

      addToast({
        type: 'CLAIM',
        title: '🎁 Vault Unlocked!',
        message: `Claimed: ${ach.reward.title}! Added to your inventory.`
      });

      if (result.achievement) {
        setState(prev => ({
          ...prev,
          achievements: {
            ...prev.achievements,
            [achievementId]: result.achievement
          }
        }));
      }
    } catch (err: any) {
      // Rollback
      setState(prev => ({
        ...prev,
        achievements: {
          ...prev.achievements,
          [achievementId]: previousAch
        }
      }));
      addToast({
        type: 'TAMPER',
        title: 'Claim Denied',
        message: err.message || 'Server-authoritative engine rejected claim.'
      });
    } finally {
      setClaimingId(null);
    }
  }, [state.achievements, addToast]);

  // Send Telemetry Event
  const sendTelemetry = useCallback(async (event: string, metadata: Record<string, any> = {}) => {
    sequenceCounterRef.current += 1;
    const payload = {
      event,
      metadata,
      sequenceNumber: sequenceCounterRef.current,
      clientTimestamp: Date.now(),
      sessionId: sessionIdRef.current
    };

    try {
      const res = await fetch('/api/telemetry/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.tamperAlert) {
          playTamperAlertSound();
          addToast({
            type: 'TAMPER',
            title: '⚠️ Anti-Spoofing Triggered',
            message: data.tamperAlert
          });
        }
      }
      return data;
    } catch (err) {
      console.error('Telemetry dispatch error:', err);
    }
  }, [addToast]);

  // Reset entire system to benchmark
  const resetSystem = useCallback(async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        sequenceCounterRef.current = 0;
      }
    } catch (e) {
      console.error('Reset error:', e);
    }
  }, []);

  return {
    state,
    isLoading,
    isConnected,
    toasts,
    claimingId,
    rewardModalAch,
    isPassportOpen,
    setRewardModalAch,
    setIsPassportOpen,
    setCategory,
    setSearch,
    selectAchievement,
    togglePin,
    claimReward,
    sendTelemetry,
    resetSystem,
    dismissToast: (id: string) => setToasts(prev => prev.filter(t => t.id !== id))
  };
}
