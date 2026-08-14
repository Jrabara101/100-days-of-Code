import React, { useState, useEffect } from 'react';
import { MENUS } from '../hooks/useTamagotchiEngine';

export function LcdScreen({
  stage,
  mode,
  hunger,
  happiness,
  energy,
  health,
  discipline,
  isSleeping,
  isCallingForAttention,
  poopCount,
  showStats,
  menuIndex,
  miniGame
}) {
  const [bobOffset, setBobOffset] = useState(0);

  // Bobbing animation loop for active pet
  useEffect(() => {
    if (isSleeping || stage === 'DECEASED' || mode === 'MINI_GAME') {
      setBobOffset(0);
      return;
    }

    let animationFrameId;
    const animate = () => {
      const bob = Math.sin(Date.now() / 200) * 2;
      setBobOffset(bob);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isSleeping, stage, mode]);

  // Meter segments calculation (4 total segments for quick view)
  const hSegs = Math.ceil((hunger / 100) * 4);
  const mSegs = Math.ceil((happiness / 100) * 4);

  return (
    <div class="w-full h-64 bg-surface-container-highest rounded-t-xl rounded-b-[40px] p-4 shadow-[inset_0_4px_15px_rgba(0,0,0,0.4)] flex flex-col relative border border-[#2a313b]">
      {/* Decorative Bezel Text */}
      <div class="absolute top-2 w-full text-center left-0 font-label-caps text-[8px] text-on-surface-variant tracking-widest opacity-50">
        DOT MATRIX WITH STEREO SOUND
      </div>

      {/* The LCD Screen Viewport */}
      <div class="w-full h-full mt-2 rounded lcd-screen overflow-hidden flex flex-col p-2 relative shadow-lcd-inset">
        
        {/* Top Header */}
        <div class="flex justify-between items-center w-full h-6 px-1 font-label-caps text-[10px] text-on-primary-container border-b border-on-primary-container/30">
          {mode === 'MINI_GAME' ? (
            <>
              <span class="font-bold text-amber-900">MINI-GAME</span>
              <span class="font-bold">
                R:{miniGame.round}/5 W:{miniGame.wins}
              </span>
            </>
          ) : (
            <>
              <span class="font-bold">{stage}</span>
              {isCallingForAttention ? (
                <span class="font-bold text-red-800 animate-pulse">🚨 ATTN!</span>
              ) : (
                <span class="opacity-75">OK</span>
              )}
            </>
          )}
        </div>

        {/* Main Play Area */}
        <div class="flex-grow flex items-center justify-center relative overflow-hidden">
          
          {/* STATS OVERLAY */}
          {showStats && mode === 'NORMAL' && (
            <div class="absolute inset-0 bg-[#8bac0f] z-20 p-2 font-label-caps text-[10px] text-[#2e3c00] flex flex-col justify-between border border-[#2e3c00]">
              <div class="font-bold border-b border-[#2e3c00] pb-1">PET DIAGNOSTICS</div>
              <div>HUNGER:     {hunger}%</div>
              <div>HAPPY:      {happiness}%</div>
              <div>DISCIPLINE: {discipline}%</div>
              <div>HEALTH:     {health}%</div>
              <div>ENERGY:     {energy}%</div>
            </div>
          )}

          {/* MINI-GAME MODE GRAPHICS */}
          {mode === 'MINI_GAME' ? (
            <div class="flex flex-col items-center justify-center w-full h-full relative">
              {/* Pet SVG with Left / Right turning */}
              <svg
                class="w-20 h-20 pixelated transition-transform duration-200"
                fill="#2e3c00"
                viewBox="0 0 16 16"
                style={{
                  transform:
                    miniGame.petDir === 'LEFT'
                      ? 'translateX(-24px)'
                      : miniGame.petDir === 'RIGHT'
                      ? 'translateX(24px)'
                      : 'translateX(0)'
                }}
              >
                <path d="M 6 2 h 4 v 2 h 2 v 2 h 2 v 4 h -2 v 2 h -2 v 2 h -4 v -2 h -2 v -2 h -2 v -4 h 2 v -2 h 2 v -2 z" />
                <rect fill="#8bac0f" height="2" width="2" x="5" y="6" />
                <rect fill="#8bac0f" height="2" width="2" x="9" y="6" />
              </svg>

              {/* Round Result Feedback */}
              {miniGame.lastResult ? (
                <div class="absolute bottom-1 font-headline-md text-xs font-bold text-on-primary-container bg-primary-container px-2 py-0.5 border border-on-primary-container">
                  {miniGame.lastResult === 'WIN' ? '🎉 WIN!' : '❌ MISS'}
                </div>
              ) : (
                <div class="absolute bottom-1 font-label-caps text-[10px] font-bold text-on-primary-container">
                  &lt;- A (LEFT) | B (RIGHT) -&gt;
                </div>
              )}
            </div>
          ) : (
            /* NORMAL MODE GRAPHICS */
            <div class="flex items-center justify-center w-full h-full relative">
              {stage === 'DECEASED' ? (
                /* Gravestone Sprite */
                <div class="flex flex-col items-center">
                  <svg class="w-16 h-16 pixelated" fill="#2e3c00" viewBox="0 0 16 16">
                    <path d="M 5 3 h 6 v 2 h 2 v 9 h -10 v -9 h 2 z" />
                    <rect fill="#8bac0f" height="5" width="2" x="7" y="6" />
                    <rect fill="#8bac0f" height="2" width="5" x="5.5" y="7.5" />
                  </svg>
                  <span class="font-label-caps text-[9px] text-on-primary-container mt-1">R.I.P.</span>
                </div>
              ) : (
                /* Active Pet Character */
                <svg
                  class="w-24 h-24 pixelated transition-transform duration-75"
                  fill="#2e3c00"
                  viewBox="0 0 16 16"
                  style={{
                    transform: isSleeping
                      ? 'scale(1, 0.8) translateY(10px)'
                      : `translateY(${bobOffset}px)`
                  }}
                >
                  {/* Base Blob */}
                  <path d="M 6 2 h 4 v 2 h 2 v 2 h 2 v 4 h -2 v 2 h -2 v 2 h -4 v -2 h -2 v -2 h -2 v -4 h 2 v -2 h 2 v -2 z" />
                  {/* Eyes */}
                  <rect fill="#8bac0f" height="2" width="2" x="5" y="6" />
                  <rect fill="#8bac0f" height="2" width="2" x="9" y="6" />
                </svg>
              )}

              {/* Sleep ZZZ FX */}
              {isSleeping && stage !== 'DECEASED' && (
                <div class="absolute top-2 right-4 font-headline-md text-on-primary-container animate-pulse">
                  zZ
                </div>
              )}

              {/* Poop Sprites */}
              {poopCount > 0 && stage !== 'DECEASED' && (
                <div class="absolute bottom-1 right-2 flex gap-1">
                  {Array.from({ length: poopCount }).map((_, idx) => (
                    <svg key={`poop-${idx}`} class="w-4 h-4 pixelated" fill="#2e3c00" viewBox="0 0 8 8">
                      <rect x="2" y="2" width="4" height="2" />
                      <rect x="1" y="4" width="6" height="3" />
                    </svg>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Menu Bar */}
        <div class="h-6 w-full flex justify-around items-end font-label-caps text-on-primary-container text-[10px] tracking-tight border-t border-on-primary-container/30 pt-1">
          {mode === 'MINI_GAME' ? (
            <span class="font-bold text-amber-900">A: LEFT | B: RIGHT</span>
          ) : (
            MENUS.map((menu, idx) => {
              const isSelected = idx === menuIndex;
              return (
                <span
                  key={menu.id}
                  class={isSelected ? 'bg-on-primary-container text-primary-container px-1 font-bold' : 'opacity-70'}
                >
                  {menu.label}
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* Power LED */}
      <div class="absolute left-2 top-1/2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_#ff0000] border border-[#8B0000]"></div>
      <div class="absolute left-1 top-1/2 mt-3 font-label-caps text-[6px] text-on-surface-variant">
        BATT
      </div>
    </div>
  );
}
