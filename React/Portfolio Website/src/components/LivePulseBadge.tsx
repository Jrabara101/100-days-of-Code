import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Sparkles, ChevronDown } from 'lucide-react';
import { PersonalPulse } from '../types';

interface LivePulseBadgeProps {
  pulse: PersonalPulse;
  onOpenNowModal?: () => void;
}

export const LivePulseBadge: React.FC<LivePulseBadgeProps> = ({ pulse, onOpenNowModal }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: pulse.timezone || 'America/Los_Angeles',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now);
        setCurrentTime(formatted);
      } catch {
        setCurrentTime(new Date().toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [pulse.timezone]);

  const statusColor = 
    pulse.availability === 'available' ? 'bg-accent-emerald' :
    pulse.availability === 'limited' ? 'bg-accent-ochre' : 'bg-red-500';

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="group flex items-center space-x-2 px-3 py-1.5 rounded-full border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/80 dark:bg-surface-secondary-dark/80 hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark transition-all duration-200 text-xs font-mono tracking-tight"
        aria-label="View current availability and now status"
      >
        {/* Pulsing radar dot */}
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColor}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColor}`}></span>
        </span>

        <span className="font-medium text-primary-light dark:text-primary-dark">
          {pulse.availabilityLabel}
        </span>

        <ChevronDown className="w-3 h-3 text-muted-light dark:text-muted-dark group-hover:translate-y-0.5 transition-transform" />
      </button>

      {/* Flyout details */}
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)} 
          />
          <div className="absolute right-0 mt-2 w-72 p-4 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark shadow-xl z-50 animate-slide-up text-xs font-sans">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-subtle-light dark:border-border-subtle-dark font-mono text-[11px] text-muted-light dark:text-muted-dark">
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-3 h-3 text-accent-emerald" />
                <span>{pulse.location}</span>
              </span>
              <span className="flex items-center space-x-1 font-semibold text-primary-light dark:text-primary-dark">
                <Clock className="w-3 h-3 text-accent-indigo" />
                <span>{currentTime || 'Local Time'}</span>
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-mono text-muted-light dark:text-muted-dark font-semibold mb-1">
                  Availability Focus
                </p>
                <p className="text-primary-light dark:text-primary-dark leading-snug">
                  Booking client builds and strategic advisory for <span className="font-semibold text-accent-emerald">{pulse.availabilityQuarter}</span>.
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider font-mono text-muted-light dark:text-muted-dark font-semibold mb-1">
                  Currently Shipping
                </p>
                <p className="text-primary-light dark:text-primary-dark font-medium">
                  {pulse.currentlyShipping.title}
                </p>
                <p className="text-muted-light dark:text-muted-dark text-[11px] mt-0.5">
                  {pulse.currentlyShipping.description}
                </p>
              </div>

              {pulse.currentlyReading && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-mono text-muted-light dark:text-muted-dark font-semibold mb-1">
                    On the Reading Desk
                  </p>
                  <p className="italic text-primary-light dark:text-primary-dark">
                    "{pulse.currentlyReading.title}"
                  </p>
                  <p className="text-muted-light dark:text-muted-dark text-[11px]">
                    — {pulse.currentlyReading.author}
                  </p>
                </div>
              )}
            </div>

            {onOpenNowModal && (
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onOpenNowModal();
                }}
                className="mt-3 w-full py-1.5 text-center text-accent-indigo hover:text-indigo-400 font-mono text-[11px] font-medium border-t border-border-subtle-light dark:border-border-subtle-dark pt-2.5 block"
              >
                Open Full "Now" Manifest →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
