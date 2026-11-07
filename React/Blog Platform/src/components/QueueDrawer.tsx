import React from 'react';
import { useReader } from '../context/ReaderContext';
import { X, Bookmark, Trash2, Clock, ArrowRight, Train, CheckCircle2 } from 'lucide-react';
import { calculateQueueBudget } from '../services/editorialEngine';

interface QueueDrawerProps {
  onOpenArticle: (articleId: string) => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ onOpenArticle }) => {
  const { queue, removeArticleFromQueue, isQueueOpen, setIsQueueOpen, settings } = useReader();

  if (!isQueueOpen) return null;

  const budget = calculateQueueBudget(queue);

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
        {/* Header */}
        <div className="p-5 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-700 dark:text-rose-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg">Read Later Queue</h2>
              <p className="text-xs opacity-60 font-mono-tabular">
                Time-Budgeted Reading Tray
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsQueueOpen(false)}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* Time Budget Summary Banner */}
        {queue.length > 0 && (
          <div className="px-5 py-4 border-b border-inherit bg-rose-600/5 dark:bg-rose-500/10">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-bold font-mono-tabular">
                  {budget.articleCount} Saved • {budget.totalMinutes} Mins Total
                </span>
              </div>
              <span className="text-[10px] font-mono-tabular uppercase px-2 py-0.5 rounded-full bg-rose-600/10 text-rose-700 dark:text-rose-300 font-bold">
                Time Budget
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs opacity-80 mt-1">
              <Train className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>{budget.commuteRecommendation}</span>
            </div>
          </div>
        )}

        {/* Queue Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {queue.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 mx-auto flex items-center justify-center mb-3">
                <Bookmark className="w-6 h-6 opacity-40" />
              </div>
              <h3 className="font-serif font-bold text-base mb-1">Queue is empty</h3>
              <p className="text-xs opacity-60 leading-relaxed max-w-xs mx-auto">
                Bookmark essays from the discovery feed to compile a custom reading itinerary tailored to your commute or evening bandwidth.
              </p>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.articleId}
                className={`p-4 rounded-xl border border-inherit transition-all hover:border-rose-500/40 relative group ${
                  settings.palette === 'midnight'
                    ? 'bg-[#1F232D]'
                    : settings.palette === 'sepia'
                    ? 'bg-[#EDE2CB]'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono-tabular tracking-wider uppercase font-semibold text-rose-600 dark:text-rose-400">
                    {item.categoryName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono-tabular opacity-60">
                      {item.readTimeMinutes} min read
                    </span>
                    <button
                      onClick={() => removeArticleFromQueue(item.articleId)}
                      title="Remove from queue"
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-opacity p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-serif font-bold text-sm leading-snug mb-3">
                  {item.title}
                </h4>

                <div className="flex items-center justify-between pt-2 border-t border-inherit/40 text-xs">
                  <span className="text-[10px] font-mono-tabular opacity-50">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => {
                      onOpenArticle(item.articleId);
                      setIsQueueOpen(false);
                    }}
                    className="flex items-center gap-1 font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    <span>Read Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-inherit text-[11px] font-mono-tabular opacity-60 text-center">
          Articles auto-archive once scroll reaches 95%
        </div>
      </div>
    </div>
  );
};
