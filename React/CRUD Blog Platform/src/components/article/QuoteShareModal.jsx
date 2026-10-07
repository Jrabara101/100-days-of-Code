import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { useToast } from '../../context/ToastContext';
import { X, Copy, Check, Share2, Quote } from 'lucide-react';

export const QuoteShareModal = () => {
  const { quoteShareData, setQuoteShareData } = useBlog();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!quoteShareData.isOpen) return null;

  const { quote, author, title } = quoteShareData;

  const handleCopyQuoteText = () => {
    const formatted = `"${quote}"\n\n— ${author}, "${title}" on Chronicle & Codex`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    showToast('Quote card text copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `"${quote}" — ${author}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      handleCopyQuoteText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#1B1C21] rounded-3xl shadow-2xl border border-[#E5E5DF] dark:border-[#26272C] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#E5E5DF] dark:border-[#26272C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Quote className="w-4 h-4 text-[#E11D48]" />
            <h4 className="font-serif font-bold text-sm text-[#18181B] dark:text-[#F4F4F6]">
              Quote Card Preview
            </h4>
          </div>
          <button
            onClick={() => setQuoteShareData({ isOpen: false, quote: '', author: '', title: '' })}
            className="p-1 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The Card Stage */}
        <div className="p-6 sm:p-8 bg-[#F3F3EE]/60 dark:bg-[#141518]/60 flex items-center justify-center">
          <div className="w-full bg-[#FAFAF8] dark:bg-[#0C0D0E] border border-[#E5E5DF] dark:border-[#26272C] rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
            {/* Ambient Watermark */}
            <div className="absolute top-2 right-4 text-7xl font-serif text-[#18181B]/5 dark:text-white/5 select-none pointer-events-none">
              “
            </div>

            {/* Wordmark */}
            <div className="flex items-center gap-2 mb-6">
              <span className="w-5 h-5 rounded bg-[#18181B] dark:bg-[#F4F4F6] text-white dark:text-[#18181B] flex items-center justify-center font-serif text-xs font-bold">
                C
              </span>
              <span className="text-[11px] font-mono tracking-wider uppercase text-[#71717A] dark:text-[#9496A1]">
                Chronicle &amp; Codex
              </span>
            </div>

            {/* Quote Body */}
            <blockquote className="font-serif italic text-lg sm:text-xl text-[#18181B] dark:text-[#F4F4F6] leading-relaxed mb-6">
              "{quote}"
            </blockquote>

            {/* Attribution */}
            <div className="pt-4 border-t border-[#E5E5DF]/70 dark:border-[#26272C]/70 flex items-center justify-between">
              <div>
                <p className="font-sans font-semibold text-xs text-[#18181B] dark:text-[#F4F4F6]">
                  {author}
                </p>
                <p className="font-serif text-[11px] text-[#71717A] dark:text-[#9496A1] italic truncate max-w-xs">
                  {title}
                </p>
              </div>
              <span className="font-mono text-[10px] text-[#E11D48] bg-[#E11D48]/10 px-2 py-0.5 rounded-full">
                Editorial Excerpt
              </span>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 px-6 border-t border-[#E5E5DF] dark:border-[#26272C] flex items-center justify-end gap-2.5">
          <button
            onClick={handleCopyQuoteText}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl border border-[#E5E5DF] dark:border-[#26272C] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] text-[#18181B] dark:text-[#F4F4F6] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Card Text'}</span>
          </button>
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Quote</span>
          </button>
        </div>
      </div>
    </div>
  );
};
