import { useState } from 'react';
import { Check, Copy, Code2 } from 'lucide-react';
import type { CodeAttachment } from '../../types/chat';

interface CodeBlockCardProps {
  attachment: CodeAttachment;
}

export function CodeBlockCard({ attachment }: CodeBlockCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard?.writeText(attachment.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-divider bg-[#0D1017] text-slate-100 text-xs">
      <div className="px-3 py-1.5 bg-[#151924] border-b border-white/10 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
          <Code2 className="w-3.5 h-3.5 text-blue-400" />
          {attachment.filename ?? attachment.language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] text-slate-300 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto font-mono text-[11.5px] leading-relaxed text-sky-100">
        <code>{attachment.code}</code>
      </pre>
    </div>
  );
}

