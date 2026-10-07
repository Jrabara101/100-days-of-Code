import React, { useState } from 'react';
import { CaseStudy } from '../types';
import { CaseStudyCard } from './CaseStudyCard';
import { CaseStudyModal } from './CaseStudyModal';
import { Filter, Layers } from 'lucide-react';

interface SelectedWorkProps {
  caseStudies: CaseStudy[];
}

export const SelectedWork: React.FC<SelectedWorkProps> = ({ caseStudies }) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [activeStudy, setActiveStudy] = useState<CaseStudy | null>(null);

  // Extract all unique tags
  const allTags = ['All', ...Array.from(new Set(caseStudies.flatMap(s => s.tags)))];

  const filteredStudies = selectedTag === 'All'
    ? caseStudies
    : caseStudies.filter(s => s.tags.includes(selectedTag));

  return (
    <section id="work" className="py-20 border-b border-border-subtle-light dark:border-border-subtle-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-accent-indigo uppercase tracking-wider mb-2 font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Section 01 / Proof of Work</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal text-primary-light dark:text-primary-dark">
              Selected Systems & Engineering Case Studies
            </h2>
          </div>

          {/* Filterable Skill Taxonomy */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-secondary-light dark:bg-surface-secondary-dark border border-border-subtle-light dark:border-border-subtle-dark self-start md:self-end">
            <span className="px-2 text-xs font-mono text-muted-light dark:text-muted-dark hidden sm:inline flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  selectedTag === tag
                    ? 'bg-primary-light dark:bg-primary-dark text-white dark:text-zinc-900 font-semibold shadow-sm'
                    : 'text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredStudies.map((study) => (
            <CaseStudyCard
              key={study.id}
              study={study}
              onSelect={setActiveStudy}
              featured={study.featured}
            />
          ))}
        </div>
      </div>

      {/* Case Study Deep Dive Modal */}
      <CaseStudyModal
        study={activeStudy}
        onClose={() => setActiveStudy(null)}
      />
    </section>
  );
};
