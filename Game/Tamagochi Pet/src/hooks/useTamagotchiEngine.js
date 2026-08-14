import { useState, useEffect, useCallback, useRef } from 'react';

export const MENUS = [
  { id: 'GAME', label: '🎮 GAME' },
  { id: 'FEED', label: '🍎 FEED' },
  { id: 'CLEAN', label: '🧹 CLEAN' },
  { id: 'SCOLD', label: '🗣️ SCOLD' },
  { id: 'SLEEP', label: '🌙 SLEEP' }
];

export function useTamagotchiEngine() {
  const [stage, setStage] = useState('BABY'); // 'BABY', 'CHILD', 'ADULT', 'DECEASED'
  const [mode, setMode] = useState('NORMAL'); // 'NORMAL', 'MINI_GAME'
  
  const [hunger, setHunger] = useState(70);
  const [happiness, setHappiness] = useState(60);
  const [energy, setEnergy] = useState(90);
  const [health, setHealth] = useState(100);
  const [discipline, setDiscipline] = useState(30);

  const [isSleeping, setIsSleeping] = useState(false);
  const [isCallingForAttention, setIsCallingForAttention] = useState(false);
  const [isMisbehaving, setIsMisbehaving] = useState(false);
  const [poopCount, setPoopCount] = useState(0);

  const [showStats, setShowStats] = useState(false);
  const [menuIndex, setMenuIndex] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [tickRate] = useState('60Hz');

  // Mini-Game State
  const [miniGame, setMiniGame] = useState({
    round: 0,
    maxRounds: 5,
    wins: 0,
    petDir: null, // 'LEFT' | 'RIGHT'
    lastResult: null // 'WIN' | 'LOSE'
  });

  // Use refs to access latest state inside intervals/timeouts cleanly
  const stateRef = useRef({
    stage,
    mode,
    hunger,
    happiness,
    energy,
    health,
    discipline,
    isSleeping,
    isCallingForAttention,
    isMisbehaving,
    poopCount,
    miniGame
  });

  useEffect(() => {
    stateRef.current = {
      stage,
      mode,
      hunger,
      happiness,
      energy,
      health,
      discipline,
      isSleeping,
      isCallingForAttention,
      isMisbehaving,
      poopCount,
      miniGame
    };
  }, [
    stage,
    mode,
    hunger,
    happiness,
    energy,
    health,
    discipline,
    isSleeping,
    isCallingForAttention,
    isMisbehaving,
    poopCount,
    miniGame
  ]);

  // Master Simulation Tick Loop (1 second dt)
  useEffect(() => {
    const timer = setInterval(() => {
      const current = stateRef.current;
      if (current.stage === 'DECEASED') return;

      const sleepMod = current.isSleeping ? 0.2 : 1.0;

      // 1. Metabolic Stat Decay
      setHunger(prev => Math.max(0, prev - (1.2 * sleepMod)));
      setHappiness(prev => Math.max(0, prev - (1.0 + current.poopCount * 0.4)));

      if (current.isSleeping) {
        setEnergy(prev => Math.min(100, prev + 5.0));
      } else {
        setEnergy(prev => Math.max(0, prev - 0.6));
      }

      // 2. Probabilistic Misbehavior Evaluator
      if (!current.isSleeping && !current.isCallingForAttention && current.mode === 'NORMAL') {
        if (current.hunger > 50 && current.happiness > 50) {
          const misbehaveChance = 0.02 * (1.0 - current.discipline / 100.0);
          if (Math.random() < misbehaveChance) {
            setIsCallingForAttention(true);
            setIsMisbehaving(true);
          }
        }
      }

      // Genuine Calls for Attention
      if (current.hunger < 20 || current.happiness < 20) {
        setIsCallingForAttention(true);
        setIsMisbehaving(false);
      }

      // 3. Poop Generation
      if (!current.isSleeping && Math.random() < 0.006 && current.poopCount < 3) {
        setPoopCount(prev => prev + 1);
      }

      // 4. Health & Mortality Evaluation
      let shouldDecayHealth = false;
      if (current.hunger === 0 || current.happiness === 0 || current.poopCount >= 2) {
        shouldDecayHealth = true;
        setHealth(prev => {
          const nextHealth = Math.max(0, prev - 2.0);
          if (nextHealth <= 0) {
            setStage('DECEASED');
            setMode('NORMAL');
          }
          return nextHealth;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Independent Uptime Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // --- Care & Action Sub-routines ---

  // Scolding Subroutine
  const scold = useCallback(() => {
    const current = stateRef.current;
    if (current.stage === 'DECEASED' || current.mode !== 'NORMAL') return;

    if (current.isCallingForAttention && current.isMisbehaving) {
      // Justified Scolding
      setDiscipline(prev => Math.min(100, prev + 20));
      setIsCallingForAttention(false);
      setIsMisbehaving(false);
    } else {
      // Unjustified Scolding
      setHappiness(prev => Math.max(0, prev - 15));
      setDiscipline(prev => Math.max(0, prev - 5));
    }
  }, []);

  // Feed Subroutine
  const feed = useCallback(() => {
    const current = stateRef.current;
    if (current.stage === 'DECEASED' || current.isSleeping || current.mode !== 'NORMAL') return;

    setHunger(prev => Math.min(100, prev + 30));
    if (current.isCallingForAttention && !current.isMisbehaving) {
      setIsCallingForAttention(false);
    }
  }, []);

  // Clean Subroutine
  const clean = useCallback(() => {
    const current = stateRef.current;
    if (current.stage === 'DECEASED' || current.mode !== 'NORMAL') return;
    setPoopCount(0);
  }, []);

  // Toggle Sleep Subroutine
  const toggleSleep = useCallback(() => {
    const current = stateRef.current;
    if (current.stage === 'DECEASED' || current.mode !== 'NORMAL') return;
    setIsSleeping(prev => !prev);
  }, []);

  // Mini-Game Sub-FSM (Left/Right Guessing)
  const startMiniGame = useCallback(() => {
    const current = stateRef.current;
    if (current.stage === 'DECEASED' || current.isSleeping || current.energy < 10) return false;

    setMode('MINI_GAME');
    setMiniGame({
      round: 1,
      maxRounds: 5,
      wins: 0,
      petDir: null,
      lastResult: null
    });
    return true;
  }, []);

  const guessDirection = useCallback((guessDir) => {
    const current = stateRef.current;
    if (current.mode !== 'MINI_GAME') return;

    const petDir = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';
    const isWin = guessDir === petDir;

    setMiniGame(prev => ({
      ...prev,
      petDir,
      lastResult: isWin ? 'WIN' : 'LOSE',
      wins: isWin ? prev.wins + 1 : prev.wins
    }));

    // Advance Round after 800ms resolution phase
    setTimeout(() => {
      setMiniGame(prev => {
        if (prev.round < prev.maxRounds) {
          return {
            ...prev,
            round: prev.round + 1,
            petDir: null,
            lastResult: null
          };
        } else {
          // Complete Session & Reward
          setHappiness(h => Math.min(100, h + prev.wins * 8));
          setEnergy(e => Math.max(0, e - 5));
          setMode('NORMAL');
          return prev;
        }
      });
    }, 800);
  }, []);

  // Hardware Controls Triggers
  const handleButtonA = useCallback(() => {
    if (mode === 'MINI_GAME') {
      guessDirection('LEFT');
      return;
    }
    if (showStats) {
      setShowStats(false);
      return;
    }
    setMenuIndex(prev => (prev + 1) % MENUS.length);
  }, [mode, showStats, guessDirection]);

  const handleButtonB = useCallback(() => {
    if (mode === 'MINI_GAME') {
      guessDirection('RIGHT');
      return;
    }
    if (showStats) return;

    const action = MENUS[menuIndex].id;
    if (action === 'GAME') startMiniGame();
    if (action === 'FEED') feed();
    if (action === 'CLEAN') clean();
    if (action === 'SCOLD') scold();
    if (action === 'SLEEP') toggleSleep();
  }, [mode, showStats, menuIndex, guessDirection, startMiniGame, feed, clean, scold, toggleSleep]);

  const handleButtonC = useCallback(() => {
    if (mode === 'MINI_GAME') return;
    setShowStats(prev => !prev);
  }, [mode]);

  const formattedUptime = () => {
    const mins = Math.floor(uptime / 60).toString().padStart(2, '0');
    const secs = (uptime % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return {
    stage,
    mode,
    hunger: Math.round(hunger),
    happiness: Math.round(happiness),
    energy: Math.round(energy),
    health: Math.round(health),
    discipline: Math.round(discipline),
    isSleeping,
    isCallingForAttention,
    isMisbehaving,
    poopCount,
    showStats,
    menuIndex,
    miniGame,
    uptime: formattedUptime(),
    tickRate,
    handleButtonA,
    handleButtonB,
    handleButtonC
  };
}
