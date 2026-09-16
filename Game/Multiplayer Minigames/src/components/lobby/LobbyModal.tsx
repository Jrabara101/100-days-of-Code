import React, { useState } from 'react';
import { Copy, Check, Users, Globe, Cpu, X } from 'lucide-react';
import { useHubStore, type GameMode } from '../../store/useHubStore';
import { networkHub } from '../../lib/network';
import { sounds } from '../../lib/audio';
import { cn } from '../../lib/utils';

interface LobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LobbyModal: React.FC<LobbyModalProps> = ({ isOpen, onClose }) => {
  const gameMode = useHubStore((s) => s.gameMode);
  const setGameMode = useHubStore((s) => s.setGameMode);
  const roomCode = useHubStore((s) => s.roomCode);
  const setRoomInfo = useHubStore((s) => s.setRoomInfo);
  const isConnected = useHubStore((s) => s.isConnected);
  const opponentJoined = useHubStore((s) => s.opponentJoined);

  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sounds.playClick(1.5);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNewRoom = () => {
    const prefixes = ['CYBER', 'NEXUS', 'ALPHA', 'PULSE', 'VORTEX'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const code = `${randomPrefix}-${randomNum}`;

    sounds.playClick(1.1);
    setGameMode('ONLINE');
    setRoomInfo(code, true, 'P1');
    networkHub.hostRoom(code, () => {
      setConnecting(false);
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setErrorMsg('');
    setConnecting(true);
    const code = inputCode.trim().toUpperCase();

    setGameMode('ONLINE');
    setRoomInfo(code, false, 'P2');

    networkHub.joinRoom(
      code,
      () => {
        setConnecting(false);
        sounds.playConduitLink();
        onClose();
      },
      (err) => {
        setConnecting(false);
        setErrorMsg(err || 'Failed to connect to room.');
      }
    );
  };

  const handleSelectMode = (mode: GameMode) => {
    sounds.playClick(1.2);
    setGameMode(mode);
    if (mode === 'LOCAL_2P') {
      networkHub.cleanup();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#161B22] p-6 shadow-2xl overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#58A6FF] via-emerald-400 to-[#D29922]" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            CONTROL ROOM MATCHMAKER
          </div>
          <h2 className="text-xl font-black tracking-wider uppercase text-white mt-1">
            DEPLOYMENT PROTOCOL
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select match configuration or establish instant peer pairing with a room code.
          </p>
        </div>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <button
            onClick={() => handleSelectMode('LOCAL_2P')}
            className={cn(
              'flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer',
              gameMode === 'LOCAL_2P'
                ? 'border-[#58A6FF] bg-[#58A6FF]/10 text-white shadow-[0_0_15px_rgba(88,166,255,0.2)]'
                : 'border-slate-800 bg-[#0D1117] text-slate-400 hover:border-slate-700'
            )}
          >
            <Users className="w-5 h-5 mb-1.5 text-[#58A6FF]" />
            <span className="text-xs font-bold uppercase">Local 2-Player</span>
            <span className="text-[9px] text-slate-500 font-mono mt-0.5">Split Controls</span>
          </button>

          <button
            onClick={() => handleSelectMode('ONLINE')}
            className={cn(
              'flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer',
              gameMode === 'ONLINE'
                ? 'border-[#D29922] bg-[#D29922]/10 text-white shadow-[0_0_15px_rgba(210,153,34,0.2)]'
                : 'border-slate-800 bg-[#0D1117] text-slate-400 hover:border-slate-700'
            )}
          >
            <Globe className="w-5 h-5 mb-1.5 text-[#D29922]" />
            <span className="text-xs font-bold uppercase">Online Peer</span>
            <span className="text-[9px] text-slate-500 font-mono mt-0.5">Room Code / WebRTC</span>
          </button>

          <button
            onClick={() => handleSelectMode('SOLO_AI')}
            className={cn(
              'flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer',
              gameMode === 'SOLO_AI'
                ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                : 'border-slate-800 bg-[#0D1117] text-slate-400 hover:border-slate-700'
            )}
          >
            <Cpu className="w-5 h-5 mb-1.5 text-emerald-400" />
            <span className="text-xs font-bold uppercase">Solo Bot</span>
            <span className="text-[9px] text-slate-500 font-mono mt-0.5">AI Sparring</span>
          </button>
        </div>

        {/* Online Room Code Management */}
        {gameMode === 'ONLINE' && (
          <div className="space-y-4 p-4 rounded-xl border border-slate-800 bg-[#0D1117]/80">
            {/* Host Section */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Host a Room (Player 1 - Cyan)
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#161B22] border border-slate-700 rounded-lg px-3 py-2 font-mono text-base font-black tracking-widest text-[#58A6FF] text-center">
                  {roomCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-2 rounded-lg border border-[#58A6FF]/50 bg-[#58A6FF]/10 text-[#58A6FF] hover:bg-[#58A6FF]/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'COPIED' : 'COPY'}</span>
                </button>
                <button
                  onClick={generateNewRoom}
                  className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                >
                  NEW
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Share this room code with a friend or open a second browser tab to pair immediately.
              </p>
            </div>

            <div className="border-t border-slate-800/80 my-3" />

            {/* Join Section */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Join an Existing Room (Player 2 - Amber)
              </div>
              <form onSubmit={handleJoinRoom} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="ENTER ROOM CODE (E.G. CYBER-404)"
                  className="flex-1 bg-[#161B22] border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm tracking-wider text-white uppercase placeholder-slate-600 focus:outline-none focus:border-[#D29922]"
                />
                <button
                  type="submit"
                  disabled={connecting}
                  className="px-4 py-2 rounded-lg border border-[#D29922]/50 bg-[#D29922]/10 text-[#D29922] hover:bg-[#D29922]/20 text-xs font-bold tracking-wider uppercase cursor-pointer disabled:opacity-50"
                >
                  {connecting ? 'LINKING...' : 'JOIN'}
                </button>
              </form>
              {errorMsg && (
                <div className="text-[11px] text-red-400 mt-1.5 font-mono">{errorMsg}</div>
              )}
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] font-mono">
              <span className="text-slate-400">Connection Status:</span>
              <span
                className={cn(
                  'font-bold uppercase flex items-center gap-1.5',
                  isConnected && opponentJoined
                    ? 'text-emerald-400'
                    : isConnected
                    ? 'text-yellow-400'
                    : 'text-slate-500'
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isConnected && opponentJoined
                      ? 'bg-emerald-400 animate-pulse'
                      : isConnected
                      ? 'bg-yellow-400'
                      : 'bg-slate-500'
                  )}
                />
                {isConnected && opponentJoined
                  ? 'PEER LINK ACTIVE (2/2)'
                  : isConnected
                  ? 'WAITING FOR PLAYER 2...'
                  : 'DISCONNECTED'}
              </span>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick(1.0);
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-black tracking-widest uppercase cursor-pointer"
          >
            ENTER CONTROL ROOM
          </button>
        </div>
      </div>
    </div>
  );
};
