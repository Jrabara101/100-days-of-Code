import { useState, useEffect, useRef, useCallback } from 'react';
import { SpaceShooterEngine } from '../engine/SpaceShooterEngine';
import { SpaceShooterState, ShipSpec } from '../types/game';
import { SectorConfig } from '../../server/waveDirector';

export function useSpaceShooterEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  initialShipId: 'interceptor' | 'dreadnought' | 'scout' = 'interceptor'
) {
  const engineRef = useRef<SpaceShooterEngine | null>(null);
  const [finalRunData, setFinalRunData] = useState<any | null>(null);

  const [gameState, setGameState] = useState<SpaceShooterState>({
    status: 'IDLE',
    sectorId: 'daily',
    sectorName: 'Daily Orbital Sector',
    score: 0,
    multiplier: 1.0,
    hull: 100,
    maxHull: 100,
    shield: 100,
    maxShield: 100,
    grazeMeter: 0,
    grazeStreak: 0,
    activeSynergies: ['plasma_repeater'],
    currentWave: 1,
    totalWaves: 10,
    threatLevel: 'NOMINAL',
    dashCooldown: 0,
    empReady: false,
    stats: {
      totalShots: 0,
      hitsLanded: 0,
      totalGrazes: 0,
      enemiesDestroyed: 0,
      asteroidsShattered: 0,
      durationMs: 0,
    },
    settings: {
      screenShake: true,
      autoFire: false,
      soundFxVolume: 0.8,
      masterVolume: 0.8,
      sensitivity: 1.0,
    },
  });

  // Initialize engine on canvas mount
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const engine = new SpaceShooterEngine(
      canvas,
      initialShipId,
      (newState) => {
        setGameState((prev) => ({
          ...prev,
          ...newState,
        }));
      },
      (finalStats) => {
        setFinalRunData(finalStats);
      }
    );

    engineRef.current = engine;

    // Handle responsive window resize
    const handleResize = () => {
      const container = canvas.parentElement;
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        engine.resize(width, height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.cleanup();
      engineRef.current = null;
    };
  }, [canvasRef]);

  const startRun = useCallback((sectorConfig: SectorConfig) => {
    if (engineRef.current) {
      setFinalRunData(null);
      engineRef.current.start(sectorConfig);
    }
  }, []);

  const togglePause = useCallback(() => {
    if (engineRef.current) {
      return engineRef.current.togglePause();
    }
    return false;
  }, []);

  const triggerDash = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerDash();
    }
  }, []);

  const triggerEMP = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerEMP();
    }
  }, []);

  const setShip = useCallback((shipId: 'interceptor' | 'dreadnought' | 'scout') => {
    if (engineRef.current) {
      engineRef.current.setShip(shipId);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<SpaceShooterState['settings']>) => {
    if (engineRef.current) {
      engineRef.current.settings = {
        ...engineRef.current.settings,
        ...newSettings,
      };
      setGameState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...newSettings,
        },
      }));
    }
  }, []);

  return {
    engine: engineRef.current,
    gameState,
    finalRunData,
    startRun,
    togglePause,
    triggerDash,
    triggerEMP,
    setShip,
    updateSettings,
    clearFinalRunData: () => setFinalRunData(null),
  };
}
