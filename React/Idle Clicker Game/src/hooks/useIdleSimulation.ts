import { useState, useEffect, useRef, useCallback } from 'react';
import Decimal from 'break_infinity.js';
import {
  IdleGameState,
  BuyMultiplier,
  AnomalyCollectible,
  GeneratorConfig,
} from '../types/game';
import {
  INITIAL_GAME_STATE,
  INITIAL_GENERATORS,
  INITIAL_UPGRADES,
} from '../lib/defaultState';
import {
  toDecimal,
  calculateBulkGeneratorCost,
  calculateMaxAffordableGenerators,
} from '../lib/bigNumber';
import { soundManager } from '../lib/audio';

const STORAGE_KEY = 'quantum_foundry_save_v1';
const TICK_RATE_MS = 50; // Fixed 20Hz simulation tick rate
const UI_SYNC_RATE_MS = 100; // 10Hz decoupled React state dispatch

export interface OfflineGainSummary {
  offlineSeconds: number;
  offlineGains: string;
  serverTime: number;
  antiCheatStatus: string;
}

export function useIdleSimulation() {
  // Load saved state or default
  const [gameState, setGameState] = useState<IdleGameState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with initial generators & upgrades to ensure schema migration
        return {
          ...INITIAL_GAME_STATE,
          ...parsed,
          generators: { ...INITIAL_GENERATORS, ...(parsed.generators || {}) },
          upgrades: { ...INITIAL_UPGRADES, ...(parsed.upgrades || {}) },
          prestigePerks: { ...INITIAL_GAME_STATE.prestigePerks, ...(parsed.prestigePerks || {}) },
          settings: { ...INITIAL_GAME_STATE.settings, ...(parsed.settings || {}) },
          stats: { ...INITIAL_GAME_STATE.stats, ...(parsed.stats || {}) },
        };
      }
    } catch (e) {
      console.warn('Could not parse saved game state, starting fresh', e);
    }
    return INITIAL_GAME_STATE;
  });

  // Decoupled simulation reference (all 20Hz fractional arithmetic happens here without React re-renders)
  const simRef = useRef<IdleGameState>(gameState);
  simRef.current = gameState;

  const [offlineGainModal, setOfflineGainModal] = useState<OfflineGainSummary | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [serverStatus, setServerStatus] = useState<'ONLINE' | 'OFFLINE' | 'SYNCED'>('ONLINE');
  const [activeAnomalies, setActiveAnomalies] = useState<AnomalyCollectible[]>([]);

  // Cadence anti-cheat telemetry buffer
  const tapTimestampsRef = useRef<number[]>([]);
  const tapIntervalsRef = useRef<number[]>([]);

  // Recalculates total Currency Per Second based on active state
  const calculateTotalCps = useCallback((state: IdleGameState): Decimal => {
    let globalMult = 1.0;

    // Prestige shard bonus (+2% per shard, or +4% with perk_singularity_mastery)
    const shardBonusPerk = state.prestigePerks['perk_singularity_mastery'];
    const shardBonusRate = 0.02 + (shardBonusPerk ? shardBonusPerk.level * shardBonusPerk.effectMultiplier : 0);
    globalMult += state.prestigeCurrency * shardBonusRate;

    // Drone overclock perk (+15% per rank)
    const dronePerk = state.prestigePerks['perk_drone_overclock'];
    if (dronePerk && dronePerk.level > 0) {
      globalMult += dronePerk.level * dronePerk.effectMultiplier;
    }

    // Generator-specific multipliers from purchased upgrades
    const generatorMultipliers: Record<string, number> = {};
    for (const upg of Object.values(state.upgrades)) {
      if (!upg.isPurchased) continue;
      if (upg.targetType === 'GLOBAL') {
        globalMult *= upg.multiplier;
      } else if (upg.targetType === 'GENERATOR' && upg.targetId) {
        generatorMultipliers[upg.targetId] = (generatorMultipliers[upg.targetId] || 1) * upg.multiplier;
      }
    }

    // Frenzy multiplier (3x global production during frenzy)
    if (state.activeFrenzy && state.activeFrenzy.expiresAt > Date.now()) {
      globalMult *= 3.0;
    }

    let totalCps = new Decimal(0);
    for (const [genId, gen] of Object.entries(state.generators)) {
      if (gen.owned <= 0) continue;
      const genMult = generatorMultipliers[genId] || 1;
      const basePerUnit = toDecimal(gen.baseProductionPerSec).times(genMult);
      const subTotal = basePerUnit.times(gen.owned);
      totalCps = totalCps.plus(subTotal);
    }

    return totalCps.times(globalMult);
  }, []);

  // Compute manual click potency
  const calculateClickYield = useCallback((state: IdleGameState, isCrit = false): Decimal => {
    let baseClick = new Decimal(1);

    // Click upgrades
    for (const upg of Object.values(state.upgrades)) {
      if (upg.isPurchased && upg.targetType === 'CLICK') {
        baseClick = baseClick.times(upg.multiplier);
      }
    }

    // 1% of passive CPS added to tap yield
    const currentCps = toDecimal(state.currencyPerSec);
    if (currentCps.gt(0)) {
      baseClick = baseClick.plus(currentCps.times(0.01));
    }

    // Active Frenzy: 7x manual tap yield
    if (state.activeFrenzy && state.activeFrenzy.expiresAt > Date.now()) {
      baseClick = baseClick.times(state.activeFrenzy.multiplier || 7);
    }

    if (isCrit) {
      baseClick = baseClick.times(10);
    }

    return baseClick;
  }, []);

  // Synchronize state with backend
  const syncWithServer = useCallback(async (isInitial = false) => {
    try {
      setIsSyncing(true);
      const state = simRef.current;
      const payload = {
        playerId: state.playerId,
        handle: state.playerHandle,
        lastSavedAt: state.lastSavedAt,
        localCurrency: state.currency,
        lifetimeCurrency: state.lifetimeCurrency,
        highestCps: state.stats.highestCps,
        generators: Object.fromEntries(
          Object.entries(state.generators).map(([k, v]) => [k, v.owned])
        ),
        upgrades: Object.values(state.upgrades)
          .filter((u) => u.isPurchased)
          .map((u) => u.id),
        prestigeShards: state.prestigeCurrency,
        tapCount: state.stats.totalClicks,
        tapSampleDeltas: tapIntervalsRef.current.slice(-20),
      };

      const res = await fetch('/api/idle/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Sync endpoint returned ' + res.status);
      const data = await res.json();

      setServerStatus('SYNCED');

      // If initial launch and there were offline gains (> 10s offline)
      if (isInitial && data.offlineSeconds > 10 && toDecimal(data.offlineGains).gt(0)) {
        setOfflineGainModal({
          offlineSeconds: data.offlineSeconds,
          offlineGains: data.offlineGains,
          serverTime: data.serverTime,
          antiCheatStatus: data.antiCheatStatus,
        });

        // Add offline gains to state
        setGameState((prev) => {
          const newCur = toDecimal(prev.currency).plus(toDecimal(data.offlineGains));
          const newLife = toDecimal(prev.lifetimeCurrency).plus(toDecimal(data.offlineGains));
          return {
            ...prev,
            currency: newCur.toString(),
            lifetimeCurrency: newLife.toString(),
            lastSavedAt: data.serverTime,
          };
        });
      } else {
        setGameState((prev) => ({
          ...prev,
          lastSavedAt: data.serverTime,
        }));
      }
    } catch (err) {
      setServerStatus('OFFLINE');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Perform initial server sync on load
  useEffect(() => {
    syncWithServer(true);
  }, [syncWithServer]);

  // Decoupled 20Hz Tick Loop (Accumulator)
  useEffect(() => {
    let lastTickTime = performance.now();
    let autoBuyerTimer = 0;

    const intervalId = setInterval(() => {
      const now = performance.now();
      const deltaSeconds = Math.max(0, (now - lastTickTime) / 1000);
      lastTickTime = now;

      const state = simRef.current;
      const currentCps = calculateTotalCps(state);
      const productionDelta = currentCps.times(deltaSeconds);

      let nextCurrency = toDecimal(state.currency).plus(productionDelta);
      let nextLifetime = toDecimal(state.lifetimeCurrency).plus(productionDelta);

      // Auto-unlock generator visibility when currency reaches 65% of base cost
      let updatedGenerators = state.generators;
      let hasGenUpdates = false;

      for (const [id, gen] of Object.entries(state.generators)) {
        if (!gen.unlocked && nextLifetime.gte(toDecimal(gen.baseCost).times(0.65))) {
          if (!hasGenUpdates) {
            updatedGenerators = { ...state.generators };
            hasGenUpdates = true;
          }
          updatedGenerators[id] = { ...gen, unlocked: true };
        }
      }

      // Check Frenzy expiration
      let activeFrenzy = state.activeFrenzy;
      if (activeFrenzy && activeFrenzy.expiresAt <= Date.now()) {
        activeFrenzy = null;
      }

      // Autonomous Foundry Bot Perk: auto-purchases lowest affordable tier every 8 seconds
      autoBuyerTimer += deltaSeconds;
      if (state.prestigePerks['perk_auto_buyer']?.level > 0 && autoBuyerTimer >= 8.0) {
        autoBuyerTimer = 0;
        for (const [id, gen] of Object.entries(updatedGenerators)) {
          if (gen.unlocked) {
            const cost = calculateBulkGeneratorCost(gen.baseCost, gen.costExponent, gen.owned, 1);
            if (nextCurrency.gte(cost)) {
              nextCurrency = nextCurrency.minus(cost);
              if (!hasGenUpdates) {
                updatedGenerators = { ...updatedGenerators };
                hasGenUpdates = true;
              }
              updatedGenerators[id] = { ...gen, owned: gen.owned + 1 };
              break;
            }
          }
        }
      }

      // Update simulation reference directly (no React overhead)
      simRef.current = {
        ...state,
        currency: nextCurrency.toString(),
        lifetimeCurrency: nextLifetime.toString(),
        currencyPerSec: currentCps.toString(),
        generators: updatedGenerators,
        activeFrenzy,
        stats: {
          ...state.stats,
          highestCps: Decimal.max(toDecimal(state.stats.highestCps), currentCps).toString(),
        },
      };
    }, TICK_RATE_MS);

    return () => clearInterval(intervalId);
  }, [calculateTotalCps]);

  // 10Hz Decoupled React State Synchronizer
  useEffect(() => {
    const syncInterval = setInterval(() => {
      setGameState({ ...simRef.current });
    }, UI_SYNC_RATE_MS);
    return () => clearInterval(syncInterval);
  }, []);

  // Periodic Auto-Save to LocalStorage and Server Sync every 10 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(simRef.current));
      } catch (e) {
        console.error('LocalStorage write failed', e);
      }
      syncWithServer(false);
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [syncWithServer]);

  // Periodic Random Orbital Anomaly Spawner (every 35-50s)
  useEffect(() => {
    const anomalyInterval = setInterval(() => {
      setActiveAnomalies((prev) => {
        if (prev.length >= 2) return prev; // max 2 anomalies at a time

        const types: AnomalyCollectible['type'][] = ['QUANTUM_RIFT', 'SOLAR_FLARE', 'VOID_SHARD', 'TACHYON_BURST'];
        const type = types[Math.floor(Math.random() * types.length)];

        const colors = {
          QUANTUM_RIFT: '#06B6D4',
          SOLAR_FLARE: '#F59E0B',
          VOID_SHARD: '#A855F7',
          TACHYON_BURST: '#EF4444',
        };

        const names = {
          QUANTUM_RIFT: 'Quantum Rift',
          SOLAR_FLARE: 'Solar Hyper-Flare',
          VOID_SHARD: 'Antimatter Shard',
          TACHYON_BURST: 'Tachyon Anomaly',
        };

        soundManager.playAnomalySpawn();

        const newAnomaly: AnomalyCollectible = {
          id: 'anomaly-' + Date.now(),
          type,
          name: names[type],
          x: 15 + Math.random() * 70, // % of canvas
          y: 20 + Math.random() * 60, // % of canvas
          targetX: 10 + Math.random() * 80,
          targetY: 15 + Math.random() * 70,
          size: 42,
          color: colors[type],
          bonusMultiplier: 7,
          durationSeconds: 15,
          progress: 0,
          spawnTime: Date.now(),
          lifetime: 14000, // 14 seconds to click before drifting away
        };

        return [...prev, newAnomaly];
      });
    }, 38000);

    return () => clearInterval(anomalyInterval);
  }, []);

  // Anomaly drift ticker
  useEffect(() => {
    const driftInterval = setInterval(() => {
      const now = Date.now();
      setActiveAnomalies((prev) =>
        prev
          .filter((a) => now - a.spawnTime < a.lifetime)
          .map((a) => {
            const age = now - a.spawnTime;
            const t = age / a.lifetime;
            return {
              ...a,
              progress: t,
              x: a.x + Math.sin(t * Math.PI * 4) * 0.4,
              y: a.y + Math.cos(t * Math.PI * 2) * 0.3,
            };
          })
      );
    }, 60);

    return () => clearInterval(driftInterval);
  }, []);

  // User Actions:

  // 1. Manual Core Tap
  const manualClick = useCallback(
    (e?: { clientX?: number; clientY?: number }) => {
      const now = Date.now();

      // Cadence telemetry tracking
      if (tapTimestampsRef.current.length > 0) {
        const last = tapTimestampsRef.current[tapTimestampsRef.current.length - 1];
        const delta = now - last;
        tapIntervalsRef.current.push(delta);
        if (tapIntervalsRef.current.length > 30) tapIntervalsRef.current.shift();
      }
      tapTimestampsRef.current.push(now);
      if (tapTimestampsRef.current.length > 30) tapTimestampsRef.current.shift();

      const state = simRef.current;

      // Critical Tap calculation (base 3% + perk_critical_core bonus)
      const critPerk = state.prestigePerks['perk_critical_core'];
      const critChance = 0.03 + (critPerk ? critPerk.level * critPerk.effectMultiplier : 0);
      const isCrit = Math.random() < critChance;

      const clickYield = calculateClickYield(state, isCrit);

      // Play audio feedback
      soundManager.playClick(state.stats.totalClicks, isCrit);

      const nextCur = toDecimal(state.currency).plus(clickYield);
      const nextLife = toDecimal(state.lifetimeCurrency).plus(clickYield);
      const nextManual = toDecimal(state.stats.totalManualEarned).plus(clickYield);

      const updatedState: IdleGameState = {
        ...state,
        currency: nextCur.toString(),
        lifetimeCurrency: nextLife.toString(),
        stats: {
          ...state.stats,
          totalClicks: state.stats.totalClicks + 1,
          totalManualEarned: nextManual.toString(),
        },
      };

      simRef.current = updatedState;
      setGameState(updatedState);

      return { yieldAmount: clickYield, isCrit };
    },
    [calculateClickYield]
  );

  // 2. Buy Generator (supports x1, x10, x100, MAX)
  const buyGenerator = useCallback((id: string, multiplier: BuyMultiplier) => {
    const state = simRef.current;
    const gen = state.generators[id];
    if (!gen || !gen.unlocked) return;

    let countToBuy = 0;
    let cost = new Decimal(0);

    if (multiplier === 'MAX') {
      const maxRes = calculateMaxAffordableGenerators(gen.baseCost, gen.costExponent, gen.owned, state.currency);
      countToBuy = maxRes.maxCount;
      cost = maxRes.totalCost;
    } else {
      countToBuy = multiplier;
      cost = calculateBulkGeneratorCost(gen.baseCost, gen.costExponent, gen.owned, countToBuy);
    }

    if (countToBuy <= 0 || toDecimal(state.currency).lt(cost)) {
      return;
    }

    soundManager.playBuy();

    const newCurrency = toDecimal(state.currency).minus(cost);
    const newOwned = gen.owned + countToBuy;

    const updatedGen: GeneratorConfig = {
      ...gen,
      owned: newOwned,
    };

    const nextGenerators = {
      ...state.generators,
      [id]: updatedGen,
    };

    const tempState = { ...state, currency: newCurrency.toString(), generators: nextGenerators };
    const newCps = calculateTotalCps(tempState);

    const updatedState: IdleGameState = {
      ...tempState,
      currencyPerSec: newCps.toString(),
      stats: {
        ...state.stats,
        highestCps: Decimal.max(toDecimal(state.stats.highestCps), newCps).toString(),
      },
    };

    simRef.current = updatedState;
    setGameState(updatedState);
  }, [calculateTotalCps]);

  // 3. Buy Tech Upgrade
  const buyUpgrade = useCallback((id: string) => {
    const state = simRef.current;
    const upg = state.upgrades[id];
    if (!upg || upg.isPurchased) return;

    const cost = toDecimal(upg.cost);
    if (toDecimal(state.currency).lt(cost)) return;

    soundManager.playMilestone();

    const newCurrency = toDecimal(state.currency).minus(cost);
    const nextUpgrades = {
      ...state.upgrades,
      [id]: { ...upg, isPurchased: true },
    };

    const tempState = { ...state, currency: newCurrency.toString(), upgrades: nextUpgrades };
    const newCps = calculateTotalCps(tempState);

    const updatedState: IdleGameState = {
      ...tempState,
      currencyPerSec: newCps.toString(),
      stats: {
        ...state.stats,
        highestCps: Decimal.max(toDecimal(state.stats.highestCps), newCps).toString(),
      },
    };

    simRef.current = updatedState;
    setGameState(updatedState);
  }, [calculateTotalCps]);

  // 4. Upgrade Prestige Constellation Perk
  const upgradePrestigePerk = useCallback((perkId: string) => {
    const state = simRef.current;
    const perk = state.prestigePerks[perkId];
    if (!perk || perk.level >= perk.maxLevel) return;

    if (state.prestigeCurrency < perk.shardCost) return;

    soundManager.playMilestone();

    const updatedPerks = {
      ...state.prestigePerks,
      [perkId]: { ...perk, level: perk.level + 1 },
    };

    const tempState: IdleGameState = {
      ...state,
      prestigeCurrency: state.prestigeCurrency - perk.shardCost,
      prestigePerks: updatedPerks,
    };

    const newCps = calculateTotalCps(tempState);
    const updatedState: IdleGameState = {
      ...tempState,
      currencyPerSec: newCps.toString(),
    };

    simRef.current = updatedState;
    setGameState(updatedState);
  }, [calculateTotalCps]);

  // 5. Singularity Collapse (Prestige Reset)
  const collapseSingularity = useCallback(async () => {
    const state = simRef.current;
    const lifetimeDec = toDecimal(state.lifetimeCurrency);

    // Calculate shards (e.g. starting at 100 Billion, scaling exponentially)
    const threshold = new Decimal('1e11');
    if (lifetimeDec.lt(threshold)) return { success: false, reason: 'Threshold not met' };

    const ratio = lifetimeDec.div(threshold);
    const shardsDec = ratio.pow(0.22).times(5).floor();
    const shardsEarned = Math.max(1, shardsDec.toNumber());

    soundManager.playPrestigeAscension();

    // Verify and log prestige with backend
    try {
      await fetch('/api/idle/prestige', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: state.playerId,
          handle: state.playerHandle,
          lifetimeCurrency: state.lifetimeCurrency,
          generators: Object.fromEntries(
            Object.entries(state.generators).map(([k, v]) => [k, v.owned])
          ),
          upgrades: Object.values(state.upgrades)
            .filter((u) => u.isPurchased)
            .map((u) => u.id),
        }),
      });
    } catch {
      // Offline fallback allowed
    }

    // Reset run currency, generators, and upgrades while keeping shards and prestige perks
    const resetGenerators = { ...INITIAL_GENERATORS };
    const resetUpgrades = { ...INITIAL_UPGRADES };

    const resetState: IdleGameState = {
      ...state,
      currency: '0',
      currencyPerSec: '0',
      prestigeCurrency: state.prestigeCurrency + shardsEarned,
      generators: resetGenerators,
      upgrades: resetUpgrades,
      activeFrenzy: null,
      stats: {
        ...state.stats,
        totalPrestigeCount: state.stats.totalPrestigeCount + 1,
      },
    };

    const newCps = calculateTotalCps(resetState);
    resetState.currencyPerSec = newCps.toString();

    simRef.current = resetState;
    setGameState(resetState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetState));

    return { success: true, shardsEarned, totalShards: resetState.prestigeCurrency };
  }, [calculateTotalCps]);

  // 6. Catch Floating Anomaly Collectible
  const catchAnomaly = useCallback((anomalyId: string) => {
    const anomaly = activeAnomalies.find((a) => a.id === anomalyId);
    if (!anomaly) return;

    soundManager.playFrenzyWarp();

    // Remove from active anomalies
    setActiveAnomalies((prev) => prev.filter((a) => a.id !== anomalyId));

    // Award bonus currency: 30 seconds worth of current CPS + 500 flat
    const state = simRef.current;
    const cps = toDecimal(state.currencyPerSec);
    const bonusLoot = cps.times(30).plus(500);

    // Extra duration from perk_anomaly_magnet
    const magnetPerk = state.prestigePerks['perk_anomaly_magnet'];
    const extraDuration = magnetPerk ? magnetPerk.level * 5 : 0;
    const duration = (anomaly.durationSeconds + extraDuration) * 1000;

    const nextCur = toDecimal(state.currency).plus(bonusLoot);
    const nextLife = toDecimal(state.lifetimeCurrency).plus(bonusLoot);

    const updatedState: IdleGameState = {
      ...state,
      currency: nextCur.toString(),
      lifetimeCurrency: nextLife.toString(),
      activeFrenzy: {
        multiplier: anomaly.bonusMultiplier,
        expiresAt: Date.now() + duration,
        durationTotal: duration,
        label: `${anomaly.name} [${anomaly.bonusMultiplier}x OVERDRIVE]`,
      },
      stats: {
        ...state.stats,
        totalAnomaliesCaught: state.stats.totalAnomaliesCaught + 1,
      },
    };

    const newCps = calculateTotalCps(updatedState);
    updatedState.currencyPerSec = newCps.toString();

    simRef.current = updatedState;
    setGameState(updatedState);
  }, [activeAnomalies, calculateTotalCps]);

  // 7. Update Settings
  const updateSettings = useCallback((newSettings: Partial<IdleGameState['settings']>) => {
    setGameState((prev) => {
      const merged = { ...prev.settings, ...newSettings };
      if (typeof newSettings.soundEnabled === 'boolean') {
        soundManager.setMuted(!newSettings.soundEnabled);
      }
      const updated = { ...prev, settings: merged };
      simRef.current = updated;
      return updated;
    });
  }, []);

  // 8. Update Player Handle
  const updatePlayerHandle = useCallback(async (newHandle: string) => {
    const clean = newHandle.trim().slice(0, 24) || 'Pilot';
    setGameState((prev) => {
      const updated = { ...prev, playerHandle: clean };
      simRef.current = updated;
      return updated;
    });

    try {
      await fetch('/api/idle/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: simRef.current.playerId,
          handle: clean,
          lifetimeCurrency: simRef.current.lifetimeCurrency,
          prestigeShards: simRef.current.prestigeCurrency,
          highestCps: simRef.current.stats.highestCps,
        }),
      });
    } catch {
      // offline fallback
    }
  }, []);

  return {
    state: gameState,
    activeAnomalies,
    isSyncing,
    serverStatus,
    offlineGainModal,
    setOfflineGainModal,
    manualClick,
    buyGenerator,
    buyUpgrade,
    upgradePrestigePerk,
    collapseSingularity,
    catchAnomaly,
    updateSettings,
    updatePlayerHandle,
    syncWithServer,
  };
}
