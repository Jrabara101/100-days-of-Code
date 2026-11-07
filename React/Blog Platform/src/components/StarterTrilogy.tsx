import React from 'react';
import { Article, Category } from '../types';
import { Bookmark, Clock, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { useReader } from '../context/ReaderContext';

interface StarterTrilogyProps {
  category: Category;
  articles: Article[];
  onOpenArticle: (articleId: string) => void;
}

export const StarterTrilogy: React.FC<StarterTrilogyProps> = ({
  category,
  articles,
  onOpenArticle,
}) => {
  const { settings, addArticleToQueue, queue } = useReader();

  if (articles.length === 0) return null;

  const totalTrilogyMinutes = articles.reduce((sum, a) => sum + a.readTimeMinutes, 0);

  return (
    <div
      className={`rounded-2xl p-6 sm:p-8 mb-12 border relative overflow-hidden transition-all ${
        settings.palette === 'midnight'
          ? 'bg-[#181B22] border-white/10 text-white'
          : settings.palette === 'sepia'
          ? 'bg-[#E8DEC6]/70 border-[#3B3228]/20 text-[#3B3228]'
          : 'bg-[#F1EDE6] border-black/10 text-[#18181B]'
      }`}
    >
      {/* Header of Trilogy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-inherit/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: category.accentColor }}
            ></span>
            <span className="text-xs font-mono-tabular tracking-wider uppercase font-bold text-rose-600 dark:text-rose-400">
              Essential Starter Canon
            </span>
            <span className="text-xs opacity-50">•</span>
            <span className="text-xs font-mono-tabular opacity-70">
              {totalTrilogyMinutes} MINS CURATED RUNTIME
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
            The {category.name} Starter Trilogy
          </h3>
          <p className="text-xs opacity-75 max-w-xl mt-1 font-interface">
            New to this topic? Skip the noise and start with these three foundational master essays
            curated by our senior editorial board.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[11px] font-mono-tabular opacity-60">
            Ordered in Sequential Progression
          </span>
        </div>
      </div>

      {/* 3-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {articles.map((article, index) => {
          const isQueued = queue.some((q) => q.articleId === article.id);
          return (
            <div
              key={article.id}
              className={`rounded-xl p-5 border flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg ${
                settings.palette === 'midnight'
                  ? 'bg-[#1F232D] border-white/10 hover:border-purple-500/40'
                  : settings.palette === 'sepia'
                  ? 'bg-[#F4ECD8] border-[#3B3228]/15 hover:border-amber-700/40'
                  : 'bg-white border-black/10 hover:border-rose-500/40'
              }`}
            >
              <div>
                {/* Part number badge */}
                <div className="flex items-center justify-between mb-3 text-xs font-mono-tabular">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 font-bold tracking-wider">
                    PART 0{index + 1}
                  </span>
                  <span className="opacity-60 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {article.readTimeMinutes}m
                  </span>
                </div>

                {/* Title */}
                <h4
                  onClick={() => onOpenArticle(article.id)}
                  className="font-serif font-bold text-base leading-snug mb-2 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  {article.title}
                </h4>

                {/* Standfirst */}
                <p className="text-xs opacity-70 line-clamp-3 font-interface leading-relaxed mb-4">
                  {article.standfirst}
                </p>
              </div>

              {/* Bottom Card Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-inherit/20 text-xs">
                <button
                  onClick={() => addArticleToQueue(article)}
                  className={`flex items-center gap-1 font-mono-tabular text-[11px] hover:underline cursor-pointer ${
                    isQueued ? 'text-rose-600 font-bold' : 'opacity-60'
                  }`}
                >
                  <Bookmark className="w-3 h-3" />
                  <span>{isQueued ? 'Queued' : '+ Queue'}</span>
                </button>

                <button
                  onClick={() => onOpenArticle(article.id)}
                  className="flex items-center gap-1 font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  <span>Begin</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
