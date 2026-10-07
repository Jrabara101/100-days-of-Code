import React, { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatScore } from '../../lib/utils';
import { Trophy, ShieldCheck, RefreshCw } from 'lucide-react';

interface LeaderboardRecord {
  id: string;
  callsign: string;
  sectorId: string;
  score: number;
  waveReached: number;
  grazes: number;
  accuracy: number;
  synergies: string[];
  shipId: string;
  verified: boolean;
  runHash: string;
  timestamp: number;
}

interface LeaderboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaderboardModal({ open, onOpenChange }: LeaderboardModalProps) {
  const [entries, setEntries] = useState<LeaderboardRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leaderboard?sectorId=daily&limit=25');
      const data = await res.json();
      if (data.entries) {
        setEntries(data.entries);
      }
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLeaderboard();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center justify-between w-full">
          <DialogTitle>
            <Trophy className="w-5 h-5 text-amber-400" />
            GLOBAL SECTOR // ACE PILOT LEADERBOARD
          </DialogTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="text-[10px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            REFRESH
          </Button>
        </div>
        <DialogDescription>
          Authoritative black-box verified combat records across synchronized sectors.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant font-mono text-xs">
            {isLoading ? 'DOWNLOADING FLIGHT TELEMETRY...' : 'NO RECORDS FOUND IN CURRENT SECTOR'}
          </div>
        ) : (
          entries.map((entry, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            const medalColor = rank === 1 ? 'text-amber-400 border-amber-400/40 bg-amber-400/10' : rank === 2 ? 'text-slate-300 border-slate-300/40 bg-slate-300/10' : rank === 3 ? 'text-amber-600 border-amber-600/40 bg-amber-600/10' : 'text-on-surface-variant border-outline-variant/30 bg-surface-container-high/40';

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isTop3
                    ? 'bg-surface-container/90 border-outline-variant/60 shadow-md'
                    : 'bg-surface-container/50 border-outline-variant/30 hover:bg-surface-container'
                }`}
              >
                {/* Rank & Pilot Callsign */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center font-mono text-xs font-bold border ${medalColor}`}
                  >
                    #{rank}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-on-surface tracking-wider">
                        {entry.callsign}
                      </span>
                      {entry.verified && (
                        <span title={`Authoritative Anti-Cheat Validated (${entry.runHash})`}>
                          <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant">
                      <span>WAVE {entry.waveReached}</span>
                      <span>•</span>
                      <span>GRAZES: {entry.grazes}</span>
                      <span>•</span>
                      <span>SHIP: {entry.shipId?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Score & Synergy Badges */}
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono text-sm font-extrabold text-primary tracking-tight">
                    {formatScore(entry.score)} PTS
                  </span>

                  <div className="hidden sm:flex items-center gap-1">
                    {entry.synergies && entry.synergies.slice(0, 2).map((syn) => (
                      <Badge key={syn} variant="outline" className="text-[9px] px-1 py-0">
                        {syn.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <DialogFooter>
        <Button variant="primary" onClick={() => onOpenChange(false)}>
          CLOSE LEADERBOARD
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
