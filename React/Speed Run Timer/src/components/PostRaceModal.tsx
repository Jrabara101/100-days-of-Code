import React, { useState } from 'react';
import { 
  MultiplayerRaceState, 
  RaceParticipant 
} from '../types/race';
import { formatTime, formatDelta, generateShareableScorecard } from '../utils/formatters';
import { Modal, Button, Badge } from './ui/primitives';
import { 
  Trophy, 
  Copy, 
  Check, 
  RotateCcw, 
  Star, 
  Flame, 
  Download,
  Share2
} from 'lucide-react';
import { exportToLiveSplitLss } from '../utils/lssParser';

interface PostRaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  raceState: MultiplayerRaceState;
  myParticipant?: RaceParticipant;
  onResetRace: () => void;
}

export const PostRaceModal: React.FC<PostRaceModalProps> = ({
  isOpen,
  onClose,
  raceState,
  myParticipant,
  onResetRace,
}) => {
  const [copiedScorecard, setCopiedScorecard] = useState(false);

  // Placements sorted by final time
  const placements = [...raceState.participants]
    .filter(p => p.finalTimeMs !== undefined)
    .sort((a, b) => (a.finalTimeMs || 0) - (b.finalTimeMs || 0));

  const myRecord = myParticipant || raceState.participants[0];
  const goldCount = myRecord?.completedSplits.filter(s => s.isGold).length || 0;

  const handleCopyDiscord = () => {
    const text = generateShareableScorecard(raceState, myRecord);
    navigator.clipboard.writeText(text);
    setCopiedScorecard(true);
    setTimeout(() => setCopiedScorecard(false), 2000);
  };

  const handleExportLss = () => {
    const lss = exportToLiveSplitLss(raceState.gameTitle, raceState.categoryName, raceState.segments);
    const blob = new Blob([lss], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${raceState.gameTitle.toLowerCase().replace(/\s+/g, '_')}_splits.lss`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="RACE RECAP // POST-MATCH DEBRIEF"
      subtitle={`${raceState.gameTitle} - ${raceState.categoryName}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-slate-100 font-mono">
        {/* Placement Podium Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {placements.map((p, idx) => {
            const isWinner = idx === 0;
            const rankBadge = idx === 0 ? '🥇 1ST PLACE' : idx === 1 ? '🥈 2ND PLACE' : '🥉 3RD PLACE';
            const borderCol = idx === 0 ? 'border-neon-gold bg-neon-gold/10' : idx === 1 ? 'border-slate-400 bg-slate-800/40' : 'border-amber-700 bg-amber-950/20';

            return (
              <div
                key={p.playerId}
                className={`p-4 rounded-[4px] border ${borderCol} flex flex-col justify-between`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-300 block">{rankBadge}</span>
                  <span className="text-base font-bold text-slate-100 truncate block mt-1">
                    {p.username}
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-[10px] text-slate-400 block uppercase">FINAL TIME</span>
                  <span className="text-xl font-black text-slate-100">
                    {formatTime(p.finalTimeMs || 0, true)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Segment-by-Segment Heatmap Matrix */}
        <div className="bg-obsidian-surface rounded-[4px] border border-obsidian-border p-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-200 uppercase tracking-wider">
              SPLIT HEATMAP & ROUTE DIVERGENCE
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-neon-gold">
                <span className="h-2 w-2 rounded-full bg-neon-gold" /> Gold Split
              </span>
              <span className="flex items-center gap-1 text-neon-emerald">
                <span className="h-2 w-2 rounded-full bg-neon-emerald" /> Time Save
              </span>
              <span className="flex items-center gap-1 text-neon-ruby">
                <span className="h-2 w-2 rounded-full bg-neon-ruby" /> Time Lost
              </span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="divide-y divide-obsidian-border/50 text-xs">
            {raceState.segments.map((seg, idx) => {
              const mySplit = myRecord?.completedSplits.find(s => s.splitIndex === idx);
              const isGold = mySplit?.isGold;
              const delta = mySplit?.deltaVsPbMs;
              const deltaInfo = mySplit ? formatDelta(delta) : null;

              return (
                <div key={seg.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px] font-bold w-4">{idx + 1}.</span>
                    <span className={`font-semibold ${isGold ? 'text-neon-gold' : 'text-slate-200'}`}>
                      {seg.name}
                    </span>
                    {isGold && <Star className="h-3 w-3 text-neon-gold fill-neon-gold" />}
                  </div>

                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-slate-400 text-[11px]">
                      Duration: {mySplit ? formatTime(mySplit.segmentDurationMs, true) : '--:--'}
                    </span>
                    <span className="text-slate-200 font-bold text-xs">
                      {mySplit ? formatTime(mySplit.completedAtMs, true) : '--:--'}
                    </span>
                    {deltaInfo && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          isGold
                            ? 'bg-neon-gold/20 text-neon-gold border border-neon-gold/40'
                            : deltaInfo.isAhead
                            ? 'bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/40'
                            : 'bg-neon-ruby/20 text-neon-ruby border border-neon-ruby/40'
                        }`}
                      >
                        {deltaInfo.text}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scorecard Text Preview & One-Click Discord Share */}
        <div className="p-4 rounded-[4px] bg-obsidian-void border border-obsidian-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Share2 className="h-4 w-4 text-neon-cyan" />
              DISCORD & SOCIAL SCORECARD
            </span>
            <Badge variant="gold">{goldCount} GOLD SPLITS CRUSHED</Badge>
          </div>

          <pre className="p-3 rounded bg-obsidian-base border border-obsidian-border text-[11px] text-slate-300 font-mono whitespace-pre-wrap select-all overflow-x-auto">
            {generateShareableScorecard(raceState, myRecord)}
          </pre>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              variant="gold"
              size="md"
              onClick={handleCopyDiscord}
              className="flex items-center gap-2"
            >
              {copiedScorecard ? <Check className="h-4 w-4 text-obsidian-void" /> : <Copy className="h-4 w-4" />}
              {copiedScorecard ? 'COPIED TO CLIPBOARD!' : 'COPY DISCORD SCORECARD'}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handleExportLss}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4 text-neon-cyan" />
              EXPORT LIVESPLIT (.LSS)
            </Button>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-2 flex items-center justify-between border-t border-obsidian-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Recap
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              onResetRace();
              onClose();
            }}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            REMATCH / RESTART RACE
          </Button>
        </div>
      </div>
    </Modal>
  );
};
