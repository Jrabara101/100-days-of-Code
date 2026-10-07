import React from 'react';
import { Sun, Moon, Lock, Sparkles } from 'lucide-react';
import { PersonalPulse } from '../types';
import { LivePulseBadge } from './LivePulseBadge';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  pulse: PersonalPulse;
  onOpenAdmin: () => void;
  onOpenNowModal: () => void;
  currentSection: string;
  onNavigate: (section: string) => void;
  isArticleOpen: boolean;
  onHomeClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  pulse,
  onOpenAdmin,
  onOpenNowModal,
  currentSection,
  onNavigate,
  isArticleOpen,
  onHomeClick,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle-light/80 dark:border-border-subtle-dark/80 bg-canvas-light/80 dark:bg-canvas-dark/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Personal Monogram Logo with hover rotation */}
        <button
          onClick={onHomeClick}
          className="group flex items-center space-x-2 text-left focus:outline-none"
          title="Return to flagship stage"
        >
          <div className="w-8 h-8 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark border border-border-subtle-light dark:border-border-subtle-dark shadow-sm flex items-center justify-center text-primary-light dark:text-primary-dark group-hover:rotate-180 transition-transform duration-500">
            <span className="text-sm font-serif">✦</span>
          </div>
          <div className="hidden sm:block">
            <span className="block font-mono text-xs font-semibold tracking-wider text-primary-light dark:text-primary-dark uppercase">
              Julian Vance
            </span>
            <span className="block font-mono text-[10px] text-muted-light dark:text-muted-dark tracking-tight">
              Atelier & Systems
            </span>
          </div>
        </button>

        {/* Center: Minimalist Segmented Nav Pill */}
        <nav className="flex items-center p-1 rounded-full border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/70 dark:bg-surface-secondary-dark/70 text-xs font-mono">
          {[
            { id: 'work', label: 'Work' },
            { id: 'essays', label: 'Essays' },
            { id: 'now', label: 'Now' },
            { id: 'contact', label: 'Contact' },
          ].map((item) => {
            const isActive = !isArticleOpen && currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'now') {
                    onOpenNowModal();
                  } else {
                    onNavigate(item.id);
                  }
                }}
                className={`px-3 sm:px-3.5 py-1 rounded-full transition-all duration-150 ${
                  isActive
                    ? 'bg-surface-elevated-light dark:bg-surface-elevated-dark text-primary-light dark:text-primary-dark font-medium shadow-sm border border-border-subtle-light dark:border-border-subtle-dark'
                    : 'text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Availability Badge + Dark/Light tactile toggle + Admin lock */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden md:block">
            <LivePulseBadge pulse={pulse} onOpenNowModal={onOpenNowModal} />
          </div>

          {/* Theme tactile toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-full border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/70 dark:bg-surface-secondary-dark/70 hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            title={darkMode ? 'Switch to Warm Linen Light' : 'Switch to Obsidian Slate Dark'}
            aria-label="Toggle theme mode"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-700" />}
          </button>

          {/* Admin Studio trigger */}
          <button
            onClick={onOpenAdmin}
            className="p-2 rounded-full border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/70 dark:bg-surface-secondary-dark/70 hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark text-muted-light dark:text-muted-dark hover:text-accent-indigo transition-colors"
            title="Open Editorial Studio & Lead CRM"
            aria-label="Open Studio Cockpit"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
