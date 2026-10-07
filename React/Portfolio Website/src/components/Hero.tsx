import React, { useState, useEffect } from 'react';
import { ArrowDown, Sparkles, MapPin, Clock, Compass, Terminal, BookOpen, Layers } from 'lucide-react';
import { PersonalPulse } from '../types';

interface HeroProps {
  pulse: PersonalPulse;
  onExploreWork: () => void;
  onExploreEssays: () => void;
  onOpenContact: () => void;
  onOpenNowModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  pulse,
  onExploreWork,
  onExploreEssays,
  onOpenContact,
  onOpenNowModal,
}) => {
  const [localTime, setLocalTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      try {
        const str = new Intl.DateTimeFormat('en-US', {
          timeZone: pulse.timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(new Date());
        setLocalTime(str);
      } catch {
        setLocalTime(new Date().toLocaleTimeString());
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [pulse.timezone]);

  return (
    <section className="relative pt-16 sm:pt-24 pb-20 border-b border-border-subtle-light dark:border-border-subtle-dark bg-grid-pattern">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top Monospace Location & Pulse Bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-light dark:text-muted-dark mb-8">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-surface-secondary-light dark:bg-surface-secondary-dark border border-border-subtle-light dark:border-border-subtle-dark">
            <MapPin className="w-3 h-3 text-accent-emerald" />
            <span>Based in {pulse.location}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-surface-secondary-light dark:bg-surface-secondary-dark border border-border-subtle-light dark:border-border-subtle-dark font-medium text-primary-light dark:text-primary-dark">
            <Clock className="w-3 h-3 text-accent-indigo" />
            <span>{localTime || 'Local Time'} PST</span>
          </div>

          <button
            onClick={onOpenNowModal}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark text-accent-indigo border border-accent-indigo/20 transition-colors"
          >
            <Compass className="w-3 h-3" />
            <span>The "Now" Page →</span>
          </button>
        </div>

        {/* Two-Sentence Manifesto in Editorial Serif */}
        <div className="max-w-4xl mb-10">
          <h1 className="font-serif font-normal text-3xl sm:text-5xl lg:text-6xl text-primary-light dark:text-primary-dark leading-[1.15] tracking-tight">
            Architecting zero-latency local-first software, resilient design systems, and digital crafts with Swiss editorial discipline.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-light dark:text-muted-dark font-sans font-normal leading-relaxed max-w-2xl">
            Staff Design Technologist pairing mechanical engineering precision with typographic nuance. Operating as a living digital garden and high-context engineering advisory.
          </p>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 mb-14">
          <button
            onClick={onExploreWork}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-primary-light dark:bg-primary-dark text-white dark:text-zinc-900 font-mono text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <span>Explore Proof of Work</span>
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onExploreEssays}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/60 dark:bg-surface-secondary-dark/60 hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark text-primary-light dark:text-primary-dark font-mono text-xs transition-colors"
          >
            <span>Digital Garden Essays</span>
            <BookOpen className="w-3.5 h-3.5 text-accent-emerald" />
          </button>

          <button
            onClick={onOpenContact}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark hover:border-accent-indigo/50 text-muted-light dark:text-muted-dark hover:text-accent-indigo font-mono text-xs transition-colors ml-auto sm:ml-0"
          >
            <span>Initiate Inquiry</span>
            <span className="text-accent-indigo">→</span>
          </button>
        </div>

        {/* Live "Now" Pulse Card Preview */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-light dark:text-muted-dark font-semibold block">
              Current Shipping Focus
            </span>
            <p className="font-semibold text-primary-light dark:text-primary-dark truncate">
              {pulse.currentlyShipping.title}
            </p>
            <p className="text-[11px] text-muted-light dark:text-muted-dark font-sans line-clamp-2">
              {pulse.currentlyShipping.description}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-light dark:text-muted-dark font-semibold block">
              On the Desk
            </span>
            <p className="font-serif italic text-primary-light dark:text-primary-dark text-sm truncate">
              "{pulse.currentlyReading.title}"
            </p>
            <p className="text-[11px] text-muted-light dark:text-muted-dark">
              — {pulse.currentlyReading.author}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-light dark:text-muted-dark font-semibold block">
              Availability Pulse
            </span>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-emerald"></span>
              </span>
              <span className="font-semibold text-accent-emerald">
                {pulse.availabilityLabel}
              </span>
            </div>
            <p className="text-[11px] text-muted-light dark:text-muted-dark">
              Full-Stack & Systems advisory for {pulse.availabilityQuarter}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
