import { useEffect } from 'react';

export interface HotkeyActions {
  onSplit: () => void;
  onUndoSplit?: () => void;
  onSkipSplit?: () => void;
  onResetRun?: () => void;
}

export interface HotkeyConfig {
  splitKeys: string[];
  undoKeys: string[];
  skipKeys: string[];
  resetKeys: string[];
}

export const DEFAULT_HOTKEYS: HotkeyConfig = {
  splitKeys: ['Space', 'Numpad1', 'KeyZ'],
  undoKeys: ['Numpad8', 'KeyU', 'Backspace'],
  skipKeys: ['Numpad2', 'KeyS'],
  resetKeys: ['Numpad3', 'KeyR'],
};

export function useGlobalHotkeys(
  actions: HotkeyActions,
  enabled: boolean = true,
  config: HotkeyConfig = DEFAULT_HOTKEYS
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Prevent accidental key repeat when key is held down
      if (e.repeat) return;

      // 2. Handle input capture inside modal forms / inputs gracefully
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          (activeElement as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const code = e.code;

      if (config.splitKeys.includes(code)) {
        e.preventDefault();
        actions.onSplit();
      } else if (config.undoKeys.includes(code) && actions.onUndoSplit) {
        e.preventDefault();
        actions.onUndoSplit();
      } else if (config.skipKeys.includes(code) && actions.onSkipSplit) {
        e.preventDefault();
        actions.onSkipSplit();
      } else if (config.resetKeys.includes(code) && actions.onResetRun) {
        e.preventDefault();
        actions.onResetRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [actions, enabled, config]);
}
