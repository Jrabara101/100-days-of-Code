import React from 'react';
import { ArrowUpRight, TrendingUp, Cpu } from 'lucide-react';
import { CaseStudy } from '../types';

interface CaseStudyCardProps {
  study: CaseStudy;
  onSelect: (study: CaseStudy) => void;
  featured?: boolean;
}

export const CaseStudyCard: React.FC<CaseStudyCardProps> = ({ study, onSelect, featured = false }) => {
  const primaryKpi = study.kpis[0];

  return (
    <div
      onClick={() => onSelect(study)}
      className={`group cursor-pointer rounded-2xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/60 dark:bg-surface-secondary-dark/60 hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between ${
        featured ? 'md:col-span-2' : ''
      }`}
    >
      <div>
        {/* Media Preview Container */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl mb-5 bg-zinc-200 dark:bg-zinc-800">
          <img
            src={study.heroImage}
            alt={study.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Upfront Headline KPI Pill */}
          {primaryKpi && (
            <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/10 text-xs font-mono font-medium shadow-md">
              <TrendingUp className="w-3.5 h-3.5 text-accent-emerald" />
              <span>{primaryKpi.value}</span>
              <span className="text-zinc-300 text-[10px] hidden sm:inline">• {primaryKpi.label}</span>
            </div>
          )}

          {/* Client & Year Badge */}
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-zinc-200 text-[11px] font-mono">
            {study.client} • {study.year}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {study.tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded text-[11px] font-mono tracking-tight bg-surface-elevated-light dark:bg-surface-elevated-dark border border-border-subtle-light dark:border-border-subtle-dark text-muted-light dark:text-muted-dark"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-xl sm:text-2xl font-serif font-medium text-primary-light dark:text-primary-dark group-hover:text-accent-indigo transition-colors">
            {study.title}
          </h3>
          <span className="p-1 rounded-full text-muted-light dark:text-muted-dark group-hover:text-primary-light dark:group-hover:text-primary-dark group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
            <ArrowUpRight className="w-5 h-5" />
          </span>
        </div>

        {/* Tagline */}
        <p className="text-sm text-muted-light dark:text-muted-dark leading-relaxed line-clamp-2 mb-4 font-sans">
          {study.tagline}
        </p>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border-subtle-light dark:border-border-subtle-dark font-mono text-xs">
        {study.kpis.map((kpi, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-light dark:text-muted-dark truncate">
              {kpi.label}
            </span>
            <span className="font-semibold text-primary-light dark:text-primary-dark text-sm sm:text-base">
              {kpi.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
