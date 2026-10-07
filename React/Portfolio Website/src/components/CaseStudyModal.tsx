import React from 'react';
import { X, ExternalLink, Github, CheckCircle2, TrendingUp, Layers, Cpu, Award } from 'lucide-react';
import { CaseStudy } from '../types';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface CaseStudyModalProps {
  study: CaseStudy | null;
  onClose: () => void;
}

export const CaseStudyModal: React.FC<CaseStudyModalProps> = ({ study, onClose }) => {
  if (!study) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-surface-elevated-light dark:bg-surface-elevated-dark border border-border-subtle-light dark:border-border-subtle-dark rounded-2xl shadow-2xl overflow-hidden my-auto z-10 animate-slide-up">
        {/* Top Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light/80 dark:bg-surface-elevated-dark/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono tracking-tight bg-accent-indigo/10 text-accent-indigo border border-accent-indigo/20">
              Proof of Work
            </span>
            <span className="text-xs font-mono text-muted-light dark:text-muted-dark">
              {study.client} • {study.year}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-8 max-h-[80vh] overflow-y-auto">
          {/* Headline & Role */}
          <div>
            <h2 className="text-2xl sm:text-4xl font-serif font-medium text-primary-light dark:text-primary-dark mb-3">
              {study.title}
            </h2>
            <p className="text-base text-muted-light dark:text-muted-dark leading-relaxed font-sans mb-4">
              {study.tagline}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-light dark:text-muted-dark">
              <span className="flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-accent-emerald" />
                <span>Role: {study.role}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-accent-indigo" />
                <span>Stack: {study.tags.join(', ')}</span>
              </span>
            </div>
          </div>

          {/* KPI Highlight Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface-secondary-light dark:bg-surface-secondary-dark border border-border-subtle-light dark:border-border-subtle-dark">
            {study.kpis.map((kpi, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted-light dark:text-muted-dark">
                  {kpi.label}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-semibold text-accent-emerald mt-0.5">
                  {kpi.value}
                </span>
                {kpi.hint && (
                  <span className="text-[11px] text-muted-light dark:text-muted-dark mt-0.5">
                    {kpi.hint}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Interactive Before & After Slider (If Available) */}
          {study.beforeAfter && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider font-mono text-muted-light dark:text-muted-dark font-semibold">
                  Interactive Architectural Comparison
                </h4>
                <span className="text-[11px] font-mono text-accent-indigo">
                  Drag slider to compare ↔
                </span>
              </div>
              <BeforeAfterSlider
                beforeImage={study.beforeAfter.before}
                afterImage={study.beforeAfter.after}
                beforeLabel={study.beforeAfter.beforeLabel}
                afterLabel={study.beforeAfter.afterLabel}
              />
            </div>
          )}

          {/* Challenge & Solution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40">
              <h4 className="font-mono text-xs uppercase tracking-wider text-red-500 font-semibold mb-2">
                The Bottleneck & Challenge
              </h4>
              <p className="text-sm text-primary-light dark:text-primary-dark leading-relaxed font-sans">
                {study.challenge}
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40">
              <h4 className="font-mono text-xs uppercase tracking-wider text-accent-emerald font-semibold mb-2">
                Engineered Solution
              </h4>
              <p className="text-sm text-primary-light dark:text-primary-dark leading-relaxed font-sans">
                {study.solution}
              </p>
            </div>
          </div>

          {/* Architecture Breakdown */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-light dark:text-muted-dark font-semibold mb-3 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-accent-indigo" />
              <span>Architectural Topology & Technical Mechanics</span>
            </h4>
            <div className="space-y-2.5">
              {study.architecture.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/30 dark:bg-surface-secondary-dark/30 text-xs sm:text-sm font-mono"
                >
                  <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0 mt-0.5" />
                  <span className="text-primary-light dark:text-primary-dark leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Measurable Impact */}
          <div className="p-5 rounded-xl border border-accent-indigo/30 bg-accent-indigo/5">
            <h4 className="font-mono text-xs uppercase tracking-wider text-accent-indigo font-semibold mb-1 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Business & Product Impact</span>
            </h4>
            <p className="text-sm text-primary-light dark:text-primary-dark font-sans leading-relaxed">
              {study.impact}
            </p>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border-subtle-light dark:border-border-subtle-dark">
            {study.demoUrl && (
              <a
                href={study.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-primary-light dark:bg-primary-dark text-white dark:text-zinc-900 font-mono text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <span>Launch Interactive Prototype</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {study.githubUrl && (
              <a
                href={study.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light dark:bg-surface-secondary-dark hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark text-primary-light dark:text-primary-dark font-mono text-xs transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Source Repository</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="ml-auto px-4 py-2 rounded-lg text-xs font-mono text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            >
              Back to Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
