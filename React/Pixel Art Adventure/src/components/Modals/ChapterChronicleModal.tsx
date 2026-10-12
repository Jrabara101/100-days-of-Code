import React, { useEffect, useState } from 'react';
import { Award, Users, RotateCcw, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { ChapterStatsResponse } from '../../types/game';
import { fetchChapterStats } from '../../services/api';

interface ChapterChronicleModalProps {
  isOpen: boolean;
  chapterId: string;
  narrativeFlags: Record<string, any>;
  onContinue: () => void;
  onRewindBranch: () => void;
}

export const ChapterChronicleModal: React.FC<ChapterChronicleModalProps> = ({
  isOpen,
  chapterId,
  narrativeFlags,
  onContinue,
  onRewindBranch,
}) => {
  const [stats, setStats] = useState<ChapterStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchChapterStats(chapterId).then((data) => {
        setStats(data);
        setLoading(false);
      });
    }
  }, [isOpen, chapterId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto">
      {/* Golden Rising Particle Atmosphere Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#F59E0B]/10 to-transparent" />
      </div>

      <div className="relative w-full max-w-xl max-h-[90vh] rounded-lg bg-[#131826] border-2 border-[#F59E0B] shadow-[0_0_35px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2D3954] bg-[#0B0D14]/90 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#FBBF24] font-pixel text-[10px] tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            CHAPTER MILESTONE REACHED
          </div>
          <h2 className="font-story font-bold text-xl text-[#F8FAFC]">
            The Folk Chronicle of Aethelgard
          </h2>
          <p className="font-story text-xs text-[#94A3B8] mt-1">
            How your moral convictions align with the global fellowship of travelers
          </p>
        </div>

        {/* Body Content */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#F59E0B] border-t-transparent animate-spin" />
              <span className="font-mono text-xs text-[#94A3B8]">
                Polling community chronicles telemetry...
              </span>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {stats.dilemmas.map((dilemma) => {
                // Determine which option player took
                let playerChoiceNodeId = '';
                if (dilemma.id === 'shrine_equilibrium') {
                  playerChoiceNodeId = narrativeFlags.shrine_restored ? 'restore_shrine' : 'harvest_core';
                } else if (dilemma.id === 'guardian_mercy') {
                  playerChoiceNodeId = narrativeFlags.spare_guardian ? 'spare_guardian' : 'deactivate_guardian';
                } else if (dilemma.id === 'memory_accord') {
                  playerChoiceNodeId = narrativeFlags.trust_elder_mael ? 'trust_elder_mael' : 'conceal_memory';
                }

                return (
                  <div
                    key={dilemma.id}
                    className="p-4 rounded-md bg-[#0B0D14]/80 border border-[#2D3954] flex flex-col gap-3"
                  >
                    <div>
                      <h3 className="font-story font-semibold text-sm text-[#F8FAFC]">
                        {dilemma.title}
                      </h3>
                      <p className="font-story text-xs text-[#94A3B8]">{dilemma.description}</p>
                    </div>

                    <div className="space-y-2.5">
                      {dilemma.options.map((opt) => {
                        const isPlayerPick = opt.nodeId === playerChoiceNodeId;

                        return (
                          <div key={opt.nodeId} className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-story">
                              <span
                                className={`flex items-center gap-1.5 ${
                                  isPlayerPick
                                    ? 'text-[#FBBF24] font-semibold'
                                    : 'text-[#CBD5E1]'
                                }`}
                              >
                                {isPlayerPick && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                                )}
                                {opt.text}
                                {isPlayerPick && (
                                  <span className="text-[9px] font-pixel text-[#F59E0B] ml-1">
                                    (YOUR CHOICE)
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-xs text-[#94A3B8]">
                                {opt.percentage}%
                              </span>
                            </div>

                            {/* Animated bar sweep */}
                            <div className="w-full h-2 rounded-full bg-[#1E293B] overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                  isPlayerPick
                                    ? 'bg-gradient-to-r from-[#D97706] to-[#F59E0B] shadow-[0_0_8px_#F59E0B]'
                                    : 'bg-[#475569]'
                                }`}
                                style={{ width: `${opt.percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#64748B]">
                <Users className="w-3.5 h-3.5" />
                <span>Aggregated over {stats.totalTravelers} global community travelers</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#2D3954] bg-[#0B0D14]/90 flex items-center justify-between gap-3">
          <button
            onClick={onRewindBranch}
            className="flex items-center gap-2 px-3.5 py-2 rounded bg-[#1E293B] hover:bg-[#2D3954] text-xs font-story text-[#CBD5E1] hover:text-[#F8FAFC] border border-[#2D3954] transition cursor-pointer"
            title="Rewind to the Altar to try another moral outcome"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#38BDF8]" />
            Rewind Chapter Branch
          </button>

          <button
            onClick={onContinue}
            className="flex items-center gap-2 px-5 py-2 rounded bg-[#D97706] hover:bg-[#F59E0B] text-xs font-story font-semibold text-[#0B0D14] shadow-md transition cursor-pointer"
          >
            Continue Journey
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
