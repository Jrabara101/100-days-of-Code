import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Palette,
  Camera,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Volume1,
  Headphones,
  Flag,
  RotateCcw,
  BookOpen,
  Home,
  Check,
  Eye,
  HelpCircle,
} from 'lucide-react';
import { BoardSkin, getAvailableSkins } from '../chess3d/Skins';
import { CameraPreset } from '../chess3d/SceneManager';
import { VoiceStatus } from '../multiplayer/VoiceChat';

interface BottomControlDockProps {
  activeSkin: BoardSkin;
  onSkinChange: (skin: BoardSkin) => void;
  cameraPreset: CameraPreset;
  onCameraChange: (preset: CameraPreset) => void;
  // Audio & Voice
  isSoundMuted: boolean;
  onToggleSoundMute: () => void;
  voiceStatus: VoiceStatus;
  isVoiceMuted: boolean;
  isDeafened: boolean;
  isPushToTalk: boolean;
  audioLevel: number;
  onToggleVoiceMute: () => void;
  onToggleDeafen: () => void;
  onTogglePushToTalk: () => void;
  onJoinVoice: () => void;
  // Game Actions
  onResign: () => void;
  onRestart: () => void;
  onToggleHistory: () => void;
  isHistoryOpen: boolean;
  onOpenRules?: () => void;
  onExitToMenu: () => void;
  isOnline: boolean;
  isGameOver: boolean;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  activeSkin,
  onSkinChange,
  cameraPreset,
  onCameraChange,
  isSoundMuted,
  onToggleSoundMute,
  voiceStatus,
  isVoiceMuted,
  isDeafened,
  isPushToTalk,
  audioLevel,
  onToggleVoiceMute,
  onToggleDeafen,
  onTogglePushToTalk,
  onJoinVoice,
  onResign,
  onRestart,
  onToggleHistory,
  isHistoryOpen,
  onOpenRules,
  onExitToMenu,
  isOnline,
  isGameOver,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'skins' | 'camera' | 'voice' | 'actions'>('skins');
  const skins = getAvailableSkins();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'h' || e.key === 'H') && (e.target as HTMLElement).tagName !== 'INPUT') {
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[860px] transition-transform duration-300 pointer-events-auto select-none ${
        isCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Tab */}
      <div className="flex justify-center -mb-px">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-4 py-1 rounded-t-lg bg-[#0e1626] border-t border-x border-slate-700/80 text-[11px] font-mono-code font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> Show Controls (H)
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> Cinema Mode (H)
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container (Solid / rgba surface - strictly zero backdrop-filter over WebGL) */}
      <div className="bg-[#0b1220]/95 border border-slate-700/90 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-black/80">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5 px-1">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('skins')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'skins'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Skins</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'voice'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Audio & Voice</span>
              {voiceStatus === 'connected' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'actions'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Match</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleHistory}
              className={`p-1.5 rounded-lg border text-xs font-mono-code transition-all cursor-pointer flex items-center gap-1 ${
                isHistoryOpen
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-[#121a2d] border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
              title="Move History"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notation</span>
            </button>

            {onOpenRules && (
              <button
                type="button"
                onClick={onOpenRules}
                className="p-1.5 rounded-lg bg-[#121a2d] border border-slate-700/60 text-slate-400 hover:text-amber-300 hover:border-slate-500 transition-all cursor-pointer flex items-center gap-1 text-xs"
                title="How to Move Pieces & Chess Rules"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Guide</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExitToMenu}
              className="p-1.5 rounded-lg bg-[#121a2d] border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all cursor-pointer"
              title="Return to Menu"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="min-h-[52px] flex items-center">
          {/* TAB 1: BOARD SKINS */}
          {activeTab === 'skins' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full">
              {skins.map((skin) => (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => onSkinChange(skin)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer text-left ${
                    activeSkin.id === skin.id
                      ? 'border-amber-400 bg-amber-500/15 text-amber-200 shadow-sm'
                      : 'border-slate-800 bg-[#0f1728] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex border border-slate-700 shrink-0">
                    <div
                      className="w-1/2 h-full"
                      style={{ backgroundColor: '#' + skin.lightSquareColor.toString(16).padStart(6, '0') }}
                    />
                    <div
                      className="w-1/2 h-full"
                      style={{ backgroundColor: '#' + skin.darkSquareColor.toString(16).padStart(6, '0') }}
                    />
                  </div>
                  <div className="truncate min-w-0">
                    <div className="text-xs font-semibold truncate flex items-center gap-1">
                      {skin.name}
                      {activeSkin.id === skin.id && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{skin.badge}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* TAB 2: CAMERA PRESETS */}
          {activeTab === 'camera' && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full">
              {[
                { id: 'white', label: 'White POV', hint: 'Front 3D' },
                { id: 'black', label: 'Black POV', hint: 'Opponent 3D' },
                { id: 'tactical', label: 'Tactical', hint: 'Top-Down 2D/3D' },
                { id: 'cinematic', label: 'Cinematic', hint: 'Smooth Orbit' },
                { id: 'free', label: 'Free Orbit', hint: 'Manual 360°' },
              ].map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => onCameraChange(cam.id as CameraPreset)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                    cameraPreset === cam.id
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-semibold shadow-sm'
                      : 'border-slate-800 bg-[#0f1728] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs">{cam.label}</span>
                  <span className="text-[9px] text-slate-400 font-mono-code">{cam.hint}</span>
                </button>
              ))}
            </div>
          )}

          {/* TAB 3: VOICE CHAT & AUDIO */}
          {activeTab === 'voice' && (
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                {/* Voice Status & Connect Button */}
                {voiceStatus === 'idle' || voiceStatus === 'denied' || voiceStatus === 'error' ? (
                  <button
                    type="button"
                    onClick={onJoinVoice}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-md shadow-emerald-700/20"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Join Voice Chat</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onToggleVoiceMute}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isVoiceMuted
                          ? 'bg-red-500/20 border-red-500/60 text-red-300'
                          : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                      }`}
                    >
                      {isVoiceMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                      <span>{isVoiceMuted ? 'Mic Muted' : 'Mic Active'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onToggleDeafen}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isDeafened
                          ? 'bg-red-500/20 border-red-500/60 text-red-300'
                          : 'bg-[#121929] border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                      title={isDeafened ? 'Undeafen' : 'Deafen'}
                    >
                      <Headphones className="w-4 h-4" />
                      <span className="hidden sm:inline">{isDeafened ? 'Deafened' : 'Audio On'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onTogglePushToTalk}
                      className={`px-3 py-2 rounded-xl border text-xs font-mono-code transition-all cursor-pointer ${
                        isPushToTalk
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-[#121929] border-slate-700 text-slate-400'
                      }`}
                    >
                      {isPushToTalk ? 'PTT (Hold Space/T)' : 'Open Mic'}
                    </button>

                    {/* Live Audio Level Meter */}
                    {!isVoiceMuted && (
                      <div className="flex items-center gap-1 px-2 py-2 rounded-lg bg-[#070b14] border border-slate-800">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 transition-all duration-75"
                            style={{ width: `${Math.min(100, Math.round(audioLevel * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Master Sound Effects Mute Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleSoundMute}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isSoundMuted
                      ? 'bg-red-500/15 border-red-500/40 text-red-300'
                      : 'bg-[#121929] border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {isSoundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  <span>{isSoundMuted ? 'SFX Muted' : 'SFX On'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: MATCH ACTIONS */}
          {activeTab === 'actions' && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRestart}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#121a2d] border border-slate-700 text-slate-200 hover:border-slate-500 text-xs font-semibold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>{isGameOver ? 'Play Rematch' : 'New Match'}</span>
                </button>

                {!isGameOver && (
                  <button
                    type="button"
                    onClick={onResign}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 hover:bg-red-900/60 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Flag className="w-4 h-4 text-red-400" />
                    <span>Resign</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] font-mono-code text-slate-400">
                {isOnline ? 'Real-time WebSocket Synchronized' : 'Local Engine Session'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
