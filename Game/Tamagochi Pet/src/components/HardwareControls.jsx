import React from 'react';

export function HardwareControls({ mode, onButtonA, onButtonB, onButtonC }) {
  const isMiniGame = mode === 'MINI_GAME';

  return (
    <div class="w-full mt-8 flex justify-between px-2 h-32 relative">
      {/* Speaker Grill */}
      <div class="absolute bottom-0 right-4 flex gap-1 -rotate-45 opacity-60 pointer-events-none">
        <div class="w-1 h-8 rounded-full bg-surface-container-highest shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]"></div>
        <div class="w-1 h-8 rounded-full bg-surface-container-highest shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]"></div>
        <div class="w-1 h-8 rounded-full bg-surface-container-highest shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]"></div>
        <div class="w-1 h-8 rounded-full bg-surface-container-highest shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]"></div>
      </div>

      {/* Action Buttons */}
      <div class="flex flex-col gap-2 justify-end w-full pl-4 pb-4">
        <div class="flex justify-start gap-6">
          {/* Button A */}
          <div class="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={onButtonA}
              class="hw-button w-12 h-12 rounded-full bg-secondary-container border-b-4 border-secondary shadow-button-idle flex items-center justify-center cursor-pointer"
              id="btn-a"
              aria-label={isMiniGame ? 'Guess Left' : 'Select Menu'}
            >
              <div class="w-8 h-8 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4)] bg-secondary-container flex items-center justify-center font-bold text-xs text-on-secondary-container">
                A
              </div>
            </button>
            <span class="font-label-caps text-[10px] text-on-error font-bold tracking-widest drop-shadow-md">
              {isMiniGame ? 'LEFT' : 'A:SEL'}
            </span>
          </div>

          {/* Button B */}
          <div class="flex flex-col items-center gap-1 mt-4">
            <button
              type="button"
              onClick={onButtonB}
              class="hw-button w-12 h-12 rounded-full bg-secondary-container border-b-4 border-secondary shadow-button-idle flex items-center justify-center cursor-pointer"
              id="btn-b"
              aria-label={isMiniGame ? 'Guess Right' : 'Execute Action'}
            >
              <div class="w-8 h-8 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4)] bg-secondary-container flex items-center justify-center font-bold text-xs text-on-secondary-container">
                B
              </div>
            </button>
            <span class="font-label-caps text-[10px] text-on-error font-bold tracking-widest drop-shadow-md">
              {isMiniGame ? 'RIGHT' : 'B:EXE'}
            </span>
          </div>

          {/* Button C */}
          <div class="flex flex-col items-center gap-1 mt-8">
            <button
              type="button"
              onClick={onButtonC}
              class="hw-button w-10 h-10 rounded-full bg-surface-variant border-b-4 border-outline shadow-button-idle flex items-center justify-center cursor-pointer"
              id="btn-c"
              aria-label="Toggle Stats / Cancel"
            >
              <div class="w-6 h-6 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4)] bg-surface-variant flex items-center justify-center font-bold text-[10px] text-on-surface-variant">
                C
              </div>
            </button>
            <span class="font-label-caps text-[10px] text-on-error font-bold tracking-widest drop-shadow-md">
              {isMiniGame ? '---' : 'C:STAT'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
