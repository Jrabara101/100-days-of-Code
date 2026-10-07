import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { GroupConsensusPoll, PollSlot } from '../../types';

interface GroupConsensusPollProps {
  initialPoll: GroupConsensusPoll;
}

export const GroupConsensusPollComponent: React.FC<GroupConsensusPollProps> = ({ initialPoll }) => {
  const [poll, setPoll] = useState<GroupConsensusPoll>(initialPoll);
  const [voterName, setVoterName] = useState('Sarah Connor (Engineering)');
  const [voterEmail, setVoterEmail] = useState('sarah@company.com');
  const [selectedSlotVotes, setSelectedSlotVotes] = useState<string[]>(['ps-1', 'ps-3']);
  const [autoLockedSlot, setAutoLockedSlot] = useState<PollSlot | null>(null);

  const toggleVote = (slotId: string) => {
    if (poll.status === 'locked') return;
    if (selectedSlotVotes.includes(slotId)) {
      setSelectedSlotVotes(selectedSlotVotes.filter((id) => id !== slotId));
    } else {
      setSelectedSlotVotes([...selectedSlotVotes, slotId]);
    }
  };

  const handleCastVote = () => {
    if (!voterName.trim()) {
      alert('Please enter your name to vote.');
      return;
    }

    // Clone poll and add voter
    const updatedSlots = poll.slots.map((slot) => {
      if (selectedSlotVotes.includes(slot.id)) {
        if (!slot.votes.includes(voterName)) {
          return { ...slot, votes: [...slot.votes, voterName] };
        }
      } else {
        return { ...slot, votes: slot.votes.filter((v) => v !== voterName) };
      }
      return slot;
    });

    // Check if any slot reached quorum (all 3 stakeholders)
    const winningSlot = updatedSlots.find((slot) => slot.votes.length >= poll.quorumNeeded);

    if (winningSlot) {
      setPoll({
        ...poll,
        slots: updatedSlots,
        status: 'locked',
        lockedSlotId: winningSlot.id,
      });
      setAutoLockedSlot(winningSlot);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.4 },
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      setPoll({
        ...poll,
        slots: updatedSlots,
      });
    }
  };

  const handleResetPoll = () => {
    setPoll(initialPoll);
    setAutoLockedSlot(null);
    setSelectedSlotVotes(['ps-1', 'ps-3']);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-border-divider/70 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-filled text-primary text-[22px]">how_to_vote</span>
            <h2 className="text-lg font-bold text-text-primary">Find a Time: Consensus Quorum</h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Stakeholders vote on 3-5 tentative slots. CalSync automatically locks the slot when quorum is satisfied.
          </p>
        </div>

        {poll.status === 'locked' && (
          <button
            onClick={handleResetPoll}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-surface-neutral hover:bg-surface-variant text-text-secondary hover:text-text-primary font-semibold text-xs border border-border-divider/60 transition-colors"
          >
            Reset Simulation
          </button>
        )}
      </div>

      {/* Quorum Locked Announcement */}
      {poll.status === 'locked' && autoLockedSlot && (
        <div className="p-4 bg-secondary-container/50 border border-secondary text-on-secondary-container rounded-2xl shadow-xs space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="material-symbols-filled text-secondary text-[20px]">lock_clock</span>
            <span>AUTO-LOCK QUORUM REACHED! Meeting Confirmed.</span>
          </div>
          <p className="text-xs text-text-secondary">
            All {poll.quorumNeeded} key stakeholders voted "Yes" for{' '}
            <strong className="text-text-primary">
              {autoLockedSlot.formattedDate} at {autoLockedSlot.timeStr}
            </strong>
            . Bi-directional calendar holds are locked and calendar invitations were dispatched.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
            <span>✓ Host Hold Locked</span>
            <span>✓ CTO Hold Locked</span>
            <span>✓ Engineering Hold Locked</span>
          </div>
        </div>
      )}

      {/* Poll Details Card */}
      <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-border-divider/70 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-text-primary">{poll.title}</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{poll.description}</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-surface-container text-primary font-bold text-xs shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">timer</span>
            <span>{poll.durationMinutes}m</span>
          </div>
        </div>

        {/* Quorum Progress Bar */}
        <div className="p-3 bg-surface-neutral rounded-xl border border-border-divider/50 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-text-secondary">Quorum Threshold Requirement:</span>
            <span className="text-primary font-bold">{poll.quorumNeeded} of {poll.totalStakeholders} Stakeholder Votes</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 ${
                poll.status === 'locked' ? 'bg-secondary w-full' : 'bg-primary-container w-2/3'
              }`}
            />
          </div>
        </div>

        {/* Tentative Slots Voting Grid */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-text-primary block">
            Tentative Meeting Slots (Cast or Change Your Vote):
          </span>

          <div className="space-y-2.5">
            {poll.slots.map((slot) => {
              const isLockedSlot = poll.lockedSlotId === slot.id;
              const hasMyVote = selectedSlotVotes.includes(slot.id);
              const voteCount = slot.votes.length;
              const isThresholdMet = voteCount >= poll.quorumNeeded;

              return (
                <div
                  key={slot.id}
                  onClick={() => toggleVote(slot.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isLockedSlot
                      ? 'bg-secondary-container/40 border-secondary shadow-xs'
                      : hasMyVote
                      ? 'bg-surface-variant/40 border-primary shadow-xs'
                      : 'bg-surface hover:bg-surface-neutral border-border-divider'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        hasMyVote
                          ? 'bg-primary-container text-on-primary'
                          : 'bg-surface-container text-text-secondary'
                      }`}
                    >
                      {hasMyVote ? '✓' : ''}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-text-primary">{slot.formattedDate}</span>
                      <span className="text-xs text-text-secondary ml-2 font-semibold">
                        {slot.timeStr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Voters Avatars */}
                    <div className="flex items-center -space-x-1.5">
                      {slot.votes.map((v, idx) => (
                        <div
                          key={idx}
                          title={v}
                          className="w-6 h-6 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold text-text-primary"
                        >
                          {v.charAt(0)}
                        </div>
                      ))}
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isThresholdMet
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-neutral text-text-secondary'
                      }`}
                    >
                      {voteCount} / {poll.totalStakeholders} Votes
                    </span>

                    {isLockedSlot && (
                      <span className="text-xs font-bold text-secondary flex items-center gap-0.5">
                        <span className="material-symbols-filled text-[16px]">verified</span>
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Voting Action Box */}
        {poll.status !== 'locked' ? (
          <div className="pt-3 border-t border-border-divider/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-text-secondary shrink-0">Voting as:</span>
              <input
                type="text"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                className="h-9 px-3 rounded-lg bg-surface border border-border-divider text-xs font-semibold outline-none w-full sm:w-60"
              />
            </div>
            <button
              onClick={handleCastVote}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary-hover active:scale-95 text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <span>Submit My Consensus Votes</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        ) : (
          <div className="pt-3 border-t border-border-divider/50 text-center text-xs text-text-secondary">
            Voting closed. Quorum satisfied.
          </div>
        )}
      </div>
    </div>
  );
};
