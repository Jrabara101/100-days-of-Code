import React, { useState, useRef, useEffect } from 'react';
import { InlineGlossaryItem } from '../types';
import { HelpCircle, ExternalLink, BookOpen, BarChart2, X } from 'lucide-react';
import { useReader } from '../context/ReaderContext';

interface InlineFootnotePopoverProps {
  item: InlineGlossaryItem;
  children: React.ReactNode;
  onNavigateArticle?: (articleId: string) => void;
}

export const InlineFootnotePopover: React.FC<InlineFootnotePopoverProps> = ({
  item,
  children,
  onNavigateArticle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const { settings } = useReader();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <span ref={containerRef} className="relative inline-block">
      {/* Trigger word */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="inline-flex items-center gap-0.5 text-inherit underline decoration-rose-500/50 decoration-2 underline-offset-4 hover:decoration-rose-600 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors cursor-pointer"
      >
        <span>{children}</span>
        <span className="text-[10px] font-mono-tabular opacity-60 ml-0.5 text-rose-600">﹡</span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-4 rounded-xl shadow-2xl border z-50 animate-fade-in ${
            settings.palette === 'midnight'
              ? 'bg-[#1F232D] border-white/20 text-[#F1F3F9]'
              : settings.palette === 'sepia'
              ? 'bg-[#FDF9EE] border-[#3B3228]/30 text-[#3B3228]'
              : 'bg-white border-neutral-200 text-[#18181B]'
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-inherit/20">
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{item.term}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full opacity-60 hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Definition */}
          <p className="text-xs leading-relaxed opacity-90 mb-3 font-interface">
            {item.fullExplanation || item.shortDefinition}
          </p>

          {/* Micro metric comparison chart if present */}
          {item.metricComparison && (
            <div className="mb-3 p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-inherit/15 text-[11px] font-mono-tabular">
              <div className="flex items-center gap-1 text-[10px] uppercase opacity-60 mb-1.5 font-bold">
                <BarChart2 className="w-3 h-3 text-rose-600" />
                <span>Empirical Differential:</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="opacity-70">{item.metricComparison.labelA}:</span>
                <span className="font-bold text-rose-600">{item.metricComparison.valA}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-70">{item.metricComparison.labelB}:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {item.metricComparison.valB}
                </span>
              </div>
            </div>
          )}

          {/* Citation Source */}
          {item.citationSource && (
            <div className="text-[10px] font-mono-tabular opacity-60 italic border-t border-inherit/15 pt-2">
              Source: {item.citationSource}
            </div>
          )}

          {/* Jump to related article link */}
          {item.relatedArticleId && onNavigateArticle && (
            <div className="mt-2.5 pt-2 border-t border-inherit/15 flex justify-end">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateArticle(item.relatedArticleId!);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                <span>Read Full Essay</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </span>
  );
};
