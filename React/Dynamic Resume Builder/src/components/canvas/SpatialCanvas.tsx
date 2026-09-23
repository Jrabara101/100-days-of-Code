import React, { useRef } from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { usePageBreakEngine } from '../../hooks/usePageBreakEngine';

export const SpatialCanvas: React.FC = () => {
  const {
    present,
    zoom,
    setZoom,
    canvasTool,
    setCanvasTool,
    activeSectionId,
    setActiveSectionId,
    viewMode,
  } = useResumeStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const pageBreakStatus = usePageBreakEngine(containerRef, present.sections, [
    present.styles,
    present.header,
  ]);

  const { styles, header, sections } = present;

  // Font family mapping
  const getFontFamilyClass = () => {
    switch (styles.fontFamily) {
      case 'Merriweather':
        return 'font-serif';
      case 'Roboto Mono':
        return 'font-mono';
      case 'Cinzel':
        return 'font-cinzel';
      case 'Inter':
      default:
        return 'font-inter';
    }
  };

  // Font size scale mapping
  const getBaseFontSizeClass = () => {
    switch (styles.fontSize) {
      case '10pt':
        return 'text-[12px]';
      case '12pt':
        return 'text-[14px]';
      case '11pt':
      default:
        return 'text-[13px]';
    }
  };

  // Content density mapping for padding & gaps
  const getDensityClasses = () => {
    switch (styles.density) {
      case 'compact':
        return { sectionGap: 'space-y-3 py-2', itemGap: 'space-y-1', bulletGap: 'space-y-0.5' };
      case 'relaxed':
        return { sectionGap: 'space-y-6 py-4', itemGap: 'space-y-3', bulletGap: 'space-y-1.5' };
      case 'normal':
      default:
        return { sectionGap: 'space-y-4 py-3', itemGap: 'space-y-2', bulletGap: 'space-y-1' };
    }
  };

  const density = getDensityClasses();
  const isPreview = viewMode === 'preview';

  return (
    <main
      className="flex-1 bg-surface-container-lowest overflow-auto relative flex justify-center py-10 px-8 select-none"
      onClick={() => setActiveSectionId(null)}
    >
      {/* Subtle Canvas Dot Grid Pattern SVG Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#908fa0_1px,transparent_1px)] [background-size:24px_24px] no-print"></div>

      {/* Canvas Floating Tool HUD Pill */}
      <nav
        aria-label="Canvas HUD Controls"
        className="fixed top-16 left-1/2 -translate-x-1/2 z-30 bg-surface-container-high/90 backdrop-blur-xl px-space-md py-1.5 rounded-full shadow-2xl flex items-center gap-space-md border border-outline-variant/20 no-print"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCanvasTool('pan')}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              canvasTool === 'pan'
                ? 'bg-surface-container-highest text-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
            }`}
            title="Pan Mode (H)"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">pan_tool</span>
          </button>
          <button
            onClick={() => setCanvasTool('select')}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              canvasTool === 'select'
                ? 'bg-surface-container-highest text-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
            }`}
            title="Select Tool (V)"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">near_me</span>
          </button>
        </div>

        <div className="h-4 w-px bg-surface-variant"></div>

        {/* Zoom HUD */}
        <div className="flex items-center gap-space-xs">
          <span className="font-code-metric text-code-metric text-on-surface px-1">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(0.85)}
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface px-1.5 py-0.5 rounded bg-surface-container-low transition-colors"
            type="button"
          >
            Fit
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface px-1.5 py-0.5 rounded bg-surface-container-low transition-colors"
            type="button"
          >
            Actual
          </button>
        </div>

        <div className="h-4 w-px bg-surface-variant"></div>

        {/* Interactive Beacon Sync */}
        <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm">
          <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
          <span>Live Rendering</span>
        </div>
      </nav>

      {/* Canvas Paper Workspace Container with Zoom Scaling */}
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
        }}
        className="transition-transform duration-150 flex flex-col items-center my-auto"
      >
        {/* Physical A4 Canvas Sheet Wrapper (794px x 1123px true A4 proportions) */}
        <div
          ref={containerRef}
          style={{
            lineHeight: styles.lineHeight,
          }}
          className={`w-[794px] bg-white text-slate-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] rounded-sm relative flex flex-col transition-all print-page-sheet ${getFontFamilyClass()} ${getBaseFontSizeClass()}`}
        >
          {/* ========================================================================= */}
          {/* PAGE 1 CONTENT AREA (Inside A4 Boundaries)                                 */}
          {/* ========================================================================= */}
          <div className="p-12 flex flex-col flex-1 relative min-h-[1123px]">
            {/* RESUME HEADER */}
            <header data-resume-header className="pb-5 relative group" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start">
                <div>
                  <h1
                    style={{ color: styles.primaryColor }}
                    className="text-3xl font-extrabold tracking-tight font-display uppercase"
                  >
                    {header.fullName}
                  </h1>
                  <p
                    style={{ color: styles.primaryColor }}
                    className="text-sm font-semibold tracking-wide uppercase mt-1 opacity-90"
                  >
                    {header.roleTitle} {header.secondaryTitle && `& ${header.secondaryTitle}`}
                  </p>
                </div>
                <div className="flex flex-col items-end text-xs text-slate-500 font-code-metric space-y-0.5">
                  <span>{header.location}</span>
                  <span>{header.email}</span>
                  <span>{header.github}</span>
                  <span>{header.phone}</span>
                </div>
              </div>
              <div
                style={{ backgroundColor: styles.primaryColor }}
                className="w-full h-0.5 mt-3 mb-2 opacity-80"
              ></div>
            </header>

            {/* SECTIONS LIST */}
            {sections
              .filter((sec) => sec.isVisible)
              .map((section) => {
                const isSelected = activeSectionId === section.id && !isPreview;

                return (
                  <div
                    key={section.id}
                    data-section-node={section.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSectionId(section.id);
                    }}
                    className={`relative cursor-pointer transition-all ${density.sectionGap}`}
                  >
                    {/* Active Selection Rigging Box Overlay */}
                    {isSelected && (
                      <div className="absolute -inset-2 rounded ring-2 ring-indigo-500/80 bg-indigo-50/20 pointer-events-none transition-all z-10 print-selection-rigging">
                        <span className="absolute -top-3 left-2 bg-indigo-600 text-white font-code-metric text-[10px] px-1.5 py-0.5 rounded tracking-wider uppercase shadow">
                          Selected Node: {section.title}
                        </span>
                      </div>
                    )}

                    {/* SECTION: Executive Summary */}
                    {section.type === 'summary' && (
                      <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-1 border-b border-slate-200 pb-0.5">
                          {section.title}
                        </h2>
                        <p className="text-slate-700 leading-relaxed text-xs">
                          {section.content.text}
                        </p>
                      </div>
                    )}

                    {/* SECTION: Work Experience */}
                    {section.type === 'experience' && (
                      <div className="space-y-4">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1">
                          {section.title}
                        </h2>

                        {section.content.items?.map((item, idx) => (
                          <div key={item.id} className={density.itemGap}>
                            <div className="flex justify-between items-baseline">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900">{item.role}</span>
                                <span className="text-xs text-slate-400">•</span>
                                <span
                                  style={{ color: styles.primaryColor }}
                                  className="text-xs font-semibold"
                                >
                                  {item.company}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 font-code-metric">
                                {item.startDate} — {item.endDate} | {item.location}
                              </span>
                            </div>

                            <ul className={`list-disc list-outside ml-4 text-xs text-slate-700 leading-relaxed ${density.bulletGap}`}>
                              {item.bullets.map((bullet, bIdx) => (
                                <li key={bIdx}>{bullet}</li>
                              ))}
                            </ul>

                            {/* Drop insertion target line (between first and second entry if not preview) */}
                            {idx === 0 && !isPreview && (
                              <div className="relative py-1 flex items-center justify-center group cursor-pointer print-selection-rigging">
                                <div className="w-full h-0.5 bg-indigo-500/80"></div>
                                <span className="absolute bg-indigo-600 text-white font-code-metric text-[9px] px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                                  Drop Insertion Target
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SECTION: Capabilities & Skills */}
                    {section.type === 'capabilities' && (
                      <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
                          {section.title}
                        </h2>
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-700">
                          {section.content.capabilities?.map((cat) => (
                            <div key={cat.id}>
                              <strong className="font-semibold text-slate-900">{cat.category}: </strong>
                              {cat.skills.map((s) => s.name).join(', ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SECTION: Education */}
                    {section.type === 'education' && (
                      <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
                          {section.title}
                        </h2>
                        {section.content.education?.map((edu) => (
                          <div key={edu.id} className="flex justify-between items-baseline text-xs">
                            <div>
                              <span className="font-bold text-slate-900">{edu.degree}</span>
                              <span className="text-slate-500"> — {edu.institution}</span>
                            </div>
                            <span className="text-slate-500 font-code-metric">{edu.graduationYear}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* ========================================================================= */}
          {/* PHYSICAL A4 PAGE BREAK VISUALIZER (Collision Threshold at 1123px)         */}
          {/* ========================================================================= */}
          <div className="relative w-full print-break-indicator">
            <div
              className={`w-full border-t-2 border-dashed relative z-10 flex items-center justify-between transition-colors ${
                pageBreakStatus.isContentSafe ? 'border-secondary' : 'border-error'
              }`}
            >
              <span
                className={`text-[10px] px-2 py-0.5 tracking-wider uppercase font-code-metric font-semibold shadow rounded-br ${
                  pageBreakStatus.isContentSafe
                    ? 'bg-surface-container-high text-on-surface'
                    : 'bg-error text-on-error'
                }`}
              >
                A4 Page 1 End • 1123px Limit
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 tracking-wider uppercase font-code-metric font-semibold rounded-bl ${
                  pageBreakStatus.isContentSafe
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-error text-on-error'
                }`}
              >
                {pageBreakStatus.isContentSafe
                  ? 'Content Safe • 0 Overflow'
                  : `Overflow Alert: +${pageBreakStatus.overflowPx}px over A4`}
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PAGE 2 CONTINUATION PREVIEW (Patents, Publications & Spillover)           */}
          {/* ========================================================================= */}
          <div className="p-12 flex flex-col flex-1 bg-slate-50/60 print-page-sheet min-h-[600px]">
            {sections
              .filter((s) => s.type === 'patents' && s.isVisible)
              .map((patSec) => (
                <section key={patSec.id} className="py-2 space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1">
                    {patSec.title}
                  </h2>
                  {patSec.content.patents?.map((pat) => (
                    <div key={pat.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-900">{pat.title}</span>
                        <span className="text-slate-500 font-code-metric">{pat.dateOrStars}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{pat.description}</p>
                    </div>
                  ))}
                </section>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
};
