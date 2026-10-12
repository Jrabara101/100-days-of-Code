import React from 'react';
import { ArrowDown } from 'lucide-react';

export default function UnreadFloatingPill({ unreadCount = 0, onClick }) {
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-pop-in">
      <button
        onClick={onClick}
        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-full shadow-lg hover:shadow-blue-500/25 text-xs font-semibold tracking-tight transition-all duration-150 active:scale-95 border border-blue-400/30"
      >
        <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
        <span>New messages below</span>
        {unreadCount > 0 && (
          <span className="bg-white text-blue-600 rounded-full px-1.5 py-0.2 text-[10px] font-bold">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
