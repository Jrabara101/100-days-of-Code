import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Code,
  ExternalLink,
  QrCode,
  MessageSquare,
  Maximize2,
  Layout,
  Sparkles,
  Smartphone
} from 'lucide-react';

export default function ShareAndEmbedSuite({ survey, onLaunchRunner }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeEmbedTab, setActiveEmbedTab] = useState('inline'); // 'inline' | 'popup' | 'slideover' | 'chat_bubble'

  const shareUrl = `${window.location.origin}/s/${survey.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getEmbedSnippet = () => {
    switch (activeEmbedTab) {
      case 'inline':
        return `<iframe\n  src="${shareUrl}"\n  width="100%"\n  height="650"\n  frameborder="0"\n  style="border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);"\n  allow="camera; microphone; autoplay"\n></iframe>`;

      case 'popup':
        return `<script src="https://pulseflow.app/embed.js" async></script>\n<button\n  data-pulseflow-popup="${survey.slug}"\n  style="padding: 12px 24px; background: #4F46E5; color: white; border-radius: 8px; font-weight: bold;"\n>\n  Take 2-Min Assessment\n</button>`;

      case 'slideover':
        return `<script src="https://pulseflow.app/embed.js" async></script>\n<button\n  data-pulseflow-slideover="${survey.slug}"\n  style="position: fixed; right: 0; top: 40%; transform: rotate(-90deg); background: #121418; color: white; padding: 8px 16px; border-radius: 8px 8px 0 0;"\n>\n  Feedback ✦\n</button>`;

      case 'chat_bubble':
        return `<script\n  src="https://pulseflow.app/bubble.js"\n  data-survey-slug="${survey.slug}"\n  data-theme="dark"\n  data-brand-color="#4F46E5"\n  async\n></script>`;

      default:
        return '';
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getEmbedSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 bg-[#0A0B0E] p-6 sm:p-10 overflow-y-auto h-[calc(100vh-65px)]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="pb-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-brand-light" />
              <span>Omni-Channel Distribution & Embedding Suite</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Distribute your conversational experience across landing pages, modals, slide-overs, and social previews.
            </p>
          </div>

          <button
            type="button"
            onClick={onLaunchRunner}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white text-xs font-semibold shadow-glow-brand transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Launch Live Runner</span>
          </button>
        </div>

        {/* 1. Direct Share Link Box */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#121418] space-y-3">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
            Direct Public Share Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#161820] border border-white/10 rounded-xl px-4 py-3 font-mono text-xs sm:text-sm text-slate-300 truncate select-all">
              {shareUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors shrink-0"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* 2. Dynamic Social Sharing & OpenGraph Preview Card */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#121418] space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Dynamic OpenGraph Preview Card
            </label>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
              ⚡ Auto-Generated
            </span>
          </div>

          {/* Social Card Simulation */}
          <div className="max-w-md mx-auto border border-white/15 rounded-2xl overflow-hidden bg-[#161820] shadow-2xl transition-transform hover:scale-[1.01]">
            <div className="h-44 bg-gradient-to-br from-brand/40 to-black relative overflow-hidden flex items-center justify-center p-6 text-center">
              {survey.cover_image && (
                <img
                  src={survey.cover_image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-35 filter brightness-75"
                />
              )}
              <div className="relative z-10 space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-brand/30 border border-brand/50 text-white backdrop-blur-md">
                  {survey.type === 'scored_quiz' ? 'Certified Knowledge Test' : survey.type === 'personality_assessment' ? 'Personality Assessment' : 'Conversational Survey'}
                </span>
                <h3 className="text-lg font-extrabold text-white leading-snug drop-shadow-md">
                  {survey.title}
                </h3>
              </div>
            </div>

            <div className="p-4 space-y-2 text-left">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                pulseflow.app • 2 min completion
              </div>
              <div className="text-xs text-slate-300 line-clamp-2">
                {survey.description}
              </div>
              <div className="pt-2 flex items-center justify-between text-[11px] text-brand-light font-mono">
                <span>✦ Keyboard-first typing</span>
                <span>{survey.questions.length} questions</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Multi-Format Embedding Suite */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#121418] space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Multi-Format Embedding Suite</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose an embed configuration to match your website design and user flow.
            </p>
          </div>

          {/* Embed Mode Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'inline', label: 'Inline Iframe', icon: Layout },
              { id: 'popup', label: 'Corner Popup', icon: Maximize2 },
              { id: 'slideover', label: 'Full Slide-Over', icon: ExternalLink },
              { id: 'chat_bubble', label: 'Chat-Bubble Popover', icon: MessageSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeEmbedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveEmbedTab(tab.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    isActive
                      ? 'border-brand bg-brand/10 text-white shadow-glow-brand ring-1 ring-brand/40'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Code Snippet Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Embed Code Snippet</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-brand-light hover:text-white transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied to Clipboard' : 'Copy Snippet'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl border border-white/10 bg-[#0B0C0E] font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
              <code>{getEmbedSnippet()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
