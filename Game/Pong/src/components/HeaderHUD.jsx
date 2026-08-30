import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Cpu, 
  Users, 
  Radio, 
  RotateCcw,
  Zap
} from 'lucide-react';

export function HeaderHUD({
  gameMode,
  setGameMode,
  role,
  connectionStatus,
  scores,
  rallyCount,
  isMuted,
  toggleSound,
  onOpenSettings,
  onOpenSignaling,
  onRestart,
  theme
}) {
  return (
    <header className="fixed top-0 left-0 w-full z-40 h-14 bg-surface-lowest/90 backdrop-blur-xl border-b border-cyber-cyan/20 px-4 md:px-6 flex items-center justify-between">
      {/* Brand & Logo */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center shadow-glow-cyan">
            <Zap className="w-4 h-4 text-cyber-cyan animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-black text-sm md:text-base tracking-wider text-cyber-cyan text-glow-cyan uppercase">
              PONG_OS <span className="text-slate-400 font-mono text-xs font-normal">v2.04</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest hidden sm:block">
              Host-Authoritative WebRTC Engine
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setGameMode('VS_AI')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              gameMode === 'VS_AI'
                ? 'bg-cyber-cyan text-slate-950 font-bold shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>VS_AI_BOT</span>
          </button>

          <button
            onClick={() => setGameMode('LOCAL_2P')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              gameMode === 'LOCAL_2P'
                ? 'bg-cyber-cyan text-slate-950 font-bold shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>LOCAL_2P</span>
          </button>

          <button
            onClick={() => {
              setGameMode('WEBRTC_P2P');
              if (connectionStatus === 'DISCONNECTED') {
                onOpenSignaling();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              gameMode === 'WEBRTC_P2P'
                ? 'bg-cyber-rose text-white font-bold shadow-glow-rose'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>LAN_WEBRTC</span>
          </button>
        </nav>
      </div>

      {/* Center Scores & Rally Counter */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 glass-panel px-4 py-1.5 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-xs text-cyber-cyan font-bold">P1</span>
            <span className="text-lg font-bold text-cyber-cyan text-glow-cyan">{scores.p1}</span>
          </div>
          <span className="text-slate-600 font-bold">:</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-lg font-bold text-cyber-rose text-glow-rose">{scores.p2}</span>
            <span className="text-xs text-cyber-rose font-bold">P2</span>
          </div>

          {rallyCount > 0 && (
            <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-800 text-[10px] text-cyber-gold font-mono font-bold">
              <span>⚡ RALLY {rallyCount}</span>
            </div>
          )}
        </div>

        {/* Link Status Pill */}
        {gameMode === 'WEBRTC_P2P' && (
          <button
            onClick={onOpenSignaling}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-glow-emerald'
                : connectionStatus === 'GENERATING' || connectionStatus === 'AWAITING_ANSWER'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 animate-pulse'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
            }`}
          >
            {connectionStatus === 'CONNECTED' ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span>{connectionStatus}</span>
            {role && <span className="opacity-75">({role})</span>}
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRestart}
          title="Restart Match"
          className="p-2 text-slate-400 hover:text-cyber-cyan hover:bg-slate-800/60 rounded-lg transition-all border border-transparent hover:border-slate-700"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleSound}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2 text-slate-400 hover:text-cyber-cyan hover:bg-slate-800/60 rounded-lg transition-all border border-transparent hover:border-slate-700"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyber-cyan" />}
        </button>

        <button
          onClick={onOpenSettings}
          title="Match & Graphics Settings"
          className="p-2 text-slate-400 hover:text-cyber-cyan hover:bg-slate-800/60 rounded-lg transition-all border border-transparent hover:border-slate-700"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
