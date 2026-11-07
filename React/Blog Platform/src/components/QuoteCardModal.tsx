import React, { useState } from 'react';
import { useReader } from '../context/ReaderContext';
import { X, Copy, Download, Check, Share2, Sparkles, Feather } from 'lucide-react';
import confetti from 'canvas-confetti';

export const QuoteCardModal: React.FC = () => {
  const { quoteCard, closeQuoteCard, settings } = useReader();
  const [copied, setCopied] = useState(false);
  const [cardTheme, setCardTheme] = useState<'paper' | 'midnight' | 'vermilion'>('paper');

  if (!quoteCard.isOpen) return null;

  const handleCopyText = () => {
    const formatted = `“${quoteCard.quoteText.trim()}”\n\n— ${quoteCard.authorName}, in "${quoteCard.articleTitle}"\nVia The Chronicle & Essayist`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);

    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden transition-all duration-200 ${
          settings.palette === 'midnight'
            ? 'bg-[#181B22] border-white/10 text-white'
            : settings.palette === 'sepia'
            ? 'bg-[#EFE5CD] border-[#3B3228]/20 text-[#3B3228]'
            : 'bg-[#FAF8F5] border-black/10 text-[#18181B]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-inherit">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-600 text-white text-xs font-serif font-bold">
              ”
            </span>
            <div>
              <h3 className="font-serif font-bold text-lg">Editorial Quote Card</h3>
              <p className="text-xs opacity-60 font-interface">
                Share high-resolution typography cards or copy formatted citation.
              </p>
            </div>
          </div>
          <button
            onClick={closeQuoteCard}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Card Theme Switcher */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono-tabular uppercase opacity-60">Canvas Palette:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCardTheme('paper')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  cardTheme === 'paper'
                    ? 'bg-neutral-800 text-white dark:bg-white dark:text-black font-bold'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                Parchment
              </button>
              <button
                onClick={() => setCardTheme('midnight')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  cardTheme === 'midnight'
                    ? 'bg-neutral-800 text-white dark:bg-white dark:text-black font-bold'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                Midnight Ink
              </button>
              <button
                onClick={() => setCardTheme('vermilion')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  cardTheme === 'vermilion'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                Vermilion
              </button>
            </div>
          </div>

          {/* The Visual Card */}
          <div
            id="quote-card-preview"
            className={`p-7 rounded-2xl shadow-lg border transition-all duration-300 relative overflow-hidden ${
              cardTheme === 'midnight'
                ? 'bg-[#0F1115] text-[#FAF8F5] border-white/10'
                : cardTheme === 'vermilion'
                ? 'bg-gradient-to-br from-rose-900 to-rose-950 text-white border-rose-800'
                : 'bg-[#FAF8F5] text-[#18181B] border-neutral-300'
            }`}
          >
            {/* Watermark / Seal */}
            <div className="flex items-center justify-between border-b border-current/15 pb-3 mb-5 text-[11px] font-mono-tabular opacity-75">
              <span className="font-bold tracking-wider">THE CHRONICLE &amp; ESSAYIST</span>
              <span>ISSUE № 48 • CANON</span>
            </div>

            {/* Giant quotation symbol */}
            <div className="text-4xl font-serif opacity-30 leading-none -mb-3">“</div>

            {/* Quote Body */}
            <p className="font-serif text-lg sm:text-xl leading-relaxed italic mb-6 tracking-tight">
              {quoteCard.quoteText}
            </p>

            {/* Attribution */}
            <div className="flex items-center justify-between border-t border-current/15 pt-4 text-xs">
              <div>
                <div className="font-semibold">{quoteCard.authorName}</div>
                <div className="text-[11px] opacity-70 italic line-clamp-1">
                  {quoteCard.articleTitle}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono-tabular font-bold border border-current/30 uppercase">
                  {quoteCard.categoryName || 'Editorial'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-inherit bg-black/5 dark:bg-white/5">
          <span className="text-[11px] font-mono-tabular opacity-60">
            Rendered with 65ch Typographic Fidelity
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-inherit hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied Text!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Citation</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                handleCopyText();
                closeQuoteCard();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy &amp; Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
