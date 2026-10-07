import React from 'react';
import { X, MapPin, Clock, BookOpen, Terminal, Sparkles, Cpu, CheckCircle } from 'lucide-react';
import { PersonalPulse } from '../types';

interface NowModalProps {
  isOpen: boolean;
  onClose: () => void;
  pulse: PersonalPulse;
}

export const NowModal: React.FC<NowModalProps> = ({ isOpen, onClose, pulse }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-4 sm:p-6 animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-surface-elevated-light dark:bg-surface-elevated-dark border border-border-subtle-light dark:border-border-subtle-dark rounded-2xl shadow-2xl p-6 sm:p-8 my-auto z-10 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle-light dark:border-border-subtle-dark">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-emerald"></span>
            </span>
            <h3 className="font-mono text-sm font-semibold text-primary-light dark:text-primary-dark">
              What I'm Doing "Now" (Derek Sivers Inspired)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-mono text-muted-light dark:text-muted-dark">
          Last updated: October 2026 • Based in {pulse.location} ({pulse.timeOffset})
        </p>

        <div className="space-y-5 text-sm font-sans text-primary-light dark:text-primary-dark leading-relaxed">
          {/* Shipping */}
          <div className="p-4 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 space-y-1.5">
            <h4 className="font-mono text-xs uppercase tracking-wider text-accent-indigo font-semibold flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Currently Shipping</span>
            </h4>
            <p className="font-semibold">{pulse.currentlyShipping.title}</p>
            <p className="text-muted-light dark:text-muted-dark text-xs">
              {pulse.currentlyShipping.description}
            </p>
          </div>

          {/* Reading */}
          <div className="p-4 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 space-y-1.5">
            <h4 className="font-mono text-xs uppercase tracking-wider text-amber-500 font-semibold flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>On the Nightstand & Reading Desk</span>
            </h4>
            <p className="font-serif italic text-base">"{pulse.currentlyReading.title}"</p>
            <p className="text-muted-light dark:text-muted-dark text-xs">
              By {pulse.currentlyReading.author}
            </p>
          </div>

          {/* Research & Obsession */}
          <div className="p-4 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 space-y-1.5">
            <h4 className="font-mono text-xs uppercase tracking-wider text-accent-emerald font-semibold flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>Current Technical Obsession</span>
            </h4>
            <p className="text-xs font-mono">{pulse.currentObsession}</p>
          </div>

          {/* Availability */}
          <div className="p-4 rounded-xl border border-accent-emerald/30 bg-accent-emerald/5 space-y-1.5">
            <h4 className="font-mono text-xs uppercase tracking-wider text-accent-emerald font-semibold">
              Project Availability: {pulse.availabilityQuarter}
            </h4>
            <p className="text-xs">
              Taking on 1 high-impact engineering engagement or advisory role for {pulse.availabilityQuarter}. If you are solving hard distributed systems, canvas, or design systems challenges, let's talk.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary-light dark:bg-primary-dark text-white dark:text-zinc-900 text-xs font-mono font-semibold"
          >
            Close "Now" Manifest
          </button>
        </div>
      </div>
    </div>
  );
};
