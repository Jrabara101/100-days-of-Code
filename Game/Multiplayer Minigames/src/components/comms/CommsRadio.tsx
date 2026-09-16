import React, { useState } from 'react';
import { Radio, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useHubStore } from '../../store/useHubStore';
import { cn } from '../../lib/utils';

const QUICK_CALLOUTS = [
  '⚡ Power conduits routed!',
  '🛡️ Shielding active!',
  '🎯 Target aligned, fire!',
  '⏳ Standby on mark...',
  '⚠️ Critical alert!',
  '💥 EMP overcharge ready!',
];

export const CommsRadio: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customText, setCustomText] = useState('');
  const radioFeed = useHubStore((s) => s.radioFeed);
  const sendRadioCall = useHubStore((s) => s.sendRadioCall);
  const playerRole = useHubStore((s) => s.playerRole);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    sendRadioCall(text.trim(), playerRole);
    setCustomText('');
  };

  return (
    <div className="w-full rounded-xl border border-slate-800/80 bg-[#161B22]/80 backdrop-blur-md overflow-hidden transition-all">
      {/* Comms Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 py-2 bg-black/40 border-b border-slate-800/80 cursor-pointer hover:bg-black/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-slate-200">
            Control Room Radio Comms
          </span>
          <span className="text-[9px] font-mono text-slate-500">CH-01</span>
        </div>

        <button className="text-slate-400 hover:text-white transition-colors">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Feed Area */}
      <div className={cn('p-3 transition-all', isExpanded ? 'block' : 'hidden md:block')}>
        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
          {radioFeed.map((msg) => {
            const isP1 = msg.sender === 'P1';
            return (
              <div
                key={msg.id}
                className="flex items-baseline gap-2 text-[11px] font-mono leading-relaxed"
              >
                <span className="text-slate-500 text-[9px]">[{msg.time}]</span>
                <span
                  className={cn(
                    'font-bold uppercase tracking-wider',
                    isP1 ? 'text-[#58A6FF]' : 'text-[#D29922]'
                  )}
                >
                  {isP1 ? 'P1-CYAN' : 'P2-AMBER'}:
                </span>
                <span className="text-slate-300">{msg.text}</span>
              </div>
            );
          })}
        </div>

        {/* Quick Callout Chips */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5">
          {QUICK_CALLOUTS.map((call) => (
            <button
              key={call}
              onClick={() => handleSend(call)}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 bg-[#0D1117] text-slate-300 hover:border-slate-600 hover:text-white transition-all cursor-pointer truncate max-w-[180px]"
            >
              {call}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(customText);
          }}
          className="mt-2 flex items-center gap-1.5"
        >
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type tactical message..."
            className="flex-1 bg-[#0D1117] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#58A6FF]"
          />
          <button
            type="submit"
            className="px-2.5 py-1 rounded-lg border border-[#58A6FF]/40 bg-[#58A6FF]/10 text-[#58A6FF] hover:bg-[#58A6FF]/20 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>TX</span>
          </button>
        </form>
      </div>
    </div>
  );
};
