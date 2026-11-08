import React, { useState } from 'react';
import { LabFile } from '../../types';
import { Download, FileCode, Check, Copy } from 'lucide-react';
import { sounds } from '../../services/audioEffects';

interface LabFilesRailProps {
  resources: LabFile[];
}

export const LabFilesRail: React.FC<LabFilesRailProps> = ({ resources }) => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const handleCopy = (fileName: string, code?: string) => {
    if (!code) return;
    sounds.playClick();
    navigator.clipboard.writeText(code);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#11141C] text-slate-200 overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] font-mono text-slate-400">
        <span>DOWNLOADABLE LAB STARTER FILES</span>
        <span>{resources.length} Artifacts</span>
      </div>

      {resources.map(file => (
        <div
          key={file.name}
          className="p-4 rounded-2xl bg-[#171B26] border border-white/10 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-white block">
                  {file.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {file.size} • {file.language.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={() => { sounds.playSuccess(); }}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {file.description}
          </p>

          {file.codeSnippet && (
            <div className="relative rounded-xl bg-black/60 border border-white/10 p-3 overflow-x-auto">
              <button
                onClick={() => handleCopy(file.name, file.codeSnippet)}
                className="absolute top-2 right-2 p-1 rounded bg-white/10 text-slate-300 hover:text-white text-[10px] flex items-center gap-1"
              >
                {copiedFile === file.name ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <pre className="text-[11px] font-mono text-emerald-300 whitespace-pre">
                {file.codeSnippet}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

