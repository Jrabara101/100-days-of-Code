import React from 'react';
import { Article } from '../types';
import { Clock, Play, Bookmark, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useReader } from '../context/ReaderContext';
import { getCategoryById } from '../services/editorialEngine';

interface ArticleCardProps {
  article: Article;
  onOpenArticle: (articleId: string) => void;
  layoutVariant?: 'standard' | 'compact' | 'hero';
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onOpenArticle,
  layoutVariant = 'standard',
}) => {
  const { settings, addArticleToQueue, queue } = useReader();
  const category = getCategoryById(article.categoryId);
  const isQueued = queue.some((q) => q.articleId === article.id);

  const getFormatBadge = () => {
    switch (article.format) {
      case 'video-essay':
        return { label: 'Video Essay', icon: Play, color: 'text-purple-600 bg-purple-600/10' };
      case 'deep-dive':
        return { label: 'Deep Dive', icon: Clock, color: 'text-blue-600 bg-blue-600/10' };
      case 'playbook':
        return { label: 'Actionable Playbook', icon: Sparkles, color: 'text-emerald-600 bg-emerald-600/10' };
      default:
        return { label: 'Essay', icon: Clock, color: 'text-amber-600 bg-amber-600/10' };
    }
  };

  const formatBadge = getFormatBadge();
  const FormatIcon = formatBadge.icon;

  if (layoutVariant === 'compact') {
    return (
      <div
        className={`p-4 rounded-xl border border-inherit transition-all hover:border-rose-500/30 flex items-center justify-between gap-4 group cursor-pointer ${
          settings.palette === 'midnight'
            ? 'bg-[#181B22] hover:bg-[#1F232D]'
            : settings.palette === 'sepia'
            ? 'bg-[#EDE2CB] hover:bg-[#E5DAC0]'
            : 'bg-white hover:bg-neutral-50'
        }`}
        onClick={() => onOpenArticle(article.id)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 text-[10px] font-mono-tabular opacity-70">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: category?.accentColor }}
            ></span>
            <span className="uppercase font-semibold">{category?.name}</span>
            <span>•</span>
            <span>{article.readTimeMinutes} MIN</span>
          </div>
          <h4 className="font-serif font-bold text-sm leading-snug group-hover:text-rose-600 transition-colors line-clamp-2">
            {article.title}
          </h4>
        </div>
        {article.coverImage && (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-16 h-16 rounded-lg object-cover shrink-0 grayscale group-hover:grayscale-0 transition-all"
          />
        )}
      </div>
    );
  }

  return (
    <article
      className={`rounded-2xl border border-inherit overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group ${
        settings.palette === 'midnight'
          ? 'bg-[#181B22] border-white/10 hover:border-purple-500/40'
          : settings.palette === 'sepia'
          ? 'bg-[#EFE5CD] border-[#3B3228]/15 hover:border-amber-700/40'
          : 'bg-white border-black/10 hover:border-rose-500/30'
      }`}
    >
      <div>
        {/* Cover Image Container */}
        <div
          className="relative aspect-16/9 overflow-hidden bg-neutral-200 dark:bg-neutral-800 cursor-pointer"
          onClick={() => onOpenArticle(article.id)}
        >
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Format badge overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-tabular font-bold bg-black/75 text-white backdrop-blur-md">
            <FormatIcon className="w-3 h-3 text-rose-400" />
            <span>{formatBadge.label}</span>
          </div>

          {/* Video Play button overlay if video essay */}
          {article.hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
          )}

          {/* Reading time badge */}
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-mono-tabular">
            {article.hasVideo
              ? article.videoMetadata?.durationFormatted
              : `${article.readTimeMinutes} MIN`}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6">
          {/* Category & Freshness Header */}
          <div className="flex items-center justify-between text-xs font-mono-tabular mb-2.5">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: category?.accentColor }}
              ></span>
              <span className="font-bold tracking-wider uppercase text-inherit opacity-80">
                {category?.name}
              </span>
            </div>
            <span className="text-[10px] opacity-60">{article.freshnessLabel}</span>
          </div>

          {/* Headline */}
          <h3
            onClick={() => onOpenArticle(article.id)}
            className="font-serif font-bold text-lg sm:text-xl leading-tight mb-2.5 group-hover:text-rose-600 transition-colors cursor-pointer"
          >
            {article.title}
          </h3>

          {/* Standfirst / Summary Deck */}
          <p className="text-xs sm:text-sm opacity-70 line-clamp-3 leading-relaxed font-interface mb-4">
            {article.standfirst}
          </p>
        </div>
      </div>

      {/* Card Footer: Author & Queue Action */}
      <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-inherit/15 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={article.author.avatar}
            alt={article.author.name}
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <div className="font-semibold text-xs truncate">{article.author.name}</div>
            <div className="text-[10px] font-mono-tabular opacity-50 truncate">
              {article.author.handle}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Read later queue button */}
          <button
            onClick={() => addArticleToQueue(article)}
            title={isQueued ? 'In Read Later Queue' : 'Add to Read Later Queue'}
            className={`p-1.5 rounded-lg border border-inherit hover:border-rose-600 transition-colors cursor-pointer ${
              isQueued ? 'bg-rose-600/10 text-rose-600' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* Read Now link */}
          <button
            onClick={() => onOpenArticle(article.id)}
            className="flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 cursor-pointer text-xs"
          >
            <span>Read</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
