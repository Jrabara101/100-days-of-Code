import React from 'react';
import { Send, RotateCcw, Zap } from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';

export function UndoSendToast() {
  const { undoQueue, cancelUndoSend, dispatchImmediately } = useMailStore();

  if (undoQueue.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 select-none animate-slide-up">
      {undoQueue.map((item) => {
        const recipient = item.draft?.to?.split('@')[0] || 'recipient';
        const progressPercent = ((item.remainingSeconds) / item.totalSeconds) * 100;

        return (
          <div
            key={item.id}
            className="w-80 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-2xl p-3 relative overflow-hidden flex flex-col gap-2"
          >
            {/* Draining cobalt progress line at bottom */}
            <div 
              className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <Send className="w-3.5 h-3.5 text-blue-400 animate-pulse flex-shrink-0" />
                <span className="truncate font-medium">
                  Sending to {recipient}... ({item.remainingSeconds}s)
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => cancelUndoSend(item.id)}
                  title="Undo Send (Z)"
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-semibold text-xs transition flex items-center gap-1 border border-slate-600"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Undo (Z)</span>
                </button>

                <button
                  onClick={() => dispatchImmediately(item.id)}
                  title="Send Now without waiting"
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

