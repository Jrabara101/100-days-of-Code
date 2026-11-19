import React, { useState } from 'react';
import { SoftHoldGroupPoll, Spot, TimeSlot } from '../types';
import { X, Copy, Check, Users, Clock, ShieldAlert, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';

interface GroupPollModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupPoll: SoftHoldGroupPoll | null;
  secondsRemaining: number;
  spot: Spot | null;
  slot: TimeSlot | null;
  onFinalizeFromPoll: () => void;
}

export const GroupPollModal: React.FC<GroupPollModalProps> = ({
  isOpen,
  onClose,
  groupPoll,
  secondsRemaining,
  spot,
  slot,
  onFinalizeFromPoll,
}) => {
  const [copied, setCopied] = useState(false);
  const [simulatedParticipants, setSimulatedParticipants] = useState(
    groupPoll?.participants || []
  );

  if (!isOpen || !groupPoll || !spot || !slot) return null;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(groupPoll.shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulate friend tapping "I'm In"
  const handleSimulateFriendJoin = () => {
    const pendingFriend = simulatedParticipants.find(p => p.status === 'pending');
    if (pendingFriend) {
      setSimulatedParticipants(prev =>
        prev.map(p =>
          p.id === pendingFriend.id
            ? { ...p, status: 'joined', dietaryNotes: 'No seafood / Shellfish allergy', tabPaid: true }
            : p
        )
      );
    }
  };

  const confirmedCount = simulatedParticipants.filter(p => p.status !== 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1B1F24] rounded-2xl border border-stone-800/10 dark:border-white/10 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Live Monospace Timer & Hold Badge */}
        <div className="p-5 bg-[#FAF7F2] dark:bg-[#15181C] border-b border-stone-800/8 dark:border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9822B] animate-ping" />
            <h3 className="font-serif text-lg font-medium text-[#18201C] dark:text-[#F6F4F0]">
              15-Minute Group Poll &amp; Soft Hold
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="font-mono text-sm font-bold text-[#D9822B] bg-[#D9822B]/10 px-2.5 py-1 rounded-lg">
              ⏳ {timeFormatted} LEFT
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-[#828B86] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Spatial Spot Locked Summary */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1F24] border border-stone-800/8 dark:border-white/8 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#828B86] font-mono uppercase mb-1">
              <span>LOCKED INVENTORY</span>
              <span className="text-[#1E6F50] dark:text-[#2CA376] font-semibold">● ACTIVE HOLD</span>
            </div>
            <div className="text-sm font-bold text-[#18201C] dark:text-[#F6F4F0]">
              {slot.timeStr} • {spot.code} ({spot.name})
            </div>
            <p className="text-xs text-[#525B56] dark:text-[#A0A8A3] mt-0.5">
              This spot is held in memory for your group and cannot be poached by other guests.
            </p>
          </div>

          {/* Shareable Group Link Box */}
          <div>
            <span className="text-xs font-mono uppercase text-[#828B86] block mb-1.5">
              Shareable Group Poll Link
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={groupPoll.shareableUrl}
                className="w-full text-xs font-mono bg-[#FAF7F2] dark:bg-[#15181C] border border-stone-800/10 dark:border-white/10 rounded-xl px-3 py-2 text-[#525B56] dark:text-[#A0A8A3] select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="shrink-0 px-3 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B24E2A] text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Live Friend Responses / Consensus Quorum */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#828B86] font-mono uppercase mb-2">
              <span>Group Consensus ({confirmedCount}/{simulatedParticipants.length} Confirmed)</span>
              <button
                onClick={handleSimulateFriendJoin}
                className="text-[11px] text-[#C85A32] hover:underline font-mono"
              >
                + Simulate Elena RSVPs "I'm In"
              </button>
            </div>

            <div className="space-y-2">
              {simulatedParticipants.map((p) => {
                const isJoined = p.status === 'joined' || p.status === 'organizer';
                return (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#15181C] border border-stone-800/6 dark:border-white/6 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-stone-700"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-[#18201C] dark:text-[#F6F4F0]">
                          <span>{p.name}</span>
                          {p.status === 'organizer' && (
                            <span className="text-[9px] font-mono uppercase bg-[#C85A32]/10 text-[#C85A32] px-1.5 py-0.2 rounded font-bold">
                              Organizer
                            </span>
                          )}
                        </div>
                        {p.dietaryNotes && (
                          <span className="text-[11px] text-[#1E6F50] dark:text-[#2CA376] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {p.dietaryNotes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        isJoined
                          ? 'bg-[#1E6F50]/15 text-[#1E6F50] dark:text-[#2CA376]'
                          : 'bg-stone-200 dark:bg-stone-800 text-[#828B86]'
                      }`}>
                        {isJoined ? "👍 I'm In" : '⏳ Invited'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-stone-800/8 dark:border-white/8 flex items-center justify-between gap-3">
            <span className="text-xs text-[#828B86]">
              Hold auto-releases in {mins}m {secs}s
            </span>
            <button
              onClick={() => {
                onFinalizeFromPoll();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B24E2A] text-white text-xs font-mono font-semibold flex items-center gap-1.5 shadow-md shadow-[#C85A32]/20 transition-all active:scale-95"
            >
              <span>Lock &amp; Confirm Booking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
