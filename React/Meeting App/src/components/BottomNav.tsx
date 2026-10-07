import React from 'react';

export type HostTab = 'events' | 'availability' | 'bookings' | 'polls' | 'sync';
export type GuestTab = 'booking' | 'timezone' | 'apk' | 'my-bookings';

interface BottomNavProps {
  activeMode: 'guest' | 'host';
  activeHostTab: HostTab;
  onSelectHostTab: (tab: HostTab) => void;
  activeGuestTab: GuestTab;
  onSelectGuestTab: (tab: GuestTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeMode,
  activeHostTab,
  onSelectHostTab,
  activeGuestTab,
  onSelectGuestTab,
}) => {
  if (activeMode === 'guest') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-30 pb-safe bg-surface/90 backdrop-blur-xl border-t border-border-divider shadow-[0_-4px_16px_rgba(0,0,0,0.03)] sm:hidden">
        <div className="flex items-center justify-around h-14 px-2">
          <button
            onClick={() => onSelectGuestTab('booking')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
              activeGuestTab === 'booking' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${activeGuestTab === 'booking' ? 'material-symbols-filled' : ''}`}>
              calendar_today
            </span>
            <span className="text-[10px] font-semibold mt-0.5">Book Slot</span>
          </button>

          <button
            onClick={() => onSelectGuestTab('timezone')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
              activeGuestTab === 'timezone' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              public
            </span>
            <span className="text-[10px] font-semibold mt-0.5">Timezone</span>
          </button>

          <button
            onClick={() => onSelectGuestTab('my-bookings')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
              activeGuestTab === 'my-bookings' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              event_available
            </span>
            <span className="text-[10px] font-semibold mt-0.5">My Calls</span>
          </button>

          <button
            onClick={() => onSelectGuestTab('apk')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
              activeGuestTab === 'apk' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] text-secondary">
              android
            </span>
            <span className="text-[10px] font-semibold mt-0.5">Get APK</span>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pb-safe bg-surface/90 backdrop-blur-xl border-t border-border-divider shadow-[0_-4px_16px_rgba(0,0,0,0.03)] sm:hidden">
      <div className="flex items-center justify-around h-14 px-2">
        <button
          onClick={() => onSelectHostTab('events')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
            activeHostTab === 'events' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${activeHostTab === 'events' ? 'material-symbols-filled' : ''}`}>
            dashboard
          </span>
          <span className="text-[10px] font-semibold mt-0.5">Events</span>
        </button>

        <button
          onClick={() => onSelectHostTab('availability')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
            activeHostTab === 'availability' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${activeHostTab === 'availability' ? 'material-symbols-filled' : ''}`}>
            pace
          </span>
          <span className="text-[10px] font-semibold mt-0.5">Limits</span>
        </button>

        <button
          onClick={() => onSelectHostTab('bookings')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
            activeHostTab === 'bookings' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${activeHostTab === 'bookings' ? 'material-symbols-filled' : ''}`}>
            history
          </span>
          <span className="text-[10px] font-semibold mt-0.5">Bookings</span>
        </button>

        <button
          onClick={() => onSelectHostTab('polls')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
            activeHostTab === 'polls' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${activeHostTab === 'polls' ? 'material-symbols-filled' : ''}`}>
            groups
          </span>
          <span className="text-[10px] font-semibold mt-0.5">Consensus</span>
        </button>

        <button
          onClick={() => onSelectHostTab('sync')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
            activeHostTab === 'sync' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${activeHostTab === 'sync' ? 'material-symbols-filled' : ''}`}>
            sync_alt
          </span>
          <span className="text-[10px] font-semibold mt-0.5">Sync</span>
        </button>
      </div>
    </nav>
  );
};
