import React, { useState } from 'react';
import { Copy, Check, Code, FileText } from 'lucide-react';

export default function TextCodeReader({ file }) {
  const [copied, setCopied] = useState(false);
  const content = file.content || 'No text content available.';
  const lines = content.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="p-2.5 bg-surface-container-low flex items-center justify-between border-b border-surface-container">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-secondary" />
          <span className="text-xs font-mono font-medium text-primary">
            {lines.length} lines • {content.length} bytes • UTF-8 Plaintext
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-xs font-mono text-on-secondary-container transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text Body with Line Numbers */}
      <div className="relative w-full max-h-[400px] overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-900/60">
                <td className="w-10 pr-3 text-right text-slate-600 select-none text-[11px]">
                  {idx + 1}
                </td>
                <td className="whitespace-pre-wrap break-all text-slate-300">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

