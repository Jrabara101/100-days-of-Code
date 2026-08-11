import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { MahjongEngine } from './engine/MahjongEngine';
import { BackgroundShader } from './components/BackgroundShader';
import { MahjongCanvas } from './components/MahjongCanvas';
import { HeaderHUD } from './components/HeaderHUD';
import { MetricsHUD } from './components/MetricsHUD';
import { ControlsHUD } from './components/ControlsHUD';
import { VictoryModal } from './components/VictoryModal';
import { StalemateModal } from './components/StalemateModal';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
    const [engine] = useState(() => new MahjongEngine());
    const [tilesRemaining, setTilesRemaining] = useState(0);
    const [totalTiles, setTotalTiles] = useState(0);
    const [availableMoves, setAvailableMoves] = useState(0);
    const [score, setScore] = useState(0);
    const [timeSeconds, setTimeSeconds] = useState(0);
    const [gameStatus, setGameStatus] = useState('PLAYING');
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const timerIntervalRef = useRef(null);

    // Sync state from engine
    const syncGameState = useCallback(() => {
        const activeTiles = Array.from(engine.tilesMap.values()).filter(t => t.active);
        const remaining = activeTiles.length;
        setTilesRemaining(remaining);

        const pairs = engine.getSelectablePairs();
        setAvailableMoves(pairs.length);

        if (remaining === 0 && totalTiles > 0) {
            setGameStatus('VICTORY');
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        } else if (pairs.length === 0 && remaining > 0) {
            setGameStatus('STALEMATE');
        } else {
            setGameStatus('PLAYING');
        }
    }, [engine, totalTiles]);

    // Initial setup
    useEffect(() => {
        engine.buildTurtleLayout();
        const initCount = Array.from(engine.tilesMap.values()).length;
        setTotalTiles(initCount);
        setRefreshTrigger(prev => prev + 1);

        timerIntervalRef.current = setInterval(() => {
            setTimeSeconds(prev => prev + 1);
        }, 1000);

        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [engine]);

    // HUD Actions
    const handleUndo = () => {
        if (engine.historyStack.length === 0) return;
        const [keyA, keyB] = engine.historyStack.pop();

        const tileA = engine.tilesMap.get(keyA);
        const tileB = engine.tilesMap.get(keyB);

        if (tileA && tileB) {
            tileA.active = true;
            tileB.active = true;
            setScore(prev => Math.max(0, prev - 100));
            setRefreshTrigger(prev => prev + 1);
        }
    };

    const handleHint = () => {
        const pairs = engine.getSelectablePairs();
        if (pairs.length === 0) return;

        const [pairA, pairB] = pairs[0];
        engine.hintedTiles = [pairA, pairB];

        [pairA, pairB].forEach(tile => {
            if (tile.mesh) {
                gsap.to(tile.mesh.position, { z: tile.z * 0.42 + 0.25, duration: 0.2, yoyo: true, repeat: 5 });
                tile.mesh.material[4].emissive = new THREE.Color(0xfacc15); // Neon Yellow
                tile.mesh.material[4].emissiveIntensity = 0.8;
            }
        });
    };

    const handleShuffle = () => {
        engine.shuffleActiveTiles();
        setRefreshTrigger(prev => prev + 1);
    };

    const handleRestart = () => {
        setTimeSeconds(0);
        setScore(0);
        engine.buildTurtleLayout();
        setTotalTiles(Array.from(engine.tilesMap.values()).length);
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#0d141d] text-[#dce3f0] select-none">
            {/* Layer 0: Technical WebGL Background */}
            <BackgroundShader />

            <div className="absolute inset-0 bg-[#0d141d]/50 z-0 pointer-events-none" />

            {/* Layer 1: 3D Scene Viewport */}
            <MahjongCanvas
                engine={engine}
                syncGameState={syncGameState}
                refreshTrigger={refreshTrigger}
            />

            {/* Layer 2: HUD UI Overlays */}
            <HeaderHUD
                score={score}
                onOpenSettings={() => setShowSettingsModal(true)}
                onOpenHelp={() => setShowHelpModal(true)}
            />

            <MetricsHUD
                timeSeconds={timeSeconds}
                tilesRemaining={tilesRemaining}
                totalTiles={totalTiles}
                availableMoves={availableMoves}
            />

            <ControlsHUD
                onUndo={handleUndo}
                onHint={handleHint}
                onShuffle={handleShuffle}
                onRestart={handleRestart}
                canUndo={engine.historyStack.length > 0}
                canHint={availableMoves > 0}
            />

            {gameStatus === 'VICTORY' && (
                <VictoryModal
                    timeSeconds={timeSeconds}
                    score={score}
                    onRestart={handleRestart}
                />
            )}

            {gameStatus === 'STALEMATE' && (
                <StalemateModal
                    onShuffle={handleShuffle}
                />
            )}

            {showHelpModal && (
                <HelpModal onClose={() => setShowHelpModal(false)} />
            )}

            {showSettingsModal && (
                <SettingsModal onClose={() => setShowSettingsModal(false)} />
            )}
        </div>
    );
}
