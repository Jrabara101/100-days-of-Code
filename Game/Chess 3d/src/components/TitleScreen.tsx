import React, { useState } from 'react';
import { Bot, Users, Globe, Volume2, VolumeX, Sparkles, Shield, Swords, Mic } from 'lucide-react';
import { BoardSkin, getAvailableSkins } from '../chess3d/Skins';

export type GameMode = 'ai' | 'pass_and_play' | 'online';

interface TitleScreenProps {
  onStartGame: (config: {
    mode: GameMode;
    skinId: string;
    aiDifficulty: 'novice' | 'apprentice' | 'master';
    playerName: string;
    roomId: string;
    isCreatingRoom: boolean;
    rolePreference: 'white' | 'black' | 'auto';
  }) => void;
  selectedSkinId: string;
  onSkinSelect: (skin: BoardSkin) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  selectedSkinId,
  onSkinSelect,
  isMuted,
  onToggleMute,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<'novice' | 'apprentice' | 'master'>('apprentice');
  const [playerName, setPlayerName] = useState(() => 'Grandmaster_' + Math.floor(Math.random() * 899 + 100));
  const [roomId, setRoomId] = useState(() => 'CHESS' + Math.floor(Math.random() * 89 + 10));
  const [isCreatingRoom, setIsCreatingRoom] = useState(true);
  const [rolePreference, setRolePreference] = useState<'white' | 'black' | 'auto'>('auto');

  const skins = getAvailableSkins();

  const handleStart = () => {
    onStartGame({
      mode: selectedMode,
      skinId: selectedSkinId,
      aiDifficulty,
      playerName: playerName.trim() || 'Grandmaster',
      roomId: roomId.trim().toUpperCase() || 'GENERAL',
      isCreatingRoom,
      rolePreference,
    });
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between pointer-events-none p-6 sm:p-10 select-none">
      {/* Top Bar with bespoke lockup and Audio Mute */}
      <div className="flex items-start justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/40">
            {/* Bespoke Crown SVG */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-950 fill-current" strokeWidth="2">
              <path d="M2 19h20v2H2v-2zm1.5-12 4.5 6 4-8 4 8 4.5-6L22 17H2L3.5 7z" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-wider text-slate-100 flex items-center gap-2">
              GRANDMASTER <span className="text-amber-400 text-sm font-mono-code font-semibold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">3D</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono-code tracking-wide">
              REAL-TIME MULTIPLAYER · WEBRTC VOICE · PROCEDURAL PBR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-xl bg-[#0e1420]/90 border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer shadow-md"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Center Setup Modal / Floating Hub */}
      <div className="self-center my-auto w-full max-w-xl pointer-events-auto bg-[#0a0f1d]/95 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
        {/* Game Mode Selection */}
        <div className="mb-6">
          <label className="block text-xs font-mono-code font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            Select Game Experience
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedMode('online')}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                selectedMode === 'online'
                  ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-[#121929] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="relative mb-1.5">
                <Globe className="w-6 h-6" />
                <span className="absolute -top-1 -right-2 flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <span className="text-sm font-semibold">Online Room</span>
              <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Mic className="w-2.5 h-2.5 text-emerald-400" /> Live Voice
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('ai')}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                selectedMode === 'ai'
                  ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-[#121929] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Bot className="w-6 h-6 mb-1.5" />
              <span className="text-sm font-semibold">Vs AI Engine</span>
              <span className="text-[10px] text-slate-400 mt-0.5">3 Tiers</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('pass_and_play')}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                selectedMode === 'pass_and_play'
                  ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-[#121929] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Users className="w-6 h-6 mb-1.5" />
              <span className="text-sm font-semibold">Pass & Play</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Local 2P</span>
            </button>
          </div>
        </div>

        {/* Mode-specific Sub-controls */}
        {selectedMode === 'online' && (
          <div className="space-y-4 mb-6 p-4 rounded-xl bg-[#0f1626] border border-slate-800/80">
            <div className="flex gap-2 p-1 rounded-lg bg-[#0a0f1d] border border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreatingRoom(true)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  isCreatingRoom ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Room
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingRoom(false)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  !isCreatingRoom ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Join Room
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono-code text-slate-400 mb-1">Your Display Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={18}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0f1d] border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono-code text-slate-400 mb-1">Room Code</label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0f1d] border border-slate-700/80 text-sm font-mono-code uppercase text-amber-300 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono-code text-slate-400 mb-1.5">Piece Color</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['auto', 'white', 'black'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRolePreference(r)}
                    className={`py-1.5 rounded-lg border font-medium capitalize transition-all cursor-pointer ${
                      rolePreference === r
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold'
                        : 'bg-[#0a0f1d] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r === 'auto' ? 'Random / First' : r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedMode === 'ai' && (
          <div className="mb-6 p-4 rounded-xl bg-[#0f1626] border border-slate-800/80">
            <label className="block text-xs font-mono-code text-slate-400 mb-2">Engine Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'novice', name: 'Novice', rating: '~900 ELO' },
                { id: 'apprentice', name: 'Apprentice', rating: '~1500 ELO' },
                { id: 'master', name: 'Master', rating: '~2100 ELO' },
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setAiDifficulty(tier.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    aiDifficulty === tier.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-[#0a0f1d] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold">{tier.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono-code mt-0.5">{tier.rating}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Board Skin Carousel Preview */}
        <div className="mb-6">
          <label className="block text-xs font-mono-code font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            Board Skin & PBR Atmosphere
          </label>
          <div className="grid grid-cols-5 gap-2">
            {skins.map((skin) => (
              <button
                key={skin.id}
                type="button"
                onClick={() => onSkinSelect(skin)}
                className={`flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer ${
                  selectedSkinId === skin.id
                    ? 'border-amber-400 bg-amber-500/10 shadow-sm'
                    : 'border-slate-800 bg-[#121929] hover:border-slate-700'
                }`}
                title={skin.description}
              >
                {/* 2-square color swatch */}
                <div className="w-full h-7 rounded-md overflow-hidden flex border border-slate-700/60 mb-1.5">
                  <div
                    className="w-1/2 h-full"
                    style={{ backgroundColor: '#' + skin.lightSquareColor.toString(16).padStart(6, '0') }}
                  />
                  <div
                    className="w-1/2 h-full"
                    style={{ backgroundColor: '#' + skin.darkSquareColor.toString(16).padStart(6, '0') }}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-200 truncate w-full text-center">
                  {skin.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Start CTA */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform active:scale-[0.99] cursor-pointer"
        >
          <Swords className="w-5 h-5" />
          <span>Enter Match</span>
        </button>
      </div>

      {/* Flat Control Hint Line */}
      <div className="w-full text-center pointer-events-auto pb-2">
        <div className="inline-block px-4 py-1.5 rounded-full bg-[#0a0f1d]/90 border border-slate-800 shadow-lg">
          <p className="text-[11px] sm:text-xs text-slate-400 font-mono-code tracking-wide">
            Click & Drag to Orbit · Scroll to Zoom · Click Piece to Move · Space for Voice
          </p>
        </div>
      </div>
    </div>
  );
};
