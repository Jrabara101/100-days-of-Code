import React, { useRef, useState } from 'react';
import { WeeklyRecap, PlayerProfile } from '../../types/telemetry';
import { 
  Calendar, 
  Trophy, 
  Share2, 
  Download, 
  Flame, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Crosshair,
  Check
} from 'lucide-react';

interface RecapViewProps {
  recap: WeeklyRecap;
  player: PlayerProfile;
  onSelectSession: (id: string) => void;
}

export const RecapView: React.FC<RecapViewProps> = ({
  recap,
  player,
  onSelectSession
}) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShareClick = () => {
    // Generate text debrief to clipboard
    const text = `🔥 ChronoStrike Weekly Debrief [${recap.dateRange}]
• Top Moment: ${recap.topMoment.title}
• Biggest Surge: ${recap.biggestImprovement.metric} (${recap.biggestImprovement.delta})
• Combat Win Rate: ${recap.winRate}% (${recap.wins}W in ${recap.matchesPlayed} matches)
• Playtime: ${recap.totalPlaytimeHours}h logged
Operator: ${player.displayName} (${player.rankTier})`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadCard = () => {
    // Canvas-based client-side render to PNG at social 1080x1350 resolution
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#0d1322');
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Cyan border highlight
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 1000, 1270);

    // Title & Header
    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    ctx.fillText('// CHRONOSTRIKE // WEEKLY TELEMETRY DEBRIEF', 80, 120);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 64px "Space Grotesk", sans-serif';
    ctx.fillText(player.displayName, 80, 200);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 32px "JetBrains Mono", monospace';
    ctx.fillText(`${player.rankTier} • ELO ${player.elo}`, 80, 250);

    // Divider
    ctx.strokeStyle = '#1F293D';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 290);
    ctx.lineTo(1000, 290);
    ctx.stroke();

    // Hero stat: Win Rate
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 110px "JetBrains Mono", monospace';
    ctx.fillText(`${recap.winRate}%`, 80, 420);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.fillText(`WIN RATE (${recap.wins}W IN ${recap.matchesPlayed} MATCHES)`, 80, 470);

    // Big improvement block
    ctx.fillStyle = '#111827';
    ctx.fillRect(80, 520, 920, 180);
    ctx.strokeStyle = '#00F0FF33';
    ctx.strokeRect(80, 520, 920, 180);

    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText('BIGGEST PERFORMANCE SURGE', 120, 570);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 44px "Space Grotesk", sans-serif';
    ctx.fillText(`${recap.biggestImprovement.metric}: ${recap.biggestImprovement.delta}`, 120, 630);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '24px sans-serif';
    ctx.fillText(recap.biggestImprovement.context, 120, 670);

    // Top moment
    ctx.fillStyle = '#111827';
    ctx.fillRect(80, 740, 920, 180);
    ctx.strokeStyle = '#F59E0B33';
    ctx.strokeRect(80, 740, 920, 180);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText('TOP COMBAT HIGHLIGHT', 120, 790);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 40px "Space Grotesk", sans-serif';
    ctx.fillText(recap.topMoment.title, 120, 845);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '22px sans-serif';
    ctx.fillText(recap.topMoment.description, 120, 885);

    // Stats Grid Footer
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText(`PLAYTIME: ${recap.totalPlaytimeHours} HOURS`, 80, 1010);
    ctx.fillText(`SIGNATURE WEAPON: ${recap.mvpWeapon}`, 80, 1060);
    ctx.fillText(`TIMEFRAME: ${recap.dateRange}`, 80, 1110);

    // Footer Watermark
    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText('GENERATED VIA CHRONOSTRIKE TELEMETRY // PAIR PROGRAMMED', 80, 1230);

    // Trigger download
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronostrike_weekly_card_${player.displayName}_1080x1350.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-[#0d1322] border border-cyan-500/20 p-5">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h2 className="font-['Space_Grotesk'] text-sm font-bold text-slate-100 uppercase tracking-wider">
              Weekly Debrief // {recap.weekLabel}
            </h2>
          </div>
          <p className="font-['Inter'] text-xs text-slate-400 mt-1">
            Auto-generated every Monday. Summarizes your peak moments, breakthroughs, and weekly hours.
          </p>
        </div>

        {/* Export & Copy buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShareClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#111827] hover:bg-[#1a2233] border border-[#1f293d] text-slate-300 text-xs font-['JetBrains_Mono'] transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleDownloadCard}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#090d16] text-xs font-['Space_Grotesk'] font-bold transition shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            <Download className="w-4 h-4" />
            <span>Download Social Card (1080×1350)</span>
          </button>
        </div>
      </section>

      {/* Main Grid: Card preview + Detailed breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Social Share Card Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full text-center mb-2 font-['JetBrains_Mono'] text-xs text-slate-400">
            // LIVE SHAREABLE CARD PREVIEW (1080×1350 RATIO)
          </div>

          <div
            ref={cardRef}
            className="w-full max-w-[380px] aspect-[4/5] rounded-xl bg-gradient-to-b from-[#090d16] via-[#0d1322] to-[#090d16] border-2 border-cyan-400/40 p-6 shadow-[0_0_40px_rgba(0,240,255,0.15)] flex flex-col justify-between relative overflow-hidden select-none"
          >
            {/* Background cyber grid effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,240,255,0.08),transparent_60%)] pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div>
                <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400 tracking-widest block uppercase">
                  CHRONOSTRIKE // TELEMETRY DEBRIEF
                </span>
                <div className="font-['Space_Grotesk'] text-xl font-black text-slate-100">
                  {player.displayName}
                </div>
                <div className="font-['JetBrains_Mono'] text-xs text-slate-400">
                  {player.rankTier} • ELO {player.elo}
                </div>
              </div>

              {/* Big KPI */}
              <div className="pt-2 border-t border-[#1f293d]">
                <div className="font-['JetBrains_Mono'] text-4xl font-extrabold text-emerald-400">
                  {recap.winRate}%
                </div>
                <div className="font-['Space_Grotesk'] text-xs font-semibold text-slate-300">
                  WIN RATE ({recap.wins}W / {recap.matchesPlayed} MATCHES)
                </div>
              </div>

              {/* Improvement */}
              <div className="p-3 rounded bg-[#111827] border border-cyan-500/20">
                <span className="text-[10px] font-['JetBrains_Mono'] text-cyan-400 block font-bold">
                  BIGGEST IMPROVEMENT
                </span>
                <div className="font-['Space_Grotesk'] text-sm font-bold text-slate-100">
                  {recap.biggestImprovement.metric}: {recap.biggestImprovement.delta}
                </div>
                <div className="text-[10px] text-slate-400 font-['Inter'] mt-0.5">
                  {recap.biggestImprovement.context}
                </div>
              </div>

              {/* Top moment */}
              <div className="p-3 rounded bg-[#111827] border border-amber-500/20">
                <span className="text-[10px] font-['JetBrains_Mono'] text-amber-400 block font-bold">
                  TOP MOMENT
                </span>
                <div className="font-['Space_Grotesk'] text-sm font-bold text-slate-100">
                  {recap.topMoment.title}
                </div>
                <div className="text-[10px] text-slate-400 font-['Inter'] mt-0.5">
                  {recap.topMoment.description}
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="relative z-10 pt-3 border-t border-[#1f293d] flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-slate-500">
              <span>{recap.totalPlaytimeHours}h logged • {recap.mvpWeapon}</span>
              <span className="text-cyan-400 font-bold">#ChronoStrike</span>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Detailed Breakdown Modules */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Moment Deep Dive */}
          <div className="p-5 rounded-lg bg-[#0d1322] border border-[#1f293d] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-['JetBrains_Mono'] text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                Highlight of the Week
              </span>
              <button
                onClick={() => onSelectSession(recap.topMoment.sessionId)}
                className="text-xs font-['JetBrains_Mono'] text-cyan-400 hover:text-cyan-300 underline"
              >
                Inspect Match Event Log
              </button>
            </div>
            <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-100">
              {recap.topMoment.title}
            </h3>
            <p className="font-['Inter'] text-xs text-slate-300 leading-relaxed">
              {recap.topMoment.description}
            </p>
          </div>

          {/* Stat Surge Breakdown */}
          <div className="p-5 rounded-lg bg-[#0d1322] border border-[#1f293d] space-y-2">
            <span className="font-['JetBrains_Mono'] text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Surge: {recap.biggestImprovement.metric} ({recap.biggestImprovement.delta})
            </span>
            <p className="font-['Inter'] text-xs text-slate-300 leading-relaxed">
              {recap.biggestImprovement.context}
            </p>
            <div className="p-3 rounded bg-[#090d16] border border-[#1f293d] flex items-center justify-between text-xs font-['JetBrains_Mono'] text-slate-400">
              <span>Primary Driver: Evening Warm-up routines</span>
              <span className="text-emerald-400 font-bold">+18.2% Headshot Conv.</span>
            </div>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-3 gap-3 font-['JetBrains_Mono'] text-xs">
            <div className="p-3.5 rounded bg-[#0d1322] border border-[#1f293d]">
              <span className="text-[10px] text-slate-500 block">TOTAL PLAYTIME</span>
              <span className="text-lg font-bold text-slate-100 tabular-nums">
                {recap.totalPlaytimeHours}h
              </span>
            </div>
            <div className="p-3.5 rounded bg-[#0d1322] border border-[#1f293d]">
              <span className="text-[10px] text-slate-500 block">MATCHES PLAYED</span>
              <span className="text-lg font-bold text-slate-100 tabular-nums">
                {recap.matchesPlayed}
              </span>
            </div>
            <div className="p-3.5 rounded bg-[#0d1322] border border-[#1f293d]">
              <span className="text-[10px] text-slate-500 block">SIGNATURE WEAPON</span>
              <span className="text-sm font-bold text-cyan-300 truncate block mt-1">
                {recap.mvpWeapon}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
