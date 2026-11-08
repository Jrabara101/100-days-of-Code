import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { sounds } from '../../services/audioEffects';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggle = () => {
    sounds.playClick();
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to Warm Study Paper (Light)' : 'Switch to Deep Focus Obsidian (Dark)'}
      className="p-2 rounded-lg border border-divider hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs text-muted font-medium"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
};

