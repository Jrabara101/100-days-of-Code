import React, { useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Bot, Users, QrCode, Copy, Check, Swords, Shield, Zap } from 'lucide-react';
import { CombatGameState } from '../types/combat';

interface LobbyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameState: CombatGameState | null;
  onCreateRoom: (fighterName: string, isAi: boolean) => void;
  onJoinRoom: (roomCode: string, fighterName: string) => void;
}

export const LobbyModal: React.FC<LobbyModalProps> = ({
  open,
  onOpenChange,
  gameState,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [tab, setTab] = useState<'quick' | 'pvp_create' | 'pvp_join'>('quick');
  const [fighterName, setFighterName] = useState<string>('PYRO-FRAME SCION');
  const [joinCode, setJoinCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyCode = () => {
    if (gameState?.roomCode) {
      navigator.clipboard.writeText(gameState.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleQuickPlay = () => {
    onCreateRoom(fighterName, true);
    onOpenChange(false);
  };

  const handleCreatePvP = () => {
    onCreateRoom(fighterName, false);
    onOpenChange(false);
  };

  const handleJoinPvP = () => {
    if (joinCode.trim().length === 4) {
      onJoinRoom(joinCode.trim().toUpperCase(), fighterName);
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="ARENA DISPATCH & MATCHMAKING"
      description="Zero install or account barrier. Deploy instantly into Caldera Arena or duel a friend via 4-character Room Code."
    >
      <div className="flex flex-col gap-4">
        {/* Fighter Codename Input */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] text-text-muted uppercase">
            PILOT CALLSIGN
          </label>
          <input
            type="text"
            value={fighterName}
            onChange={(e) => setFighterName(e.target.value)}
            className="w-full bg-magma-950 border border-magma-700 rounded px-3 py-2 text-sm font-mono text-solar-gold focus:outline-none focus:border-solar-gold"
            placeholder="Enter Callsign..."
            maxLength={20}
          />
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-magma-950 rounded-lg border border-magma-800">
          <button
            onClick={() => setTab('quick')}
            className={`py-2 rounded text-xs font-rajdhani font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              tab === 'quick'
                ? 'bg-gradient-to-r from-ember-core to-ember-orange text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI TRAINING</span>
          </button>
          <button
            onClick={() => setTab('pvp_create')}
            className={`py-2 rounded text-xs font-rajdhani font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              tab === 'pvp_create'
                ? 'bg-gradient-to-r from-ember-core to-ember-orange text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>CREATE 1v1</span>
          </button>
          <button
            onClick={() => setTab('pvp_join')}
            className={`py-2 rounded text-xs font-rajdhani font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              tab === 'pvp_join'
                ? 'bg-gradient-to-r from-ember-core to-ember-orange text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>JOIN 1v1</span>
          </button>
        </div>

        {/* Tab 1: AI Training */}
        {tab === 'quick' && (
          <div className="flex flex-col gap-3 p-3 rounded-lg bg-magma-950/70 border border-magma-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-crimson-heat/20 border border-crimson-heat/40 flex items-center justify-center">
                <Bot className="w-6 h-6 text-crimson-heat" />
              </div>
              <div>
                <h4 className="font-rajdhani font-bold text-sm text-text-primary">
                  SOLO PROTOCOL // AI SIMULATION
                </h4>
                <p className="font-chakra text-xs text-text-muted">
                  Duel against tactical AI combatant [IGNIS-TYPHON MK.IV] with adaptive guard breaking and counter-parries.
                </p>
              </div>
            </div>

            <Button variant="solar" size="lg" onClick={handleQuickPlay} className="w-full mt-2">
              DEPLOY TO TRAINING ARENA
            </Button>
          </div>
        )}

        {/* Tab 2: Create 1v1 Room */}
        {tab === 'pvp_create' && (
          <div className="flex flex-col gap-3 p-3 rounded-lg bg-magma-950/70 border border-magma-800">
            {gameState?.isPvP && gameState.phase === 'LOBBY' ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="font-mono text-xs text-text-muted">SHARE THIS 4-CHAR ROOM CODE</span>
                <div className="px-6 py-2.5 rounded-lg bg-magma-900 border-2 border-solar-gold text-3xl font-mono font-bold tracking-widest text-solar-gold">
                  {gameState.roomCode}
                </div>

                <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-2">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'CODE COPIED!' : 'COPY ROOM CODE'}</span>
                </Button>

                {/* Simulated QR Code Box */}
                <div className="mt-2 p-3 bg-white rounded-lg flex flex-col items-center">
                  <div className="w-28 h-28 bg-slate-900 rounded p-1 flex items-center justify-center text-center">
                    <span className="font-mono text-[9px] text-solar-gold font-bold">
                      ROOM // {gameState.roomCode}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-700 mt-1">SCAN FOR INSTANT DUEL</span>
                </div>

                <div className="flex items-center gap-2 text-text-muted font-mono text-xs animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-solar-gold" />
                  <span>WAITING FOR OPPONENT TO CONNECT...</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="font-chakra text-xs text-text-muted">
                  Spins up a synchronized peer arena room. Your opponent connects by entering your 4-letter code in any mobile or desktop browser.
                </p>
                <Button variant="default" size="lg" onClick={handleCreatePvP} className="w-full mt-2">
                  GENERATE 1v1 ARENA ROOM
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Join 1v1 Room */}
        {tab === 'pvp_join' && (
          <div className="flex flex-col gap-3 p-3 rounded-lg bg-magma-950/70 border border-magma-800">
            <label className="font-mono text-xs text-text-muted uppercase">
              ENTER 4-CHARACTER CODE
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. VOLC"
              maxLength={4}
              className="w-full text-center py-2.5 bg-magma-900 border-2 border-magma-700 rounded-lg text-2xl font-mono font-bold tracking-widest text-solar-gold focus:outline-none focus:border-solar-gold uppercase"
            />
            <Button
              variant="solar"
              size="lg"
              disabled={joinCode.trim().length !== 4}
              onClick={handleJoinPvP}
              className="w-full mt-1"
            >
              JOIN ARENA SECTOR
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
};
