import React from 'react';
import { useReader } from '../context/ReaderContext';
import { BookOpen, ArrowRight, X, Clock } from 'lucide-react';

interface ResumeToastProps {
  onResume: (articleId: string, paragraphId?: string) => void;
}

export const ResumeToast: React.FC<ResumeToastProps> = ({ onResume }) => {
  const { activeResumeBookmark, dismissResumeBookmark, settings } = useReader();

  if (!activeResumeBookmark) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 max-w-sm w-full animate-slide-up">
      <div
        className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 transition-all ${
          settings.palette === 'midnight'
            ? 'bg-[#181B22] border-white/20 text-white'
            : settings.palette === 'sepia'
            ? 'bg-[#EFE5CD] border-[#3B3228]/30 text-[#3B3228]'
            : 'bg-[#FAF8F5] border-black/15 text-[#18181B]'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-rose-600/15 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
          <BookOpen className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-mono-tabular uppercase opacity-60 mb-0.5">
            <Clock className="w-3 h-3 text-rose-600" />
            <span>Resume Reading Session</span>
          </div>

          <h5 className="font-serif font-bold text-xs truncate">
            {activeResumeBookmark.articleTitle}
          </h5>

          <p className="text-[11px] font-mono-tabular opacity-75 mt-0.5">
            {activeResumeBookmark.progressPercent}% read • ~
            {activeResumeBookmark.remainingMinutes}m left
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() =>
                onResume(
                  activeResumeBookmark.articleId,
                  activeResumeBookmark.lastParagraphId
                )
              }
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <span>Resume Reading</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={dismissResumeBookmark}
              className="text-xs opacity-60 hover:opacity-100 hover:underline px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>

        <button
          onClick={dismissResumeBookmark}
          className="p-1 rounded-full opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
