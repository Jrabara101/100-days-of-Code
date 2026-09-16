import { useState, useEffect } from 'react';
import { useHubStore } from './store/useHubStore';
import { networkHub } from './lib/network';
import { LobbyHeader } from './components/lobby/LobbyHeader';
import { LobbyModal } from './components/lobby/LobbyModal';
import { PlayerAvatar } from './components/ui/PlayerAvatar';
import { CRTOverlay } from './components/ui/CRTOverlay';
import { TacticalPingOverlay } from './components/comms/TacticalPingOverlay';
import { EmoteWheel } from './components/comms/EmoteWheel';
import { CommsRadio } from './components/comms/CommsRadio';
import { SharedPuzzleRoom } from './components/games/SharedPuzzleRoom/SharedPuzzleRoom';
import { GridBattler } from './components/games/GridBattler/GridBattler';
import { ReactionArena } from './components/games/ReactionArena/ReactionArena';
import { MousePointerClick, ShieldCheck } from 'lucide-react';

export function App() {
  const [isMatchmakerOpen, setIsMatchmakerOpen] = useState(false);

  const activeGame = useHubStore((s) => s.activeGame);
  const gameMode = useHubStore((s) => s.gameMode);
  const playerRole = useHubStore((s) => s.playerRole);
  const scores = useHubStore((s) => s.scores);
  const readyStates = useHubStore((s) => s.readyStates);
  const toggleReady = useHubStore((s) => s.toggleReady);
  const isConnected = useHubStore((s) => s.isConnected);
  const opponentJoined = useHubStore((s) => s.opponentJoined);
  const triggerPing = useHubStore((s) => s.triggerPing);

  // Global network message listener
  useEffect(() => {
    const unsub = networkHub.subscribe((msg) => {
      if (msg.type === 'READY_TOGGLE') {
        useHubStore.getState().setReadyStates(msg.payload);
      } else if (msg.type === 'GAME_SELECT') {
        useHubStore.getState().selectGame(msg.payload.gameId, false);
      } else if (msg.type === 'PING_DROPPED') {
        useHubStore.getState().triggerPing(msg.payload.x, msg.payload.y, msg.sender, false);
      } else if (msg.type === 'EMOTE_SENT') {
        useHubStore.getState().triggerEmote(msg.payload.emote, msg.sender, false);
      } else if (msg.type === 'COMMS_MESSAGE') {
        useHubStore.getState().sendRadioCall(msg.payload.text, msg.sender, false);
      } else if (msg.type === 'PLAYER_JOIN') {
        useHubStore.getState().setOpponentJoined(true);
      } else if (msg.type === 'PLAYER_ASSIGN') {
        useHubStore.getState().setRoomInfo(useHubStore.getState().roomCode, false, msg.payload.assignedRole);
      }
    });

    return unsub;
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0D1117] text-[#E6EDF3] flex flex-col selection:bg-[#58A6FF]/30 selection:text-white"
      onContextMenu={(e) => {
        // Quick drop ping with right click anywhere
        e.preventDefault();
        triggerPing(e.clientX, e.clientY);
      }}
    >
      {/* Visual Sci-Fi Overlays */}
      <CRTOverlay />
      <TacticalPingOverlay />

      {/* Top Navigation HUD */}
      <LobbyHeader onOpenMatchmaker={() => setIsMatchmakerOpen(true)} />

      {/* Main Control Room Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Player Squad Terminal Bar */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-3 rounded-2xl border border-slate-800/80 bg-[#161B22]/60 backdrop-blur-md">
          {/* PLAYER 1 AVATAR & CONTROLS */}
          <div className="md:col-span-5 flex items-center gap-3">
            <PlayerAvatar
              role="P1"
              name="Operator 01 (Cyan)"
              score={scores.P1}
              isReady={readyStates.P1}
              isCurrentPlayer={playerRole === 'P1'}
              isOnline={isConnected}
              className="flex-1"
            />
            {(gameMode === 'LOCAL_2P' || playerRole === 'P1') && (
              <button
                onClick={() => toggleReady('P1')}
                className={`px-3 py-3 rounded-xl border font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                  readyStates.P1
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_#10b981]'
                    : 'border-slate-700 bg-[#0D1117] text-slate-400 hover:text-white'
                }`}
                title="Toggle Ready Check"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* SQUAD COMBAT STATS CENTER */}
          <div className="md:col-span-2 text-center py-1 font-mono">
            <div className="text-[10px] uppercase tracking-widest text-slate-400">
              SYSTEM TALLY
            </div>
            <div className="text-xl font-black tracking-widest mt-0.5">
              <span className="text-[#58A6FF]">{scores.P1}</span>
              <span className="text-slate-600 mx-2">:</span>
              <span className="text-[#D29922]">{scores.P2}</span>
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">
              {gameMode === 'ONLINE' ? 'PEER SYNCHRONIZED' : gameMode.replace('_', ' ')}
            </div>
          </div>

          {/* PLAYER 2 AVATAR & CONTROLS */}
          <div className="md:col-span-5 flex items-center gap-3">
            {(gameMode === 'LOCAL_2P' || playerRole === 'P2') && (
              <button
                onClick={() => toggleReady('P2')}
                className={`px-3 py-3 rounded-xl border font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                  readyStates.P2
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_#10b981]'
                    : 'border-slate-700 bg-[#0D1117] text-slate-400 hover:text-white'
                }`}
                title="Toggle Ready Check"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
            )}
            <PlayerAvatar
              role="P2"
              name={gameMode === 'SOLO_AI' ? 'AI Sparring Unit' : 'Operator 02 (Amber)'}
              score={scores.P2}
              isReady={readyStates.P2}
              isCurrentPlayer={playerRole === 'P2'}
              isOnline={isConnected && opponentJoined}
              className="flex-1"
            />
          </div>
        </section>

        {/* ACTIVE MINIGAME STAGE */}
        <section className="min-h-[460px]">
          {activeGame === 'SHARED_PUZZLE' && <SharedPuzzleRoom />}
          {activeGame === 'GRID_BATTLER' && <GridBattler />}
          {activeGame === 'REACTION_ARENA' && <ReactionArena />}
        </section>

        {/* BOTTOM COMMUNICATOR & TOOLING DOCK */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-2">
          {/* Tactical Radio Comms Feed */}
          <div className="md:col-span-8">
            <CommsRadio />
          </div>

          {/* Emote & Ping Tools */}
          <div className="md:col-span-4 space-y-3">
            <div className="p-3 rounded-xl border border-slate-800 bg-[#161B22]/80 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <MousePointerClick className="w-4 h-4 text-[#58A6FF]" />
                <span>Right-Click or Shift-Click to Ping</span>
              </div>
              <EmoteWheel />
            </div>

            <div className="text-[10px] font-mono text-slate-500 text-center leading-relaxed">
              COLLABORATIVE CONTROL ROOM PLATFORM // SUB-100MS SYNCHRONIZATION // ZERO DOWNLOADS
            </div>
          </div>
        </section>
      </main>

      {/* Matchmaker & Pairing Modal */}
      <LobbyModal isOpen={isMatchmakerOpen} onClose={() => setIsMatchmakerOpen(false)} />
    </div>
  );
}

export default App;
