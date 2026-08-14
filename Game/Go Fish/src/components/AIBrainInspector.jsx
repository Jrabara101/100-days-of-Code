import React, { useState } from 'react';
import { Brain, X, Activity, Eye, ShieldAlert } from 'lucide-react';

export const AIBrainInspector = ({ aiMemory, isOpen, onClose }) => {
  if (!isOpen) return null;

  const memoryEntries = Object.entries(aiMemory || {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-pixel select-none">
      <div className="bg-[#111827] border-4 border-cyan-400 w-full max-w-xl p-4 pixel-box text-white flex flex-col max-h-[85vh] shadow-[8px_8px_0px_0px_#000]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b-4 border-cyan-400 pb-3 mb-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <Brain className="w-6 h-6 animate-pulse" />
            <h2 className="text-base font-black uppercase tracking-wider">AI STATISTICAL INFERENCE MATRIX</h2>
          </div>
          <button 
            onClick={onClose}
            className="pixel-btn bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-emerald-950/80 border-2 border-emerald-500 p-2 text-[11px] text-emerald-200 mb-4 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-400">Strict Information Asymmetry: </span>
            The AI does NOT cheat by inspecting private arrays. It infers card locations solely from player inquiries and turn history.
          </div>
        </div>

        {/* Memory Ledger Table */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {memoryEntries.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 italic bg-gray-900 border-2 border-dashed border-gray-700">
              Ledger empty. The AI has not observed any player inquiries yet.
            </div>
          ) : (
            memoryEntries.map(([rank, data]) => (
              <div 
                key={rank} 
                className="bg-gray-900 border-2 border-cyan-500/50 p-3 flex justify-between items-center shadow-pixel-sm hover:border-cyan-400 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400 text-black border-2 border-black flex items-center justify-center font-black text-lg">
                    {rank}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                      <span>Inferred Min Count: {data.count}</span>
                      {data.known && (
                        <span className="bg-emerald-600 text-black text-[9px] px-1 font-black uppercase">
                          Confirmed Hold
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Recorded on Turn #{data.turnAsked} via conversational ask
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-1 border border-emerald-700">
                    <Activity className="w-3 h-3" />
                    P(Hold) = 100%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t-2 border-gray-800 flex justify-between items-center text-[10px] text-gray-400">
          <div>$O(1)$ Hash Map Lookups • Auto-purged upon 4-of-a-kind Book Completion</div>
          <button 
            onClick={onClose}
            className="pixel-btn bg-gray-700 text-white px-4 py-1 text-xs font-bold uppercase hover:bg-gray-600"
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
};
