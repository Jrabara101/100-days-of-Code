import React, { useEffect } from 'react';
import { CouncilSessionState } from '../engine/types';
import { soundEngine } from '../audio/soundEngine';
import confetti from 'canvas-confetti';
import { Shield, RotateCcw, Download, CheckCircle, XCircle } from 'lucide-react';

interface SettlementModalProps {
  session: CouncilSessionState;
  onNextRound: () => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  session,
  onNextRound
}) => {
  const isCivVictory = session.winnerTeam === 'CIVILIANS';

  useEffect(() => {
    if (isCivVictory) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  }, [isCivVictory]);

  const exportReplayLog = () => {
    soundEngine.playClick();
    const lines = [
      '====================================================',
      'VOXEL COUNCIL // PROTOCOL-96 CONCLAVE REPLAY LOG',
      `ROUND: ${session.round} | SESSION TICK: ${session.tickHex}`,
      `DATE: ${new Date().toISOString()}`,
      '====================================================',
      '',
      `OUTCOME: ${session.winnerTeam} VICTORY`,
      `REASON: ${session.victoryReason}`,
      '',
      '--- LEXICON COMPARISON ---',
      `CIVILIAN CODEWORD: "${session.civilianWord}"`,
      `WEREWOLF CODEWORD: "${session.werewolfWord}"`,
      `INFILTRATOR SEAT: ${session.players[session.werewolfId]?.name || 'UNKNOWN'}`,
      '',
      '--- COUNCIL SEAT ROSTER & DISPATCHES ---',
      ...session.players.map(
        (p) =>
          `[SEAT ${p.id}] ${p.name} (${p.role}): Clue="${p.clue || 'NONE'}" | Suspicion=${(p.suspicion * 100).toFixed(1)}% | Votes=${p.votes}`
      ),
      '',
      '--- TELEMETRY TRACE ---',
      ...session.telemetryLog.map(
        (e) => `[${e.timestamp}] [${e.tickHex}] [${e.type}] ${e.message}`
      ),
      '',
      '====================================================',
      'END OF CONCLAVE TELEMETRY ARCHIVE'
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voxel_council_conclave_round_${session.round}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0b0d1a] pixel-frame-sky p-5 md:p-7 flex flex-col items-center text-center shadow-2xl my-auto">
        {/* Modal Top Header Banner */}
        <div className="w-full bg-[#191b28] py-2 px-4 pixel-frame-neutral mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#38bdf8]" />
            <span className="font-display text-xs md:text-sm text-[#38bdf8] tracking-widest uppercase font-bold">
              CONCLAVE RESOLUTION // VERDICT CONFIRMED
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#f59e0b]">
            SESSION CODE: #{session.tickHex.replace('0x', '')}-V
          </span>
        </div>

        {/* Victory Callout */}
        <div className="my-2 flex flex-col items-center">
          <div
            className={`px-4 py-2 font-display text-sm md:text-lg tracking-wider font-bold ${
              isCivVictory
                ? 'bg-[#10b981]/20 text-[#10b981] border-2 border-[#10b981]'
                : 'bg-[#f43f5e]/20 text-[#f43f5e] border-2 border-[#f43f5e]'
            }`}
          >
            [ {isCivVictory ? 'CIVILIANS VICTORY // WEREWOLF PURGED' : 'WEREWOLF VICTORY // COUNCIL DECEIVED'} ]
          </div>
          <p className="font-mono text-xs text-[#e1e1f3] max-w-lg mt-3 leading-relaxed">
            {session.victoryReason}
          </p>
        </div>

        {/* Side-by-Side Lexicon Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full my-4 text-left">
          {/* Civilian Word Box */}
          <div className="p-3.5 bg-[#10131f] pixel-frame-sky">
            <div className="text-[10px] font-display text-[#38bdf8] uppercase font-bold">
              CIVILIAN CODEWORD
            </div>
            <div className="font-display text-xl text-[#38bdf8] tracking-widest mt-1 font-bold">
              "{session.civilianWord}"
            </div>
            <div className="text-[11px] font-mono text-[#94a3b8] mt-1.5 leading-snug">
              {session.currentWordPair.description}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[#38bdf8] text-[10px] font-mono">
              <CheckCircle size={14} />
              <span>VERIFIED BY 3 SEATS</span>
            </div>
          </div>

          {/* Werewolf Word Box */}
          <div className="p-3.5 bg-[#10131f] pixel-frame-rose">
            <div className="text-[10px] font-display text-[#f43f5e] uppercase font-bold">
              WEREWOLF CODEWORD
            </div>
            <div className="font-display text-xl text-[#f43f5e] tracking-widest mt-1 font-bold">
              "{session.werewolfWord}"
            </div>
            <div className="text-[11px] font-mono text-[#94a3b8] mt-1.5 leading-snug">
              {session.currentWordPair.divergenceHint}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[#f43f5e] text-[10px] font-mono">
              <XCircle size={14} />
              <span>INFILTRATOR: {session.players[session.werewolfId]?.name}</span>
            </div>
          </div>
        </div>

        {/* Round Performance Telemetry Bar */}
        <div className="w-full p-2.5 bg-[#10131f] pixel-inset-panel flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#94a3b8]">
          <div>
            ROUNDS CONVENED: <strong className="text-[#38bdf8]">0{session.round}</strong>
          </div>
          <div>
            TRIBUNAL CONSENSUS: <strong className="text-[#f59e0b]">75.0%</strong>
          </div>
          <div>
            REPUTATION GAINED:{' '}
            <strong className="text-[#10b981]">{isCivVictory ? '+450 VOX XP' : '+150 VOX XP'}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
          <button
            onClick={() => {
              soundEngine.playClick();
              onNextRound();
            }}
            className="px-6 py-2.5 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#00354a] font-display text-xs font-bold uppercase tracking-wider pixel-btn shadow-[inset_2px_2px_0_0_#c4e7ff,inset_-2px_-2px_0_0_#00354a] flex items-center gap-2"
          >
            <RotateCcw size={16} />
            <span>[ NEXT CONCLAVE ]</span>
          </button>

          <button
            onClick={exportReplayLog}
            className="px-5 py-2.5 bg-[#191b28] hover:bg-[#272937] text-[#e1e1f3] font-display text-xs font-bold uppercase tracking-wider pixel-btn pixel-frame-neutral flex items-center gap-2"
          >
            <Download size={16} />
            <span>[ EXPORT REPLAY LOG ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
