import React, { useState } from 'react';
import { useReader } from '../context/ReaderContext';
import { X, Trash2, Download, Copy, Check, Scissors, BookOpen, ExternalLink } from 'lucide-react';
import { exportClippingsAsMarkdown } from '../services/editorialEngine';
import confetti from 'canvas-confetti';

export const NotebookDrawer: React.FC = () => {
  const { highlights, deleteHighlight, isNotebookOpen, setIsNotebookOpen, settings } = useReader();
  const [copied, setCopied] = useState(false);

  if (!isNotebookOpen) return null;

  const handleCopyMarkdown = () => {
    const md = exportClippingsAsMarkdown(highlights);
    navigator.clipboard.writeText(md);
    setCopied(true);

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {}

    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const md = exportClippingsAsMarkdown(highlights);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chronicle-Notebook-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-fade-in">
      <div
        className={`w-full max-w-md h-full flex flex-col shadow-2xl border-l transition-all duration-300 ${
          settings.palette === 'midnight'
            ? 'bg-[#181B22] border-white/10 text-white'
            : settings.palette === 'sepia'
            ? 'bg-[#F4ECD8] border-[#3B3228]/20 text-[#3B3228]'
            : 'bg-[#FAF8F5] border-black/10 text-[#18181B]'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg">Personal Notebook</h2>
              <p className="text-xs opacity-60 font-mono-tabular">
                {highlights.length} Saved {highlights.length === 1 ? 'Clipping' : 'Clippings'} &amp;
                Quotes
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNotebookOpen(false)}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* Action bar for export */}
        {highlights.length > 0 && (
          <div className="px-5 py-3 border-b border-inherit bg-black/5 dark:bg-white/5 flex items-center justify-between gap-2">
            <span className="text-xs font-mono-tabular opacity-70">Single Markdown Digest</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-inherit hover:border-amber-600 hover:text-amber-600 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy MD</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .md</span>
              </button>
            </div>
          </div>
        )}

        {/* Highlights List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {highlights.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 mx-auto flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 opacity-40" />
              </div>
              <h3 className="font-serif font-bold text-base mb-1">Your notebook is pristine</h3>
              <p className="text-xs opacity-60 leading-relaxed max-w-xs mx-auto">
                Highlight any sentence or paragraph in an essay to save quotes, generate social
                quote cards, or compile personal study digests.
              </p>
            </div>
          ) : (
            highlights.map((hl) => (
              <div
                key={hl.id}
                className={`p-4 rounded-xl border border-inherit transition-all relative group ${
                  settings.palette === 'midnight'
                    ? 'bg-[#1F232D]'
                    : settings.palette === 'sepia'
                    ? 'bg-[#EDE2CB]'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono-tabular tracking-wider uppercase px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 opacity-80">
                    {hl.categoryName || 'Essay'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-tabular opacity-50">
                      {new Date(hl.savedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => deleteHighlight(hl.id)}
                      title="Remove clipping"
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-opacity p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs font-serif italic mb-2 leading-relaxed opacity-90 border-l-2 border-rose-500 pl-3">
                  “{hl.selectedText}”
                </div>

                <div className="text-[11px] font-medium opacity-60 truncate">
                  From: {hl.articleTitle}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-inherit text-[11px] font-mono-tabular opacity-60 text-center">
          Persisted in Local Storage • Never Uploaded to Ad Networks
        </div>
      </div>
    </div>
  );
};
