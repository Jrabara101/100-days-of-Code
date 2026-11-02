import React from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';

export function SentimentPillBar({
  activeTopicFilter,
  setActiveTopicFilter,
  sortBy,
  setSortBy,
  verifiedOnly,
  setVerifiedOnly,
  withMediaOnly,
  setWithMediaOnly,
  onTogglePeopleLikeMe,
  activePersonaFiltersCount = 0
}) {
  const { activeProduct } = useTrustStore();
  const pills = activeProduct.sentimentHighlights || [
    { text: "All reviews", count: activeProduct.totalReviews }
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Horizontal Sentiment Highlights Scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {pills.map((pill) => {
            const isAll = pill.text === "All reviews";
            const isSelected = activeTopicFilter === pill.text || (isAll && !activeTopicFilter);

            return (
              <button
                key={pill.text}
                onClick={() => setActiveTopicFilter(isAll ? null : pill.text)}
                className={`px-3.5 py-1.5 rounded-full font-sans text-body-sm whitespace-nowrap transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary font-semibold'
                    : pill.isAlert
                    ? 'bg-error-container text-on-error-container hover:bg-error-container/80 font-medium'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/30'
                }`}
              >
                <span>{pill.text}</span>
                <span className="font-mono text-xs opacity-80">({pill.count})</span>
              </button>
            );
          })}
        </div>

        {/* Right Tools: Sort, Verified Toggle, People Like Me */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* People Like Me Drawer Trigger */}
          <button
            onClick={onTogglePeopleLikeMe}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-all shadow-xs border ${
              activePersonaFiltersCount > 0
                ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border-outline-variant/40'
            }`}
            title="Filter reviews by matching body measurements, skin type, or setup"
          >
            <span className="material-symbols-outlined text-[17px] text-primary">person_search</span>
            <span>People Like Me</span>
            {activePersonaFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white font-mono text-[10px] flex items-center justify-center font-bold">
                {activePersonaFiltersCount}
              </span>
            )}
          </button>

          {/* With Media Filter Toggle */}
          <button
            onClick={() => setWithMediaOnly(!withMediaOnly)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-body-sm transition-colors border shadow-xs ${
              withMediaOnly
                ? 'bg-primary/10 text-primary border-primary font-medium'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border-outline-variant/40'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            <span className="hidden sm:inline">Photos</span>
          </button>

          {/* Verified Only Pill */}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-label-code-sm transition-all border shadow-xs cursor-pointer ${
              verifiedOnly
                ? 'bg-primary-fixed/80 text-on-primary-fixed-variant border-primary/40 font-semibold'
                : 'bg-surface-container-lowest text-outline hover:text-on-surface border-outline-variant/40'
            }`}
          >
            <span className={`material-symbols-outlined text-[15px] ${verifiedOnly ? 'text-primary' : 'text-outline'}`}>
              {verifiedOnly ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <span>Verified Only</span>
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-surface-container-lowest border border-outline-variant/40 rounded-lg pl-3 pr-8 py-1.5 text-body-sm text-on-surface font-medium focus:outline-none focus:border-primary shadow-xs cursor-pointer"
            >
              <option value="most_helpful">Sort: Most helpful</option>
              <option value="newest">Sort: Newest first</option>
              <option value="highest_rating">Sort: Highest rating</option>
              <option value="lowest_rating">Sort: Lowest rating</option>
            </select>
            <span className="material-symbols-outlined text-[16px] text-outline absolute right-2.5 top-2 pointer-events-none">
              arrow_drop_down
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

