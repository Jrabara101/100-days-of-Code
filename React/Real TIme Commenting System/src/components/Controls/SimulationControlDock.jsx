import React, { useState } from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import { 
  Zap, 
  UserCheck, 
  Edit3, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Bell,
  Sun,
  Moon
} from 'lucide-react';

export default function SimulationControlDock() {
  const [isOpen, setIsOpen] = useState(true);
  const { 
    triggerSimulatedStream, 
    triggerTypingBurst, 
    toggleAuthorOnline, 
    toggleAuthorTyping,
    isAuthorInRoom,
    isAuthorTyping,
    pendingDeltaBuffer,
    isDarkMode,
    setIsDarkMode
  } = useDiscussion();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Toggle Pill when collapsed */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900 text-white shadow-xl hover:bg-black transition-all border border-zinc-700 text-xs font-semibold"
          title="Open Real-Time Simulation Studio"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-Time Simulation Dock</span>
          {pendingDeltaBuffer.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>
      ) : (
        /* Expanded Control Dock Panel */
        <div className="w-80 rounded-2xl bg-zinc-900 text-zinc-100 shadow-2xl border border-zinc-800 p-4 space-y-3 animate-slide-up backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Real-Time Testing Studio
                </h4>
                <p className="text-[10px] text-zinc-400">
                  Simulate SSE / WebSocket events
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Simulate Incoming Comment (Buffered) */}
            <button
              onClick={triggerSimulatedStream}
              className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-left transition-all active:scale-95 flex flex-col justify-between"
            >
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Bell className="w-3 h-3 text-emerald-400" />
                Stream Comment
              </span>
              <span className="text-[10px] text-zinc-400 mt-1">
                Buffers without scroll jank
              </span>
            </button>

            {/* Simulate Typing Burst */}
            <button
              onClick={triggerTypingBurst}
              className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-left transition-all active:scale-95 flex flex-col justify-between"
            >
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Edit3 className="w-3 h-3 text-indigo-400" />
                Typing Burst
              </span>
              <span className="text-[10px] text-zinc-400 mt-1">
                Live coalescing ring
              </span>
            </button>

            {/* Toggle Author Online/Offline */}
            <button
              onClick={toggleAuthorOnline}
              className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 flex flex-col justify-between ${
                isAuthorInRoom
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300'
              }`}
            >
              <span className="font-semibold flex items-center gap-1.5">
                <UserCheck className="w-3 h-3 text-amber-400" />
                Author Presence
              </span>
              <span className="text-[10px] text-zinc-400 mt-1">
                {isAuthorInRoom ? "In Room (Office Hours)" : "Offline"}
              </span>
            </button>

            {/* Toggle Author Typing Reply */}
            <button
              onClick={toggleAuthorTyping}
              className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 flex flex-col justify-between ${
                isAuthorTyping
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300'
              }`}
            >
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Author Typing
              </span>
              <span className="text-[10px] text-zinc-400 mt-1">
                {isAuthorTyping ? "Drafting reply..." : "Idle"}
              </span>
            </button>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Buffer queue: <strong className="font-mono text-emerald-400">{pendingDeltaBuffer.length}</strong></span>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-1 text-zinc-300 hover:text-white hover:underline"
            >
              {isDarkMode ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-400" />}
              <span>{isDarkMode ? 'Daylight' : 'Dark'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

