import React, { useRef, useEffect } from 'react';
import { 
  Activity, 
  Terminal, 
  Gauge, 
  Clock, 
  Send, 
  Download, 
  Zap, 
  Trash2 
} from 'lucide-react';

export function TelemetrySidebar({
  telemetry,
  debugLogs,
  currentSpeed,
  rallyCount,
  gameMode,
  role,
  onClearLogs,
  isOpen,
  setIsOpen
}) {
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [debugLogs]);

  return (
    <aside
      className={`fixed right-0 top-14 bottom-8 z-30 transition-all duration-300 flex ${
        isOpen ? 'w-80' : 'w-0'
      }`}
    >
      {/* Sidebar Toggle Tab */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-8 top-6 bg-slate-900/90 border-y border-l border-slate-700 text-cyber-cyan p-1.5 rounded-l-lg hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg"
        title="Toggle System Telemetry"
      >
        <Activity className="w-4 h-4" />
      </button>

      {/* Main Telemetry Body */}
      <div className="w-full h-full glass-panel border-l border-cyber-cyan/20 p-4 flex flex-col gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyber-cyan" />
            <h2 className="text-xs font-mono font-bold text-cyber-cyan uppercase tracking-wider">
              SYSTEM_TELEMETRY
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500">60 Hz POLLING</span>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          {/* Latency / RTT */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>LATENCY (RTT)</span>
              <Gauge className="w-3 h-3 text-cyber-cyan" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-bold ${
                telemetry.rtt < 30 ? 'text-emerald-400' : telemetry.rtt < 80 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {gameMode === 'WEBRTC_P2P' ? `${telemetry.rtt} ms` : 'LOCAL (0 ms)'}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
              <div
                className="bg-cyber-cyan h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (telemetry.rtt / 150) * 100)}%` }}
              />
            </div>
          </div>

          {/* Jitter */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>JITTER</span>
              <Clock className="w-3 h-3 text-cyber-rose" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-slate-200">
                {gameMode === 'WEBRTC_P2P' ? `${telemetry.jitter} ms` : '0.0 ms'}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
              <div
                className="bg-cyber-rose h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (telemetry.jitter / 20) * 100)}%` }}
              />
            </div>
          </div>

          {/* Packet Rate */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>PACKET RATE</span>
              <Send className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-emerald-400">
                {gameMode === 'WEBRTC_P2P' ? `${telemetry.packetRate} Hz` : '60 Hz (SIM)'}
              </span>
            </div>
          </div>

          {/* Ball Speed */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>BALL VELOCITY</span>
              <Zap className="w-3 h-3 text-cyber-gold" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-cyber-gold">
                {currentSpeed.toFixed(1)} px/f
              </span>
            </div>
            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
              <div
                className="bg-cyber-gold h-full transition-all duration-200"
                style={{ width: `${Math.min(100, (currentSpeed / 16.0) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Transmission Stats */}
        {gameMode === 'WEBRTC_P2P' && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex justify-between items-center text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <Send className="w-3 h-3 text-cyber-cyan" />
              <span>TX: {telemetry.packetsSent}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Download className="w-3 h-3 text-cyber-rose" />
              <span>RX: {telemetry.packetsReceived}</span>
            </div>
            <div className="text-slate-500">
              OFFSET: {telemetry.clockOffset}ms
            </div>
          </div>
        )}

        {/* Debug Log Console */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/90 rounded-xl border border-slate-800 p-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono font-bold">
              <Terminal className="w-3 h-3 text-cyber-cyan" />
              <span>CONSOLE_STREAM</span>
            </div>
            <button
              onClick={onClearLogs}
              title="Clear Console"
              className="text-slate-600 hover:text-slate-400 transition-colors p-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <div
            ref={logContainerRef}
            className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 pr-1 text-slate-400 selection:bg-cyber-cyan selection:text-slate-950"
          >
            {debugLogs.length === 0 ? (
              <div className="text-slate-600 italic">&gt; Console ready.</div>
            ) : (
              debugLogs.map((log, i) => (
                <div
                  key={i}
                  className={`leading-tight break-all ${
                    log.includes('ERROR')
                      ? 'text-rose-400'
                      : log.includes('connected') || log.includes('OPEN')
                      ? 'text-emerald-400 font-bold'
                      : log.includes('SDP') || log.includes('WebRTC')
                      ? 'text-cyber-cyan'
                      : 'text-slate-400'
                  }`}
                >
                  &gt; {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
