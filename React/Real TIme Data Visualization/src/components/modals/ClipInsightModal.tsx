import React, { useState } from 'react';
import { useTelemetry, METRIC_METAS } from '../../context/TelemetryContext';
import { Camera, Check, Copy, Download, Share2, Sparkles, X } from 'lucide-react';

export const ClipInsightModal: React.FC = () => {
  const { isClipModalOpen, setIsClipModalOpen, clipTargetWidget, getLatestPoint } = useTelemetry();
  const [comment, setComment] = useState('Observed immediate conversion surge post-release. Sharing with product growth team.');
  const [copied, setCopied] = useState(false);

  if (!isClipModalOpen || !clipTargetWidget) return null;

  const meta = METRIC_METAS[clipTargetWidget.metricId];
  const latestPoint = getLatestPoint(clipTargetWidget.metricId);

  const handleCopyCard = () => {
    const text = `📊 Luminous Telemetry Insight: ${clipTargetWidget.title}\nTakeaway: ${clipTargetWidget.subtitle}\nLive Value: ${latestPoint ? meta.format(latestPoint.value) : 'Nominal'}\nNote: "${comment}"\nTimestamp: ${new Date().toLocaleTimeString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    alert('📸 Story card formatted for Slack & executive decks! Markdown snippet copied to clipboard.');
    handleCopyCard();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[#11141B] border border-white/10 p-6 shadow-glass text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
              Clip Insight to Story Card
            </h3>
          </div>
          <button
            onClick={() => setIsClipModalOpen(false)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Card Snapshot Preview */}
        <div className="p-4 rounded-xl bg-[#171B24] border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 font-bold text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              {clipTargetWidget.title}
            </span>
            <span>{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</span>
          </div>

          <div className="text-base font-semibold text-white leading-snug">
            "{clipTargetWidget.subtitle}"
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-white/5 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Live Metric</span>
              <div className="text-xl font-bold text-white">
                {latestPoint ? meta.format(latestPoint.value) : '---'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase">Baseline Envelope</span>
              <div className="text-sm text-slate-400">
                {latestPoint ? meta.format(latestPoint.baseline) : '---'}
              </div>
            </div>
          </div>
        </div>

        {/* Comment input */}
        <div className="space-y-1.5 text-xs">
          <label className="text-slate-300 font-medium">Add Team Context / Hypothesis:</label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-[#171B24] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-sky-400 font-sans resize-none"
            placeholder="Type your notes..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] font-mono text-slate-400">
            Ready for Slack, Notion & Slides
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsClipModalOpen(false)}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCopyCard}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-glow-cyan flex items-center gap-1.5"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied Card!' : 'Copy to Clipboard'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
